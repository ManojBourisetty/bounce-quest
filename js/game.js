import { WORLD_HEIGHT, SPRING_VELOCITY, CAMERA_LERP } from './constants.js';
import { LEVELS, THEMES } from './levels.js';
import { Player } from './player.js';
import { ParticleSystem } from './particles.js';
import { InputManager } from './input.js';
import { AudioManager } from './audio.js';
import { renderBackground } from './background.js';
import { renderLevel } from './levelRenderer.js';
import { clamp, aabbOverlap } from './utils.js';

const STORAGE_KEY = 'bounceQuest.progress.v1';
const MUTE_KEY = 'bounceQuest.muted';

function loadProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      if (data && Array.isArray(data.levels) && data.levels.length === LEVELS.length) return data;
    }
  } catch (e) {
    /* ignore */
  }
  return { unlocked: 0, levels: LEVELS.map(() => ({ stars: 0, bestTime: null })) };
}

function saveProgress(progress) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch (e) {
    /* ignore */
  }
}

function starsHTML(count) {
  let s = '';
  for (let i = 0; i < 3; i++) {
    s += `<span class="star${i < count ? ' filled' : ''}">★</span>`;
  }
  return s;
}

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.audio = new AudioManager();
    this.input = new InputManager();
    this.particles = new ParticleSystem();

    this.progress = loadProgress();

    this.state = 'title';
    this.currentLevelIndex = 0;
    this.level = LEVELS[0];
    this.player = new Player(this.level.playerStart.x, this.level.playerStart.y);
    this.camera = { x: 0 };
    this.collectedStars = new Set();
    this.springOverlap = this.level.springs.map(() => false);
    this.springStates = this.level.springs.map(() => 0);
    this.time = 0;
    this.globalTime = 0;
    this.respawning = false;
    this.respawnTimeout = null;
    this.runDustTimer = 0;

    this.scale = 1;
    this.visibleWidth = 0;

    this.cacheDom();
    this.bindUI();
    this.resize();
    window.addEventListener('resize', () => this.resize());
    window.addEventListener('orientationchange', () => setTimeout(() => this.resize(), 200));

    this.renderLevelSelect();
    this.showScreen('title');

    this.lastTime = performance.now();
    requestAnimationFrame(this.loop.bind(this));
  }

  cacheDom() {
    const id = (x) => document.getElementById(x);
    this.dom = {
      titleScreen: id('title-screen'),
      levelSelect: id('level-select'),
      hud: id('hud'),
      controls: id('controls'),
      pauseScreen: id('pause-screen'),
      completeScreen: id('complete-screen'),
      respawnFlash: id('respawn-flash'),
      rotateHint: id('rotate-hint'),
      levelGrid: id('level-grid'),
      starCount: id('star-count'),
      hudLevelName: id('hud-level-name'),
      hudTime: id('hud-time'),
      levelToast: id('level-toast'),
      completeTitle: id('complete-title'),
      completeStars: id('complete-stars'),
      completeTime: id('complete-time'),
      completeNextBtn: id('complete-next-btn'),
    };
  }

  bindUI() {
    const a = this.audio;
    const initAudio = () => {
      a.init();
      a.resume();
    };
    window.addEventListener('pointerdown', initAudio, { once: true });

    const muted = localStorage.getItem(MUTE_KEY) === 'true';
    a.setMuted(muted);
    document.querySelectorAll('.mute-btn').forEach((btn) => {
      btn.textContent = muted ? '\u{1F507}' : '\u{1F50A}';
      btn.addEventListener('click', () => {
        const m = !a.muted;
        a.setMuted(m);
        localStorage.setItem(MUTE_KEY, String(m));
        document.querySelectorAll('.mute-btn').forEach((b) => (b.textContent = m ? '\u{1F507}' : '\u{1F50A}'));
        a.click();
      });
    });

    document.getElementById('play-btn').addEventListener('click', () => {
      a.click();
      this.goToLevelSelect();
    });

    document.querySelectorAll('.back-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        a.click();
        this.goToTitle();
      });
    });

    document.getElementById('pause-btn').addEventListener('click', () => {
      a.click();
      this.pause();
    });
    document.getElementById('resume-btn').addEventListener('click', () => {
      a.click();
      this.resume();
    });
    document.getElementById('restart-btn').addEventListener('click', () => {
      a.click();
      this.restartLevel();
    });
    document.getElementById('pause-menu-btn').addEventListener('click', () => {
      a.click();
      this.goToLevelSelect();
    });

    document.getElementById('complete-replay-btn').addEventListener('click', () => {
      a.click();
      this.restartLevel();
    });
    document.getElementById('complete-next-btn').addEventListener('click', () => {
      a.click();
      this.startLevel(this.currentLevelIndex + 1);
    });
    document.getElementById('complete-menu-btn').addEventListener('click', () => {
      a.click();
      this.goToLevelSelect();
    });
  }

  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.canvas.width = Math.max(1, Math.round(w * dpr));
    this.canvas.height = Math.max(1, Math.round(h * dpr));
    this.canvas.style.width = w + 'px';
    this.canvas.style.height = h + 'px';
    this.scale = this.canvas.height / WORLD_HEIGHT;
    this.visibleWidth = this.canvas.width / this.scale;

    const isPortrait = h > w;
    const isSmall = Math.min(w, h) < 620;
    this.dom.rotateHint.classList.toggle('hidden', !(isPortrait && isSmall));
  }

  loop(now) {
    let dt = (now - this.lastTime) / 1000;
    this.lastTime = now;
    if (!Number.isFinite(dt) || dt < 0) dt = 0;
    dt = Math.min(dt, 0.033);

    this.globalTime += dt;
    this.particles.update(dt);

    if (this.state === 'playing') {
      if (!this.respawning) this.updatePlaying(dt);
    } else {
      this.player.idleTick(dt);
    }

    this.input.endFrame();
    this.render();

    requestAnimationFrame(this.loop.bind(this));
  }

  updatePlaying(dt) {
    this.time += dt;
    this.dom.hudTime.textContent = this.time.toFixed(1) + 's';

    for (const p of this.level.platforms) {
      if (p.type === 'moving') {
        const prevX = p.x;
        const prevY = p.y;
        const off = Math.sin(this.globalTime * p.speed + p.phase) * p.amplitude;
        if (p.axis === 'x') p.x = p.baseX + off;
        else p.y = p.baseY + off;
        p.dx = p.x - prevX;
        p.dy = p.y - prevY;
      }
    }

    for (let i = 0; i < this.springStates.length; i++) {
      if (this.springStates[i] > 0) this.springStates[i] -= dt;
    }

    const player = this.player;
    player.update(dt, this.input, this.level.platforms);

    if (player.justJumped) {
      this.audio.jump();
      this.particles.dust(player.x + player.w / 2, player.y + player.h, 5);
    }
    if (player.justLanded) {
      this.audio.land();
      this.particles.dust(player.x + player.w / 2, player.y + player.h, 8);
    }
    if (player.grounded && Math.abs(player.vx) > 30) {
      this.runDustTimer -= dt;
      if (this.runDustTimer <= 0) {
        this.particles.dust(player.x + player.w / 2, player.y + player.h, 1);
        this.runDustTimer = 0.07;
      }
    }

    // Spikes
    for (const s of this.level.spikes) {
      if (aabbOverlap(player.x, player.y, player.w, player.h, s.x, s.y, s.w, s.h)) {
        this.killPlayer();
        return;
      }
    }

    // Springs (rising-edge trigger)
    this.level.springs.forEach((s, i) => {
      const overlap = aabbOverlap(player.x, player.y, player.w, player.h, s.x, s.y, s.w, s.h);
      if (overlap && !this.springOverlap[i]) {
        player.bounce(SPRING_VELOCITY);
        this.audio.spring();
        this.springStates[i] = 0.25;
        this.particles.sparkle(s.x + s.w / 2, s.y, '#FFB23E', 12);
      }
      this.springOverlap[i] = overlap;
    });

    // Stars
    this.level.stars.forEach((star, i) => {
      if (!this.collectedStars.has(i)) {
        if (aabbOverlap(player.x, player.y, player.w, player.h, star.x - star.r, star.y - star.r, star.r * 2, star.r * 2)) {
          this.collectedStars.add(i);
          this.audio.star();
          this.particles.sparkle(star.x, star.y, '#FFD93D', 18);
          this.updateHUDStars();
        }
      }
    });

    // Goal
    const g = this.level.goal;
    if (aabbOverlap(player.x, player.y, player.w, player.h, g.x - 16, g.y - 130, 32, 130)) {
      this.completeLevel();
      return;
    }

    // Fell off the world
    if (player.y > WORLD_HEIGHT + 80) {
      this.killPlayer();
      return;
    }

    // Camera follow
    const maxCam = Math.max(0, this.level.width - this.visibleWidth);
    const targetX = clamp(player.x + player.w / 2 - this.visibleWidth / 2, 0, maxCam);
    this.camera.x += (targetX - this.camera.x) * Math.min(1, dt * CAMERA_LERP);
  }

  killPlayer() {
    if (this.respawning) return;
    this.respawning = true;
    this.audio.hurt();
    this.particles.poof(this.player.x + this.player.w / 2, this.player.y + this.player.h / 2, 16);
    this.flashRespawn();
    if (this.respawnTimeout) clearTimeout(this.respawnTimeout);
    this.respawnTimeout = setTimeout(() => {
      this.player.reset();
      this.springOverlap = this.level.springs.map(() => false);
      const maxCam = Math.max(0, this.level.width - this.visibleWidth);
      this.camera.x = clamp(this.player.x - this.visibleWidth / 2, 0, maxCam);
      this.respawning = false;
    }, 400);
  }

  flashRespawn() {
    const el = this.dom.respawnFlash;
    el.classList.remove('flash');
    void el.offsetWidth;
    el.classList.add('flash');
  }

  completeLevel() {
    if (this.state !== 'playing') return;
    this.state = 'complete';
    this.audio.complete();
    this.particles.confetti(this.player.x + this.player.w / 2, this.player.y, 60);

    const idx = this.currentLevelIndex;
    const starsCollected = this.collectedStars.size;
    const prevData = this.progress.levels[idx] || { stars: 0, bestTime: null };
    const bestTime = prevData.bestTime == null ? this.time : Math.min(prevData.bestTime, this.time);
    const stars = Math.max(prevData.stars, starsCollected);
    this.progress.levels[idx] = { stars, bestTime };
    if (idx + 1 < LEVELS.length) {
      this.progress.unlocked = Math.max(this.progress.unlocked, idx + 1);
    }
    saveProgress(this.progress);

    this.showCompleteScreen(starsCollected, bestTime, idx);
    this.showScreen('complete');
  }

  showCompleteScreen(starsCollected, bestTime, idx) {
    this.dom.completeTitle.textContent = LEVELS[idx].name + ' Complete!';
    this.dom.completeStars.innerHTML = starsHTML(starsCollected);
    this.dom.completeStars.querySelectorAll('.star').forEach((el, i) => {
      el.style.animationDelay = `${0.15 + i * 0.18}s`;
    });
    this.dom.completeTime.textContent = `Time: ${this.time.toFixed(1)}s  •  Best: ${bestTime.toFixed(1)}s`;
    const hasNext = idx + 1 < LEVELS.length;
    this.dom.completeNextBtn.classList.toggle('hidden', !hasNext);
  }

  updateHUDStars() {
    this.dom.starCount.textContent = this.collectedStars.size;
  }

  showLevelToast(name) {
    const el = this.dom.levelToast;
    el.textContent = name;
    el.classList.remove('show');
    void el.offsetWidth;
    el.classList.add('show');
  }

  startLevel(idx) {
    if (this.respawnTimeout) {
      clearTimeout(this.respawnTimeout);
      this.respawnTimeout = null;
    }
    this.currentLevelIndex = idx;
    this.level = LEVELS[idx];
    this.player = new Player(this.level.playerStart.x, this.level.playerStart.y);
    this.collectedStars = new Set();
    this.springOverlap = this.level.springs.map(() => false);
    this.springStates = this.level.springs.map(() => 0);
    this.time = 0;
    this.runDustTimer = 0;
    this.camera.x = 0;
    this.particles.reset();
    this.respawning = false;
    this.input.reset();
    this.state = 'playing';
    this.updateHUDStars();
    this.dom.hudLevelName.textContent = this.level.name;
    this.dom.hudTime.textContent = '0.0s';
    this.showLevelToast(this.level.name);
    this.showScreen('playing');
  }

  restartLevel() {
    this.startLevel(this.currentLevelIndex);
  }

  pause() {
    if (this.state !== 'playing') return;
    this.state = 'paused';
    this.input.reset();
    this.showScreen('paused');
  }

  resume() {
    if (this.state !== 'paused') return;
    this.state = 'playing';
    this.showScreen('playing');
  }

  goToTitle() {
    if (this.respawnTimeout) {
      clearTimeout(this.respawnTimeout);
      this.respawnTimeout = null;
    }
    this.state = 'title';
    this.showScreen('title');
  }

  goToLevelSelect() {
    this.renderLevelSelect();
    this.state = 'levelSelect';
    this.showScreen('levelSelect');
  }

  showScreen(name) {
    const d = this.dom;
    d.titleScreen.classList.toggle('hidden', name !== 'title');
    d.levelSelect.classList.toggle('hidden', name !== 'levelSelect');
    d.pauseScreen.classList.toggle('hidden', name !== 'paused');
    d.completeScreen.classList.toggle('hidden', name !== 'complete');
    const gameplay = name === 'playing' || name === 'paused';
    d.hud.classList.toggle('hidden', !gameplay);
    d.controls.classList.toggle('hidden', name !== 'playing');
  }

  renderLevelSelect() {
    const grid = this.dom.levelGrid;
    grid.innerHTML = '';
    LEVELS.forEach((lvl, i) => {
      const locked = i > this.progress.unlocked;
      const data = this.progress.levels[i] || { stars: 0, bestTime: null };
      const btn = document.createElement('button');
      btn.className = 'level-card' + (locked ? ' locked' : '');
      btn.innerHTML = `
        <span class="level-card-num">${i + 1}</span>
        <span class="level-card-name">${lvl.name}</span>
        <span class="level-card-stars">${starsHTML(data.stars)}</span>
        ${locked ? '<span class="level-card-lock">\u{1F512}</span>' : ''}
      `;
      if (!locked) {
        btn.addEventListener('click', () => {
          this.audio.click();
          this.startLevel(i);
        });
      }
      grid.appendChild(btn);
    });
  }

  render() {
    const ctx = this.ctx;
    const theme = THEMES[this.level.theme];
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    renderBackground(ctx, theme, {
      canvasWidth: this.canvas.width,
      canvasHeight: this.canvas.height,
      cameraX: this.camera.x,
      scale: this.scale,
      visibleWidth: this.visibleWidth,
      time: this.globalTime,
    });

    ctx.save();
    ctx.scale(this.scale, this.scale);
    ctx.translate(-this.camera.x, 0);

    renderLevel(ctx, this.level, theme, this.globalTime, this.collectedStars, this.springStates);
    this.particles.render(ctx);
    this.player.render(ctx);

    ctx.restore();
  }
}
