import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {compileShopifyTheme} from '../engine/theme.mjs';
import {PRODUCT_SECTION,CART_SECTION,COMMERCE_JS} from '../engine/commerce.mjs';
const sample=JSON.parse(fs.readFileSync(new URL('./fixtures/project.json',import.meta.url)));
const files=compileShopifyTheme(sample);

test('Product form selects a specific variant and displays its Shopify price',()=>{
 const liquid=String(files.get('sections/main-product.liquid'));
 assert.match(liquid,/product\.selected_or_first_available_variant/);
 assert.match(liquid,/active_variant\.price \| money/);
 assert.doesNotMatch(liquid,/<p>\{\{ product.price \| money \}\}<\/p>/);
 assert.match(liquid,/<select[^>]*name="id"/);
 assert.match(liquid,/variant\.available/);
 assert.match(liquid,/\{% form 'product', product %\}/);
 assert.match(liquid,/form\.errors \| default_errors/);
});

test('Variant data supports price, availability, media, quantity rules and deep links',()=>{
 const liq=PRODUCT_SECTION;
 for(const part of ['data-price=','data-available=','data-min=','data-max=','data-increment=','variant_image | image_url','quantity_rule.min','quantity_rule.max']) assert.ok(liq.includes(part),part);
 const js=COMMERCE_JS;
 for(const part of ['data-sc-price','data-sc-variant','data-sc-quantity','data-sc-add','option.dataset.available','img.removeAttribute(\'srcset\')',"url.searchParams.set('variant'"]) assert.ok(js.includes(part),part);
 assert.equal(files.get('assets/storecanvas-commerce.js'),js);
 assert.ok(files.get('layout/theme.liquid').includes("{{ 'storecanvas-commerce.js' | asset_url }}"));
});

test('Cart uses native Shopify checkout and line update controls, removes and tax information',()=>{
 const liq=String(files.get('sections/main-cart.liquid'));
 for(const part of ['routes.cart_url','name="checkout"','name="update"','name="updates[]"','item.url_to_remove','cart.total_price','cart.taxes_included','line_level_discount_allocations']) assert.ok(liq.includes(part),part);
 assert.match(liq,/\{% for item in cart.items %\}/);
});

test('High-variant support and real checkout remain explicit non-production scope',()=>{
 assert.match(PRODUCT_SECTION,/product.variants/);
 assert.ok(!COMMERCE_JS.includes('fetch('),'Must not submit orders without native Shopify form');
 assert.ok(!CART_SECTION.includes('window.location=\'/checkout\''));
});
