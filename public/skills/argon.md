---
name: argon
description: Studio-grade reverse engineering of viral edits. Measures a reference video (shot cuts, camera zoom/pan/shake, transition widths, audio beats, color), builds a declarative edit manifest, then automatically retimes it to a target video (cuts snap to the target's beats and speech pauses, smart subject framing, color matching) and renders the result with animated captions, transitions, glow/grade, an optional ProRes alpha graphics pass, and multi-pass visual QA. Use this skill whenever the user shares a reference video and wants its multi-layer motion graphics, kinetic typography, camera moves, punch-ins, whip transitions, or beat-locked editing applied directly to their own footage, wants a finished rendered video rather than just a breakdown, wants graphics delivered as transparent layers for Premiere/Resolve/Final Cut, or says things like "edit my video like this one", "make mine go viral like this", or "apply this reel's style to my clip".
compatibility: Scripts need ffmpeg, ffprobe, Python 3, numpy, opencv-python (cv2), and Pillow. No network needed.
---

# Argon

Argon is Carbon plus automation. It turns a reference video into a manifest, adapts that manifest to the user's footage, renders it, and checks the result. Scripts live in `scripts/`; run them from that directory so imports resolve.

## When to use

- The user wants a reference edit applied to their own video and delivered as a rendered file.
- The user wants cuts locked to the beats or speech pauses of their own clip.
- The user wants reframing (for example landscape to vertical) with the subject kept in frame.
- The user wants graphics as a separate transparent pass for an NLE.

If they only want an analysis or recipe, a lighter inspection is enough; still use `analyze_reference.py` for numbers.

## Workflow

### 1. Measure the reference

```bash
python scripts/analyze_reference.py REF.mp4 /home/claude/ref --scene-threshold 0.3
```

Writes `ref_analysis.json` and one frame per shot. If the shot count looks too low for a fast edit, lower the threshold (0.05 to 0.15 catches soft transitions but can over-cut on fast camera moves). Then `view` the frames, and extract extra frames around transitions and text moments with ffmpeg. Judge by eye what the scripts cannot measure: transition type (whip, dissolve, slide), speed ramps, typography, glow or shader looks, layer order.

### 2. Build and review the manifest

```bash
python scripts/build_manifest.py /home/claude/ref/ref_analysis.json manifest.json --captions "LINE ONE|LINE TWO|LINE THREE"
```

Open `manifest.json` and correct what the scripts only guessed (see `references/manifest-schema.md`): set transition types (`whip`, `slideleft`, ...), easing, caption style, glow/vignette. Ask the user for caption text if they want captions and haven't supplied any. Show the user a short summary of the recipe before rendering.

### 3. Measure the target

```bash
python scripts/analyze_target.py TARGET.mp4 target_analysis.json
```

Gets duration, audio onsets, speech pauses, color look, and a subject track (face if the OpenCV cascade is available, otherwise motion centroid, otherwise center). If the subject track source is mostly `default`, tell the user framing will be centered.

### 4. Retime

```bash
python scripts/retime_manifest.py manifest.json target_analysis.json retimed.json [--width 1080 --height 1920]
```

- Holds and caption holds scale to the target length; transition and caption enter/exit frame counts stay fixed.
- Cuts snap to nearby beats or pause ends; `snapped` in the output shows which.
- Hard cuts on one continuous take get an alternating punch-in so they are visible (`jump_cut_punch`).
- Grade is matched toward the reference look.
- Read the `warnings` array and tell the user about anything that affects the result (scale outside 0.5 to 2.0, speed changes breaking audio sync, shots shorter than their transitions).

### 5. Render

```bash
python scripts/render_composite.py retimed.json OUT.mp4 --alpha-out text_pass.mov --report render_report.json
```

Rendering is frame-by-frame in Python and takes roughly 10 to 30 seconds per 10 seconds of 1080p video. Use `--max-frames 90` for a quick draft. Use `--no-composite --alpha-out text_pass.mov` when the user will tweak timing in an NLE, so graphics stay off the main plate. Output keeps the target's audio.

### 6. QA, look, fix

```bash
python scripts/qa_check.py retimed.json OUT.mp4 /home/claude/qa --report render_report.json
```

Checks format and duration, stills at every transition midpoint, caption entrance, and caption peak (black or flat frames), caption clipping against a safe margin, hard-cut visibility, and per-shot camera zoom against the manifest. Then `view` `qa/contact_sheet.jpg` and the individual stills and compare with the reference frames: caption placement, subject framing, transition feel, grade. Fix defects by editing the manifest (or the retimer flags), re-render, and re-run QA. Do not report success until QA passes and the stills look right.

### 7. Deliver

Copy the final video (and `text_pass.mov` if requested) to `/mnt/user-data/outputs/` and present them. Say what was measured versus judged by eye, list any warnings, and state resolution, fps, and duration.

## Beyond the scripts

The renderer covers 2D camera moves, the listed transitions, grade, glow, vignette, and captions. It does not run 3D scenes, custom GLSL, object tracking, or smooth speed ramps. When the reference needs those, write Remotion, Motion Canvas, Three.js, or GLSL code from your breakdown, render it as a separate transparent pass, and composite it over the plate with ffmpeg `overlay`. Say plainly which parts are approximations.

## Gotchas

- Scale phrase and hold durations proportionally when the target length differs, but keep transition durations fixed (a 6-frame whip stays 6 frames). The retimer already does this; don't undo it by hand.
- Render graphic layers separately with alpha (`--alpha-out`) whenever the user plans to adjust timing in Premiere, Resolve, or Final Cut.
- Never invent plugin names, fonts, or source assets you cannot see. Recreate looks with the manifest's grade, glow, vignette, and programmatic text or shaders, and label them as approximations.
- Measured transition width is an upper bound next to fast camera motion, and transition type is always a guess until you view frames.
- Shots with `speed` other than 1.0 break audio sync for that shot. Warn the user.
- Zoom and pan measurement needs texture; flat backgrounds can read as no camera motion.
- Keep the target's unrelated content untouched. Only change framing, pacing, grade, and added graphics.
