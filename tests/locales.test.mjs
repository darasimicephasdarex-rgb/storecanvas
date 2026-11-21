import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {compileShopifyTheme} from '../engine/theme.mjs';
import {STORECANVAS_STRINGS,validateTranslations} from '../engine/locales.mjs';
import {PRODUCT_SECTION,CART_SECTION,COMMERCE_JS} from '../engine/commerce.mjs';
const sample=JSON.parse(fs.readFileSync(new URL('./fixtures/project.json',import.meta.url)));
const files=compileShopifyTheme(sample);
const get=(obj,key)=>key.split('.').reduce((o,k)=>o?.[k],obj);
const keys=[...new Set([...files].filter(([p])=>p.endsWith('.liquid')).flatMap(([,v])=>[...String(v).matchAll(/'storecanvas\.([a-z_]+\.[a-z_]+)'\s*\|\s*t/g)].map(m=>m[1])))];
test('locale dictionaries match keys and interpolation variables',()=>{
 assert.equal(validateTranslations(),true);
 for(const lang of ['en','es']){const catalog=JSON.parse(files.get(lang==='en'?'locales/en.default.json':'locales/es.json'));assert.deepEqual(catalog.storecanvas,STORECANVAS_STRINGS[lang]);for(const key of keys)assert.equal(typeof get(catalog.storecanvas,key),'string',key)}
 assert.ok(keys.length>=25);
});
test('Shopify forms use localized product, cart and navigation labels',()=>{
 for(const key of ['product.quantity','product.add_to_cart','product.sold_out','product.retry','product.selection_failed'])assert.ok(PRODUCT_SECTION.includes('storecanvas.'+key));
 for(const key of ['cart.title','cart.empty','cart.quantity_label','cart.checkout','cart.update'])assert.ok(CART_SECTION.includes('storecanvas.'+key));
 assert.ok(String(files.get('layout/theme.liquid')).includes('storecanvas.accessibility.skip_to_content'));
 assert.ok(String(files.get('sections/storecanvas-header.liquid')).includes('storecanvas.navigation.main'));
});
test('dynamic selection status uses the active Shopify translation',()=>{
 for(const k of ['loading','blocked','incomplete','updated','invalid','failed'])assert.ok(PRODUCT_SECTION.includes('data-sc-msg-'+k+'='));
 assert.ok(COMMERCE_JS.includes("const message=(root,key)=>root.dataset"));
 assert.ok(!COMMERCE_JS.includes("'Product options updated.'"));
});
