import { Check, Minus } from 'lucide-react';
import { useState } from 'react';
import { AppRoute } from '../components/Navbar';
import { PRICING_TIERS, SKILLS } from '../data/skills';
import {
  getTierLifetimePrice,
  isSkillUnlocked,
  PlanTier,
} from '../utils/tiers';

interface PricingPageProps {
  activeTier: PlanTier;
  onSelectTier: (tier: PlanTier) => void;
  onNavigate: (route: AppRoute) => void;
}

const COMPARISON_ROWS: {
  feature: string;
  free: string | boolean;
  pro: string | boolean;
  max: string | boolean;
}[] = [
  { feature: 'Hydrogen skill (hydrogen.md)', free: true, pro: true, max: true },
  { feature: 'Carbon skill (carbon.md)', free: false, pro: true, max: true },
  { feature: 'Argon skill (argon.md)', free: false, pro: false, max: true },
  { feature: 'Neon skill (neon.md)', free: false, pro: false, max: true },
  { feature: 'Visual shot & typography recipe', free: true, pro: true, max: true },
  { feature: 'Measured BPM & shot-cut JSON', free: false, pro: true, max: true },
  { feature: 'Target clip retiming & beat snap', free: false, pro: true, max: true },
  { feature: 'Face / motion subject reframing', free: false, pro: false, max: true },
  { feature: 'ProRes 4444 alpha graphics pass', free: false, pro: false, max: true },
  { feature: 'Multi-pass QA contact sheet', free: false, pro: false, max: true },
  { feature: 'Lifetime access & schema updates', free: true, pro: true, max: true },
];

export function PricingPage({
  activeTier,
  onSelectTier,
  onNavigate,
}: PricingPageProps) {
  const [faqOpen, setFaqOpen] = useState<number | null>(0);

  const faqs = [
    {
      q: 'Are all paid plans really one-time lifetime purchases?',
      a: 'Yes. Pay once for Pro or Max and keep permanent access to those skill files along with all future workflow and schema updates—no recurring subscriptions.',
    },
    {
      q: 'What does each tier unlock?',
      a: 'Free includes Hydrogen immediately. Pro unlocks Carbon (plus Hydrogen). Max unlocks Argon and Neon along with Carbon and Hydrogen—all four separate skill files.',
    },
    {
      q: 'Can I render graphics separately for Premiere or DaVinci Resolve?',
      a: 'Yes. Argon supports --no-composite --alpha-out text_pass.mov and Neon renders ProRes 4444 overlays so you can adjust typography timing directly in your NLE.',
    },
  ];

  return (
    <div className="mx-auto max-w-[1200px] px-6 pt-28 pb-24">
      <div className="max-w-2xl">
        <p className="text-xs font-medium text-[var(--accent)]">Lifetime Pricing</p>
        <h1 className="font-display mt-2 text-balance text-4xl font-medium tracking-[-0.02em] text-[var(--text)] md:text-5xl">
          Pay once, own the skills for life.
        </h1>
        <p className="mt-4 text-base text-[var(--text-soft)]">
          No subscriptions or monthly renewals. Start free with Hydrogen, unlock Carbon on Pro, or
          get Argon, Neon, and every skill file on Max forever.
        </p>
      </div>

      {/* Three Lifetime Tier Cards */}
      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {PRICING_TIERS.map((tier) => {
          const price = getTierLifetimePrice(tier.id);
          const isCurrent = activeTier === tier.id;
          const skillNames = tier.includedSkills
            .map((id) => SKILLS.find((s) => s.id === id)?.name)
            .join(', ');

          return (
            <div
              key={tier.id}
              className={`flex flex-col justify-between rounded-2xl border p-7 ${
                tier.highlighted
                  ? 'border-[var(--accent)]/60 bg-[var(--surface-elevated)]'
                  : 'border-[var(--border-hairline)] bg-[var(--surface)]'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-2xl font-medium text-[var(--text)]">
                    {tier.name}
                  </h2>
                  {isCurrent && (
                    <span className="text-xs font-medium text-emerald-300">Active plan</span>
                  )}
                </div>

                <div className="mt-5 flex items-baseline gap-2">
                  <span className="font-display text-4xl font-medium tabular-nums text-[var(--text)]">
                    ${price}
                  </span>
                  <span className="text-sm text-[var(--muted)]">
                    {price === 0 ? 'forever' : 'one-time · lifetime'}
                  </span>
                </div>

                <p className="mt-4 text-sm leading-relaxed text-[var(--text-soft)]">
                  {tier.tagline}
                </p>

                <div className="mt-5 border-t border-[var(--border-hairline)] pt-4">
                  <p className="text-xs font-medium text-[var(--accent)]">
                    Skills included: {skillNames}
                  </p>
                  <ul className="mt-4 space-y-2.5 text-sm text-[var(--text-soft)]">
                    {tier.features.map((feat) => (
                      <li key={feat} className="flex items-start gap-2.5">
                        <Check size={15} className="mt-0.5 shrink-0 text-[var(--accent)]" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mt-8">
                {isCurrent ? (
                  <button
                    type="button"
                    onClick={() => onNavigate('products')}
                    className="w-full rounded-lg border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-medium text-[var(--text)] hover:bg-white/10 cursor-pointer"
                  >
                    Download Your Skills
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => onSelectTier(tier.id)}
                    className={`w-full rounded-lg px-4 py-2.5 text-sm font-semibold cursor-pointer transition-colors ${
                      tier.highlighted || tier.id === 'max'
                        ? 'bg-[var(--accent)] text-[#06070c] hover:bg-[#94b5ff]'
                        : 'border border-white/15 bg-white/5 text-[var(--text)] hover:bg-white/10'
                    }`}
                  >
                    {tier.ctaLabel}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Comparison Matrix */}
      <div className="mt-20">
        <h2 className="font-display text-2xl font-medium text-[var(--text)]">
          Skill & capability matrix
        </h2>
        <div className="mt-6 overflow-x-auto rounded-2xl border border-[var(--border-hairline)] bg-[var(--surface)]">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--border-hairline)] text-xs text-[var(--muted)]">
                <th className="px-6 py-4 font-medium">Capability</th>
                <th className="px-6 py-4 font-medium tabular-nums">Free ($0)</th>
                <th className="px-6 py-4 font-medium tabular-nums">
                  Pro (${getTierLifetimePrice('pro')} lifetime)
                </th>
                <th className="px-6 py-4 font-medium tabular-nums">
                  Max (${getTierLifetimePrice('max')} lifetime)
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-hairline)]">
              {COMPARISON_ROWS.map((row) => (
                <tr key={row.feature} className="hover:bg-white/[0.02]">
                  <td className="px-6 py-3.5 text-[var(--text)]">{row.feature}</td>
                  {(['free', 'pro', 'max'] as PlanTier[]).map((col) => {
                    const val = row[col];
                    return (
                      <td key={col} className="px-6 py-3.5 text-[var(--text-soft)]">
                        {val === true ? (
                          <Check size={16} className="text-[var(--accent)]" aria-label="Included" />
                        ) : val === false ? (
                          <Minus size={16} className="text-[var(--muted)]" aria-label="Not included" />
                        ) : (
                          <span>{val}</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Skill Access Summary */}
      <div className="mt-16 grid gap-8 md:grid-cols-2 items-start border-t border-[var(--border-hairline)] pt-12">
        <div>
          <h2 className="font-display text-2xl font-medium text-[var(--text)]">
            Your current skill access
          </h2>
          <p className="mt-2 text-sm text-[var(--text-soft)]">
            Active plan: <strong className="capitalize text-[var(--text)]">{activeTier}</strong>.
            Upgrade once to unlock additional skill files permanently.
          </p>
          <div className="mt-5 grid grid-cols-2 gap-3">
            {SKILLS.map((s) => {
              const ok = isSkillUnlocked(activeTier, s.id);
              return (
                <div
                  key={s.id}
                  className="rounded-xl border border-[var(--border-hairline)] bg-[var(--surface)] px-4 py-3 text-xs"
                >
                  <span className="font-medium text-[var(--text)]">{s.name}</span>
                  <span className="mx-1.5 text-[var(--muted)]">·</span>
                  <span className={ok ? 'text-emerald-300' : 'text-[var(--muted)]'}>
                    {ok ? 'Unlocked' : s.tierLabel}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="font-display text-2xl font-medium text-[var(--text)]">
            Frequently asked
          </h2>
          {faqs.map((item, idx) => {
            const open = faqOpen === idx;
            return (
              <div
                key={item.q}
                className="rounded-xl border border-[var(--border-hairline)] bg-[var(--surface)]"
              >
                <button
                  type="button"
                  aria-expanded={open}
                  onClick={() => setFaqOpen(open ? null : idx)}
                  className="flex w-full items-center justify-between px-4 py-3.5 text-left text-sm font-medium text-[var(--text)] cursor-pointer"
                >
                  <span>{item.q}</span>
                  <span className="text-[var(--muted)]">{open ? '−' : '+'}</span>
                </button>
                {open && (
                  <p className="px-4 pb-4 text-xs leading-relaxed text-[var(--text-soft)]">
                    {item.a}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
