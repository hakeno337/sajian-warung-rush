// audio.js — every sound in the game is synthesised here with WebAudio:
// short oscillator blips and filtered noise bursts. No audio files, no
// samples, nothing borrowed — chop, sizzle, ding and the till are all
// cooked up from oscillators the moment they are needed.

export class Sfx {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.muted = false;
  }

  // Browsers only let audio start after a gesture; the game calls unlock()
  // on the first key press or click.
  unlock() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }
    const AudioCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtor) return;
    this.ctx = new AudioCtor();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.5;
    this.master.connect(this.ctx.destination);
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.master) this.master.gain.value = this.muted ? 0 : 0.5;
    return this.muted;
  }

  tone(freq, dur, type = 'square', vol = 0.2, slideTo = null, delay = 0) {
    if (!this.ctx || this.muted) return;
    const t0 = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    gain.gain.setValueAtTime(vol, t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    osc.connect(gain).connect(this.master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  noise(dur, vol = 0.25, freq = 1800, delay = 0) {
    if (!this.ctx || this.muted) return;
    const t0 = this.ctx.currentTime + delay;
    const len = Math.max(1, Math.floor(this.ctx.sampleRate * dur));
    const buffer = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = freq;
    filter.Q.value = 0.8;
    const gain = this.ctx.createGain();
    gain.gain.value = vol;
    src.connect(filter).connect(gain).connect(this.master);
    src.start(t0);
  }

  click()  { this.tone(660, 0.05, 'square', 0.12); }
  pickup() { this.tone(440, 0.07, 'triangle', 0.2, 660); }
  place()  { this.tone(300, 0.06, 'triangle', 0.18, 220); }
  chop()   { this.noise(0.07, 0.3, 900); this.tone(140, 0.05, 'square', 0.1); }
  sizzle() { this.noise(0.35, 0.10, 3200); }
  ding()   { this.tone(1175, 0.18, 'sine', 0.25); this.tone(1568, 0.3, 'sine', 0.2, null, 0.09); }
  burnt()  { this.tone(196, 0.25, 'sawtooth', 0.15, 98); }
  error()  { this.tone(160, 0.12, 'square', 0.15); }
  serve() {
    // The till: a quick rising arpeggio and a coin sparkle.
    this.tone(784, 0.09, 'square', 0.16);
    this.tone(988, 0.09, 'square', 0.16, null, 0.07);
    this.tone(1319, 0.16, 'square', 0.18, null, 0.14);
    this.noise(0.12, 0.06, 5200, 0.14);
  }
  expire() {
    this.tone(392, 0.16, 'triangle', 0.2);
    this.tone(330, 0.16, 'triangle', 0.2, null, 0.14);
    this.tone(262, 0.3, 'triangle', 0.2, null, 0.28);
  }
  dayEnd(win) {
    const base = win ? [523, 659, 784, 1047] : [440, 415, 392, 370];
    base.forEach((f, i) => this.tone(f, 0.22, 'triangle', 0.2, null, i * 0.13));
  }
}
