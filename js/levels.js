// Level data for Bounce Quest.
// World coordinate system: y grows downward. GROUND_Y is the top surface
// of the main ground strip. Pits (gaps with no platform) are deadly.

export const GROUND_Y = 360;
const GROUND_THICK = 140;

// Ground segments can sit at different heights ("top"); their bottom always
// reaches the same depth, so a raised segment reads as a solid hill rather
// than a floating slab.
function ground(x, w, top = GROUND_Y) {
  return { type: 'ground', x, y: top, w, h: GROUND_THICK + (GROUND_Y - top) };
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
const UP_GAP = 56;        // narrower pit used before a step UP, so the rise stays jumpable

// Ground segments rise and fall across the level to give each one a distinct
// silhouette. Step-ups are kept small (and paired with a narrow gap) so a
// single jump always clears them; step-downs can be steeper since falling is
// free. Heights stay within a band that keeps everything on screen.
const ELEV_MIN_TOP = GROUND_Y - 156;
const ELEV_MAX_TOP = GROUND_Y + 24;
const SEG_MIN = 360;      // minimum ground segment width
const SEG_MAX = 560;      // maximum ground segment width
const SPIKE_W = 40;
const WIDE_SPIKE_W = 76;  // a wider hazard, used occasionally in later worlds
const SPIKE_MARGIN = 120; // min distance from a segment edge to a spike
const BRIDGE_MARGIN = 12; // min gap from a pit's edge to a bridging platform

// Springs/moving platforms only start showing up in later worlds, and
// springs need a wide, flat landing zone for their bounce arc (~240px of
// horizontal travel at full run speed).
const MOVING_MIN_T = 0.15;
const SPRING_MIN_T = 0.3;
const SPRING_PROB = 0.35;
const SPRING_SEG_MIN = 400;  // minimum segment width that can host a spring
const SPRING_MARGIN = 60;    // min distance from segment start to the spring
const SPRING_LAND_CLEAR = 300; // space reserved after the spring for the bounce arc to land

// A normal jump clears about 110px (JUMP_VELOCITY^2 / (2 * GRAVITY)); a
// star perched higher than that is out of reach without a spring, so the
// spring under it is obviously "what that's for" rather than a random prop.
const SPRING_STAR_MIN_LIFT = 150;
const SPRING_STAR_LIFT_RANGE = 30;

const BRIDGE_PROB = 0.4; // chance a jumpable pit also gets an optional aerial shortcut

// Procedurally builds a level: a chain of ground segments separated by
// pits, with the occasional spike, an optional bridge platform spanning a
// pit, and springs that always sit under a hard-to-reach star.
//
// `t` is the level's position on the difficulty curve (0 = easiest, 1 =
// as hard as the original 100-level campaign ever got; worlds added later
// can push past 1 to keep ramping). It's passed in explicitly rather than
// derived from `id`/level count here, so adding more levels later can't
// retroactively reshuffle any existing level's layout.
// Worlds 7-12 (id >= 50) are "advanced": on top of that curve they're a
// little longer and can mix in wider pits, wider spikes, and sideways
// moving platforms for extra variety.
function generateLevel(id, theme, name, world, t) {
  const rng = mulberry32(1000 + id);
  const advanced = id >= 50;
  const numSegments = 8 + Math.floor(t * 4) + (advanced ? 2 : 0); // 8..12 at t<=1, more for worlds pushing past it

  const platforms = [];
  const spikes = [];
  const springs = [];
  const stars = [];
  const segments = [];
  const gaps = []; // pits between segments; a subset get an optional bridge platform

  // Advanced worlds occasionally widen a pit beyond the usual SAFE_GAP,
  // requiring a longer running jump (chance grows from 0 to 30%).
  const wideGapChance = advanced ? Math.max(0, (t - 0.5) * 0.6) : 0;

  // Elevation deltas grow gently with difficulty: early worlds roll softly,
  // later worlds have taller climbs and steeper drops.
  const upMax = Math.round(34 + t * 18);   // 34..52 px climb per step
  const downMax = Math.round(44 + t * 54); // 44..98 px drop per step

  let x = 0;
  let top = GROUND_Y;
  for (let i = 0; i < numSegments; i++) {
    const width = Math.round(SEG_MIN + rng() * (SEG_MAX - SEG_MIN));
    segments.push({ x, width, top });
    platforms.push(ground(x, width, top));
    x += width;
    if (i < numSegments - 1) {
      // Pick the next segment's height, biased back toward the baseline when
      // we drift far from it so levels keep rolling instead of running away.
      const below = top > GROUND_Y;
      const above = top < GROUND_Y;
      const goUp = above ? rng() < 0.3 : below ? rng() < 0.85 : rng() < 0.5;
      let nextTop;
      if (goUp) {
        nextTop = Math.max(ELEV_MIN_TOP, top - Math.round(18 + rng() * (upMax - 18)));
      } else {
        nextTop = Math.min(ELEV_MAX_TOP, top + Math.round(18 + rng() * (downMax - 18)));
      }
      const stepUp = nextTop < top - 1;
      const gap = stepUp ? UP_GAP : (advanced && rng() < wideGapChance ? WIDE_GAP : SAFE_GAP);
      gaps.push({ x, width: gap, fromTop: top, toTop: nextTop, stepUp });
      x += gap;
      top = nextTop;
    }
  }
  const levelWidth = x;

  // Spike density caps out at the original campaign's hardest point (t=1)
  // even for worlds that push t further, so those later worlds get their
  // extra difficulty from length/gaps/moving platforms instead of nothing
  // but spikes - which would otherwise crowd out spike-free segments and
  // leave no room for springs to ever appear.
  const spikeProb = 0.35 + Math.min(t, 1) * 0.45;
  const movingProb = Math.min(0.5, Math.max(0, 0.15 + t * 0.35));

  // Advanced worlds occasionally use a wider spike (chance grows from 0 to
  // 30%) and let moving decor slide sideways instead of just up and down.
  const wideSpikeChance = advanced ? Math.max(0, (t - 0.5) * 0.6) : 0;
  const horizontalMoveChance = advanced ? 0.4 : 0;

  const segHasSpike = new Array(numSegments).fill(false);
  segments.forEach((seg, i) => {
    const isFirst = i === 0;
    const isLast = i === numSegments - 1;
    if (!isFirst && !isLast && rng() < spikeProb) {
      const spikeW = advanced && rng() < wideSpikeChance ? WIDE_SPIKE_W : SPIKE_W;
      const minX = seg.x + SPIKE_MARGIN;
      const maxX = seg.x + seg.width - SPIKE_MARGIN - spikeW;
      const sx = Math.round(minX + rng() * Math.max(0, maxX - minX));
      spikes.push(spike(sx, spikeW, seg.top));
      segHasSpike[i] = true;
    }
  });

  // Floating "bar" platforms now do a job instead of hovering over ground
  // that's already walkable: they bridge a pit as an optional aerial
  // shortcut. The pit is always clearable with a normal jump on its own
  // (that's unchanged), so the bridge is a bonus route - but it gives the
  // platform an obvious reason to be exactly where it is. Narrow step-up
  // pits are skipped; they're already a tight single-jump gap.
  gaps.forEach((g) => {
    if (g.stepUp) return;
    if (rng() >= BRIDGE_PROB) return;
    const anchorTop = Math.min(g.fromTop, g.toTop);
    const maxW = g.width - BRIDGE_MARGIN * 2;
    const bw = Math.round(Math.min(maxW, 80 + rng() * 70));
    const bx = Math.round(g.x + (g.width - bw) / 2);
    const by = Math.round(anchorTop - 90 - rng() * 60);
    const bh = rng() < 0.5 ? 20 : 24;

    if (t >= MOVING_MIN_T && rng() < movingProb) {
      const amplitude = Math.round(12 + rng() * 10);
      const speed = 1 + rng();
      const phase = rng() * Math.PI * 2;
      const axis = advanced && rng() < horizontalMoveChance ? 'x' : 'y';
      platforms.push(moving(bx, by, bw, bh, axis, amplitude, speed, phase));
    } else {
      platforms.push(block(bx, by, bw, bh));
    }
  });

  // Three stars at roughly 20% / 50% / 80% through the level. A spring only
  // ever appears directly beneath one of these stars, perched above normal
  // jump range - so every spring has an obvious purpose (reach that star)
  // instead of launching into empty sky for no reason. Otherwise a star
  // sits within easy jump reach above the ground, as before (with the
  // advanced-world middle star sitting a bit higher for precision).
  [0.2, 0.5, 0.8].forEach((frac, i) => {
    const segIndex = Math.min(numSegments - 1, Math.floor(frac * numSegments));
    const seg = segments[segIndex];
    const isFirst = segIndex === 0;
    const isLast = segIndex === numSegments - 1;
    const canSpring = t >= SPRING_MIN_T && !isFirst && !isLast &&
      !segHasSpike[segIndex] && seg.width >= SPRING_SEG_MIN && rng() < SPRING_PROB;

    if (canSpring) {
      const maxOffset = seg.width - SPRING_MARGIN - SPRING_LAND_CLEAR;
      const sx = Math.round(seg.x + SPRING_MARGIN + rng() * Math.max(0, maxOffset));
      springs.push(spring(sx, seg.top));
      const sy = Math.round(seg.top - SPRING_STAR_MIN_LIFT - rng() * SPRING_STAR_LIFT_RANGE);
      stars.push(star(sx + 16, sy));
    } else {
      const sx = Math.round(seg.x + seg.width / 2);
      const sy = advanced && i === 1
        ? Math.round(seg.top - 95 - rng() * 25)
        : Math.round(seg.top - 60 - rng() * 40);
      stars.push(star(sx, sy));
    }
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
    goal: { x: levelWidth - 60, y: segments[numSegments - 1].top },
  };
}

// The original 100 levels across 12 themed worlds, ordered easiest to
// hardest. Kept exactly as-is (including how their difficulty `t` is
// computed below) so existing players' star ratings and best times stay
// valid - none of these levels' layouts change when more are added after.
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

// 100 more levels across 12 new worlds, picking up right where the
// original campaign left off. Their difficulty (see EXPANSION_T below)
// keeps ramping past where World 12 topped out, so this is the "advanced
// tier" for players who've cleared everything above.
const EXPANSION_WORLDS = [
  {
    theme: 'autumn',
    displayName: 'Autumn',
    names: [
      'Maple Hollow', 'Pumpkin Patch', 'Acorn Alley', 'Crimson Canopy',
      'Harvest Trail', 'Cider Creek', 'Rustling Leaves', 'Golden Grove',
    ],
  },
  {
    theme: 'beach',
    displayName: 'Beach',
    names: [
      'Sandcastle Cove', 'Tide Pool Trail', 'Palm Shade', 'Driftwood Docks',
      'Seashell Shore', 'Boardwalk Breeze', 'Sunburst Bay', 'Low Tide Lane',
    ],
  },
  {
    theme: 'carnival',
    displayName: 'Carnival',
    names: [
      'Ferris Wheel Field', 'Popcorn Plaza', 'Ring Toss Row', 'Cotton Candy Court',
      'Carousel Circle', 'Funhouse Flats', 'Balloon Boulevard', 'Midway Meadow',
    ],
  },
  {
    theme: 'alpine',
    displayName: 'Alpine',
    names: [
      'Alpine Ascent', 'Frosty Summit', 'Timberline Trail', 'Eagle’s Nest',
      'Snowcap Steps', 'Windy Crag', 'Boulder Bluff', 'Glacier Gate',
      'Peak Point',
    ],
  },
  {
    theme: 'swamp',
    displayName: 'Swamp',
    names: [
      'Mossy Mire', 'Reed Row', 'Cypress Crossing', 'Bog Bridge',
      'Lily Pad Lane', 'Murky Marsh', 'Willow Wetlands', 'Croaking Cove',
      'Swamp Summit',
    ],
  },
  {
    theme: 'toybox',
    displayName: 'Toy Box',
    names: [
      'Building Block Bay', 'Wind-Up Way', 'Marble Maze', 'Puzzle Piece Path',
      'Jack-in-the-Box Junction', 'Toy Soldier Row', 'Rocking Horse Ridge', 'Playroom Peak',
    ],
  },
  {
    theme: 'aurora',
    displayName: 'Northern Lights',
    names: [
      'Moonlit Meadow', 'Borealis Trail', 'Starlight Steppe', 'Northern Notch',
      'Glowing Glacier', 'Twilight Tundra', 'Comet Crest', 'Aurora Summit',
    ],
  },
  {
    theme: 'canyon',
    displayName: 'Canyon',
    names: [
      'Red Rock Ridge', 'Mesa Mile', 'Sunbaked Butte', 'Tumbleweed Trail',
      'Canyon Crossing', 'Dusty Divide', 'Sandstone Steps', 'Mesa Summit',
    ],
  },
  {
    theme: 'reef',
    displayName: 'Coral Reef',
    names: [
      'Coral Cavern', 'Bubble Bay', 'Anemone Alley', 'Clownfish Cove',
      'Kelp Forest Trail', 'Reef Ridge', 'Sunken Ship Shoals', 'Reef Summit',
    ],
  },
  {
    theme: 'firefly',
    displayName: 'Firefly Meadow',
    names: [
      'Firefly Field', 'Dewdrop Trail', 'Cricket Crossing', 'Moonbeam Meadow',
      'Glowworm Grove', 'Lantern Lane', 'Starry Pasture', 'Nightbloom Trail',
      'Meadow Summit',
    ],
  },
  {
    theme: 'rooftop',
    displayName: 'Rooftop',
    names: [
      'Chimney Row', 'Kite String Way', 'Rooftop Garden', 'Skylight Steps',
      'Clothesline Crossing', 'Pigeon Perch', 'Water Tower Walk', 'City Sky Trail',
      'Skyline Summit',
    ],
  },
  {
    theme: 'factory',
    displayName: 'Robo Factory',
    names: [
      'Gearworks Gallery', 'Conveyor Court', 'Circuit Row', 'Piston Plaza',
      'Sprocket Street', 'Assembly Alley', 'Robo Row', 'Factory Summit',
    ],
  },
];

// How much further past t=1 (the original campaign's hardest point) the
// expansion worlds ramp up to by their very last level.
const EXPANSION_EXTRA_DIFFICULTY = 0.3;

export const LEVELS = [];
{
  // The original 100 levels: t computed exactly as it always was, so their
  // layouts - and every existing player's star/best-time progress - don't
  // shift when the campaign grows.
  const originalTotal = WORLDS.reduce((sum, w) => sum + w.names.length, 0);
  let id = 0;
  for (const world of WORLDS) {
    for (const name of world.names) {
      LEVELS.push(generateLevel(id, world.theme, name, world.displayName, id / (originalTotal - 1)));
      id++;
    }
  }

  // The 100 expansion levels: difficulty continues climbing from where the
  // original campaign left off (t=1) up to 1 + EXPANSION_EXTRA_DIFFICULTY.
  const expansionTotal = EXPANSION_WORLDS.reduce((sum, w) => sum + w.names.length, 0);
  let expansionIndex = 0;
  for (const world of EXPANSION_WORLDS) {
    for (const name of world.names) {
      const t = 1 + (expansionIndex / (expansionTotal - 1)) * EXPANSION_EXTRA_DIFFICULTY;
      LEVELS.push(generateLevel(id, world.theme, name, world.displayName, t));
      id++;
      expansionIndex++;
    }
  }
}

const BONUS_WIDTH = 2400;

// Bonus levels: one long, hazard-free stretch of ground packed with springs
// and stars to bounce around in. There's nothing to fail here - every star
// collected becomes a coin, spendable on character skins.
function generateBonusLevel(id, theme, name, world) {
  const rng = mulberry32(5000 + id);
  const platforms = [ground(0, BONUS_WIDTH)];
  const springs = [];
  const stars = [];

  const blockSpecs = [
    { x: 260, y: GROUND_Y - 110, w: 90, h: 22 },
    { x: 700, y: GROUND_Y - 150, w: 90, h: 22, axis: 'y' },
    { x: 1150, y: GROUND_Y - 120, w: 100, h: 22 },
    { x: 1600, y: GROUND_Y - 160, w: 90, h: 22, axis: 'x' },
    { x: 2000, y: GROUND_Y - 110, w: 100, h: 22 },
  ];
  blockSpecs.forEach((b) => {
    if (b.axis) {
      const amplitude = Math.round(14 + rng() * 10);
      const speed = 1 + rng();
      const phase = rng() * Math.PI * 2;
      platforms.push(moving(b.x, b.y, b.w, b.h, b.axis, amplitude, speed, phase));
    } else {
      platforms.push(block(b.x, b.y, b.w, b.h));
    }
  });

  // Springs for big star-collecting bounces.
  [380, 980, 1780].forEach((sx) => springs.push(spring(sx, GROUND_Y)));

  // Low stars sit along the ground for an easy hop; high stars sit near the
  // apex of a spring bounce.
  [150, 230, 850, 1300, 1380, 2050, 2150, 2250].forEach((sx) => {
    stars.push(star(sx, Math.round(GROUND_Y - 55 - rng() * 30)));
  });
  [380, 460, 540, 980, 1060, 1780, 1860].forEach((sx) => {
    stars.push(star(sx, Math.round(GROUND_Y - 190 - rng() * 40)));
  });

  return {
    id,
    name,
    world,
    theme,
    bonus: true,
    width: BONUS_WIDTH,
    playerStart: PLAYER_START,
    platforms,
    spikes: [],
    springs,
    stars,
    goal: { x: BONUS_WIDTH - 60, y: GROUND_Y },
  };
}

// One bonus round after every tenth main level, themed after the world it
// follows.
const BONUS_DEFS = [
  { afterMainId: 9, theme: 'desert', name: 'Desert Bonus Round' },
  { afterMainId: 19, theme: 'forest', name: 'Forest Bonus Round' },
  { afterMainId: 29, theme: 'snow', name: 'Snow Bonus Round' },
  { afterMainId: 39, theme: 'sunset', name: 'Sunset Bonus Round' },
  { afterMainId: 49, theme: 'candy', name: 'Candy Bonus Round' },
  { afterMainId: 59, theme: 'ocean', name: 'Ocean Bonus Round' },
  { afterMainId: 69, theme: 'cave', name: 'Cave Bonus Round' },
  { afterMainId: 79, theme: 'volcano', name: 'Volcano Bonus Round' },
  { afterMainId: 89, theme: 'sky', name: 'Sky Bonus Round' },
  { afterMainId: 99, theme: 'space', name: 'Space Bonus Round' },
  { afterMainId: 109, theme: 'beach', name: 'Beach Bonus Round' },
  { afterMainId: 119, theme: 'carnival', name: 'Carnival Bonus Round' },
  { afterMainId: 129, theme: 'alpine', name: 'Alpine Bonus Round' },
  { afterMainId: 139, theme: 'swamp', name: 'Swamp Bonus Round' },
  { afterMainId: 149, theme: 'toybox', name: 'Toy Box Bonus Round' },
  { afterMainId: 159, theme: 'canyon', name: 'Canyon Bonus Round' },
  { afterMainId: 169, theme: 'reef', name: 'Reef Bonus Round' },
  { afterMainId: 179, theme: 'firefly', name: 'Firefly Bonus Round' },
  { afterMainId: 189, theme: 'rooftop', name: 'Rooftop Bonus Round' },
  { afterMainId: 199, theme: 'factory', name: 'Factory Bonus Round' },
];

export const BONUS_LEVELS = BONUS_DEFS.map((def, i) => ({
  ...generateBonusLevel(i, def.theme, def.name, 'Bonus'),
  afterMainId: def.afterMainId,
}));

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

  // Expansion worlds (levels 101-200).
  autumn: {
    skyTop: '#F5C99B', skyBottom: '#FBE8D0',
    groundTop: '#C97B4A', groundBody: '#8C5A3C',
    accent: '#D9622B', accent2: '#F0C955',
    decor: 'autumn',
  },
  beach: {
    skyTop: '#AEE0EC', skyBottom: '#F5F9EA',
    groundTop: '#F5E3B8', groundBody: '#E0C98A',
    accent: '#FF9F6B', accent2: '#5CC9C2',
    decor: 'beach',
  },
  carnival: {
    skyTop: '#F5C9E0', skyBottom: '#FBEAF5',
    groundTop: '#E0A8C9', groundBody: '#B87A9C',
    accent: '#F0555A', accent2: '#F0D955',
    decor: 'carnival',
  },
  alpine: {
    skyTop: '#C9DCEE', skyBottom: '#EFF6FB',
    groundTop: '#EAF0F5', groundBody: '#9CA8B8',
    accent: '#F0DDB8', accent2: '#5C7C9C',
    decor: 'alpine',
  },
  swamp: {
    skyTop: '#9CB88C', skyBottom: '#D9E8C9',
    groundTop: '#6E8C5A', groundBody: '#4A5C3C',
    accent: '#D9C955', accent2: '#3C6E5A',
    decor: 'swamp',
  },
  toybox: {
    skyTop: '#D9E8F5', skyBottom: '#F5FAFF',
    groundTop: '#F0C955', groundBody: '#D9622B',
    accent: '#E85C7A', accent2: '#5C9CD9',
    decor: 'toybox',
  },
  aurora: {
    skyTop: '#243C6E', skyBottom: '#4A5C9C',
    groundTop: '#D9E8F0', groundBody: '#8C9CB8',
    accent: '#6EDCC9', accent2: '#B88CE8',
    decor: 'aurora',
  },
  canyon: {
    skyTop: '#F0C9A8', skyBottom: '#FBE8D0',
    groundTop: '#D96E4A', groundBody: '#9C4A2E',
    accent: '#E89C6B', accent2: '#8CA85C',
    decor: 'canyon',
  },
  reef: {
    skyTop: '#4AA8C9', skyBottom: '#8CD9E0',
    groundTop: '#E0C98A', groundBody: '#B89A5C',
    accent: '#F07A9C', accent2: '#6EDCC9',
    decor: 'reef',
  },
  firefly: {
    skyTop: '#3C4A6E', skyBottom: '#6E7CA8',
    groundTop: '#5C7C4A', groundBody: '#3C4A2E',
    accent: '#F0D955', accent2: '#8CC9E8',
    decor: 'firefly',
  },
  rooftop: {
    skyTop: '#E8A8B8', skyBottom: '#F5D9C9',
    groundTop: '#9C8C7C', groundBody: '#6E6054',
    accent: '#D96E5C', accent2: '#8CB8D9',
    decor: 'rooftop',
  },
  factory: {
    skyTop: '#B8C9D9', skyBottom: '#E8F0F5',
    groundTop: '#8C9CAA', groundBody: '#5C6C7A',
    accent: '#E8955C', accent2: '#6EC9D9',
    decor: 'factory',
  },
};
