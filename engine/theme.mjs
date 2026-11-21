/** StoreCanvas v0.5: one validated preview document => Shopify Online Store 2.0 package.
 * Pure ESM; no auth, network access, or live theme publishing. */
import {renderPreview, escapeHTML} from './core.mjs';
import {BUILTIN_IMAGES} from './builtin-images.mjs';
import {PRODUCT_SECTION, CART_SECTION, COMMERCE_JS} from './commerce.mjs';

const schema = json => `{% schema %}${JSON.stringify(json)}{% endschema %}`;
const section = (name, body) => `${body}\n${schema({name, settings:[], presets:[{name}]})}`;
const template = name => JSON.stringify({sections:{main:{type:name,settings:{}}},order:['main']});
const cssExtra = `
body{margin:0;color:#183522;background:#fff;font-family:Arial,sans-serif}
.sc-site-header,.sc-site-footer{padding:18px max(18px,4vw);display:flex;align-items:center;justify-content:space-between;gap:24px;background:#f4f6f0;color:#183522}
.sc-site-nav{display:flex;flex-wrap:wrap;gap:18px}.sc-site-nav a{text-decoration:none;color:inherit}
.sc-commerce{max-width:1150px;margin:30px auto;padding:24px}.sc-commerce-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:24px}
.sc-commerce-grid img,.sc-product-main img{width:100%;height:auto;object-fit:cover}.sc-commerce a{color:inherit}.sc-product-main{display:grid;grid-template-columns:1fr 1fr;gap:48px}
.sc-cta{display:inline-flex;align-items:center;justify-content:center;min-height:44px;border:0;border-radius:8px;background:#245538;color:white;padding:12px 24px;text-decoration:none;font-weight:700}
.sc-commerce :is(input,select,button){font:inherit;max-width:100%}.sc-commerce input[type=number]{width:72px}.sc-commerce form{display:grid;gap:12px}.sc-product-price{font-size:1.5rem;font-weight:700}.sc-commerce label{font-weight:600}.sc-commerce button:disabled{opacity:.55;cursor:not-allowed}.sc-cart-actions{display:flex;flex-wrap:wrap;gap:12px}.sc-cta-secondary{background:#e1e7df;color:#183522}.sc-discount{color:#236643}.sc-product-placeholder{height:350px;background:#e7ecdf}
.sc-visually-hidden{position:absolute!important;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
.sc-option-selectors{display:grid;gap:8px;min-width:0}.sc-option-selectors select{min-height:44px;width:100%}
.sc-cart-row{display:flex;align-items:center;gap:22px;border-bottom:1px solid #ddd;padding:18px 0}.sc-cart-row img{width:84px;height:98px;object-fit:cover}
@media(max-width:700px){.sc-product-main{grid-template-columns:1fr}.sc-site-header{align-items:flex-start;flex-direction:column}}
`;
const header = section('StoreCanvas header', `<header class="sc-site-header"><a href="{{ routes.root_url }}" aria-label="{{ shop.name | escape }} home"><strong>{{ shop.name | escape }}</strong></a><nav class="sc-site-nav" aria-label="Main navigation"><a href="{{ routes.root_url }}">Home</a><a href="{{ routes.all_products_collection_url }}">Shop</a><a href="{{ routes.cart_url }}">Cart ({{ cart.item_count }})</a></nav></header>`);
const footer = section('StoreCanvas footer', `<footer class="sc-site-footer"><span>&copy; {{ 'now' | date: '%Y' }} {{ shop.name | escape }}</span><a href="{{ routes.root_url }}">Home</a></footer>`);
const product = section('StoreCanvas product', PRODUCT_SECTION);
const collection = section('StoreCanvas collection', `<div class="sc-commerce"><h1>{{ collection.title | escape }}</h1><div>{{ collection.description }}</div>{% paginate collection.products by 24 %}<div class="sc-commerce-grid">{% for p in collection.products %}<a href="{{ p.url }}">{% if p.featured_image %}{{ p.featured_image | image_url: width: 640 | image_tag: loading: 'lazy' }}{% endif %}<h2>{{ p.title | escape }}</h2><p>{{ p.price | money }}</p></a>{% endfor %}</div>{{ paginate | default_pagination }}{% endpaginate %}</div>`);
const cart = section('StoreCanvas cart', CART_SECTION);
const page = section('StoreCanvas page', '<article class="sc-commerce"><h1>{{ page.title | escape }}</h1>{{ page.content }}</article>');
const search = section('StoreCanvas search', `<div class="sc-commerce"><h1>Search</h1><form method="get" action="{{ routes.search_url }}"><label for="sc-search">Search products</label><input id="sc-search" name="q" type="search" value="{{ search.terms | escape }}"><button class="sc-cta" type="submit">Search</button></form><div class="sc-commerce-grid">{% for p in search.results %}<a href="{{ p.url }}">{% if p.featured_image %}{{ p.featured_image | image_url: width: 640 | image_tag: loading: 'lazy' }}{% endif %}<h2>{{ p.title | escape }}</h2></a>{% endfor %}</div></div>`);
const notFound = section('StoreCanvas 404', '<div class="sc-commerce"><h1>Page not found</h1><a class="sc-cta" href="{{ routes.root_url }}">Go home</a></div>');

const ALLOWED_IMG = new Set(['png','jpeg','webp','gif']);
function decodeImage(uri){const match=/^data:image\/(png|jpeg|webp|gif);base64,([A-Za-z0-9+/=]+)$/i.exec(uri);
 if(!match || !ALLOWED_IMG.has(match[1].toLowerCase()))throw Error('Unsupported uploaded image');
 let raw;try{raw=atob(match[2]);}catch{throw Error('Invalid base64 image');}
 const bytes=Uint8Array.from(raw, c=>c.charCodeAt(0)); if(!bytes.length||bytes.length>700000)throw Error('Uploaded image too large for ZIP export');
 const type=match[1].toLowerCase();
 const signatures={png:[137,80,78,71,13,10,26,10],jpeg:[255,216,255],gif:[71,73,70,56],webp:[82,73,70,70]};
 if(!signatures[type].every((n,i)=>bytes[i]===n))throw Error(`Invalid ${type} image signature`);
 if(type==='webp' && String.fromCharCode(...bytes.slice(8,12))!=='WEBP')throw Error('Invalid WebP signature');
 return {bytes, extension:type==='jpeg'?'jpg':type};
}
function replaceMedia(html,files){
 // Remove Liquid interpreter syntax from all merchant-authored content, before inserting trusted asset_url expressions.
 let result=html.replaceAll('{','&#123;').replaceAll('}','&#125;');
 const builtIn=/<span class="sc-media-placeholder" aria-hidden="true" data-sc-asset="([A-Za-z0-9_-]+)"><\/span>/g;
 result=result.replace(builtIn,(_,name)=>{const svg=BUILTIN_IMAGES[name];if(!svg)throw Error(`Unknown bundled asset: ${name}`);
 const filename=`storecanvas-${name}.svg`;files.set(`assets/${filename}`,svg);
 const view=svg.match(/viewBox="0 0 (\d+) (\d+)"/);
 const width=view?Number(view[1]):640,height=view?Number(view[2]):600;
 return `<img loading="lazy" decoding="async" width="${width}" height="${height}" alt="Botanical illustration" src="{{ '${filename}' | asset_url }}">`;});
 let uploaded=0;const assetNames=new Map();
 result=result.replace(/src="(data:image\/(?:png|jpeg|webp|gif);base64,[A-Za-z0-9+/=]+)"/gi,(original,url)=>{
   if(!assetNames.has(url)){
     const {bytes,extension}=decodeImage(url);const name=`storecanvas-upload-${++uploaded}.${extension}`;
     files.set(`assets/${name}`,bytes);assetNames.set(url,name);
   }
   const name=assetNames.get(url);return `src="{{ '${name}' | asset_url }}"`;
 });
 // Unresolved image data URLs would bloat templates or leak data; block instead.
 if(/data:image\/|data-sc-asset=/.test(result))throw Error('Unresolved image source in export');
 // Shopify route objects preserve language and market-specific paths.
 return result.replace(/href="\/collections\/all"/g,'href="{{ routes.all_products_collection_url }}"')
   .replace(/href="\/cart"/g,'href="{{ routes.cart_url }}"');
}

export function compileShopifyTheme(project){
 const preview=renderPreview(project); // validates before any generated file
 const files=new Map(); const homeHtml=replaceMedia(preview.html,files);
 const liquid=section('StoreCanvas homepage',`<main class="sc-page">${homeHtml}</main>`);
 if(new TextEncoder().encode(liquid).length>230000)throw Error('Homepage exceeds safe Shopify section size; split it into pages');
 files.set('layout/theme.liquid',`<!doctype html><html lang="{{ request.locale.iso_code }}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>{{ page_title | escape }} – {{ shop.name | escape }}</title>{{ content_for_header }}{{ 'storecanvas.css' | asset_url | stylesheet_tag }}<script>window.SC_HAPTICS_ENABLED=${preview.document.settings.haptics?'true':'false'};</script><script src="{{ 'storecanvas.js' | asset_url }}" defer></script><script src="{{ 'storecanvas-commerce.js' | asset_url }}" defer></script></head><body><a class="sc-skip" href="#MainContent">Skip to content</a>{% section 'storecanvas-header' %}<div id="MainContent">{{ content_for_layout }}</div>{% section 'storecanvas-footer' %}</body></html>`);
 files.set('assets/storecanvas.css',preview.css+cssExtra);files.set('assets/storecanvas.js',preview.js);files.set('assets/storecanvas-commerce.js',COMMERCE_JS);
 const sections={'storecanvas-home':liquid,'storecanvas-header':header,'storecanvas-footer':footer,'main-product':product,'main-collection':collection,'main-cart':cart,'main-page':page,'main-search':search,'main-404':notFound};
 for(const [name,body] of Object.entries(sections))files.set(`sections/${name}.liquid`,body);
 const templates={index:'storecanvas-home',product:'main-product',collection:'main-collection',cart:'main-cart',page:'main-page',search:'main-search','404':'main-404'};
 for(const [name,sectionName] of Object.entries(templates))files.set(`templates/${name}.json`,template(sectionName));
 files.set('config/settings_schema.json',JSON.stringify([{name:'theme_info',theme_name:'StoreCanvas Starter',theme_author:'StoreCanvas',theme_version:'0.8.0',theme_documentation_url:'https://shopify.dev/docs/storefronts/themes',theme_support_url:'https://shopify.dev/'}]));
 files.set('locales/en.default.json','{}');
 return files;
}
