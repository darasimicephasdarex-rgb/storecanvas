# StoreCanvas — Railway deployment runbook

**Prepared, not deployed:** This source requires Shopify Dev Dashboard app registration and a Railway project before the app can be installed.

## Railway project from GitHub

1. Register an embedded **StoreCanvas Studio** app in [Shopify Dev Dashboard](https://dev.shopify.com/dashboard). Save the Client ID and Client Secret in a secret manager; never put secrets in GitHub.
2. Create a Railway project from the private `darasimicephasdarex-rgb/storecanvas` GitHub repository. Select the reviewed `develop/storecanvas-v0.4` branch (currently the code branch); main still has only introductory content.
3. Create a single Node service. Attach a **persistent volume mounted at `/data`**. Use exactly one replica because the encrypted-file store is single-instance.
4. Generate a public Railway HTTPS domain and configure the Shopify app URL to `https://<your-domain>/app/`. Configure the app in Dev Dashboard; Shopify app must use a real HTTPS URL.
5. Add these Railway environment variables using the private Variables interface (not a committed .env):
   - `NODE_ENV=production`
   - `SHOPIFY_API_KEY` — Shopify app Client ID
   - `SHOPIFY_API_SECRET` — Shopify app Client Secret
   - `STORECANVAS_STORAGE_KEY` — new random 32-byte AES key encoded as 64 hexadecimal characters; back this up securely
   - `STORECANVAS_DATA_DIR=/data/storecanvas`

   Railway normally supplies `PORT` and `RAILWAY_VOLUME_MOUNT_PATH`; the production server binds to `0.0.0.0`. If the volume or credentials are missing, startup fails intentionally.

6. Railway uses `railway.json`: `npm start`, health check `/healthz`, one replica, restart on failure.
7. Configure the Shopify app's webhook endpoint `https://<your-domain>/webhooks/shopify` for `app/uninstalled`, `shop/redact`, `customers/data_request`, and `customers/redact`. Match the `shopify.app.example.toml` reference and test webhook delivery.

## Real deployment acceptance tests

- Confirm the **real** Railway `/healthz` returns 200.
- Install in a Shopify **development store** and verify App Bridge ID token, server token exchange, catalog access and project Cloud Save.
- Restart the Railway service; confirm projects are retained on `/data`.
- Verify signed uninstall and erasure callbacks delete data only for the correct shop.
- Test backup and key recovery, role permissions, and checkout handoff separately.
- Never deploy production theme publishing before full storefront tests and user approval.

## Security and costs

The current encrypted file backend is a **controlled beta** single-instance design, not a production multi-merchant database. Move to a transactional managed DB with backups and tested restore before public SaaS. Railway currently offers trial usage; future hosting can cost money. Review charges and spending limits before creating or upgrading paid resources.
