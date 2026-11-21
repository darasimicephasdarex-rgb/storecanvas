/** Deterministic no-dependency browser bundle, compatible with file:// URLs. */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const modules=['engine/keyframes.mjs','engine/core.mjs','engine/builtin-images.mjs','engine/commerce.mjs','engine/locales.mjs','engine/theme.mjs','engine/zip.mjs'];
let out='/* StoreCanvas generated runtime. Edit engine/*.mjs and run npm run build:browser. */\n(()=>{\'use strict\';\n';
for(const name of modules){let source=fs.readFileSync(path.join(root,name),'utf8');
 source=source.replace(/^import\s+\{[^\n]+\}\s+from\s+['"][^'"]+['"];?\s*$/gm,'').replace(/^export\s+/gm,'');
 out+=`\n/* ${name} */\n${source}\n`;
}
out+='\nwindow.StoreCanvasEngine=Object.freeze({validateProject,renderPreview,compileShopifyTheme,themeZip,normalizeFrames,keyframeCSS,atProgress,DEFAULT_FRAMES});\n})();\n';
const dest=path.join(root,'editor/runtime.js');
if(process.argv.includes('--check')){
 if(!fs.existsSync(dest)||fs.readFileSync(dest,'utf8')!==out){console.error('Stale editor/runtime.js — run npm run build:browser');process.exit(1)}
 console.log('Browser runtime up to date');
}else{fs.writeFileSync(dest,out);console.log('Generated editor/runtime.js ('+out.length+' characters)')}
