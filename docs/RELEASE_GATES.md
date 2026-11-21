# StoreCanvas v0.4 release gates

## Verified locally
- Source-specific compatibility validation for v0.3 designs
- Semantic HTML preview compiler for static, image, button, container and slideshow nodes
- Escaping of authored text and safe URL protocol validation
- Breakpoint CSS generation, parent cycle and size checks
- Reduced motion, slideshow pause controls and keyboard-accessible buttons
- Node.js built-in test runner (no paid or runtime dependencies)

## Must pass before production
- Validate the **actual exported Shopify ZIP** with Shopify Theme Check and a real unpublished theme.
- Confirm product options, inventory, cart/checkout, locale, accessibility and theme-editor interactions.
- Harden uploads, data URLs, media sizing, input parsing and stored-content limits.
- Integrate the validated engine into the editor and exporter; existing v0.3 exporter remains separate.
- Add browser integration and visual regression tests at 390/768/1440px.
- Validate an app-specific installation, sessions, tenant isolation, compliance webhooks and data deletion.
- Verify API permissions for any automated theme writes; request exemption where necessary.
- Configure live hosting, observability, backups and recovery.
- Require explicit merchant approval before publishing the live theme.

## Restrictions
GitHub branch pushes and commits are development artifacts, not Shopify production deployment.
The connected store's unpublished Horizon test theme is not the same code path as the offline exported ZIP.
Never claim a production release from passing unit tests alone.
