import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {createHash} from 'node:crypto';
import {compileShopifyTheme} from '../engine/theme.mjs';
import {auditTheme} from '../scripts/validate-theme.mjs';
const sample=JSON.parse(fs.readFileSync(new URL('./fixtures/project.json',import.meta.url),'utf8'));
function setup(){
  const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'sc-audit-'));const theme=path.join(tmp,'shopify-theme');fs.mkdirSync(theme);
  const files=compileShopifyTheme(sample),manifest={files:{}};
  for(const [name,data] of files){const bytes=data instanceof Uint8Array?Buffer.from(data):Buffer.from(String(data),'utf8');
    const destination=path.join(theme,name);fs.mkdirSync(path.dirname(destination),{recursive:true});fs.writeFileSync(destination,bytes);
    manifest.files[name]={bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')};
  }
  const manifestPath=path.join(tmp,'manifest.json');fs.writeFileSync(manifestPath,JSON.stringify(manifest));
  return {tmp,theme,manifestPath};
}
const withTheme=fn=>{const data=setup();try{fn(data)}finally{fs.rmSync(data.tmp,{recursive:true,force:true})}};
test('generated Shopify theme passes structure and reference audit',()=>withTheme(({theme,manifestPath})=>{
 assert.deepEqual(auditTheme(theme,manifestPath),[]);
}));
test('detects deleted referenced Shopify section',()=>withTheme(({theme,manifestPath})=>{
 fs.rmSync(path.join(theme,'sections/main-product.liquid'));
 assert.ok(auditTheme(theme,manifestPath).some(e=>e.includes('main-product.liquid')));
}));
test('detects tampered assets even when text files are unchanged',()=>withTheme(({theme,manifestPath})=>{
 fs.appendFileSync(path.join(theme,'assets/storecanvas.js'),'/* changed */');
 assert.ok(auditTheme(theme,manifestPath).some(e=>e.includes('File altered assets/storecanvas.js')));
}));
test('flags invalid Liquid schema or missing asset_url references',()=>withTheme(({theme,manifestPath})=>{
 const home=path.join(theme,'sections/storecanvas-home.liquid');
 fs.appendFileSync(home,'\n{{ "missing-storecanvas-art.svg" | asset_url }}\n');
 const errors=auditTheme(theme,manifestPath);
 assert.ok(errors.some(e=>e.includes('missing-storecanvas-art.svg')));
}));
