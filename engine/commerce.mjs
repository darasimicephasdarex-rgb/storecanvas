/** StoreCanvas commerce primitives for the generated independent starter theme.
 * Server-rendered Liquid is the source of truth. JS progressively updates product
 * variant price/media/quantity and never bypasses native Shopify forms. */
export const PRODUCT_SECTION = String.raw`{% liquid
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
})();`;
