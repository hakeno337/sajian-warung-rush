// config.js — every constant that shapes a day at the stall: the room, the
// ingredients and what the kitchen does to them, the recipes on the menu,
// and the numbers that tune the rush (spawn pace, patience, prices, tips).

export const VIEW_W = 1280;
export const VIEW_H = 800;

// The chef walks the floor between the ticket rail (top) and the counter
// line (bottom). Stations sit on the counters; their `stand` point is where
// the chef interacts from.
export const FLOOR = { x: 36, y: 196, w: 1208, h: 428 };

// Ingredient ids. `raw` is what a crate hands you; the kitchen turns some
// raws into a different component before they can go on a plate.
export const INGREDIENTS = {
  bun:     { name: 'Bun',           colour: '#e8b04b', dark: '#b97e26' },
  patty:   { name: 'Beef patty',    colour: '#8a4b2a', dark: '#5d2f16' },
  chicken: { name: 'Chicken fillet', colour: '#e07840', dark: '#a34d1f' },
  egg:     { name: 'Egg',           colour: '#f6c945', dark: '#d99a16' },
  cheese:  { name: 'Cheese',        colour: '#ffc93c', dark: '#e0a100' },
  lettuce: { name: 'Lettuce',       colour: '#7ec850', dark: '#4d9427' },
  tomato:  { name: 'Tomato',        colour: '#e8483f', dark: '#b02318' },
  potato:  { name: 'Potato',        colour: '#d9a05b', dark: '#a96f2e' },
};

// What each raw becomes, and where. `via: 'ready'` means the crate item can
// go straight onto a plate. Chop and grill/fry outputs are new components.
export const PREP = {
  bun:     { via: 'ready' },
  cheese:  { via: 'ready' },
  lettuce: { via: 'chop', makes: 'lettuce_cut', chops: 4 },
  tomato:  { via: 'chop', makes: 'tomato_cut', chops: 4 },
  potato:  { via: 'chop', makes: 'fries_raw', chops: 5 },
  patty:   { via: 'grill', makes: 'patty_cooked', cook: 6, burn: 6 },
  chicken: { via: 'grill', makes: 'chicken_cooked', cook: 7, burn: 6 },
  egg:     { via: 'grill', makes: 'egg_fried', cook: 4, burn: 5 },
  fries_raw: { via: 'fryer', makes: 'fries', cook: 5, burn: 5 },
};

// Display names for finished components (what a plate can hold).
export const COMPONENTS = {
  bun:            { name: 'Bun',            colour: '#e8b04b' },
  cheese:         { name: 'Cheese',         colour: '#ffc93c' },
  lettuce_cut:    { name: 'Cut lettuce',    colour: '#7ec850' },
  tomato_cut:     { name: 'Tomato slices',  colour: '#e8483f' },
  patty_cooked:   { name: 'Grilled patty',  colour: '#8a4b2a' },
  chicken_cooked: { name: 'Grilled chicken', colour: '#e07840' },
  egg_fried:      { name: 'Fried egg',      colour: '#f6c945' },
  fries:          { name: 'Fries',          colour: '#f2b544' },
  burnt:          { name: 'Burnt!',         colour: '#3a3230' },
};

// The menu. `needs` is the exact multiset of components a plate must hold.
// `from` is the second of the day at which the dish joins the order pool.
export const RECIPES = [
  { id: 'classic',  name: 'Classic Burger', price: 12, from: 0,
    needs: ['bun', 'patty_cooked', 'cheese'] },
  { id: 'cheesyfries', name: 'Cheesy Fries', price: 10, from: 0,
    needs: ['fries', 'cheese'] },
  { id: 'salad',    name: 'Garden Salad',   price: 11, from: 0,
    needs: ['lettuce_cut', 'tomato_cut', 'cheese'] },
  { id: 'garden',   name: 'Garden Burger',  price: 18, from: 35,
    needs: ['bun', 'patty_cooked', 'cheese', 'lettuce_cut', 'tomato_cut'] },
  { id: 'sunrise',  name: 'Sunrise Burger', price: 17, from: 35,
    needs: ['bun', 'patty_cooked', 'egg_fried', 'cheese'] },
  { id: 'chicken',  name: 'Chicken Stack',  price: 19, from: 70,
    needs: ['bun', 'chicken_cooked', 'lettuce_cut', 'tomato_cut'] },
  { id: 'double',   name: 'Double Stack',   price: 24, from: 100,
    needs: ['bun', 'patty_cooked', 'patty_cooked', 'cheese', 'egg_fried'] },
];

export const BALANCE = {
  daySeconds: 150,
  maxOrders: 4,
  starsStart: 3,
  spawnFirst: 1.2,          // first ticket arrives almost at once
  spawnStart: 11,           // seconds between tickets early in the day
  spawnEnd: 6,              // ... and late in the day
  patienceStart: 68,        // seconds a ticket waits early on
  patienceEnd: 44,          // ... and at the end of the day
  tipFraction: 0.6,         // tip = up to 60% of price, scaled by patience left
  comboStep: 0.25,          // each combo step adds 25% to the take
  comboMax: 8,
  chefSpeed: 265,           // px per second
  interactRange: 86,        // px from chef to a station's stand point
};
