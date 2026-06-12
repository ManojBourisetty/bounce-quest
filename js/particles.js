import { randRange } from './utils.js';

const POOL_SIZE = 240;

function drawStar(ctx, r) {
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const a = (Math.PI * 2 * i) / 5 - Math.PI / 2;
    const a2 = a + Math.PI / 5;
    ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    ctx.lineTo(Math.cos(a2) * r * 0.45, Math.sin(a2) * r * 0.45);
  }
  ctx.closePath();
}

export class ParticleSystem {
  constructor() {
    this.pool = [];
    for (let i = 0; i < POOL_SIZE; i++) {
      this.pool.push({ active: false });
    }
  }

  spawn(opts) {
    for (const p of this.pool) {
      if (!p.active) {
        p.active = true;
        p.age = 0;
        p.x = opts.x;
        p.y = opts.y;
        p.vx = opts.vx || 0;
        p.vy = opts.vy || 0;
        p.gravity = opts.gravity || 0;
        p.drag = opts.drag != null ? opts.drag : 1;
        p.life = opts.life || 0.5;
        p.size = opts.size || 4;
        p.endSize = opts.endSize != null ? opts.endSize : p.size;
        p.color = opts.color || '#ffffff';
        p.shape = opts.shape || 'circle';
        p.rotation = opts.rotation || 0;
        p.rotSpeed = opts.rotSpeed || 0;
        p.alpha = opts.alpha != null ? opts.alpha : 1;
        return;
      }
    }
  }

  dust(x, y, count = 6) {
    for (let i = 0; i < count; i++) {
      this.spawn({
        x: x + randRange(-6, 6),
        y: y + randRange(-2, 2),
        vx: randRange(-50, 50),
        vy: randRange(-60, -10),
        gravity: 200,
        drag: 0.94,
        life: randRange(0.25, 0.45),
        size: randRange(3, 6),
        endSize: 1,
        color: '#FFFFFF',
        alpha: 0.6,
        shape: 'circle',
      });
    }
  }

  sparkle(x, y, color = '#FFD93D', count = 14) {
    for (let i = 0; i < count; i++) {
      const angle = randRange(0, Math.PI * 2);
      const speed = randRange(60, 180);
      this.spawn({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        gravity: 80,
        drag: 0.92,
        life: randRange(0.4, 0.8),
        size: randRange(4, 8),
        endSize: 0,
        color,
        shape: 'star',
        rotation: randRange(0, Math.PI * 2),
        rotSpeed: randRange(-6, 6),
      });
    }
  }

  confetti(x, y, count = 36) {
    const colors = ['#FF6FAE', '#6FE7FF', '#FFE26B', '#7CCB6D', '#C77DFF', '#FF9F5A'];
    for (let i = 0; i < count; i++) {
      const angle = randRange(-Math.PI, 0) - Math.PI / 2;
      const speed = randRange(120, 380);
      this.spawn({
        x,
        y,
        vx: Math.cos(angle) * speed * randRange(0.4, 1),
        vy: Math.sin(angle) * speed,
        gravity: 500,
        drag: 0.985,
        life: randRange(1, 1.8),
        size: randRange(5, 10),
        endSize: randRange(5, 10),
        color: colors[i % colors.length],
        shape: 'rect',
        rotation: randRange(0, Math.PI * 2),
        rotSpeed: randRange(-10, 10),
      });
    }
  }

  poof(x, y, count = 10) {
    for (let i = 0; i < count; i++) {
      const angle = randRange(0, Math.PI * 2);
      const speed = randRange(30, 110);
      this.spawn({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 30,
        gravity: 60,
        drag: 0.9,
        life: randRange(0.3, 0.55),
        size: randRange(6, 12),
        endSize: randRange(14, 22),
        color: '#FFFFFF',
        alpha: 0.7,
        shape: 'circle',
      });
    }
  }

  update(dt) {
    for (const p of this.pool) {
      if (!p.active) continue;
      p.age += dt;
      if (p.age >= p.life) {
        p.active = false;
        continue;
      }
      p.vy += p.gravity * dt;
      p.vx *= p.drag;
      p.vy *= p.drag;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rotation += p.rotSpeed * dt;
    }
  }

  render(ctx) {
    for (const p of this.pool) {
      if (!p.active) continue;
      const t = p.age / p.life;
      const size = p.size + (p.endSize - p.size) * t;
      ctx.save();
      ctx.globalAlpha = Math.max(0, 1 - t) * p.alpha;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.fillStyle = p.color;
      if (p.shape === 'circle') {
        ctx.beginPath();
        ctx.arc(0, 0, Math.max(0, size), 0, Math.PI * 2);
        ctx.fill();
      } else if (p.shape === 'rect') {
        ctx.fillRect(-size / 2, -size / 2, size, size);
      } else if (p.shape === 'star') {
        drawStar(ctx, Math.max(0, size));
        ctx.fill();
      }
      ctx.restore();
    }
  }

  reset() {
    for (const p of this.pool) p.active = false;
  }
}
