# StoreCanvas production release gates — v0.5 (Nov 21, 2026)

Use [x] only where a local or remote check has produced evidence. Do not conflate source completion, GitHub CI, and Shopify production verification.

## Foundation
- [x] Private GitHub repository and development branch accessible
- [x] Visual canvas editor source and example assets present
- [x] Responsive sections, nested layers, motion presets, slideshow/haptic controls in prototype
- [x] Versioned document validator with complexity limits and safe URL rules
- [x] Shared compiler for HTML preview and generated Shopify homepage
- [x] Editor uses the same Shopify compilation engine; old exporter replaced with adapter
- [x] Local image bundling including format-signature checks
- [x] Deterministic ZIP generation and CRC32 ZIP check
- [x] Local Node tests (14) and constrained Chromium smoke test successful
- [ ] GitHub CI on newest v0.5 commit green (verify after push)

## Shopify correctness
- [x] Previous freeform demonstration section successfully committed to unpublished Horizon theme
- [ ] **New v0.5 full-theme ZIP** uploaded and checked on an unpublished Shopify test theme
- [ ] Shopify Theme Check / JSON schema and Liquid syntax audit for generated theme
- [ ] Real product, variant inventory, cart, checkout and customer path QA
- [ ] Storefront semantics, accessibility, SEO, localization, translation and mobile testing
- [ ] Multiple theme/Shopify plan compatibility and app extension integration
- [ ] Publishing transactional guarantees and rollback strategy

## Production SaaS / operational
- [ ] Embedded Shopify app scaffold, OAuth and webhook signature validation
- [ ] Merchant isolation, encrypted storage, secrets management, least-privilege permissions
- [ ] Compliance webhooks, data retention/deletion and uninstall cleanup
- [ ] API-backed asset and project storage, version history and backups
- [ ] Multi-merchant QA, monitoring, performance budgets and incident recovery
- [ ] Shopify App Store review, billing decisions and production deployment

## Safety status
No live theme publishing performed. App deployment not begun. GitHub draft PR is for review only.


## Compatibility milestones (2026-11-21)
- [x] v0.5 homepage output and four SVGs accepted on unpublished Shopify Horizon (8 files).
- [x] v0.6 product, cart, collection alternate templates accepted on unpublished Horizon (8 files).
- [x] 18 Node tests and Chromium browser smoke test passed on v0.6.
- [ ] Complete independent theme ZIP installed and Theme Check validated.
- [ ] Verified variant add-to-cart, cart updates, checkout handoff in isolated dev store without real payment.
- [ ] High-variant products (250+) supported and audited.
- [ ] Accessible dynamic checkout, product media, translations and product forms fully implemented.

## v0.7 Theme Check and motion gate — 2026-11-21
- [x] Fully generated independent theme directory passes official Shopify Theme Check in GitHub CI (error threshold).
- [x] Generated images include width and height, and /collections/all href is transformed to a market-aware Shopify route.
- [x] 24 automated Node tests, SHA256 manifest and asset reference validation.
- [x] Chromium slideshow autoplay, hover/focus, explicit Play/Pause interaction regression.
- [x] Fade, slide and zoom CSS slideshow transitions; aria-hidden applied to inactive figures.
- [ ] Independent theme ZIP imported into a new unpublished Shopify theme; full checkout QA remains blocked.
- [ ] Production app OAuth, database, multi-tenant isolation, review, hosting, and rollback.

## v0.8 high-variant safety gate — 2026-11-21
- [x] Product option picker uses `product.options_with_values`, not a 250-variant loop.
- [x] Native product forms block invalid/stale variant IDs on loading, API failure or no match.
- [x] Section Rendering API refreshes product availability, quantities, media and localized price using selected option IDs.
- [x] Offline Chromium regression verified focus, parameter preservation, isolation, error guard and retry.
- [x] 25 local Node tests and generated ZIP structural audit passed.
- [ ] Latest GitHub CI and Shopify Theme Check on v0.8 (verify after push).
- [ ] Real 250+ variant Shopify store and combined listing QA.
- [ ] Independent themeCreate ZIP import, checkout handoff, accessibility / localization certification.

## v0.9 work — English/Spanish commerce and UI safety
- [x] Locale catalogs generated from one checked translation dictionary; all Liquid `t` references have matching English/Spanish entries.
- [x] Active Shopify product section supplies localized AJAX feedback through escaped data attributes, including update, failure and invalid combinations.
- [x] Product form submit blocked when the selected variant is absent, loading, failed or button-disabled.
- [x] Reproducible browser runtime regenerated and structure/locale tests added (28 Node tests + optional offline Chromium high-variant test locally).
- [ ] GitHub CI/official Theme Check verification for v0.9 must be checked on pushed commit.
- [ ] Unmodified v0.9 ZIP must be imported as a fresh theme and compared to preview; file-patch acceptance is not equivalent.
- [ ] Real Shopify interactions and transactions must not be claimed from offline regression tests.
- [ ] Additional languages, selling plans, subscriptions, screen-reader audits, live cart-to-checkout and real 250+ catalog QA are outstanding.

## Live storefront QA runner (non-purchasing, v0.9)
- [x] Guarded Playwright runner created in tests/live_storefront_smoke.py; preview_theme_id required.
- [x] Offline URL safety self-test passes; no merchant data changed.
- [ ] Real browser QA not run in current environment because Shopify preview host is unreachable over network.
- [ ] Run against an in-stock product in an unpublished test theme for product→cart→quantity→checkout handoff; --verify-checkout only opens checkout and never submits payment.


## v0.10 keyframe and fresh-import update — 2026-11-21
- [x] Fresh unmodified v0.9 ZIP imported into a new Shopify UNPUBLISHED theme with 27 files and zero themeCreate userErrors.
- [x] v0.9 homepage and product preview screenshot requests completed.
- [x] Shared bounded custom keyframe model (2–12 frames per layer, 0–100% offsets).
- [x] Editor authoring controls, diamond timeline markers and keyboard scrubber.
- [x] Custom CSS motion exported to Shopify from same validated renderer as preview.
- [x] Reduced-motion support and strict numeric validation tested locally.
- [ ] Actual customer-browser cart and checkout handoff QA (no interactive storefront control in connection).
- [ ] Fresh v0.10 ZIP import and 250+ real Shopify variant product test.
- [ ] Advanced grouped/scroll-scrub animations and full production app backend.

## v0.11 app development foundation — 2026-11-21
- [x] Standalone signed Shopify App Bridge ID-token verification (HS256, time, issuer, audience and destination).
- [x] Tenant-isolated AES-256-GCM development draft CRUD with optimistic revisions.
- [x] HMAC-signed webhook endpoint; tenant ID cross-checked against signed payload to reject cross-shop erasure.
- [x] Single-process shop-level mutex for writes/erasure, tampering tests, HTTP integration tests.
- [ ] Official Shopify app installation, token exchange, merchant sessions, webhooks registration, real multi-tenant database and hosting.
- [ ] Real cart and checkout browser interaction on a Shopify test store.
- [ ] Signed webhook replay/idempotency durability, production retention and audit controls.
