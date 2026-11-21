export const PRODUCT_SECTION = String.raw`{% liquid
  assign active_variant = product.selected_or_first_available_variant
  assign active_image = active_variant.featured_image | default: product.featured_image
%}
<section class="sc-commerce sc-product-main" data-sc-product data-sc-section-id="{{ section.id }}" data-sc-product-url="{{ product.url | escape }}">
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
      <p class="sc-product-price" data-sc-price>{{ active_variant.price | money }}</p>
    {% else %}
      <p class="sc-product-price" data-sc-price>Combination unavailable</p>
    {% endif %}
    <div class="sc-product-description">{{ product.description }}</div>
    {% form 'product', product %}
      {{ form.errors | default_errors }}
      {% unless product.has_only_default_variant %}
        <div class="sc-option-selectors" data-sc-options>
          {% for option in product.options_with_values %}
            <label for="sc-option-{{ section.id }}-{{ option.position }}">{{ option.name | escape }}</label>
            <select id="sc-option-{{ section.id }}-{{ option.position }}" data-sc-option data-sc-option-index="{{ option.position }}">
              {% for option_value in option.values %}
                <option value="{{ option_value.name | escape }}" data-sc-option-value-id="{{ option_value.id }}" data-sc-product-url="{{ option_value.product_url | escape }}" {% if option_value.selected %}selected{% endif %}>{{ option_value.name | escape }}{% unless option_value.available %} — unavailable{% endunless %}</option>
              {% endfor %}
            </select>
          {% endfor %}
        </div>
      {% endunless %}
      <input data-sc-variant-id type="hidden" name="id" value="{% if active_variant != blank %}{{ active_variant.id }}{% endif %}">
      <label for="sc-qty-{{ section.id }}">Quantity</label>
      <input id="sc-qty-{{ section.id }}" data-sc-quantity type="number" name="quantity" min="{{ active_variant.quantity_rule.min | default: 1 }}" {% if active_variant.quantity_rule.max != blank %}max="{{ active_variant.quantity_rule.max }}"{% endif %} step="{{ active_variant.quantity_rule.increment | default: 1 }}" value="{{ active_variant.quantity_rule.min | default: 1 }}" required {% if active_variant == blank %}disabled{% endif %}>
      <button class="sc-cta" type="submit" name="add" data-sc-add {% unless active_variant.available %}disabled{% endunless %}>
        {% if active_variant == blank %}Unavailable{% elsif active_variant.available %}Add to cart{% else %}Sold out{% endif %}
      </button>
      <p class="sc-visually-hidden" data-sc-status role="status" aria-live="polite" aria-atomic="true"></p>
      <button type="button" class="sc-cta sc-cta-secondary" data-sc-retry hidden>Retry selection</button>
    {% endform %}
  </div>
</section>`;
export const CART_SECTION = String.raw`<section class="sc-commerce sc-cart" aria-labelledby="sc-cart-title">
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
</section>`;

export const COMMERCE_JS = String.raw`(()=>{'use strict';
const inflight=new WeakMap();
document.addEventListener('submit',event=>{const root=event.target.closest?.('[data-sc-product]');if(!root)return;const id=root.querySelector('[data-sc-variant-id]')?.value; if(root.getAttribute('aria-busy')==='true'||root.dataset.scSelectionError==='true'||!id){event.preventDefault();announce(root,'Select an available variant before adding to cart.');}});
document.addEventListener('click',event=>{const retry=event.target.closest?.('[data-sc-retry]');if(!retry)return;const selected=retry.closest('[data-sc-product]')?.querySelector('[data-sc-option]');selected?.dispatchEvent(new Event('change',{bubbles:true}));});
const selectValues=root=>[...root.querySelectorAll('[data-sc-option]')].map(el=>el.selectedOptions[0]?.dataset.scOptionValueId||'').filter(Boolean);
const announce=(root,message)=>{const el=root.querySelector('[data-sc-status]');if(el){el.textContent='';requestAnimationFrame(()=>{if(el.isConnected)el.textContent=message;});}};
const setLoading=(root,loading)=>{root.setAttribute('aria-busy',String(loading));const add=root.querySelector('[data-sc-add]');if(add){add.disabled=true;if(loading)add.textContent='Updating selection…';}};
const isValidQuantity=(field,n)=>{const min=Number(field.min)||1,max=field.hasAttribute('max')?Number(field.max):Infinity,step=Number(field.step)||1;return Number.isFinite(n)&&n>=min&&n<=max&&Math.abs((n-min)/step-Math.round((n-min)/step))<1e-8;};
document.addEventListener('change',async event=>{
  const selected=event.target.closest?.('[data-sc-option]');if(!selected)return;
  const root=selected.closest('[data-sc-product]');if(!root)return;
  const sectionId=root.dataset.scSectionId;
  const ids=selectValues(root);
  const optionCount=root.querySelectorAll('[data-sc-option]').length;
  const activeOption=selected.selectedOptions[0];
  if(!sectionId||ids.length!==optionCount||!ids.length){setLoading(root,false);announce(root,'Choose all product options.');return;}
  const previous=inflight.get(root);previous?.abort();
  const controller=new AbortController();inflight.set(root,controller);
  root.dataset.scSelectionError='true';
  root.querySelector('[data-sc-retry]')?.setAttribute('hidden','');
  setLoading(root,true);
  try{
    const incoming=activeOption?.dataset.scProductUrl||root.dataset.scProductUrl||location.pathname;
    const url=new URL(incoming,location.origin);
    if(url.origin!==location.origin)throw Error('External product URLs are not allowed');
    const current=new URL(location.href);
    for(const key of ['preview_theme_id','view'])if(current.searchParams.has(key))url.searchParams.set(key,current.searchParams.get(key));
    url.searchParams.delete('variant');
    url.searchParams.set('option_values',ids.join(','));
    url.searchParams.set('section_id',sectionId);
    const response=await fetch(url.toString(),{signal:controller.signal,headers:{Accept:'text/html'}});
    if(!response.ok)throw Error('Shopify variant section could not be loaded');
    const html=await response.text();if(html.length>2_000_000)throw Error('Shopify section response too large');
    if(controller.signal.aborted)return;
    const parsed=new DOMParser().parseFromString(html,'text/html');
    const updated=[...parsed.querySelectorAll('[data-sc-product]')].find(el=>el.dataset.scSectionId===sectionId);
    if(!updated)throw Error('Shopify response did not include the product section');
    const oldQuantity=root.querySelector('[data-sc-quantity]');const nextQuantity=updated.querySelector('[data-sc-quantity]');
    if(oldQuantity&&nextQuantity&&isValidQuantity(nextQuantity,Number(oldQuantity.value)))nextQuantity.value=oldQuantity.value;
    const targetIndex=selected.dataset.scOptionIndex;
    root.replaceWith(updated);
    const nextSelect=[...updated.querySelectorAll('[data-sc-option]')].find(el=>el.dataset.scOptionIndex===targetIndex);
    nextSelect?.focus({preventScroll:true});
    url.searchParams.delete('section_id');
    history.replaceState(history.state,'',url.pathname+url.search+url.hash);
    updated.setAttribute('aria-busy','false');
    announce(updated,updated.querySelector('[data-sc-variant-id]')?.value?'Product options updated.':'This combination is unavailable.');
  }catch(error){
    if(controller.signal.aborted)return;
    setLoading(root,false);
    root.dataset.scSelectionError='true';
    root.querySelector('[data-sc-retry]')?.removeAttribute('hidden');
    announce(root,'Unable to update the product selection. Please retry this selection.');
  }finally{if(inflight.get(root)===controller)inflight.delete(root);}
});
})();`;
