# StoreCanvas v0.8 — high-variant QA (21 November 2026)

## Implemented
- Uses Shopify `product.options_with_values`, not a capped iteration over `product.variants`.
- Server-rendered product sections keep the real variant ID, price, media, availability and quantity rules authoritative.
- Shopify Section Rendering API fetches `option_values` and `section_id`; preview parameters and focus are preserved.
- Requests are abortable; invalid combinations and failed requests prevent stale variant submissions; Retry selection recovers.
- Native Shopify add-to-cart and checkout forms remain intact.

## Evidence
- Local: 25 Node tests passed; generated 26-file theme and ZIP structural checks passed.
- Local offline Chromium: option change, two-section isolation, preview parameters, invalid variant, failure and retry passed.
- Remote CI/Theme Check and unpublished Shopify acceptance must be verified after this commit.

## Outstanding
- Real 250+ variants, real combined listing, selling plans, translations, independent ZIP import, and isolated checkout handoff.
- Public Shopify app authentication, billing, permissions, data isolation, backups and deployment.
- This is development code. Never modify or publish the connected live theme.
