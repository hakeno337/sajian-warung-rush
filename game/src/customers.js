// customers.js — the waiting regulars. Each ticket on the rail belongs to
// a customer standing at the counter below it, so the room reads as a
// rush, not an empty floor. A customer has one of 10 distinct looks
// (skin, hair, hat, glasses, moustache, bow tie, hijab, ...) and a face
// that follows the ticket's patience: smile while there is time, anxious
// as it drains, angry — with a red "!" badge — when it is nearly gone.
// Poses are deterministic (phased by order id), so screenshots are stable.

const LOOKS = [
  // skin, hair, hairStyle, shirt, extras
  { skin: '#f2c188', hair: '#2b2118', style: 'short',  shirt: '#d84a35', extras: [] },
  { skin: '#f7d7b0', hair: '#e8c25a', style: 'bun',    shirt: '#4a7fb5', extras: ['earrings'] },
  { skin: '#e8b184', hair: '#3a2a1a', style: 'cap',    shirt: '#e8b93c', extras: ['glasses', 'moustache'], cap: '#4d9427' },
  { skin: '#8a5a3b', hair: '#1c1410', style: 'hijab',  shirt: '#2e8b8b', extras: [], hijab: '#7a4a9e' },
  { skin: '#f2c188', hair: '#5a3a22', style: 'beanie', shirt: '#8a5a33', extras: ['beard'], cap: '#e07840' },
  { skin: '#e8b184', hair: '#2b2118', style: 'bandana', shirt: '#fdfdf8', extras: ['bowtie'], cap: '#d84a35' },
  { skin: '#f7d7b0', hair: '#1c1410', style: 'bob',    shirt: '#e87aa8', extras: ['glasses'] },
  { skin: '#c98d5f', hair: '#1c1410', style: 'peci',   shirt: '#4d9427', extras: ['moustache'], cap: '#1c1410' },
  { skin: '#f7d7b0', hair: '#c0392b', style: 'curly',  shirt: '#e07840', extras: ['freckles'] },
  { skin: '#e8b184', hair: '#1c1410', style: 'hijab',  shirt: '#7a5fc0', extras: ['glasses'], hijab: '#2e6db5' },
];

export const CUSTOMER_LOOKS = LOOKS.length;

export function moodOf(order) {
  const frac = order.patienceMax > 0 ? order.patienceLeft / order.patienceMax : 1;
  if (frac > 0.6) return 'happy';
  if (frac >= 0.3) return 'anxious';
  return 'angry';
}

function has(look, extra) {
  return LOOKS[look].extras.includes(extra);
}

// Draw one customer standing at the counter, feet at (x, y), facing the
// kitchen (toward the viewer). About 88 px tall: big enough to read at
// small size, small enough to leave the floor to the chef.
export function drawCustomer(ctx, order, x, y) {
  const look = LOOKS[(order.look ?? 0) % LOOKS.length];
  const mood = moodOf(order);
  const phase = Math.sin((order.id || 1) * 1.7);
  const lean = ((order.id || 1) % 3 - 1) * 0.035;
  ctx.save();
  ctx.translate(x, y + phase * 2);
  ctx.rotate(lean);
  // Shadow.
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  ctx.beginPath(); ctx.ellipse(0, 2, 24, 7, 0, 0, 7); ctx.fill();
  // Legs.
  ctx.fillStyle = '#3a3230';
  ctx.fillRect(-13, -30, 11, 30);
  ctx.fillRect(2, -30, 11, 30);
  // Body: shirt with a collar and buttons.
  ctx.fillStyle = look.shirt;
  ctx.beginPath(); ctx.roundRect(-21, -66, 42, 40, 9); ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,0.12)';
  ctx.beginPath(); ctx.roundRect(-21, -66, 42, 10, 9); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.beginPath(); ctx.moveTo(-6, -66); ctx.lineTo(6, -66); ctx.lineTo(0, -56); ctx.closePath(); ctx.fill();
  if (has((order.look ?? 0) % LOOKS.length, 'bowtie')) {
    ctx.fillStyle = '#d84a35';
    ctx.beginPath(); ctx.moveTo(0, -56); ctx.lineTo(-9, -62); ctx.lineTo(-9, -50); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(0, -56); ctx.lineTo(9, -62); ctx.lineTo(9, -50); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.arc(0, -56, 2.5, 0, 7); ctx.fill();
  }
  // Arms at the sides, one hand on the counter when waiting.
  ctx.fillStyle = look.shirt;
  ctx.beginPath(); ctx.ellipse(-23, -46, 6, 14, 0.25, 0, 7); ctx.fill();
  ctx.beginPath(); ctx.ellipse(23, -46, 6, 14, -0.25, 0, 7); ctx.fill();
  ctx.fillStyle = look.skin;
  ctx.beginPath(); ctx.arc(-26, -33, 5, 0, 7); ctx.fill();
  ctx.beginPath(); ctx.arc(26, -33, 5, 0, 7); ctx.fill();

  // Head.
  const hy = -82;
  ctx.fillStyle = look.skin;
  ctx.beginPath(); ctx.arc(0, hy, 16, 0, 7); ctx.fill();
  // Hijab covers hair and drapes to the shoulders.
  if (look.style === 'hijab') {
    ctx.fillStyle = look.hijab;
    ctx.beginPath(); ctx.arc(0, hy - 2, 18.5, Math.PI, 0); ctx.fill();
    ctx.beginPath(); ctx.ellipse(-15, hy + 8, 7, 14, 0.3, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.ellipse(15, hy + 8, 7, 14, -0.3, 0, 7); ctx.fill();
    ctx.fillStyle = look.skin;
    ctx.beginPath(); ctx.arc(0, hy, 14.5, 0, 7); ctx.fill();
  } else if (look.style === 'cap' || look.style === 'peci' || look.style === 'beanie') {
    ctx.fillStyle = look.hair;
    ctx.beginPath(); ctx.arc(0, hy - 1, 15.5, Math.PI, 0); ctx.fill();
    ctx.fillStyle = look.cap;
    if (look.style === 'cap') {
      ctx.beginPath(); ctx.arc(0, hy - 3, 16, Math.PI, 0); ctx.fill();
      ctx.fillRect(-16, hy - 5, 32, 5);
      ctx.beginPath(); ctx.ellipse(6, hy - 2, 13, 4, 0.15, 0, 7); ctx.fill();
    } else if (look.style === 'peci') {
      ctx.beginPath(); ctx.ellipse(0, hy - 8, 14, 8, 0, Math.PI, 0); ctx.fill();
      ctx.fillRect(-14, hy - 9, 28, 6);
    } else {
      ctx.beginPath(); ctx.arc(0, hy - 4, 16.5, Math.PI, 0); ctx.fill();
      ctx.fillRect(-16.5, hy - 6, 33, 6);
      ctx.beginPath(); ctx.arc(0, hy - 18, 4, 0, 7); ctx.fill();
    }
  } else if (look.style === 'bandana') {
    ctx.fillStyle = look.cap;
    ctx.beginPath(); ctx.arc(0, hy - 2, 16.5, Math.PI, 0); ctx.fill();
    ctx.fillRect(-16.5, hy - 5, 33, 6);
    ctx.beginPath(); ctx.moveTo(14, hy - 8); ctx.lineTo(24, -2); ctx.lineTo(18, 0); ctx.closePath(); ctx.fill();
  } else if (look.style === 'bun') {
    ctx.fillStyle = look.hair;
    ctx.beginPath(); ctx.arc(0, hy - 2, 15.5, Math.PI * 0.95, Math.PI * 2.05); ctx.fill();
    ctx.beginPath(); ctx.arc(0, hy - 17, 7, 0, 7); ctx.fill();
  } else if (look.style === 'bob') {
    ctx.fillStyle = look.hair;
    ctx.beginPath(); ctx.arc(0, hy - 1, 16, Math.PI, 0); ctx.fill();
    ctx.beginPath(); ctx.ellipse(-14, hy + 4, 5, 10, 0.2, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.ellipse(14, hy + 4, 5, 10, -0.2, 0, 7); ctx.fill();
  } else if (look.style === 'curly') {
    ctx.fillStyle = look.hair;
    for (const [dx, dy] of [[-11, -8], [-4, -14], [5, -14], [12, -7], [0, -10]]) {
      ctx.beginPath(); ctx.arc(dx, hy + dy, 7, 0, 7); ctx.fill();
    }
  } else {
    ctx.fillStyle = look.hair;
    ctx.beginPath(); ctx.arc(0, hy - 2, 15.5, Math.PI, 0); ctx.fill();
  }

  // Face: mood drives eyes, brows and mouth.
  const angry = mood === 'angry';
  const anxious = mood === 'anxious';
  if (angry) {
    ctx.fillStyle = 'rgba(232,72,63,0.35)';
    ctx.beginPath(); ctx.arc(-8, hy - 1, 5, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.arc(8, hy - 1, 5, 0, 7); ctx.fill();
  }
  // Eyes.
  ctx.fillStyle = '#241408';
  if (mood === 'happy') {
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#241408';
    ctx.beginPath(); ctx.arc(-6, hy - 1, 3.4, Math.PI, 0); ctx.stroke();
    ctx.beginPath(); ctx.arc(6, hy - 1, 3.4, Math.PI, 0); ctx.stroke();
  } else {
    ctx.beginPath(); ctx.arc(-6, hy - 1, 2.2, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.arc(6, hy - 1, 2.2, 0, 7); ctx.fill();
  }
  // Brows.
  ctx.strokeStyle = '#241408';
  ctx.lineWidth = 2;
  ctx.beginPath();
  if (angry) { ctx.moveTo(-10, hy - 9); ctx.lineTo(-2, hy - 5); ctx.moveTo(10, hy - 9); ctx.lineTo(2, hy - 5); }
  else if (anxious) { ctx.moveTo(-10, hy - 5); ctx.lineTo(-2, hy - 8); ctx.moveTo(10, hy - 5); ctx.lineTo(2, hy - 8); }
  else { ctx.moveTo(-10, hy - 7); ctx.lineTo(-2, hy - 7); ctx.moveTo(10, hy - 7); ctx.lineTo(2, hy - 7); }
  ctx.stroke();
  // Mouth.
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  if (mood === 'happy') {
    ctx.arc(0, hy + 5, 5.5, 0.15 * Math.PI, 0.85 * Math.PI);
  } else if (anxious) {
    for (let i = 0; i < 3; i++) {
      const mx = -6 + i * 6;
      ctx.moveTo(mx, hy + 8);
      ctx.quadraticCurveTo(mx + 3, hy + 5, mx + 6, hy + 8);
    }
  } else {
    ctx.arc(0, hy + 13, 5, 1.15 * Math.PI, 1.85 * Math.PI);
  }
  ctx.stroke();
  if (mood === 'happy') {
    ctx.fillStyle = 'rgba(232,120,90,0.55)';
    ctx.beginPath(); ctx.arc(-11, hy + 4, 3, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.arc(11, hy + 4, 3, 0, 7); ctx.fill();
  }
  if (has((order.look ?? 0) % LOOKS.length, 'freckles')) {
    ctx.fillStyle = 'rgba(120,60,20,0.7)';
    for (const [dx, dy] of [[-9, 2], [-7, 5], [9, 2], [7, 5]]) {
      ctx.beginPath(); ctx.arc(dx, hy + dy, 1.1, 0, 7); ctx.fill();
    }
  }
  if (has((order.look ?? 0) % LOOKS.length, 'moustache')) {
    ctx.fillStyle = '#3a2a1a';
    ctx.beginPath(); ctx.ellipse(-4, hy + 7, 5.5, 2.2, -0.2, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.ellipse(4, hy + 7, 5.5, 2.2, 0.2, 0, 7); ctx.fill();
  }
  if (has((order.look ?? 0) % LOOKS.length, 'beard')) {
    ctx.fillStyle = '#5a3a22';
    ctx.beginPath(); ctx.arc(0, hy + 6, 10, 0, Math.PI); ctx.fill();
  }
  if (has((order.look ?? 0) % LOOKS.length, 'glasses')) {
    ctx.strokeStyle = '#241408';
    ctx.lineWidth = 1.8;
    ctx.beginPath(); ctx.arc(-6, hy - 1, 5, 0, 7); ctx.stroke();
    ctx.beginPath(); ctx.arc(6, hy - 1, 5, 0, 7); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-1, hy - 1); ctx.lineTo(1, hy - 1); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-11, hy - 1); ctx.lineTo(-15, hy - 3); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(11, hy - 1); ctx.lineTo(15, hy - 3); ctx.stroke();
  }
  if (has((order.look ?? 0) % LOOKS.length, 'earrings')) {
    ctx.fillStyle = '#ffd94d';
    ctx.beginPath(); ctx.arc(-15, hy + 5, 1.8, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.arc(15, hy + 5, 1.8, 0, 7); ctx.fill();
  }
  // Anxious sweat drop / angry "!" badge.
  if (anxious) {
    ctx.fillStyle = '#7ec8e8';
    ctx.beginPath(); ctx.moveTo(17, hy - 12); ctx.quadraticCurveTo(22, hy - 4, 17, hy - 2);
    ctx.quadraticCurveTo(12, hy - 4, 17, hy - 12); ctx.fill();
  }
  if (angry) {
    ctx.fillStyle = '#e8483f';
    ctx.beginPath(); ctx.arc(20, hy - 22, 9, 0, 7); ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(20, hy - 22, 9, 0, 7); ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.font = '800 13px "Trebuchet MS", sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('!', 20, hy - 22);
  }
  ctx.restore();
}
