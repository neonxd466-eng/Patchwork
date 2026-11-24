---
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
- When replicating with code, make resolution, aspect ratio, duration, and asset paths explicit and easy to adapt.
