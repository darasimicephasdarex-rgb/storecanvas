/* StoreCanvas v0.5: browser ZIP adapter. All rendering comes from engine/*.mjs. */
(()=>{'use strict';
async function exportTheme(project){
 const runtime=window.StoreCanvasEngine;
 if(!runtime)throw Error('StoreCanvas compiler was not loaded; reload the editor');
 const files=runtime.compileShopifyTheme(project);
 return runtime.themeZip(files);
}
window.SCExporter=Object.freeze({exportTheme});
})();
