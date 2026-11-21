# StoreCanvas

Free-first visual theme builder for Shopify: a browser-based freeform layout editor, motion/slideshow controls, and Shopify Liquid rendering prototypes.

**Status:** engineering prototype, not a released public Shopify app.

## Scope
- Freeform canvas, responsive per-layer layout, nested cards and image blending
- Slideshows, entrance/hover effects, reduced-motion support and optional haptics
- Offline-first JSON project export and Shopify theme ZIP exporter
- Shopify-native compatibility testing on an unpublished development theme

## Repository workflow
- `main` contains the project baseline.
- Features are built on review branches and checked before merging.
- No live theme publish, paid services, secrets, or protected-scope writes without explicit separate approval.

## Source provenance
The v0.3 standalone editor was created in chat as a download archive. Repo integration is in progress; do not assume the whole editor has been mirrored until its source files are present here. The Shopify prototype is available separately under `shopify/`.

## Acceptance
See `docs/RELEASE_PLAN.md`. An editor/browser test is **not** proof that a Shopify theme is production-ready.
