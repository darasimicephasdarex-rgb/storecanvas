# StoreCanvas Studio — developer preview v0.9

StoreCanvas is a **free-first, local visual Shopify theme editor** with nested freeform layers, responsive coordinates, motion controls, a slideshow component, optional device haptics, and a ZIP exporter.

**Status:** working development prototype, **not** a production SaaS and **not** authorized to publish changes to any merchant's live store.

## Quick start (no paid tools)

Open `editor/index.html` in a modern desktop browser, or serve this directory with any free static server. The browser runtime is self-contained and uses no external JavaScript dependencies. Design and export a Shopify theme ZIP. Always upload and preview it on an **unpublished test theme/store** first. The generated theme passes Shopify's official error-level Theme Check in CI; it is **not** certified for checkout/payment, real 250+ variant catalogs, app review or production use. Unpublished full-ZIP imports have been accepted by Shopify for v0.7 and v0.8.

## Developer commands (Node.js >= 20)

```bash
npm run build:browser  # regenerates classic editor/runtime.js from engine sources
npm run check          # syntax + runtime reproducibility
npm test               # unit and export-integrity tests
npm run build:theme     # generate full theme directory + ZIP + SHA-256 manifest
npm run check:theme     # validate complete generated theme structure and hashes
```

Optional browser regressions: `python tests/browser_check.py` and `python tests/slideshow_browser.py` (requires locally installed Playwright and Chromium; not part of CI). The automated browser harness loads scripts without a web server to work inside constrained test environments; it is not a complete file:// compatibility certification.

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

## v0.7 — Shopify Theme Check quality gate

- GitHub Actions builds the complete 26-file theme and runs Shopify's official Theme Check against the generated source directory. The resulting ZIP is retained as a QA artifact on successful runs.
- Generated images have explicit dimensions, and known collection/cart links use Shopify route objects for market-aware paths.
- A local audit verifies section schema JSON, template and asset references, and SHA-256 file hashes.
- Slideshow autoplay now pauses on hover, keyboard focus, explicit Pause and reduced motion; it resumes only when no pause source remains. Chromium regression covers transitions among these states.
- **Outstanding:** The independent ZIP has not yet been installed as a separately created unpublished Shopify theme; app OAuth, multi-tenancy, publishing, rollback and high-variant products remain outstanding.

Run locally: `npm run check && npm test && npm run build:theme && npm run check:theme`. Shopify Theme Check runs automatically in GitHub Actions.

### Slideshow interaction QA
The generated storefront now animates `fade`, `slide`, and `zoom` transitions. Autoplay respects pointer hover, keyboard focus, explicit Pause, tab visibility and reduced-motion preferences. Inactive slides are marked as hidden from assistive technologies. An optional Chromium test is available via `python tests/slideshow_browser.py` (requires Playwright/Chromium on your own machine); CI executes the dependency-free Node tests.

## v0.8 — Shopify option-value selectors and independent QA theme

The generated product template now uses `product.options_with_values` and the Shopify Section Rendering API, so it does not enumerate the capped `product.variants` list. Invalid combinations, failed requests, and in-progress selections cannot submit stale product variant IDs. A retry control and focused status announcement provide recovery.

The independent 26-file theme ZIP was successfully imported through Shopify's `themeCreate` as an **UNPUBLISHED** test theme, and then its product section and commerce assets were updated to v0.8. Desktop and mobile preview requests succeeded for homepage, product, cart and collection pages. No checkout order or payment was placed.

See `docs/INDEPENDENT_THEME_IMPORT_V08.md` for exact acceptance evidence and `docs/HIGH_VARIANT_QA_2026-11-21.md` for remaining risks. All code remains free-first.

## v0.9 — localized Shopify commerce
The generated Shopify theme now includes English and Spanish storefront locale catalogs. Native Liquid translation keys are used for product forms, status/errors, cart labels, navigation, search and accessibility. Dynamic variant feedback is supplied by the current translated product section. Stale, empty and disabled variant states cannot be submitted. Run npm run check, npm test, npm run build:theme and npm run check:theme; this does not certify real Shopify checkout.

### Fresh ZIP and real-store QA status (2026-11-21)
Shopify accepted the complete original v0.8 ZIP as a **new, separate unpublished theme** named `StoreCanvas v0.8 Fresh ZIP QA` (26 source files, no import errors). Desktop/mobile previews of the homepage, product, cart and collection completed. This is rendering acceptance, **not proof of product clicks or checkout handoff**.

To execute real interaction QA safely on an in-stock test product, install free Playwright + Chromium and run `python tests/live_storefront_smoke.py --preview 'https://your-store.myshopify.com/?preview_theme_id=THE_UNPUBLISHED_ID' --product-handle example-product`. The optional `--verify-checkout` only checks navigation: never supplies payment or places an order. The runner refuses URLs without a preview theme ID. GitHub CI runs its offline safety self-test, not live store mutations.
