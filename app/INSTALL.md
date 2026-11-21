# StoreCanvas v0.12 developer installation instructions

**Current state: tested source scaffold; it is not yet a registered or deployed Shopify app.**

1. Register a Shopify app in the Dev Dashboard that you own, obtaining the client ID and API secret. Neither value belongs in Git.
2. Link the app using Shopify CLI (for example, `shopify app config link`), referencing `shopify.app.example.toml`. Set the HTTPS application URL ending with `/app/`. Review current CLI manifest syntax and webhook configuration.
3. Set `SHOPIFY_API_KEY`, `SHOPIFY_API_SECRET`, `STORECANVAS_STORAGE_KEY` (a unique random 32-byte key) and `STORECANVAS_DATA_DIR` using local environment variables or your hosting secret manager.
4. Run `npm run app:dev` behind an HTTPS development tunnel, then install it on a development store and open the App Home in Shopify Admin.
5. App Bridge supplies signed ID tokens. The server validates them and exchanges them for a read-only offline token; Shopify API tokens stay encrypted on the server.
6. Create a cloud project, open its full visual editor, save, reload and verify its revision; test shop isolation and uninstall cleanup.
7. **Before deployment:** replace local single-instance files with a transactional managed database and central KMS, configure backups, rate limits, observability, webhook idempotency, shop deletion, compliance review and multi-store real-session tests.
8. **Before storefront publishing:** complete actual product/cart/checkout QA, permission/extension review, change preview, merchant approval, backups and rollback testing. Production deployment and any App Store listing need review.

Only `read_products` is requested; no `write_themes` scope or live theme writes are performed. No real merchant credentials or hosting have been configured in the repository. No paid services are started.
