import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getTierLifetimePrice,
  getUnlockedSkillsForTier,
  isSkillUnlocked,
  isValidEmail,
} from './tiers';

test('free tier unlocks only hydrogen', () => {
  assert.deepEqual(getUnlockedSkillsForTier('free'), ['hydrogen']);
  assert.equal(isSkillUnlocked('free', 'hydrogen'), true);
  assert.equal(isSkillUnlocked('free', 'carbon'), false);
  assert.equal(isSkillUnlocked('free', 'argon'), false);
  assert.equal(isSkillUnlocked('free', 'neon'), false);
});

test('pro tier unlocks hydrogen and carbon', () => {
  assert.deepEqual(getUnlockedSkillsForTier('pro'), ['hydrogen', 'carbon']);
  assert.equal(isSkillUnlocked('pro', 'carbon'), true);
  assert.equal(isSkillUnlocked('pro', 'argon'), false);
});

test('max tier unlocks argon, neon, carbon, and hydrogen', () => {
  assert.deepEqual(getUnlockedSkillsForTier('max'), ['hydrogen', 'carbon', 'argon', 'neon']);
  assert.equal(isSkillUnlocked('max', 'argon'), true);
  assert.equal(isSkillUnlocked('max', 'neon'), true);
});

test('lifetime pricing returns one-time fees for free, pro, and max', () => {
  assert.equal(getTierLifetimePrice('free'), 0);
  assert.equal(getTierLifetimePrice('pro'), 39);
  assert.equal(getTierLifetimePrice('max'), 99);
});

test('email validation rejects malformed inputs and accepts valid addresses', () => {
  assert.equal(isValidEmail(''), false);
  assert.equal(isValidEmail('editor@studio'), false);
  assert.equal(isValidEmail('rosalie@patchwork.video'), true);
});
