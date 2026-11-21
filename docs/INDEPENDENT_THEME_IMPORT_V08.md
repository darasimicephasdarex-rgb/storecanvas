# StoreCanvas v0.8 — Independent Shopify theme acceptance

Date: 2026-11-21

## Import evidence
- The exact StoreCanvas v0.7 26-file generated ZIP was uploaded to Shopify Files and returned a READY CDN URL.
- Shopify Admin GraphQL `themeCreate(source: ..., name: ..., role: UNPUBLISHED)` returned a new theme with **UNPUBLISHED** role and **zero userErrors**.
- Shopify theme inspection confirmed the imported `layout/theme.liquid`, `templates/index.json`, `templates/product.json`, `sections/storecanvas-home.liquid`, `sections/main-product.liquid`, `sections/main-cart.liquid`, and commerce JS asset exist.
- Imported QA theme numeric ID: `169116696741` (for testing only).
- The existing connected live `malcom-s-prototype` theme was not modified or published.

## v0.8 upgrade
- The imported theme's `sections/main-product.liquid`, `assets/storecanvas-commerce.js`, and `assets/storecanvas.css` were updated to v0.8.
- Shopify `theme_commit` saved all three changed files with `pushErrors=[]`.
- Shopify generated preview captures: homepage desktop 1440px and mobile 390px, product desktop/mobile, collection desktop, cart mobile.
- Preview URL: https://6hxk1p-zz.myshopify.com/?preview_theme_id=169116696741

## Verification boundaries
A screenshot is proof a page rendered, **not** proof that add-to-cart, checkout, keyboard interaction or payment worked.
The v0.7 ZIP and subsequent v0.8 patch are **not** equivalent to importing a fresh v0.8 ZIP without post-processing.
No orders were placed, no catalog data was changed, and no live theme publishing occurred.

## Remaining requirements
- Browser-based option-change and cart/checkout handoff on an isolated developer store.
- Actual 250+ variant product and combined listing cases.
- Full v0.8 ZIP imported as a new separate unpublished theme and audited.
- Shopify App OAuth, multi-merchant access control, approved scopes, rollback, billing, monitoring and production deployment.
