import { CheckCircle2, X } from 'lucide-react';
import { useState } from 'react';
import { PRICING_TIERS, SKILLS } from '../data/skills';
import { getTierLifetimePrice, isValidEmail, PlanTier } from '../utils/tiers';

interface CheckoutModalProps {
  targetTier: PlanTier | null;
  onClose: () => void;
  onActivateTier: (tier: PlanTier, email: string) => void;
}

export function CheckoutModal({
  targetTier,
  onClose,
  onActivateTier,
}: CheckoutModalProps) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);

  if (!targetTier) return null;

  const tierSpec = PRICING_TIERS.find((t) => t.id === targetTier)!;
  const price = getTierLifetimePrice(targetTier);
  const unlockedNames = tierSpec.includedSkills
    .map((id) => SKILLS.find((s) => s.id === id)?.name)
    .filter(Boolean)
    .join(', ');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidEmail(email)) {
      setError('Enter a valid email address to issue your lifetime skill license.');
      return;
    }
    setError(null);
    setCompleted(true);
    onActivateTier(targetTier, email.trim());
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="checkout-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm"
    >
      <div className="w-full max-w-md rounded-2xl border border-white/12 bg-[#0d101b] p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-[var(--accent)]">Patchwork Lifetime License</p>
            <h2 id="checkout-modal-title" className="font-display mt-1 text-2xl font-medium text-[var(--text)]">
              Activate {tierSpec.name} Tier
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close license modal"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-soft)] hover:bg-white/10 hover:text-[var(--text)] cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {completed ? (
          <div className="mt-6 space-y-4">
            <div className="flex items-start gap-3 rounded-xl border border-emerald-400/25 bg-emerald-500/10 p-4">
              <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-emerald-300" />
              <div className="text-sm text-[var(--text)]">
                <p className="font-semibold">{tierSpec.name} lifetime access active</p>
                <p className="mt-1 text-[var(--text-soft)]">
                  Unlocked permanent downloads for {unlockedNames}. Your skill files are ready to download immediately.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-[#06070c] hover:bg-[#95b6ff] cursor-pointer"
            >
              Continue to Downloads
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-5 space-y-4" noValidate>
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <div className="flex items-baseline justify-between">
                <span className="text-sm font-medium text-[var(--text)]">{tierSpec.name} Plan</span>
                <span className="font-mono text-lg font-semibold tabular-nums text-[var(--text)]">
                  ${price}
                  <span className="ml-1.5 text-xs font-normal text-[var(--muted)]">
                    {price === 0 ? 'forever' : 'lifetime'}
                  </span>
                </span>
              </div>
              <p className="mt-1.5 text-xs text-[var(--text-soft)]">
                Includes permanent access to: {unlockedNames}
              </p>
            </div>

            <div>
              <label htmlFor="license-email" className="block text-xs font-medium text-[var(--text-soft)]">
                Delivery email
              </label>
              <input
                id="license-email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="editor@studio.com"
                className="mt-1.5 w-full rounded-lg border border-white/15 bg-[#06070c] px-3.5 py-2.5 text-sm text-[var(--text)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none"
              />
              {error && (
                <p role="alert" className="mt-1.5 text-xs text-red-400">
                  {error}
                </p>
              )}
            </div>

            <div className="flex items-center gap-3 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-lg border border-white/12 px-4 py-2.5 text-sm font-medium text-[var(--text-soft)] hover:bg-white/5 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-[#06070c] hover:bg-[#95b6ff] cursor-pointer"
              >
                {price === 0 ? 'Activate Free' : `Unlock ${tierSpec.name} ($${price})`}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
