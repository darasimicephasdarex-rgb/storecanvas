# StoreCanvas Studio — developer preview v0.11

StoreCanvas is a **free-first, local visual Shopify theme editor** with nested freeform layers, responsive coordinates, motion controls, a slideshow component, optional device haptics, and a ZIP exporter.

**Status:** working development prototype, **not** a production SaaS and **not** authorized to publish changes to any merchant's live store.

## Quick start (no paid tools)

Open `editor/index.html` in a modern desktop browser, or serve this directory with any free static server. The browser runtime is self-contained and uses no external JavaScript dependencies. Design and export a Shopify theme ZIP. Always upload and preview it on an **unpublished test theme/store** first. The generated theme passed Shopify Theme Check and a fresh v0.10 unpublished ZIP import; app review and real interactive commerce QA remain outstanding.

## Developer commands (Node.js >= 20)

```bash
npm run build:browser  # regenerates classic editor/runtime.js from engine sources
npm run check          # syntax + runtime reproducibility
npm test               # project engine, export integrity and authenticated draft API tests
npm run build:theme    # compile independent Shopify theme ZIP
npm run check:theme    # audit generated theme structure and hashes
npm run app:dev        # run development-only authenticated API after configuring env variables
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
- Production Shopify installation/OAuth/token exchange, transactional cloud database, publishing, rollback, SaaS hosting and App Store compliance remain unimplemented. A **development-only** authenticated, encrypted draft API exists under `app/`.
- Haptic vibration is optional and hardware/browser dependent; reduced-motion preferences disable animations.
- The exporter does not request or store Shopify API credentials. Uploaded images are processed locally.
- The connected live storefront was not modified by this release.

## v0.6 — Shopify commerce QA milestone

Generated Shopify product and cart sections now support selected variant price/media, availability, quantity-rule updates, cart line updates/removal, discounts and tax messaging. Commerce interactions use native Shopify forms; no checkout simulation or order placement occurs automatically. Run `npm test`, `npm run check`, and the optional Playwright browser smoke test. See `docs/SHOPIFY_QA_2026-11-21.md` for verified scope and outstanding risks. **This is not a production-ready theme or SaaS.**

## v0.8 — Product option values, safe purchasing and recovery

The generated product template now uses Shopify `product.options_with_values` and the Section Rendering API to handle large variant catalogs without iterating `product.variants`. Server-provided option combinations control the native product form. Missing combinations, failed requests, and concurrent selections cannot submit an older variant ID. Keyboard focus, a polite status region and Retry selection support recovery.

For offline browser QA, run `python tests/high_variant_browser.py` after installing Playwright/Chromium. This test never makes a Shopify network request or places an order. See `docs/HIGH_VARIANT_QA_2026-11-21.md` for verified and unverified scope.

## v0.9 — localized commerce and accessibility safety

The exported starter theme now includes English and Spanish Shopify locale catalogs (`locales/en.default.json` and `locales/es.json`), with localized navigation, product forms, error/retry states, cart labels, search and the skip link. The AJAX high-variant selection script takes feedback strings from **the active server-rendered section** and does not hardcode an English status message. Both locale catalogs have identical keys and parameter names, checked during compilation and by the structural audit.

Additional submit protection rejects stale, empty, busy or disabled product selections; incomplete selections reveal a retry control. The browser runtime is rebuilt from the same modules as the ZIP exporter. There are 28 Node unit tests plus an optional offline Chromium option-selection regression.

This work **does not certify** checkout payments, translated merchant-authored product content, customer accounts, automatic publishing, or any deployed SaaS. The existing independent QA theme must be updated and tested before treating v0.9 as Shopify-accepted.


## v0.10 — Custom keyframe animation studio

StoreCanvas can now author 2–12 ordered keyframes per layer. Each keyframe has
an explicit 0–100% offset and bounded X/Y translation, scale, rotation, and opacity.
The visual inspector supports adding, editing, and deleting frames. The timeline
shows keyframe markers and offers a keyboard-accessible scrubber. Custom animation
is compiled by the same validator into both the browser preview and Shopify CSS;
all values are strictly validated to avoid arbitrary CSS injection.

Tested locally with `npm run check && npm test && npm run build:theme && npm run check:theme`,
plus the optional `python tests/keyframes_browser.py` Chromium regression. The generated
Shopify theme respects `prefers-reduced-motion`. The scrubber uses linear interpolation;
selected playback easing controls CSS animation timing. No paid animation dependency.

### Shopify QA status
A fresh v0.9 archive was imported as unpublished Shopify theme **StoreCanvas v0.9 Fresh ZIP QA**,
with 27 files and desktop/mobile page-preview requests. A real product-selection,
add-to-cart, cart quantity update and checkout handoff has **not** yet been tested via
interactive Shopify customer browser. Read-only screenshot/theme tools cannot substitute
for that test. Do not publish before verified Shopify storefront interaction QA.


## v0.11 — Signed Shopify session tokens and isolated draft storage

A **development-only** Node HTTP API now verifies Shopify-signed App Bridge ID tokens per request,
validates shop identity, stores encrypted AES-256-GCM project drafts separately per shop,
and handles raw-HMAC-authenticated uninstall/privacy webhooks. It includes revision checks,
shop-scoped serialized writes, and rejects webhook shop-header substitution.
See `app/README.md` and `app/.env.example` for the exact endpoints and security limits.
No production app installation, merchant OAuth/token exchange, cloud database, or public API hosting has occurred.
The v0.10 independent theme remains unpublished; real add-to-cart and checkout click QA
remains blocked on interactive browser access.


## v0.12 — Shopify embedded app development foundation

A Shopify App Bridge dashboard at `/app/` can create/import/list/delete encrypted shop-scoped projects and open the full visual editor at `/app/editor/`. Drafts use revision-controlled Cloud Save. Offline Shopify token exchange and read-only catalog calls run server-side; an encrypted vault never exposes Admin tokens in the browser. See `app/INSTALL.md` for registration, HTTPS, privacy and production prerequisites. The independent theme exporter is unchanged. **This is a tested development scaffold, not a publicly deployed or registered app.**
