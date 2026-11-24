import {
  clamp,
  computeBaseSize,
  computeCellSize,
  computeDepth,
  computeTargetPopulation,
  evalPolarLobe,
  hashInt,
  lerp,
  mixRgb,
  rotateHueRgb,
  smoothstep,
} from './animalMath';
import { SPECIES_BY_KEY, SpeciesKey, SpeciesMeta } from './speciesConfig';

type CellKind = 'Plain' | 'Shine' | 'Dark' | 'Light' | 'Fur' | 'Soft' | 'Bright' | 'Line';

interface ShapeHit {
  rgb: [number, number, number];
  kind: CellKind;
  glyphs?: string;
}

interface CellData {
  state: 0 | 1 | 2; // 0 empty, 1 stroke, 2 solid
  fillR: number;
  fillG: number;
  fillB: number;
  glyphR: number;
  glyphG: number;
  glyphB: number;
  char: string;
  isSpot?: boolean;
}

interface AnimalEntity {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  heading: number;
  roll: number;
  depth: number;
  span: number;
  bias: number;
  phase: number;
  pace: number;
  startledUntil: number;
  // Species-specific state
  glideTimer: number;
  glideBlend: number;
  hopState: 'run' | 'rest';
  hopTimer: number;
  hopAmount: number;
  alarm: number;
  fleeEnd: number;
  fleeSpeed: number;
  fleeAngle: number;
  owlState: 'hover' | 'swoop' | 'cruise';
  owlTimer: number;
  owlTuck: number;
  owlAim: number;
  fishState: 'wait' | 'leap';
  fishTimer: number;
  fishStartX: number;
  fishStartY: number;
  fishTargetX: number;
  fishTargetY: number;
  fishDuration: number;
  fishProgress: number;
  fishLeapHeight: number;
  turnRate: number;
  lastStepInt: number;
}

interface Pellet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  born: number;
  life: number;
}

interface MarineFlake {
  x: number;
  y: number;
  speed: number;
  phase: number;
  star: boolean;
}

const BG_RGB: [number, number, number] = [6, 7, 12];
const PLAIN_RAMP = '.:;+=*%#';
const EDGE_RAMP_HI = ':;';
const EDGE_RAMP_LO = ".,'`";

export class GlyphAnimalEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private bgCanvas: HTMLCanvasElement;
  private bgCtx: CanvasRenderingContext2D;
  private species: SpeciesMeta;
  private tuning: Record<string, number | boolean>;
  private fixedCount: number | null = null;

  private width = 1440;
  private height = 900;
  private dpr = 1;
  private cw = 9;
  private ch = 13;
  private cols = 160;
  private rows = 70;

  private cells: CellData[] = [];
  private trail: Float32Array = new Float32Array(0);
  private trailNext: Float32Array = new Float32Array(0);
  private animals: AnimalEntity[] = [];
  private pellets: Pellet[] = [];
  private marineSnow: MarineFlake[] = [];

  private nextId = 1;
  private simTime = 0;
  private accumulator = 0;
  private lastRaf = 0;
  private rafId: number | null = null;
  private isIntersecting = true;
  private reducedMotion = false;
  private fontFamily = '"Geist Mono", ui-monospace, Menlo, monospace';
  private hueCache = new Map<number, [number, number, number]>();
  private lastHue = 0;

  private resizeObserver: ResizeObserver | null = null;
  private intersectionObserver: IntersectionObserver | null = null;
  private motionMedia: MediaQueryList | null = null;
  private bgDirty = true;

  constructor(
    canvas: HTMLCanvasElement,
    initialSpecies: SpeciesKey,
    initialTuning: Record<string, number | boolean>,
    fixedCount: number | null = null,
  ) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) throw new Error('Could not obtain 2D context');
    this.ctx = ctx;

    this.bgCanvas = document.createElement('canvas');
    const bgCtx = this.bgCanvas.getContext('2d', { alpha: false });
    if (!bgCtx) throw new Error('Could not obtain offscreen 2D context');
    this.bgCtx = bgCtx;

    this.species = SPECIES_BY_KEY[initialSpecies];
    this.tuning = { ...initialTuning };
    this.fixedCount = fixedCount;

    const computed = getComputedStyle(canvas).fontFamily;
    if (computed) this.fontFamily = computed;

    this.motionMedia = window.matchMedia('(prefers-reduced-motion: reduce)');
    this.reducedMotion = this.motionMedia.matches;
    this.motionMedia.addEventListener('change', this.onReducedMotionChange);

    this.resizeObserver = new ResizeObserver(() => this.handleResize());
    this.resizeObserver.observe(canvas);

    this.intersectionObserver = new IntersectionObserver(
      (entries) => {
        const visible = entries.some((e) => e.isIntersecting);
        this.isIntersecting = visible;
        if (visible && !this.reducedMotion && this.rafId === null) {
          this.lastRaf = performance.now();
          this.rafId = requestAnimationFrame(this.loop);
        }
      },
      { threshold: 0.01 },
    );
    this.intersectionObserver.observe(canvas);

    this.handleResize(true);

    if (this.reducedMotion) {
      this.renderReducedStill();
    } else {
      this.lastRaf = performance.now();
      this.rafId = requestAnimationFrame(this.loop);
    }
  }

  public destroy(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.resizeObserver?.disconnect();
    this.intersectionObserver?.disconnect();
    this.motionMedia?.removeEventListener('change', this.onReducedMotionChange);
  }

  private onReducedMotionChange = (e: MediaQueryListEvent): void => {
    this.reducedMotion = e.matches;
    if (this.reducedMotion) {
      if (this.rafId !== null) {
        cancelAnimationFrame(this.rafId);
        this.rafId = null;
      }
      this.renderReducedStill();
    } else if (this.isIntersecting && this.rafId === null) {
      this.lastRaf = performance.now();
      this.rafId = requestAnimationFrame(this.loop);
    }
  };

  public setSpecies(key: SpeciesKey, tuning: Record<string, number | boolean>): void {
    this.species = SPECIES_BY_KEY[key];
    this.tuning = { ...tuning };
    this.animals = [];
    this.pellets = [];
    this.trail.fill(0);
    this.trailNext.fill(0);
    this.hueCache.clear();
    this.bgDirty = true;
    this.handleResize(true);
    if (this.reducedMotion) {
      this.renderReducedStill();
    }
  }

  public updateTuning(nextTuning: Record<string, number | boolean>, changedKey?: string): void {
    const prevDetail = Number(this.tuning.detail ?? 1.3);
    const prevGrid = Number(this.tuning.grid ?? 1.05);
    const prevHue = Number(this.tuning.hue ?? 0);

    this.tuning = { ...nextTuning };

    const nextDetail = Number(this.tuning.detail ?? 1.3);
    const nextGrid = Number(this.tuning.grid ?? 1.05);
    const nextHue = Number(this.tuning.hue ?? 0);

    if (changedKey === 'detail' || Math.abs(prevDetail - nextDetail) > 1e-4) {
      this.handleResize(false);
    }
    if (
      changedKey === 'grid' ||
      changedKey === 'hue' ||
      Math.abs(prevGrid - nextGrid) > 1e-4 ||
      Math.abs(prevHue - nextHue) > 1e-4
    ) {
      this.hueCache.clear();
      this.bgDirty = true;
    }

    this.reconcilePopulation(false);

    if (this.reducedMotion) {
      this.drawFrame();
    }
  }

  public handleTap(clientX: number, clientY: number): void {
    if (this.reducedMotion) return;
    const rect = this.canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    if (this.species.key === 'turtles') {
      const count = 7 + Math.floor(Math.random() * 5);
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.random() * 70;
        const speed = 4 + Math.random() * 10;
        if (this.pellets.length >= 60) {
          this.pellets.shift();
        }
        this.pellets.push({
          x: x + Math.cos(angle) * dist,
          y: y + Math.sin(angle) * dist,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          born: this.simTime,
          life: 14,
        });
        this.stampTrail(x + Math.cos(angle) * dist, y + Math.sin(angle) * dist, 1, 0.55);
      }
      return;
    }

    this.stampTrail(x, y, 6, 1.4);

    const course = this.getCourseRad();
    for (const a of this.animals) {
      const dx = a.x - x;
      const dy = a.y - y;
      const dist = Math.hypot(dx, dy);
      if (dist > 240) continue;
      const k = 1 - dist / 240;
      const awayAngle = dist > 1 ? Math.atan2(dy, dx) : Math.random() * Math.PI * 2;

      if (this.species.key === 'moths') {
        const kick = k * 420 * a.depth;
        a.vx += Math.cos(awayAngle) * kick;
        a.vy += Math.sin(awayAngle) * kick;
        a.startledUntil = this.simTime + 0.6 + Math.random() * 0.6;
        a.glideTimer = 0;
        a.glideBlend = 0;
      } else if (this.species.key === 'rabbits') {
        const scare = Number(this.tuning.scare ?? 0.6);
        if (scare > 0) {
          const base = this.getCruiseSpeed(a);
          a.fleeAngle = awayAngle + (Math.random() - 0.5) * 0.7;
          a.fleeSpeed = base * (2.5 + 3 * k) * scare;
          a.fleeEnd = this.simTime + (1 + 1.5 * k) * Math.sqrt(scare);
          a.startledUntil = a.fleeEnd;
          a.hopState = 'run';
          a.alarm = 1;
        }
      } else if (this.species.key === 'squid') {
        a.phase = 0;
        const kick = 260 * k * a.depth;
        a.vx += Math.cos(a.heading) * kick;
        a.vy += Math.sin(a.heading) * kick;
        a.startledUntil = this.simTime + 0.6;
      } else if (this.species.key === 'owls') {
        a.owlState = 'swoop';
        a.owlTimer = 0.25 + 0.3 * k;
        a.owlAim = course;
        a.startledUntil = this.simTime + a.owlTimer;
      } else if (this.species.key === 'flyingfish') {
        if (a.fishState === 'wait') {
          const leapLen = Number(this.tuning.leapLength ?? 0.6);
          const distJump = a.span * (2.4 + Math.random() * 1.2) * leapLen * (1 + k) * 1.2;
          a.fishState = 'leap';
          a.fishStartX = a.x;
          a.fishStartY = a.y;
          a.fishTargetX = a.x + Math.cos(awayAngle) * distJump;
          a.fishTargetY = a.y + Math.sin(awayAngle) * distJump;
          a.heading = awayAngle;
          a.fishDuration = (0.42 + Math.random() * 0.13) * Math.sqrt(leapLen) / 1.2;
          a.fishProgress = 0;
          a.fishLeapHeight = Number(this.tuning.leapHeight ?? 1);
          a.startledUntil = this.simTime + 0.5;
        }
      } else if (this.species.key === 'eagles') {
        const push = k * 340 * a.depth;
        a.vx += Math.cos(awayAngle) * push;
        a.vy += Math.sin(awayAngle) * push;
        a.startledUntil = this.simTime + 0.6;
      }
    }
  }

  private renderReducedStill(): void {
    document.fonts
      .load('600 16px "Geist Mono"')
      .catch(() => undefined)
      .finally(() => {
        for (let i = 0; i < 240; i++) {
          this.stepSimulation(1 / 60);
        }
        this.drawFrame();
      });
  }

  private handleResize(initial = false): void {
    const rect = this.canvas.getBoundingClientRect();
    this.width = Math.max(320, Math.round(rect.width || window.innerWidth));
    this.height = Math.max(240, Math.round(rect.height || window.innerHeight));
    this.dpr = Math.min(2, window.devicePixelRatio || 1);

    this.canvas.width = Math.round(this.width * this.dpr);
    this.canvas.height = Math.round(this.height * this.dpr);
    this.bgCanvas.width = this.canvas.width;
    this.bgCanvas.height = this.canvas.height;

    const detail = Number(this.tuning.detail ?? 1.3);
    const { cw, ch } = computeCellSize(this.width, detail);
    this.cw = cw;
    this.ch = ch;
    this.cols = Math.ceil(this.width / cw) + 1;
    this.rows = Math.ceil(this.height / ch) + 1;

    const total = this.cols * this.rows;
    this.cells = new Array<CellData>(total);
    for (let i = 0; i < total; i++) {
      this.cells[i] = {
        state: 0,
        fillR: 0,
        fillG: 0,
        fillB: 0,
        glyphR: 0,
        glyphG: 0,
        glyphB: 0,
        char: ' ',
      };
    }

    this.trail = new Float32Array(total);
    this.trailNext = new Float32Array(total);
    this.bgDirty = true;

    this.reconcilePopulation(initial);
    this.reconcileMarineSnow();
  }

  private reconcileMarineSnow(): void {
    if (this.species.key !== 'squid') {
      this.marineSnow = [];
      return;
    }
    const target = clamp(Math.round((this.width * this.height) / 6000), 10, 400);
    while (this.marineSnow.length < target) {
      this.marineSnow.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        speed: 3 + Math.random() * 9,
        phase: Math.random() * Math.PI * 2,
        star: Math.random() < 0.08,
      });
    }
    if (this.marineSnow.length > target) {
      this.marineSnow.length = target;
    }
  }

  private getCourseRad(): number {
    if (this.tuning.cornerToCorner) {
      return Math.atan2(-this.height, this.width);
    }
    const deg = Number(this.tuning.direction ?? 49);
    // 0 = right, 90 = up -> canvas y goes down so negate sin
    return (-deg * Math.PI) / 180;
  }

  private getGroupHeading(): number {
    const course = this.getCourseRad();
    const sway = Number(this.tuning.sway ?? 0.04);
    return course + sway * (Math.sin(0.13 * this.simTime) + 0.5 * Math.sin(0.31 * this.simTime + 1.7));
  }

  private getCruiseSpeed(a: AnimalEntity): number {
    const speedMult = Number(this.tuning.speed ?? 1);
    return this.species.speed * (0.55 + 0.45 * a.depth) * speedMult;
  }

  private reconcilePopulation(initial: boolean): void {
    const base = computeBaseSize(this.width, this.height, this.species.scale);
    const density = Number(this.tuning.density ?? 1);
    const target =
      this.fixedCount !== null
        ? clamp(this.fixedCount, 1, 200)
        : computeTargetPopulation(this.width, this.height, this.species.area, base, this.species.scale, density);

    const farthest = Number(this.tuning.farthest ?? 0.45);
    const farBias = Number(this.tuning.farBias ?? 1.6);
    const size = Number(this.tuning.size ?? 1);

    for (const a of this.animals) {
      a.depth = computeDepth(a.roll, farthest, farBias);
      a.span = base * a.depth * size;
    }

    while (this.animals.length > target) {
      const idx = Math.floor(Math.random() * this.animals.length);
      this.animals.splice(idx, 1);
    }

    const course = this.getCourseRad();
    while (this.animals.length < target) {
      const roll = Math.random();
      const depth = computeDepth(roll, farthest, farBias);
      const span = base * depth * size;
      const anywhere = initial || Math.random() < 0.5;
      const pos = anywhere ? { x: Math.random() * this.width, y: Math.random() * this.height } : this.spawnUpwindPos(course, span);
      const cruise = this.species.speed * (0.55 + 0.45 * depth) * Number(this.tuning.speed ?? 1);
      const heading = course + (Math.random() - 0.5) * 0.2;

      this.animals.push({
        id: this.nextId++,
        x: pos.x,
        y: pos.y,
        vx: Math.cos(heading) * cruise,
        vy: Math.sin(heading) * cruise,
        heading,
        roll,
        depth,
        span,
        bias: Math.random() * 2 - 1,
        phase: Math.random() * Math.PI * 2,
        pace: 0.8 + Math.random() * 0.4,
        startledUntil: -10,
        glideTimer: 0,
        glideBlend: 0,
        hopState: Math.random() < 0.7 ? 'run' : 'rest',
        hopTimer: 0.4 + Math.random(),
        hopAmount: 1,
        alarm: 0,
        fleeEnd: -10,
        fleeSpeed: 0,
        fleeAngle: heading,
        owlState: Math.random() < 0.55 ? 'hover' : 'cruise',
        owlTimer: 0.5 + Math.random() * 1.5,
        owlTuck: 0,
        owlAim: heading,
        fishState: 'wait',
        fishTimer: Math.random() * 1.2,
        fishStartX: pos.x,
        fishStartY: pos.y,
        fishTargetX: pos.x,
        fishTargetY: pos.y,
        fishDuration: 0.45,
        fishProgress: 0,
        fishLeapHeight: Number(this.tuning.leapHeight ?? 1),
        turnRate: 0,
        lastStepInt: 0,
      });
    }

    this.animals.sort((a, b) => a.roll - b.roll);
  }

  private spawnUpwindPos(course: number, span: number): { x: number; y: number } {
    const dx = Math.cos(course);
    const dy = Math.sin(course);
    // Upwind edges are those facing into (-dx, -dy)
    const expX = Math.abs(dx) * this.height;
    const expY = Math.abs(dy) * this.width;
    const total = expX + expY || 1;
    if (Math.random() < expX / total) {
      // Spawn on left or right edge
      const x = dx >= 0 ? -span : this.width + span;
      return { x, y: Math.random() * this.height };
    }
    const y = dy >= 0 ? -span : this.height + span;
    return { x: Math.random() * this.width, y };
  }

  private wrapAnimal(a: AnimalEntity, course: number): void {
    const dx = Math.cos(course);
    const dy = Math.sin(course);
    const margin = a.span;
    const far = a.span * 3;
    let passedDownwind = false;

    if (dx > 0.1 && a.x > this.width + margin) passedDownwind = true;
    if (dx < -0.1 && a.x < -margin) passedDownwind = true;
    if (dy > 0.1 && a.y > this.height + margin) passedDownwind = true;
    if (dy < -0.1 && a.y < -margin) passedDownwind = true;

    if (a.x < -far || a.x > this.width + far || a.y < -far || a.y > this.height + far) {
      passedDownwind = true;
    }

    if (passedDownwind) {
      const p = this.spawnUpwindPos(course, a.span);
      a.x = p.x;
      a.y = p.y;
      if (this.species.key === 'flyingfish' && a.fishState === 'leap') {
        a.fishState = 'wait';
        a.fishTimer = 0.2;
      }
    }
  }

  private loop = (now: number): void => {
    if (!this.isIntersecting || this.reducedMotion) {
      this.rafId = null;
      return;
    }
    const dt = Math.min(0.1, Math.max(0, (now - this.lastRaf) / 1000));
    this.lastRaf = now;
    this.accumulator += dt;

    let steps = 0;
    const fixedDt = 1 / 60;
    while (this.accumulator >= fixedDt && steps < 4) {
      this.stepSimulation(fixedDt);
      this.accumulator -= fixedDt;
      steps++;
    }

    this.drawFrame();
    this.rafId = requestAnimationFrame(this.loop);
  };

  private stepSimulation(dt: number): void {
    this.simTime += dt;
    const groupHeading = this.getGroupHeading();
    const spread = Number(this.tuning.spread ?? 0.06);
    const grip = Number(this.tuning.grip ?? 2);
    const sepStrength = Number(this.tuning.separation ?? 300);
    const trailMult = Number(this.tuning.trail ?? 1);
    const trailFade = Number(this.tuning.trailFade ?? 1.3);

    // Update pellets (turtles)
    for (let i = this.pellets.length - 1; i >= 0; i--) {
      const p = this.pellets[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      const damp = Math.exp(-0.8 * dt);
      p.vx *= damp;
      p.vy *= damp;
      if (this.simTime - p.born > p.life) {
        this.pellets.splice(i, 1);
      }
    }

    // Update marine snow (squid)
    for (const f of this.marineSnow) {
      f.y += f.speed * dt;
      f.x += Math.sin(this.simTime * 0.8 + f.phase) * 4 * dt;
      if (f.y > this.height + 8) {
        f.y = -8;
        f.x = Math.random() * this.width;
      }
    }

    const n = this.animals.length;
    const reach = this.species.key === 'eagles' ? 0.45 : 0.72;

    for (let i = 0; i < n; i++) {
      const a = this.animals[i];
      const cruise = this.getCruiseSpeed(a);
      const aim = groupHeading + a.bias * spread;

      // Separation force
      let sepX = 0;
      let sepY = 0;
      if (sepStrength > 0) {
        for (let j = 0; j < n; j++) {
          if (i === j) continue;
          const b = this.animals[j];
          if (Math.abs(a.depth - b.depth) >= 0.18) continue;
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const minDist = (a.span + b.span) * reach;
          const distSq = dx * dx + dy * dy;
          if (distSq > 0.001 && distSq < minDist * minDist) {
            const dist = Math.sqrt(distSq);
            const push = (1 - dist / minDist) * sepStrength;
            sepX += (dx / dist) * push;
            sepY += (dy / dist) * push;
          }
        }
      }

      if (this.species.key === 'moths') {
        const flutter = Number(this.tuning.flutter ?? 0);
        const glideT = Number(this.tuning.glide ?? 2.75);
        const flapRate = Number(this.tuning.flapRate ?? 1);

        if (a.glideTimer > 0) {
          a.glideTimer -= dt;
          a.glideBlend = Math.min(1, a.glideBlend + 6 * dt);
        } else {
          a.glideBlend = Math.max(0, a.glideBlend - 6 * dt);
          if (glideT > 0 && Math.random() < 0.35 * glideT * dt) {
            a.glideTimer = 0.5 + Math.random() * 0.9;
          }
        }

        const curSpeed = Math.hypot(a.vx, a.vy);
        const speedFrac = clamp(curSpeed / Math.max(1, cruise), 0, 1.5);
        a.phase += dt * Math.PI * 2 * 2.6 * flapRate * (0.8 + 0.6 * speedFrac) * (1 - 0.9 * a.glideBlend);

        const targetVx = Math.cos(aim) * cruise;
        const targetVy = Math.sin(aim) * cruise;
        a.vx += ((targetVx - a.vx) * grip + sepX) * dt;
        a.vy += ((targetVy - a.vy) * grip + sepY) * dt;

        // Flutter impulses
        if (flutter > 0) {
          const damp = Math.exp(-3 * dt);
          const flScale = Math.sqrt(dt) * 520 * 1.3 * flutter * (1 - 0.7 * a.glideBlend);
          a.vx = a.vx * damp + (Math.random() - 0.5) * flScale;
          a.vy = a.vy * damp + (Math.random() - 0.5) * flScale;
        }

        // Downstroke forward push
        const downstroke = Math.max(0, -Math.sin(a.phase));
        a.vx += Math.cos(a.heading) * downstroke * 1.4 * cruise * dt * (1 - a.glideBlend);
        a.vy += Math.sin(a.heading) * downstroke * 1.4 * cruise * dt * (1 - a.glideBlend);

        this.capAndTurn(a, cruise, dt, 6);
        a.x += a.vx * dt;
        a.y += a.vy * dt;

        // Wing tips shed trail
        if (trailMult > 0) {
          const open = 0.1 + 0.9 * (Math.pow(0.5 + 0.5 * Math.cos(a.phase), 0.8) * (1 - a.glideBlend) + 0.96 * a.glideBlend);
          const nx = -Math.sin(a.heading);
          const ny = Math.cos(a.heading);
          const tipSpan = a.span * 0.58 * open;
          const shed = (0.2 + 0.45 * downstroke) * dt * 6;
          this.shedTrail(a.x + nx * tipSpan, a.y + ny * tipSpan, shed);
          this.shedTrail(a.x - nx * tipSpan, a.y - ny * tipSpan, shed);
        }
      } else if (this.species.key === 'rabbits') {
        const burst = Number(this.tuning.burst ?? 1);
        const pause = Number(this.tuning.pause ?? 1);
        const hopSpeed = Number(this.tuning.hopSpeed ?? 1);
        const fleeing = this.simTime < a.fleeEnd;
        a.alarm = Math.max(0, a.alarm - 0.7 * dt);

        if (fleeing) {
          const rem = clamp((a.fleeEnd - this.simTime) / 1.5, 0, 1);
          const spd = a.fleeSpeed * rem * rem + cruise * 0.5;
          a.vx = Math.cos(a.fleeAngle) * spd + sepX * dt;
          a.vy = Math.sin(a.fleeAngle) * spd + sepY * dt;
          a.heading = this.turnToward(a.heading, Math.atan2(a.vy, a.vx), 10 * dt);
        } else {
          a.hopTimer -= dt;
          if (a.hopTimer <= 0) {
            if (a.hopState === 'run' && pause > 0) {
              a.hopState = 'rest';
              a.hopTimer = (0.3 + Math.random() * 1.1) * pause;
            } else {
              a.hopState = 'run';
              a.hopTimer = (0.5 + Math.random() * 1.1) * burst;
            }
          }

          if (a.hopState === 'run') {
            const tvx = Math.cos(aim) * cruise;
            const tvy = Math.sin(aim) * cruise;
            a.vx += ((tvx - a.vx) * 2 * grip + sepX) * dt;
            a.vy += ((tvy - a.vy) * 2 * grip + sepY) * dt;
          } else {
            a.vx += (-a.vx * 6 + sepX * 0.3) * dt;
            a.vy += (-a.vy * 6 + sepY * 0.3) * dt;
          }

          const spd = Math.hypot(a.vx, a.vy);
          if (spd > 6) {
            a.heading = this.turnToward(a.heading, Math.atan2(a.vy, a.vx), 3 * dt);
          }
        }

        const spd = Math.hypot(a.vx, a.vy);
        a.hopAmount += ((spd > 12 ? 1 : 0) - a.hopAmount) * Math.min(1, 10 * dt);
        a.phase += dt * Math.max(spd, 30 * a.hopAmount) * hopSpeed / Math.max(4, 0.32 * a.span);
        const stepInt = Math.floor(a.phase / Math.PI);
        if (stepInt > a.lastStepInt && a.hopAmount > 0.3) {
          a.lastStepInt = stepInt;
          this.stampTrail(a.x, a.y + a.span * 0.14, 0, 0.5 * a.depth * trailMult);
        }
        a.x += a.vx * dt;
        a.y += a.vy * dt;
      } else if (this.species.key === 'turtles') {
        const meander = Number(this.tuning.meander ?? 0.4);
        const flipperBeat = Number(this.tuning.flipperBeat ?? 1);
        const foodRange = Number(this.tuning.foodRange ?? 200);

        // Find nearest pellet
        let targetPellet: Pellet | null = null;
        let bestDist = foodRange;
        let targetIdx = -1;
        for (let pi = 0; pi < this.pellets.length; pi++) {
          const p = this.pellets[pi];
          const d = Math.hypot(p.x - a.x, p.y - a.y);
          if (d < bestDist) {
            bestDist = d;
            targetPellet = p;
            targetIdx = pi;
          }
        }

        let desiredHeading = aim + meander * 0.6 * Math.sin(0.35 * this.simTime + 1.7 * a.id);
        let speedFactor = 0.85 + 0.25 * Math.sin(0.5 * this.simTime + a.id);
        let turnCap = 0.9 * grip;

        if (targetPellet) {
          desiredHeading = Math.atan2(targetPellet.y - a.y, targetPellet.x - a.x);
          const closeness = 1 - bestDist / Math.max(1, foodRange);
          speedFactor = 1.15 + 0.65 * closeness;
          turnCap = 2.6;
          if (bestDist < 0.32 * a.span + 6 && targetIdx >= 0) {
            this.stampTrail(targetPellet.x, targetPellet.y, 1, 0.7);
            this.pellets.splice(targetIdx, 1);
          }
        }

        const targetSpeed = cruise * speedFactor;
        const steerX = Math.cos(desiredHeading) * targetSpeed + sepX * 0.35;
        const steerY = Math.sin(desiredHeading) * targetSpeed + sepY * 0.35;
        const steerAngle = Math.atan2(steerY, steerX);
        a.heading = this.turnToward(a.heading, steerAngle, turnCap * dt);
        a.vx = Math.cos(a.heading) * targetSpeed;
        a.vy = Math.sin(a.heading) * targetSpeed;
        a.phase += dt * (1.4 + targetSpeed / 40) * flipperBeat;
        a.x += a.vx * dt;
        a.y += a.vy * dt;

        this.shedTrail(
          a.x - Math.cos(a.heading) * a.span * 0.28,
          a.y - Math.sin(a.heading) * a.span * 0.28,
          0.18 * dt * 6,
        );
      } else if (this.species.key === 'squid') {
        const pulseRate = Number(this.tuning.pulseRate ?? 1);
        const pulsePower = Number(this.tuning.pulsePower ?? 1);
        const prevHeading = a.heading;
        a.heading = this.turnToward(a.heading, aim, 0.6 * grip * dt);
        const rawTurn = (a.heading - prevHeading) / dt;
        a.turnRate = lerp(a.turnRate, clamp(rawTurn, -2, 2), Math.min(1, 6 * dt));

        a.phase = (a.phase + dt * 0.6 * pulseRate * (0.9 + 0.2 * a.roll)) % 1;
        if (a.phase < 0.22) {
          const jet = 6.2 * cruise * pulsePower;
          a.vx += Math.cos(a.heading) * jet * dt;
          a.vy += Math.sin(a.heading) * jet * dt;
        }
        a.vx += (-1.4 * a.vx + sepX * 0.35) * dt;
        a.vy += (-1.4 * a.vy + sepY * 0.35) * dt;
        a.x += a.vx * dt;
        a.y += a.vy * dt;

        const armReach = Number(this.tuning.armLength ?? 1) * 0.72 * a.span;
        this.shedTrail(
          a.x - Math.cos(a.heading) * armReach,
          a.y - Math.sin(a.heading) * armReach,
          0.08 * dt * 6,
        );
      } else if (this.species.key === 'owls') {
        const hoverScale = Number(this.tuning.hover ?? 1.3);
        const cruisingProb = Number(this.tuning.cruising ?? 0.5);
        const swoopMult = Number(this.tuning.swoopSpeed ?? 1.3);
        const wingbeat = Number(this.tuning.wingbeat ?? 1);

        a.owlTimer -= dt;
        if (a.owlTimer <= 0) {
          if (a.owlState === 'hover') {
            a.owlState = 'swoop';
            a.owlTimer = 0.15 + Math.random() * 0.3;
            a.owlAim = aim + (Math.random() - 0.5) * 0.5;
          } else if (a.owlState === 'swoop') {
            if (Math.random() < cruisingProb) {
              a.owlState = 'cruise';
              a.owlTimer = 1.2 + Math.random() * 3.3;
              a.owlAim = aim + (Math.random() - 0.5) * 0.35;
            } else {
              a.owlState = 'hover';
              a.owlTimer = clamp(-0.7 * Math.log(Math.max(0.01, Math.random())), 0.15, 3) * hoverScale;
            }
          } else {
            a.owlState = Math.random() < 0.35 ? 'swoop' : 'hover';
            a.owlTimer =
              a.owlState === 'swoop'
                ? 0.15 + Math.random() * 0.3
                : clamp(-0.7 * Math.log(Math.max(0.01, Math.random())), 0.15, 3) * hoverScale;
          }
        }

        const targetTuck = a.owlState === 'swoop' ? 1 : 0;
        a.owlTuck += (targetTuck - a.owlTuck) * Math.min(1, 8 * dt);

        if (a.owlState === 'hover') {
          const wobX = Math.cos(this.simTime * 2.1 + a.id) * 40;
          const wobY = Math.sin(this.simTime * 1.4 + a.id * 1.7) * 40;
          const tvx = Math.cos(aim) * cruise * 0.25;
          const tvy = Math.sin(aim) * cruise * 0.25;
          a.vx += ((tvx - a.vx) * 4 + wobX + sepX) * dt;
          a.vy += ((tvy - a.vy) * 4 + wobY + sepY) * dt;
          a.heading = this.turnToward(a.heading, aim, 4 * dt);
        } else if (a.owlState === 'swoop') {
          const tvx = Math.cos(a.owlAim) * cruise * 4 * swoopMult;
          const tvy = Math.sin(a.owlAim) * cruise * 4 * swoopMult;
          a.vx += ((tvx - a.vx) * 8 + sepX * 0.4) * dt;
          a.vy += ((tvy - a.vy) * 8 + sepY * 0.4) * dt;
          a.heading = this.turnToward(a.heading, Math.atan2(a.vy, a.vx), 14 * dt);
          this.shedTrail(a.x - Math.cos(a.heading) * a.span * 0.25, a.y - Math.sin(a.heading) * a.span * 0.25, 0.3 * dt * 6);
        } else {
          const tvx = Math.cos(a.owlAim) * cruise;
          const tvy = Math.sin(a.owlAim) * cruise;
          a.vx += ((tvx - a.vx) * grip + sepX) * dt;
          a.vy += ((tvy - a.vy) * grip + sepY) * dt;
          a.heading = this.turnToward(a.heading, Math.atan2(a.vy, a.vx), 4 * dt);
        }

        const hz = a.owlState === 'hover' ? 3.4 : 2.2;
        a.phase += dt * Math.PI * 2 * hz * wingbeat * (1 - 0.85 * a.owlTuck);
        a.x += a.vx * dt;
        a.y += a.vy * dt;
      } else if (this.species.key === 'flyingfish') {
        const howOften = Number(this.tuning.howOften ?? 1);
        const leapLength = Number(this.tuning.leapLength ?? 0.6);
        const leapHeight = Number(this.tuning.leapHeight ?? 1);
        const speedMult = Number(this.tuning.speed ?? 1);

        if (a.fishState === 'wait') {
          a.heading = this.turnToward(a.heading, a.owlAim || aim, 3 * dt);
          a.fishTimer -= dt;
          if (a.fishTimer <= 0) {
            const baseDist = a.span * (2.4 + Math.random() * 1.2) * leapLength * speedMult;
            const leapAngle = clamp(aim, groupHeading - 0.35, groupHeading + 0.35);
            const multipliers = sepStrength > 0 ? [1, 0.8, 1.2, 0.65, 1.35] : [1];
            let bestX = a.x + Math.cos(leapAngle) * baseDist;
            let bestY = a.y + Math.sin(leapAngle) * baseDist;
            let bestScore = -1;

            for (const m of multipliers) {
              const cx = a.x + Math.cos(leapAngle) * baseDist * m;
              const cy = a.y + Math.sin(leapAngle) * baseDist * m;
              let minNeighbor = 1e9;
              for (let j = 0; j < n; j++) {
                if (i === j) continue;
                const b = this.animals[j];
                if (Math.abs(a.depth - b.depth) >= 0.18) continue;
                const d = Math.hypot(cx - b.x, cy - b.y);
                if (d < minNeighbor) minNeighbor = d;
              }
              if (minNeighbor > bestScore) {
                bestScore = minNeighbor;
                bestX = cx;
                bestY = cy;
              }
            }

            a.fishState = 'leap';
            a.fishStartX = a.x;
            a.fishStartY = a.y;
            a.fishTargetX = bestX;
            a.fishTargetY = bestY;
            a.heading = Math.atan2(bestY - a.y, bestX - a.x);
            a.fishDuration = (0.42 + Math.random() * 0.13) * Math.sqrt(leapLength);
            a.fishProgress = 0;
            a.fishLeapHeight = leapHeight;
          }
        } else {
          a.fishProgress += dt / Math.max(0.1, a.fishDuration);
          if (a.fishProgress >= 1) {
            a.x = a.fishTargetX;
            a.y = a.fishTargetY;
            a.fishState = 'wait';
            a.fishTimer = (0.5 + Math.random() * 1.7) / Math.max(0.1, howOften * speedMult);
            a.owlAim = groupHeading + (Math.random() * 2 - 1) * 0.7 * spread;
            this.stampTrail(a.x, a.y, 2, 0.7 * a.depth * trailMult);
          } else {
            a.x = lerp(a.fishStartX, a.fishTargetX, a.fishProgress);
            a.y = lerp(a.fishStartY, a.fishTargetY, a.fishProgress);
            if (a.fishProgress > 0.1 && a.fishProgress < 0.9) {
              this.shedTrail(a.x - Math.cos(a.heading) * a.span * 0.3, a.y - Math.sin(a.heading) * a.span * 0.3, 0.25 * dt * 6);
            }
          }
        }
      } else if (this.species.key === 'eagles') {
        const wingbeat = Number(this.tuning.wingbeat ?? 0.85);
        const glideT = Number(this.tuning.glide ?? 1.6);

        if (a.glideTimer > 0) {
          a.glideTimer -= dt;
          a.glideBlend = Math.min(1, a.glideBlend + 3 * dt);
        } else {
          a.glideBlend = Math.max(0, a.glideBlend - 3 * dt);
          if (glideT > 0 && Math.random() < 0.25 * glideT * dt) {
            a.glideTimer = 1 + Math.random() * 1.5;
          }
        }

        a.phase += dt * Math.PI * 2 * 1.25 * wingbeat * a.pace * (1 - 0.92 * a.glideBlend);

        const tvx = Math.cos(aim) * cruise;
        const tvy = Math.sin(aim) * cruise;
        a.vx += ((tvx - a.vx) * grip + sepX) * dt;
        a.vy += ((tvy - a.vy) * grip + sepY) * dt;
        this.capAndTurn(a, cruise * 1.6, dt, 2);
        a.x += a.vx * dt;
        a.y += a.vy * dt;
      }

      this.wrapAnimal(a, groupHeading);
    }

    // Diffuse and decay trail field
    const decay = Math.exp(-dt * trailFade);
    const cols = this.cols;
    const rows = this.rows;
    const tr = this.trail;
    const tn = this.trailNext;
    for (let r = 0; r < rows; r++) {
      const rUp = r > 0 ? r - 1 : r;
      const rDn = r < rows - 1 ? r + 1 : r;
      const rowOff = r * cols;
      for (let c = 0; c < cols; c++) {
        const cL = c > 0 ? c - 1 : c;
        const cR = c < cols - 1 ? c + 1 : c;
        const idx = rowOff + c;
        const val =
          (4 * tr[idx] + tr[rUp * cols + c] + tr[rDn * cols + c] + tr[rowOff + cL] + tr[rowOff + cR]) *
          0.125 *
          decay;
        tn[idx] = val < 0.004 ? 0 : val;
      }
    }
    this.trail.set(tn);
  }

  private capAndTurn(a: AnimalEntity, cruise: number, dt: number, turnRate: number): void {
    const cap = cruise * 1.6 + (this.simTime < a.startledUntil ? 300 : 0);
    const spd = Math.hypot(a.vx, a.vy);
    if (spd > cap) {
      a.vx = (a.vx / spd) * cap;
      a.vy = (a.vy / spd) * cap;
    }
    if (spd > 4) {
      a.heading = this.turnToward(a.heading, Math.atan2(a.vy, a.vx), turnRate * dt);
    }
  }

  private turnToward(current: number, target: number, maxStep: number): number {
    let diff = target - current;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    if (Math.abs(diff) <= maxStep) return target;
    return current + Math.sign(diff) * maxStep;
  }

  private shedTrail(x: number, y: number, amount: number): void {
    const mult = Number(this.tuning.trail ?? 1);
    if (mult <= 0) return;
    const c = Math.floor(x / this.cw);
    const r = Math.floor(y / this.ch);
    if (c < 0 || c >= this.cols || r < 0 || r >= this.rows) return;
    const idx = r * this.cols + c;
    this.trail[idx] = Math.min(1.6, this.trail[idx] + amount * mult);
  }

  private stampTrail(x: number, y: number, radiusCells: number, amount: number): void {
    if (amount <= 0) return;
    const cx = Math.floor(x / this.cw);
    const cy = Math.floor(y / this.ch);
    if (radiusCells <= 0) {
      if (cx >= 0 && cx < this.cols && cy >= 0 && cy < this.rows) {
        const idx = cy * this.cols + cx;
        this.trail[idx] = Math.min(1.6, this.trail[idx] + amount);
      }
      return;
    }
    for (let dy = -radiusCells; dy <= radiusCells; dy++) {
      const r = cy + dy;
      if (r < 0 || r >= this.rows) continue;
      for (let dx = -radiusCells; dx <= radiusCells; dx++) {
        const c = cx + dx;
        if (c < 0 || c >= this.cols) continue;
        const d = Math.hypot(dx, dy * 1.4);
        if (d <= radiusCells + 0.3) {
          const falloff = 1 - d / (radiusCells + 0.5);
          const idx = r * this.cols + c;
          this.trail[idx] = Math.min(1.6, this.trail[idx] + amount * falloff);
        }
      }
    }
  }

  private shiftColor(rgb: [number, number, number]): [number, number, number] {
    const hue = Number(this.tuning.hue ?? 0);
    if (!hue) return rgb;
    if (hue !== this.lastHue) {
      this.hueCache.clear();
      this.lastHue = hue;
    }
    const key = (rgb[0] << 16) | (rgb[1] << 8) | rgb[2];
    const cached = this.hueCache.get(key);
    if (cached) return cached;
    const res = rotateHueRgb(rgb, hue);
    this.hueCache.set(key, res);
    return res;
  }

  private paintBackground(): void {
    const bctx = this.bgCtx;
    bctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    bctx.fillStyle = 'rgb(6, 7, 12)';
    bctx.fillRect(0, 0, this.width, this.height);

    const grid = Number(this.tuning.grid ?? 1.05);
    const alpha = clamp(0.055 * grid, 0, 0.35);
    if (alpha > 0.002) {
      bctx.strokeStyle = `rgba(255, 255, 255, ${alpha.toFixed(4)})`;
      bctx.lineWidth = 1;
      bctx.beginPath();
      for (let x = 0; x <= this.width; x += this.cw) {
        bctx.moveTo(x + 0.5, 0);
        bctx.lineTo(x + 0.5, this.height);
      }
      for (let y = 0; y <= this.height; y += this.ch) {
        bctx.moveTo(0, y + 0.5);
        bctx.lineTo(this.width, y + 0.5);
      }
      bctx.stroke();
    }
    this.bgDirty = false;
  }

  private clearCells(): void {
    const cells = this.cells;
    for (let i = 0; i < cells.length; i++) {
      cells[i].state = 0;
      cells[i].isSpot = false;
    }
  }

  private setStrokeCell(col: number, row: number, ch: string, rgb: [number, number, number]): void {
    if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) return;
    const cell = this.cells[row * this.cols + col];
    if (cell.state === 2) return; // solid wins over stroke
    cell.state = 1;
    cell.glyphR = rgb[0];
    cell.glyphG = rgb[1];
    cell.glyphB = rgb[2];
    cell.char = ch;
  }

  private setSolidCell(
    col: number,
    row: number,
    ch: string,
    fill: [number, number, number],
    glyph: [number, number, number],
    isSpot = false,
  ): void {
    if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) return;
    const cell = this.cells[row * this.cols + col];
    cell.state = 2;
    cell.fillR = fill[0];
    cell.fillG = fill[1];
    cell.fillB = fill[2];
    cell.glyphR = glyph[0];
    cell.glyphG = glyph[1];
    cell.glyphB = glyph[2];
    cell.char = ch;
    cell.isSpot = isSpot;
  }

  private drawLineWorld(
    x0: number,
    y0: number,
    x1: number,
    y1: number,
    rgb: [number, number, number],
    fog: number,
    endChar?: string,
  ): void {
    const dist = Math.hypot(x1 - x0, y1 - y0);
    const step = Math.max(2, this.cw * 0.5);
    const steps = Math.max(1, Math.ceil(dist / step));
    const angle = Math.atan2(y1 - y0, x1 - x0);
    const normA = ((angle % Math.PI) + Math.PI) % Math.PI;
    let lineChar = '-';
    if (normA >= Math.PI * 0.125 && normA < Math.PI * 0.375) lineChar = '\\';
    else if (normA >= Math.PI * 0.375 && normA < Math.PI * 0.625) lineChar = '|';
    else if (normA >= Math.PI * 0.625 && normA < Math.PI * 0.875) lineChar = '/';

    const faded = mixRgb(this.shiftColor(rgb), BG_RGB, fog);
    for (let s = 0; s <= steps; s++) {
      const t = s / steps;
      const px = lerp(x0, x1, t);
      const py = lerp(y0, y1, t);
      const col = Math.floor(px / this.cw);
      const row = Math.floor(py / this.ch);
      this.setStrokeCell(col, row, s === steps && endChar ? endChar : lineChar, faded);
    }
  }

  private drawDotWorld(x: number, y: number, ch: string, rgb: [number, number, number], fog: number): void {
    const col = Math.floor(x / this.cw);
    const row = Math.floor(y / this.ch);
    const faded = mixRgb(this.shiftColor(rgb), BG_RGB, fog);
    this.setStrokeCell(col, row, ch, faded);
  }

  private drawSpotWorld(
    x: number,
    y: number,
    fill: [number, number, number],
    glyph: [number, number, number],
    fog: number,
  ): void {
    const col = Math.floor(x / this.cw);
    const row = Math.floor(y / this.ch);
    const f = mixRgb(this.shiftColor(fill), BG_RGB, fog * 0.6);
    const g = mixRgb(this.shiftColor(glyph), BG_RGB, fog * 0.6);
    this.setSolidCell(col, row, '●', f, g, true);
  }

  private drawFrame(): void {
    if (this.bgDirty) {
      this.paintBackground();
    }
    this.clearCells();

    const fogStrength = Number(this.tuning.fog ?? 0.75);
    const shimmerStrength = Number(this.tuning.shimmer ?? 0.3);
    const sparkleRate = Number(this.tuning.sparkle ?? 0.12);
    const flickTick = Math.floor(this.simTime * 6);
    const sparkTick = Math.floor(this.simTime * 2.4);

    // Marine snow for squid
    if (this.species.key === 'squid') {
      for (const f of this.marineSnow) {
        const twinkle = 0.35 + 0.45 * (0.5 + 0.5 * Math.sin(this.simTime * 1.4 + f.phase));
        this.drawDotWorld(f.x, f.y, f.star ? '*' : '.', [255, 176, 214], 1 - twinkle);
      }
    }

    // Food pellets for sea turtles
    if (this.species.key === 'turtles') {
      for (const p of this.pellets) {
        const ageFrac = (this.simTime - p.born) / p.life;
        const fade = ageFrac > 0.7 ? (ageFrac - 0.7) / 0.3 : 0;
        this.drawDotWorld(p.x, p.y, ageFrac > 0.5 ? '.' : 'o', [190, 226, 150], fade);
      }
    }

    // Rasterize each animal from far to near
    for (const a of this.animals) {
      this.rasterizeAnimal(a, fogStrength, shimmerStrength, sparkleRate, flickTick, sparkTick);
    }

    // Copy background onto main canvas
    const ctx = this.ctx;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(this.bgCanvas, 0, 0);
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

    // Draw trail layer (never over solid cells)
    const trailColor = this.shiftColor(this.species.trailColor);
    const sqSize = Math.max(2, Math.round(0.19 * this.cw));
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const idx = r * this.cols + c;
        if (this.cells[idx].state === 2) continue;
        const energy = this.trail[idx];
        if (energy <= 0.02) continue;
        const step = clamp(Math.ceil(clamp(energy, 0, 1) * 6), 1, 6);
        const h = hashInt(idx * 977 + 13);
        const twinkle = 0.75 + 0.25 * Math.sin(5 * this.simTime + h * 40);
        const alpha = (0.85 * step) / 6 * twinkle;
        const sz = energy > 0.6 ? sqSize + 1 : sqSize;
        ctx.fillStyle = `rgba(${trailColor[0]}, ${trailColor[1]}, ${trailColor[2]}, ${alpha.toFixed(3)})`;
        ctx.fillRect(
          Math.round(c * this.cw + this.cw * 0.5 - sz * 0.5),
          Math.round(r * this.ch + this.ch * 0.6 - sz * 0.5),
          sz,
          sz,
        );
      }
    }

    // Draw all non-empty cells
    const fontPx = Math.round(this.ch * 0.74);
    ctx.font = `600 ${fontPx}px ${this.fontFamily}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const halfW = this.cw * 0.5;
    const midY = this.ch * 0.5 + 1;

    for (let r = 0; r < this.rows; r++) {
      const y = r * this.ch;
      for (let c = 0; c < this.cols; c++) {
        const cell = this.cells[r * this.cols + c];
        if (cell.state === 0) continue;
        const x = c * this.cw;
        if (cell.state === 2) {
          ctx.fillStyle = `rgb(${cell.fillR}, ${cell.fillG}, ${cell.fillB})`;
          ctx.fillRect(x + 1, y + 1, this.cw - 1, this.ch - 1);
        }
        ctx.fillStyle = `rgb(${cell.glyphR}, ${cell.glyphG}, ${cell.glyphB})`;
        ctx.fillText(cell.char, x + halfW, y + midY);
      }
    }
  }

  private rasterizeAnimal(
    a: AnimalEntity,
    fogStrength: number,
    shimmerStrength: number,
    sparkleRate: number,
    flickTick: number,
    sparkTick: number,
  ): void {
    let drawHeading = a.heading;
    let drawYOffset = 0;
    let drawScale = 1;
    let extraFog = 0;
    let sideFlip = 1;

    // Species pre-transform adjustments
    let mothOpen = 0.5;
    let rabbitStretch = 0;
    let rabbitAir = 0;
    let turtleSweep = 0;
    let squidSqueeze = 0;
    let squidGlow = 0;
    let owlOpen = 0.8;
    let fishArc = 0;
    let fishFinOpen = 0.42;
    let eagleArm = 1;
    let eagleHand = 1;
    let eagleSweep = 0;

    if (this.species.key === 'moths') {
      drawHeading += 0.06 * Math.sin(a.phase);
      const flap = Math.pow(0.5 + 0.5 * Math.cos(a.phase), 0.8);
      mothOpen = 0.1 + 0.9 * (flap * (1 - a.glideBlend) + 0.96 * a.glideBlend);
    } else if (this.species.key === 'rabbits') {
      const facingLeft = Math.cos(a.heading) < 0;
      sideFlip = facingLeft ? -1 : 1;
      const slope = clamp(Math.sin(a.heading) * 0.35, -0.6, 0.6);
      drawHeading = facingLeft ? -slope : slope;
      const air = Math.sin(Math.PI * (a.phase % 1)) * a.hopAmount;
      rabbitAir = Math.max(0, air);
      drawYOffset = -0.16 * a.span * rabbitAir;
      drawScale = 1 + 0.08 * rabbitAir;
      rabbitStretch = Math.sin(2 * Math.PI * (a.phase % 1) - 0.4) * a.hopAmount;
    } else if (this.species.key === 'turtles') {
      turtleSweep = Math.sin(a.phase);
    } else if (this.species.key === 'squid') {
      if (a.phase < 0.22) {
        squidSqueeze = smoothstep(0, 0.22, a.phase);
      } else {
        squidSqueeze = 1 - smoothstep(0.22, 1, a.phase);
      }
      if (a.phase < 0.16) {
        squidGlow = smoothstep(0, 0.16, a.phase);
      } else {
        squidGlow = Math.exp(-4.5 * (a.phase - 0.16));
      }
      squidGlow *= Number(this.tuning.pulseGlow ?? 1);
    } else if (this.species.key === 'owls') {
      const flap = Math.pow(0.5 + 0.5 * Math.cos(a.phase), 0.8);
      owlOpen = Math.max(0.3, (0.55 + 0.45 * flap) * (1 - 0.5 * a.owlTuck));
    } else if (this.species.key === 'flyingfish') {
      if (a.fishState === 'leap') {
        const s = a.fishProgress;
        fishArc = 4 * s * (1 - s) * a.fishLeapHeight;
        drawScale = 1 + 0.35 * fishArc;
        const submerged = s < 0.1 || s > 0.9;
        extraFog = submerged ? 0.18 : 0;
        fishFinOpen = s >= 0.16 && s <= 0.72 ? 1 : 0.42;
      } else {
        extraFog = 0.22;
        drawHeading += 0.05 * Math.sin(this.simTime * 2 + a.id);
        fishFinOpen = 0.42;
      }
    } else if (this.species.key === 'eagles') {
      const folding = Boolean(this.tuning.foldingFlap);
      if (!folding) {
        const flap = Math.pow(0.5 + 0.5 * Math.cos(a.phase), 0.8);
        eagleArm = eagleHand = Math.max(0.12, 0.25 + 0.75 * (flap * (1 - a.glideBlend) + a.glideBlend));
        eagleSweep = 0;
      } else {
        const cyc = ((a.phase / (Math.PI * 2)) % 1 + 1) % 1;
        if (cyc < 0.6) {
          const t = cyc / 0.6;
          const pose = lerp(0.85, -0.6, t);
          eagleArm = lerp(Math.max(0.35, Math.cos(pose)), 1, a.glideBlend);
          eagleHand = eagleArm;
          eagleSweep = lerp(-0.12 * Math.sin(t * Math.PI), 0, a.glideBlend);
          drawScale = 1 + 0.025 * Math.sin(t * Math.PI) * (1 - a.glideBlend);
        } else {
          const t = (cyc - 0.6) / 0.4;
          const s = Math.sin(t * Math.PI);
          eagleArm = lerp(0.55 + 0.3 * (1 - s), 1, a.glideBlend);
          eagleHand = lerp(0.32 + 0.2 * (1 - s), 1, a.glideBlend);
          eagleSweep = lerp(1.05 * s, 0, a.glideBlend);
        }
      }
    }

    const span = a.span * drawScale;
    const cx = a.x;
    const cy = a.y + drawYOffset;
    const cosH = Math.cos(drawHeading);
    const sinH = Math.sin(drawHeading);
    const extent = this.species.extent * span;

    const minCol = clamp(Math.floor((cx - extent) / this.cw), 0, this.cols - 1);
    const maxCol = clamp(Math.ceil((cx + extent) / this.cw), 0, this.cols - 1);
    const minRow = clamp(Math.floor((cy - extent) / this.ch), 0, this.rows - 1);
    const maxRow = clamp(Math.ceil((cy + extent) / this.ch), 0, this.rows - 1);

    const fog = clamp((1 - a.depth) * fogStrength + extraFog, 0, 0.94);

    const toLocal = (px: number, py: number): [number, number] => {
      const dx = (px - cx) / span;
      const dy = (py - cy) / span;
      const u = (dx * cosH + dy * sinH) * sideFlip;
      const v = -dx * sinH + dy * cosH;
      return [u, v];
    };

    const toWorld = (u: number, v: number): [number, number] => {
      const su = u * sideFlip;
      return [
        cx + (su * cosH - v * sinH) * span,
        cy + (su * sinH + v * cosH) * span,
      ];
    };

    const probe = (u: number, v: number): ShapeHit | false => {
      switch (this.species.key) {
        case 'moths':
          return this.probeMoth(u, v, mothOpen);
        case 'rabbits':
          return this.probeRabbit(u, v, rabbitStretch, rabbitAir, a.alarm);
        case 'turtles':
          return this.probeTurtle(u, v, turtleSweep, Number(this.tuning.flipperBeat ?? 1));
        case 'squid':
          return this.probeSquid(u, v, squidSqueeze, squidGlow, a.id);
        case 'owls':
          return this.probeOwl(u, v, owlOpen);
        case 'flyingfish':
          return this.probeFlyingFish(u, v, fishFinOpen);
        case 'eagles':
          return this.probeEagle(u, v, eagleArm, eagleHand, eagleSweep);
      }
    };

    const subOffsets = [
      [0.25, 0.3],
      [0.75, 0.3],
      [0.25, 0.72],
      [0.75, 0.72],
    ];

    for (let row = minRow; row <= maxRow; row++) {
      const y0 = row * this.ch;
      for (let col = minCol; col <= maxCol; col++) {
        const x0 = col * this.cw;
        const [cu, cv] = toLocal(x0 + this.cw * 0.5, y0 + this.ch * 0.5);
        const centerHit = probe(cu, cv);
        let hits = centerHit ? 1 : 0;
        let sampleHit: ShapeHit | false = centerHit;

        for (let s = 0; s < 4; s++) {
          const [su, sv] = toLocal(x0 + this.cw * subOffsets[s][0], y0 + this.ch * subOffsets[s][1]);
          const h = probe(su, sv);
          if (h) {
            hits++;
            if (!sampleHit) sampleHit = h;
          }
        }

        if (!sampleHit || hits === 0) continue;

        const coverage = hits / 5;
        const baseColor = this.shiftColor(sampleHit.rgb);
        const cellHash = hashInt(a.id * 7919 + Math.round(cu * 48) * 131 + Math.round(cv * 48) * 977);
        const flickHash = hashInt(flickTick * 1297 + col * 73 + row * 199);
        const flick = 1 + (flickHash - 0.5) * 0.06;

        if (!centerHit || coverage < 0.6 || sampleHit.kind === 'Line') {
          const edgeFog = clamp(fog + 0.55 - 0.45 * coverage, 0, 0.96);
          const faded = mixRgb(baseColor, BG_RGB, edgeFog);
          const ramp = sampleHit.kind === 'Line' ? (sampleHit.glyphs ?? '.:+*') : coverage >= 0.5 ? EDGE_RAMP_HI : EDGE_RAMP_LO;
          const ch = ramp[Math.floor(cellHash * ramp.length) % ramp.length];
          this.setStrokeCell(col, row, ch, faded);
          continue;
        }

        // Solid cell
        let fill = mixRgb(baseColor, BG_RGB, fog);
        if (sampleHit.kind === 'Shine') {
          const wave = Math.sin(2.2 * this.simTime + 9 * cu + 6 * cv + 2 * drawHeading);
          const mult = 1 - 0.4 * shimmerStrength + shimmerStrength * wave;
          fill = [
            clamp(Math.round(fill[0] * mult * flick), 0, 255),
            clamp(Math.round(fill[1] * mult * flick), 0, 255),
            clamp(Math.round(fill[2] * mult * flick), 0, 255),
          ];
        } else {
          fill = [
            clamp(Math.round(fill[0] * flick), 0, 255),
            clamp(Math.round(fill[1] * flick), 0, 255),
            clamp(Math.round(fill[2] * flick), 0, 255),
          ];
        }

        let glyphRgb: [number, number, number];
        let glyphs = sampleHit.glyphs;

        switch (sampleHit.kind) {
          case 'Dark':
            glyphRgb = [
              clamp(Math.round(fill[0] * 1.7 + 34), 0, 255),
              clamp(Math.round(fill[1] * 1.7 + 30), 0, 255),
              clamp(Math.round(fill[2] * 1.7 + 30), 0, 255),
            ];
            glyphs = glyphs ?? '#%@';
            break;
          case 'Light':
            glyphRgb = [Math.round(fill[0] * 0.4), Math.round(fill[1] * 0.4), Math.round(fill[2] * 0.4)];
            glyphs = glyphs ?? 'o*';
            break;
          case 'Fur':
            glyphRgb = [
              clamp(Math.round(fill[0] * 1.6 + 44), 0, 255),
              clamp(Math.round(fill[1] * 1.6 + 40), 0, 255),
              clamp(Math.round(fill[2] * 1.6 + 36), 0, 255),
            ];
            glyphs = glyphs ?? '8#@';
            break;
          case 'Soft':
            fill = mixRgb(baseColor, BG_RGB, Math.min(1, 0.62 + 0.38 * fog));
            glyphRgb = mixRgb(baseColor, BG_RGB, fog);
            glyphs = glyphs ?? PLAIN_RAMP;
            break;
          case 'Bright':
            fill = [Math.round(fill[0] * 0.58), Math.round(fill[1] * 0.58), Math.round(fill[2] * 0.58)];
            glyphRgb = [
              clamp(Math.round(baseColor[0] * 1.05 + 50), 0, 255),
              clamp(Math.round(baseColor[1] * 1.05 + 50), 0, 255),
              clamp(Math.round(baseColor[2] * 1.05 + 50), 0, 255),
            ];
            glyphs = glyphs ?? '.:*';
            break;
          case 'Shine':
          case 'Plain':
          default:
            glyphRgb = [Math.round(fill[0] * 0.42), Math.round(fill[1] * 0.42), Math.round(fill[2] * 0.42)];
            glyphs = glyphs ?? PLAIN_RAMP;
            break;
        }

        let char: string;
        if (glyphs === PLAIN_RAMP) {
          const lum = (0.299 * fill[0] + 0.587 * fill[1] + 0.114 * fill[2]) / 255;
          const jitter = Math.round((cellHash - 0.5) * 2);
          const idx = clamp(Math.round((1 - lum) * (PLAIN_RAMP.length - 1)) + jitter, 0, PLAIN_RAMP.length - 1);
          char = PLAIN_RAMP[idx];
        } else {
          char = glyphs[Math.floor(cellHash * glyphs.length) % glyphs.length];
        }

        // Sparkle
        if (
          sparkleRate > 0 &&
          (sampleHit.kind === 'Shine' || sampleHit.kind === 'Plain' || sampleHit.kind === 'Soft' || sampleHit.kind === 'Bright')
        ) {
          const rate = sampleHit.kind === 'Plain' ? sparkleRate / 3 : sparkleRate;
          const sHash = hashInt(sparkTick * 3571 + col * 193 + row * 829);
          if (sHash < rate) {
            const pick = sHash / Math.max(0.001, rate);
            glyphRgb = pick < 0.34 ? [255, 255, 255] : pick < 0.67 ? [210, 232, 255] : [180, 245, 255];
          }
        }

        this.setSolidCell(col, row, char, fill, glyphRgb);
      }
    }

    // Species-specific line/dot/spot overlays
    if (this.species.key === 'moths') {
      for (const s of [-1, 1]) {
        const [x0, y0] = toWorld(0.17, 0.014 * s);
        const [x1, y1] = toWorld(0.36, 0.13 * s + 0.015 * Math.sin(this.simTime * 4 + a.id));
        this.drawLineWorld(x0, y0, x1, y1, [214, 170, 130], fog);
        if (span > 70) {
          for (let b = 1; b <= 3; b++) {
            const t = b * 0.25 + 0.15;
            const bu = lerp(0.17, 0.36, t);
            const bv = lerp(0.014 * s, 0.13 * s, t);
            const [bx0, by0] = toWorld(bu, bv);
            const [bx1, by1] = toWorld(bu + 0.02, bv + 0.035 * s);
            this.drawLineWorld(bx0, by0, bx1, by1, [214, 170, 130], fog);
          }
        }
      }
    } else if (this.species.key === 'rabbits') {
      const [ex, ey] = toWorld(0.2, -0.09);
      this.drawSpotWorld(ex, ey, [242, 210, 198], [26, 20, 22], fog);
      const [px0, py0] = toWorld(0.05, 0.11);
      const [px1, py1] = toWorld(0.11 + 0.06 * rabbitAir, 0.18 - 0.03 * rabbitAir);
      this.drawLineWorld(px0, py0, px1, py1, [238, 184, 166], fog);
    } else if (this.species.key === 'turtles') {
      for (const s of [-1, 1]) {
        const [ex, ey] = toWorld(0.37, 0.045 * s);
        this.drawSpotWorld(ex, ey, [166, 218, 186], [16, 24, 22], fog);
      }
    } else if (this.species.key === 'squid') {
      const armLen = Number(this.tuning.armLength ?? 1);
      for (const s of [-1, 1]) {
        const [ex, ey] = toWorld(-0.055, 0.06 * s);
        this.drawSpotWorld(ex, ey, [255, 196, 226], [18, 10, 20], fog);
      }
      // 8 arms
      for (let i = 0; i < 8; i++) {
        const normI = (i - 3.5) / 3.5;
        const len = 0.42 * armLen * (0.85 + 0.3 * hashInt(i * 97 + a.id));
        let prevX = 0;
        let prevY = 0;
        for (let seg = 0; seg <= 12; seg++) {
          const s = seg / 12;
          const u = -0.08 - s * len;
          const spreadV = normI * 0.06 * (1 - 0.55 * squidSqueeze) * (0.6 + 0.6 * s);
          const wave = 0.035 * Math.sin(a.phase * Math.PI * 2 - 3.5 * s + 1.3 * i) * s;
          const bend = a.turnRate * 0.08 * s * s;
          const [wx, wy] = toWorld(u, spreadV + wave + bend);
          if (seg > 0) {
            this.drawLineWorld(prevX, prevY, wx, wy, [232, 104, 168], clamp(fog + s * 0.35, 0, 0.92));
          }
          prevX = wx;
          prevY = wy;
        }
      }
      // 2 long tentacles
      for (const sSide of [-1, 1]) {
        const len = 0.78 * armLen;
        for (let step = 1; step <= 22; step++) {
          const s = step / 22;
          const u = -0.08 - s * len;
          const v = sSide * (0.045 + 0.02 * s) * (1 - 0.4 * squidSqueeze) + 0.04 * Math.sin(a.phase * Math.PI * 2 - 4 * s + sSide);
          const [wx, wy] = toWorld(u, v + a.turnRate * 0.1 * s * s);
          const ch = step >= 20 ? (step === 21 ? '@' : 'o') : step % 2 === 0 ? ':' : '|';
          const col: [number, number, number] = step >= 20 ? [255, 160, 204] : [232, 104, 168];
          this.drawDotWorld(wx, wy, ch, col, clamp(fog + s * 0.25, 0, 0.92));
        }
      }
    } else if (this.species.key === 'owls') {
      for (const s of [-1, 1]) {
        const [ex, ey] = toWorld(0.135, 0.045 * s);
        this.drawSpotWorld(ex, ey, [250, 186, 58], [16, 12, 8], fog);
        const [tx0, ty0] = toWorld(0.19, 0.06 * s);
        const [tx1, ty1] = toWorld(0.26, 0.065 * s);
        this.drawLineWorld(tx0, ty0, tx1, ty1, [168, 134, 96], fog, '^');
      }
      const [bx, by] = toWorld(0.16, 0);
      this.drawDotWorld(bx, by, 'v', [180, 136, 72], fog);
    } else if (this.species.key === 'flyingfish') {
      for (const s of [-1, 1]) {
        const [ex, ey] = toWorld(0.24, 0.032 * s);
        this.drawSpotWorld(ex, ey, [220, 248, 248], [14, 24, 30], fog);
      }
    } else if (this.species.key === 'eagles') {
      const eyeV = Math.max(0.026, this.cw / span);
      for (const s of [-1, 1]) {
        const [ex, ey] = toWorld(0.225, eyeV * s);
        if (span > 45) {
          this.drawSpotWorld(ex, ey, [242, 198, 72], [18, 16, 14], fog);
        }
        const [tx0, ty0] = toWorld(-0.14, 0.035 * s);
        const [tx1, ty1] = toWorld(-0.23, 0.045 * s);
        this.drawLineWorld(tx0, ty0, tx1, ty1, [240, 190, 70], fog);
      }
      const [bx, by] = toWorld(0.295, 0);
      this.drawDotWorld(bx, by, '@', [240, 190, 70], fog);
      const [bx2, by2] = toWorld(0.315, 0);
      this.drawDotWorld(bx2, by2, 'v', [240, 190, 70], fog);
    }
  }

  private probeMoth(u: number, v: number, opening: number): ShapeHit | false {
    const av = Math.abs(v);
    // Body
    if ((u - 0.15) * (u - 0.15) + v * v <= 0.04 * 0.04) {
      return { rgb: [112, 70, 50], kind: 'Fur', glyphs: '%#8' };
    }
    if (u >= -0.04 && u <= 0.11 && av <= 0.05) {
      return { rgb: [112, 70, 50], kind: 'Fur', glyphs: '%#8' };
    }
    if (u < -0.04 && u >= -0.34) {
      const t = (-0.04 - u) / 0.3;
      const hw = lerp(0.046, 0.016, t);
      if (av <= hw) {
        const band = Math.floor(t * 22) % 2 === 0;
        return { rgb: band ? [70, 42, 32] : [150, 98, 72], kind: 'Fur', glyphs: '%#8' };
      }
    }

    // Wings
    const lv = av / Math.max(0.08, opening);
    const light = 0.6 + 0.4 * opening;
    const shade = (rgb: [number, number, number]): [number, number, number] => [
      Math.round(rgb[0] * light),
      Math.round(rgb[1] * light),
      Math.round(rgb[2] * light),
    ];

    // Forewing
    const fwAng = Math.atan2(u - 0.05, lv);
    const fwMax = evalPolarLobe(fwAng, -0.78, 0.46, 0.64, 0.7, 0.3);
    const fwDist = Math.hypot(u - 0.05, lv);
    if (fwMax > 0 && fwDist <= fwMax) {
      const r = fwDist / fwMax;
      if (r > 0.86) {
        if (Math.sin(fwAng * 22) > 0.65) return { rgb: shade([252, 230, 204]), kind: 'Light' };
        return { rgb: shade([84, 46, 32]), kind: 'Dark' };
      }
      if (r < 0.1) return { rgb: shade([120, 72, 50]), kind: 'Dark' };
      if (Math.abs(r - (0.5 + 0.04 * Math.sin(fwAng * 14))) < 0.06) {
        return { rgb: shade([150, 88, 60]), kind: 'Dark' };
      }
      return {
        rgb: shade([Math.round(200 + 48 * r), Math.round(132 + 46 * r), Math.round(96 + 40 * r)]),
        kind: 'Shine',
      };
    }

    // Hindwing
    const hwAng = Math.atan2(u + 0.05, lv);
    const hwMax = evalPolarLobe(hwAng, -1.55, -0.3, 0.38, 0.5, 0.55, 6, 0.08);
    const hwDist = Math.hypot(u + 0.05, lv);
    if (hwMax > 0 && hwDist <= hwMax) {
      const r = hwDist / hwMax;
      if (r > 0.86) return { rgb: shade([84, 46, 32]), kind: 'Dark' };
      if (r < 0.1) return { rgb: shade([120, 72, 50]), kind: 'Dark' };
      if (Math.abs(r - 0.55) < 0.11 && Math.abs(hwAng + 0.92) < 0.18) {
        return { rgb: shade([64, 34, 24]), kind: 'Dark', glyphs: '@' };
      }
      return {
        rgb: shade([Math.round(194 + 44 * r), Math.round(124 + 42 * r), Math.round(88 + 38 * r)]),
        kind: 'Shine',
      };
    }

    return false;
  }

  private probeRabbit(u: number, v: number, stretch: number, air: number, alarm: number): ShapeHit | false {
    // Cotton tail
    const tu = u + 0.28 + 0.03 * stretch;
    const tv = v + 0.01;
    if (tu * tu + tv * tv <= 0.048 * 0.048) {
      return { rgb: [255, 250, 246], kind: 'Light', glyphs: '*@' };
    }

    // Ears
    const earTilt = 0.35 + 0.35 * air + 0.25 * alarm;
    for (let e = 0; e < 2; e++) {
      const eu = e === 0 ? 0.13 : 0.105;
      const ev = e === 0 ? -0.12 : -0.11;
      const du = u - eu;
      const dv = v - ev;
      const ang = -Math.PI * 0.5 - earTilt - e * 0.12;
      const along = du * Math.cos(ang) + dv * Math.sin(ang);
      const perp = -du * Math.sin(ang) + dv * Math.cos(ang);
      if (along >= 0 && along <= 0.24) {
        const w = 0.034 * Math.sin((along / 0.24) * Math.PI * 0.88 + 0.2);
        if (Math.abs(perp) <= w) {
          if (e === 0 && Math.abs(perp) < w * 0.45 && along > 0.04 && along < 0.19) {
            return { rgb: [244, 150, 156], kind: 'Light' };
          }
          const mult = e === 1 ? 0.82 : 1;
          return {
            rgb: [Math.round(248 * mult), Math.round(199 * mult), Math.round(181 * mult)],
            kind: 'Fur',
            glyphs: '%8',
          };
        }
      }
    }

    // Head
    const hu = (u - 0.17) / 0.09;
    const hv = (v + 0.07) / 0.072;
    if (hu * hu + hv * hv <= 1) {
      if (hu > 0.72 && Math.abs(hv) < 0.35) {
        return { rgb: [244, 150, 156], kind: 'Light' };
      }
      return { rgb: [248, 199, 181], kind: 'Fur', glyphs: '%8' };
    }

    // Body + haunch
    const bu = (u + 0.05) / (0.2 + 0.035 * Math.max(0, stretch));
    const bv = (v - 0.02) / 0.125;
    const haunch = Math.hypot(u + 0.15 + 0.02 * stretch, v - 0.05) <= 0.12;
    if (bu * bu + bv * bv <= 1 || haunch) {
      if (v > 0.08) return { rgb: [206, 150, 132], kind: 'Fur', glyphs: '%8' };
      return { rgb: [248, 199, 181], kind: 'Fur', glyphs: '%8' };
    }

    // Hind foot along ground
    const fu = (u + 0.18 + 0.07 * stretch) / 0.095;
    const fv = (v - 0.15) / 0.032;
    if (fu * fu + fv * fv <= 1) {
      return { rgb: [228, 174, 156], kind: 'Fur', glyphs: '%8' };
    }

    return false;
  }

  private probeTurtle(u: number, v: number, sweep: number, beat: number): ShapeHit | false {
    const av = Math.abs(v);
    // Shell
    const su = (u + 0.02) / 0.28;
    const sv = v / 0.22;
    const sr2 = su * su + sv * sv;
    if (sr2 <= 1) {
      const sr = Math.sqrt(sr2);
      if (sr > 0.83) return { rgb: [74, 132, 100], kind: 'Dark', glyphs: '=' };
      const absSv = Math.abs(sv);
      if (Math.abs(absSv - 0.34) < 0.045) return { rgb: [40, 84, 62], kind: 'Dark', glyphs: '=' };
      const freq = absSv < 0.34 ? 1.7 : 1.4;
      if (Math.abs(((su * freq + 2) % 1) - 0.5) < 0.06) {
        return { rgb: [40, 84, 62], kind: 'Dark', glyphs: '=' };
      }
      const bright = 0.86 + 0.32 * (1 - sr);
      return {
        rgb: [
          clamp(Math.round(109 * bright), 0, 255),
          clamp(Math.round(176 * bright), 0, 255),
          clamp(Math.round(138 * bright), 0, 255),
        ],
        kind: 'Shine',
      };
    }

    // Head & neck
    const hu = (u - 0.33) / 0.085;
    const hv = v / 0.07;
    if (hu * hu + hv * hv <= 1 || (u >= 0.21 && u <= 0.28 && av <= 0.055)) {
      return { rgb: [142, 200, 164], kind: 'Plain' };
    }

    // Front flippers
    const fAng = 1.25 - 0.6 * sweep * clamp(beat, 0.5, 1.5);
    const fdu = u - 0.12;
    const fdv = av - 0.17;
    const fAlong = fdu * Math.cos(fAng) + fdv * Math.sin(fAng);
    const fPerp = -fdu * Math.sin(fAng) + fdv * Math.cos(fAng);
    if (fAlong >= 0 && fAlong <= 0.24) {
      const w = 0.055 * (1 - 0.72 * (fAlong / 0.24));
      if (Math.abs(fPerp) <= w) return { rgb: [96, 166, 134], kind: 'Plain' };
    }

    // Rear flippers
    const rAng = 2.5 + 0.28 * Math.sin(Math.asin(clamp(sweep, -1, 1)) + 1.4);
    const rdu = u + 0.2;
    const rdv = av - 0.13;
    const rAlong = rdu * Math.cos(rAng) + rdv * Math.sin(rAng);
    const rPerp = -rdu * Math.sin(rAng) + rdv * Math.cos(rAng);
    if (rAlong >= 0 && rAlong <= 0.11) {
      const w = 0.04 * (1 - 0.65 * (rAlong / 0.11));
      if (Math.abs(rPerp) <= w) return { rgb: [86, 150, 120], kind: 'Plain' };
    }

    // Small tail
    if (u < -0.28 && u >= -0.35 && av <= 0.025 * (1 - (-0.28 - u) / 0.07)) {
      return { rgb: [96, 166, 134], kind: 'Plain' };
    }

    return false;
  }

  private probeSquid(u: number, v: number, squeeze: number, glow: number, id: number): ShapeHit | false {
    const av = Math.abs(v);
    // Fins along rear/top 38% of mantle (u from 0.31 to 0.52)
    if (u >= 0.3 && u <= 0.52) {
      const s = (u - 0.3) / 0.22;
      const finW = 0.1 * (1 - 0.16 * squeeze) + 0.11 * Math.sin(s * Math.PI);
      if (av <= finW && av >= 0.04) {
        return { rgb: [248, 152, 198], kind: 'Soft' };
      }
    }

    // Mantle
    if (u >= -0.02 && u <= 0.52) {
      const s = clamp((u + 0.02) / 0.54, 0, 1);
      const hw = 0.1 * (1 - 0.16 * squeeze) * Math.sqrt(Math.max(0, 1 - Math.pow(s, 2.4)));
      if (av <= hw) {
        if (av > hw * 0.8) return { rgb: [255, 200, 226], kind: 'Bright', glyphs: ':;' };
        if (av < 0.015) return { rgb: [255, 200, 226], kind: 'Bright', glyphs: '|' };
        const specTick = Math.floor(this.simTime * 2);
        const sHash = hashInt(id * 313 + specTick * 71 + Math.round(u * 35) * 41 + Math.round(v * 35) * 89);
        if (sHash < 0.14) return { rgb: [150, 40, 96], kind: 'Dark', glyphs: '%#' };
        const bright = 0.88 + 0.24 * (1 - av / Math.max(0.01, hw));
        return {
          rgb: [
            clamp(Math.round(232 * bright), 0, 255),
            clamp(Math.round(106 * bright), 0, 255),
            clamp(Math.round(160 * bright), 0, 255),
          ],
          kind: 'Shine',
        };
      }
      // Pulse glow halo
      if (glow > 0.06 && av <= hw + 0.045 * glow) {
        return {
          rgb: [
            clamp(Math.round(255 * Math.min(1, glow)), 0, 255),
            clamp(Math.round(140 * Math.min(1, glow)), 0, 255),
            clamp(Math.round(204 * Math.min(1, glow)), 0, 255),
          ],
          kind: 'Line',
          glyphs: '.',
        };
      }
    }

    // Head ellipse
    const hu = (u + 0.06) / 0.065;
    const hv = v / 0.07;
    if (hu * hu + hv * hv <= 1) {
      return { rgb: [224, 96, 152], kind: 'Plain' };
    }

    return false;
  }

  private probeOwl(u: number, v: number, opening: number): ShapeHit | false {
    const av = Math.abs(v);
    // Face disc
    const fd = Math.hypot(u - 0.13, v);
    if (fd <= 0.1) {
      if (fd > 0.078) return { rgb: [128, 100, 70], kind: 'Dark' };
      return { rgb: [244, 232, 206], kind: 'Plain' };
    }

    // Body ellipse
    const bu = (u + 0.06) / 0.16;
    const bv = v / 0.085;
    if (bu * bu + bv * bv <= 1) {
      if (Math.abs(((u * 14 + av * 8 + 4) % 1) - 0.5) < 0.12) {
        return { rgb: [150, 118, 82], kind: 'Dark', glyphs: 'v' };
      }
      return { rgb: [217, 195, 160], kind: 'Fur', glyphs: '%8' };
    }

    // Barred tail
    if (u <= -0.18 && u >= -0.34) {
      const t = (-0.18 - u) / 0.16;
      const hw = lerp(0.055, 0.08, t);
      if (av <= hw) {
        const bar = Math.floor(t * 5) % 2 === 1;
        return { rgb: bar ? [150, 118, 82] : [217, 195, 160], kind: bar ? 'Dark' : 'Plain' };
      }
    }

    // Wings
    const wingSpan = 0.5 * opening;
    if (av >= 0.06 && av <= 0.06 + wingSpan) {
      const s = (av - 0.06) / wingSpan;
      const lead = 0.12 - 0.04 * s - 0.06 * s * s;
      const trail = -0.18 + 0.08 * s + 0.015 * Math.cos(s * Math.PI * 10);
      let top = lead;
      let bot = trail;
      if (s > 0.8) {
        const tipT = (s - 0.8) / 0.2;
        const round = Math.sqrt(Math.max(0, 1 - tipT * tipT));
        const mid = (lead + trail) * 0.5;
        top = mid + (lead - mid) * round;
        bot = mid + (trail - mid) * round;
        // 5 slotted finger feathers
        const slot = ((u - bot) / Math.max(0.01, top - bot)) * 5;
        if (tipT > 0.35 && slot - Math.floor(slot) > 0.72) return false;
      }
      if (u <= top && u >= bot) {
        const chordFrac = (u - bot) / Math.max(0.01, top - bot);
        if (chordFrac > 0.65 && s < 0.7) return { rgb: [238, 220, 184], kind: 'Plain' };
        if (Math.abs(((s * 6 + chordFrac * 2) % 1) - 0.5) < 0.1 && chordFrac < 0.55) {
          return { rgb: [150, 118, 82], kind: 'Dark' };
        }
        const bright = 0.92 + 0.14 * chordFrac;
        return {
          rgb: [
            clamp(Math.round(217 * bright), 0, 255),
            clamp(Math.round(195 * bright), 0, 255),
            clamp(Math.round(160 * bright), 0, 255),
          ],
          kind: 'Plain',
        };
      }
    }

    return false;
  }

  private probeFlyingFish(u: number, v: number, finOpen: number): ShapeHit | false {
    const av = Math.abs(v);
    // Body
    if (u >= -0.3 && u <= 0.32) {
      const s = (u + 0.3) / 0.62;
      const hw = 0.082 * Math.pow(Math.sin(s * Math.PI), 0.65);
      if (av <= hw) {
        if (v < -hw * 0.35) return { rgb: [62, 150, 150], kind: 'Dark', glyphs: '=:' };
        if (v > hw * 0.45) return { rgb: [224, 250, 246], kind: 'Light', glyphs: 'o.' };
        return { rgb: [133, 227, 221], kind: 'Shine' };
      }
    }

    // Forked tail (lower lobe 15% longer)
    if (u < -0.28 && u >= -0.46) {
      const t = (-0.28 - u) / 0.18;
      const spreadV = 0.02 + 0.13 * t;
      const isLower = v > 0;
      const limit = isLower ? spreadV * 1.15 : spreadV;
      if (av >= spreadV * 0.45 && av <= limit) {
        return { rgb: [120, 210, 212], kind: 'Soft' };
      }
    }

    // Pectoral wing fins
    const lv = av / Math.max(0.2, finOpen);
    const pAng = Math.atan2(u - 0.12, lv);
    const pMax = evalPolarLobe(pAng, -1.2, -0.12, 0.46, 0.36, 0.45, 7, 0.06);
    const pDist = Math.hypot(u - 0.12, lv);
    if (pMax > 0 && pDist <= pMax) {
      const sweepFrac = (pAng + 1.2) / 1.08;
      if (Math.abs(((sweepFrac * 8) % 1) - 0.5) < 0.07) {
        return { rgb: [92, 190, 186], kind: 'Line' };
      }
      return { rgb: [160, 238, 232], kind: 'Soft', glyphs: '.:' };
    }

    // Pelvic fins
    const vAng = Math.atan2(u + 0.1, lv);
    const vMax = evalPolarLobe(vAng, -1.3, -0.25, 0.2, 0.4, 0.5);
    if (vMax > 0 && Math.hypot(u + 0.1, lv) <= vMax) {
      return { rgb: [160, 238, 232], kind: 'Soft', glyphs: '.:' };
    }

    return false;
  }

  private probeEagle(u: number, v: number, arm: number, hand: number, sweep: number): ShapeHit | false {
    const av = Math.abs(v);
    const light = 0.82 + 0.18 * arm;
    const shade = (rgb: [number, number, number]): [number, number, number] => [
      clamp(Math.round(rgb[0] * light), 0, 255),
      clamp(Math.round(rgb[1] * light), 0, 255),
      clamp(Math.round(rgb[2] * light), 0, 255),
    ];

    // White head
    const hu = (u - 0.215) / 0.075;
    const hv = v / 0.048;
    if (hu * hu + hv * hv <= 1) {
      return { rgb: [252, 252, 255], kind: 'Light', glyphs: 'o.' };
    }

    // Body ellipse
    const bu = u / 0.17;
    const bv = v / 0.062;
    if (bu * bu + bv * bv <= 1) {
      if (Math.abs(((u * 12 + av * 6 + 4) % 1) - 0.5) < 0.09) {
        return { rgb: shade([196, 200, 214]), kind: 'Plain', glyphs: 'v' };
      }
      return { rgb: shade([238, 240, 248]), kind: 'Plain' };
    }

    // White fan tail
    if (u <= -0.14 && u >= -0.38) {
      const t = (-0.14 - u) / 0.24;
      const hw = lerp(0.045, 0.12, t);
      if (av <= hw) {
        if (t > 0.88 && Math.sin(v * 70) > 0.4) return false;
        return { rgb: shade([242, 244, 250]), kind: 'Plain' };
      }
    }

    // Wings: inner arm (0.05..0.25) and outer hand (0.25..0.54)
    const wristV = 0.05 + 0.2 * arm;
    const tipV = wristV + 0.29 * hand;
    if (av >= 0.05 && av <= tipV) {
      let localS = 0;
      let wingU = u;
      if (av <= wristV) {
        localS = ((av - 0.05) / Math.max(0.01, wristV - 0.05)) * 0.41;
      } else {
        const handDist = av - wristV;
        const handMax = Math.max(0.01, tipV - wristV);
        const frac = handDist / handMax;
        localS = 0.41 + frac * 0.59;
        wingU = u + Math.tan(sweep) * handDist * 0.45;
      }

      const lead = 0.13 + 0.02 * localS - 0.07 * localS * localS;
      let trail = -0.115 + 0.025 * localS;
      if (localS < 0.74) {
        trail += 0.012 * Math.cos(localS * Math.PI * 16);
      }

      let top = lead;
      let bot = trail;
      if (localS > 0.7) {
        const tipT = (localS - 0.7) / 0.3;
        const round = Math.sqrt(Math.max(0, 1 - tipT * tipT));
        const mid = (lead + trail) * 0.5;
        top = mid + (lead - mid) * round;
        bot = mid + (trail - mid) * round;
        const slot = ((wingU - bot) / Math.max(0.01, top - bot)) * 6;
        if (tipT > 0.28 && slot - Math.floor(slot) > 0.7) return false;
      }

      if (wingU <= top && wingU >= bot) {
        const chordFrac = (wingU - bot) / Math.max(0.01, top - bot);
        if (localS > 0.7) return { rgb: shade([112, 120, 144]), kind: 'Dark' };
        if (chordFrac < 0.45) return { rgb: shade([150, 158, 180]), kind: 'Dark', glyphs: '=#' };
        return { rgb: shade([236, 238, 246]), kind: 'Plain' };
      }
    }

    return false;
  }
}
