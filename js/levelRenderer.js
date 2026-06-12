import { GROUND_Y } from './levels.js';

function roundRect(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function drawPlatform(ctx, p, theme) {
  const topH = 14;
  if (p.type === 'ground') {
    ctx.fillStyle = theme.groundBody;
    ctx.fillRect(p.x, p.y, p.w, p.h);
    ctx.fillStyle = theme.groundTop;
    roundRect(ctx, p.x, p.y - 2, p.w, topH + 2, 4);
    ctx.fill();
    // texture dots
    ctx.fillStyle = 'rgba(0,0,0,0.06)';
    for (let x = p.x + 14; x < p.x + p.w - 4; x += 26) {
      ctx.beginPath();
      ctx.arc(x, p.y + topH + 10, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (p.type === 'block' || p.type === 'moving') {
    ctx.save();
    if (p.type === 'moving') {
      ctx.shadowColor = 'rgba(0,0,0,0.18)';
      ctx.shadowBlur = 6;
      ctx.shadowOffsetY = 4;
    }
    ctx.fillStyle = theme.groundBody;
    roundRect(ctx, p.x, p.y, p.w, p.h, 8);
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = theme.groundTop;
    roundRect(ctx, p.x, p.y, p.w, Math.min(topH, p.h * 0.6), 8);
    ctx.fill();
    if (p.type === 'moving') {
      ctx.strokeStyle = 'rgba(255,255,255,0.6)';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 5]);
      roundRect(ctx, p.x + 1.5, p.y + 1.5, p.w - 3, p.h - 3, 7);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }
}

function drawSpike(ctx, s) {
  ctx.fillStyle = '#E0566B';
  const teeth = Math.max(1, Math.round(s.w / 18));
  const tw = s.w / teeth;
  for (let i = 0; i < teeth; i++) {
    const x = s.x + i * tw;
    ctx.beginPath();
    ctx.moveTo(x, s.y + s.h);
    ctx.lineTo(x + tw / 2, s.y);
    ctx.lineTo(x + tw, s.y + s.h);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  for (let i = 0; i < teeth; i++) {
    const x = s.x + i * tw;
    ctx.beginPath();
    ctx.moveTo(x + tw / 2, s.y);
    ctx.lineTo(x + tw * 0.65, s.y + s.h * 0.5);
    ctx.lineTo(x + tw * 0.35, s.y + s.h * 0.5);
    ctx.closePath();
    ctx.fill();
  }
}

function drawSpring(ctx, s, time, bounceTime) {
  const cx = s.x + s.w / 2;
  const baseY = s.y + s.h;
  const squish = bounceTime > 0 ? Math.max(0.35, 1 - bounceTime * 6) : 1;
  const h = s.h * squish;
  ctx.fillStyle = '#FFB23E';
  roundRect(ctx, s.x, baseY - 6, s.w, 6, 2);
  ctx.fill();
  ctx.strokeStyle = '#FF8C00';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  const coils = 3;
  ctx.beginPath();
  for (let i = 0; i <= coils * 2; i++) {
    const t = i / (coils * 2);
    const x = cx + (i % 2 === 0 ? -1 : 1) * s.w * 0.32;
    const y = baseY - 6 - t * (h - 6);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
}

function drawStar(ctx, star, time, index, collected) {
  if (collected) return;
  const bob = Math.sin(time * 2.4 + index) * 4;
  const rot = time * 1.2 + index;
  ctx.save();
  ctx.translate(star.x, star.y + bob);
  ctx.rotate(rot);
  const glow = ctx.createRadialGradient(0, 0, 2, 0, 0, star.r * 2.2);
  glow.addColorStop(0, 'rgba(255,217,107,0.55)');
  glow.addColorStop(1, 'rgba(255,217,107,0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(0, 0, star.r * 2.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#FFD93D';
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const a = (Math.PI * 2 * i) / 5 - Math.PI / 2;
    const a2 = a + Math.PI / 5;
    ctx.lineTo(Math.cos(a) * star.r, Math.sin(a) * star.r);
    ctx.lineTo(Math.cos(a2) * star.r * 0.45, Math.sin(a2) * star.r * 0.45);
  }
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.beginPath();
  ctx.arc(-star.r * 0.2, -star.r * 0.2, star.r * 0.22, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawGoal(ctx, goal, theme, time) {
  const poleH = 130;
  ctx.fillStyle = '#B0B0B0';
  ctx.fillRect(goal.x - 3, goal.y - poleH, 6, poleH);
  ctx.beginPath();
  ctx.arc(goal.x, goal.y - poleH, 6, 0, Math.PI * 2);
  ctx.fillStyle = '#FFD93D';
  ctx.fill();

  const wave = Math.sin(time * 4) * 6;
  ctx.fillStyle = theme.accent2 || '#FF6FAE';
  ctx.beginPath();
  ctx.moveTo(goal.x + 3, goal.y - poleH + 4);
  ctx.quadraticCurveTo(goal.x + 46 + wave, goal.y - poleH + 14, goal.x + 3, goal.y - poleH + 36);
  ctx.closePath();
  ctx.fill();

  // base pad
  ctx.fillStyle = theme.accent;
  roundRect(ctx, goal.x - 22, goal.y - 6, 44, 10, 4);
  ctx.fill();
}

export function renderLevel(ctx, level, theme, time, collectedStars, springStates) {
  for (const p of level.platforms) {
    drawPlatform(ctx, p, theme);
  }
  for (const s of level.spikes) {
    drawSpike(ctx, s);
  }
  level.springs.forEach((s, i) => {
    drawSpring(ctx, s, time, springStates ? springStates[i] || 0 : 0);
  });
  level.stars.forEach((star, i) => {
    drawStar(ctx, star, time, i, collectedStars.has(i));
  });
  drawGoal(ctx, level.goal, theme, time);
}

export { GROUND_Y };
