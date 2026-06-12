// Level data for Bounce Quest.
// World coordinate system: y grows downward. GROUND_Y is the top surface
// of the main ground strip. Pits (gaps with no platform) are deadly.

export const GROUND_Y = 360;
const GROUND_THICK = 140;

function ground(x, w) {
  return { type: 'ground', x, y: GROUND_Y, w, h: GROUND_THICK };
}
function block(x, y, w, h) {
  return { type: 'block', x, y, w, h };
}
function moving(baseX, baseY, w, h, axis, amplitude, speed, phase = 0) {
  return { type: 'moving', x: baseX, y: baseY, baseX, baseY, w, h, axis, amplitude, speed, phase };
}
function spike(x, w, y = GROUND_Y) {
  return { x, y: y - 16, w, h: 16 };
}
function spring(x, y = GROUND_Y) {
  return { x, y: y - 20, w: 32, h: 20 };
}
function star(x, y) {
  return { x, y, r: 13 };
}
const PLAYER_START = { x: 40, y: GROUND_Y - 36 };

// Deterministic PRNG (mulberry32) so every level has a fixed, reproducible layout.
function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const SAFE_GAP = 120;     // pit width between ground segments
const SEG_MIN = 360;      // minimum ground segment width
const SEG_MAX = 560;      // maximum ground segment width
const SPIKE_W = 40;
const SPIKE_MARGIN = 120; // min distance from a segment edge to a spike
const BLOCK_MARGIN = 100; // min distance from a segment edge to a decor block

// Procedurally builds a level: a chain of ground segments separated by
// SAFE_GAP pits, with the occasional spike and floating decor block placed
// well clear of every segment edge so the gap-jumps stay reliable.
function generateLevel(id, theme, name) {
  const rng = mulberry32(1000 + id);
  const t = id / 49; // 0 (easiest) .. 1 (hardest) across all 50 levels
  const numSegments = 8 + Math.floor(t * 4); // 8..12 segments

  const platforms = [];
  const spikes = [];
  const stars = [];
  const segments = [];

  let x = 0;
  for (let i = 0; i < numSegments; i++) {
    const width = Math.round(SEG_MIN + rng() * (SEG_MAX - SEG_MIN));
    segments.push({ x, width });
    platforms.push(ground(x, width));
    x += width;
    if (i < numSegments - 1) x += SAFE_GAP;
  }
  const levelWidth = x;

  const spikeProb = 0.35 + t * 0.45;
  const blockProb = 0.45;

  segments.forEach((seg, i) => {
    const isFirst = i === 0;
    const isLast = i === numSegments - 1;

    let hasSpike = false;
    if (!isFirst && !isLast && rng() < spikeProb) {
      const minX = seg.x + SPIKE_MARGIN;
      const maxX = seg.x + seg.width - SPIKE_MARGIN - SPIKE_W;
      const sx = Math.round(minX + rng() * (maxX - minX));
      spikes.push(spike(sx, SPIKE_W));
      hasSpike = true;
    }

    // Decor blocks only go in spike-free segments: the bot never jumps
    // mid-segment there, so it can't land on a block and get stranded.
    if (!hasSpike && rng() < blockProb) {
      const maxBlockW = seg.width - BLOCK_MARGIN * 2;
      const bw = Math.round(Math.min(maxBlockW, 80 + rng() * 70));
      const minX = seg.x + BLOCK_MARGIN;
      const maxX = seg.x + seg.width - BLOCK_MARGIN - bw;
      const bx = Math.round(minX + rng() * Math.max(0, maxX - minX));
      const bh = rng() < 0.5 ? 20 : 24;
      const by = Math.round(GROUND_Y - 90 - rng() * 60);
      platforms.push(block(bx, by, bw, bh));
    }
  });

  // Three stars at roughly 20% / 50% / 80% through the level, each within
  // easy jump reach above the ground.
  [0.2, 0.5, 0.8].forEach((frac) => {
    const segIndex = Math.min(numSegments - 1, Math.floor(frac * numSegments));
    const seg = segments[segIndex];
    const sx = Math.round(seg.x + seg.width / 2);
    const sy = Math.round(GROUND_Y - 60 - rng() * 40);
    stars.push(star(sx, sy));
  });

  return {
    id,
    name,
    theme,
    width: levelWidth,
    playerStart: PLAYER_START,
    platforms,
    spikes,
    springs: [],
    stars,
    goal: { x: levelWidth - 60, y: GROUND_Y },
  };
}

// 50 levels across 6 themed worlds, ordered easiest to hardest.
const WORLDS = [
  {
    theme: 'meadow',
    names: [
      'Sunny Meadow', 'Buzzing Meadow', 'Daisy Fields', 'Clover Hill',
      'Breezy Pasture', 'Picnic Plains', 'Butterfly Glade', 'Meadow Lookout',
    ],
  },
  {
    theme: 'desert',
    names: [
      'Desert Dunes', 'Cactus Canyon', 'Mirage Flats', 'Sandy Switchback',
      'Oasis Trail', 'Dune Drifter', 'Scorching Sands', 'Sunbaked Ridge',
    ],
  },
  {
    theme: 'forest',
    names: [
      'Forest Heights', 'Mossy Hollow', 'Pinewood Path', 'Acorn Trail',
      'Fern Gully', 'Whispering Woods', 'Treetop Trail', 'Forest Canopy',
    ],
  },
  {
    theme: 'snow',
    names: [
      'Snowy Peaks', 'Frosty Ridge', 'Icicle Pass', 'Powder Slopes',
      'Glacier Walk', 'Frozen Lake', 'Snowdrift Trail', 'Blizzard Bluff',
      'Polar Summit',
    ],
  },
  {
    theme: 'sunset',
    names: [
      'Sunset Cliffs', 'Golden Hour', 'Amber Ridge', 'Twilight Trail',
      'Dusky Bluffs', 'Evening Glow', 'Sunset Overlook', 'Rosy Horizon',
      'Starlit Cliffs',
    ],
  },
  {
    theme: 'candy',
    names: [
      'Candy Castle', 'Lollipop Lane', 'Gumdrop Hills', 'Marshmallow Meadow',
      'Cotton Candy Clouds', 'Chocolate River', 'Peppermint Pass', 'Sweetshop Summit',
    ],
  },
];

export const LEVELS = [];
{
  let id = 0;
  for (const world of WORLDS) {
    for (const name of world.names) {
      LEVELS.push(generateLevel(id, world.theme, name));
      id++;
    }
  }
}

// Soft, warm, child-friendly palette inspired by "Bluey" - dusty blues,
// terracotta/rust, mustard, sage, and cream.
export const THEMES = {
  meadow: {
    skyTop: '#AEDCEB', skyBottom: '#F4EBD9',
    groundTop: '#A8C97F', groundBody: '#C9A876',
    accent: '#F0C955', accent2: '#FFFFFF',
    decor: 'meadow',
  },
  desert: {
    skyTop: '#F5D9A8', skyBottom: '#FBEFDD',
    groundTop: '#E0BE82', groundBody: '#C99A66',
    accent: '#E8966B', accent2: '#9CAF88',
    decor: 'desert',
  },
  forest: {
    skyTop: '#BFE0D6', skyBottom: '#EAF6F0',
    groundTop: '#8FB97A', groundBody: '#9C7456',
    accent: '#5C8C6B', accent2: '#F5D9A8',
    decor: 'forest',
  },
  snow: {
    skyTop: '#D6EAF5', skyBottom: '#F7FBFD',
    groundTop: '#FFFFFF', groundBody: '#B8CDDC',
    accent: '#F0DDB8', accent2: '#FFFFFF',
    decor: 'snow',
  },
  sunset: {
    skyTop: '#F0B080', skyBottom: '#FBDCC0',
    groundTop: '#B98A68', groundBody: '#8C6A4E',
    accent: '#E8A0A0', accent2: '#F0C955',
    decor: 'sunset',
  },
  candy: {
    skyTop: '#F5D6E8', skyBottom: '#FBEFF8',
    groundTop: '#F0AFCB', groundBody: '#B89BD9',
    accent: '#FFFFFF', accent2: '#8FC9DE',
    decor: 'candy',
  },
};
