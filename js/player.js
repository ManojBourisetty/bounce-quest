import {
  GRAVITY, MAX_FALL_SPEED, MOVE_SPEED, GROUND_ACCEL, AIR_ACCEL,
  GROUND_FRICTION, AIR_FRICTION, JUMP_VELOCITY, JUMP_CUT_MULTIPLIER,
  COYOTE_TIME, JUMP_BUFFER, PLAYER_W, PLAYER_H,
} from './constants.js';
import { clamp, randRange } from './utils.js';
import { CHARACTERS } from './characters.js';

const EYE_WHITE = '#FFFFFF';
const PUPIL = '#5A4A42';
const DEFAULT_PALETTE = CHARACTERS[0].palette;

export class Player {
  constructor(x, y, palette = DEFAULT_PALETTE) {
    this.spawnX = x;
    this.spawnY = y;
    this.w = PLAYER_W;
    this.h = PLAYER_H;
    this.palette = palette;
    this.reset();
  }

  reset() {
    this.x = this.spawnX;
    this.y = this.spawnY;
    this.vx = 0;
    this.vy = 0;
    this.grounded = false;
    this.facing = 1;
    this.groundPlatform = null;

    this.squashX = 1;
    this.squashY = 1;
    this.targetSquashX = 1;
    this.targetSquashY = 1;
    this.legPhase = 0;
    this.tilt = 0;

    this.blinkTimer = randRange(2, 4);
    this.blinking = false;
    this.blinkDuration = 0;

    this.coyoteTimer = 0;
    this.jumpBufferTimer = 0;

    this.justJumped = false;
    this.justLanded = false;
    this.justStepped = false;
    this.dead = false;
  }

  get bounds() {
    return { x: this.x, y: this.y, w: this.w, h: this.h };
  }

  update(dt, input, platforms) {
    this.justJumped = false;
    this.justLanded = false;
    this.justStepped = false;

    const moveDir = (input.right ? 1 : 0) - (input.left ? 1 : 0);
    const accel = this.grounded ? GROUND_ACCEL : AIR_ACCEL;
    const friction = this.grounded ? GROUND_FRICTION : AIR_FRICTION;

    if (moveDir !== 0) {
      this.vx += moveDir * accel * dt;
      this.vx = clamp(this.vx, -MOVE_SPEED, MOVE_SPEED);
      this.facing = moveDir;
    } else if (this.vx > 0) {
      this.vx = Math.max(0, this.vx - friction * dt);
    } else if (this.vx < 0) {
      this.vx = Math.min(0, this.vx + friction * dt);
    }

    // Gravity
    this.vy += GRAVITY * dt;
    if (this.vy > MAX_FALL_SPEED) this.vy = MAX_FALL_SPEED;

    // Jump buffering + coyote time
    if (this.grounded) this.coyoteTimer = COYOTE_TIME;
    else this.coyoteTimer -= dt;

    if (input.jumpPressed) this.jumpBufferTimer = JUMP_BUFFER;
    else this.jumpBufferTimer -= dt;

    if (this.jumpBufferTimer > 0 && this.coyoteTimer > 0) {
      this.vy = -JUMP_VELOCITY;
      this.jumpBufferTimer = 0;
      this.coyoteTimer = 0;
      this.grounded = false;
      this.targetSquashX = 0.78;
      this.targetSquashY = 1.28;
      this.justJumped = true;
    }

    // Variable jump height
    if (input.jumpReleasedEdge && this.vy < -JUMP_VELOCITY * JUMP_CUT_MULTIPLIER) {
      this.vy = -JUMP_VELOCITY * JUMP_CUT_MULTIPLIER;
    }

    const wasGrounded = this.grounded;
    this.grounded = false;
    this.groundPlatform = null;

    // Horizontal movement + collision
    this.x += this.vx * dt;
    this.resolveHorizontal(platforms);

    // Vertical movement + collision
    this.y += this.vy * dt;
    this.resolveVertical(platforms);

    // Carry on moving platforms
    if (this.groundPlatform && this.groundPlatform.type === 'moving') {
      this.x += this.groundPlatform.dx || 0;
    }

    if (!wasGrounded && this.grounded) {
      this.justLanded = true;
      this.targetSquashX = 1.32;
      this.targetSquashY = 0.68;
    }

    // Squash/stretch springs back to normal
    const squashSpeed = Math.min(1, dt * 12);
    this.squashX += (this.targetSquashX - this.squashX) * squashSpeed;
    this.squashY += (this.targetSquashY - this.squashY) * squashSpeed;
    const recover = Math.min(1, dt * 9);
    this.targetSquashX += (1 - this.targetSquashX) * recover;
    this.targetSquashY += (1 - this.targetSquashY) * recover;

    // Running leg animation
    if (this.grounded && Math.abs(this.vx) > 4) {
      const prevPhase = this.legPhase;
      this.legPhase += dt * (5 + Math.abs(this.vx) / 28);
      if (Math.floor(this.legPhase / Math.PI) > Math.floor(prevPhase / Math.PI)) {
        this.justStepped = true;
      }
    } else {
      this.legPhase += dt * 1.2;
    }

    // Air tilt
    const targetTilt = this.grounded ? 0 : clamp(this.vx / MOVE_SPEED, -1, 1) * 0.22;
    this.tilt += (targetTilt - this.tilt) * Math.min(1, dt * 8);

    // Blinking
    this.blinkTimer -= dt;
    if (this.blinkTimer <= 0) {
      if (this.blinking) {
        this.blinking = false;
        this.blinkTimer = randRange(2, 5);
      } else {
        this.blinking = true;
        this.blinkTimer = 0.12;
      }
    }
  }

  idleTick(dt) {
    this.blinkTimer -= dt;
    if (this.blinkTimer <= 0) {
      if (this.blinking) {
        this.blinking = false;
        this.blinkTimer = randRange(2, 5);
      } else {
        this.blinking = true;
        this.blinkTimer = 0.12;
      }
    }
  }

  bounce(velocity) {
    this.vy = -velocity;
    this.grounded = false;
    this.groundPlatform = null;
    this.targetSquashX = 0.65;
    this.targetSquashY = 1.45;
  }

  resolveHorizontal(platforms) {
    // Only the ground is a solid wall; floating/moving platforms can be
    // entered from the side and below (one-way, land-on-top only).
    for (const p of platforms) {
      if (p.type !== 'ground') continue;
      if (
        this.x + this.w > p.x &&
        this.x < p.x + p.w &&
        this.y + this.h > p.y &&
        this.y < p.y + p.h
      ) {
        if (this.vx > 0) {
          this.x = p.x - this.w;
        } else if (this.vx < 0) {
          this.x = p.x + p.w;
        }
        this.vx = 0;
      }
    }
  }

  resolveVertical(platforms) {
    for (const p of platforms) {
      if (
        this.x + this.w > p.x &&
        this.x < p.x + p.w &&
        this.y + this.h > p.y &&
        this.y < p.y + p.h
      ) {
        if (this.vy > 0) {
          this.y = p.y - this.h;
          this.vy = 0;
          this.grounded = true;
          this.groundPlatform = p;
        } else if (this.vy < 0 && p.type === 'ground') {
          this.y = p.y + p.h;
          this.vy = 0;
        }
      }
    }
  }

  render(ctx) {
    const cx = this.x + this.w / 2;
    const cy = this.y + this.h / 2;
    const baseR = this.w / 2;

    // Shadow
    ctx.save();
    ctx.globalAlpha = 0.18;
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.ellipse(cx, this.y + this.h + 4, baseR * 0.9, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.translate(cx, this.y + this.h);
    ctx.rotate(this.tilt);
    ctx.scale(this.squashX, this.squashY);

    const shape = this.palette.shape || 'bear';

    // Tail (drawn behind the body)
    if (shape === 'fox') {
      const tailSide = -this.facing;
      ctx.save();
      ctx.translate(tailSide * baseR * 0.95, -baseR * 0.5);
      ctx.rotate(tailSide * 0.35);
      ctx.fillStyle = this.palette.body;
      ctx.beginPath();
      ctx.ellipse(0, 0, baseR * 0.35, baseR * 0.75, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = this.palette.belly;
      ctx.beginPath();
      ctx.ellipse(0, baseR * 0.35, baseR * 0.24, baseR * 0.32, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Shell (drawn behind the body)
    if (shape === 'turtle') {
      ctx.fillStyle = this.palette.bodyShade;
      ctx.beginPath();
      ctx.ellipse(0, -baseR * 0.9, baseR * 1.38, baseR * 1.28, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Ears (drawn behind the body so the base is hidden)
    this.drawEars(ctx, baseR, shape);

    // Feet
    const footBob = Math.sin(this.legPhase) * 3 * (this.grounded ? 1 : 0);
    ctx.fillStyle = this.palette.foot;
    ctx.beginPath();
    ctx.ellipse(-baseR * 0.45, -2 + footBob, 8, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(baseR * 0.45, -2 - footBob, 8, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Body
    const grad = ctx.createRadialGradient(-baseR * 0.3, -baseR * 1.6, baseR * 0.3, 0, -baseR, baseR * 1.6);
    grad.addColorStop(0, this.palette.bodyLight);
    grad.addColorStop(1, this.palette.body);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(0, -baseR, baseR, baseR, 0, 0, Math.PI * 2);
    ctx.fill();

    // Belly
    ctx.fillStyle = this.palette.belly;
    ctx.beginPath();
    ctx.ellipse(0, -baseR * 0.78, baseR * 0.62, baseR * 0.52, 0, 0, Math.PI * 2);
    ctx.fill();

    // Shell scute pattern
    if (shape === 'turtle') {
      ctx.fillStyle = this.palette.bodyShade;
      ctx.globalAlpha = 0.45;
      this.drawHexagon(ctx, 0, -baseR * 0.85, baseR * 0.30);
      this.drawHexagon(ctx, -baseR * 0.55, -baseR * 0.62, baseR * 0.24);
      this.drawHexagon(ctx, baseR * 0.55, -baseR * 0.62, baseR * 0.24);
      this.drawHexagon(ctx, -baseR * 0.40, -baseR * 1.20, baseR * 0.22);
      this.drawHexagon(ctx, baseR * 0.40, -baseR * 1.20, baseR * 0.22);
      ctx.globalAlpha = 1;
    }

    // Shading crescent
    ctx.fillStyle = this.palette.bodyShade;
    ctx.globalAlpha = 0.25;
    ctx.beginPath();
    ctx.ellipse(baseR * 0.35, -baseR * 0.55, baseR * 0.55, baseR * 0.85, 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    // Cheeks
    ctx.fillStyle = this.palette.cheek;
    ctx.globalAlpha = 0.7;
    ctx.beginPath();
    ctx.ellipse(-baseR * 0.55 * this.facing, -baseR * 0.95, baseR * 0.18, baseR * 0.12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    // Eyes
    const eyeY = -baseR * 1.45;
    const eyeSpacing = baseR * 0.5;
    const eyeDir = this.facing * baseR * 0.12;
    for (const side of [-1, 1]) {
      const ex = side * eyeSpacing + eyeDir;
      ctx.fillStyle = EYE_WHITE;
      ctx.beginPath();
      const eyeH = this.blinking ? 1.5 : baseR * 0.32;
      ctx.ellipse(ex, eyeY, baseR * 0.24, eyeH, 0, 0, Math.PI * 2);
      ctx.fill();
      if (!this.blinking) {
        ctx.fillStyle = PUPIL;
        ctx.beginPath();
        const pupilOffset = baseR * 0.07 * this.facing;
        ctx.ellipse(ex + pupilOffset, eyeY + baseR * 0.04, baseR * 0.12, baseR * 0.14, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#FFFFFF';
        ctx.globalAlpha = 0.85;
        ctx.beginPath();
        ctx.ellipse(ex + pupilOffset - baseR * 0.04, eyeY - baseR * 0.04, baseR * 0.04, baseR * 0.04, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    }

    // Mouth / beak
    if (shape === 'duck') {
      const beakW = baseR * 0.42;
      const beakH = this.grounded ? baseR * 0.16 : baseR * 0.24;
      ctx.fillStyle = '#F4A93B';
      ctx.beginPath();
      ctx.ellipse(eyeDir * 0.5, -baseR * 1.02, beakW, beakH, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#D9842A';
      ctx.lineWidth = Math.max(1, baseR * 0.04);
      ctx.beginPath();
      ctx.moveTo(eyeDir * 0.5 - beakW, -baseR * 1.02);
      ctx.lineTo(eyeDir * 0.5 + beakW, -baseR * 1.02);
      ctx.stroke();
    } else {
      ctx.strokeStyle = '#8C5A42';
      ctx.lineWidth = Math.max(1.5, baseR * 0.07);
      ctx.lineCap = 'round';
      ctx.beginPath();
      if (!this.grounded) {
        // open "o" while airborne
        ctx.ellipse(eyeDir * 0.5, -baseR * 1.05, baseR * 0.14, baseR * 0.18, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#8C5A42';
        ctx.fill();
      } else {
        ctx.arc(eyeDir * 0.5, -baseR * 1.1, baseR * 0.22, 0.15 * Math.PI, 0.85 * Math.PI);
        ctx.stroke();
      }
    }

    ctx.restore();
  }

  drawEars(ctx, baseR, shape) {
    const p = this.palette;
    switch (shape) {
      case 'bear':
        for (const side of [-1, 1]) {
          ctx.fillStyle = p.bodyShade;
          ctx.beginPath();
          ctx.ellipse(side * baseR * 0.62, -baseR * 1.78, baseR * 0.30, baseR * 0.30, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = p.belly;
          ctx.beginPath();
          ctx.ellipse(side * baseR * 0.62, -baseR * 1.78, baseR * 0.15, baseR * 0.15, 0, 0, Math.PI * 2);
          ctx.fill();
        }
        break;
      case 'bunny':
        for (const side of [-1, 1]) {
          ctx.save();
          ctx.translate(side * baseR * 0.40, -baseR * 1.65);
          ctx.rotate(side * 0.18);
          ctx.fillStyle = p.body;
          ctx.beginPath();
          ctx.ellipse(0, -baseR * 0.55, baseR * 0.22, baseR * 0.62, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = p.cheek;
          ctx.beginPath();
          ctx.ellipse(0, -baseR * 0.50, baseR * 0.11, baseR * 0.42, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
        break;
      case 'cat':
        for (const side of [-1, 1]) {
          ctx.fillStyle = p.body;
          ctx.beginPath();
          ctx.moveTo(side * baseR * 0.35, -baseR * 1.55);
          ctx.lineTo(side * baseR * 0.85, -baseR * 2.15);
          ctx.lineTo(side * baseR * 1.0, -baseR * 1.35);
          ctx.closePath();
          ctx.fill();
          ctx.fillStyle = p.cheek;
          ctx.beginPath();
          ctx.moveTo(side * baseR * 0.45, -baseR * 1.58);
          ctx.lineTo(side * baseR * 0.78, -baseR * 2.0);
          ctx.lineTo(side * baseR * 0.88, -baseR * 1.42);
          ctx.closePath();
          ctx.fill();
        }
        break;
      case 'owl':
        for (const side of [-1, 1]) {
          ctx.fillStyle = p.bodyShade;
          ctx.beginPath();
          ctx.moveTo(side * baseR * 0.08, -baseR * 1.58);
          ctx.lineTo(side * baseR * 0.42, -baseR * 2.35);
          ctx.lineTo(side * baseR * 0.58, -baseR * 1.5);
          ctx.closePath();
          ctx.fill();
        }
        break;
      case 'fox':
        for (const side of [-1, 1]) {
          ctx.fillStyle = p.body;
          ctx.beginPath();
          ctx.moveTo(side * baseR * 0.30, -baseR * 1.5);
          ctx.lineTo(side * baseR * 0.95, -baseR * 2.25);
          ctx.lineTo(side * baseR * 1.05, -baseR * 1.30);
          ctx.closePath();
          ctx.fill();
          ctx.fillStyle = p.belly;
          ctx.beginPath();
          ctx.moveTo(side * baseR * 0.42, -baseR * 1.55);
          ctx.lineTo(side * baseR * 0.88, -baseR * 2.05);
          ctx.lineTo(side * baseR * 0.95, -baseR * 1.40);
          ctx.closePath();
          ctx.fill();
        }
        break;
      case 'koala':
        for (const side of [-1, 1]) {
          ctx.fillStyle = p.body;
          ctx.beginPath();
          ctx.ellipse(side * baseR * 1.05, -baseR * 1.35, baseR * 0.40, baseR * 0.46, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = p.belly;
          ctx.beginPath();
          ctx.ellipse(side * baseR * 1.05, -baseR * 1.35, baseR * 0.20, baseR * 0.24, 0, 0, Math.PI * 2);
          ctx.fill();
        }
        break;
      default:
        break;
    }
  }

  drawHexagon(ctx, x, y, r) {
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i - Math.PI / 2;
      const px = x + Math.cos(angle) * r;
      const py = y + Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
  }
}
