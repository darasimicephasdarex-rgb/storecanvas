# StoreCanvas v0.5 release gates (November 21, 2026)

Checked = supported by a code change and a corresponding test or Shopify connector result; not a promise of a complete commercial product.

## Foundation and reproducibility
- [x] GitHub repository, development branch and draft PR
- [x] Source for freeform canvas, responsive positions, nested layers, motion and slideshows
- [x] Validated v0.3/v0.4 design schema and safe URL/document limits
- [x] Shared homepage renderer for browser preview and Shopify export
- [x] Exported illustration/upload images packaged as theme assets
- [x] ZIP packer with CRC32 and unit checks
- [x] Browser-compatible runtime generated from engine modules without dependencies
- [x] Browser editor wired to the unified compiler
- [ ] Latest GitHub Actions CI green (verify after push)

## Shopify verification
- [x] Previous isolated freeform section on unpublished Horizon test theme
- [ ] New v0.5 ZIP uploaded to Shopify test theme and validated with Theme Check
- [ ] Full product/variant/cart/checkout/SEO/localization/accessibility tests
- [ ] Multi-theme compatibility, responsive breakpoints and performance budgets
- [ ] Approved theme-write permissions where automated theme file modifications are used
- [ ] Versioned publishing, rollback and failure recovery

## Production application
- [ ] Shopify app scaffold and OAuth sessions
- [ ] Multi-tenant data separation, database and secure asset storage
- [ ] Compliance and uninstall webhooks, data deletion and privacy policy
- [ ] Observability, backups, rate limiting, audit logging and end-to-end QA
- [ ] Hosting and Shopify App Store approval (costs may apply)

## Notes
The new generated ZIP is a *separate starter theme*, not a patch for any merchant's existing live theme.
Passing Node or browser tests does not prove Shopify approval. The live B-Bless Collections theme was not modified.
