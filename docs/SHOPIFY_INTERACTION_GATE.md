# Shopify interactive-commerce release gate

**Status: Not passed.** Connection exposes theme reads/writes and Shopify Admin GraphQL,
but it does not supply a customer-browser action for completing an actual add-to-cart
and checkout-handoff flow. Preview screenshots are not proof of clicking controls.

Read-only verification: v0.9 complete ZIP accepted as new UNPUBLISHED theme, with
27 files; homepage/product previews were generated.

## Required end-to-end scenarios before production

1. In an isolated development store, open unpublished StoreCanvas theme preview.
2. Select each option of an available multi-variant product and verify price,
   availability, quantity rules, variant ID and media change correctly.
3. Attempt an unavailable combination. Purchase submission must remain disabled.
4. Add an available variant to cart and confirm the same variant/quantity.
5. Edit quantity and remove items; totals, tax notices, discounts and live region
   announcements must remain correct.
6. Use Checkout CTA and verify a legitimate Shopify checkout handoff, without
   placing a paid order or submitting a real payment.
7. Repeat for keyboard navigation, screen-reader behavior, mobile touch,
   translated locales and high-variant/combined-listing products.
8. Capture screenshots and logs; fix failures and rerun theme check.

Do not mark this gate passed based on offline simulation or admin-data reads.
