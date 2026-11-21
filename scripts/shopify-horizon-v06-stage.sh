# Reproducible QA-only import for Horizon unpublished theme.
set -e
cat > sections/storecanvas-qa-product.liquid <<'SC_QA_END_sections_main-product_liquid'
<script src="{{ 'storecanvas-v06-commerce.js' | asset_url }}" defer></script>
{{ 'storecanvas-v06-commerce.css' | asset_url | stylesheet_tag }}
{% liquid
  assign active_variant = product.selected_or_first_available_variant
  if active_variant == blank
    assign active_variant = product.first_available_variant | default: product.variants.first
  endif
  assign active_image = active_variant.featured_image | default: product.featured_image
%}
<section class="sc-commerce sc-product-main" data-sc-product>
  <div class="sc-product-media">
    {% if active_image != blank %}
      {{ active_image | image_url: width: 1200 | image_tag: loading: 'eager', widths: '360, 720, 960, 1200', alt: product.title }}
    {% else %}
      <div class="sc-product-placeholder" role="img" aria-label="No product photograph available"></div>
    {% endif %}
  </div>
  <div class="sc-product-info">
    <h1>{{ product.title | escape }}</h1>
    {% if active_variant != blank %}
      <p class="sc-product-price" data-sc-price aria-live="polite">{{ active_variant.price | money }}</p>
    {% endif %}
    <div class="sc-product-description">{{ product.description }}</div>
    {% form 'product', product %}
      {{ form.errors | default_errors }}
      {% if active_variant != blank %}
        <label for="sc-variant-{{ section.id }}">Choose a variant</label>
        <select id="sc-variant-{{ section.id }}" name="id" data-sc-variant>
          {% for variant in product.variants %}
            {% assign variant_image = variant.featured_image | default: product.featured_image %}
            <option value="{{ variant.id }}" data-price="{{ variant.price | money | escape }}" data-available="{{ variant.available }}" data-min="{{ variant.quantity_rule.min | default: 1 }}" data-max="{{ variant.quantity_rule.max }}" data-increment="{{ variant.quantity_rule.increment | default: 1 }}" {% if variant_image != blank %}data-image="{{ variant_image | image_url: width: 1200 | escape }}"{% endif %} {% if variant.id == active_variant.id %}selected{% endif %} {% unless variant.available %}disabled{% endunless %}>{{ variant.title | escape }} — {{ variant.price | money }}{% unless variant.available %} (Sold out){% endunless %}</option>
          {% endfor %}
        </select>
        <label for="sc-qty-{{ section.id }}">Quantity</label>
        <input id="sc-qty-{{ section.id }}" data-sc-quantity type="number" name="quantity" min="{{ active_variant.quantity_rule.min | default: 1 }}" {% if active_variant.quantity_rule.max != blank %}max="{{ active_variant.quantity_rule.max }}"{% endif %} step="{{ active_variant.quantity_rule.increment | default: 1 }}" value="{{ active_variant.quantity_rule.min | default: 1 }}" required>
        <button class="sc-cta" type="submit" name="add" data-sc-add {% unless active_variant.available %}disabled{% endunless %}>{% if active_variant.available %}Add to cart{% else %}Sold out{% endif %}</button>
      {% else %}
        <p role="status">This product is unavailable.</p>
      {% endif %}
    {% endform %}
  </div>
</section>
{% schema %}{"name":"StoreCanvas product","settings":[],"presets":[{"name":"StoreCanvas product"}]}{% endschema %}
SC_QA_END_sections_main-product_liquid
cat > sections/storecanvas-qa-cart.liquid <<'SC_QA_END_sections_main-cart_liquid'
{{ 'storecanvas-v06-commerce.css' | asset_url | stylesheet_tag }}
<section class="sc-commerce sc-cart" aria-labelledby="sc-cart-title">
  <h1 id="sc-cart-title">Your cart</h1>
  {% if cart.item_count == 0 %}
    <p>Your cart is empty. <a href="{{ routes.all_products_collection_url }}">Continue shopping</a>.</p>
  {% else %}
    <form method="post" action="{{ routes.cart_url }}" id="sc-cart-form">
      {% for item in cart.items %}
        <div class="sc-cart-row">
          {% if item.image != blank %}{{ item.image | image_url: width: 180 | image_tag: loading: 'lazy', alt: item.product.title }}{% endif %}
          <div class="sc-cart-detail">
            <a href="{{ item.url }}">{{ item.product.title | escape }}</a>
            {% unless item.variant.title == 'Default Title' %}<p>{{ item.variant.title | escape }}</p>{% endunless %}
            <p>{{ item.final_line_price | money }}</p>
            {% for discount in item.line_level_discount_allocations %}
              <p class="sc-discount">{{ discount.discount_application.title | escape }}: -{{ discount.amount | money }}</p>
            {% endfor %}
            <a href="{{ item.url_to_remove }}" aria-label="Remove {{ item.product.title | escape }}">Remove</a>
          </div>
          <label class="sc-cart-quantity">Quantity
            <input type="number" name="updates[]" min="0" value="{{ item.quantity }}" aria-label="Quantity for {{ item.product.title | escape }}">
          </label>
        </div>
      {% endfor %}
      {% for discount in cart.cart_level_discount_applications %}
        <p class="sc-discount">{{ discount.title | escape }}: -{{ discount.total_allocated_amount | money }}</p>
      {% endfor %}
      <p class="sc-cart-subtotal">Subtotal: {{ cart.total_price | money }}</p>
      {% if cart.taxes_included %}<p>Taxes are included.</p>{% else %}<p>Taxes and shipping are calculated at checkout.</p>{% endif %}
      <div class="sc-cart-actions">
        <button type="submit" class="sc-cta sc-cta-secondary" name="update">Update cart</button>
        <button type="submit" class="sc-cta" name="checkout">Checkout</button>
      </div>
    </form>
  {% endif %}
</section>
{% schema %}{"name":"StoreCanvas cart","settings":[],"presets":[{"name":"StoreCanvas cart"}]}{% endschema %}
SC_QA_END_sections_main-cart_liquid
cat > sections/storecanvas-qa-collection.liquid <<'SC_QA_END_sections_main-collection_liquid'
{{ 'storecanvas-v06-commerce.css' | asset_url | stylesheet_tag }}
<div class="sc-commerce"><h1>{{ collection.title | escape }}</h1><div>{{ collection.description }}</div>{% paginate collection.products by 24 %}<div class="sc-commerce-grid">{% for p in collection.products %}<a href="{{ p.url }}">{% if p.featured_image %}{{ p.featured_image | image_url: width: 640 | image_tag: loading: 'lazy' }}{% endif %}<h2>{{ p.title | escape }}</h2><p>{{ p.price | money }}</p></a>{% endfor %}</div>{{ paginate | default_pagination }}{% endpaginate %}</div>
{% schema %}{"name":"StoreCanvas collection","settings":[],"presets":[{"name":"StoreCanvas collection"}]}{% endschema %}
SC_QA_END_sections_main-collection_liquid
cat > assets/storecanvas-v06-commerce.js <<'SC_QA_END_assets_storecanvas-commerce_js'
(()=>{'use strict';
const sync=form=>{const select=form.querySelector('[data-sc-variant]');if(!select)return;
const option=select.selectedOptions[0];if(!option)return;
const price=form.querySelector('[data-sc-price]');if(price)price.textContent=option.dataset.price||'';
const quantity=form.querySelector('[data-sc-quantity]');if(quantity){
const min=Math.max(1,Number(option.dataset.min)||1),step=Math.max(1,Number(option.dataset.increment)||1),max=Number(option.dataset.max);
quantity.min=String(min);quantity.step=String(step);
if(option.dataset.max && Number.isFinite(max) && max>0)quantity.max=String(max);else quantity.removeAttribute('max');
if(!Number.isFinite(Number(quantity.value))||Number(quantity.value)<min||(quantity.hasAttribute('max')&&Number(quantity.value)>max))quantity.value=String(min);
}
const available=option.dataset.available==='true';const add=form.querySelector('[data-sc-add]');if(add){add.disabled=!available;add.textContent=available?'Add to cart':'Sold out'}
const url=option.dataset.image;const img=form.querySelector('.sc-product-media img');if(url&&img){img.removeAttribute('srcset');img.removeAttribute('sizes');img.src=url;}
};
document.querySelectorAll('[data-sc-product]').forEach(sync);
document.addEventListener('change',event=>{const select=event.target.closest('[data-sc-variant]');if(!select)return;
const form=select.closest('[data-sc-product]');if(form)sync(form);
try{const url=new URL(location.href);url.searchParams.set('variant',select.value);history.replaceState(history.state,'',url.toString())}catch{}
});
})();
SC_QA_END_assets_storecanvas-commerce_js
cat > assets/storecanvas-v06-commerce.css <<'SC_QA_END_assets_storecanvas_css'
*,*::before,*::after{box-sizing:border-box}.sc-page{display:grid;gap:20px;max-width:1200px;margin:auto;padding:20px}.sc-section{position:relative;isolation:isolate}.sc-stage{height:var(--height);position:relative}.sc-layer{position:absolute;transform-origin:center}.sc-text{white-space:pre-wrap;line-height:1.1;overflow-wrap:anywhere}.sc-media,.sc-shape,.sc-container,.sc-slideshow{width:100%;height:100%;position:relative;overflow:hidden}.sc-media img,.sc-slide img{display:block;width:100%;height:100%;object-fit:cover}.sc-media-placeholder{display:block;width:100%;height:100%;background:linear-gradient(140deg,#a2c19b,#245034)}.sc-button{display:flex;align-items:center;justify-content:center;width:100%;min-height:44px;text-decoration:none;text-align:center;padding:10px}.sc-slide{position:absolute;inset:0;margin:0}.sc-slide[hidden]{display:none}.sc-slide figcaption{position:absolute;bottom:16px;left:16px;background:#143a2dda;color:white;padding:8px;border-radius:6px}.sc-slideshow button{position:absolute;z-index:1;top:50%;transform:translateY(-50%);min-width:44px;min-height:44px;background:#ffffffef;border:1px solid #678771;border-radius:50%;cursor:pointer}.sc-slideshow button[data-prev]{left:10px}.sc-slideshow button[data-next]{right:10px}.sc-slideshow button[data-pause]{top:auto;bottom:10px;left:50%;transform:translateX(-50%);border-radius:8px;font-size:12px}.sc-layer[data-hover=lift]:hover{translate:0 -5px}.sc-layer[data-hover=scale]:hover{scale:1.03}.sc-layer[data-hover=tilt]:hover{rotate:2deg}.sc-layer[data-motion=fade-up].sc-visible{animation:scFadeUp var(--sc-duration) ease-out var(--sc-delay) both}.sc-layer[data-motion=fade-in].sc-visible{animation:scFadeIn var(--sc-duration) ease-out var(--sc-delay) both}@keyframes scFadeUp{from{opacity:0;translate:0 16px}to{opacity:1;translate:0 0}}@keyframes scFadeIn{from{opacity:0}to{opacity:1}}.sc-layer:focus-within{outline:2px solid #28794a;outline-offset:2px}@media(min-width:701px) and (max-width:1040px){.sc-stage{height:var(--tablet)}}@media(max-width:700px){.sc-page{padding:12px;gap:12px}.sc-stage{height:var(--mobile)}}@media(prefers-reduced-motion:reduce){*,*::before,*::after{animation:none!important;transition:none!important;scroll-behavior:auto!important}}
@media(min-width:701px) and (max-width:1040px){#sc_xi7gz4z5 .sc-layer-sc_yynf54jn{left:4.909%;top:62.045px;width:39.091%;height:19.091px;}}
@media(max-width:700px){#sc_xi7gz4z5 .sc-layer-sc_yynf54jn{left:5.641%;top:48px;width:79.487%;height:24px;}}
@media(min-width:701px) and (max-width:1040px){#sc_xi7gz4z5 .sc-layer-sc_od8tke9z{left:5.067%;top:117px;width:54.667%;height:190px;}}
@media(max-width:700px){#sc_xi7gz4z5 .sc-layer-sc_od8tke9z{left:5.641%;top:94px;width:88.462%;height:175px;}}
@media(min-width:701px) and (max-width:1040px){#sc_xi7gz4z5 .sc-layer-sc_bozaxhga{left:4.909%;top:252.273px;width:42.727%;height:49.773px;}}
@media(max-width:700px){#sc_xi7gz4z5 .sc-layer-sc_bozaxhga{left:5.641%;top:286px;width:84.615%;height:90px;}}
@media(min-width:701px) and (max-width:1040px){#sc_xi7gz4z5 .sc-layer-sc_5mt6js9d{left:4.909%;top:328.636px;width:15.091%;height:32.727px;}}
@media(max-width:700px){#sc_xi7gz4z5 .sc-layer-sc_5mt6js9d{left:5.641%;top:389px;width:43.59%;height:49px;}}
@media(min-width:701px) and (max-width:1040px){#sc_xi7gz4z5 .sc-layer-sc_1aog3ax5{left:49.273%;top:12.273px;width:46.818%;height:368.182px;}}
@media(max-width:700px){#sc_xi7gz4z5 .sc-layer-sc_1aog3ax5{left:3.077%;top:454px;width:92.308%;height:300px;}}
@media(min-width:701px) and (max-width:1040px){#sc_xi7gz4z5 .sc-layer-sc_tgo60y92{left:73.364%;top:373.636px;width:20%;height:12.273px;}}
@media(max-width:700px){#sc_xi7gz4z5 .sc-layer-sc_tgo60y92{left:33.333%;top:730px;width:58.974%;height:20px;}}
@media(min-width:701px) and (max-width:1040px){#sc_eif15nb9 .sc-layer-sc_a3beu3ie{left:23.636%;top:17.727px;width:52.727%;height:16.364px;}}
@media(max-width:700px){#sc_eif15nb9 .sc-layer-sc_a3beu3ie{left:5.385%;top:30px;width:89.231%;height:22px;}}
@media(min-width:701px) and (max-width:1040px){#sc_eif15nb9 .sc-layer-sc_zqyis7ab{left:21.818%;top:45.682px;width:59.091%;height:68.864px;}}
@media(max-width:700px){#sc_eif15nb9 .sc-layer-sc_zqyis7ab{left:5.385%;top:71px;width:89.744%;height:105px;}}
@media(min-width:701px) and (max-width:1040px){#sc_eif15nb9 .sc-layer-sc_1rgv9lef{left:3.273%;top:137.727px;width:46.091%;height:205.909px;}}
@media(max-width:700px){#sc_eif15nb9 .sc-layer-sc_1rgv9lef{left:4.103%;top:168px;width:91.795%;height:335px;}}
@media(min-width:701px) and (max-width:1040px){#sc_eif15nb9 .sc-layer-sc_q0z1m618{left:0%;top:0px;width:100%;height:205.909px;}}
@media(max-width:700px){#sc_eif15nb9 .sc-layer-sc_q0z1m618{left:0%;top:0px;width:100%;height:335px;}}
@media(min-width:701px) and (max-width:1040px){#sc_eif15nb9 .sc-layer-sc_aqlwhpf9{left:4.734%;top:161.591px;width:88.757%;height:34.773px;}}
@media(max-width:700px){#sc_eif15nb9 .sc-layer-sc_aqlwhpf9{left:5.307%;top:266px;width:89.385%;height:45px;}}
@media(min-width:701px) and (max-width:1040px){#sc_eif15nb9 .sc-layer-sc_9zkt3by7{left:51.727%;top:137.727px;width:21.455%;height:204.545px;}}
@media(max-width:700px){#sc_eif15nb9 .sc-layer-sc_9zkt3by7{left:4.103%;top:520px;width:43.333%;height:260px;}}
@media(min-width:701px) and (max-width:1040px){#sc_eif15nb9 .sc-layer-sc_cu6mybh7{left:74.818%;top:137.727px;width:22.273%;height:204.545px;}}
@media(max-width:700px){#sc_eif15nb9 .sc-layer-sc_cu6mybh7{left:52.051%;top:520px;width:43.846%;height:260px;}}
@media(min-width:701px) and (max-width:1040px){#sc_eif15nb9 .sc-layer-sc_eb02mool{left:54%;top:349.091px;width:38.182%;height:15.682px;}}
@media(max-width:700px){#sc_eif15nb9 .sc-layer-sc_eb02mool{left:6.154%;top:805px;width:87.179%;height:25px;}}
@media(min-width:701px) and (max-width:1040px){#sc_gh522eyf .sc-layer-sc_qtsfuy57{left:3.545%;top:25.227px;width:45%;height:270.682px;}}
@media(max-width:700px){#sc_gh522eyf .sc-layer-sc_qtsfuy57{left:4.103%;top:28px;width:91.538%;height:347px;}}
@media(min-width:701px) and (max-width:1040px){#sc_gh522eyf .sc-layer-sc_e42h95y6{left:53.273%;top:66.136px;width:34.545%;height:17.045px;}}
@media(max-width:700px){#sc_gh522eyf .sc-layer-sc_e42h95y6{left:6.41%;top:415px;width:87.179%;height:25px;}}
@media(min-width:701px) and (max-width:1040px){#sc_gh522eyf .sc-layer-sc_vv8mwvkk{left:52.818%;top:105px;width:39.636%;height:92.045px;}}
@media(max-width:700px){#sc_gh522eyf .sc-layer-sc_vv8mwvkk{left:6.41%;top:450px;width:85.641%;height:148px;}}
@media(min-width:701px) and (max-width:1040px){#sc_gh522eyf .sc-layer-sc_4ug88809{left:53.273%;top:213.409px;width:37.636%;height:47.727px;}}
@media(max-width:700px){#sc_gh522eyf .sc-layer-sc_4ug88809{left:6.41%;top:617px;width:86.41%;height:105px;}}
@media(min-width:701px) and (max-width:1040px){#sc_gh522eyf .sc-layer-sc_8p0o5a21{left:53.273%;top:270px;width:17.273%;height:32.727px;}}
@media(max-width:700px){#sc_gh522eyf .sc-layer-sc_8p0o5a21{left:6.41%;top:743px;width:50.256%;height:49px;}}
body{margin:0;color:#183522;background:#fff;font-family:Arial,sans-serif}
.sc-site-header,.sc-site-footer{padding:18px max(18px,4vw);display:flex;align-items:center;justify-content:space-between;gap:24px;background:#f4f6f0;color:#183522}
.sc-site-nav{display:flex;flex-wrap:wrap;gap:18px}.sc-site-nav a{text-decoration:none;color:inherit}
.sc-commerce{max-width:1150px;margin:30px auto;padding:24px}.sc-commerce-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:24px}
.sc-commerce-grid img,.sc-product-main img{width:100%;height:auto;object-fit:cover}.sc-commerce a{color:inherit}.sc-product-main{display:grid;grid-template-columns:1fr 1fr;gap:48px}
.sc-cta{display:inline-flex;align-items:center;justify-content:center;min-height:44px;border:0;border-radius:8px;background:#245538;color:white;padding:12px 24px;text-decoration:none;font-weight:700}
.sc-commerce :is(input,select,button){font:inherit;max-width:100%}.sc-commerce input[type=number]{width:72px}.sc-commerce form{display:grid;gap:12px}.sc-product-price{font-size:1.5rem;font-weight:700}.sc-commerce label{font-weight:600}.sc-commerce button:disabled{opacity:.55;cursor:not-allowed}.sc-cart-actions{display:flex;flex-wrap:wrap;gap:12px}.sc-cta-secondary{background:#e1e7df;color:#183522}.sc-discount{color:#236643}.sc-product-placeholder{height:350px;background:#e7ecdf}
.sc-cart-row{display:flex;align-items:center;gap:22px;border-bottom:1px solid #ddd;padding:18px 0}.sc-cart-row img{width:84px;height:98px;object-fit:cover}
@media(max-width:700px){.sc-product-main{grid-template-columns:1fr}.sc-site-header{align-items:flex-start;flex-direction:column}}

SC_QA_END_assets_storecanvas_css
cat > templates/product.storecanvas-qa.json <<'SC_QA_JSON_product'
{"sections":{"main":{"type":"storecanvas-qa-product","settings":{}}},"order":["main"]}
SC_QA_JSON_product
cat > templates/cart.storecanvas-qa.json <<'SC_QA_JSON_cart'
{"sections":{"main":{"type":"storecanvas-qa-cart","settings":{}}},"order":["main"]}
SC_QA_JSON_cart
cat > templates/collection.storecanvas-qa.json <<'SC_QA_JSON_collection'
{"sections":{"main":{"type":"storecanvas-qa-collection","settings":{}}},"order":["main"]}
SC_QA_JSON_collection
jq -e . templates/product.storecanvas-qa.json
jq -e . templates/cart.storecanvas-qa.json
jq -e . templates/collection.storecanvas-qa.json
wc -c sections/storecanvas-qa-*.liquid templates/*.storecanvas-qa.json assets/storecanvas-v06-commerce.*