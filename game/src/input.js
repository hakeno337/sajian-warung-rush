// input.js — the keyboard, read two ways: `down` for keys held right now
// (movement), and `pressed` for keys that went down since the last frame
// (interactions, menus). Mouse clicks are reported as canvas coordinates
// through a small queue the menu buttons drain.

const GAME_KEYS = new Set([
  'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
  'KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyE', 'KeyQ', 'Space',
  'Enter', 'KeyP', 'KeyM', 'KeyR',
]);

export class Input {
  constructor(canvas) {
    this.down = new Set();
    this.pressed = new Set();
    this.clicks = [];
    this.canvas = canvas;

    addEventListener('keydown', (event) => {
      if (GAME_KEYS.has(event.code)) event.preventDefault();
      if (!event.repeat) this.pressed.add(event.code);
      this.down.add(event.code);
    });
    addEventListener('keyup', (event) => this.down.delete(event.code));
    addEventListener('blur', () => this.down.clear());

    canvas.addEventListener('pointerdown', (event) => {
      const rect = canvas.getBoundingClientRect();
      this.clicks.push({
        x: ((event.clientX - rect.left) / rect.width) * canvas.width,
        y: ((event.clientY - rect.top) / rect.height) * canvas.height,
      });
    });
  }

  // Movement as a unit-ish vector from WASD or the arrow keys.
  axis() {
    let x = 0;
    let y = 0;
    if (this.down.has('KeyA') || this.down.has('ArrowLeft')) x -= 1;
    if (this.down.has('KeyD') || this.down.has('ArrowRight')) x += 1;
    if (this.down.has('KeyW') || this.down.has('ArrowUp')) y -= 1;
    if (this.down.has('KeyS') || this.down.has('ArrowDown')) y += 1;
    return { x, y };
  }

  wasPressed(...codes) {
    return codes.some((code) => this.pressed.has(code));
  }

  takeClicks() {
    const clicks = this.clicks;
    this.clicks = [];
    return clicks;
  }

  // Called once at the end of every frame: edge presses last one frame.
  endFrame() {
    this.pressed.clear();
  }
}
