export function clamp(value: number, min: number, max: number): number {
  return value < min ? min : value > max ? max : value;
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

export function computeCellSize(viewportWidth: number, detail: number): { cw: number; ch: number } {
  const cw = clamp(Math.round(viewportWidth / 124 / Math.max(0.25, detail)), 5, 24);
  const ch = Math.round(cw * 1.45);
  return { cw, ch };
}

export function computeBaseSize(viewportW: number, viewportH: number, speciesScale: number): number {
  return clamp(Math.min(viewportW, viewportH) * 0.2, 80, 190) * speciesScale;
}

export function computeTargetPopulation(
  viewportW: number,
  viewportH: number,
  area: number,
  baseSize: number,
  speciesScale: number,
  density: number,
): number {
  const norm = baseSize / speciesScale / 160;
  const raw = (viewportW * viewportH) / (area * norm * norm) * density;
  return clamp(Math.round(raw), 1, 200);
}

export function computeDepth(roll: number, farthest: number, farBias: number): number {
  return farthest + (1 - farthest) * Math.pow(clamp(roll, 0, 1), farBias);
}

export function mixRgb(
  a: [number, number, number],
  b: [number, number, number],
  t: number,
): [number, number, number] {
  const k = clamp(t, 0, 1);
  return [
    Math.round(a[0] + (b[0] - a[0]) * k),
    Math.round(a[1] + (b[1] - a[1]) * k),
    Math.round(a[2] + (b[2] - a[2]) * k),
  ];
}

export function rotateHueRgb(
  rgb: [number, number, number],
  degrees: number,
): [number, number, number] {
  if (!degrees) return rgb;
  const rad = (degrees * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  // Luminance-preserving W3C hue-rotate matrix
  const m00 = 0.213 + cos * 0.787 - sin * 0.213;
  const m01 = 0.715 - cos * 0.715 - sin * 0.715;
  const m02 = 0.072 - cos * 0.072 + sin * 0.928;
  const m10 = 0.213 - cos * 0.213 + sin * 0.143;
  const m11 = 0.715 + cos * 0.285 + sin * 0.14;
  const m12 = 0.072 - cos * 0.072 - sin * 0.283;
  const m20 = 0.213 - cos * 0.213 - sin * 0.787;
  const m21 = 0.715 - cos * 0.715 + sin * 0.715;
  const m22 = 0.072 + cos * 0.928 + sin * 0.072;

  const [r, g, b] = rgb;
  return [
    clamp(Math.round(r * m00 + g * m01 + b * m02), 0, 255),
    clamp(Math.round(r * m10 + g * m11 + b * m12), 0, 255),
    clamp(Math.round(r * m20 + g * m21 + b * m22), 0, 255),
  ];
}

export function hashInt(n: number): number {
  let x = n | 0;
  x = ((x >> 16) ^ x) * 0x45d9f3b;
  x = ((x >> 16) ^ x) * 0x45d9f3b;
  x = (x >> 16) ^ x;
  return (x >>> 0) / 4294967296;
}

export function evalPolarLobe(
  angle: number,
  minAngle: number,
  maxAngle: number,
  reach: number,
  peakFrac: number,
  roundness: number,
  scallopCount = 0,
  scallopDepth = 0,
): number {
  if (angle < minAngle || angle > maxAngle) return 0;
  const s = (angle - minAngle) / (maxAngle - minAngle);
  let profile: number;
  if (s < peakFrac) {
    profile = Math.pow(s / Math.max(0.01, peakFrac), roundness);
  } else {
    profile = Math.pow((1 - s) / Math.max(0.01, 1 - peakFrac), roundness);
  }
  const scallop = scallopCount > 0 ? 1 - scallopDepth * (0.5 - 0.5 * Math.cos(s * Math.PI * 2 * scallopCount)) : 1;
  return reach * profile * scallop;
}
