# StoreCanvas Shopify installation troubleshooting

## Shopify 404 before the app opens

StoreCanvas uses Shopify managed installation with App Bridge ID tokens and token exchange. It **does not** implement a legacy authorization-code OAuth callback. In the active Shopify Dev Dashboard version, `use_legacy_install_flow` must be **false**, or be omitted.

1. Open Dev Dashboard → Apps → StoreCanvas Studio → Versions → Create version.
2. Keep application URL `https://storecanvas-production.up.railway.app/app/`, embedded = true, scope `read_products`, API 2026-10.
3. Under API access, **uncheck Use legacy install flow**. Check the new version summary shows `use_legacy_install_flow: false`.
4. Release that version. Do not merely save it as a draft.
5. On StoreCanvas Studio's **Overview** (called **Home** in some UIs), go to the **Installs** card and select **Install app**. Do not try to install from an unregistered deep link in the development store.
6. Select your test store (e.g. Paws n Barks), approve access, then open StoreCanvas Studio from that store's Apps navigation.
7. If your test store doesn't appear in the picker, check that the store belongs to or is accessible to the same developer organization, your role has app installation permissions, and the app's distribution permits the store. Use Shopify CLI with the app linked to its Dev Dashboard configuration for development-store testing if appropriate.
8. If the storefront opens a Shopify Admin 404, verify the app is actually in Shopify Admin → Settings → Apps and sales channels, retry opening it from that list (avoid old Admin URLs), and check Dev Dashboard → StoreCanvas Studio → Logs and Railway service logs. A Railway 200 alone does not prove Shopify successfully installed the app.

## Why it matters

Shopify's managed installation handles scope grants directly and does **not** redirect through your app's OAuth code-grant callback. StoreCanvas authenticates requests from the embedded frame using `shopify.idToken()`, verifies the JWT in the backend, and exchanges the ID token for its offline access token.

Useful official documentation:
- https://shopify.dev/docs/apps/build/authentication-authorization/app-installation
- https://shopify.dev/docs/apps/build/cli-for-apps/app-configuration
- https://shopify.dev/docs/apps/build/dev-dashboard/create-apps-using-dev-dashboard

## Safety

Never share the app client secret, HMAC values, access tokens or encryption key in an issue, screenshot or GitHub. Leave the live Shopify theme unchanged during testing.
