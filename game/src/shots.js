// shots.js — posed scenes for the entry's screenshots, reached with
// ?shot=start|play|serve|end in the page address. Each pose builds a real
// state through the game's own systems (real tickets on the rail, a real
// plate mid-assembly in the chef's hands, food really cooking on the
// grill) and then freezes the timers, so the maker's screenshot is a true
// render of the game mid-service — the same trick the kit's starter uses.
// The poses show the whole room busy: customers wait under their tickets
// with all three patience moods (smile, anxious, angry) in the rush shot,
// and the chef is frozen mid-bob, mid-stride, plate in hand.

import { RECIPES } from './config.js';
import { stationById } from './world.js';

function ticket(game, recipeId, patienceFrac, look) {
  const recipe = RECIPES.find((r) => r.id === recipeId);
  const patience = 60;
  game.orders.list.push({
    id: game.orders.nextId++,
    recipe,
    patienceMax: patience,
    patienceLeft: patience * patienceFrac,
    born: 0,
    look,
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
    // The cover: the whole kitchen alive behind the title — three
    // tickets up, three regulars waiting, the chef mid-service at the
    // grill with steam rising, a burger half-built in hand.
    game.startDay(1);
    game.frozen = true;
    ticket(game, 'garden', 0.85, 1);
    ticket(game, 'classic', 0.6, 6);
    ticket(game, 'cheesyfries', 0.4, 3);
    game.chef.x = 1050;
    game.chef.y = 570;
    game.chef.facing = -1;
    game.chef.moving = true;
    game.chef.bob = 1.2;
    game.chef.carry = { type: 'plate', items: ['bun', 'patty_cooked', 'cheese'] };
    cookSlot(game, 'grill', 'chicken', 'cooking', 3.5);
    cookSlot(game, 'grill', 'egg', 'done', 1.2);
    cookSlot(game, 'fryer', 'fries_raw', 'cooking', 2.0);
    const board = stationById('board-1');
    game.cooking.placeOnBoard(board.id, 'tomato');
    game.cooking.chop(board.id);
    game.elapsed = 40;
    game.timeLeft = game.dayLength - 40;
    game.coins = 54;
    game.combo = 2;
    game.servedCount = 3;
    game.state = 'title';
    return;
  }
  game.startDay(1);
  game.frozen = true;
  if (kind === 'play') {
    // Mid-rush: three tickets up, a burger half-built in the chef's hands,
    // chicken on the grill, an egg done and waiting, tomato mid-chop.
    // All three patience moods in frame: smile, anxious, angry.
    ticket(game, 'garden', 0.82, 2);
    ticket(game, 'classic', 0.55, 5);
    ticket(game, 'cheesyfries', 0.22, 8);
    game.chef.x = 620;
    game.chef.y = 430;
    game.chef.facing = 1;
    game.chef.moving = true;
    game.chef.bob = 1.2;
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
    ticket(game, 'garden', 0.66, 1);
    ticket(game, 'double', 0.9, 7);
    game.chef.x = 1090;
    game.chef.y = 560;
    game.chef.facing = 1;
    game.chef.moving = true;
    game.chef.bob = 0.9;
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
    // Park the chef at the bow spot, so the dim figure under the overlay
    // sits where the crisp one takes the bow.
    game.chef.x = 1060;
    game.chef.y = 700;
    game.chef.facing = -1;
    game.state = 'over';
  }
}
