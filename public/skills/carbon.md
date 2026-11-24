---
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

Run the analyzer (find the uploaded video under `/mnt/user-data/uploads`):

```bash
python scripts/analyze_video.py REF.mp4 /home/claude/ref_analysis
```

This writes `analysis.json` (metadata, every shot with start/end/length and average color, audio onsets, rough BPM) plus one frame per shot in `frames/`.

- Check the output makes sense: if shot count looks too low for a fast edit, rerun with `--scene-threshold 0.15`; if it looks too high (flashes, strobes), raise it.
- Hard cuts are detected reliably. Dissolves, whip pans, and motion-blur transitions may be missed or merged, so confirm them visually.

### 2. Inspect visually

Use `view` on the extracted frames, and extract extra frames around transitions or text moments with ffmpeg when you need detail. Look at typography, graphic placement, camera movement, layering, and grading. The scripts cannot see these; this part is judgment.

### 3. Write the recipe

Combine measurements and observations into a JSON recipe following `references/recipe-schema.md`. Label each value `measured` or `estimated`. Show the user a short summary table before building anything.

### 4. Check the target

If the task needs the user's own clip and none was provided, ask for it. If they only want the recipe or a code scaffold, skip ahead.

### 5. Apply

Pick the lightest tool that does the job:

- **Match pacing on a target clip:**
  ```bash
  python scripts/retime_to_reference.py TARGET.mp4 /home/claude/ref_analysis/analysis.json OUT.mp4 [--snap-beats] [--width W --height H]
  ```
  This cuts the target into segments that follow the reference's shot lengths (loops the target if it runs out) and optionally snaps cuts to nearby audio onsets. Output has no audio; add the user's track afterward.
- **Transitions, zooms, text, grading:** build FFmpeg filter chains or Remotion/Python code using the mapping table in `references/recipe-schema.md`.
- **No video tools available to the user:** give reproducible code or step-by-step editor instructions instead.

### 6. Verify

Run `analyze_video.py` on the output and compare its shot count, average shot length, and cut times with the reference recipe. Check frames visually for placement and look. Iterate on any mismatch, and report which differences remain.

## Gotchas

- Don't invent frame numbers, plugin names, fonts, or hidden assets. State what is visible and mark approximations.
- BPM and beat onsets are rough estimates from audio energy. They are unreliable on music with weak percussion or on videos with no audio.
- The retime script changes timing only. It doesn't recreate transitions, text, or grading; layer those on afterward.
- Keep changes focused on transferring the reference style. Don't alter unrelated parts of the target unless asked.
- Make resolution, aspect ratio, fps, duration, and file paths explicit so the user can adapt the result.
