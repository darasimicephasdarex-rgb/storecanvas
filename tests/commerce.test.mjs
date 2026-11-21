import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {compileShopifyTheme} from '../engine/theme.mjs';
import {PRODUCT_SECTION,CART_SECTION,COMMERCE_JS} from '../engine/commerce.mjs';
const fixture=JSON.parse(fs.readFileSync(new URL('./fixtures/project.json',import.meta.url)));
const files=compileShopifyTheme(fixture);
test('Native product form retains server-selected variant and price',()=> {
 for(const x of ['product.selected_or_first_available_variant','active_variant.price | money','name="id"','name="add"',"form 'product', product",'form.errors | default_errors']) assert.ok(PRODUCT_SECTION.includes(x),x);
});
test('High-variant picker uses option values instead of truncated variants',()=>{
 for(const x of ['product.options_with_values','option.values','option_value.selected','option_value.id','option_value.product_url','data-sc-option-value-id','data-sc-option-index','quantity_rule.min'])assert.ok(PRODUCT_SECTION.includes(x),x);
 assert.doesNotMatch(PRODUCT_SECTION,/for\s+variant\s+in\s+product\.variants/);
 assert.doesNotMatch(PRODUCT_SECTION,/product\s*\|\s*json/);
});
test('Ajax variant refresh protects native cart form and supports retry',()=>{
 for(const x of ['fetch(','option_values','section_id','preview_theme_id','AbortController','root.replaceWith(updated)','new DOMParser()','aria-busy','url.origin!==location.origin','scSelectionError','data-sc-retry','event.preventDefault()'])assert.ok(COMMERCE_JS.includes(x),x);
 assert.equal(files.get('assets/storecanvas-commerce.js'),COMMERCE_JS);
 assert.match(PRODUCT_SECTION,/storecanvas\.product\.unavailable/);
 assert.doesNotMatch(PRODUCT_SECTION,/product\.variants\.first/);
});
test('Cart maintains Shopify native checkout and line updates',()=>{
 for(const x of ['routes.cart_url','name="checkout"','name="update"','name="updates[]"','item.url_to_remove','cart.total_price','cart.taxes_included'])assert.ok(CART_SECTION.includes(x),x);
});