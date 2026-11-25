// orders.js — the ticket rail: which dishes the room is waiting for, how
// long each ticket has left, and whether a plate matches a ticket. Tickets
// arrive faster and wait less as the day wears on; a ticket that runs out
// of patience walks away (the game hears about it through onExpire).

import { BALANCE, RECIPES } from './config.js';

function sameMultiset(a, b) {
  if (a.length !== b.length) return false;
  const counts = new Map();
  for (const item of a) counts.set(item, (counts.get(item) || 0) + 1);
  for (const item of b) {
    const left = counts.get(item) || 0;
    if (left === 0) return false;
    counts.set(item, left - 1);
  }
  return true;
}

export class Orders {
  constructor(rng, sfx) {
    this.rng = rng;
    this.sfx = sfx;
    this.list = [];
    this.spawnT = BALANCE.spawnFirst;
    this.nextId = 1;
    this.onExpire = null; // set by the game: (order) => void
    this.pace = 1; // < 1 on later days: tickets come faster, wait less
  }

  dayProgress(elapsed) {
    return Math.min(1, elapsed / BALANCE.daySeconds);
  }

  spawnInterval(elapsed) {
    const p = this.dayProgress(elapsed);
    const base = BALANCE.spawnStart + (BALANCE.spawnEnd - BALANCE.spawnStart) * p;
    return base * this.pace;
  }

  patienceFor(elapsed) {
    const p = this.dayProgress(elapsed);
    const base = BALANCE.patienceStart + (BALANCE.patienceEnd - BALANCE.patienceStart) * p;
    return base * this.pace * this.rng.range(0.9, 1.1);
  }

  spawn(elapsed) {
    const pool = RECIPES.filter((r) => elapsed >= r.from);
    const recipe = this.rng.pick(pool);
    const patience = this.patienceFor(elapsed);
    const order = {
      id: this.nextId++,
      recipe,
      patienceMax: patience,
      patienceLeft: patience,
      born: elapsed,
    };
    this.list.push(order);
    return order;
  }

  update(dt, elapsed) {
    this.spawnT -= dt;
    if (this.spawnT <= 0 && this.list.length < BALANCE.maxOrders) {
      this.spawn(elapsed);
      this.spawnT = this.spawnInterval(elapsed) * this.rng.range(0.85, 1.15);
    }
    const expired = [];
    for (const order of this.list) {
      order.patienceLeft -= dt;
      if (order.patienceLeft <= 0) expired.push(order);
    }
    if (expired.length) {
      this.list = this.list.filter((o) => o.patienceLeft > 0);
      for (const order of expired) {
        this.sfx.expire();
        if (this.onExpire) this.onExpire(order);
      }
    }
  }

  // The ticket a plate satisfies, if any: the plate's components must be
  // exactly the recipe's, no more and no less.
  matchFor(plateItems) {
    return this.list.find((o) => sameMultiset(o.recipe.needs, plateItems)) || null;
  }

  serve(order) {
    this.list = this.list.filter((o) => o !== order);
  }
}
