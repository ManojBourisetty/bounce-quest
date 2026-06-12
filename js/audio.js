// Lightweight synthesized sound effects via Web Audio API.
// No audio files needed, so everything works offline out of the box.

// Gentle looping background score: a slow ambient pad cycling through a
// I-V-vi-IV chord progression (C - G - Am - F). Each chord is a sustained
// triad that fades in/out and cross-fades into the next, with no discrete
// note attacks, so it stays smooth no matter how it overlaps with SFX.
const MUSIC_TEMPO = 100; // BPM
const MUSIC_BEAT = 60 / MUSIC_TEMPO; // seconds per quarter note
const MUSIC_CHORDS = [
  [261.63, 329.63, 392.00], // C major (C4 E4 G4)
  [196.00, 246.94, 293.66], // G major (G3 B3 D4)
  [220.00, 261.63, 329.63], // A minor (A3 C4 E4)
  [174.61, 220.00, 261.63], // F major (F3 A3 C4)
];

export class AudioManager {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.musicGain = null;
    this.muted = false;
    this.musicMuted = false;
    this.musicPlaying = false;
    this.musicStep = 0;
    this.nextNoteTime = 0;
  }

  init() {
    if (this.ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.35;
    this.master.connect(this.ctx.destination);
    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = this.musicMuted ? 0 : 1;
    this.musicGain.connect(this.master);
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

  setMusicMuted(muted) {
    this.musicMuted = muted;
    if (this.musicGain) this.musicGain.gain.value = muted ? 0 : 1;
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

  startMusic() {
    if (!this.ctx || this.musicPlaying) return;
    this.musicPlaying = true;
    this.musicStep = 0;
    this.nextNoteTime = this.ctx.currentTime + 0.1;
  }

  // Lookahead scheduler: called every frame, queues up the next chord
  // shortly before it's due so timing stays sample-accurate even though
  // this is only driven by requestAnimationFrame.
  tickMusic() {
    if (!this.ctx || !this.musicPlaying || this.muted || this.musicMuted) return;
    const lookahead = 0.2;
    // If the tab was backgrounded and the clock jumped far ahead, resync
    // instead of firing a burst of "missed" chords.
    if (this.nextNoteTime < this.ctx.currentTime - 1) {
      this.nextNoteTime = this.ctx.currentTime + 0.05;
    }
    const barDuration = MUSIC_BEAT * 4;
    while (this.nextNoteTime < this.ctx.currentTime + lookahead) {
      const t0 = this.nextNoteTime;
      this.playPadChord(MUSIC_CHORDS[this.musicStep], t0, barDuration);
      this.nextNoteTime += barDuration;
      this.musicStep = (this.musicStep + 1) % MUSIC_CHORDS.length;
    }
  }

  // Sustained triad for each bar, fading in/out smoothly with no discrete
  // note attacks - the sole layer of the ambient background score.
  playPadChord(freqs, t0, dur) {
    freqs.forEach((freq) => {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t0);
      g.gain.setValueAtTime(0, t0);
      g.gain.linearRampToValueAtTime(0.035, t0 + 0.4);
      g.gain.setValueAtTime(0.035, t0 + dur - 0.4);
      g.gain.linearRampToValueAtTime(0.0001, t0 + dur);
      osc.connect(g);
      g.connect(this.musicGain);
      osc.start(t0);
      osc.stop(t0 + dur + 0.05);
    });
  }
}
