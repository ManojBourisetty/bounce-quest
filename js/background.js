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

function palmTree(ctx, x, baseY, scale, trunkColor, leafColor) {
  ctx.strokeStyle = trunkColor;
  ctx.lineWidth = 6 * scale;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x, baseY);
  ctx.quadraticCurveTo(x + 6 * scale, baseY - 20 * scale, x + 2 * scale, baseY - 38 * scale);
  ctx.stroke();
  ctx.fillStyle = leafColor;
  const topX = x + 2 * scale;
  const topY = baseY - 38 * scale;
  for (let i = 0; i < 5; i++) {
    const a = (Math.PI * 2 * i) / 5 - Math.PI / 2;
    ctx.beginPath();
    ctx.ellipse(topX + Math.cos(a) * 16 * scale, topY + Math.sin(a) * 10 * scale, 18 * scale, 7 * scale, a, 0, Math.PI * 2);
    ctx.fill();
  }
}

function starfish(ctx, x, baseY, scale, color) {
  ctx.fillStyle = color;
  ctx.save();
  ctx.translate(x, baseY - 6 * scale);
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const a = (Math.PI * 2 * i) / 5 - Math.PI / 2;
    const a2 = a + Math.PI / 5;
    ctx.lineTo(Math.cos(a) * 14 * scale, Math.sin(a) * 14 * scale * 0.6);
    ctx.lineTo(Math.cos(a2) * 6 * scale, Math.sin(a2) * 6 * scale * 0.6);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function crystalCluster(ctx, x, baseY, scale, color) {
  ctx.fillStyle = color;
  const shards = [[-11, 26], [0, 42], [11, 24]];
  for (const [dx, h] of shards) {
    const w = 9 * scale;
    ctx.beginPath();
    ctx.moveTo(x + dx * scale - w / 2, baseY);
    ctx.lineTo(x + dx * scale, baseY - h * scale);
    ctx.lineTo(x + dx * scale + w / 2, baseY);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.beginPath();
  ctx.moveTo(x - 4 * scale, baseY);
  ctx.lineTo(x, baseY - 42 * scale);
  ctx.lineTo(x + 2 * scale, baseY);
  ctx.closePath();
  ctx.fill();
}

function volcanoCone(ctx, x, baseY, scale, bodyColor, glowColor) {
  ctx.fillStyle = bodyColor;
  ctx.beginPath();
  ctx.moveTo(x - 36 * scale, baseY);
  ctx.lineTo(x, baseY - 50 * scale);
  ctx.lineTo(x + 36 * scale, baseY);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = glowColor;
  ctx.beginPath();
  ctx.moveTo(x - 8 * scale, baseY - 42 * scale);
  ctx.lineTo(x, baseY - 50 * scale);
  ctx.lineTo(x + 8 * scale, baseY - 42 * scale);
  ctx.closePath();
  ctx.fill();
}

function cloudIsland(ctx, x, y, scale, cloudColor, underColor) {
  cloud(ctx, x, y, scale, cloudColor);
  ctx.fillStyle = underColor;
  ctx.beginPath();
  ctx.ellipse(x, y + 9 * scale, 28 * scale, 6 * scale, 0, 0, Math.PI * 2);
  ctx.fill();
}

function planet(ctx, x, y, scale, bodyColor, ringColor) {
  ctx.strokeStyle = ringColor;
  ctx.lineWidth = 3 * scale;
  ctx.beginPath();
  ctx.ellipse(x, y, 28 * scale, 9 * scale, -0.3, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = bodyColor;
  ctx.beginPath();
  ctx.arc(x, y, 15 * scale, 0, Math.PI * 2);
  ctx.fill();
}

// --- Expansion worlds (levels 101-200) ---

function mapleTree(ctx, x, baseY, scale, color) {
  ctx.fillStyle = '#7A5230';
  ctx.fillRect(x - 3 * scale, baseY - 16 * scale, 6 * scale, 16 * scale);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, baseY - 26 * scale, 16 * scale, 0, Math.PI * 2);
  ctx.arc(x - 12 * scale, baseY - 18 * scale, 11 * scale, 0, Math.PI * 2);
  ctx.arc(x + 12 * scale, baseY - 18 * scale, 11 * scale, 0, Math.PI * 2);
  ctx.fill();
}

function beachUmbrella(ctx, x, baseY, scale, colorA, colorB) {
  ctx.strokeStyle = '#8C6A4E';
  ctx.lineWidth = 3 * scale;
  ctx.beginPath();
  ctx.moveTo(x, baseY);
  ctx.lineTo(x, baseY - 36 * scale);
  ctx.stroke();
  const segs = 6;
  for (let i = 0; i < segs; i++) {
    const a0 = Math.PI + (Math.PI * i) / segs;
    const a1 = Math.PI + (Math.PI * (i + 1)) / segs;
    ctx.fillStyle = i % 2 === 0 ? colorA : colorB;
    ctx.beginPath();
    ctx.moveTo(x, baseY - 36 * scale);
    ctx.arc(x, baseY - 36 * scale, 22 * scale, a0, a1);
    ctx.closePath();
    ctx.fill();
  }
}

function balloonCluster(ctx, x, y, scale, colorA, colorB) {
  [[-10, colorA, 0], [10, colorB, 1], [0, colorA, 2]].forEach(([dx, color, i]) => {
    const by = y - i * 4 * scale;
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + dx * scale, by + 13 * scale);
    ctx.lineTo(x, y + 30 * scale);
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(x + dx * scale, by, 10 * scale, 13 * scale, 0, 0, Math.PI * 2);
    ctx.fill();
  });
}

function snowPeak(ctx, x, baseY, scale, rockColor, snowColor) {
  ctx.fillStyle = rockColor;
  ctx.beginPath();
  ctx.moveTo(x - 34 * scale, baseY);
  ctx.lineTo(x, baseY - 60 * scale);
  ctx.lineTo(x + 34 * scale, baseY);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = snowColor;
  ctx.beginPath();
  ctx.moveTo(x - 10 * scale, baseY - 44 * scale);
  ctx.lineTo(x, baseY - 60 * scale);
  ctx.lineTo(x + 10 * scale, baseY - 44 * scale);
  ctx.lineTo(x + 4 * scale, baseY - 40 * scale);
  ctx.lineTo(x - 4 * scale, baseY - 40 * scale);
  ctx.closePath();
  ctx.fill();
}

function lilyPad(ctx, x, baseY, scale, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, baseY - 4 * scale, 14 * scale, 0.4, Math.PI * 2 - 0.4);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.beginPath();
  ctx.arc(x - 3 * scale, baseY - 6 * scale, 3 * scale, 0, Math.PI * 2);
  ctx.fill();
}

function toyBlock(ctx, x, baseY, scale, colorA, colorB) {
  const w = 26 * scale, h = 26 * scale;
  ctx.fillStyle = colorA;
  ctx.fillRect(x - w / 2, baseY - h, w, h);
  ctx.fillStyle = colorB;
  ctx.beginPath();
  ctx.arc(x, baseY - h / 2, 6 * scale, 0, Math.PI * 2);
  ctx.fill();
}

function mesaSpire(ctx, x, baseY, scale, color) {
  ctx.fillStyle = color;
  const tiers = [{ w: 48, h: 20 }, { w: 34, h: 18 }, { w: 20, h: 16 }];
  let y = baseY;
  for (const tier of tiers) {
    ctx.fillRect(x - (tier.w / 2) * scale, y - tier.h * scale, tier.w * scale, tier.h * scale);
    y -= tier.h * scale;
  }
}

function coralBranch(ctx, x, baseY, scale, color) {
  const arms = [[-8, 26], [0, 34], [9, 22]];
  ctx.strokeStyle = color;
  ctx.lineWidth = 5 * scale;
  ctx.lineCap = 'round';
  for (const [dx, h] of arms) {
    ctx.beginPath();
    ctx.moveTo(x + dx * scale, baseY);
    ctx.lineTo(x + dx * scale, baseY - h * scale);
    ctx.stroke();
  }
  ctx.fillStyle = color;
  for (const [dx, h] of arms) {
    ctx.beginPath();
    ctx.arc(x + dx * scale, baseY - h * scale, 4 * scale, 0, Math.PI * 2);
    ctx.fill();
  }
}

function bush(ctx, x, baseY, scale, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x - 10 * scale, baseY - 8 * scale, 9 * scale, 0, Math.PI * 2);
  ctx.arc(x, baseY - 12 * scale, 11 * scale, 0, Math.PI * 2);
  ctx.arc(x + 10 * scale, baseY - 8 * scale, 9 * scale, 0, Math.PI * 2);
  ctx.fill();
}

function chimneyPot(ctx, x, baseY, scale, colorA, colorB) {
  ctx.fillStyle = colorA;
  ctx.fillRect(x - 8 * scale, baseY - 24 * scale, 16 * scale, 24 * scale);
  ctx.fillStyle = colorB;
  ctx.beginPath();
  ctx.ellipse(x, baseY - 30 * scale, 7 * scale, 4 * scale, 0, 0, Math.PI * 2);
  ctx.fill();
}

function gearProp(ctx, x, baseY, scale, color) {
  ctx.strokeStyle = '#8C9CAA';
  ctx.lineWidth = 3 * scale;
  ctx.beginPath();
  ctx.moveTo(x, baseY);
  ctx.lineTo(x, baseY - 20 * scale);
  ctx.stroke();
  ctx.fillStyle = color;
  const cx = x, cy = baseY - 32 * scale, r = 12 * scale;
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const a = (Math.PI * 2 * i) / 8;
    const rr = i % 2 === 0 ? r : r * 0.7;
    const px = cx + Math.cos(a) * rr;
    const py = cy + Math.sin(a) * rr;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.35, 0, Math.PI * 2);
  ctx.fill();
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
      case 'jungle':
        palmTree(ctx, x, baseY, s, '#7A5230', theme.accent2);
        break;
      case 'ocean':
        if (i % 2 === 0) starfish(ctx, x, baseY - 4, s * 0.8, theme.accent2);
        break;
      case 'cave':
        crystalCluster(ctx, x, baseY, s, theme.accent);
        break;
      case 'volcano':
        volcanoCone(ctx, x, baseY, s * 0.85, theme.groundBody, theme.accent);
        break;
      case 'sky':
        cloudIsland(ctx, x, 40 + hash(i * 9) * 60, s, 'rgba(255,255,255,0.9)', theme.accent2);
        break;
      case 'space':
        planet(ctx, x, 40 + hash(i * 9) * 70, s * 0.7, theme.accent2, theme.accent);
        break;
      case 'autumn':
        mapleTree(ctx, x, baseY, s, i % 2 === 0 ? theme.accent : theme.accent2);
        break;
      case 'beach':
        if (i % 2 === 0) beachUmbrella(ctx, x, baseY, s * 0.8, theme.accent, theme.accent2);
        break;
      case 'carnival':
        balloonCluster(ctx, x, 50 + hash(i * 9) * 40, s * 0.8, theme.accent, theme.accent2);
        break;
      case 'alpine':
        snowPeak(ctx, x, baseY, s * 0.9, theme.groundBody, '#FFFFFF');
        break;
      case 'swamp':
        if (i % 2 === 0) lilyPad(ctx, x, baseY - 2, s * 0.9, theme.accent2);
        break;
      case 'toybox':
        toyBlock(ctx, x, baseY, s * 0.9, theme.accent, theme.accent2);
        break;
      case 'aurora':
        pineTree(ctx, x, baseY, s * 0.8, theme.groundBody);
        break;
      case 'canyon':
        mesaSpire(ctx, x, baseY, s * 0.85, theme.groundBody);
        break;
      case 'reef':
        if (i % 2 === 0) coralBranch(ctx, x, baseY, s * 0.85, theme.accent2);
        break;
      case 'firefly':
        bush(ctx, x, baseY, s * 0.9, theme.groundBody);
        break;
      case 'rooftop':
        chimneyPot(ctx, x, baseY, s * 0.85, theme.groundBody, theme.accent2);
        break;
      case 'factory':
        gearProp(ctx, x, baseY, s * 0.8, theme.accent);
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

  // Rising smoke puffs over the lava
  if (theme.decor === 'volcano') {
    const smokeOffset = cameraX * 0.6;
    drawRepeating(360, smokeOffset, visibleWidth, (x, i) => {
      if (i % 2 !== 0) return;
      const rise = (time * 10 + hash(i) * 60) % 70;
      cloud(ctx, x, WORLD_HEIGHT - 50 - rise, 0.35, `rgba(200,200,200,${0.45 - rise / 200})`);
    });
  }

  // Twinkling stars
  if (theme.decor === 'space' || theme.decor === 'aurora') {
    const starOffset = cameraX * 0.6;
    drawRepeating(46, starOffset, visibleWidth, (x, i) => {
      const y = hash(i * 3.7) * WORLD_HEIGHT * 0.6;
      const tw = 0.4 + 0.6 * Math.abs(Math.sin(time * 2 + i));
      ctx.fillStyle = `rgba(255,255,255,${tw})`;
      ctx.beginPath();
      ctx.arc(x, y, 1.6, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  // Drifting aurora ribbons across the night sky
  if (theme.decor === 'aurora') {
    const auroraOffset = cameraX * 0.3;
    const ribbonColors = ['rgba(110,220,201,0.25)', 'rgba(184,140,232,0.22)'];
    drawRepeating(220, auroraOffset, visibleWidth, (x, i) => {
      const bandY = 50 + hash(i * 5.3) * 60;
      ctx.strokeStyle = ribbonColors[i % 2];
      ctx.lineWidth = 10;
      ctx.beginPath();
      for (let px = -110; px <= 110; px += 10) {
        const py = bandY + Math.sin((px + time * 40 + i * 30) * 0.02) * 14;
        if (px === -110) ctx.moveTo(x + px, py);
        else ctx.lineTo(x + px, py);
      }
      ctx.stroke();
    });
  }

  // Bubbles rising past the coral
  if (theme.decor === 'reef') {
    const bubbleOffset = cameraX * 0.7;
    drawRepeating(70, bubbleOffset, visibleWidth, (x, i) => {
      const rise = (time * 26 + hash(i) * 300) % 320;
      const y = WORLD_HEIGHT - 20 - rise;
      if (y < 0) return;
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.beginPath();
      ctx.arc(x + Math.sin(time * 1.5 + i) * 6, y, 2.5 + hash(i * 3) * 2, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  // Drifting, pulsing firefly glow
  if (theme.decor === 'firefly') {
    const fireflyOffset = cameraX * 0.6;
    drawRepeating(80, fireflyOffset, visibleWidth, (x, i) => {
      const y = WORLD_HEIGHT - 40 - hash(i * 4.1) * 90;
      const glow = 0.3 + 0.5 * Math.abs(Math.sin(time * 2.4 + i * 3));
      const fx = x + Math.sin(time * 0.8 + i) * 14;
      const fy = y + Math.cos(time * 0.6 + i) * 10;
      ctx.fillStyle = `rgba(240,217,85,${glow})`;
      ctx.beginPath();
      ctx.arc(fx, fy, 2.2, 0, Math.PI * 2);
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
