import { ArrowRight } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { GlyphAnimalEngine } from '../canvas/animalRenderer';
import {
  GLASS_DEFAULTS,
  SPECIES_BY_KEY,
  SPECIES_LIST,
  SpeciesKey,
} from '../canvas/speciesConfig';
import { AppRoute } from './Navbar';
import { GlassTweaks, TweaksPanel } from './TweaksPanel';

interface GlyphHeroCanvasProps {
  onNavigate: (route: AppRoute) => void;
}

const ANIMAL_STORAGE_KEY = 'wild-tab:animal';
const TWEAKS_OPEN_KEY = 'wild-tab:tweaks-open';

function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeStorage(key: string, val: unknown): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(val));
  } catch {
    // ignore storage errors
  }
}

function resolveInitialSpecies(): { species: SpeciesKey; fixedCount: number | null } {
  const params = new URLSearchParams(window.location.search);
  const paramAnimal = params.get('animal') as SpeciesKey | null;
  const paramCountRaw = params.get('count');
  const fixedCount = paramCountRaw && !Number.isNaN(Number(paramCountRaw)) ? Number(paramCountRaw) : null;

  if (paramAnimal && SPECIES_BY_KEY[paramAnimal]) {
    return { species: paramAnimal, fixedCount };
  }
  try {
    const saved = window.localStorage.getItem(ANIMAL_STORAGE_KEY);
    if (saved && SPECIES_BY_KEY[saved as SpeciesKey]) {
      return { species: saved as SpeciesKey, fixedCount };
    }
  } catch {
    // ignore
  }
  return { species: 'moths', fixedCount };
}

function loadSpeciesTweaks(key: SpeciesKey): {
  tuning: Record<string, number | boolean>;
  glass: GlassTweaks;
} {
  const meta = SPECIES_BY_KEY[key];
  const saved = readStorage<{ tuning?: Record<string, number | boolean>; glass?: Partial<GlassTweaks> } | null>(
    `wild-tab:tweaks:${key}`,
    null,
  );
  return {
    tuning: { ...meta.defaults, ...(saved?.tuning ?? {}) },
    glass: { ...GLASS_DEFAULTS, ...(saved?.glass ?? {}) },
  };
}

export function GlyphHeroCanvas({ onNavigate }: GlyphHeroCanvasProps) {
  const [{ species: initialSpecies, fixedCount }] = useState(resolveInitialSpecies);
  const [speciesKey, setSpeciesKey] = useState<SpeciesKey>(initialSpecies);
  const [{ tuning, glass }, setTweaksState] = useState(() => loadSpeciesTweaks(initialSpecies));
  const [tweaksOpen, setTweaksOpen] = useState<boolean>(() => readStorage(TWEAKS_OPEN_KEY, false));

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<GlyphAnimalEngine | null>(null);
  const barRef = useRef<HTMLDivElement | null>(null);
  const btnRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [thumbStyle, setThumbStyle] = useState<{ x: number; y: number; w: number; h: number }>({
    x: 4,
    y: 4,
    w: 70,
    h: 32,
  });

  const activeMeta = SPECIES_BY_KEY[speciesKey];

  // Apply glass CSS vars & SVG filter params
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--tint', String(glass.tint));
    root.style.setProperty('--edge', String(glass.edge));
    root.style.setProperty('--blur', `${glass.blur}px`);

    const turb = document.getElementById('liquid-turbulence');
    const disp = document.getElementById('liquid-displacement');
    if (turb) {
      turb.setAttribute('baseFrequency', `${glass.ripple} ${(glass.ripple * 1.5).toFixed(4)}`);
    }
    if (disp) {
      disp.setAttribute('scale', String(glass.refraction));
    }
  }, [glass]);

  // Mount canvas engine once
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const engine = new GlyphAnimalEngine(canvas, speciesKey, tuning, fixedCount);
    engineRef.current = engine;
    return () => {
      engine.destroy();
      engineRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reposition sliding thumb when species or layout changes
  const updateThumb = useCallback(() => {
    const btn = btnRefs.current[speciesKey];
    if (!btn) return;
    setThumbStyle({
      x: btn.offsetLeft,
      y: btn.offsetTop,
      w: btn.offsetWidth,
      h: btn.offsetHeight,
    });
  }, [speciesKey]);

  useEffect(() => {
    updateThumb();
    document.fonts?.ready.then(updateThumb).catch(() => undefined);
    window.addEventListener('resize', updateThumb);
    return () => window.removeEventListener('resize', updateThumb);
  }, [updateThumb]);

  // Cross-tab storage sync
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === `wild-tab:tweaks:${speciesKey}`) {
        window.location.reload();
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [speciesKey]);

  const persistDiff = (
    key: SpeciesKey,
    nextTuning: Record<string, number | boolean>,
    nextGlass: GlassTweaks,
  ) => {
    const defaults = SPECIES_BY_KEY[key].defaults;
    const diffTuning: Record<string, number | boolean> = {};
    for (const [k, v] of Object.entries(nextTuning)) {
      if (defaults[k] !== v) diffTuning[k] = v;
    }
    const diffGlass: Partial<GlassTweaks> = {};
    (Object.keys(GLASS_DEFAULTS) as (keyof GlassTweaks)[]).forEach((gk) => {
      if (nextGlass[gk] !== GLASS_DEFAULTS[gk]) diffGlass[gk] = nextGlass[gk];
    });
    if (Object.keys(diffTuning).length === 0 && Object.keys(diffGlass).length === 0) {
      try {
        window.localStorage.removeItem(`wild-tab:tweaks:${key}`);
      } catch {
        // ignore
      }
    } else {
      writeStorage(`wild-tab:tweaks:${key}`, { tuning: diffTuning, glass: diffGlass });
    }
  };

  const selectSpecies = (nextKey: SpeciesKey) => {
    if (nextKey === speciesKey) return;
    setSpeciesKey(nextKey);
    try {
      window.localStorage.setItem(ANIMAL_STORAGE_KEY, nextKey);
    } catch {
      // ignore
    }
    const loaded = loadSpeciesTweaks(nextKey);
    setTweaksState(loaded);
    engineRef.current?.setSpecies(nextKey, loaded.tuning);
  };

  const handleKeyDownRadiogroup = (e: React.KeyboardEvent, idx: number) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    const dir = e.key === 'ArrowRight' ? 1 : -1;
    const nextIdx = (idx + dir + SPECIES_LIST.length) % SPECIES_LIST.length;
    const nextKey = SPECIES_LIST[nextIdx].key;
    selectSpecies(nextKey);
    btnRefs.current[nextKey]?.focus();
  };

  const handleChangeTuning = (key: string, value: number | boolean) => {
    setTweaksState((prev) => {
      const nextTuning = { ...prev.tuning, [key]: value };
      engineRef.current?.updateTuning(nextTuning, key);
      persistDiff(speciesKey, nextTuning, prev.glass);
      return { ...prev, tuning: nextTuning };
    });
  };

  const handleResetTuningKey = (key: string) => {
    const defVal = SPECIES_BY_KEY[speciesKey].defaults[key];
    handleChangeTuning(key, defVal);
  };

  const handleChangeGlass = (key: keyof GlassTweaks, value: number) => {
    setTweaksState((prev) => {
      const nextGlass = { ...prev.glass, [key]: value };
      persistDiff(speciesKey, prev.tuning, nextGlass);
      return { ...prev, glass: nextGlass };
    });
  };

  const handleResetGlassKey = (key: keyof GlassTweaks) => {
    handleChangeGlass(key, GLASS_DEFAULTS[key]);
  };

  const handleResetAll = () => {
    const freshTuning = { ...SPECIES_BY_KEY[speciesKey].defaults };
    const freshGlass = { ...GLASS_DEFAULTS };
    setTweaksState({ tuning: freshTuning, glass: freshGlass });
    engineRef.current?.updateTuning(freshTuning, 'detail');
    try {
      window.localStorage.removeItem(`wild-tab:tweaks:${speciesKey}`);
    } catch {
      // ignore
    }
  };

  const getDiffJson = () => {
    const defaults = SPECIES_BY_KEY[speciesKey].defaults;
    const diffTuning: Record<string, number | boolean> = {};
    for (const [k, v] of Object.entries(tuning)) {
      if (defaults[k] !== v) diffTuning[k] = v;
    }
    return JSON.stringify({ species: speciesKey, tuning: diffTuning, glass }, null, 2);
  };

  const toggleTweaks = (next: boolean) => {
    setTweaksOpen(next);
    writeStorage(TWEAKS_OPEN_KEY, next);
  };

  return (
    <section
      aria-label="Patchwork interactive landing stage"
      className="relative flex min-h-[100svh] w-full flex-col justify-between overflow-hidden bg-[#06070c] pt-16"
      data-species={speciesKey}
    >
      {/* Full-bleed Procedural Glyph Animals Canvas */}
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        data-testid="glyph-animals-canvas"
        onPointerDown={(e) => engineRef.current?.handleTap(e.clientX, e.clientY)}
        className="font-canvas-mono absolute inset-0 block h-full w-full touch-none cursor-crosshair"
      />

      {/* Top Species Switcher Bar (Frosted Liquid Glass with Overshoot Sliding Thumb) */}
      <div className="relative z-20 flex justify-center px-3 pt-4 md:pt-5 pointer-events-none">
        <div
          ref={barRef}
          role="radiogroup"
          aria-label="Animal"
          className="choices-bar glass pointer-events-auto"
        >
          <span
            aria-hidden="true"
            className="choices-thumb"
            style={{
              width: `${thumbStyle.w}px`,
              height: `${thumbStyle.h}px`,
              transform: `translate(${thumbStyle.x}px, ${thumbStyle.y}px)`,
            }}
          />
          {SPECIES_LIST.map((sp, idx) => {
            const checked = sp.key === speciesKey;
            return (
              <button
                key={sp.key}
                ref={(el) => {
                  btnRefs.current[sp.key] = el;
                }}
                type="button"
                role="radio"
                aria-checked={checked}
                tabIndex={checked ? 0 : -1}
                onClick={() => selectSpecies(sp.key)}
                onKeyDown={(e) => handleKeyDownRadiogroup(e, idx)}
                className="choice-btn"
              >
                <span
                  aria-hidden="true"
                  className="h-[9px] w-[9px] rounded-full shrink-0"
                  style={{
                    background: `radial-gradient(circle at 35% 30%, color-mix(in srgb, ${sp.dotColor} 50%, white), ${sp.dotColor} 70%)`,
                  }}
                />
                <span>{sp.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Centered Patchwork Hero Copy (Animals pass behind cleanly without AI composer/avatar) */}
      <div className="relative z-10 mx-auto my-auto flex max-w-[820px] flex-col items-center justify-center px-6 py-8 text-center pointer-events-none">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -inset-x-10 -inset-y-6 -z-10 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(6,7,12,0.72)_0%,rgba(6,7,12,0.35)_55%,transparent_80%)]"
        />
        <p className="hero-legibility text-xs font-medium tracking-wide text-[var(--text-soft)]">
          <span>Four Skill Files</span>
          <span className="mx-2 text-[var(--muted)]" aria-hidden="true">
            ·
          </span>
          <span>Hydrogen, Carbon, Argon, Neon</span>
        </p>

        <h1 className="hero-legibility font-display mt-4 max-w-[780px] text-balance text-[clamp(2.65rem,5.35vw,4.65rem)] font-medium leading-[1.03] tracking-[-0.025em] text-[var(--text)]">
          Reverse engineer any video edit into a{' '}
          <em className="italic font-normal text-[#c8daff]">reusable AI skill.</em>
        </h1>

        <p className="hero-legibility mt-6 max-w-xl text-[15.5px] leading-[1.65] text-[#d9dff2] md:text-[17px]">
          Download four structured Markdown skill files that teach Gemini, Claude, and ChatGPT to measure shot pacing,
          beat sync, camera moves, and motion graphics—then apply them to your own footage.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-4 pointer-events-auto">
          <button
            type="button"
            onClick={() => onNavigate('products')}
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-[#06070c] shadow-lg transition-colors duration-150 hover:bg-[#95b6ff] cursor-pointer whitespace-nowrap"
          >
            <span>Explore the Four Skills</span>
            <ArrowRight size={16} />
          </button>
          <button
            type="button"
            onClick={() => onNavigate('docs')}
            className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-[#0a0c14]/75 px-5 py-3 text-sm font-medium text-[var(--text)] backdrop-blur-md transition-colors duration-150 hover:bg-white/10 cursor-pointer whitespace-nowrap"
          >
            Read Setup Docs
          </button>
        </div>
      </div>

      {/* Bottom Interactive Hint & Tweaks Panel */}
      <div className="relative z-20 flex items-end justify-between gap-4 px-4 pb-5 md:px-6 md:pb-5 pointer-events-none">
        <p className="font-mono text-[11px] font-semibold tracking-[0.02em] text-[var(--muted)] select-none">
          {speciesKey === 'turtles' ? 'click empty grid to drop food' : 'click to scatter'}
        </p>

        <div className="pointer-events-auto">
          <TweaksPanel
            open={tweaksOpen}
            onToggleOpen={toggleTweaks}
            species={activeMeta}
            tuning={tuning}
            glass={glass}
            onChangeTuning={handleChangeTuning}
            onResetTuningKey={handleResetTuningKey}
            onChangeGlass={handleChangeGlass}
            onResetGlassKey={handleResetGlassKey}
            onResetAll={handleResetAll}
            getDiffJson={getDiffJson}
          />
        </div>
      </div>
    </section>
  );
}
