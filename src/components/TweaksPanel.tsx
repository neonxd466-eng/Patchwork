import { SlidersHorizontal, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  GLASS_DEFAULTS,
  LOOK_CONTROLS,
  MOVEMENT_CONTROLS,
  SpeciesMeta,
  TweakControlDef,
} from '../canvas/speciesConfig';

export interface GlassTweaks {
  blur: number;
  refraction: number;
  ripple: number;
  tint: number;
  edge: number;
  radius: number;
  width: number;
}

interface TweaksPanelProps {
  open: boolean;
  onToggleOpen: (open: boolean) => void;
  species: SpeciesMeta;
  tuning: Record<string, number | boolean>;
  glass: GlassTweaks;
  onChangeTuning: (key: string, value: number | boolean) => void;
  onResetTuningKey: (key: string) => void;
  onChangeGlass: (key: keyof GlassTweaks, value: number) => void;
  onResetGlassKey: (key: keyof GlassTweaks) => void;
  onResetAll: () => void;
  getDiffJson: () => string;
}

const GLASS_CONTROLS: {
  key: keyof GlassTweaks;
  label: string;
  min: number;
  max: number;
  step: number;
  unit?: string;
  hint: string;
}[] = [
  { key: 'blur', label: 'Blur', min: 0, max: 30, step: 0.5, unit: 'px', hint: 'Frosted backdrop blur radius on floating glass.' },
  { key: 'refraction', label: 'Refraction', min: 0, max: 150, step: 1, hint: 'SVG displacement scale inside Chromium liquid glass.' },
  { key: 'ripple', label: 'Ripple', min: 0.001, max: 0.04, step: 0.001, hint: 'Turbulence baseFrequency driving liquid refraction.' },
  { key: 'tint', label: 'Tint', min: 0, max: 3, step: 0.05, hint: 'White surface tint strength across glass gradients.' },
  { key: 'edge', label: 'Edge', min: 0, max: 2, step: 0.05, hint: 'Specular rim and glass border contrast.' },
];

function formatNumber(val: number, step: number): string {
  const str = step.toString();
  const decimals = str.includes('.') ? str.split('.')[1].length : 0;
  return val.toFixed(decimals);
}

export function TweaksPanel({
  open,
  onToggleOpen,
  species,
  tuning,
  glass,
  onChangeTuning,
  onResetTuningKey,
  onChangeGlass,
  onResetGlassKey,
  onResetAll,
  getDiffJson,
}: TweaksPanelProps) {
  const [copyLabel, setCopyLabel] = useState<'Copy' | 'Copied' | 'In console'>('Copy');
  const [confirmReset, setConfirmReset] = useState(false);
  const [activeHint, setActiveHint] = useState<string | null>(null);

  useEffect(() => {
    if (!confirmReset) return;
    const t = window.setTimeout(() => setConfirmReset(false), 3000);
    return () => window.clearTimeout(t);
  }, [confirmReset]);

  const handleCopy = async () => {
    const json = getDiffJson();
    try {
      await navigator.clipboard.writeText(json);
      setCopyLabel('Copied');
    } catch {
      console.log(json);
      setCopyLabel('In console');
    }
    window.setTimeout(() => setCopyLabel('Copy'), 1400);
  };

  const handleResetClick = () => {
    if (!confirmReset) {
      setConfirmReset(true);
      return;
    }
    setConfirmReset(false);
    onResetAll();
  };

  const renderControlRow = (ctrl: TweakControlDef) => {
    if (ctrl.key === 'shimmer' && species.hideShimmer) return null;
    if (ctrl.key === 'grip' && species.hideHoldCourse) return null;

    const raw = tuning[ctrl.key] ?? species.defaults[ctrl.key];
    const disabled = ctrl.key === 'direction' && Boolean(tuning.cornerToCorner);

    if (ctrl.type === 'toggle') {
      const checked = Boolean(raw);
      return (
        <div
          key={ctrl.key}
          className="grid grid-cols-[1fr_auto] items-center gap-2 py-1.5"
          onMouseEnter={() => setActiveHint(ctrl.hint)}
          onMouseLeave={() => setActiveHint(null)}
        >
          <label
            onDoubleClick={() => onResetTuningKey(ctrl.key)}
            className="text-[12px] text-[var(--text-soft)] select-none cursor-pointer"
            title="Double-click to reset"
          >
            {ctrl.label}
          </label>
          <button
            type="button"
            role="switch"
            aria-checked={checked}
            aria-label={ctrl.label}
            onClick={() => onChangeTuning(ctrl.key, !checked)}
            className={`relative h-[18px] w-[30px] rounded-full transition-colors cursor-pointer ${
              checked ? 'bg-[var(--accent)]' : 'bg-[var(--chip-edge)]'
            }`}
          >
            <span
              className={`block h-[14px] w-[14px] rounded-full bg-white shadow transition-transform ${
                checked ? 'translate-x-[14px]' : 'translate-x-[2px]'
              }`}
            />
          </button>
        </div>
      );
    }

    const num = Number(raw);
    const pct = ((num - ctrl.min) / (ctrl.max - ctrl.min)) * 100;

    return (
      <div
        key={ctrl.key}
        className={`py-1.5 transition-opacity ${disabled ? 'opacity-40 pointer-events-none' : ''}`}
        onMouseEnter={() => setActiveHint(ctrl.hint)}
        onMouseLeave={() => setActiveHint(null)}
      >
        <div className="grid grid-cols-[1fr_auto] items-baseline gap-2 mb-0.5">
          <label
            htmlFor={`tweak-${ctrl.key}`}
            onDoubleClick={() => onResetTuningKey(ctrl.key)}
            className="text-[12px] text-[var(--text-soft)] select-none cursor-pointer"
            title="Double-click to reset"
          >
            {ctrl.label}
          </label>
          <span className="font-mono text-[11px] font-semibold tabular-nums text-[var(--text)]">
            {formatNumber(num, ctrl.step)}
            {ctrl.unit ?? ''}
          </span>
        </div>
        <input
          id={`tweak-${ctrl.key}`}
          type="range"
          min={ctrl.min}
          max={ctrl.max}
          step={ctrl.step}
          value={num}
          disabled={disabled}
          onFocus={() => setActiveHint(ctrl.hint)}
          onBlur={() => setActiveHint(null)}
          onChange={(e) => onChangeTuning(ctrl.key, parseFloat(e.target.value))}
          style={{ '--fill': `${pct}%` } as React.CSSProperties}
          className="tweak-range"
        />
      </div>
    );
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => onToggleOpen(true)}
        aria-label="Open animal canvas tweaks"
        style={{ '--blur': '10px' } as React.CSSProperties}
        className="glass glass-plain inline-flex items-center gap-2 rounded-full bg-[#0a0c14]/65 px-3.5 pl-3 h-[34px] text-[13px] font-medium text-[var(--text-soft)] hover:text-[var(--text)] cursor-pointer whitespace-nowrap"
      >
        <SlidersHorizontal size={15} />
        <span>Tweaks</span>
      </button>
    );
  }

  return (
    <div className="fixed top-[76px] right-4 z-30 max-md:top-auto max-md:bottom-3 max-md:left-3 max-md:right-3">
      {activeHint && (
        <div className="hidden md:block absolute right-[304px] top-0 w-[240px] rounded-xl border border-white/10 bg-[#0e101a]/95 p-3 text-[11.5px] leading-relaxed text-[var(--text-soft)] shadow-2xl pointer-events-none">
          <p>{activeHint}</p>
          <p className="mt-1 text-[var(--muted)]">Double-click the name to reset it.</p>
        </div>
      )}

      <aside
        aria-label="Canvas Tweaks"
        style={
          {
            '--blur': '18px',
            '--tint-a': '0.1',
            '--tint-b': '0.06',
          } as React.CSSProperties
        }
        className="glass glass-plain flex flex-col w-[288px] max-md:w-full max-h-[calc(100vh-96px)] max-md:max-h-[70vh] rounded-[20px] bg-[#0a0c14]/88 text-[12px] overflow-hidden"
      >
        <div className="flex items-center justify-between gap-2 border-b border-[var(--chip-edge)] px-4 py-2.5 pr-2.5">
          <span className="text-[13px] font-medium text-[var(--text)]">Tweaks</span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleCopy}
              className="h-[26px] rounded-full border border-[var(--chip-edge)] bg-[var(--chip)] px-2.5 text-[11px] font-medium text-[var(--text-soft)] hover:bg-[var(--chip-hover)] hover:text-[var(--text)] cursor-pointer whitespace-nowrap"
            >
              {copyLabel}
            </button>
            <button
              type="button"
              onClick={handleResetClick}
              className={`h-[26px] rounded-full border px-2.5 text-[11px] font-medium cursor-pointer whitespace-nowrap transition-colors ${
                confirmReset
                  ? 'border-red-400/50 bg-red-500/20 text-red-200'
                  : 'border-[var(--chip-edge)] bg-[var(--chip)] text-[var(--text-soft)] hover:bg-[var(--chip-hover)] hover:text-[var(--text)]'
              }`}
            >
              {confirmReset ? 'Reset all?' : 'Reset'}
            </button>
            <button
              type="button"
              onClick={() => onToggleOpen(false)}
              aria-label="Close tweaks"
              className="inline-flex h-[26px] w-[26px] items-center justify-center rounded-full text-[var(--text-soft)] hover:bg-white/10 hover:text-[var(--text)] cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto overscroll-contain px-4 pt-2 pb-3.5 space-y-4">
          <section>
            <h3 className="font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--muted)] mb-1">
              Movement
            </h3>
            {MOVEMENT_CONTROLS.map(renderControlRow)}
          </section>

          <section>
            <h3 className="font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--muted)] mb-1">
              {species.speciesGroupTitle}
            </h3>
            {species.speciesControls.map(renderControlRow)}
          </section>

          {species.speciesControls2 && species.speciesGroupTitle2 && (
            <section>
              <h3 className="font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--muted)] mb-1">
                {species.speciesGroupTitle2}
              </h3>
              {species.speciesControls2.map(renderControlRow)}
            </section>
          )}

          <section>
            <h3 className="font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--muted)] mb-1">
              Look
            </h3>
            {LOOK_CONTROLS.map(renderControlRow)}
          </section>

          <section>
            <h3 className="font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--muted)] mb-1">
              Glass
            </h3>
            {GLASS_CONTROLS.map((ctrl) => {
              const num = glass[ctrl.key] ?? GLASS_DEFAULTS[ctrl.key];
              const pct = ((num - ctrl.min) / (ctrl.max - ctrl.min)) * 100;
              return (
                <div
                  key={ctrl.key}
                  className="py-1.5"
                  onMouseEnter={() => setActiveHint(ctrl.hint)}
                  onMouseLeave={() => setActiveHint(null)}
                >
                  <div className="grid grid-cols-[1fr_auto] items-baseline gap-2 mb-0.5">
                    <label
                      htmlFor={`tweak-glass-${ctrl.key}`}
                      onDoubleClick={() => onResetGlassKey(ctrl.key)}
                      className="text-[12px] text-[var(--text-soft)] select-none cursor-pointer"
                    >
                      {ctrl.label}
                    </label>
                    <span className="font-mono text-[11px] font-semibold tabular-nums text-[var(--text)]">
                      {formatNumber(num, ctrl.step)}
                      {ctrl.unit ?? ''}
                    </span>
                  </div>
                  <input
                    id={`tweak-glass-${ctrl.key}`}
                    type="range"
                    min={ctrl.min}
                    max={ctrl.max}
                    step={ctrl.step}
                    value={num}
                    onChange={(e) => onChangeGlass(ctrl.key, parseFloat(e.target.value))}
                    style={{ '--fill': `${pct}%` } as React.CSSProperties}
                    className="tweak-range"
                  />
                </div>
              );
            })}
          </section>
        </div>
      </aside>
    </div>
  );
}
