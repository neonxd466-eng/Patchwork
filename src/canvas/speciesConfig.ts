export type SpeciesKey =
  | 'moths'
  | 'rabbits'
  | 'turtles'
  | 'squid'
  | 'owls'
  | 'flyingfish'
  | 'eagles';

export interface TweakControlDef {
  key: string;
  label: string;
  min: number;
  max: number;
  step: number;
  type: 'range' | 'toggle';
  hint: string;
  unit?: string;
}

export interface SpeciesMeta {
  key: SpeciesKey;
  label: string;
  dotColor: string;
  scale: number;
  area: number;
  speed: number;
  trailColor: [number, number, number];
  extent: number;
  hideShimmer?: boolean;
  hideHoldCourse?: boolean;
  speciesGroupTitle: string;
  speciesGroupTitle2?: string;
  speciesControls: TweakControlDef[];
  speciesControls2?: TweakControlDef[];
  defaults: Record<string, number | boolean>;
}

export const SHARED_DEFAULTS: Record<string, number | boolean> = {
  density: 1,
  cornerToCorner: false,
  direction: 49,
  speed: 1,
  sway: 0.04,
  spread: 0.06,
  size: 1,
  farthest: 0.45,
  farBias: 1.6,
  grip: 2,
  separation: 300,
  hue: 0,
  shimmer: 0.3,
  sparkle: 0.12,
  fog: 0.75,
  trail: 1,
  trailFade: 1.3,
  grid: 1.05,
  detail: 1.3,
};

export const GLASS_DEFAULTS = {
  blur: 3.5,
  refraction: 40,
  ripple: 0.007,
  tint: 0,
  edge: 0.55,
  radius: 24,
  width: 720,
};

export const MOVEMENT_CONTROLS: TweakControlDef[] = [
  { key: 'density', label: 'Density', min: 0.1, max: 4, step: 0.05, type: 'range', hint: 'Scales how many animals populate the grid.' },
  { key: 'cornerToCorner', label: 'Corner to corner', min: 0, max: 1, step: 1, type: 'toggle', hint: 'Locks travel along the bottom-left to top-right window diagonal.' },
  { key: 'direction', label: 'Direction', min: 0, max: 360, step: 1, unit: '°', type: 'range', hint: 'Flock heading in degrees (0 = right, 90 = up).' },
  { key: 'speed', label: 'Speed', min: 0.1, max: 3, step: 0.05, type: 'range', hint: 'Overall travel speed multiplier.' },
  { key: 'sway', label: 'Sway', min: 0, max: 0.6, step: 0.01, type: 'range', hint: 'Slow group heading oscillation over time.' },
  { key: 'spread', label: 'Spread', min: 0, max: 0.8, step: 0.01, type: 'range', hint: 'Per-animal heading variance around the course.' },
  { key: 'size', label: 'Size', min: 0.3, max: 2.5, step: 0.05, type: 'range', hint: 'Scales animal span across all depths.' },
  { key: 'farthest', label: 'Farthest depth', min: 0.1, max: 1, step: 0.02, type: 'range', hint: 'Minimum depth scale for the most distant animals.' },
  { key: 'farBias', label: 'Far bias', min: 0.3, max: 3, step: 0.05, type: 'range', hint: 'Exponent pushing more animals toward the background.' },
  { key: 'grip', label: 'Hold course', min: 0.2, max: 5, step: 0.05, type: 'range', hint: 'How strongly animals steer back onto the group heading.' },
  { key: 'separation', label: 'Separation', min: 0, max: 1000, step: 10, type: 'range', hint: 'Repulsion strength between neighbors at similar depth.' },
];

export const LOOK_CONTROLS: TweakControlDef[] = [
  { key: 'hue', label: 'Hue shift', min: -180, max: 180, step: 1, unit: '°', type: 'range', hint: 'Rotates all species colors around the color wheel.' },
  { key: 'shimmer', label: 'Shimmer', min: 0, max: 1, step: 0.02, type: 'range', hint: 'Traveling wave intensity across iridescent cells.' },
  { key: 'sparkle', label: 'Sparkle', min: 0, max: 0.6, step: 0.01, type: 'range', hint: 'Rate of bright white and cyan glyph glints.' },
  { key: 'fog', label: 'Distance fade', min: 0, max: 1, step: 0.02, type: 'range', hint: 'How strongly far animals fade into the night grid.' },
  { key: 'trail', label: 'Trail', min: 0, max: 4, step: 0.05, type: 'range', hint: 'Energy shed behind wings, fins, and hops.' },
  { key: 'trailFade', label: 'Trail fade', min: 0.05, max: 6, step: 0.05, type: 'range', hint: 'Decay speed of trail squares.' },
  { key: 'grid', label: 'Grid', min: 0, max: 4, step: 0.05, type: 'range', hint: 'Opacity of the 1px ASCII cell grid lines.' },
  { key: 'detail', label: 'ASCII detail', min: 0.5, max: 2, step: 0.05, type: 'range', hint: 'Cell density multiplier for the character grid.' },
];

export const SPECIES_LIST: SpeciesMeta[] = [
  {
    key: 'moths',
    label: 'Moth',
    dotColor: 'rgb(232,162,124)',
    scale: 1,
    area: 48000,
    speed: 90,
    trailColor: [255, 196, 156],
    extent: 0.78,
    speciesGroupTitle: 'Flight',
    speciesControls: [
      { key: 'flutter', label: 'Flutter', min: 0, max: 2, step: 0.05, type: 'range', hint: 'Random lateral jitter impulses during flight.' },
      { key: 'glide', label: 'Glide', min: 0, max: 5, step: 0.05, type: 'range', hint: 'Frequency of open-wing soaring glides.' },
      { key: 'flapRate', label: 'Flap rate', min: 0.2, max: 2.5, step: 0.05, type: 'range', hint: 'Wingbeat speed multiplier.' },
    ],
    defaults: {
      ...SHARED_DEFAULTS,
      direction: 49,
      density: 1.05,
      speed: 1.05,
      sway: 0,
      spread: 0,
      size: 1.25,
      farthest: 0.18,
      farBias: 1.7,
      grip: 5,
      separation: 700,
      trail: 1.55,
      trailFade: 0.15,
      flutter: 0,
      glide: 2.75,
      flapRate: 1,
    },
  },
  {
    key: 'rabbits',
    label: 'Rabbit',
    dotColor: 'rgb(248,199,181)',
    scale: 1.15,
    area: 80000,
    speed: 95,
    trailColor: [226, 190, 168],
    extent: 0.56,
    speciesGroupTitle: 'Hopping',
    speciesControls: [
      { key: 'burst', label: 'Burst length', min: 0.2, max: 3, step: 0.05, type: 'range', hint: 'Duration of each bounding run.' },
      { key: 'pause', label: 'Pause length', min: 0, max: 3, step: 0.05, type: 'range', hint: 'Rest time between bursts (0 = nonstop).' },
      { key: 'hopSpeed', label: 'Hop speed', min: 0.3, max: 2.5, step: 0.05, type: 'range', hint: 'Gait stride frequency.' },
      { key: 'scare', label: 'Scare', min: 0, max: 2, step: 0.05, type: 'range', hint: 'Bolt speed and ear-flatten alarm when tapped.' },
    ],
    defaults: {
      ...SHARED_DEFAULTS,
      direction: 0,
      detail: 1.7,
      fog: 0.12,
      density: 1.6,
      sway: 0,
      spread: 0,
      farthest: 0.3,
      farBias: 0.8,
      grip: 3,
      separation: 420,
      trail: 1.2,
      trailFade: 0.35,
      shimmer: 0.1,
      sparkle: 0.03,
      burst: 1,
      pause: 1,
      hopSpeed: 1,
      scare: 0.6,
    },
  },
  {
    key: 'turtles',
    label: 'Sea turtle',
    dotColor: 'rgb(109,176,138)',
    scale: 1.6,
    area: 110000,
    speed: 46,
    trailColor: [110, 200, 186],
    extent: 0.58,
    speciesGroupTitle: 'Swimming',
    speciesGroupTitle2: 'Feeding',
    speciesControls: [
      { key: 'meander', label: 'Meander', min: 0, max: 2, step: 0.05, type: 'range', hint: 'Lazy S-curve swim oscillation.' },
      { key: 'flipperBeat', label: 'Flipper beat', min: 0.2, max: 2.5, step: 0.05, type: 'range', hint: 'Flipper stroke cadence.' },
    ],
    speciesControls2: [
      { key: 'foodRange', label: 'Food range', min: 40, max: 500, step: 10, type: 'range', hint: 'Detection radius for clicked food pellets.' },
    ],
    defaults: {
      ...SHARED_DEFAULTS,
      direction: 49,
      fog: 0.64,
      density: 1.4,
      speed: 1.4,
      spread: 0,
      sway: 0,
      farthest: 0.33,
      farBias: 1.3,
      grip: 2.65,
      separation: 780,
      trail: 3,
      trailFade: 0.4,
      shimmer: 0.35,
      sparkle: 0.08,
      meander: 0.4,
      flipperBeat: 1,
      foodRange: 200,
    },
  },
  {
    key: 'squid',
    label: 'Squid',
    dotColor: 'rgb(232,106,160)',
    scale: 1.55,
    area: 95000,
    speed: 55,
    trailColor: [255, 140, 196],
    extent: 0.86,
    hideShimmer: true,
    speciesGroupTitle: 'Swimming',
    speciesControls: [
      { key: 'pulseRate', label: 'Pulse rate', min: 0.2, max: 2.5, step: 0.05, type: 'range', hint: 'Frequency of mantle jet pulses.' },
      { key: 'pulsePower', label: 'Pulse power', min: 0.2, max: 2.5, step: 0.05, type: 'range', hint: 'Forward thrust generated per pulse.' },
      { key: 'pulseGlow', label: 'Pulse glow', min: 0, max: 2.5, step: 0.05, type: 'range', hint: 'Halo brightness during jet propulsion.' },
      { key: 'armLength', label: 'Arm length', min: 0.4, max: 1.8, step: 0.05, type: 'range', hint: 'Trailing arm and tentacle reach.' },
    ],
    defaults: {
      ...SHARED_DEFAULTS,
      direction: 131,
      speed: 1.05,
      sway: 0.04,
      spread: 0.08,
      farthest: 0.3,
      farBias: 1.4,
      grip: 1.4,
      trail: 0.8,
      trailFade: 0.6,
      sparkle: 0.1,
      pulseRate: 1,
      pulsePower: 1,
      pulseGlow: 1,
      armLength: 1,
    },
  },
  {
    key: 'owls',
    label: 'Owl',
    dotColor: 'rgb(217,195,160)',
    scale: 2.1,
    area: 130000,
    speed: 70,
    trailColor: [236, 212, 170],
    extent: 0.66,
    hideShimmer: true,
    speciesGroupTitle: 'Flight',
    speciesControls: [
      { key: 'hover', label: 'Hover time', min: 0.2, max: 3, step: 0.05, type: 'range', hint: 'Average hover duration before swooping.' },
      { key: 'cruising', label: 'Cruising', min: 0, max: 1, step: 0.02, type: 'range', hint: 'Probability of cruising after a swoop.' },
      { key: 'swoopSpeed', label: 'Swoop speed', min: 0.4, max: 2.5, step: 0.05, type: 'range', hint: 'Dive speed multiplier during swoops.' },
      { key: 'wingbeat', label: 'Wingbeat', min: 0.3, max: 2.2, step: 0.05, type: 'range', hint: 'Flap cadence during hover and cruise.' },
    ],
    defaults: {
      ...SHARED_DEFAULTS,
      direction: 49,
      fog: 0.26,
      density: 1.5,
      sway: 0,
      spread: 0,
      farthest: 0.32,
      farBias: 2.4,
      grip: 5,
      separation: 720,
      trail: 0.6,
      trailFade: 1.2,
      sparkle: 0.08,
      hover: 1.3,
      cruising: 0.5,
      swoopSpeed: 1.3,
      wingbeat: 1,
    },
  },
  {
    key: 'flyingfish',
    label: 'Flying fish',
    dotColor: 'rgb(133,227,221)',
    scale: 1.25,
    area: 85000,
    speed: 80,
    trailColor: [120, 214, 226],
    extent: 0.6,
    hideHoldCourse: true,
    speciesGroupTitle: 'Leaping',
    speciesControls: [
      { key: 'howOften', label: 'How often', min: 0.2, max: 3, step: 0.05, type: 'range', hint: 'How frequently fish launch out of the water.' },
      { key: 'leapLength', label: 'Leap length', min: 0.2, max: 2.5, step: 0.05, type: 'range', hint: 'Horizontal distance covered per glide.' },
      { key: 'leapHeight', label: 'Leap height', min: 0.2, max: 2.5, step: 0.05, type: 'range', hint: 'Peak arc scale lift above the water.' },
    ],
    defaults: {
      ...SHARED_DEFAULTS,
      direction: 131,
      fog: 0,
      size: 1.2,
      density: 1.3,
      sway: 0,
      spread: 0,
      farthest: 0.35,
      farBias: 1.4,
      separation: 450,
      trail: 3.45,
      trailFade: 0.4,
      shimmer: 0.25,
      sparkle: 0.1,
      howOften: 1,
      leapLength: 0.6,
      leapHeight: 1,
    },
  },
  {
    key: 'eagles',
    label: 'Eagle',
    dotColor: 'rgb(230,233,242)',
    scale: 1.5,
    area: 60000,
    speed: 82,
    trailColor: [200, 204, 226],
    extent: 0.68,
    speciesGroupTitle: 'Flight',
    speciesControls: [
      { key: 'wingbeat', label: 'Wingbeat', min: 0.2, max: 2.5, step: 0.05, type: 'range', hint: 'Slow, deliberate wingbeat cadence.' },
      { key: 'glide', label: 'Glide', min: 0, max: 4, step: 0.05, type: 'range', hint: 'Frequency of soaring glides.' },
      { key: 'foldingFlap', label: 'Folding flap', min: 0, max: 1, step: 1, type: 'toggle', hint: 'Folds wrist back during quick upstrokes.' },
    ],
    defaults: {
      ...SHARED_DEFAULTS,
      direction: 49,
      detail: 1.7,
      density: 0.75,
      speed: 1.4,
      sway: 0,
      spread: 0,
      farthest: 0.35,
      farBias: 1.3,
      grip: 3,
      separation: 150,
      trail: 0,
      shimmer: 0.1,
      sparkle: 0.04,
      wingbeat: 0.85,
      glide: 1.6,
      foldingFlap: false,
    },
  },
];

export const SPECIES_BY_KEY: Record<SpeciesKey, SpeciesMeta> = SPECIES_LIST.reduce(
  (acc, item) => {
    acc[item.key] = item;
    return acc;
  },
  {} as Record<SpeciesKey, SpeciesMeta>,
);
