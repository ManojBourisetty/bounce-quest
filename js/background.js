import { WORLD_HEIGHT } from './constants.js';

function hash(i) {
  const x = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

function drawRepeating(spacing, offsetX, visibleWidth, draw) {
  const start = Math.floor((offsetX - spacing) / spacing) - 1;
  const end = Math.ceil((offsetX + visibleWidth + spacing) / spacing) + 1;
  for (let i = start; i <= end; i++) {
    draw(i * spacing - offsetX, i);
  }
}

function hill(ctx, x, baseY, w, h, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x - w / 2, baseY);
  ctx.quadraticCurveTo(x, baseY - h, x + w / 2, baseY);
  ctx.closePath();
  ctx.fill();
}

function cloud(ctx, x, y, scale, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(x, y, 32 * scale, 16 * scale, 0, 0, Math.PI * 2);
  ctx.ellipse(x + 24 * scale, y + 4 * scale, 22 * scale, 13 * scale, 0, 0, Math.PI * 2);
  ctx.ellipse(x - 22 * scale, y + 6 * scale, 20 * scale, 12 * scale, 0, 0, Math.PI * 2);
  ctx.fill();
}

function pineTree(ctx, x, baseY, scale, color) {
  ctx.fillStyle = '#7A5230';
  ctx.fillRect(x - 3 * scale, baseY - 14 * scale, 6 * scale, 14 * scale);
  ctx.fillStyle = color;
  for (let i = 0; i < 3; i++) {
    const w = (34 - i * 8) * scale;
    const y = baseY - 10 * scale - i * 16 * scale;
    ctx.beginPath();
    ctx.moveTo(x, y - 22 * scale);
    ctx.lineTo(x - w / 2, y);
    ctx.lineTo(x + w / 2, y);
    ctx.closePath();
    ctx.fill();
  }
}

function cactus(ctx, x, baseY, scale, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x - 6 * scale, baseY - 40 * scale, 12 * scale, 40 * scale);
  ctx.fillRect(x - 22 * scale, baseY - 26 * scale, 16 * scale, 9 * scale);
  ctx.fillRect(x + 6 * scale, baseY - 32 * scale, 16 * scale, 9 * scale);
}

function snowman(ctx, x, baseY, scale) {
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.arc(x, baseY - 12 * scale, 14 * scale, 0, Math.PI * 2);
  ctx.arc(x, baseY - 32 * scale, 10 * scale, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#FF9F5A';
  ctx.beginPath();
  ctx.moveTo(x, baseY - 32 * scale);
  ctx.lineTo(x + 14 * scale, baseY - 30 * scale);
  ctx.lineTo(x, baseY - 28 * scale);
  ctx.fill();
}

function candyCane(ctx, x, baseY, scale, colorA, colorB) {
  ctx.lineWidth = 6 * scale;
  ctx.lineCap = 'round';
  for (let i = 0; i < 4; i++) {
    ctx.strokeStyle = i % 2 === 0 ? colorA : colorB;
    ctx.beginPath();
    ctx.moveTo(x, baseY - i * 6 * scale);
    ctx.lineTo(x, baseY - (i + 1) * 6 * scale);
    ctx.stroke();
  }
  ctx.strokeStyle = colorA;
  ctx.beginPath();
  ctx.arc(x + 8 * scale, baseY - 24 * scale, 8 * scale, Math.PI, Math.PI * 2.1);
  ctx.stroke();
}

function bird(ctx, x, y, t, color) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  const flap = Math.sin(t * 6 + x) * 4;
  ctx.beginPath();
  ctx.moveTo(x - 8, y - flap);
  ctx.lineTo(x, y);
  ctx.lineTo(x + 8, y - flap);
  ctx.stroke();
}

export function renderBackground(ctx, theme, opts) {
  const { canvasWidth, canvasHeight, cameraX, scale, visibleWidth, time } = opts;

  const grad = ctx.createLinearGradient(0, 0, 0, canvasHeight);
  grad.addColorStop(0, theme.skyTop);
  grad.addColorStop(1, theme.skyBottom);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  ctx.save();
  ctx.scale(scale, scale);

  // Sun / moon glow (very slow parallax)
  const sunX = visibleWidth * 0.78 - cameraX * 0.04;
  const sunY = WORLD_HEIGHT * 0.18;
  const glow = ctx.createRadialGradient(sunX, sunY, 5, sunX, sunY, 70);
  glow.addColorStop(0, theme.accent);
  glow.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(sunX - 80, sunY - 80, 160, 160);
  ctx.fillStyle = theme.accent;
  ctx.beginPath();
  ctx.arc(sunX, sunY, 26, 0, Math.PI * 2);
  ctx.fill();

  // Far hills (parallax 0.2)
  const farOffset = cameraX * 0.2;
  drawRepeating(280, farOffset, visibleWidth, (x, i) => {
    const h = 70 + hash(i) * 50;
    hill(ctx, x, WORLD_HEIGHT - 30, 320, h, withAlpha(theme.groundBody, 0.35));
  });

  // Clouds (parallax 0.35, gentle drift)
  const cloudOffset = cameraX * 0.35 - time * 6;
  drawRepeating(260, cloudOffset, visibleWidth, (x, i) => {
    const y = 30 + hash(i * 3.1) * 70;
    const s = 0.7 + hash(i * 7.7) * 0.6;
    cloud(ctx, x, y, s, 'rgba(255,255,255,0.85)');
  });

  // Mid hills (parallax 0.5)
  const midOffset = cameraX * 0.5;
  drawRepeating(220, midOffset, visibleWidth, (x, i) => {
    const h = 40 + hash(i * 2.3) * 35;
    hill(ctx, x, WORLD_HEIGHT - 10, 240, h, withAlpha(theme.groundBody, 0.55));
  });

  // Theme-specific props (parallax 0.75)
  const propOffset = cameraX * 0.75;
  drawRepeating(360, propOffset, visibleWidth, (x, i) => {
    const baseY = WORLD_HEIGHT - 6;
    const s = 0.8 + hash(i * 5.5) * 0.5;
    switch (theme.decor) {
      case 'meadow':
        cloud(ctx, x, 26 + hash(i * 9) * 30, 0.5, 'rgba(255,255,255,0.6)');
        break;
      case 'desert':
        if (i % 2 === 0) cactus(ctx, x, baseY, s * 0.8, theme.accent2);
        break;
      case 'forest':
        pineTree(ctx, x, baseY, s, theme.accent);
        break;
      case 'snow':
        if (i % 2 === 0) snowman(ctx, x, baseY, s * 0.9);
        break;
      case 'sunset':
        bird(ctx, x, 50 + hash(i * 4.2) * 40, time, 'rgba(80,40,60,0.5)');
        break;
      case 'candy':
        candyCane(ctx, x, baseY, s, '#FFFFFF', theme.groundBody);
        break;
    }
  });

  // Falling snow ambience
  if (theme.decor === 'snow') {
    const snowOffset = cameraX * 0.9;
    drawRepeating(60, snowOffset, visibleWidth, (x, i) => {
      const y = ((time * 30 + hash(i) * 400) % (WORLD_HEIGHT + 20));
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.beginPath();
      ctx.arc(x + Math.sin(time + i) * 10, y, 2, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  ctx.restore();
}

function withAlpha(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}
