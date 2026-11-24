---
name: neon
description: Peak-tier autonomous motion-design and video reverse-engineering system that deconstructs any reference video into a complete, reusable style-transfer engine (scene-by-scene visual physics, 3D/WebGL shaders, kinetic typography systems, sound-design sync, and procedural VFX) and rebuilds, adapts, and renders production-grade edits onto target videos or full multi-scene campaigns with automated visual diffing and self-correcting render loops.
---

# Neon

Peak-tier autonomous motion-design and video reverse-engineering engine. Deconstructs any reference video into a full procedural style system—capturing visual physics, 3D/shader effects, kinetic typography, camera choreography, color science, and audio-transient rhythm—and rebuilds, adapts, and verifies production-grade edits onto target footage or multi-scene pipelines.

## When to use

- The user wants the highest-fidelity reverse engineering of a reference video's entire visual language—combining live-action compositing, procedural motion graphics, 3D/GLSL shaders, kinetic typography, speed-ramping, and sound-sync—applied to their target video or batch of videos.
- The user wants to turn a reference video into a reusable, multi-aspect-ratio design system (`16:9`, `9:16`, `1:1`, `4:5`) with automated subject tracking, brand token injection, and frame-verified rendering.
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

Select and orchestrate the optimal programmatic stack for each layer (`Remotion/React` for UI and kinetic typography, `Three.js/GLSL` for 3D and custom shaders, `Manim` for geometric/data motion, and `FFmpeg` for frame-accurate cutting, speed ramps, color grading, audio mixing, and sparse-frame alpha compositing). Output both the final rendered master and modular source files/transparent overlay passes.

### 5. Closed-loop visual diffing & self-correction

Render diagnostic frames at every cut, transition peak, and graphic entrance. Visually inspect the rendered frames side-by-side against the reference video's style and timing targets, automatically tuning easing, kerning, glow intensity, or color balance across iterative passes until the output meets studio-grade fidelity.

### 6. Package for scale

Deliver the final edited video alongside clean, documented, parameterized source code and a style preset so the user can batch-apply the exact reverse engineered aesthetic to future videos with one command.

## Gotchas

- Preserve exact transition snap and spring overshoot feel when adapting to different frame rates (e.g., converting 60fps reference timing to 24fps or 30fps target timelines) by computing motion in time-based seconds rather than hardcoded frame counts.
- Keep live-action footage untouched outside active transition/grade regions by using sparse-frame rendering and alpha compositing, maximizing render speed and preserving original video bitrate.
- Maintain strict honesty about observable details: if a reference effect relies on custom 3D assets or proprietary stock elements, synthesize the closest procedural equivalent and note it clearly.
