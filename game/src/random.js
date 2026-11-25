// random.js — a tiny seeded random number generator (mulberry32), so a day
// plays the same for the same seed: fair replays, stable screenshots, and
// no reliance on Math.random anywhere in the game logic.

export function makeRng(seed) {
  let state = (seed >>> 0) || 1;
  const next = () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    range: (min, max) => min + next() * (max - min),
    int: (min, max) => Math.floor(min + next() * (max - min + 1)),
    pick: (list) => list[Math.floor(next() * list.length)],
    chance: (p) => next() < p,
  };
}

// The day seed comes from the page address (?seed=) when present, so a
// screenshot or a rematch can name its day; otherwise the clock picks one.
export function seedFromAddress() {
  const params = new URLSearchParams(location.search);
  const named = Number(params.get('seed'));
  if (Number.isFinite(named) && named > 0) return named >>> 0;
  return (Date.now() % 2147483646) + 1;
}
