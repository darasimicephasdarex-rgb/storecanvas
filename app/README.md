# StoreCanvas embedded-app API foundation (v0.11)

**Status: standalone development service, not a deployed or installable Shopify app.**

This authenticated development backend is intentionally small and uses Node standard libraries only. Run `node app/server/serve.mjs` after configuring `SHOPIFY_API_KEY`, `SHOPIFY_API_SECRET`, `STORECANVAS_STORAGE_KEY`, and `STORECANVAS_DATA_DIR` as environment variables. Use `app/.env.example` only as a template; no secrets have been committed.

## Request contract

The server accepts `Authorization: Bearer <App Bridge ID token>` on **every** `/api/projects` request. It validates the HS256 signature, `aud`, `exp`, `nbf`, `iat`, `dest`, and `iss` claims before looking at project data. It derives the current shop from the verified token **not from a URL/query/header/body parameter**, so a user cannot list or modify another shop's projects by changing a `shop` parameter.

| Method | Route | Purpose |
|---|---|---|
| GET | `/healthz` | Process health only |
| GET | `/api/projects` | List current verified shop's projects |
| POST | `/api/projects` | Save validated v0.10 document; `{"document":{...}}` |
| GET | `/api/projects/:uuid` | Fetch own project's saved content |
| PUT | `/api/projects/:uuid` | Replace own draft with `If-Match: "<revision>"` |
| DELETE | `/api/projects/:uuid` | Delete own draft |
| POST | `/webhooks/shopify` | Raw HMAC-authenticated compliance/uninstall handler |

Documents reuse `engine/core.mjs`'s size, nesting, ID and media validation. On disk they are encrypted with AES-256-GCM, 12-byte random IVs, tag verification and tenant-bound associated data. Writes use temp-file + atomic rename; concurrent updates are protected by per-process locks and version checks. This is **single-instance development storage only**. For production replace it with a transactional managed database and centralized key management; encryption at rest does not provide multi-instance transaction guarantees, backups, or recovery.

For embedded requests, the Shopify App Bridge frontend should obtain a fresh ID token (or use App Bridge's same-origin `fetch` interceptor) before contacting these endpoints. **Do not send access tokens to the browser.** For Shopify Admin API work, use managed installation + token exchange or an official Shopify app template. This prototype does not implement installation, API token exchange, token refresh, Shopify CLI registration, production HTTPS, app extension deployment, or billing.

Shopify API scope selection: `read_products` can support catalog previews; **do not request protected `write_themes` unless granted Shopify's exemption**. Prefer theme app extensions for installed storefront components. This release does not publish or modify any theme.

## Webhooks and data protection

The raw request is verified with Shopify's base64 HMAC-SHA256 before reading the shop header. `app/uninstalled` and `shop/redact` erase that shop's local project data only when the HMAC-verified payload identifies the exact same shop as the request header. Both fields are checked to prevent header substitution. `customers/data_request` and `customers/redact` are acknowledged because this service deliberately stores no customer/transaction records. No webhook subscriptions are deployed yet; configure Shopify's mandatory compliance subscriptions when registering the app.

## Known gaps before a production service

- No deployed cloud database, multi-instance locking or backup/recovery.
- No officially registered Shopify app, installation, API token exchange or merchant login UI.
- No webhook replay table, durable queue or audit logging; privacy deletion handling needs legal/compliance review.
- No cloud host, DNS, TLS, observability, throttling, CSP for the eventual frontend or App Store approval.
- No hosted end-to-end API or tenant isolation audit with real merchant sessions.

Run `npm test` for the unit and HTTP integration checks. No paid service is required for the local tests.

**Concurrency boundary:** Per-shop writes and erasure use one in-process lock, preventing an in-flight write from restoring a shop after a deletion in this single-instance development process. This does not protect a multi-instance deployment.
