# StoreCanvas production release gates — v0.7 (Nov 21, 2026)

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
- [x] Local and CI Node tests (23), ZIP integrity and Chromium smoke test successful
- [x] GitHub CI passed on v0.7 Shopify Theme Check and unit tests; generated theme ZIP attached as QA artifact

## Shopify correctness
- [x] Previous freeform demonstration section successfully committed to unpublished Horizon theme
- [ ] **New v0.5 full-theme ZIP** uploaded and checked on an unpublished Shopify test theme
- [x] Official Shopify Theme Check passed on complete generated theme directory (error-level gate); all generated images have dimensions and known collection routes use Shopify route objects
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
- [x] v0.6 had 18 Node tests; v0.7 has 23 tests and a Chromium slideshow pause/focus/hover regression.
- [x] Complete independent theme directory passed official Shopify Theme Check.\n- [ ] Complete independent theme ZIP imported as a new unpublished Shopify theme (not just section-level QA).
- [ ] Verified variant add-to-cart, cart updates, checkout handoff in isolated dev store without real payment.
- [ ] High-variant products (250+) supported and audited.
- [ ] Accessible dynamic checkout, product media, translations and product forms fully implemented.

## v0.7 verification detail
- Official GitHub Actions Theme Check found seven missing image dimensions and two hardcoded route warnings; both generator defects were fixed and validated again.
- A reproducible build produces the same Shopify theme in `dist/shopify-theme` and `dist/storecanvas-theme.zip`; SHA-256 integrity manifest tests prevent silent file substitutions.
- Shopify theme lint passing does **not** prove all runtime commerce, payment, animation, accessibility, localization or independent theme installation paths.
- Slider autoplay now distinguishes explicit Pause from hover/focus/visibility pauses; it does not resume while another pause source remains active.
- CI artifacts are disposable development builds and must not be automatically published to customers.

## Motion-rendering gate
- [x] Fade, slide and zoom transitions implemented in storefront CSS and browser runtime (not just editor controls).
- [x] Inactive slideshow figures receive `aria-hidden=true` while active figures are perceivable.
- [x] Local Chromium test verifies autoplay, hover pause, keyboard focus pause, pointer/focus resume and explicit Pause/Play.
- [ ] Broader screen-reader audits, touch-device testing and large breakpoint visual regression remain outstanding.

## v0.8 verified release gates — 2026-11-21
- [x] Shopify 250+ variant strategy implemented with `product.options_with_values` and server-side option selection.
- [x] Invalid/stale purchase guard and manual retry implemented.
- [x] 25 local Node tests, offline Chromium regression and generated ZIP structure checks passed.
- [x] GitHub Actions CI and official Theme Check error gate passed on v0.8 commit `4a00b31f`.
- [x] Exact v0.7 26-file independent ZIP imported by Shopify `themeCreate`, with no user errors, as a new unpublished theme.
- [x] Imported theme's product section, CSS and JS upgraded to v0.8, saved without errors.
- [x] Desktop/mobile screenshot requests completed for homepage/product, plus collection desktop and cart mobile.
- [ ] Actual Shopify product option click, add-to-cart, cart quantity and checkout handoff verified on isolated development store.
- [ ] Full independent v0.8 ZIP import as one unmodified archive (v0.7 archive imported then upgraded in place).
- [ ] Real 250+ variants and combined listing tests, translated UI and selling-plan QA.
- [ ] Public app OAuth, data isolation, rollback, hosting, webhooks and production approval.
