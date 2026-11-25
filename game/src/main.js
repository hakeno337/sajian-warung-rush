// main.js — Sajian! Warung Rush: the day loop and the score. Owns the
// game state machine (title → playing ⇄ paused → results), the clock,
// coins, combo and stars, serving and scoring, the floating score popups
// and steam/chop particles, and the frame loop that ties input, chef,
// kitchen and renderer together.

import { BALANCE, RECIPES } from './config.js';
import { makeRng, seedFromAddress } from './random.js';
import { Sfx } from './audio.js';
import { Input } from './input.js';
import { nearestStation, stationById } from './world.js';
import { Cooking } from './cooking.js';
import { Orders } from './orders.js';
import { Chef } from './chef.js';
import { render } from './render.js';
import { poseShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const status = document.getElementById('status');

class Game {
  constructor() {
    this.sfx = new Sfx();
    this.input = new Input(canvas);
    this.seed = seedFromAddress();
    this.state = 'title';
    this.time = 0;
    this.day = 1;
    this.dayLength = BALANCE.daySeconds;
    this.elapsed = 0;
    this.timeLeft = this.dayLength;
    this.coins = 0;
    this.combo = 0;
    this.stars = BALANCE.starsStart;
    this.servedCount = 0;
    this.expiredCount = 0;
    this.bestComboDay = 0;
    this.bestCoins = 0;
    this.stallClosed = false;
    this.lastDay = { served: 0, coins: 0, expired: 0, bestCombo: 0, verdict: '' };
    this.popups = [];
    this.particles = [];
    this.steamT = 0;
    this.frozen = false;
    this.menuToday = RECIPES;
    try {
      this.bestCoins = Number(localStorage.getItem('sajian-best')) || 0;
    } catch {
      this.bestCoins = 0;
    }
    this.resetKitchen(1);
    const shot = new URLSearchParams(location.search).get('shot');
    if (shot) poseShot(this, shot);
  }

  resetKitchen(day) {
    const rng = makeRng(this.seed + day * 7919);
    this.cooking = new Cooking(this.sfx);
    this.orders = new Orders(rng, this.sfx);
    this.orders.pace = Math.max(0.68, 1 - 0.07 * (day - 1));
    this.orders.onExpire = (order) => this.ticketExpired(order);
    this.chef = new Chef();
    this.activeStation = null;
  }

  startDay(day) {
    this.day = day;
    this.resetKitchen(day);
    this.elapsed = 0;
    this.timeLeft = this.dayLength;
    this.coins = 0;
    this.combo = 0;
    this.stars = BALANCE.starsStart;
    this.servedCount = 0;
    this.expiredCount = 0;
    this.bestComboDay = 0;
    this.stallClosed = false;
    this.popups = [];
    this.particles = [];
    this.frozen = false;
    this.state = 'playing';
    this.announce(`Day ${day}. The stall is open.`);
    this.sfx.click();
  }

  endDay(closed) {
    this.stallClosed = closed;
    this.lastDay = {
      served: this.servedCount,
      coins: this.coins,
      expired: this.expiredCount,
      bestCombo: this.bestComboDay,
      verdict: closed
        ? 'Three walk-aways closed the stall early. Tomorrow, prep ahead of the rush.'
        : this.servedCount >= 14
          ? 'The room hums — regulars are asking for you by name.'
          : this.servedCount >= 9
            ? 'A solid service. The grill hand earns their apron.'
            : 'A gentle day. Sharper routes through the kitchen will pay.',
    };
    if (this.coins > this.bestCoins) {
      this.bestCoins = this.coins;
      try {
        localStorage.setItem('sajian-best', String(this.bestCoins));
      } catch {
        /* private mode: the best day is only remembered for this visit */
      }
    }
    this.state = 'over';
    this.sfx.dayEnd(!closed);
    this.announce(closed ? 'The stall closed early.' : `Day ${this.day} done.`);
  }

  ticketExpired(order) {
    this.stars -= 1;
    this.combo = 0;
    this.expiredCount += 1;
    const index = Math.max(0, this.orders.list.indexOf(order));
    this.popup(150 + index * 292 + 136, 210, 'Walked away!', '#e8483f', 19);
    if (this.stars <= 0 && this.state === 'playing') this.endDay(true);
  }

  // The pass's hook: a plate leaves the chef's hands only for its ticket.
  serve(plate) {
    const order = this.orders.matchFor(plate.items);
    if (!order) {
      this.popup(1176, 560, 'No ticket for that plate!', '#e8483f', 17);
      return false;
    }
    this.orders.serve(order);
    const tip = Math.round(order.recipe.price * BALANCE.tipFraction
      * (order.patienceLeft / order.patienceMax));
    const comboMult = 1 + Math.min(this.combo, BALANCE.comboMax) * BALANCE.comboStep;
    const take = Math.round((order.recipe.price + tip) * comboMult);
    this.coins += take;
    this.combo += 1;
    this.bestComboDay = Math.max(this.bestComboDay, this.combo);
    this.servedCount += 1;
    this.popup(1176, 540, `+$${take}`, '#2e7d32', 26);
    if (tip > 0) this.popup(1176, 576, `tip $${tip}`, '#8a6d1f', 15);
    this.burst(1176, 620, '#ffd94d', 10);
    this.sfx.serve();
    return true;
  }

  popup(x, y, text, colour, size = 20) {
    this.popups.push({ x, y, text, colour, size, t: 1.15, life: 1.15 });
  }

  burst(x, y, colour, count) {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const v = 30 + Math.random() * 70;
      this.particles.push({
        x, y,
        vx: Math.cos(a) * v, vy: Math.sin(a) * v - 30,
        t: 0.5 + Math.random() * 0.4, life: 0.9,
        colour, size: 2 + Math.random() * 3,
      });
    }
  }

  steamFromKitchen(dt) {
    this.steamT -= dt;
    if (this.steamT > 0) return;
    this.steamT = 0.14;
    for (const id of ['grill', 'fryer']) {
      const station = stationById(id);
      const slots = this.cooking.slotList(station);
      slots.forEach((slot, i) => {
        if (slot && slot.phase !== 'burnt' && Math.random() < 0.6) {
          this.particles.push({
            x: station.x + (i === 0 ? -26 : 26) + (Math.random() * 10 - 5),
            y: station.y - 14,
            vx: Math.random() * 8 - 4, vy: -34 - Math.random() * 22,
            t: 0.8, life: 0.8,
            colour: 'rgba(255,255,255,0.75)', size: 3 + Math.random() * 4,
          });
        }
      });
    }
  }

  announce(message) {
    if (status) status.textContent = message;
  }

  handleClicks() {
    for (const click of this.input.takeClicks()) {
      this.sfx.unlock();
      if (this.state === 'title'
          && click.x >= 520 && click.x <= 760 && click.y >= 520 && click.y <= 578) {
        this.startDay(1);
      } else if (this.state === 'over'
          && click.x >= 500 && click.x <= 780 && click.y >= 540 && click.y <= 596) {
        this.startDay(this.stallClosed ? 1 : this.day + 1);
      }
    }
  }

  update(dt) {
    this.time += dt;
    this.handleClicks();
    if (this.input.wasPressed('KeyM')) {
      this.sfx.unlock();
      this.sfx.toggleMute();
    }
    // Floating text and particles always drift, even on frozen shot poses.
    for (const p of this.particles) {
      p.t -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 60 * dt;
    }
    this.particles = this.particles.filter((p) => p.t > 0);
    for (const pop of this.popups) pop.t -= dt;
    this.popups = this.popups.filter((pop) => pop.t > 0);

    if (this.frozen) return;

    if (this.state === 'title' && this.input.wasPressed('Enter')) this.startDay(1);
    if (this.state === 'over' && this.input.wasPressed('Enter')) {
      this.startDay(this.stallClosed ? 1 : this.day + 1);
    }
    if (this.state === 'playing' && this.input.wasPressed('KeyP')) {
      this.state = 'paused';
      this.sfx.click();
      return;
    }
    if (this.state === 'paused') {
      if (this.input.wasPressed('KeyP')) {
        this.state = 'playing';
        this.sfx.click();
      }
      return;
    }
    if (this.state !== 'playing') return;

    this.elapsed += dt;
    this.timeLeft = this.dayLength - this.elapsed;
    if (this.timeLeft <= 0) {
      this.endDay(false);
      return;
    }
    this.chef.update(dt, this.input);
    this.activeStation = nearestStation(this.chef);
    this.cooking.update(dt);
    this.orders.update(dt, this.elapsed);
    this.steamFromKitchen(dt);
    if (this.input.wasPressed('KeyE', 'Space')) {
      this.sfx.unlock();
      this.chef.interact(this.activeStation, {
        cooking: this.cooking,
        sfx: this.sfx,
        serve: (plate) => this.serve(plate),
      });
    }
  }
}

const game = new Game();
let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  game.update(dt);
  render(ctx, game);
  game.input.endFrame();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// A handle for the maker's own play-tests and screenshot poses.
window.sajian = game;
