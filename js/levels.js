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
const WIDE_GAP = 140;     // an extra-wide pit, used occasionally in later worlds
const SEG_MIN = 360;      // minimum ground segment width
const SEG_MAX = 560;      // maximum ground segment width
const SPIKE_W = 40;
const WIDE_SPIKE_W = 76;  // a wider hazard, used occasionally in later worlds
const SPIKE_MARGIN = 120; // min distance from a segment edge to a spike
const BLOCK_MARGIN = 100; // min distance from a segment edge to a decor block

// Springs/moving platforms only start showing up in later worlds, and
// springs need a wide, flat landing zone for their bounce arc (~240px of
// horizontal travel at full run speed).
const MOVING_MIN_T = 0.15;
const SPRING_MIN_T = 0.3;
const SPRING_PROB = 0.35;
const SPRING_SEG_MIN = 400;  // minimum segment width that can host a spring
const SPRING_MARGIN = 60;    // min distance from segment start to the spring
const SPRING_LAND_CLEAR = 300; // space reserved after the spring for the bounce arc to land

// Procedurally builds a level: a chain of ground segments separated by
// pits, with the occasional spike and floating decor block placed well
// clear of every segment edge so the gap-jumps stay reliable.
//
// `t` is the level's position in the overall campaign (0 = easiest, 1 =
// hardest), used to smoothly ramp up hazard density across every level.
// Worlds 7-12 (id >= 50) are "advanced": on top of that curve they're a
// little longer and can mix in wider pits, wider spikes, and sideways
// moving platforms for extra variety.
function generateLevel(id, theme, name, world, totalLevels) {
  const rng = mulberry32(1000 + id);
  const t = totalLevels > 1 ? id / (totalLevels - 1) : 0;
  const advanced = id >= 50;
  const numSegments = 8 + Math.floor(t * 4) + (advanced ? 2 : 0); // 8..12, or 12..14 for advanced worlds

  const platforms = [];
  const spikes = [];
  const springs = [];
  const stars = [];
  const segments = [];

  // Advanced worlds occasionally widen a pit beyond the usual SAFE_GAP,
  // requiring a longer running jump (chance grows from 0 to 30%).
  const wideGapChance = advanced ? Math.max(0, (t - 0.5) * 0.6) : 0;

  let x = 0;
  for (let i = 0; i < numSegments; i++) {
    const width = Math.round(SEG_MIN + rng() * (SEG_MAX - SEG_MIN));
    segments.push({ x, width });
    platforms.push(ground(x, width));
    x += width;
    if (i < numSegments - 1) {
      const gap = advanced && rng() < wideGapChance ? WIDE_GAP : SAFE_GAP;
      x += gap;
    }
  }
  const levelWidth = x;

  const spikeProb = 0.35 + t * 0.45;
  const blockProb = 0.45;

  const movingProb = Math.min(0.5, Math.max(0, 0.15 + t * 0.35));

  // Advanced worlds occasionally use a wider spike (chance grows from 0 to
  // 30%) and let moving decor slide sideways instead of just up and down.
  const wideSpikeChance = advanced ? Math.max(0, (t - 0.5) * 0.6) : 0;
  const horizontalMoveChance = advanced ? 0.4 : 0;

  segments.forEach((seg, i) => {
    const isFirst = i === 0;
    const isLast = i === numSegments - 1;

    let hasSpike = false;
    if (!isFirst && !isLast && rng() < spikeProb) {
      const spikeW = advanced && rng() < wideSpikeChance ? WIDE_SPIKE_W : SPIKE_W;
      const minX = seg.x + SPIKE_MARGIN;
      const maxX = seg.x + seg.width - SPIKE_MARGIN - spikeW;
      const sx = Math.round(minX + rng() * Math.max(0, maxX - minX));
      spikes.push(spike(sx, spikeW));
      hasSpike = true;
    }

    if (hasSpike) return;

    // Springs bounce the player straight up; only placed in wide,
    // hazard-free segments in later worlds so the bounce arc has room to
    // land back on solid ground.
    if (!isFirst && !isLast && t >= SPRING_MIN_T && seg.width >= SPRING_SEG_MIN && rng() < SPRING_PROB) {
      const maxOffset = seg.width - SPRING_MARGIN - SPRING_LAND_CLEAR;
      const sx = Math.round(seg.x + SPRING_MARGIN + rng() * Math.max(0, maxOffset));
      springs.push(spring(sx, GROUND_Y));
      return;
    }

    // Decor blocks (some of which oscillate as moving platforms in later
    // worlds) only go in spike- and spring-free segments: the bot never
    // jumps mid-segment there, so it can't land on one and get stranded.
    if (rng() < blockProb) {
      const maxBlockW = seg.width - BLOCK_MARGIN * 2;
      const bw = Math.round(Math.min(maxBlockW, 80 + rng() * 70));
      const minX = seg.x + BLOCK_MARGIN;
      const maxX = seg.x + seg.width - BLOCK_MARGIN - bw;
      const bx = Math.round(minX + rng() * Math.max(0, maxX - minX));
      const bh = rng() < 0.5 ? 20 : 24;
      const by = Math.round(GROUND_Y - 90 - rng() * 60);

      if (t >= MOVING_MIN_T && rng() < movingProb) {
        const amplitude = Math.round(12 + rng() * 10);
        const speed = 1 + rng();
        const phase = rng() * Math.PI * 2;
        let axis = 'y';
        if (advanced && rng() < horizontalMoveChance) axis = 'x';
        platforms.push(moving(bx, by, bw, bh, axis, amplitude, speed, phase));
      } else {
        platforms.push(block(bx, by, bw, bh));
      }
    }
  });

  // Three stars at roughly 20% / 50% / 80% through the level, each within
  // easy jump reach above the ground. In advanced worlds the middle star
  // sits near the top of a full jump arc for an extra bit of precision.
  [0.2, 0.5, 0.8].forEach((frac, i) => {
    const segIndex = Math.min(numSegments - 1, Math.floor(frac * numSegments));
    const seg = segments[segIndex];
    const sx = Math.round(seg.x + seg.width / 2);
    const sy = advanced && i === 1
      ? Math.round(GROUND_Y - 95 - rng() * 25)
      : Math.round(GROUND_Y - 60 - rng() * 40);
    stars.push(star(sx, sy));
  });

  return {
    id,
    name,
    world,
    theme,
    width: levelWidth,
    playerStart: PLAYER_START,
    platforms,
    spikes,
    springs,
    stars,
    goal: { x: levelWidth - 60, y: GROUND_Y },
  };
}

// 100 levels across 12 themed worlds, ordered easiest to hardest.
const WORLDS = [
  {
    theme: 'meadow',
    displayName: 'Meadow',
    names: [
      'Sunny Meadow', 'Buzzing Meadow', 'Daisy Fields', 'Clover Hill',
      'Breezy Pasture', 'Picnic Plains', 'Butterfly Glade', 'Meadow Lookout',
    ],
  },
  {
    theme: 'desert',
    displayName: 'Desert',
    names: [
      'Desert Dunes', 'Cactus Canyon', 'Mirage Flats', 'Sandy Switchback',
      'Oasis Trail', 'Dune Drifter', 'Scorching Sands', 'Sunbaked Ridge',
    ],
  },
  {
    theme: 'forest',
    displayName: 'Forest',
    names: [
      'Forest Heights', 'Mossy Hollow', 'Pinewood Path', 'Acorn Trail',
      'Fern Gully', 'Whispering Woods', 'Treetop Trail', 'Forest Canopy',
    ],
  },
  {
    theme: 'snow',
    displayName: 'Snow',
    names: [
      'Snowy Peaks', 'Frosty Ridge', 'Icicle Pass', 'Powder Slopes',
      'Glacier Walk', 'Frozen Lake', 'Snowdrift Trail', 'Blizzard Bluff',
      'Polar Summit',
    ],
  },
  {
    theme: 'sunset',
    displayName: 'Sunset',
    names: [
      'Sunset Cliffs', 'Golden Hour', 'Amber Ridge', 'Twilight Trail',
      'Dusky Bluffs', 'Evening Glow', 'Sunset Overlook', 'Rosy Horizon',
      'Starlit Cliffs',
    ],
  },
  {
    theme: 'candy',
    displayName: 'Candy',
    names: [
      'Candy Castle', 'Lollipop Lane', 'Gumdrop Hills', 'Marshmallow Meadow',
      'Cotton Candy Clouds', 'Chocolate River', 'Peppermint Pass', 'Sweetshop Summit',
    ],
  },
  {
    theme: 'jungle',
    displayName: 'Jungle',
    names: [
      'Jungle Treetops', 'Vine Valley', 'Banana Grove', 'Monkey Bridge',
      'Tangled Thicket', 'Waterfall Wilds', 'Parrot Perch', 'Emerald Canopy',
    ],
  },
  {
    theme: 'ocean',
    displayName: 'Ocean',
    names: [
      'Tidepool Shore', 'Coral Cove', 'Sandbar Stroll', 'Shipwreck Bay',
      'Lighthouse Point', 'Seashell Strand', 'Wavecrest Pier', 'Deep Blue Lagoon',
    ],
  },
  {
    theme: 'cave',
    displayName: 'Cave',
    names: [
      'Crystal Cavern', 'Glowworm Grotto', 'Echo Tunnels', 'Stalactite Steps',
      'Underground Lake', 'Gem Mine Shaft', 'Bat Hollow', 'Crystal Throne',
    ],
  },
  {
    theme: 'volcano',
    displayName: 'Volcano',
    names: [
      'Volcano Foothills', 'Ember Ridge', 'Magma Flow', 'Cinder Slopes',
      'Ashfall Trail', 'Lava Falls', 'Smoking Crater', 'Molten Pass',
      'Volcano Summit',
    ],
  },
  {
    theme: 'sky',
    displayName: 'Sky',
    names: [
      'Cloud Steps', 'Floating Isles', 'Rainbow Ridge', 'Sky Garden',
      'Windy Heights', 'Stormy Platforms', 'Aurora Path', 'Cloud Kingdom',
      'Sky Castle',
    ],
  },
  {
    theme: 'space',
    displayName: 'Space',
    names: [
      'Launchpad Lane', 'Asteroid Belt', 'Comet Trail', 'Lunar Crater',
      'Meteor Field', 'Galaxy Drift', 'Nebula Nest', 'Starbound Summit',
    ],
  },
];

export const LEVELS = [];
{
  const totalLevels = WORLDS.reduce((sum, w) => sum + w.names.length, 0);
  let id = 0;
  for (const world of WORLDS) {
    for (const name of world.names) {
      LEVELS.push(generateLevel(id, world.theme, name, world.displayName, totalLevels));
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
  jungle: {
    skyTop: '#BFE8C0', skyBottom: '#EFFAEC',
    groundTop: '#8FBF6A', groundBody: '#7A8C4E',
    accent: '#F0C955', accent2: '#E8966B',
    decor: 'jungle',
  },
  ocean: {
    skyTop: '#A9D8EC', skyBottom: '#EAF8FB',
    groundTop: '#F0DFB0', groundBody: '#D9C18A',
    accent: '#FFFFFF', accent2: '#5CAFCB',
    decor: 'ocean',
  },
  cave: {
    skyTop: '#6E6A8C', skyBottom: '#B0A8C9',
    groundTop: '#A89AB8', groundBody: '#766486',
    accent: '#BCE8F0', accent2: '#F0D9F5',
    decor: 'cave',
  },
  volcano: {
    skyTop: '#F0A878', skyBottom: '#FBD8B8',
    groundTop: '#8C7268', groundBody: '#5C4A42',
    accent: '#F0703D', accent2: '#FFD27A',
    decor: 'volcano',
  },
  sky: {
    skyTop: '#A8D4F0', skyBottom: '#EAF7FF',
    groundTop: '#F5F5FF', groundBody: '#D8E0F0',
    accent: '#FFE8A8', accent2: '#F0A8D0',
    decor: 'sky',
  },
  space: {
    skyTop: '#2A2A52', skyBottom: '#54508C',
    groundTop: '#B0A0E0', groundBody: '#7A6CB0',
    accent: '#F0D955', accent2: '#8FE8E0',
    decor: 'space',
  },
};
