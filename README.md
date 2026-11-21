# StoreCanvas Studio — developer preview v0.5

StoreCanvas is a **free-first, local visual Shopify theme editor** with nested freeform layers, responsive coordinates, motion controls, a slideshow component, optional device haptics, and a ZIP exporter.

**Status:** working development prototype, **not** a production SaaS and **not** authorized to publish changes to any merchant's live store.

## Quick start (no paid tools)

Open `editor/index.html` in a modern desktop browser, or serve this directory with any free static server. The browser runtime is self-contained and uses no external JavaScript dependencies. Design and export a Shopify theme ZIP. Always upload and preview it on an **unpublished test theme/store** first. The generated theme has not passed full Shopify Theme Check, app review or commerce QA.

## Developer commands (Node.js >= 20)

```bash
npm run build:browser  # regenerates classic editor/runtime.js from engine sources
npm run check          # syntax + runtime reproducibility
npm test               # unit and export-integrity tests
```

Optional browser regression: `python tests/browser_check.py` (requires locally installed Playwright and Chromium; not part of CI). The automated browser harness loads scripts without a web server to work inside constrained test environments; it is not a complete file:// compatibility certification.

## What changed in v0.5

- A **single validated v0.4 document schema** feeds both storefront preview rendering and Shopify homepage export.
- `engine/theme.mjs` compiles Shopify template files from exactly the same renderer used by `engine/core.mjs`.
- `engine/builtin-images.mjs` packages real SVG illustrations into the generated ZIP. Uploaded base64 PNG/JPEG/WebP/GIF images become assets after MIME signature validation and size checks.
- `engine/zip.mjs` produces deterministic ZIP archives with integrity-checked CRC32 fields.
- `editor/runtime.js` is generated from the engine modules so the editor remains free and works with classic scripts, with no browser module-network import requirement.
- Legacy exporter replaced by a thin adapter; `editor/index.html` loads the generated runtime before the editor.
- Added eight export-focused tests, plus six existing core tests (14 total locally passing).

## Repository layout

- `editor/` — visual canvas UI and generated local runtime
- `engine/core.mjs` — shared validation and HTML/CSS/JS preview renderer
- `engine/theme.mjs` — Shopify Online Store 2.0 theme compiler
- `engine/zip.mjs` — binary ZIP writer
- `scripts/build-browser.mjs` — creates/verifies editor browser runtime
- `tests/` — Node tests and optional Chromium smoke test
- `shopify/` — earlier independently tested Horizon freeform section proof; not the full new exporter
- `docs/RELEASE_GATES.md` — precise production checklist

## Critical limitations

- The output is an **independent starter theme**, not a safe overlay for an arbitrary installed theme.
- The included product, cart, search, and collection templates are minimal; payment flows, variants, locale, accelerated checkout, privacy and theme compliance need real QA before production.
- Full automated Shopify app install, OAuth, database, publishing, rollback, multi-tenant SaaS hosting and App Store compliance remain unimplemented.
- Haptic vibration is optional and hardware/browser dependent; reduced-motion preferences disable animations.
- The exporter does not request or store Shopify API credentials. Uploaded images are processed locally.
- The connected live storefront was not modified by this release.

## v0.6 — Shopify commerce QA milestone

Generated Shopify product and cart sections now support selected variant price/media, availability, quantity-rule updates, cart line updates/removal, discounts and tax messaging. Commerce interactions use native Shopify forms; no checkout simulation or order placement occurs automatically. Run `npm test`, `npm run check`, and the optional Playwright browser smoke test. See `docs/SHOPIFY_QA_2026-11-21.md` for verified scope and outstanding risks. **This is not a production-ready theme or SaaS.**
