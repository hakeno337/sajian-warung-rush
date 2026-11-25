// render.js — everything the player sees, drawn on one canvas: the ticket
// rail and HUD, the tiled floor, the counters and their stations, the food
// (every ingredient and finished component has its own little drawing),
// the chef and whatever the hands hold, and the title / results screens.
// All art is code: shapes and colours, no image files.

import { COMPONENTS, FLOOR, INGREDIENTS, VIEW_H, VIEW_W } from './config.js';
import { STATIONS, standPoint } from './world.js';

const INK = '#3a2415';
const CREAM = '#fff6e0';

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

function text(ctx, str, x, y, size, colour, align = 'left', weight = 700) {
  ctx.fillStyle = colour;
  ctx.font = `${weight} ${size}px "Trebuchet MS", "Segoe UI", sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
}

// --- food icons ---------------------------------------------------------
// One drawing per raw ingredient and per finished component, sized by r.
export function drawFood(ctx, id, x, y, r) {
  ctx.save();
  ctx.translate(x, y);
  switch (id) {
    case 'bun': {
      ctx.fillStyle = '#e8b04b';
      ctx.beginPath(); ctx.arc(0, r * 0.25, r, Math.PI, 0); ctx.fill();
      ctx.fillRect(-r, r * 0.25, r * 2, r * 0.35);
      ctx.fillStyle = '#fff3d6';
      for (const [dx, dy] of [[-0.4, -0.35], [0.1, -0.55], [0.5, -0.3]]) {
        ctx.beginPath(); ctx.ellipse(dx * r, dy * r, r * 0.13, r * 0.07, 0.5, 0, 7); ctx.fill();
      }
      break;
    }
    case 'patty': case 'patty_cooked': {
      ctx.fillStyle = id === 'patty' ? '#a05a35' : '#7c3f1e';
      rr(ctx, -r, -r * 0.55, r * 2, r * 1.1, r * 0.5); ctx.fill();
      if (id === 'patty_cooked') {
        ctx.strokeStyle = '#4e2410'; ctx.lineWidth = r * 0.14;
        for (const dx of [-0.45, 0, 0.45]) {
          ctx.beginPath(); ctx.moveTo(dx * r, -r * 0.5); ctx.lineTo(dx * r + r * 0.2, r * 0.5); ctx.stroke();
        }
      }
      break;
    }
    case 'chicken': case 'chicken_cooked': {
      ctx.fillStyle = id === 'chicken' ? '#eda15f' : '#c85f22';
      ctx.beginPath(); ctx.ellipse(0, 0, r, r * 0.72, -0.4, 0, 7); ctx.fill();
      ctx.fillStyle = '#fff6e0';
      ctx.beginPath(); ctx.arc(r * 0.85, r * 0.45, r * 0.28, 0, 7); ctx.fill();
      if (id === 'chicken_cooked') {
        ctx.strokeStyle = '#7e3408'; ctx.lineWidth = r * 0.13;
        ctx.beginPath(); ctx.moveTo(-r * 0.6, -r * 0.2); ctx.lineTo(r * 0.3, r * 0.35); ctx.stroke();
      }
      break;
    }
    case 'egg': case 'egg_fried': {
      ctx.fillStyle = '#fdf6ec';
      ctx.beginPath(); ctx.ellipse(0, 0, r, r * 0.85, 0.3, 0, 7); ctx.fill();
      ctx.fillStyle = '#f6c945';
      ctx.beginPath(); ctx.arc(r * 0.1, 0, r * 0.48, 0, 7); ctx.fill();
      ctx.fillStyle = '#ffe9a8';
      ctx.beginPath(); ctx.arc(r * 0.02, -r * 0.12, r * 0.2, 0, 7); ctx.fill();
      break;
    }
    case 'cheese': {
      ctx.fillStyle = '#ffc93c';
      ctx.beginPath();
      ctx.moveTo(-r, r * 0.6); ctx.lineTo(r, r * 0.6); ctx.lineTo(r * 0.2, -r * 0.7); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#e0a100';
      for (const [dx, dy, s] of [[-0.3, 0.25, 0.16], [0.35, 0.3, 0.12], [0.05, -0.15, 0.1]]) {
        ctx.beginPath(); ctx.arc(dx * r, dy * r, s * r, 0, 7); ctx.fill();
      }
      break;
    }
    case 'lettuce': case 'lettuce_cut': {
      ctx.fillStyle = '#7ec850';
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2;
        ctx.beginPath();
        ctx.ellipse(Math.cos(a) * r * 0.45, Math.sin(a) * r * 0.4, r * 0.55, r * 0.34, a, 0, 7);
        ctx.fill();
      }
      ctx.fillStyle = '#a8e284';
      ctx.beginPath(); ctx.arc(0, 0, r * 0.42, 0, 7); ctx.fill();
      if (id === 'lettuce_cut') {
        ctx.strokeStyle = '#4d9427'; ctx.lineWidth = r * 0.1;
        for (const dy of [-0.3, 0.05, 0.4]) {
          ctx.beginPath(); ctx.moveTo(-r * 0.6, dy * r); ctx.lineTo(r * 0.6, dy * r + r * 0.12); ctx.stroke();
        }
      }
      break;
    }
    case 'tomato': case 'tomato_cut': {
      if (id === 'tomato') {
        ctx.fillStyle = '#e8483f';
        ctx.beginPath(); ctx.arc(0, r * 0.1, r * 0.92, 0, 7); ctx.fill();
        ctx.fillStyle = '#4d9427';
        ctx.beginPath(); ctx.ellipse(0, -r * 0.72, r * 0.42, r * 0.2, 0, 0, 7); ctx.fill();
      } else {
        for (const dx of [-0.55, 0.05, 0.6]) {
          ctx.fillStyle = '#e8483f';
          ctx.beginPath(); ctx.arc(dx * r, 0, r * 0.52, 0, 7); ctx.fill();
          ctx.fillStyle = '#ff9a8a';
          ctx.beginPath(); ctx.arc(dx * r, 0, r * 0.3, 0, 7); ctx.fill();
        }
      }
      break;
    }
    case 'potato': {
      ctx.fillStyle = '#d9a05b';
      ctx.beginPath(); ctx.ellipse(0, 0, r, r * 0.78, 0.4, 0, 7); ctx.fill();
      ctx.fillStyle = '#a96f2e';
      for (const [dx, dy] of [[-0.3, -0.2], [0.25, 0.15], [0.05, -0.45]]) {
        ctx.beginPath(); ctx.arc(dx * r, dy * r, r * 0.09, 0, 7); ctx.fill();
      }
      break;
    }
    case 'fries_raw': case 'fries': {
      const stick = id === 'fries' ? '#f2b544' : '#ecd9a8';
      ctx.fillStyle = id === 'fries' ? '#d84a35' : '#b9c4c9';
      ctx.beginPath();
      ctx.moveTo(-r * 0.8, -r * 0.1); ctx.lineTo(r * 0.8, -r * 0.1);
      ctx.lineTo(r * 0.6, r); ctx.lineTo(-r * 0.6, r); ctx.closePath(); ctx.fill();
      ctx.fillStyle = stick;
      for (const dx of [-0.5, -0.17, 0.17, 0.5]) {
        ctx.save(); ctx.translate(dx * r, -r * 0.35); ctx.rotate(dx * 0.35);
        ctx.fillRect(-r * 0.11, -r * 0.75, r * 0.22, r * 0.95); ctx.restore();
      }
      break;
    }
    case 'burnt': {
      ctx.fillStyle = '#3a3230';
      ctx.beginPath(); ctx.ellipse(0, r * 0.15, r * 0.95, r * 0.62, 0, 0, 7); ctx.fill();
      ctx.strokeStyle = 'rgba(120,120,120,0.8)'; ctx.lineWidth = r * 0.12;
      ctx.beginPath(); ctx.moveTo(0, -r * 0.4);
      ctx.bezierCurveTo(r * 0.5, -r * 0.8, -r * 0.4, -r * 1.0, 0, -r * 1.5); ctx.stroke();
      break;
    }
    default: {
      ctx.fillStyle = COMPONENTS[id]?.colour || INGREDIENTS[id]?.colour || '#ccc';
      ctx.beginPath(); ctx.arc(0, 0, r * 0.8, 0, 7); ctx.fill();
    }
  }
  ctx.restore();
}

// A plate drawn from above: rim, then its components fanned across it.
export function drawPlate(ctx, items, x, y, r) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = '#fdfdf8';
  ctx.beginPath(); ctx.arc(0, 0, r, 0, 7); ctx.fill();
  ctx.strokeStyle = '#c9cfd4'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(0, 0, r * 0.78, 0, 7); ctx.stroke();
  const spots = items.length <= 1
    ? [[0, 0]]
    : items.map((_, i) => {
        const a = (i / items.length) * Math.PI * 2 - Math.PI / 2;
        return [Math.cos(a) * r * 0.38, Math.sin(a) * r * 0.34];
      });
  items.forEach((id, i) => drawFood(ctx, id, spots[i][0], spots[i][1], r * 0.52));
  ctx.restore();
}

// --- the room -----------------------------------------------------------
function drawRoom(ctx, game) {
  // Wall and the cork rail the tickets pin to.
  ctx.fillStyle = '#f0dcba';
  ctx.fillRect(0, 0, VIEW_W, 196);
  ctx.fillStyle = '#c98f4e';
  ctx.fillRect(0, 44, VIEW_W, 152);
  ctx.fillStyle = 'rgba(0,0,0,0.08)';
  for (let x = 0; x < VIEW_W; x += 46) ctx.fillRect(x, 44, 2, 152);

  // Terracotta floor tiles: a checker of two warm tones with grout lines.
  ctx.fillStyle = '#d98868';
  ctx.fillRect(FLOOR.x - 36, FLOOR.y, VIEW_W, FLOOR.h + 20);
  const tile = 52;
  const rows = Math.ceil((FLOOR.h + 20) / tile);
  const cols = Math.ceil(VIEW_W / tile);
  ctx.fillStyle = 'rgba(255,255,255,0.07)';
  for (let rI = 0; rI < rows; rI++) {
    for (let cI = 0; cI < cols; cI++) {
      if ((rI + cI) % 2 === 0) ctx.fillRect(cI * tile, FLOOR.y + rI * tile, tile, tile);
    }
  }
  ctx.strokeStyle = 'rgba(120,50,20,0.25)';
  ctx.lineWidth = 2;
  for (let cI = 0; cI <= cols; cI++) {
    ctx.beginPath(); ctx.moveTo(cI * tile, FLOOR.y); ctx.lineTo(cI * tile, FLOOR.y + FLOOR.h + 20); ctx.stroke();
  }
  for (let rI = 0; rI <= rows; rI++) {
    ctx.beginPath(); ctx.moveTo(0, FLOOR.y + rI * tile); ctx.lineTo(VIEW_W, FLOOR.y + rI * tile); ctx.stroke();
  }

  // Left crate wall and the bottom counter.
  ctx.fillStyle = '#8a5a33';
  ctx.fillRect(0, FLOOR.y, 132, FLOOR.h + 20);
  ctx.fillRect(0, 624, VIEW_W, VIEW_H - 624);
  ctx.fillStyle = '#a06a3a';
  ctx.fillRect(0, 624, VIEW_W, 14);
  ctx.fillRect(0, FLOOR.y, 132, 14);
  ctx.fillStyle = 'rgba(0,0,0,0.15)';
  ctx.fillRect(126, FLOOR.y, 6, FLOOR.h + 20);
}

function drawStation(ctx, game, station, active) {
  const { x, y } = station;
  const cooking = game.cooking;
  ctx.save();
  ctx.translate(x, y);
  if (active) {
    ctx.strokeStyle = '#ffd94d';
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.ellipse(0, 6, 52, 44, 0, 0, 7); ctx.stroke();
  }
  switch (station.kind) {
    case 'crate': {
      ctx.fillStyle = '#b07a3f';
      rr(ctx, -38, -34, 76, 68, 8); ctx.fill();
      ctx.fillStyle = '#96622c';
      rr(ctx, -38, -34, 76, 16, 8); ctx.fill();
      drawFood(ctx, station.gives, 0, 2, 24);
      break;
    }
    case 'board': {
      ctx.fillStyle = '#e6cf9e';
      rr(ctx, -40, -28, 80, 56, 10); ctx.fill();
      ctx.strokeStyle = '#bfa065'; ctx.lineWidth = 3; ctx.stroke();
      const board = cooking.boardState(station.id);
      if (board) {
        drawFood(ctx, board.item, 0, 0, 22);
        // Progress: a row of slice marks filling up.
        for (let i = 0; i < board.needed; i++) {
          ctx.fillStyle = i < board.progress ? '#e8483f' : 'rgba(0,0,0,0.18)';
          ctx.fillRect(-30 + i * 13, 32, 9, 6);
        }
        if (cooking.boardDone(station.id)) {
          text(ctx, 'READY', 0, -42, 13, '#2e7d32', 'center', 800);
        }
      } else {
        ctx.fillStyle = 'rgba(0,0,0,0.12)';
        text(ctx, '✦', 0, 2, 22, 'rgba(0,0,0,0.25)', 'center');
      }
      break;
    }
    case 'grill': case 'fryer': {
      const isGrill = station.kind === 'grill';
      ctx.fillStyle = isGrill ? '#4a4a52' : '#7a4a21';
      rr(ctx, -52, -36, 104, 72, 10); ctx.fill();
      if (!isGrill) {
        ctx.fillStyle = '#e8a33d';
        rr(ctx, -44, -28, 88, 40, 8); ctx.fill();
      }
      const slots = cooking.slotList(station);
      slots.forEach((slot, i) => {
        const sx = i === 0 ? -26 : 26;
        ctx.fillStyle = isGrill ? '#33333a' : 'rgba(120,60,0,0.35)';
        ctx.beginPath(); ctx.arc(sx, 0, 21, 0, 7); ctx.fill();
        if (!slot) return;
        drawFood(ctx, slot.phase === 'burnt' ? 'burnt' : slot.item, sx, 0, 17);
        if (slot.phase === 'cooking') ring(ctx, sx, 0, 24, slot.t / slot.cook, '#7ec850');
        if (slot.phase === 'done') {
          ring(ctx, sx, 0, 24, 1 - slot.t / slot.burn, '#ffc93c');
          text(ctx, '!', sx + 20, -22, 20, '#ffc93c', 'center', 800);
        }
      });
      break;
    }
    case 'plates': {
      ctx.fillStyle = '#fdfdf8';
      for (let i = 0; i < 3; i++) {
        ctx.beginPath(); ctx.ellipse(-14, 14 - i * 7, 26, 9, 0, 0, 7); ctx.fill();
        ctx.strokeStyle = '#c9cfd4'; ctx.lineWidth = 1.5; ctx.stroke();
      }
      game.chef.storedPlates.forEach((plate, i) => {
        drawPlate(ctx, plate.items, 26, -8 + i * 20, 17);
      });
      break;
    }
    case 'pass': {
      ctx.fillStyle = '#5d7a8c';
      rr(ctx, -46, -38, 92, 76, 8); ctx.fill();
      ctx.fillStyle = '#ffe9a8';
      rr(ctx, -36, -28, 72, 40, 6); ctx.fill();
      text(ctx, '♪', 0, -8, 24, '#8a6d1f', 'center', 800);
      const held = game.chef.carry;
      if (held && held.type === 'plate' && game.orders.matchFor(held.items)) {
        ctx.strokeStyle = '#7ec850'; ctx.lineWidth = 4;
        rr(ctx, -50, -42, 100, 84, 10); ctx.stroke();
      }
      break;
    }
    case 'trash': {
      ctx.fillStyle = '#707880';
      ctx.beginPath();
      ctx.moveTo(-24, -26); ctx.lineTo(24, -26); ctx.lineTo(18, 32); ctx.lineTo(-18, 32);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#596066';
      ctx.fillRect(-28, -34, 56, 10);
      break;
    }
    default:
      break;
  }
  ctx.restore();
  text(ctx, station.label, x, y + 52, 13, station.x <= 100 ? '#5d3a1f' : CREAM, 'center', 700);
}

function ring(ctx, x, y, r, frac, colour) {
  ctx.strokeStyle = 'rgba(0,0,0,0.25)';
  ctx.lineWidth = 4;
  ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.stroke();
  ctx.strokeStyle = colour;
  ctx.beginPath();
  ctx.arc(x, y, r, -Math.PI / 2, -Math.PI / 2 + Math.max(0, Math.min(1, frac)) * Math.PI * 2);
  ctx.stroke();
}

// --- tickets, HUD, chef ---------------------------------------------------
function drawTickets(ctx, game) {
  const orders = game.orders.list;
  orders.forEach((order, i) => {
    const x = 150 + i * 292;
    const y = 56;
    const w = 272;
    const h = 128;
    const urgent = order.patienceLeft < order.patienceMax * 0.3;
    ctx.save();
    if (urgent && Math.floor(game.time * 6) % 2 === 0) ctx.translate(0, -2);
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    rr(ctx, x + 4, y + 5, w, h, 10); ctx.fill();
    ctx.fillStyle = CREAM;
    rr(ctx, x, y, w, h, 10); ctx.fill();
    ctx.fillStyle = '#d84a35';
    ctx.beginPath(); ctx.arc(x + w / 2, y + 4, 7, 0, 7); ctx.fill();
    text(ctx, order.recipe.name, x + 14, y + 24, 19, INK, 'left', 800);
    text(ctx, `$${order.recipe.price}`, x + w - 14, y + 24, 19, '#2e7d32', 'right', 800);
    order.recipe.needs.forEach((need, j) => {
      drawFood(ctx, need, x + 30 + j * 44, y + 62, 17);
    });
    // Patience bar: drains left to right, green to red.
    const frac = Math.max(0, order.patienceLeft / order.patienceMax);
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    rr(ctx, x + 12, y + h - 22, w - 24, 11, 5); ctx.fill();
    ctx.fillStyle = frac > 0.5 ? '#7ec850' : frac > 0.28 ? '#ffc93c' : '#e8483f';
    if (frac > 0) { rr(ctx, x + 12, y + h - 22, (w - 24) * frac, 11, 5); ctx.fill(); }
    ctx.restore();
  });
  if (!orders.length && game.state === 'playing') {
    text(ctx, 'Tickets incoming…', 640, 118, 20, 'rgba(59,32,10,0.55)', 'center', 700);
  }
}

function drawHud(ctx, game) {
  ctx.fillStyle = '#402a1a';
  ctx.fillRect(0, 0, VIEW_W, 44);
  text(ctx, `DAY ${game.day}`, 18, 22, 20, '#ffd94d', 'left', 800);
  // Day clock: a draining bar with a sun at the live end.
  const frac = Math.max(0, game.timeLeft / game.dayLength);
  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  rr(ctx, 130, 15, 420, 14, 7); ctx.fill();
  ctx.fillStyle = frac > 0.25 ? '#7ec850' : '#e8483f';
  if (frac > 0) { rr(ctx, 130, 15, 420 * frac, 14, 7); ctx.fill(); }
  text(ctx, `${Math.ceil(game.timeLeft)}s`, 566, 22, 17, CREAM, 'left', 800);
  text(ctx, `🪙 ${game.coins}`, 700, 22, 20, '#ffd94d', 'left', 800);
  if (game.combo >= 2) {
    text(ctx, `🔥 COMBO ×${(1 + (game.combo - 1) * 0.25).toFixed(2).replace(/\.?0+$/, '')}`, 830, 22, 18, '#ff9a3d', 'left', 800);
  }
  // Stars: the stall's rating, lost one per walked-away ticket.
  for (let i = 0; i < 3; i++) {
    text(ctx, i < game.stars ? '★' : '☆', 1088 + i * 34, 22, 26, i < game.stars ? '#ffd94d' : 'rgba(255,255,255,0.35)', 'center', 800);
  }
  text(ctx, game.sfx.muted ? 'MUTED (M)' : 'SOUND (M)', 1262, 22, 13, 'rgba(255,246,224,0.7)', 'right', 600);
}

function drawChef(ctx, game) {
  const chef = game.chef;
  const bobY = chef.moving ? Math.sin(chef.bob) * 2.5 : 0;
  const shakeX = chef.nudge > 0 ? Math.sin(game.time * 70) * 3 : 0;
  ctx.save();
  ctx.translate(chef.x + shakeX, chef.y + bobY);
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath(); ctx.ellipse(0, 26 - bobY, 24, 8, 0, 0, 7); ctx.fill();
  // Body: teal shirt, white apron.
  ctx.fillStyle = '#2e8b8b';
  rr(ctx, -19, -6, 38, 34, 10); ctx.fill();
  ctx.fillStyle = '#fdfdf8';
  rr(ctx, -13, 2, 26, 26, 6); ctx.fill();
  // Head and toque.
  ctx.fillStyle = '#f2c188';
  ctx.beginPath(); ctx.arc(0, -22, 15, 0, 7); ctx.fill();
  ctx.fillStyle = '#fdfdf8';
  rr(ctx, -13, -44, 26, 14, 6); ctx.fill();
  ctx.beginPath(); ctx.arc(-7, -44, 8, 0, 7); ctx.arc(7, -44, 8, 0, 7); ctx.arc(0, -48, 9, 0, 7); ctx.fill();
  ctx.fillStyle = INK;
  ctx.beginPath();
  ctx.arc(chef.facing * 4 - 5, -22, 1.8, 0, 7);
  ctx.arc(chef.facing * 4 + 5, -22, 1.8, 0, 7);
  ctx.fill();
  // What the hands hold, in front.
  if (chef.carry) {
    const hx = chef.facing * 20;
    if (chef.carry.type === 'item') drawFood(ctx, chef.carry.id, hx, 12, 16);
    else drawPlate(ctx, chef.carry.items, hx, 12, 21);
  }
  ctx.restore();
}

function drawFx(ctx, game) {
  for (const p of game.particles) {
    ctx.globalAlpha = Math.max(0, p.t / p.life);
    ctx.fillStyle = p.colour;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, 7); ctx.fill();
  }
  ctx.globalAlpha = 1;
  for (const pop of game.popups) {
    const rise = (1 - pop.t / pop.life) * 44;
    ctx.globalAlpha = Math.max(0, pop.t / pop.life);
    text(ctx, pop.text, pop.x, pop.y - rise, pop.size || 20, pop.colour, 'center', 800);
  }
  ctx.globalAlpha = 1;
}

// --- screens --------------------------------------------------------------
function drawTitle(ctx, game) {
  ctx.fillStyle = 'rgba(43,24,10,0.72)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  text(ctx, 'SAJIAN!', 640, 218, 92, '#ffd94d', 'center', 800);
  text(ctx, '— WARUNG RUSH —', 640, 282, 30, '#ffb35c', 'center', 800);
  text(ctx, 'Run the stall: take tickets, chop, grill, plate and serve before patience runs out.', 640, 336, 20, CREAM, 'center', 600);
  const menu = game.menuToday;
  text(ctx, 'ON THE MENU', 640, 388, 16, '#ffd94d', 'center', 800);
  menu.forEach((recipe, i) => {
    const x = 640 + (i - (menu.length - 1) / 2) * 118;
    recipe.needs.forEach((need, j) => {
      drawFood(ctx, need, x + (j - (recipe.needs.length - 1) / 2) * 26, 428, 11);
    });
    text(ctx, recipe.name, x, 458, 12.5, CREAM, 'center', 700);
    text(ctx, `$${recipe.price}`, x, 476, 12.5, '#7ec850', 'center', 700);
  });
  // Start button (clickable) and the controls.
  ctx.fillStyle = '#e8483f';
  rr(ctx, 520, 520, 240, 58, 14); ctx.fill();
  text(ctx, '▶  START DAY 1', 640, 550, 24, '#fff', 'center', 800);
  text(ctx, 'Move: WASD / arrows · Interact: E · Trash hand: walk to the bin · Pause: P · Mute: M', 640, 622, 17, 'rgba(255,246,224,0.85)', 'center', 600);
  text(ctx, 'Plates live on the Plates counter — park a half-built plate there while you run the grill.', 640, 652, 16, 'rgba(255,246,224,0.65)', 'center', 600);
  if (game.bestCoins > 0) {
    text(ctx, `Best day so far: 🪙 ${game.bestCoins}`, 640, 700, 18, '#ffd94d', 'center', 700);
  }
}

function drawResults(ctx, game) {
  ctx.fillStyle = 'rgba(43,24,10,0.78)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  const s = game.lastDay;
  text(ctx, game.stallClosed ? 'THE STALL CLOSES' : `DAY ${game.day} DONE!`, 640, 168, 52, '#ffd94d', 'center', 800);
  const rows = [
    ['Dishes served', `${s.served}`],
    ['Coins earned', `🪙 ${s.coins}`],
    ['Best combo', `×${s.bestCombo}`],
    ['Tickets walked away', `${s.expired}`],
    ['Stars left', '★'.repeat(game.stars) + '☆'.repeat(3 - game.stars)],
  ];
  rows.forEach(([label, value], i) => {
    text(ctx, label, 520, 248 + i * 44, 21, CREAM, 'right', 600);
    text(ctx, value, 580, 248 + i * 44, 21, '#ffd94d', 'left', 800);
  });
  text(ctx, s.verdict, 640, 492, 22, '#ffb35c', 'center', 700);
  if (!game.stallClosed) {
    ctx.fillStyle = '#2e7d32';
    rr(ctx, 500, 540, 280, 56, 14); ctx.fill();
    text(ctx, `▶  START DAY ${game.day + 1}`, 640, 569, 22, '#fff', 'center', 800);
    text(ctx, 'Tomorrow: tickets come faster and wait less.', 640, 626, 16, 'rgba(255,246,224,0.75)', 'center', 600);
  } else {
    ctx.fillStyle = '#e8483f';
    rr(ctx, 500, 540, 280, 56, 14); ctx.fill();
    text(ctx, '↻  OPEN AGAIN (DAY 1)', 640, 569, 22, '#fff', 'center', 800);
    text(ctx, `Best day at this stall: 🪙 ${game.bestCoins}`, 640, 626, 17, '#ffd94d', 'center', 700);
  }
}

// The full frame: room, stations, tickets, chef, effects, then any screen.
export function render(ctx, game) {
  ctx.clearRect(0, 0, VIEW_W, VIEW_H);
  drawRoom(ctx, game);
  drawTickets(ctx, game);
  const active = game.state === 'playing' ? game.activeStation : null;
  for (const station of STATIONS) {
    drawStation(ctx, game, station, station === active);
  }
  if (active) {
    const stand = standPoint(active);
    text(ctx, 'E', stand.x, stand.y - 6, 15, '#ffd94d', 'center', 800);
  }
  drawChef(ctx, game);
  drawFx(ctx, game);
  if (game.state === 'playing' || game.state === 'paused') drawHud(ctx, game);
  if (game.state === 'title') drawTitle(ctx, game);
  if (game.state === 'over') drawResults(ctx, game);
  if (game.state === 'paused') {
    ctx.fillStyle = 'rgba(43,24,10,0.55)';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    text(ctx, 'PAUSED', 640, 380, 54, CREAM, 'center', 800);
    text(ctx, 'Press P to keep cooking', 640, 436, 20, 'rgba(255,246,224,0.85)', 'center', 600);
  }
}
