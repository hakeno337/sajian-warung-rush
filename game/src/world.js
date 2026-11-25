// world.js — the kitchen itself: where every station stands, what it is
// called, and which station the chef is close enough to use. Counters run
// along the left wall and the bottom of the room; the serving hatch and
// the plate shelf close the right end of the bottom counter.

import { BALANCE } from './config.js';

// kind: crate (hands out a raw ingredient) · board (chopping) · grill ·
// fryer (timed cooking slots) · plates (the plating counter) · pass
// (serving hatch) · trash (the bin).
export const STATIONS = [
  // Left wall: ingredient crates, top to bottom.
  { id: 'crate-bun',     kind: 'crate', label: 'Buns',     gives: 'bun',     x: 84,  y: 300 },
  { id: 'crate-patty',   kind: 'crate', label: 'Beef',     gives: 'patty',   x: 84,  y: 392 },
  { id: 'crate-chicken', kind: 'crate', label: 'Chicken',  gives: 'chicken', x: 84,  y: 484 },
  { id: 'crate-egg',     kind: 'crate', label: 'Eggs',     gives: 'egg',     x: 84,  y: 576 },
  // Bottom counter, left half: the cold crates and the chopping boards.
  { id: 'crate-lettuce', kind: 'crate', label: 'Lettuce',  gives: 'lettuce', x: 252, y: 668 },
  { id: 'crate-tomato',  kind: 'crate', label: 'Tomatoes', gives: 'tomato',  x: 356, y: 668 },
  { id: 'crate-potato',  kind: 'crate', label: 'Potatoes', gives: 'potato',  x: 460, y: 668 },
  { id: 'crate-cheese',  kind: 'crate', label: 'Cheese',   gives: 'cheese',  x: 564, y: 668 },
  { id: 'board-1', kind: 'board', label: 'Board', x: 668, y: 668 },
  { id: 'board-2', kind: 'board', label: 'Board', x: 756, y: 668 },
  // Bottom counter, right half: heat, plates, the hatch and the bin.
  { id: 'grill',  kind: 'grill', label: 'Grill', x: 872, y: 668, slots: 2 },
  { id: 'fryer',  kind: 'fryer', label: 'Fryer', x: 980, y: 668, slots: 2 },
  { id: 'plates', kind: 'plates', label: 'Plates', x: 1080, y: 668 },
  { id: 'pass',   kind: 'pass', label: 'Serve!', x: 1176, y: 668 },
  { id: 'trash',  kind: 'trash', label: 'Bin', x: 1196, y: 560 },
];

// Where the chef stands to use a station: crates on the left wall are used
// from the right, the bin from the left, everything else from above.
export function standPoint(station) {
  if (station.x <= 100) return { x: station.x + 74, y: station.y };
  if (station.kind === 'trash') return { x: station.x - 74, y: station.y };
  return { x: station.x, y: station.y - 74 };
}

export function stationById(id) {
  return STATIONS.find((s) => s.id === id) || null;
}

// The station the chef can use right now: the nearest stand point inside
// the interact range, or null when the chef is out in the open floor.
export function nearestStation(chef) {
  let best = null;
  let bestDist = BALANCE.interactRange;
  for (const station of STATIONS) {
    const stand = standPoint(station);
    const dist = Math.hypot(chef.x - stand.x, chef.y - stand.y);
    if (dist < bestDist) {
      best = station;
      bestDist = dist;
    }
  }
  return best;
}
