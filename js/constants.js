// Shared tuning constants for Bounce Quest.
// World units are logical pixels at WORLD_HEIGHT tall viewport.

export const WORLD_HEIGHT = 400;

// Physics
export const GRAVITY = 2200;          // px/s^2
export const MAX_FALL_SPEED = 1100;   // px/s
export const MOVE_SPEED = 250;        // px/s max horizontal speed
export const GROUND_ACCEL = 2000;     // px/s^2
export const AIR_ACCEL = 1100;        // px/s^2
export const GROUND_FRICTION = 1800;  // px/s^2 deceleration with no input
export const AIR_FRICTION = 500;      // px/s^2 deceleration with no input

export const JUMP_VELOCITY = 700;     // px/s initial upward speed
export const JUMP_CUT_MULTIPLIER = 0.5; // shorten jump if released early
export const COYOTE_TIME = 0.12;      // seconds after leaving ground you can still jump
export const JUMP_BUFFER = 0.15;      // seconds a jump press is remembered before landing
export const SPRING_VELOCITY = 1050;  // px/s launch speed from springs

export const PLAYER_W = 36;
export const PLAYER_H = 36;

// Camera
export const CAMERA_LERP = 6; // higher = snappier follow

// Star rating thresholds (time in seconds) are defined per-level in levels.js
