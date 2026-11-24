import { Check, Copy, Download, Lock } from 'lucide-react';
import { useState } from 'react';
import { SKILLS, SkillSpec } from '../data/skills';
import { downloadSkillFile } from '../utils/downloadSkill';
import { isSkillUnlocked, PlanTier, SkillId } from '../utils/tiers';
import { AppRoute } from '../components/Navbar';

interface ProductsPageProps {
  activeTier: PlanTier;
  selectedSkillId: SkillId;
  onSelectSkillId: (id: SkillId) => void;
  onRequestUpgrade: (tier: PlanTier) => void;
  onNavigate: (route: AppRoute) => void;
}

export function ProductsPage({
  activeTier,
  selectedSkillId,
  onSelectSkillId,
  onRequestUpgrade,
  onNavigate,
}: ProductsPageProps) {
  const [copiedId, setCopiedId] = useState<SkillId | null>(null);

  const selectedSkill: SkillSpec =
    SKILLS.find((s) => s.id === selectedSkillId) ?? SKILLS[0];
  const unlocked = isSkillUnlocked(activeTier, selectedSkill.id);

  const handleCopyMarkdown = async (skill: SkillSpec) => {
    try {
      await navigator.clipboard.writeText(skill.rawMarkdown);
      setCopiedId(skill.id);
      window.setTimeout(() => setCopiedId(null), 1600);
    } catch {
      // ignore clipboard errors
    }
  };

  return (
    <div className="mx-auto max-w-[1200px] px-6 pt-28 pb-24">
      <div className="flex flex-col gap-6 border-b border-[var(--border-hairline)] pb-10 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl">
          <p className="text-xs font-medium text-[var(--accent)]">Skill Files & Downloads</p>
          <h1 className="font-display mt-2 text-balance text-4xl font-semibold tracking-tight text-[var(--text)]">
            Four downloadable skills for video reverse engineering.
          </h1>
          <p className="mt-3 text-base leading-relaxed text-[var(--text-soft)]">
            Each skill ships as an independent Markdown specification. Download the file matching
            your workflow and drop it directly into Gemini, Claude, ChatGPT, or Cursor.
          </p>
        </div>

        <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--surface)] px-4 py-3 text-xs">
          <span className="text-[var(--muted)]">Active license: </span>
          <span className="font-semibold capitalize text-[var(--text)]">{activeTier}</span>
          {activeTier !== 'max' && (
            <button
              type="button"
              onClick={() => onNavigate('pricing')}
              className="ml-3 font-medium text-[var(--accent)] hover:underline cursor-pointer"
            >
              Upgrade plan
            </button>
          )}
        </div>
      </div>

      {/* 4 Skill Selector Cards */}
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {SKILLS.map((skill) => {
          const isSelected = skill.id === selectedSkill.id;
          const skillUnlocked = isSkillUnlocked(activeTier, skill.id);
          return (
            <button
              key={skill.id}
              type="button"
              onClick={() => onSelectSkillId(skill.id)}
              className={`flex flex-col justify-between rounded-2xl border p-5 text-left transition-colors cursor-pointer ${
                isSelected
                  ? 'border-[var(--accent)] bg-[var(--surface-elevated)]'
                  : 'border-[var(--border-hairline)] bg-[var(--surface)] hover:border-white/20'
              }`}
            >
              <div>
                <div className="flex items-center justify-between text-xs text-[var(--muted)]">
                  <span className="font-mono font-semibold text-[var(--text-soft)]">
                    {skill.elementSymbol} · {skill.atomicNumber}
                  </span>
                  <span>{skill.tierLabel}</span>
                </div>
                <h2 className="font-display mt-3 text-xl font-semibold text-[var(--text)]">
                  {skill.name}
                </h2>
                <p className="mt-1.5 text-xs leading-relaxed text-[var(--text-soft)]">
                  {skill.tagline}
                </p>
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-[var(--border-hairline)] pt-3 text-xs">
                <span className="font-mono text-[var(--muted)]">{skill.filename}</span>
                <span className={skillUnlocked ? 'text-emerald-300' : 'text-[var(--muted)]'}>
                  {skillUnlocked ? 'Ready' : `${skill.tierLabel} only`}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Detailed Skill Inspector & Download Panel */}
      <div className="mt-10 grid gap-8 lg:grid-cols-[1.1fr_1fr] items-start">
        <div className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--surface)] p-7">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border-hairline)] pb-6">
            <div>
              <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
                <span className="font-mono">{selectedSkill.filename}</span>
                <span aria-hidden="true">·</span>
                <span>Included in {selectedSkill.tierLabel}</span>
              </div>
              <h2 className="font-display mt-2 text-3xl font-semibold text-[var(--text)]">
                {selectedSkill.name}
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {unlocked ? (
                <>
                  <button
                    type="button"
                    onClick={() => downloadSkillFile(selectedSkill)}
                    className="inline-flex items-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2.5 text-xs font-semibold text-[#06070c] hover:bg-[#94b5ff] cursor-pointer whitespace-nowrap"
                  >
                    <Download size={14} />
                    <span>Download {selectedSkill.filename}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCopyMarkdown(selectedSkill)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3.5 py-2.5 text-xs font-medium text-[var(--text)] hover:bg-white/5 cursor-pointer whitespace-nowrap"
                  >
                    {copiedId === selectedSkill.id ? <Check size={14} /> : <Copy size={14} />}
                    <span>{copiedId === selectedSkill.id ? 'Copied' : 'Copy Markdown'}</span>
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => onRequestUpgrade(selectedSkill.tier)}
                  className="inline-flex items-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2.5 text-xs font-semibold text-[#06070c] hover:bg-[#94b5ff] cursor-pointer whitespace-nowrap"
                >
                  <Lock size={14} />
                  <span>Unlock {selectedSkill.name} ({selectedSkill.tierLabel})</span>
                </button>
              )}
            </div>
          </div>

          <p className="mt-6 text-sm leading-relaxed text-[var(--text-soft)]">
            {selectedSkill.summary}
          </p>

          <div className="mt-6 rounded-xl border border-[var(--border-hairline)] bg-[#06070c] p-4 text-xs text-[var(--text-soft)]">
            <span className="font-semibold text-[var(--text)]">Runtime compatibility: </span>
            {selectedSkill.compatibility}
          </div>

          <div className="mt-8">
            <h3 className="text-sm font-semibold text-[var(--text)]">Workflow pipeline</h3>
            <ol className="mt-4 space-y-4">
              {selectedSkill.workflowSteps.map((step, i) => (
                <li key={step.title} className="border-b border-[var(--border-hairline)] pb-4 last:border-b-0 last:pb-0">
                  <div className="flex items-baseline gap-2.5">
                    <span className="font-mono text-xs font-semibold text-[var(--accent)] tabular-nums">
                      0{i + 1}
                    </span>
                    <h4 className="text-sm font-medium text-[var(--text)]">{step.title}</h4>
                  </div>
                  <p className="mt-1.5 pl-6 text-xs leading-relaxed text-[var(--text-soft)]">
                    {step.detail}
                  </p>
                  {step.command && (
                    <pre className="mt-2 ml-6 overflow-x-auto rounded-lg border border-white/10 bg-[#06070c] px-3 py-2 font-mono text-[11px] text-[#bfd0ff]">
                      <code>{step.command}</code>
                    </pre>
                  )}
                </li>
              ))}
            </ol>
          </div>
        </div>

        {/* Raw Markdown Preview */}
        <div className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--surface)] p-6">
          <div className="flex items-center justify-between border-b border-[var(--border-hairline)] pb-3">
            <span className="font-mono text-xs text-[var(--text)]">
              {selectedSkill.filename}
            </span>
            <span className="text-xs text-[var(--muted)]">
              {unlocked ? 'Full file unlocked' : `Preview (${selectedSkill.tierLabel} required to download)`}
            </span>
          </div>

          <pre className="mt-4 max-h-[600px] overflow-auto whitespace-pre-wrap break-words font-mono text-[11.5px] leading-relaxed text-[var(--text-soft)]">
            <code>{selectedSkill.rawMarkdown}</code>
          </pre>
        </div>
      </div>
    </div>
  );
}
