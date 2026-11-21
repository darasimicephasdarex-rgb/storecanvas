/** Merchant-facing language strings for the exported Shopify Online Store theme.
 * StoreCanvas editor chrome is deliberately independent from storefront locale.
 */
export const STORECANVAS_STRINGS = Object.freeze({
 en: {
  navigation:{main:'Main navigation',home:'Home',shop:'Shop',cart:'Cart ({{ count }})'},
  accessibility:{skip_to_content:'Skip to content',store_home:'{{ name }} home'},
  product:{no_image:'No product photograph available',unavailable:'Combination unavailable',option_unavailable:'Unavailable',quantity:'Quantity',add_to_cart:'Add to cart',sold_out:'Sold out',choose_option:'Choose an option',retry:'Retry selection',selection_loading:'Updating selection…',selection_updated:'Product options updated.',selection_invalid:'This combination is unavailable.',selection_failed:'Unable to update product selection. Please retry.',selection_incomplete:'Choose all product options.',selection_blocked:'Select an available variant before adding to cart.'},
  cart:{title:'Your cart',empty:'Your cart is empty.',continue_shopping:'Continue shopping',remove:'Remove',remove_label:'Remove {{ title }}',quantity:'Quantity',quantity_label:'Quantity for {{ title }}',subtotal:'Subtotal',taxes_included:'Taxes are included.',taxes_checkout:'Taxes and shipping are calculated at checkout.',update:'Update cart',checkout:'Checkout'},
  search:{title:'Search',label:'Search products',submit:'Search'},
  errors:{not_found:'Page not found',go_home:'Go home'}
 },
 es: {
  navigation:{main:'Navegación principal',home:'Inicio',shop:'Tienda',cart:'Carrito ({{ count }})'},
  accessibility:{skip_to_content:'Saltar al contenido',store_home:'Inicio de {{ name }}'},
  product:{no_image:'No hay foto del producto disponible',unavailable:'Combinación no disponible',option_unavailable:'No disponible',quantity:'Cantidad',add_to_cart:'Añadir al carrito',sold_out:'Agotado',choose_option:'Elige una opción',retry:'Reintentar selección',selection_loading:'Actualizando selección…',selection_updated:'Opciones del producto actualizadas.',selection_invalid:'Esta combinación no está disponible.',selection_failed:'No se pudo actualizar la selección. Inténtalo de nuevo.',selection_incomplete:'Elige todas las opciones del producto.',selection_blocked:'Selecciona una variante disponible antes de añadirla al carrito.'},
  cart:{title:'Tu carrito',empty:'Tu carrito está vacío.',continue_shopping:'Seguir comprando',remove:'Eliminar',remove_label:'Eliminar {{ title }}',quantity:'Cantidad',quantity_label:'Cantidad para {{ title }}',subtotal:'Subtotal',taxes_included:'Los impuestos están incluidos.',taxes_checkout:'Los impuestos y el envío se calculan al pagar.',update:'Actualizar carrito',checkout:'Finalizar compra'},
  search:{title:'Buscar',label:'Buscar productos',submit:'Buscar'},
  errors:{not_found:'Página no encontrada',go_home:'Ir al inicio'}
 }
});
export const LIQUID_T = (key, params='') => `{{ 'storecanvas.${key}' | t${params ? ': '+params : ''} }}`;
export function validateTranslations(){
 const walk=(root,prefix='',out=new Map())=>{for(const [key,value] of Object.entries(root)){const path=prefix?`${prefix}.${key}`:key;if(typeof value==='string')out.set(path,value);else if(value&&typeof value==='object'&&!Array.isArray(value))walk(value,path,out);else throw Error(`Invalid translation: ${path}`)}return out};
 const english=walk(STORECANVAS_STRINGS.en);const spanish=walk(STORECANVAS_STRINGS.es);
 for(const [key,englishValue] of english){if(!spanish.has(key))throw Error(`Missing Spanish translation ${key}`);
  const placeholders=(s)=>[...s.matchAll(/{{\s*(\w+)\s*}}/g)].map(x=>x[1]).sort().join(',');
  if(placeholders(englishValue)!==placeholders(spanish.get(key)))throw Error(`Incompatible placeholders at ${key}`);
 }
 for(const key of spanish.keys())if(!english.has(key))throw Error(`Missing English translation ${key}`);
 return true;
}
