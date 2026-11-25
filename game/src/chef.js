// chef.js — the cook: movement around the floor, what the hands are
// holding (one raw item, or one plate and everything on it), and the
// interact key's context action at each kind of station. All the rules of
// "what happens when you press E here" live in interact().

import { BALANCE, COMPONENTS, FLOOR, PREP } from './config.js';

const PLATE_CAPACITY = 6;

export class Chef {
  constructor() {
    this.x = 640;
    this.y = 430;
    this.facing = 1; // 1 right, -1 left (for the renderer's flip)
    this.moving = false;
    this.bob = 0;
    this.carry = null; // { type:'item', id } | { type:'plate', items:[ids] }
    this.storedPlates = []; // plates parked on the plating counter
    this.nudge = 0; // seconds of "denied" shake left, set by interact()
    this.chopT = 0; // seconds of chopping lean left, set by a chop stroke
  }

  reset() {
    this.x = 640;
    this.y = 430;
    this.carry = null;
    this.storedPlates = [];
  }

  update(dt, input) {
    const axis = input.axis();
    this.moving = axis.x !== 0 || axis.y !== 0;
    if (this.moving) {
      const len = Math.hypot(axis.x, axis.y) || 1;
      this.x += (axis.x / len) * BALANCE.chefSpeed * dt;
      this.y += (axis.y / len) * BALANCE.chefSpeed * dt;
      if (axis.x !== 0) this.facing = Math.sign(axis.x);
      this.bob += dt * 11;
    }
    this.x = Math.max(FLOOR.x + 20, Math.min(FLOOR.x + FLOOR.w - 20, this.x));
    this.y = Math.max(FLOOR.y + 24, Math.min(FLOOR.y + FLOOR.h - 10, this.y));
    if (this.nudge > 0) this.nudge -= dt;
    if (this.chopT > 0) this.chopT -= dt;
  }

  deny(sfx) {
    sfx.error();
    this.nudge = 0.25;
  }

  addToPlate(component, sfx) {
    if (!this.carry || this.carry.type !== 'plate') return false;
    if (this.carry.items.length >= PLATE_CAPACITY) return false;
    this.carry.items.push(component);
    sfx.place();
    return true;
  }

  // The interact key at `station`. `ctx` carries the kitchen state and the
  // game's serve hook: { cooking, sfx, serve } where serve(plate) returns
  // true when a ticket took the plate.
  interact(station, ctx) {
    const { cooking, sfx } = ctx;
    if (!station) return;
    switch (station.kind) {
      case 'crate': {
        const raw = station.gives;
        if (!this.carry) {
          this.carry = { type: 'item', id: raw };
          sfx.pickup();
        } else if (this.carry.type === 'plate' && PREP[raw].via === 'ready') {
          if (!this.addToPlate(raw, sfx)) this.deny(sfx);
        } else {
          this.deny(sfx);
        }
        break;
      }
      case 'board': {
        const board = cooking.boardState(station.id);
        if (!board) {
          if (this.carry && this.carry.type === 'item' && cooking.placeOnBoard(station.id, this.carry.id)) {
            this.carry = null;
            sfx.place();
          } else {
            this.deny(sfx);
          }
        } else if (!cooking.boardDone(station.id)) {
          if (this.carry && this.carry.type === 'item') {
            this.deny(sfx);
          } else {
            this.chopT = 0.3; // lean into the board for the stroke
            if (cooking.chop(station.id) === 'done' && !this.carry) {
              // The finishing stroke: the prepped piece goes straight to hand.
              this.carry = { type: 'item', id: cooking.takeFromBoard(station.id) };
              sfx.pickup();
            }
          }
        } else if (!this.carry) {
          this.carry = { type: 'item', id: cooking.takeFromBoard(station.id) };
          sfx.pickup();
        } else if (this.carry.type === 'plate') {
          if (this.carry.items.length >= PLATE_CAPACITY) {
            this.deny(sfx); // full plate: the piece stays on the board
          } else {
            this.addToPlate(cooking.takeFromBoard(station.id), sfx);
          }
        } else {
          this.deny(sfx);
        }
        break;
      }
      case 'grill':
      case 'fryer': {
        const doneAt = cooking.slotInPhase(station, 'done');
        const burntAt = cooking.slotInPhase(station, 'burnt');
        if (doneAt !== -1) {
          if (!this.carry) {
            this.carry = { type: 'item', id: cooking.takeFromSlot(station, doneAt) };
            sfx.pickup();
          } else if (this.carry.type === 'plate') {
            if (this.carry.items.length >= PLATE_CAPACITY) {
              this.deny(sfx); // full plate: the food stays in its slot
            } else {
              this.addToPlate(cooking.takeFromSlot(station, doneAt), sfx);
            }
          } else {
            this.deny(sfx);
          }
        } else if (burntAt !== -1) {
          if (this.carry && this.carry.type === 'item') {
            this.deny(sfx);
          } else {
            cooking.clearSlot(station, burntAt);
            sfx.place();
          }
        } else if (this.carry && this.carry.type === 'item'
            && cooking.placeInSlot(station, this.carry.id)) {
          this.carry = null;
        } else {
          this.deny(sfx);
        }
        break;
      }
      case 'plates': {
        if (!this.carry) {
          this.carry = this.storedPlates.pop() || { type: 'plate', items: [] };
          sfx.pickup();
        } else if (this.carry.type === 'plate' && this.storedPlates.length < 2) {
          this.storedPlates.push(this.carry);
          this.carry = null;
          sfx.place();
        } else if (this.carry.type === 'item' && this.carry.id in COMPONENTS) {
          // A finished piece in hand starts (or continues) a plate here:
          // take the parked plate if there is one, else a fresh one.
          const plate = this.storedPlates.pop() || { type: 'plate', items: [] };
          plate.items.push(this.carry.id);
          this.carry = plate;
          sfx.place();
        } else {
          this.deny(sfx);
        }
        break;
      }
      case 'pass': {
        if (this.carry && this.carry.type === 'plate' && this.carry.items.length > 0) {
          if (ctx.serve(this.carry)) {
            this.carry = null;
          } else {
            this.deny(sfx);
          }
        } else {
          this.deny(sfx);
        }
        break;
      }
      case 'trash': {
        if (this.carry) {
          this.carry = null;
          sfx.place();
        } else {
          this.deny(sfx);
        }
        break;
      }
      default:
        break;
    }
  }
}
