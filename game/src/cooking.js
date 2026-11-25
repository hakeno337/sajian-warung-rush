// cooking.js — what the kitchen's stations are doing: a board holding an
// ingredient that is part-chopped, grill and fryer slots with something
// cooking, done, or burning. Pure state and timers; the chef (chef.js)
// moves items in and out, and the renderer only reads.

import { PREP } from './config.js';

export class Cooking {
  constructor(sfx) {
    this.sfx = sfx;
    // board id -> { item, progress, needed } while chopping, else null.
    this.boards = new Map();
    // grill/fryer station id -> array of slots { item, phase, t, cook, burn }
    // phase: 'cooking' (t counts to cook), 'done' (t counts to burn), 'burnt'.
    this.slots = new Map();
    this.justFinished = []; // slot events the renderer turns into steam/dings
  }

  // --- chopping boards -------------------------------------------------
  boardState(id) {
    return this.boards.get(id) || null;
  }

  placeOnBoard(id, rawItem) {
    const prep = PREP[rawItem];
    if (!prep || prep.via !== 'chop' || this.boards.has(id)) return false;
    this.boards.set(id, { item: rawItem, progress: 0, needed: prep.chops });
    return true;
  }

  // One knife stroke. Returns 'working', 'done' (item ready to take), or
  // null when the board is empty.
  chop(id) {
    const board = this.boards.get(id);
    if (!board) return null;
    board.progress += 1;
    this.sfx.chop();
    return board.progress >= board.needed ? 'done' : 'working';
  }

  boardDone(id) {
    const board = this.boards.get(id);
    return !!board && board.progress >= board.needed;
  }

  // Take the (finished or not) item off a board; returns its component id
  // when chopping finished, the raw id if taken early is not allowed —
  // boards only release finished work.
  takeFromBoard(id) {
    if (!this.boardDone(id)) return null;
    const board = this.boards.get(id);
    this.boards.delete(id);
    return PREP[board.item].makes;
  }

  // --- grill and fryer slots -------------------------------------------
  slotList(station) {
    if (!this.slots.has(station.id)) {
      this.slots.set(station.id, Array.from({ length: station.slots || 1 }, () => null));
    }
    return this.slots.get(station.id);
  }

  placeInSlot(station, rawItem) {
    const prep = PREP[rawItem];
    if (!prep || prep.via !== station.kind) return false;
    const slots = this.slotList(station);
    const free = slots.indexOf(null);
    if (free === -1) return false;
    slots[free] = { item: rawItem, phase: 'cooking', t: 0, cook: prep.cook, burn: prep.burn };
    this.sfx.sizzle();
    return true;
  }

  // The first slot in a phase ('done' or 'burnt') the chef can act on.
  slotInPhase(station, phase) {
    return this.slotList(station).findIndex((s) => s && s.phase === phase);
  }

  takeFromSlot(station, index) {
    const slots = this.slotList(station);
    const slot = slots[index];
    if (!slot) return null;
    slots[index] = null;
    if (slot.phase === 'done') return PREP[slot.item].makes;
    if (slot.phase === 'burnt') return 'burnt';
    return null; // still cooking: never handed out early
  }

  clearSlot(station, index) {
    const slots = this.slotList(station);
    if (slots[index]) slots[index] = null;
  }

  update(dt) {
    for (const slots of this.slots.values()) {
      for (const slot of slots) {
        if (!slot) continue;
        slot.t += dt;
        if (slot.phase === 'cooking' && slot.t >= slot.cook) {
          slot.phase = 'done';
          slot.t = 0;
          this.sfx.ding();
          this.justFinished.push(slot);
        } else if (slot.phase === 'done' && slot.t >= slot.burn) {
          slot.phase = 'burnt';
          slot.t = 0;
          this.sfx.burnt();
        }
      }
    }
  }
}
