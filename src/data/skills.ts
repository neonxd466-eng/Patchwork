import { PlanTier, SkillId } from '../utils/tiers';

export interface SkillSpec {
  id: SkillId;
  name: string;
  elementSymbol: string;
  atomicNumber: number;
  filename: string;
  downloadPath: string;
  tier: PlanTier;
  tierLabel: string;
  tagline: string;
  summary: string;
  compatibility: string;
  workflowSteps: { title: string; detail: string; command?: string }[];
  outputs: string[];
  gotchas: string[];
  sampleRecipe: string;
  rawMarkdown: string;
}

export const SKILLS: SkillSpec[] = [
  {
    id: 'hydrogen',
    name: 'Hydrogen',
    elementSymbol: 'H',
    atomicNumber: 1,
    filename: 'hydrogen.md',
    downloadPath: '/skills/hydrogen.md',
    tier: 'free',
    tierLabel: 'Free',
    tagline: 'Visual edit breakdown & style transfer recipe',
    summary:
      'Reverse engineer the motion graphics, visual effects, pacing, and editing styles from any reference video by eye, then output a reusable recipe or reproducible FFmpeg, Remotion, or editor instructions.',
    compatibility: 'Works natively in Gemini, Claude, ChatGPT, and any multimodal LLM — zero local dependencies required.',
    workflowSteps: [
      {
        title: 'Inspect the reference',
        detail:
          'Break down structure and pacing, transitions, motion graphics, kinetic typography, camera movement, color grading, and audio sync cues.',
      },
      {
        title: 'Map edits to a reusable recipe',
        detail:
          'Translate visual observations into concrete parameters: timing, beat intervals, easing curves, layer hierarchy, and typography scale.',
      },
      {
        title: 'Clarify target media',
        detail:
          'Inspect what footage or animation code the user has available and align aspect ratio, duration, and asset paths.',
      },
      {
        title: 'Apply or generate the edit',
        detail:
          'Produce reproducible FFmpeg, Remotion, Python, or shader code—or step-by-step NLE instructions matched to Premiere, Resolve, or Final Cut.',
      },
      {
        title: 'Verify against the reference',
        detail:
          'Compare rendered timing, motion feel, and graphic placement against the reference breakdown and iterate.',
      },
    ],
    outputs: ['Compact edit recipe table', 'FFmpeg / Remotion / CSS motion code', 'NLE timeline instructions'],
    gotchas: [
      'Never invents exact frame numbers, plugin names, or hidden source assets that cannot be observed.',
      'Keeps changes focused strictly on transferring the reference style without altering unrelated target content.',
      'Makes resolution, aspect ratio, duration, and asset paths explicit for adaptation.',
    ],
    sampleRecipe: `| Segment | Duration | Transition | Motion & Typography | Audio Cue |
|---|---|---|---|---|
| 01 · Hook | 0.00s – 1.40s | Hard cut on snare | Center bold sans, 108% punch-in | Kick + riser |
| 02 · Proof | 1.40s – 3.10s | 6-frame whip left | Lower-third slide-up, 180ms ease-out | Snare hit |
| 03 · Payoff | 3.10s – 5.20s | Flash dissolve | Warm halation grade + subtle handheld | Beat drop |`,
    rawMarkdown: `---
name: hydrogen
description: Reverse engineer motion graphics, visual effects, pacing, and editing styles from a reference video and apply them to a target video, scene, or code/animation workflow. Use this skill whenever the user shares a reference video and wants to inspect, break down, copy, recreate, or adapt its edits, transitions, motion graphics, kinetic typography, camera moves, color grading, or rhythm onto another clip or project, even if they just say "make mine look like this" or "how did they do this effect?"
---

# Hydrogen

Reverse engineer the motion graphics, visual edits, and pacing of a reference video, then recreate or adapt them on the user's target video or project.

## When to use

- The user shares a reference video and asks to inspect, reverse engineer, break down, or copy its edits, motion graphics, transitions, or visual style.
- The user wants edits or motion graphics seen in a reference applied to their own video, clip, or animation code.
- The user wants a motion graphic style or edit sequence recreated using inspection tools, video/media tools, or code.

## Workflow

### 1. Inspect the reference

Break down the reference's structure: pacing, cuts, transitions, motion graphics, kinetic text, camera movement, sound/rhythm cues, and color or lighting shifts. When inspection or video tools are available, look closely at specific moments (extract frames, check durations) rather than guessing.

Cover at least:
- **Structure and pacing**: total length, shot count, average shot length, beat or rhythm pattern
- **Transitions**: type (hard cut, whip, zoom, mask, glitch, dissolve), timing, and what triggers them
- **Motion graphics and typography**: fonts or font style, size hierarchy, placement, entrance and exit behavior
- **Camera and motion**: pans, zooms, shake, parallax, speed ramps
- **Color and lighting**: grade, contrast, flashes, overlays, grain
- **Audio sync**: whether cuts or graphics land on beats or sound hits

### 2. Map edits to a reusable recipe

Translate observations into concrete, transferable parameters: timing and beat structure, easing or motion behavior, graphic placement, layer hierarchy, and visual styling. Present the recipe as a compact table or list so the user can review it before anything is built.

### 3. Clarify target media

Check whether the user provided a target video or clip. If the request needs a specific user clip and none was given, ask for it, or explain how the recipe applies to what they do have.

### 4. Apply or generate the edit

Use available editing, video generation, or code tools to apply the recipe to the target or to build the matching motion graphics. If direct video editing isn't possible, provide reproducible code (FFmpeg, Remotion, Python, motion or shader code) or step-by-step editing instructions matched to the user's setup.

### 5. Verify against the reference

Compare the result with the reference breakdown for timing, motion feel, graphic placement, and any requested changes. Iterate if anything is off.

## Gotchas

- Don't invent exact frame numbers, plugin names, or hidden source assets that can't be observed. State what is visually evident and label approximations clearly.
- Keep changes focused on transferring the reference style. Don't alter unrelated parts of the target unless asked.
- When replicating with code, make resolution, aspect ratio, duration, and asset paths explicit and easy to adapt.`,
  },
  {
    id: 'carbon',
    name: 'Carbon',
    elementSymbol: 'C',
    atomicNumber: 6,
    filename: 'carbon.md',
    downloadPath: '/skills/carbon.md',
    tier: 'pro',
    tierLabel: 'Pro',
    tagline: 'Measured shot cuts, BPM onsets & JSON edit retiming',
    summary:
      'Carbon adds deterministic measurement to Hydrogen. Runs Python and FFmpeg scripts to extract every cut, shot duration, average color, and audio beat onset into an editable JSON recipe, then retimes target clips to match.',
    compatibility: 'Requires ffmpeg, ffprobe, Python 3, and numpy (runs in Claude Code, ChatGPT Code Interpreter, Cursor, or local CLI).',
    workflowSteps: [
      {
        title: 'Measure the reference',
        detail:
          'Detect hard cuts, extract one frame per shot into frames/, and compute audio onsets and BPM into analysis.json.',
        command: 'python scripts/analyze_video.py REF.mp4 /home/claude/ref_analysis',
      },
      {
        title: 'Inspect extracted frames visually',
        detail:
          'Review shot keyframes and extract extra transition frames with ffmpeg to verify whip pans, dissolves, and typography.',
      },
      {
        title: 'Write the JSON recipe',
        detail:
          'Combine script measurements with visual judgment, explicitly tagging every parameter as measured or estimated.',
      },
      {
        title: 'Retime the target clip',
        detail:
          'Cut and loop target footage to match the reference shot durations and optionally snap cuts to nearby audio beats.',
        command: 'python scripts/retime_to_reference.py TARGET.mp4 analysis.json OUT.mp4 --snap-beats',
      },
      {
        title: 'Verify cut rhythm',
        detail:
          'Re-run analyze_video.py on the output file to confirm shot count, average shot length, and cut timestamps align.',
      },
    ],
    outputs: ['analysis.json (cuts, colors, BPM)', 'Extracted per-shot frames/', 'Retimed MP4 matched to reference rhythm'],
    gotchas: [
      'Tune --scene-threshold (0.15 for fast edits, higher for strobes/flashes) when cut counts look off.',
      'BPM and beat onsets are rough energy estimates; unreliable on ambient music or silent footage.',
      'retime_to_reference.py transfers pacing only—layer transitions, typography, and grading afterward.',
    ],
    sampleRecipe: `{
  "source": "reference_reel.mp4",
  "bpm_estimated": 124.0,
  "avg_shot_sec": 0.84,
  "shots": [
    { "index": 1, "start": 0.00, "end": 0.96, "avg_rgb": [24, 28, 36], "beat_snap": "measured" },
    { "index": 2, "start": 0.96, "end": 1.45, "avg_rgb": [212, 184, 150], "beat_snap": "measured" },
    { "index": 3, "start": 1.45, "end": 2.41, "transition": "whip_left", "origin": "estimated" }
  ]
}`,
    rawMarkdown: `---
name: carbon
description: Measure and reverse engineer a reference video's editing style, then rebuild it on a target video or in code. Goes beyond visual inspection by measuring shot cuts, pacing, audio beats, and color with bundled scripts, producing a reusable JSON edit recipe, and retiming a target clip to match the reference rhythm. Use this skill whenever the user shares a reference video and wants to copy, match, or adapt its cuts, pacing, beat sync, transitions, motion graphics, kinetic text, camera moves, or color grade onto another clip or project, or asks for exact shot lengths, cut timings, BPM, or a reusable edit template, even if they only say "edit mine like this" or "match the rhythm of this video."
compatibility: Scripts need ffmpeg, ffprobe, Python 3, and numpy.
---

# Carbon

Carbon is Hydrogen plus measurement. Where Hydrogen inspects a reference by eye, Carbon runs scripts to get real numbers (cuts, shot lengths, audio beats, color), saves them as a reusable recipe, and can retime a target video to the reference rhythm.

## When to use

- The user shares a reference video and wants its edit style copied or adapted onto a target clip, scene, or animation code.
- The user wants exact pacing: shot lengths, cut times, BPM, whether cuts land on beats.
- The user wants a reusable "edit template" or recipe from a video.

## Workflow

### 1. Measure the reference

Run the analyzer (find the uploaded video under \`/mnt/user-data/uploads\`):

\`\`\`bash
python scripts/analyze_video.py REF.mp4 /home/claude/ref_analysis
\`\`\`

This writes \`analysis.json\` (metadata, every shot with start/end/length and average color, audio onsets, rough BPM) plus one frame per shot in \`frames/\`.

- Check the output makes sense: if shot count looks too low for a fast edit, rerun with \`--scene-threshold 0.15\`; if it looks too high (flashes, strobes), raise it.
- Hard cuts are detected reliably. Dissolves, whip pans, and motion-blur transitions may be missed or merged, so confirm them visually.

### 2. Inspect visually

Use \`view\` on the extracted frames, and extract extra frames around transitions or text moments with ffmpeg when you need detail. Look at typography, graphic placement, camera movement, layering, and grading. The scripts cannot see these; this part is judgment.

### 3. Write the recipe

Combine measurements and observations into a JSON recipe following \`references/recipe-schema.md\`. Label each value \`measured\` or \`estimated\`. Show the user a short summary table before building anything.

### 4. Check the target

If the task needs the user's own clip and none was provided, ask for it. If they only want the recipe or a code scaffold, skip ahead.

### 5. Apply

Pick the lightest tool that does the job:

- **Match pacing on a target clip:**
  \`\`\`bash
  python scripts/retime_to_reference.py TARGET.mp4 /home/claude/ref_analysis/analysis.json OUT.mp4 [--snap-beats] [--width W --height H]
  \`\`\`
  This cuts the target into segments that follow the reference's shot lengths (loops the target if it runs out) and optionally snaps cuts to nearby audio onsets. Output has no audio; add the user's track afterward.
- **Transitions, zooms, text, grading:** build FFmpeg filter chains or Remotion/Python code using the mapping table in \`references/recipe-schema.md\`.
- **No video tools available to the user:** give reproducible code or step-by-step editor instructions instead.

### 6. Verify

Run \`analyze_video.py\` on the output and compare its shot count, average shot length, and cut times with the reference recipe. Check frames visually for placement and look. Iterate on any mismatch, and report which differences remain.

## Gotchas

- Don't invent frame numbers, plugin names, fonts, or hidden assets. State what is visible and mark approximations.
- BPM and beat onsets are rough estimates from audio energy. They are unreliable on music with weak percussion or on videos with no audio.
- The retime script changes timing only. It doesn't recreate transitions, text, or grading; layer those on afterward.
- Keep changes focused on transferring the reference style. Don't alter unrelated parts of the target unless asked.
- Make resolution, aspect ratio, fps, duration, and file paths explicit so the user can adapt the result.`,
  },
  {
    id: 'argon',
    name: 'Argon',
    elementSymbol: 'Ar',
    atomicNumber: 18,
    filename: 'argon.md',
    downloadPath: '/skills/argon.md',
    tier: 'max',
    tierLabel: 'Max',
    tagline: 'End-to-end automated manifest, subject framing & alpha NLE pass',
    summary:
      'Studio-grade reverse engineering of viral edits. Builds a declarative manifest from reference camera zoom/pan/shake and transitions, tracks your target subject, snaps cuts to target beats and speech pauses, renders composited video or a ProRes alpha graphics pass, and runs automated multi-pass visual QA.',
    compatibility: 'Requires ffmpeg, ffprobe, Python 3, numpy, opencv-python (cv2), and Pillow. Runs offline with zero network calls.',
    workflowSteps: [
      {
        title: 'Measure the reference',
        detail:
          'Capture shot cuts, camera zoom/pan/shake, transition widths, audio beats, and grade into ref_analysis.json.',
        command: 'python scripts/analyze_reference.py REF.mp4 /home/claude/ref --scene-threshold 0.3',
      },
      {
        title: 'Build & refine the manifest',
        detail:
          'Generate manifest.json and refine transition types (whip, slideleft), easing, caption styling, glow, and vignette.',
        command: 'python scripts/build_manifest.py ref_analysis.json manifest.json --captions "LINE ONE|LINE TWO"',
      },
      {
        title: 'Analyze the target footage',
        detail:
          'Extract target duration, audio onsets, speech pauses, color look, and a face/motion subject track.',
        command: 'python scripts/analyze_target.py TARGET.mp4 target_analysis.json',
      },
      {
        title: 'Retime & reframe automatically',
        detail:
          'Scale holds proportionally while locking transition frame counts, snapping cuts to target beats/pauses, and matching grade.',
        command: 'python scripts/retime_manifest.py manifest.json target_analysis.json retimed.json --width 1080 --height 1920',
      },
      {
        title: 'Render & run visual QA',
        detail:
          'Render full composite MP4 plus optional ProRes alpha graphics pass, then inspect contact_sheet.jpg with qa_check.py.',
        command: 'python scripts/render_composite.py retimed.json OUT.mp4 --alpha-out text_pass.mov --report render_report.json',
      },
    ],
    outputs: ['Declarative manifest.json & retimed.json', 'Finished 1080x1920 / 16:9 MP4', 'ProRes alpha text_pass.mov + QA contact sheet'],
    gotchas: [
      'Keep transition frame counts fixed (e.g., 6-frame whip) even when hold durations scale to target length.',
      'Use --no-composite --alpha-out text_pass.mov when the user wants to tweak graphics timing inside Premiere, Resolve, or Final Cut.',
      'Shots with speed != 1.0 break audio sync for that segment—always surface retimer warnings.',
    ],
    sampleRecipe: `{
  "canvas": { "width": 1080, "height": 1920, "fps": 30 },
  "shots": [
    {
      "id": "s01",
      "hold_frames": 38,
      "transition_out": { "type": "whip", "frames": 6 },
      "camera": { "zoom_start": 1.0, "zoom_end": 1.14, "jump_cut_punch": true },
      "subject_framing": "face_track",
      "snapped_to": "speech_pause_01"
    }
  ],
  "alpha_pass": "text_pass.mov"
}`,
    rawMarkdown: `---
name: argon
description: Studio-grade reverse engineering of viral edits. Measures a reference video (shot cuts, camera zoom/pan/shake, transition widths, audio beats, color), builds a declarative edit manifest, then automatically retimes it to a target video (cuts snap to the target's beats and speech pauses, smart subject framing, color matching) and renders the result with animated captions, transitions, glow/grade, an optional ProRes alpha graphics pass, and multi-pass visual QA. Use this skill whenever the user shares a reference video and wants its multi-layer motion graphics, kinetic typography, camera moves, punch-ins, whip transitions, or beat-locked editing applied directly to their own footage, wants a finished rendered video rather than just a breakdown, wants graphics delivered as transparent layers for Premiere/Resolve/Final Cut, or says things like "edit my video like this one", "make mine go viral like this", or "apply this reel's style to my clip".
compatibility: Scripts need ffmpeg, ffprobe, Python 3, numpy, opencv-python (cv2), and Pillow. No network needed.
---

# Argon

Argon is Carbon plus automation. It turns a reference video into a manifest, adapts that manifest to the user's footage, renders it, and checks the result. Scripts live in \`scripts/\`; run them from that directory so imports resolve.

## When to use

- The user wants a reference edit applied to their own video and delivered as a rendered file.
- The user wants cuts locked to the beats or speech pauses of their own clip.
- The user wants reframing (for example landscape to vertical) with the subject kept in frame.
- The user wants graphics as a separate transparent pass for an NLE.

If they only want an analysis or recipe, a lighter inspection is enough; still use \`analyze_reference.py\` for numbers.

## Workflow

### 1. Measure the reference

\`\`\`bash
python scripts/analyze_reference.py REF.mp4 /home/claude/ref --scene-threshold 0.3
\`\`\`

Writes \`ref_analysis.json\` and one frame per shot. If the shot count looks too low for a fast edit, lower the threshold (0.05 to 0.15 catches soft transitions but can over-cut on fast camera moves). Then \`view\` the frames, and extract extra frames around transitions and text moments with ffmpeg. Judge by eye what the scripts cannot measure: transition type (whip, dissolve, slide), speed ramps, typography, glow or shader looks, layer order.

### 2. Build and review the manifest

\`\`\`bash
python scripts/build_manifest.py /home/claude/ref/ref_analysis.json manifest.json --captions "LINE ONE|LINE TWO|LINE THREE"
\`\`\`

Open \`manifest.json\` and correct what the scripts only guessed (see \`references/manifest-schema.md\`): set transition types (\`whip\`, \`slideleft\`, ...), easing, caption style, glow/vignette. Ask the user for caption text if they want captions and haven't supplied any. Show the user a short summary of the recipe before rendering.

### 3. Measure the target

\`\`\`bash
python scripts/analyze_target.py TARGET.mp4 target_analysis.json
\`\`\`

Gets duration, audio onsets, speech pauses, color look, and a subject track (face if the OpenCV cascade is available, otherwise motion centroid, otherwise center). If the subject track source is mostly \`default\`, tell the user framing will be centered.

### 4. Retime

\`\`\`bash
python scripts/retime_manifest.py manifest.json target_analysis.json retimed.json [--width 1080 --height 1920]
\`\`\`

- Holds and caption holds scale to the target length; transition and caption enter/exit frame counts stay fixed.
- Cuts snap to nearby beats or pause ends; \`snapped\` in the output shows which.
- Hard cuts on one continuous take get an alternating punch-in so they are visible (\`jump_cut_punch\`).
- Grade is matched toward the reference look.
- Read the \`warnings\` array and tell the user about anything that affects the result (scale outside 0.5 to 2.0, speed changes breaking audio sync, shots shorter than their transitions).

### 5. Render

\`\`\`bash
python scripts/render_composite.py retimed.json OUT.mp4 --alpha-out text_pass.mov --report render_report.json
\`\`\`

Rendering is frame-by-frame in Python and takes roughly 10 to 30 seconds per 10 seconds of 1080p video. Use \`--max-frames 90\` for a quick draft. Use \`--no-composite --alpha-out text_pass.mov\` when the user will tweak timing in an NLE, so graphics stay off the main plate. Output keeps the target's audio.

### 6. QA, look, fix

\`\`\`bash
python scripts/qa_check.py retimed.json OUT.mp4 /home/claude/qa --report render_report.json
\`\`\`

Checks format and duration, stills at every transition midpoint, caption entrance, and caption peak (black or flat frames), caption clipping against a safe margin, hard-cut visibility, and per-shot camera zoom against the manifest. Then \`view\` \`qa/contact_sheet.jpg\` and the individual stills and compare with the reference frames: caption placement, subject framing, transition feel, grade. Fix defects by editing the manifest (or the retimer flags), re-render, and re-run QA. Do not report success until QA passes and the stills look right.

### 7. Deliver

Copy the final video (and \`text_pass.mov\` if requested) to \`/mnt/user-data/outputs/\` and present them. Say what was measured versus judged by eye, list any warnings, and state resolution, fps, and duration.

## Beyond the scripts

The renderer covers 2D camera moves, the listed transitions, grade, glow, vignette, and captions. It does not run 3D scenes, custom GLSL, object tracking, or smooth speed ramps. When the reference needs those, write Remotion, Motion Canvas, Three.js, or GLSL code from your breakdown, render it as a separate transparent pass, and composite it over the plate with ffmpeg \`overlay\`. Say plainly which parts are approximations.

## Gotchas

- Scale phrase and hold durations proportionally when the target length differs, but keep transition durations fixed (a 6-frame whip stays 6 frames). The retimer already does this; don't undo it by hand.
- Render graphic layers separately with alpha (\`--alpha-out\`) whenever the user plans to adjust timing in Premiere, Resolve, or Final Cut.
- Never invent plugin names, fonts, or source assets you cannot see. Recreate looks with the manifest's grade, glow, vignette, and programmatic text or shaders, and label them as approximations.
- Measured transition width is an upper bound next to fast camera motion, and transition type is always a guess until you view frames.
- Shots with \`speed\` other than 1.0 break audio sync for that shot. Warn the user.
- Zoom and pan measurement needs texture; flat backgrounds can read as no camera motion.
- Keep the target's unrelated content untouched. Only change framing, pacing, grade, and added graphics.`,
  },
  {
    id: 'neon',
    name: 'Neon',
    elementSymbol: 'Ne',
    atomicNumber: 10,
    filename: 'neon.md',
    downloadPath: '/skills/neon.md',
    tier: 'max',
    tierLabel: 'Max',
    tagline: 'Autonomous style-transfer engine, 3D/GLSL shaders & self-correcting render loops',
    summary:
      'Peak-tier autonomous motion-design and video reverse-engineering system. Deconstructs any reference video into a reusable style system—visual physics, 3D/WebGL shaders, kinetic typography, camera choreography, color science, and audio-transient rhythm—and rebuilds, adapts, and verifies production-grade edits with closed-loop visual diffing.',
    compatibility: 'Orchestrates Remotion/React, Three.js/GLSL, Manim, and FFmpeg (time-based seconds timing + sparse-frame alpha compositing).',
    workflowSteps: [
      {
        title: 'Full-spectrum forensic inspection',
        detail:
          'Extract shot-by-shot timelines, sub-second cut rhythms, velocity/speed-ramp curves, camera rig trajectories, typography rules, color grading curves, and audio transient sync points.',
      },
      {
        title: 'Synthesize a reusable Style & Motion System',
        detail:
          'Encode extracted DNA into portable design tokens (palette, grain, type scale, glow), motion primitives (spring physics, overshoot, 3D/glitch/whip transitions), and a beat/speech-aware rhythm engine.',
      },
      {
        title: 'Target media intelligence & adaptation',
        detail:
          'Analyze target footage for subject bounding boxes, motion vectors, speech transcripts, and audio peaks—applying smart reframing (16:9, 9:16, 1:1, 4:5), punch-ins, and subject-aware overlay placement.',
      },
      {
        title: 'Multi-engine code generation & rendering',
        detail:
          'Orchestrate Remotion/React, Three.js/GLSL, Manim, and FFmpeg sparse-frame alpha compositing to output both the final master and modular source files.',
      },
      {
        title: 'Closed-loop visual diffing & self-correction',
        detail:
          'Render diagnostic frames at every cut, transition peak, and graphic entrance, inspect side-by-side against reference targets, and auto-tune easing, kerning, glow, and grade across iterative passes.',
      },
      {
        title: 'Package for scale',
        detail:
          'Deliver the final rendered edit alongside clean, documented, parameterized source code and a reusable style preset for one-command batch campaigns.',
      },
    ],
    outputs: [
      'Portable Style & Motion System (tokens + primitives)',
      'Multi-aspect rendered masters & sparse alpha passes',
      'Self-corrected source code & batch style preset',
    ],
    gotchas: [
      'Compute motion in time-based seconds rather than hardcoded frame counts so transition snap and spring overshoot hold across 60fps, 30fps, and 24fps timelines.',
      'Keep live-action footage untouched outside active transition/grade regions via sparse-frame rendering and alpha compositing to preserve original bitrate.',
      'Maintain strict honesty about observable details—synthesize closest procedural equivalents for proprietary 3D/stock elements and note them clearly.',
    ],
    sampleRecipe: `// Neon time-based Style & Motion System preset (fps-independent)
export const neonPreset = {
  aspectRatios: ["16:9", "9:16", "1:1", "4:5"],
  motion: { springStiffness: 240, damping: 16, overshoot: 1.08, timeUnit: "seconds" },
  layers: { typography: "remotion", shaders3d: "three-glsl", diagrams: "manim", master: "ffmpeg-sparse-alpha" },
  qaLoop: { maxSelfCorrectionPasses: 3, inspectAt: ["cut", "transition_peak", "graphic_enter"] }
};`,
    rawMarkdown: `---
name: neon
description: Peak-tier autonomous motion-design and video reverse-engineering system that deconstructs any reference video into a complete, reusable style-transfer engine (scene-by-scene visual physics, 3D/WebGL shaders, kinetic typography systems, sound-design sync, and procedural VFX) and rebuilds, adapts, and renders production-grade edits onto target videos or full multi-scene campaigns with automated visual diffing and self-correcting render loops.
---

# Neon

Peak-tier autonomous motion-design and video reverse-engineering engine. Deconstructs any reference video into a full procedural style system—capturing visual physics, 3D/shader effects, kinetic typography, camera choreography, color science, and audio-transient rhythm—and rebuilds, adapts, and verifies production-grade edits onto target footage or multi-scene pipelines.

## When to use

- The user wants the highest-fidelity reverse engineering of a reference video's entire visual language—combining live-action compositing, procedural motion graphics, 3D/GLSL shaders, kinetic typography, speed-ramping, and sound-sync—applied to their target video or batch of videos.
- The user wants to turn a reference video into a reusable, multi-aspect-ratio design system (\`16:9\`, \`9:16\`, \`1:1\`, \`4:5\`) with automated subject tracking, brand token injection, and frame-verified rendering.
- The user asks for end-to-end autonomous execution: inspecting reference and target media, writing and running inspection/render scripts, visually comparing rendered outputs against the reference, and self-correcting until quality matches.

## Workflow

### 1. Full-spectrum forensic inspection

Run comprehensive visual, temporal, and audio analysis on the reference video. Extract shot-by-shot timelines, sub-second cut rhythms, velocity/speed-ramp curves, camera rig trajectories (pan, tilt, dolly zoom, handheld micro-shake), typography rules (weight, tracking, entrance/exit physics, mask reveals), color grading curves, and audio transient/SFX sync points.

### 2. Synthesize a reusable Style & Motion System

Encode the extracted DNA into a structured, portable specification and component library:
- **Design tokens**: Extracted color palette, contrast/grain profile, typography scale, and shadow/glow parameters.
- **Motion primitives**: Custom spring physics, cubic-bezier curves, overshoot values, and procedural transitions (whip pans, glitch displacements, mask wipes, 3D card flips).
- **Rhythm engine**: Beat- and speech-aware pacing rules that adapt cut intervals and graphic hits to any target video length.

### 3. Target media intelligence & adaptation

Analyze the target footage for subject bounding boxes, motion vectors, speech/transcript segments, and audio peaks. Automatically re-choreograph the Style & Motion System onto the target footage—applying smart reframing, dynamic punch-ins on key spoken phrases, and subject-aware graphic placement so overlays never obscure faces or focal points.

### 4. Multi-engine code generation & rendering

Select and orchestrate the optimal programmatic stack for each layer (\`Remotion/React\` for UI and kinetic typography, \`Three.js/GLSL\` for 3D and custom shaders, \`Manim\` for geometric/data motion, and \`FFmpeg\` for frame-accurate cutting, speed ramps, color grading, audio mixing, and sparse-frame alpha compositing). Output both the final rendered master and modular source files/transparent overlay passes.

### 5. Closed-loop visual diffing & self-correction

Render diagnostic frames at every cut, transition peak, and graphic entrance. Visually inspect the rendered frames side-by-side against the reference video's style and timing targets, automatically tuning easing, kerning, glow intensity, or color balance across iterative passes until the output meets studio-grade fidelity.

### 6. Package for scale

Deliver the final edited video alongside clean, documented, parameterized source code and a style preset so the user can batch-apply the exact reverse engineered aesthetic to future videos with one command.

## Gotchas

- Preserve exact transition snap and spring overshoot feel when adapting to different frame rates (e.g., converting 60fps reference timing to 24fps or 30fps target timelines) by computing motion in time-based seconds rather than hardcoded frame counts.
- Keep live-action footage untouched outside active transition/grade regions by using sparse-frame rendering and alpha compositing, maximizing render speed and preserving original video bitrate.
- Maintain strict honesty about observable details: if a reference effect relies on custom 3D assets or proprietary stock elements, synthesize the closest procedural equivalent and note it clearly.`,
  },
];

export interface PricingTierSpec {
  id: PlanTier;
  name: string;
  tagline: string;
  ctaLabel: string;
  includedSkills: SkillId[];
  features: string[];
  highlighted?: boolean;
}

export const PRICING_TIERS: PricingTierSpec[] = [
  {
    id: 'free',
    name: 'Free',
    tagline: 'Visual reference reverse engineering for solo creators.',
    ctaLabel: 'Download Hydrogen Free',
    includedSkills: ['hydrogen'],
    features: [
      'Hydrogen skill file (hydrogen.md)',
      'Visual shot, transition, grade & typography breakdown',
      'FFmpeg, Remotion & NLE recipe prompts',
      'Works with Gemini, Claude & ChatGPT',
      'Unlimited personal projects',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    tagline: 'Measured pacing, audio beat detection & JSON edit retiming.',
    ctaLabel: 'Unlock Pro & Carbon',
    includedSkills: ['hydrogen', 'carbon'],
    highlighted: true,
    features: [
      'Carbon skill file (carbon.md) + Hydrogen',
      'Shot-cut & BPM onset analyzer workflow',
      'Reusable analysis.json & recipe schema',
      'Automated target clip retiming & beat snapping',
      'Priority updates to script schemas',
    ],
  },
  {
    id: 'max',
    name: 'Max',
    tagline: 'Full studio automation, alpha graphics passes & shader synthesis.',
    ctaLabel: 'Unlock Max Suite',
    includedSkills: ['hydrogen', 'carbon', 'argon', 'neon'],
    features: [
      'Argon + Neon + Carbon + Hydrogen (all 4 skills)',
      'Smart subject tracking (face & motion centroid)',
      'Speech-pause & beat-locked declarative manifests',
      'ProRes 4444 alpha overlay pass for Premiere / Resolve',
      'Multi-pass visual QA contact sheet workflow',
    ],
  },
];
