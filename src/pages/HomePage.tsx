import { ArrowRight, Check, Download, Lock } from 'lucide-react';
import { useState } from 'react';
import { GlyphHeroCanvas } from '../components/GlyphHeroCanvas';
import { AppRoute } from '../components/Navbar';
import { PRICING_TIERS, SKILLS, SkillSpec } from '../data/skills';
import { downloadSkillFile } from '../utils/downloadSkill';
import { isSkillUnlocked, PlanTier, SkillId } from '../utils/tiers';

interface HomePageProps {
  activeTier: PlanTier;
  onNavigate: (route: AppRoute) => void;
  onSelectSkillDetail: (skillId: SkillId) => void;
  onRequestUpgrade: (tier: PlanTier) => void;
}

const MODEL_GUIDES = [
  {
    id: 'gemini',
    name: 'Gemini',
    surfaces: 'Google AI Studio · Gemini Gems · Gemini CLI',
    summary:
      'Upload reference and target MP4 clips directly into Gemini native multimodal video input, attach hydrogen.md or carbon.md as system instructions, and generate exact timestamped breakdowns or FFmpeg scripts.',
    steps: [
      'Open Google AI Studio or create a Gemini Gem.',
      'Paste or attach the downloaded .md skill file in System Instructions.',
      'Upload your reference MP4 and target clip, then ask Gemini to run the workflow.',
    ],
  },
  {
    id: 'claude',
    name: 'Claude',
    surfaces: 'Claude Code · Claude Projects · Claude Desktop',
    summary:
      'Drop Carbon or Argon into .claude/skills/ to let Claude Code execute analyze_video.py, extract shot frames, inspect transitions visually, and render final MP4 or ProRes alpha passes.',
    steps: [
      'Place the skill file inside .claude/skills/<name>/SKILL.md or Claude Project Knowledge.',
      'Upload your reference video to /mnt/user-data/uploads or point to a local path.',
      'Prompt Claude to measure the reference and build a retimed manifest.',
    ],
  },
  {
    id: 'chatgpt',
    name: 'ChatGPT',
    surfaces: 'Custom GPTs · ChatGPT Projects · Codex CLI',
    summary:
      'Attach any Patchwork skill to a Custom GPT with Code Interpreter enabled so ChatGPT can run Python + FFmpeg measurement scripts on uploaded clips and output downloadable edit recipes.',
    steps: [
      'Upload hydrogen.md, carbon.md, or argon.md to Project Files or GPT Knowledge.',
      'Enable Code Interpreter when using Carbon or Argon measurement scripts.',
      'Provide your reference clip and ask for the JSON recipe or retimed output.',
    ],
  },
  {
    id: 'cli',
    name: 'Cursor & CLI',
    surfaces: 'Cursor Rules · Windsurf · Local Python + FFmpeg',
    summary:
      'Use Patchwork skills as local agent rules alongside Remotion, Motion Canvas, Three.js, and FFmpeg to automate multi-pass rendering and contact-sheet visual QA.',
    steps: [
      'Save the skill files under .cursor/rules/ or your project skills directory.',
      'Install ffmpeg, ffprobe, Python 3, numpy, opencv-python, and Pillow.',
      'Run analyze_reference.py -> retime_manifest.py -> render_composite.py -> qa_check.py.',
    ],
  },
];

export function HomePage({
  activeTier,
  onNavigate,
  onSelectSkillDetail,
  onRequestUpgrade,
}: HomePageProps) {
  const [selectedInspector, setSelectedInspector] = useState<SkillId>('hydrogen');
  const [selectedModel, setSelectedModel] = useState<string>('gemini');

  const inspectedSkill: SkillSpec =
    SKILLS.find((s) => s.id === selectedInspector) ?? SKILLS[0];
  const activeModel =
    MODEL_GUIDES.find((m) => m.id === selectedModel) ?? MODEL_GUIDES[0];

  const handleSkillAction = (skill: SkillSpec) => {
    if (isSkillUnlocked(activeTier, skill.id)) {
      downloadSkillFile(skill);
    } else {
      onRequestUpgrade(skill.tier);
    }
  };

  return (
    <div>
      {/* Full-viewport interactive Glyph Animals hero */}
      <GlyphHeroCanvas onNavigate={onNavigate} />

      {/* Section 01: The Four Skills */}
      <section className="mx-auto max-w-[1200px] px-6 py-24 border-t border-[var(--border-hairline)]">
        <div className="max-w-2xl">
          <p className="text-xs font-medium text-[var(--accent)]">
            01. Progressive Reverse-Engineering Suite
          </p>
          <h2 className="font-display mt-3 text-balance text-3xl font-semibold tracking-tight text-[var(--text)] md:text-4xl">
            Four standalone skill files, from eye-level breakdown to studio alpha render.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-[var(--text-soft)]">
            Each Patchwork skill is a self-contained Markdown specification. Start free with Hydrogen
            for visual breakdowns, step up to Carbon for script-measured cuts and BPM retiming, or
            unlock Argon and Neon for automated renders and 3D shader passes.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {SKILLS.map((skill, idx) => {
            const unlocked = isSkillUnlocked(activeTier, skill.id);
            const isHeroSpan = idx === 2;
            return (
              <article
                key={skill.id}
                className={`flex flex-col justify-between rounded-2xl border border-[var(--border-hairline)] bg-[var(--surface)] p-7 transition-colors hover:border-white/20 ${
                  isHeroSpan ? 'md:col-span-2 lg:col-span-1' : ''
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
                      <span className="font-mono font-semibold text-[var(--text-soft)]">
                        {String(skill.atomicNumber).padStart(2, '0')} · {skill.elementSymbol}
                      </span>
                      <span aria-hidden="true">/</span>
                      <span>{skill.tierLabel} tier</span>
                      <span aria-hidden="true">/</span>
                      <span className="font-mono">{skill.filename}</span>
                    </div>
                  </div>

                  <h3 className="font-display mt-4 text-2xl font-semibold text-[var(--text)]">
                    {skill.name}
                  </h3>
                  <p className="mt-1 text-sm font-medium text-[var(--accent)]">{skill.tagline}</p>
                  <p className="mt-3 text-sm leading-relaxed text-[var(--text-soft)]">
                    {skill.summary}
                  </p>

                  <ul className="mt-5 space-y-2 border-t border-[var(--border-hairline)] pt-4 text-xs text-[var(--text-soft)]">
                    {skill.outputs.map((out) => (
                      <li key={out} className="flex items-center gap-2">
                        <Check size={14} className="shrink-0 text-[var(--accent)]" />
                        <span>{out}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-7 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleSkillAction(skill)}
                    className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                      unlocked
                        ? 'bg-[var(--accent)] text-[#06070c] hover:bg-[#94b5ff]'
                        : 'border border-white/15 bg-white/[0.04] text-[var(--text)] hover:bg-white/10'
                    }`}
                  >
                    {unlocked ? <Download size={14} /> : <Lock size={14} />}
                    <span>
                      {unlocked ? `Download ${skill.filename}` : `Unlock with ${skill.tierLabel}`}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onSelectSkillDetail(skill.id);
                      onNavigate('products');
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-[var(--text-soft)] hover:text-[var(--text)] cursor-pointer whitespace-nowrap"
                  >
                    <span>Inspect spec</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* Section 02: Interactive Output Inspector */}
      <section className="mx-auto max-w-[1200px] px-6 py-20 border-t border-[var(--border-hairline)]">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.35fr] lg:items-start">
          <div>
            <p className="text-xs font-medium text-[var(--accent)]">
              02. Concrete Artifacts, Zero Guesswork
            </p>
            <h2 className="font-display mt-3 text-balance text-3xl font-semibold tracking-tight text-[var(--text)]">
              See what each skill outputs from a single reference clip.
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-[var(--text-soft)]">
              Every skill forbids fabricated frame numbers or imaginary plugin names. Measured
              values and visual estimates are separated cleanly so you can trust the recipe in
              FFmpeg, Remotion, Premiere, or DaVinci Resolve.
            </p>

            <div
              role="tablist"
              aria-label="Inspect skill output"
              className="mt-7 inline-flex flex-wrap gap-1.5 rounded-xl border border-[var(--border-hairline)] bg-[var(--surface)] p-1.5"
            >
              {SKILLS.map((s) => {
                const active = s.id === selectedInspector;
                return (
                  <button
                    key={s.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setSelectedInspector(s.id)}
                    className={`rounded-lg px-3.5 py-2 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                      active
                        ? 'bg-[var(--accent)] text-[#06070c] font-semibold'
                        : 'text-[var(--text-soft)] hover:text-[var(--text)]'
                    }`}
                  >
                    {s.name}
                  </button>
                );
              })}
            </div>

            <div className="mt-6 space-y-2 text-xs text-[var(--text-soft)]">
              <p className="font-medium text-[var(--text)]">Compatibility</p>
              <p className="leading-relaxed">{inspectedSkill.compatibility}</p>
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--surface)] p-6">
            <div className="flex items-center justify-between border-b border-[var(--border-hairline)] pb-3 text-xs text-[var(--muted)]">
              <span className="font-mono text-[var(--text)]">{inspectedSkill.filename} · sample output</span>
              <span>{inspectedSkill.tierLabel} tier</span>
            </div>
            <pre className="mt-4 overflow-x-auto font-mono text-xs leading-relaxed text-[#cfd9f7]">
              <code>{inspectedSkill.sampleRecipe}</code>
            </pre>
            <div className="mt-5 border-t border-[var(--border-hairline)] pt-4">
              <p className="text-xs font-medium text-[var(--text)]">Guardrails enforced by this skill</p>
              <ul className="mt-2 space-y-1.5 text-xs text-[var(--text-soft)]">
                {inspectedSkill.gotchas.map((g) => (
                  <li key={g}>· {g}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Section 03: Works across Gemini, Claude, ChatGPT & CLI */}
      <section className="mx-auto max-w-[1200px] px-6 py-20 border-t border-[var(--border-hairline)]">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-xl">
            <p className="text-xs font-medium text-[var(--accent)]">
              03. Model-Agnostic Workflow
            </p>
            <h2 className="font-display mt-3 text-balance text-3xl font-semibold tracking-tight text-[var(--text)]">
              Load the same skill into Gemini, Claude, ChatGPT, or Cursor.
            </h2>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('docs')}
            className="inline-flex items-center gap-2 self-start rounded-lg border border-white/15 px-4 py-2 text-xs font-medium text-[var(--text)] hover:bg-white/5 cursor-pointer whitespace-nowrap"
          >
            <span>Open Full Docs</span>
            <ArrowRight size={14} />
          </button>
        </div>

        <div className="mt-8 flex flex-wrap gap-2 border-b border-[var(--border-hairline)] pb-4">
          {MODEL_GUIDES.map((m) => {
            const active = m.id === selectedModel;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setSelectedModel(m.id)}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  active
                    ? 'bg-white/10 text-[var(--text)]'
                    : 'text-[var(--text-soft)] hover:text-[var(--text)]'
                }`}
              >
                {m.name}
              </button>
            );
          })}
        </div>

        <div className="mt-8 grid gap-8 md:grid-cols-[1.1fr_1fr] items-start">
          <div>
            <p className="text-xs text-[var(--muted)]">{activeModel.surfaces}</p>
            <h3 className="font-display mt-2 text-2xl font-semibold text-[var(--text)]">
              Using Patchwork with {activeModel.name}
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-[var(--text-soft)]">
              {activeModel.summary}
            </p>
          </div>
          <ol className="space-y-3 rounded-2xl border border-[var(--border-hairline)] bg-[var(--surface)] p-6">
            {activeModel.steps.map((step, i) => (
              <li key={step} className="flex gap-3 text-sm text-[var(--text-soft)]">
                <span className="font-mono text-xs font-semibold text-[var(--accent)] pt-0.5 tabular-nums">
                  0{i + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Section 04: Pricing Summary */}
      <section className="mx-auto max-w-[1200px] px-6 py-20 border-t border-[var(--border-hairline)]">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-medium text-[var(--accent)]">04. Simple Tiers</p>
            <h2 className="font-display mt-2 text-3xl font-semibold tracking-tight text-[var(--text)]">
              Start free with Hydrogen, scale to Argon and Neon.
            </h2>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('pricing')}
            className="inline-flex items-center gap-2 self-start rounded-lg bg-[var(--accent)] px-5 py-2.5 text-xs font-semibold text-[#06070c] hover:bg-[#94b5ff] cursor-pointer whitespace-nowrap"
          >
            <span>Compare Plans & Pricing</span>
            <ArrowRight size={14} />
          </button>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {PRICING_TIERS.map((tier) => (
            <div
              key={tier.id}
              className={`rounded-2xl border p-6 ${
                tier.highlighted
                  ? 'border-[var(--accent)]/50 bg-[var(--surface-elevated)]'
                  : 'border-[var(--border-hairline)] bg-[var(--surface)]'
              }`}
            >
              <div className="flex items-baseline justify-between">
                <h3 className="font-display text-xl font-medium text-[var(--text)]">{tier.name}</h3>
                <span className="font-mono text-lg font-semibold tabular-nums text-[var(--text)]">
                  {tier.id === 'free' ? '$0' : tier.id === 'pro' ? '$39 once' : '$99 once'}
                </span>
              </div>
              <p className="mt-2 text-sm text-[var(--text-soft)]">{tier.tagline}</p>
              <p className="mt-4 text-xs font-medium text-[var(--accent)]">
                Includes:{' '}
                {tier.includedSkills
                  .map((id) => SKILLS.find((s) => s.id === id)?.name)
                  .join(' + ')}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
