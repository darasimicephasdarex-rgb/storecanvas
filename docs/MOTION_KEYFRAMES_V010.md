# StoreCanvas v0.10 — keyframe motion specification

## Document model

Every layer can have `motion.keyframes` with 0 (disabled) or 2–12 frames.
Frames are ordered by a strictly increasing `at` percentage, from exactly 0 to 100.
Each frame may include x [-600,600] px, y [-600,600] px, scale [0.1,3],
rotation [-360,360] degrees, and opacity [0,100] percent. Missing per-frame
properties use zero translation/rotation, unit scale and 100% opacity.

## Editor

- Motion tab: create two-frame animation, insert evenly spaced frame, edit all
  properties, remove interior frames, clear custom motion.
- Timeline shows the duration bars and diamond markers. The keyboard-operable
  range control scrubs progress on the selected layer.
- Preview motion starts the selected timeline with load/scroll trigger.
- Layer transform (layout rotation) and animation transform live in different
  DOM nodes to avoid accidentally wiping out each other.

## Shopify export

`engine/keyframes.mjs` is a pure ESM shared validator/renderer.
Both editor and Shopify compile identical @keyframes definitions from validated
numbers. No arbitrary CSS or JavaScript is accepted. Motion output is scoped to
unique layer IDs. `prefers-reduced-motion:reduce` disables motion while preserving
readable content.

## Tests

- `tests/keyframes.test.mjs`: numeric bounds, ordering, interpolation, injection,
  backwards compatibility and ZIP parity.
- `tests/keyframes_browser.py`: Chromium authoring, editing, scrubbing, playback,
  Shopify ZIP generation and CSS inspection.

## Limitations

- Studio currently animates translation, scale, rotation and opacity. It does not
  yet support timeline audio, scroll scrubbing, physics curves or animation groups.
- Scrub uses linear interpolation; per-layer easing is applied during playback.
- No production-store publishing or automatic theme modification was performed.
