// Lightweight synthesized sound effects via Web Audio API.
// No audio files needed, so everything works offline out of the box.

export class AudioManager {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.muted = false;
  }

  init() {
    if (this.ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.35;
    this.master.connect(this.ctx.destination);
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setMuted(muted) {
    this.muted = muted;
    if (this.master) this.master.gain.value = muted ? 0 : 0.35;
  }

  tone(freq, duration, { type = 'sine', gain = 0.3, attack = 0.005, sweep = 0, delay = 0 } = {}) {
    if (!this.ctx || this.muted) return;
    const t0 = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (sweep) osc.frequency.exponentialRampToValueAtTime(Math.max(20, freq + sweep), t0 + duration);
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(gain, t0 + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
    osc.connect(g);
    g.connect(this.master);
    osc.start(t0);
    osc.stop(t0 + duration + 0.02);
  }

  jump() {
    this.tone(420, 0.16, { type: 'square', gain: 0.18, sweep: 260 });
  }

  land() {
    this.tone(150, 0.1, { type: 'sine', gain: 0.2, sweep: -60 });
  }

  star() {
    this.tone(660, 0.12, { type: 'sine', gain: 0.25, delay: 0 });
    this.tone(880, 0.12, { type: 'sine', gain: 0.25, delay: 0.07 });
    this.tone(1320, 0.18, { type: 'sine', gain: 0.22, delay: 0.14 });
  }

  spring() {
    this.tone(180, 0.28, { type: 'sawtooth', gain: 0.2, sweep: 520 });
  }

  hurt() {
    this.tone(220, 0.28, { type: 'sawtooth', gain: 0.22, sweep: -160 });
  }

  complete() {
    [523, 659, 784, 1047].forEach((f, i) => {
      this.tone(f, 0.32, { type: 'triangle', gain: 0.22, delay: i * 0.12 });
    });
  }

  click() {
    this.tone(500, 0.06, { type: 'square', gain: 0.12 });
  }

  swoosh() {
    this.tone(900, 0.18, { type: 'sine', gain: 0.1, sweep: -700 });
  }
}
