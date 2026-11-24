import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeBaseSize,
  computeCellSize,
  computeDepth,
  computeTargetPopulation,
  evalPolarLobe,
  mixRgb,
  rotateHueRgb,
} from './animalMath';

test('computeCellSize matches 1440px detail 1.3 baseline of 9x13 px', () => {
  const { cw, ch } = computeCellSize(1440, 1.3);
  assert.equal(cw, 9);
  assert.equal(ch, 13);
});

test('computeCellSize clamps bounds cleanly', () => {
  assert.equal(computeCellSize(320, 2).cw, 5);
  assert.equal(computeCellSize(4000, 0.5).cw, 24);
});

test('computeTargetPopulation stays bounded 1..200', () => {
  const base = computeBaseSize(1440, 900, 1);
  const pop = computeTargetPopulation(1440, 900, 48000, base, 1, 1.05);
  assert.ok(pop >= 1 && pop <= 200);
  assert.equal(computeTargetPopulation(100, 100, 500000, 100, 1, 0.1), 1);
});

test('computeDepth respects farthest floor and roll=1 ceiling', () => {
  assert.equal(computeDepth(0, 0.18, 1.7), 0.18);
  assert.equal(computeDepth(1, 0.18, 1.7), 1);
});

test('mixRgb and rotateHueRgb preserve valid 0..255 channel bounds', () => {
  assert.deepEqual(mixRgb([0, 0, 0], [100, 200, 50], 0.5), [50, 100, 25]);
  assert.deepEqual(rotateHueRgb([232, 162, 124], 0), [232, 162, 124]);
  const rotated = rotateHueRgb([232, 162, 124], 120);
  assert.ok(rotated.every((c) => c >= 0 && c <= 255));
});

test('evalPolarLobe peaks inside angle range and returns 0 outside', () => {
  assert.equal(evalPolarLobe(-1.2, -0.78, 0.46, 0.64, 0.7, 0.3), 0);
  const mid = evalPolarLobe(0.088, -0.78, 0.46, 0.64, 0.7, 0.3);
  assert.ok(mid > 0.55 && mid <= 0.64);
});
