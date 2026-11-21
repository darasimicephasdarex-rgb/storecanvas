"""Manual, NON-PURCHASING Shopify preview smoke test for StoreCanvas.
Requires free Playwright + Chromium only for the live test, not for --self-test.
"""
import argparse
import re
import sys
from urllib.parse import urlsplit, urlunsplit, parse_qs, urlencode


def preview_paths(preview, handle):
    url = urlsplit(preview)
    if url.scheme != 'https' or not (url.hostname or '').endswith('.myshopify.com') or url.username or url.password or url.port:
        raise ValueError('Use an HTTPS *.myshopify.com theme preview URL without credentials')
    theme = parse_qs(url.query).get('preview_theme_id', [''])[0]
    if not (theme.isdecimal() and len(theme) >= 7):
        raise ValueError('Missing preview_theme_id: refusing to test the live theme')
    if not re.fullmatch(r'[a-z0-9]+(?:-[a-z0-9]+)*', handle):
        raise ValueError('Invalid product handle')
    origin = urlunsplit((url.scheme, url.netloc, '', '', ''))
    return f'{origin}/products/{handle}?{urlencode({"preview_theme_id":theme})}', f'{origin}/cart?{urlencode({"preview_theme_id":theme})}'


def self_test():
    product, cart = preview_paths('https://demo.myshopify.com/?preview_theme_id=12345678', 'test-product')
    assert product == 'https://demo.myshopify.com/products/test-product?preview_theme_id=12345678'
    assert cart == 'https://demo.myshopify.com/cart?preview_theme_id=12345678'
    for url in ['http://demo.myshopify.com/?preview_theme_id=12345678', 'https://demo.myshopify.com/', 'https://example.com/?preview_theme_id=12345678']:
        try: preview_paths(url, 'test-product')
        except ValueError: pass
        else: raise AssertionError('Unsafe URL allowed')
    for handle in ['../../cart', 'bad?checkout', '/collections/all']:
        try: preview_paths('https://demo.myshopify.com/?preview_theme_id=12345678', handle)
        except ValueError: pass
        else: raise AssertionError('Unsafe handle allowed')
    print('PASS: preview URL guard; no network or Shopify store writes')


def run(preview, handle, checkout=False):
    product_url, cart_url = preview_paths(preview, handle)
    try: from playwright.sync_api import sync_playwright
    except ImportError as exc: raise RuntimeError('Install free Playwright + Chromium') from exc
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width':390, 'height':844})
        page = context.new_page()
        try:
            response = page.goto(product_url, wait_until='domcontentloaded', timeout=45000)
            if response is None or response.status >= 400: raise RuntimeError('Product preview HTTP failure')
            product = page.locator('[data-sc-product]').first
            product.wait_for(state='visible', timeout=20000)
            form = product.locator('form[action*="/cart/add"]')
            if not form.count(): raise RuntimeError('Native Shopify product form missing')
            variant = product.locator('[data-sc-variant-id]').input_value()
            button = product.locator('[data-sc-add]')
            if not variant.isdecimal() or not button.is_enabled(): raise RuntimeError('Use an in-stock test product')
            print('PASS: product and valid variant form')
            button.click()   # Shopify native cart submit, no custom checkout transaction
            page.goto(cart_url, wait_until='domcontentloaded', timeout=45000)
            row = page.locator('.sc-cart-row').first
            row.wait_for(state='visible', timeout=20000)
            qty = row.locator('input[name="updates[]"]')
            qty.fill('2')
            page.locator('button[name="update"]').click()
            page.goto(cart_url, wait_until='domcontentloaded', timeout=45000)
            if page.locator('.sc-cart-row').first.locator('input[name="updates[]"]').input_value() != '2':
                raise RuntimeError('Cart update did not persist')
            print('PASS: native add-to-cart and quantity update')
            if checkout:
                page.locator('button[name="checkout"]').click()
                page.wait_for_load_state('domcontentloaded', timeout=45000)
                target = urlsplit(page.url)
                if 'checkout' not in (target.hostname or '') and 'checkout' not in target.path:
                    raise RuntimeError('Checkout handoff not reached')
                print('PASS: checkout handoff only. No purchase or payment submitted.')
        finally:
            context.close()
            browser.close()


if __name__ == '__main__':
    ap = argparse.ArgumentParser(description='Non-purchasing, unpublished Shopify theme QA')
    ap.add_argument('--preview', help='Unpublished theme preview URL')
    ap.add_argument('--product-handle', help='In-stock product handle')
    ap.add_argument('--verify-checkout', action='store_true', help='Navigate to checkout only; do not purchase')
    ap.add_argument('--self-test', action='store_true', help='Offline URL safety test')
    args = ap.parse_args()
    if args.self_test: self_test()
    elif args.preview and args.product_handle:
        try: run(args.preview, args.product_handle, args.verify_checkout)
        except (ValueError, RuntimeError) as exc:
            print('NOT VERIFIED:', exc, file=sys.stderr)
            sys.exit(1)
    else: ap.error('Provide --preview and --product-handle or --self-test')
