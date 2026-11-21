# Shopify compatibility QA — 2026-11-21

## Connected store, safety boundaries
- Connected merchant: B-Bless Collections.
- Horizon: **UNPUBLISHED**, used for test-only files.
- `malcom-s-prototype`: **MAIN**, unchanged.
- No orders, real checkout, variant quantities, prices, inventory, billing or theme publication were changed.

## v0.5 homepage import — verified on Shopify
- Imported the exact generated `sections/storecanvas-home.liquid` body into an independent Horizon test section and injected the two generated static assets `storecanvas.css` and `storecanvas.js` as section assets.
- Imported the four generated SVG art assets.
- Prepended the new section on Horizon's homepage while retaining other sections.
- Shopify accepted **eight** changed theme files (`theme_commit` `pushErrors=[]`).
- Desktop and mobile storefront screenshot requests completed (1440px and 390px). That alone does not verify pixels, accessibility or JavaScript behavior.
- This is not a complete ZIP install; the independent theme layout, cart and product templates were not replaced.

## v0.6 commerce exporter changes — saved to Shopify test theme
- Selected-variant-aware initial image and price, with URL deep links.
- Variants display availability, selected price, minimum/maximum/increment quantity rules.
- Progressive JS updates price, image, quantity rules and add-to-cart state on variant change. No custom checkout or API credentials.
- Cart has native update and checkout form, remove links, line discounts and tax notice.
- Added testing for exported Liquid and native JS behavior.

## v0.6 Shopify acceptance result
- Saved the v0.6 generated `main-product.liquid`, `main-cart.liquid` and `main-collection.liquid` in the **unpublished Horizon theme** as isolated `storecanvas-qa-*` sections and alternate `?view=storecanvas-qa` templates, without changing the existing default product/cart/collection templates.
- Installed the generated product selection script and stylesheet as test-only assets.
- Shopify accepted all **eight** changed files (`theme_commit` reported no push errors).
- Shopify product preview screenshot requests completed at 1440px and 390px for an actual product with three variants; empty cart and collection previews also completed. These are rendering requests, not proof of purchase, successful add-to-cart or pixel-perfect appearance.
- v0.6 local validation: 18 Node tests passed and Chromium smoke test passed including changing a variant and checking price, button disablement, quantity constraints and image srcset invalidation.

## Still NOT verified
- Actual checkout completed from an exported StoreCanvas theme (do not place a real order for QA).
- High-variant products (250+), selling plans, accessibility of all variants and media types.
- Theme Check on the **complete independent v0.6 ZIP**; performance, cross-browser and theme store compliance.
- Shopify public app OAuth, multi-tenant backend, app extension and API scope authorization.
