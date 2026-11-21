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
