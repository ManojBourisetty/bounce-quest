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

export const LEVELS = [
  {
    id: 0,
    name: 'Sunny Meadow',
    theme: 'meadow',
    width: 2200,
    playerStart: PLAYER_START,
    platforms: [
      ground(0, 480),
      ground(580, 420),
      ground(1100, 350),
      block(1420, 290, 180, 24),
      ground(1600, 600),
    ],
    spikes: [spike(760, 40), spike(1850, 40)],
    springs: [],
    stars: [star(300, 300), star(850, 290), star(1500, 220)],
    goal: { x: 2140, y: GROUND_Y },
  },
  {
    id: 1,
    name: 'Desert Dunes',
    theme: 'desert',
    width: 2800,
    playerStart: PLAYER_START,
    platforms: [
      ground(0, 420),
      ground(540, 360),
      ground(1020, 280),
      block(1430, 280, 320, 24),
      ground(1750, 400),
      ground(2260, 540),
    ],
    spikes: [spike(650, 40), spike(1950, 40)],
    springs: [spring(1240)],
    stars: [star(250, 300), star(750, 290), star(1600, 210)],
    goal: { x: 2740, y: GROUND_Y },
  },
  {
    id: 2,
    name: 'Forest Heights',
    theme: 'forest',
    width: 3000,
    playerStart: PLAYER_START,
    platforms: [
      ground(0, 400),
      ground(520, 320),
      block(650, 290, 100, 20),
      ground(980, 340),
      ground(1460, 340),
      ground(1940, 340),
      ground(2420, 580),
    ],
    spikes: [spike(680, 40), spike(1600, 40), spike(2120, 40)],
    springs: [],
    stars: [star(200, 300), star(700, 250), star(2100, 300)],
    goal: { x: 2940, y: GROUND_Y },
  },
  {
    id: 3,
    name: 'Snowy Peaks',
    theme: 'snow',
    width: 3000,
    playerStart: PLAYER_START,
    platforms: [
      ground(0, 400),
      block(560, 260, 260, 24),
      ground(760, 260),
      ground(1140, 260),
      block(1560, 220, 340, 24),
      ground(1480, 420),
      moving(2300, 250, 90, 20, 'y', 80, 1.2),
      ground(2020, 980),
    ],
    spikes: [spike(660, 40, 260), spike(900, 40), spike(1700, 40), spike(2200, 40), spike(2700, 40)],
    springs: [spring(340), spring(1340)],
    stars: [star(200, 300), star(680, 190), star(2345, 140)],
    goal: { x: 2940, y: GROUND_Y },
  },
  {
    id: 4,
    name: 'Sunset Cliffs',
    theme: 'sunset',
    width: 3400,
    playerStart: PLAYER_START,
    platforms: [
      ground(0, 380),
      ground(500, 300),
      moving(900, 300, 110, 20, 'x', 80, 1.0),
      ground(1080, 320),
      block(1560, 230, 380, 24),
      ground(1480, 460),
      moving(2200, 240, 90, 20, 'y', 90, 1.3),
      ground(2070, 260),
      ground(2450, 950),
    ],
    spikes: [
      spike(620, 40),
      spike(1150, 40),
      spike(1700, 40),
      spike(2150, 40),
      spike(2600, 40),
      spike(2950, 40),
    ],
    springs: [spring(1340)],
    stars: [star(200, 300), star(950, 240), star(2245, 100)],
    goal: { x: 3340, y: GROUND_Y },
  },
  {
    id: 5,
    name: 'Candy Castle',
    theme: 'candy',
    width: 3600,
    playerStart: PLAYER_START,
    platforms: [
      ground(0, 350),
      ground(470, 410),
      block(620, 280, 100, 20),
      ground(1000, 410),
      block(1150, 250, 100, 20),
      ground(1530, 410),
      block(1680, 260, 100, 20),
      ground(2060, 410),
      block(2210, 240, 100, 20),
      ground(2590, 410),
      ground(3120, 480),
    ],
    spikes: [
      spike(700, 40),
      spike(1250, 40),
      spike(1750, 40),
      spike(2300, 40),
      spike(2800, 40),
      spike(3300, 40),
    ],
    springs: [],
    stars: [star(200, 300), star(670, 250), star(2260, 200)],
    goal: { x: 3540, y: GROUND_Y },
  },
];

export const THEMES = {
  meadow: {
    skyTop: '#8ED8F8', skyBottom: '#E3F8FF',
    groundTop: '#7CCB6D', groundBody: '#C68958',
    accent: '#FFE26B', accent2: '#FFFFFF',
    decor: 'meadow',
  },
  desert: {
    skyTop: '#FFD9A0', skyBottom: '#FFF3DD',
    groundTop: '#E8C170', groundBody: '#C99A52',
    accent: '#FF9F5A', accent2: '#5B8C4A',
    decor: 'desert',
  },
  forest: {
    skyTop: '#A8E6CF', skyBottom: '#E6FBF0',
    groundTop: '#4F9A5B', groundBody: '#7A5230',
    accent: '#2F6B3C', accent2: '#FFD9A0',
    decor: 'forest',
  },
  snow: {
    skyTop: '#BFE3F0', skyBottom: '#F2FBFF',
    groundTop: '#FFFFFF', groundBody: '#C9D6E3',
    accent: '#9FC9E0', accent2: '#FFFFFF',
    decor: 'snow',
  },
  sunset: {
    skyTop: '#FF9A76', skyBottom: '#FFD3A5',
    groundTop: '#8B5E3C', groundBody: '#6B4423',
    accent: '#FF6FAE', accent2: '#FFE26B',
    decor: 'sunset',
  },
  candy: {
    skyTop: '#FFD1E8', skyBottom: '#F8E1FF',
    groundTop: '#FF9FCB', groundBody: '#C77DFF',
    accent: '#FFFFFF', accent2: '#6FE7FF',
    decor: 'candy',
  },
};
