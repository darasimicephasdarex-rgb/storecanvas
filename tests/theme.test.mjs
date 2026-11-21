import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {compileShopifyTheme} from '../engine/theme.mjs';
import {themeZip} from '../engine/zip.mjs';
import {renderPreview} from '../engine/core.mjs';

const base={x:20,y:20,w:220,h:120,z:1,opacity:100,fill:'#ffffff',color:'#173725'};
function sample(){return {version:2,name:'Botanical Story',settings:{snap:true,haptics:false},sections:[
 {id:'hero_01',name:'Hero',height:600,mobileHeight:790,tabletHeight:480,bg:'#eef1e8',radius:24,clip:true,layers:[
 {...base,id:'text_01',type:'text',text:'A better way to live.'},
 {...base,id:'image_01',type:'image',image:'asset:plant',x:280},
 {...base,id:'button_01',type:'button',text:'Explore',link:'/collections/all'},
 {...base,id:'container_01',type:'container',w:540,h:290},
 {...base,id:'child_01',type:'text',parentId:'container_01',text:'Beautiful essentials'},
 {...base,id:'slide_01',type:'slideshow',slides:[{image:'asset:fern',caption:'Fern'},{image:'asset:detail',caption:'Interior'},{image:'asset:architecture',caption:'Design'}],autoplay:true,interval:3800}
 ]}]};}
const home=files=>String(files.get('sections/storecanvas-home.liquid'));
test('shared renderer drives Shopify homepage and motion assets',()=>{
 const preview=renderPreview(sample()),files=compileShopifyTheme(sample());
 assert.equal(preview.document.version,4);assert.ok(home(files).includes('id="hero_01"'));
 assert.ok(home(files).includes('sc-layer'));assert.ok(files.get('assets/storecanvas.css').includes('.sc-layer'));
 assert.ok(files.get('assets/storecanvas.js').includes('sc-slideshow'));
});
test('four default illustration assets included',()=>{
 const files=compileShopifyTheme(sample()),markup=home(files);
 for(const name of ['plant','fern','architecture','detail'])assert.match(String(files.get('assets/storecanvas-'+name+'.svg')),/<svg/);
 assert.ok(markup.includes("{{ 'storecanvas-plant.svg' | asset_url }}"));
 assert.doesNotMatch(markup,/data-sc-asset=/);
});
test('all Shopify JSON templates reference real sections',()=>{
 const files=compileShopifyTheme(sample());
 for(const name of ['index','product','collection','cart','page','search','404']){
  const template=JSON.parse(files.get('templates/'+name+'.json'));
  for(const section of Object.values(template.sections))assert.ok(files.has('sections/'+section.type+'.liquid'));
 }
 assert.match(files.get('layout/theme.liquid'),/content_for_header/);
 assert.match(files.get('sections/main-product.liquid'),/{% form 'product', product %}/);
});
test('HTML and Liquid payloads become inert text',()=>{
 const p=sample();p.sections[0].layers[0].text='{{ shop.email }} <script>alert(1)</script>';
 const markup=home(compileShopifyTheme(p));
 assert.ok(markup.includes('&#123;&#123; shop.email &#125;&#125;'));
 assert.ok(markup.includes('&lt;script&gt;alert(1)&lt;/script&gt;'));
 assert.doesNotMatch(markup,/\{\{ shop\.email \}\}/);
});
test('uploads converted to binary theme assets and forged image rejected',()=>{
 const png='iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/No0AAAAASUVORK5CYII=';
 const p=sample();p.sections[0].layers[1].image='data:image/png;base64,'+png;
 const files=compileShopifyTheme(p);
 assert.ok(files.get('assets/storecanvas-upload-1.png') instanceof Uint8Array);
 assert.ok(home(files).includes("{{ 'storecanvas-upload-1.png' | asset_url }}"));
 p.sections[0].layers[1].image='data:image/png;base64,YWJjZA==';
 assert.throws(()=>compileShopifyTheme(p),/Invalid png image signature/);
});
test('unknown asset references fail rather than silently disappear',()=>{
 const p=sample();p.sections[0].layers[1].image='asset:unknown';
 assert.throws(()=>compileShopifyTheme(p),/Unknown bundled asset/);
});
test('ZIP contains correct local file header and central directory',async()=>{
 const blob=themeZip(compileShopifyTheme(sample()));
 const bytes=new Uint8Array(await blob.arrayBuffer()),d=new DataView(bytes.buffer);
 assert.equal(d.getUint32(0,true),0x04034b50);
 assert.equal(d.getUint32(bytes.length-22,true),0x06054b50);
 assert.ok(d.getUint16(bytes.length-12,true)>15);
});
test('classic browser runtime produces same section output as ESM',()=>{
 const script=fs.readFileSync(new URL('../editor/runtime.js',import.meta.url),'utf8');
 const browser={};vm.runInNewContext(script,{window:browser,Blob,TextEncoder,TextDecoder,URL,atob,console},{timeout:1500});
 assert.equal(browser.StoreCanvasEngine.compileShopifyTheme(sample()).get('sections/storecanvas-home.liquid'),home(compileShopifyTheme(sample())));
});
