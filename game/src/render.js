// render.js — everything the player sees, drawn on one canvas: the ticket
// rail and HUD, the tiled floor, the counters and their stations, the food
// (every ingredient and finished component has its own little drawing),
// the chef and whatever the hands hold, and the title / results screens.
// All art is code: shapes and colours, no image files.

import { COMPONENTS, FLOOR, INGREDIENTS, VIEW_H, VIEW_W } from './config.js';
import { STATIONS, standPoint } from './world.js';
import { drawCustomer } from './customers.js';

const INK = '#3a2415';
const CREAM = '#fff6e0';
const GOLD = '#d4a017';

// Ticket rail layout: four tickets fit the 1280-wide wall with room to
// spare (v1's 150/292 layout pushed the fourth ticket off-screen).
export const TICKET_X0 = 100;
export const TICKET_STEP = 287;
export const TICKET_W = 272;
export function ticketCenterX(i) {
  return TICKET_X0 + i * TICKET_STEP + TICKET_W / 2;
}

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

// Text with a dark outline, for anything that sits on a busy background
// (HUD, station labels, prices): readable at full size and at thumbnail.
function textOutlined(ctx, str, x, y, size, colour, align = 'left', weight = 800, outline = 'rgba(43,24,10,0.9)') {
  ctx.font = `${weight} ${size}px "Trebuchet MS", "Segoe UI", sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = outline;
  ctx.lineWidth = Math.max(2.5, size / 7);
  ctx.strokeText(str, x, y);
  ctx.fillStyle = colour;
  ctx.fillText(str, x, y);
}

// Display lettering: a bold serif with a hard outline and a warm offset
// shadow — the signboard look, not the default sans.
function displayText(ctx, str, x, y, size, colour, align = 'center') {
  ctx.font = `800 ${size}px "Liberation Serif", "DejaVu Serif", Georgia, serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  ctx.fillStyle = 'rgba(120,20,10,0.85)';
  ctx.fillText(str, x + 4, y + 6);
  ctx.strokeStyle = '#2b180a';
  ctx.lineWidth = Math.max(4, size / 11);
  ctx.strokeText(str, x, y);
  const grad = ctx.createLinearGradient(0, y - size / 2, 0, y + size / 2);
  grad.addColorStop(0, '#ffe98a');
  grad.addColorStop(0.55, colour);
  grad.addColorStop(1, '#e8a33d');
  ctx.fillStyle = grad;
  ctx.fillText(str, x, y);
}

// A batik-style border strip: dark band, gold diamonds and dots.
function batikStrip(ctx, x, y, w, h = 12) {
  ctx.save();
  ctx.fillStyle = '#5d1f16';
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = '#ffd94d';
  const step = 26;
  for (let bx = x + step / 2; bx < x + w; bx += step) {
    ctx.beginPath();
    ctx.moveTo(bx, y + 2); ctx.lineTo(bx + 5, y + h / 2); ctx.lineTo(bx, y + h - 2); ctx.lineTo(bx - 5, y + h / 2);
    ctx.closePath(); ctx.fill();
  }
  ctx.fillStyle = 'rgba(255,217,77,0.7)';
  for (let bx = x + step; bx < x + w; bx += step) {
    ctx.beginPath(); ctx.arc(bx, y + h / 2, 1.6, 0, 7); ctx.fill();
  }
  ctx.restore();
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

  // A woven rug in the middle of the floor, so the chef works on
  // something warm instead of bare tile.
  ctx.fillStyle = '#8a2f24';
  rr(ctx, 470, 400, 340, 120, 12); ctx.fill();
  ctx.strokeStyle = '#ffd94d'; ctx.lineWidth = 3;
  rr(ctx, 480, 410, 320, 100, 8); ctx.stroke();
  ctx.fillStyle = '#ffd94d';
  for (let rx = 512; rx < 780; rx += 44) {
    ctx.beginPath();
    ctx.moveTo(rx, 440); ctx.lineTo(rx + 8, 460); ctx.lineTo(rx, 480); ctx.lineTo(rx - 8, 460);
    ctx.closePath(); ctx.fill();
  }
  ctx.fillStyle = '#6e241c';
  ctx.beginPath(); ctx.arc(640, 460, 20, 0, 7); ctx.fill();
  ctx.fillStyle = '#ffd94d';
  ctx.beginPath(); ctx.arc(640, 460, 12, 0, 7); ctx.fill();
  ctx.fillStyle = '#8a2f24';
  ctx.beginPath(); ctx.arc(640, 460, 5, 0, 7); ctx.fill();

  // Potted plant in the top-right corner of the floor.
  ctx.fillStyle = '#b0613c';
  ctx.beginPath();
  ctx.moveTo(1216, 236); ctx.lineTo(1256, 236); ctx.lineTo(1249, 272); ctx.lineTo(1223, 272);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#4d9427';
  for (const [dx, dy, r] of [[-12, -14, 11], [0, -22, 13], [12, -13, 11], [-6, -6, 9], [7, -5, 9]]) {
    ctx.beginPath(); ctx.ellipse(1236 + dx, 238 + dy, r, r * 0.7, dx * 0.04, 0, 7); ctx.fill();
  }

  // Warm light pools on the wall, left and right of the ticket rail.
  const glow = (gx) => {
    const g = ctx.createRadialGradient(gx, 120, 10, gx, 120, 130);
    g.addColorStop(0, 'rgba(255,214,130,0.5)');
    g.addColorStop(1, 'rgba(255,214,130,0)');
    ctx.fillStyle = g;
    ctx.fillRect(gx - 130, 44, 260, 152);
  };
  glow(60);
  glow(1220);

  // Wall clock in the gap left of the first ticket.
  ctx.fillStyle = '#fdfdf8';
  ctx.beginPath(); ctx.arc(50, 118, 26, 0, 7); ctx.fill();
  ctx.strokeStyle = '#8a5a33'; ctx.lineWidth = 4; ctx.stroke();
  ctx.strokeStyle = '#241408'; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(50, 118); ctx.lineTo(50, 100); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(50, 118); ctx.lineTo(62, 122); ctx.stroke();
  ctx.fillStyle = '#241408';
  ctx.beginPath(); ctx.arc(50, 118, 2.5, 0, 7); ctx.fill();

  // Left crate wall and the bottom counter.
  ctx.fillStyle = '#8a5a33';
  ctx.fillRect(0, FLOOR.y, 132, FLOOR.h + 20);
  ctx.fillRect(0, 624, VIEW_W, VIEW_H - 624);
  ctx.fillStyle = '#a06a3a';
  ctx.fillRect(0, 624, VIEW_W, 14);
  ctx.fillRect(0, FLOOR.y, 132, 14);
  ctx.fillStyle = 'rgba(0,0,0,0.15)';
  ctx.fillRect(126, FLOOR.y, 6, FLOOR.h + 20);
  // Batik trim along the counter's top edge (right of the crate wall,
  // so the Eggs label stays clear).
  batikStrip(ctx, 132, 624, VIEW_W - 132, 12);
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
        // Steam curls rise off anything hot; a done slot sizzles.
        if (slot.phase === 'cooking' || slot.phase === 'done') {
          ctx.strokeStyle = 'rgba(255,255,255,0.75)';
          ctx.lineWidth = 2.5;
          for (const ox of [-8, 4]) {
            ctx.beginPath();
            ctx.moveTo(sx + ox, -18);
            ctx.bezierCurveTo(sx + ox - 5, -28, sx + ox + 5, -34, sx + ox - 2, -44);
            ctx.stroke();
          }
        }
        if (slot.phase === 'done') {
          ctx.strokeStyle = '#ffd94d';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(sx - 14, -34); ctx.lineTo(sx - 9, -40); ctx.lineTo(sx - 4, -34); ctx.lineTo(sx + 1, -40);
          ctx.stroke();
        }
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
  // Gold-trimmed station label: outlined text over a short gold rule.
  const labelColour = station.x <= 100 ? '#ffd94d' : CREAM;
  textOutlined(ctx, station.label, x, y + 50, 13, labelColour, 'center', 800);
  ctx.fillStyle = GOLD;
  ctx.fillRect(x - 24, y + 60, 48, 2.5);
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
    const x = TICKET_X0 + i * TICKET_STEP;
    const y = 56;
    const w = TICKET_W;
    const h = 128;
    const urgent = order.patienceLeft < order.patienceMax * 0.3;
    ctx.save();
    if (urgent && Math.floor(game.time * 6) % 2 === 0) ctx.translate(0, -2);
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    rr(ctx, x + 4, y + 5, w, h, 10); ctx.fill();
    ctx.fillStyle = CREAM;
    rr(ctx, x, y, w, h, 10); ctx.fill();
    // Gold trim along the card's top edge.
    ctx.fillStyle = GOLD;
    ctx.fillRect(x + 10, y, w - 20, 4);
    ctx.fillStyle = '#d84a35';
    ctx.beginPath(); ctx.arc(x + w / 2, y + 4, 7, 0, 7); ctx.fill();
    text(ctx, order.recipe.name, x + 14, y + 24, 19, INK, 'left', 800);
    textOutlined(ctx, `$${order.recipe.price}`, x + w - 14, y + 24, 20, '#c9920e', 'right', 800, 'rgba(59,32,10,0.55)');
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

// The customers waiting under their tickets, standing at the counter
// below the rail — one per order, mood matched to its patience.
function drawCustomers(ctx, game) {
  if (game.state === 'over') return;
  game.orders.list.forEach((order, i) => {
    drawCustomer(ctx, order, ticketCenterX(i), 296);
  });
}

function drawHud(ctx, game) {
  ctx.fillStyle = '#402a1a';
  ctx.fillRect(0, 0, VIEW_W, 44);
  textOutlined(ctx, `DAY ${game.day}`, 18, 22, 20, '#ffd94d', 'left', 800);
  // Day clock: a draining bar with a sun at the live end.
  const frac = Math.max(0, game.timeLeft / game.dayLength);
  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  rr(ctx, 130, 15, 420, 14, 7); ctx.fill();
  ctx.fillStyle = frac > 0.25 ? '#7ec850' : '#e8483f';
  if (frac > 0) { rr(ctx, 130, 15, 420 * frac, 14, 7); ctx.fill(); }
  textOutlined(ctx, `${Math.ceil(game.timeLeft)}s`, 566, 22, 17, CREAM, 'left', 800);
  textOutlined(ctx, `🪙 ${game.coins}`, 700, 22, 20, '#ffd94d', 'left', 800);
  if (game.combo >= 2) {
    textOutlined(ctx, `🔥 COMBO ×${(1 + (game.combo - 1) * 0.25).toFixed(2).replace(/\.?0+$/, '')}`, 830, 22, 18, '#ff9a3d', 'left', 800);
  }
  // Stars: the stall's rating, lost one per walked-away ticket.
  for (let i = 0; i < 3; i++) {
    text(ctx, i < game.stars ? '★' : '☆', 1088 + i * 34, 22, 26, i < game.stars ? '#ffd94d' : 'rgba(255,255,255,0.35)', 'center', 800);
  }
  text(ctx, game.sfx.muted ? 'MUTED (M)' : 'SOUND (M)', 1262, 22, 13, 'rgba(255,246,224,0.7)', 'right', 600);
}

function drawChef(ctx, game) {
  const chef = game.chef;
  const bobY = chef.moving ? Math.sin(chef.bob) * 3 : 0;
  const shakeX = chef.nudge > 0 ? Math.sin(game.time * 70) * 3 : 0;
  // Squash-and-stretch while walking, and a lean into the board while
  // chopping — the movement reads even in a still frame.
  const stretch = chef.moving ? Math.sin(chef.bob) * 0.06 : 0;
  const lean = chef.chopT > 0 ? 0.14 * chef.facing : 0;
  ctx.save();
  ctx.translate(chef.x + shakeX, chef.y + bobY);
  ctx.rotate(lean);
  ctx.scale(1.22 + stretch, 1.22 - stretch);
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath(); ctx.ellipse(0, 26 - bobY, 24, 8, 0, 0, 7); ctx.fill();
  // Legs, mid-stride when moving.
  ctx.fillStyle = '#3a3230';
  const stride = chef.moving ? Math.sin(chef.bob) * 5 : 0;
  ctx.fillRect(-11 + stride, 14, 9, 14);
  ctx.fillRect(2 - stride, 14, 9, 14);
  // Body: teal shirt, white apron with a pocket.
  ctx.fillStyle = '#2e8b8b';
  rr(ctx, -19, -6, 38, 34, 10); ctx.fill();
  ctx.fillStyle = '#fdfdf8';
  rr(ctx, -13, 2, 26, 26, 6); ctx.fill();
  ctx.strokeStyle = '#c9cfd4'; ctx.lineWidth = 1.5;
  ctx.strokeRect(-9, 12, 12, 9);
  // Red neckerchief.
  ctx.fillStyle = '#d84a35';
  ctx.beginPath(); ctx.moveTo(-8, -8); ctx.lineTo(8, -8); ctx.lineTo(0, 2); ctx.closePath(); ctx.fill();
  // Arms: the front arm reaches toward whatever the hands hold.
  ctx.fillStyle = '#2e8b8b';
  ctx.beginPath(); ctx.ellipse(-21, 8, 5.5, 12, 0.3, 0, 7); ctx.fill();
  ctx.beginPath(); ctx.ellipse(21, 8, 5.5, 12, -0.3, 0, 7); ctx.fill();
  ctx.fillStyle = '#f2c188';
  ctx.beginPath(); ctx.arc(-24, 18, 4.5, 0, 7); ctx.fill();
  ctx.beginPath(); ctx.arc(24, 18, 4.5, 0, 7); ctx.fill();
  // Head: a face, not a blank — eyes, brows, smile, blush — and a
  // tall toque with folds.
  ctx.fillStyle = '#f2c188';
  ctx.beginPath(); ctx.arc(0, -22, 15, 0, 7); ctx.fill();
  ctx.fillStyle = '#fdfdf8';
  rr(ctx, -13, -44, 26, 14, 6); ctx.fill();
  ctx.beginPath(); ctx.arc(-7, -44, 8, 0, 7); ctx.arc(7, -44, 8, 0, 7); ctx.arc(0, -48, 9, 0, 7); ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.12)'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(-13, -38); ctx.lineTo(13, -38); ctx.stroke();
  // Eyes with whites and pupils, brows, smile, blush.
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.ellipse(chef.facing * 4 - 5, -23, 3.4, 4, 0, 0, 7); ctx.fill();
  ctx.beginPath(); ctx.ellipse(chef.facing * 4 + 5, -23, 3.4, 4, 0, 0, 7); ctx.fill();
  ctx.fillStyle = INK;
  ctx.beginPath(); ctx.arc(chef.facing * 4 - 5, -23, 1.8, 0, 7); ctx.fill();
  ctx.beginPath(); ctx.arc(chef.facing * 4 + 5, -23, 1.8, 0, 7); ctx.fill();
  ctx.strokeStyle = INK; ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(chef.facing * 4 - 9, -29); ctx.lineTo(chef.facing * 4 - 1, -29);
  ctx.moveTo(chef.facing * 4 + 1, -29); ctx.lineTo(chef.facing * 4 + 9, -29);
  ctx.stroke();
  ctx.beginPath(); ctx.arc(chef.facing * 2, -16, 4.5, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
  ctx.fillStyle = 'rgba(232,120,90,0.55)';
  ctx.beginPath(); ctx.arc(-11, -17, 3, 0, 7); ctx.fill();
  ctx.beginPath(); ctx.arc(11, -17, 3, 0, 7); ctx.fill();
  // What the hands hold, in front — squash-and-stretch on the plate
  // when a dish is served (pop scale handled by the popup rise).
  if (chef.carry) {
    const hx = chef.facing * 20;
    if (chef.carry.type === 'item') drawFood(ctx, chef.carry.id, hx, 12, 16);
    else drawPlate(ctx, chef.carry.items, hx, 12, 24);
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
  ctx.fillStyle = 'rgba(43,24,10,0.62)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  // Batik frame around the whole cover.
  batikStrip(ctx, 0, 0, VIEW_W, 14);
  batikStrip(ctx, 0, VIEW_H - 14, VIEW_W, 14);
  ctx.save();
  ctx.translate(VIEW_W, 0); ctx.rotate(Math.PI / 2);
  batikStrip(ctx, 0, 0, VIEW_H, 14);
  ctx.restore();
  ctx.save();
  ctx.translate(0, VIEW_H); ctx.rotate(-Math.PI / 2);
  batikStrip(ctx, 0, 0, VIEW_H, 14);
  ctx.restore();
  // Wooden signboard behind the title, gold-trimmed.
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  rr(ctx, 308, 138, 664, 190, 18); ctx.fill();
  ctx.fillStyle = '#8a5a33';
  rr(ctx, 300, 130, 664, 190, 18); ctx.fill();
  ctx.strokeStyle = '#ffd94d'; ctx.lineWidth = 4;
  rr(ctx, 308, 138, 648, 174, 14); ctx.stroke();
  ctx.fillStyle = '#ffd94d';
  for (const [dx, dy] of [[322, 152], [942, 152], [322, 296], [942, 296]]) {
    ctx.beginPath();
    ctx.moveTo(dx, dy - 6); ctx.lineTo(dx + 6, dy); ctx.lineTo(dx, dy + 6); ctx.lineTo(dx - 6, dy);
    ctx.closePath(); ctx.fill();
  }
  displayText(ctx, 'SAJIAN!', 640, 216, 96, '#ffd94d');
  ctx.font = '800 32px "Liberation Serif", "DejaVu Serif", Georgia, serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = '#2b180a'; ctx.lineWidth = 5;
  ctx.strokeText('— WARUNG RUSH —', 640, 284);
  ctx.fillStyle = '#ffb35c';
  ctx.fillText('— WARUNG RUSH —', 640, 284);
  textOutlined(ctx, 'Run the stall: take tickets, chop, grill, plate and serve before patience runs out.', 640, 356, 20, CREAM, 'center', 700);
  const menu = game.menuToday;
  textOutlined(ctx, 'ON THE MENU', 640, 400, 16, '#ffd94d', 'center', 800);
  menu.forEach((recipe, i) => {
    const x = 640 + (i - (menu.length - 1) / 2) * 118;
    recipe.needs.forEach((need, j) => {
      drawFood(ctx, need, x + (j - (recipe.needs.length - 1) / 2) * 26, 436, 11);
    });
    text(ctx, recipe.name, x, 466, 12.5, CREAM, 'center', 700);
    textOutlined(ctx, `$${recipe.price}`, x, 484, 12.5, '#ffd94d', 'center', 800);
  });
  // Start button (clickable) and the controls.
  ctx.fillStyle = '#e8483f';
  rr(ctx, 520, 520, 240, 58, 14); ctx.fill();
  ctx.strokeStyle = '#ffd94d'; ctx.lineWidth = 3;
  rr(ctx, 524, 524, 232, 50, 11); ctx.stroke();
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
  displayText(ctx, game.stallClosed ? 'THE STALL CLOSES' : `DAY ${game.day} DONE!`, 640, 168, 52, '#ffd94d');
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
  // The regulars, happy at the bottom of the board — and the chef,
  // drawn again on top of the dim so the day ends on a face, not a ghost.
  const fans = [
    { id: 3, look: 1, patienceMax: 1, patienceLeft: 1 },
    { id: 5, look: 4, patienceMax: 1, patienceLeft: 1 },
    { id: 8, look: 0, patienceMax: 1, patienceLeft: 1 },
    { id: 2, look: 3, patienceMax: 1, patienceLeft: 1 },
  ];
  fans.forEach((fan, i) => drawCustomer(ctx, fan, 470 + i * 113, 748));
  // The chef takes a bow at the bottom-right of the board.
  const chef = game.chef;
  const ox = chef.x; const oy = chef.y; const of = chef.facing; const oc = chef.carry;
  chef.x = 1060; chef.y = 700; chef.facing = -1; chef.carry = null; chef.moving = false;
  drawChef(ctx, game);
  chef.x = ox; chef.y = oy; chef.facing = of; chef.carry = oc;
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

// The full frame: room, stations, tickets, customers, chef, effects,
// warm light, then any screen.
export function render(ctx, game) {
  ctx.clearRect(0, 0, VIEW_W, VIEW_H);
  drawRoom(ctx, game);
  drawTickets(ctx, game);
  drawCustomers(ctx, game);
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
  // Warm evening light: a soft vignette that keeps the centre bright.
  const vig = ctx.createRadialGradient(640, 380, 260, 640, 400, 780);
  vig.addColorStop(0, 'rgba(255,190,90,0)');
  vig.addColorStop(1, 'rgba(70,25,0,0.22)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
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
