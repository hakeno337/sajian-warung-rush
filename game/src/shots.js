// shots.js — posed scenes for the entry's screenshots, reached with
// ?shot=start|play|serve|end in the page address. Each pose builds a real
// state through the game's own systems (real tickets on the rail, a real
// plate mid-assembly in the chef's hands, food really cooking on the
// grill) and then freezes the timers, so the maker's screenshot is a true
// render of the game mid-service — the same trick the kit's starter uses.

import { RECIPES } from './config.js';
import { stationById } from './world.js';

function ticket(game, recipeId, patienceFrac) {
  const recipe = RECIPES.find((r) => r.id === recipeId);
  const patience = 60;
  game.orders.list.push({
    id: game.orders.nextId++,
    recipe,
    patienceMax: patience,
    patienceLeft: patience * patienceFrac,
    born: 0,
  });
}

function cookSlot(game, stationId, raw, phase, t) {
  const station = stationById(stationId);
  game.cooking.placeInSlot(station, raw);
  const slots = game.cooking.slotList(station);
  const slot = slots.find((s) => s && s.item === raw);
  if (slot) {
    slot.phase = phase;
    slot.t = t;
  }
}

export function poseShot(game, kind) {
  game.frozen = true;
  if (kind === 'start') {
    game.state = 'title';
    return;
  }
  game.startDay(1);
  game.frozen = true;
  if (kind === 'play') {
    // Mid-rush: three tickets up, a burger half-built in the chef's hands,
    // chicken on the grill, an egg done and waiting, tomato mid-chop.
    ticket(game, 'garden', 0.82);
    ticket(game, 'classic', 0.55);
    ticket(game, 'cheesyfries', 0.34);
    game.chef.x = 620;
    game.chef.y = 430;
    game.chef.facing = 1;
    game.chef.carry = { type: 'plate', items: ['bun', 'patty_cooked'] };
    cookSlot(game, 'grill', 'chicken', 'cooking', 3.5);
    cookSlot(game, 'grill', 'egg', 'done', 1.2);
    cookSlot(game, 'fryer', 'fries_raw', 'done', 0.6);
    const board = stationById('board-1');
    game.cooking.placeOnBoard(board.id, 'tomato');
    game.cooking.chop(board.id);
    game.cooking.chop(board.id);
    game.elapsed = 55;
    game.timeLeft = game.dayLength - 55;
    game.coins = 86;
    game.combo = 3;
    game.servedCount = 5;
  } else if (kind === 'serve') {
    // The garden burger is plated and carried to the glowing hatch.
    ticket(game, 'garden', 0.66);
    ticket(game, 'double', 0.9);
    game.chef.x = 1090;
    game.chef.y = 560;
    game.chef.facing = 1;
    game.chef.carry = {
      type: 'plate',
      items: ['bun', 'patty_cooked', 'cheese', 'lettuce_cut', 'tomato_cut'],
    };
    cookSlot(game, 'grill', 'patty', 'cooking', 2.5);
    game.elapsed = 96;
    game.timeLeft = game.dayLength - 96;
    game.coins = 164;
    game.combo = 5;
    game.servedCount = 9;
    game.popups.push({
      x: 1080, y: 520, text: 'Plate it!', colour: '#2e7d32', t: 1.2, life: 1.2, size: 22,
    });
  } else if (kind === 'end') {
    game.lastDay = { served: 14, coins: 286, expired: 1, bestCombo: 7 };
    game.stars = 2;
    game.coins = 286;
    game.bestCoins = 286;
    game.stallClosed = false;
    game.lastDay.verdict = 'The room hums — regulars are asking for you by name.';
    game.state = 'over';
  }
}
