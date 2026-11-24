export type PlanTier = 'free' | 'pro' | 'max';
export type SkillId = 'hydrogen' | 'carbon' | 'argon' | 'neon';

export const TIER_ORDER: Record<PlanTier, number> = {
  free: 0,
  pro: 1,
  max: 2,
};

export const SKILL_REQUIRED_TIER: Record<SkillId, PlanTier> = {
  hydrogen: 'free',
  carbon: 'pro',
  argon: 'max',
  neon: 'max',
};

export function isSkillUnlocked(activeTier: PlanTier, skillId: SkillId): boolean {
  const required = SKILL_REQUIRED_TIER[skillId];
  return TIER_ORDER[activeTier] >= TIER_ORDER[required];
}

export function getUnlockedSkillsForTier(tier: PlanTier): SkillId[] {
  return (['hydrogen', 'carbon', 'argon', 'neon'] as SkillId[]).filter((id) =>
    isSkillUnlocked(tier, id),
  );
}

export function getTierLifetimePrice(tier: PlanTier): number {
  if (tier === 'free') return 0;
  if (tier === 'pro') return 39;
  return 99;
}

export function isValidEmail(email: string): boolean {
  const trimmed = email.trim();
  if (!trimmed || trimmed.length > 254) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(trimmed);
}
