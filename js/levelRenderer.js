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

// Floating decor blocks have nothing visibly holding them up, which reads as
// a random bar dropped in mid-air. A pair of short chains fading into the
// sky above (like Mario's suspended platforms) gives them a reason to float.
function drawChainSupport(ctx, x, topY) {
  const grad = ctx.createLinearGradient(x, topY - 20, x, topY);
  grad.addColorStop(0, 'rgba(70,55,40,0)');
  grad.addColorStop(1, 'rgba(70,55,40,0.5)');
  ctx.strokeStyle = grad;
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.moveTo(x, topY - 20);
  ctx.lineTo(x, topY);
  ctx.stroke();
  ctx.setLineDash([]);
}

// A riveted-panel texture (in the spirit of Mario's brick/crate blocks) so
// the block reads as a built platform rather than a plain colored bar.
function drawCrateTexture(ctx, x, y, w, h) {
  const cols = Math.max(2, Math.round(w / 30));
  const colW = w / cols;
  ctx.strokeStyle = 'rgba(0,0,0,0.18)';
  ctx.lineWidth = 1.5;
  for (let i = 1; i < cols; i++) {
    const lx = x + i * colW;
    ctx.beginPath();
    ctx.moveTo(lx, y + 3);
    ctx.lineTo(lx, y + h - 3);
    ctx.stroke();
  }
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  for (let i = 0; i < cols; i++) {
    const cx = x + i * colW + colW / 2;
    ctx.beginPath();
    ctx.arc(cx, y + h / 2, 1.6, 0, Math.PI * 2);
    ctx.fill();
  }
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
    drawChainSupport(ctx, p.x + 10, p.y);
    drawChainSupport(ctx, p.x + p.w - 10, p.y);

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
    drawCrateTexture(ctx, p.x, p.y, p.w, p.h);
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
  ctx.fillStyle = '#B23A2E';
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

  // A painted launch-pad ring plus upward chevrons mark the spring as a
  // deliberate "bounce here" spot, so it reads as intentional even when
  // there's nothing else nearby to explain why it's there.
  ctx.fillStyle = 'rgba(0,0,0,0.12)';
  ctx.beginPath();
  ctx.ellipse(cx, baseY + 2, s.w * 0.8, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.55)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, baseY, s.w * 0.66, Math.PI * 0.15, Math.PI * 0.85);
  ctx.stroke();

  const chevronBob = (Math.sin(time * 3) + 1) * 3;
  ctx.strokeStyle = 'rgba(255,255,255,0.5)';
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  [0, 1].forEach((n) => {
    const cy = baseY - h - 16 - n * 12 - chevronBob;
    ctx.beginPath();
    ctx.moveTo(cx - 7, cy + 5);
    ctx.lineTo(cx, cy - 4);
    ctx.lineTo(cx + 7, cy + 5);
    ctx.stroke();
  });

  ctx.fillStyle = '#F0C975';
  roundRect(ctx, s.x, baseY - 6, s.w, 6, 2);
  ctx.fill();
  ctx.strokeStyle = '#E0A857';
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
  const glow = ctx.createRadialGradient(0, 0, 2, 0, 0, star.r * 1.8);
  glow.addColorStop(0, 'rgba(240,201,85,0.4)');
  glow.addColorStop(1, 'rgba(240,201,85,0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(0, 0, star.r * 1.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const a = (Math.PI * 2 * i) / 5 - Math.PI / 2;
    const a2 = a + Math.PI / 5;
    ctx.lineTo(Math.cos(a) * star.r, Math.sin(a) * star.r);
    ctx.lineTo(Math.cos(a2) * star.r * 0.45, Math.sin(a2) * star.r * 0.45);
  }
  ctx.closePath();
  // A dark outline keeps the star readable even against a bright, similarly
  // warm-toned sky (e.g. the sunset theme) where the fill alone blends in.
  ctx.strokeStyle = 'rgba(120,68,20,0.65)';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#F0C955';
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
  ctx.fillStyle = '#F0C955';
  ctx.fill();

  const wave = Math.sin(time * 4) * 6;
  ctx.fillStyle = theme.accent2 || '#E8A0A0';
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
