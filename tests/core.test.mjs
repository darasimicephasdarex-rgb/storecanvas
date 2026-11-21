import test from 'node:test';
import assert from 'node:assert/strict';
import {validateProject,renderPreview,fullHTML,safeUrl,escapeHTML} from '../engine/core.mjs';

const baseNode={x:10,y:20,w:220,h:120,z:1,opacity:100,fill:'#ffffff',color:'#173725'};
function sample(){
 const heading={...baseNode,id:'heading_01',type:'text',text:'Botanical story'};
 const image={...baseNode,id:'image_01',type:'image',image:'asset:plant',x:260};
 const button={...baseNode,id:'button_01',type:'button',text:'Explore',link:'/collections/all'};
 const container={...baseNode,id:'container_01',type:'container',w:520,h:240};
 const child={...baseNode,id:'child_01',type:'text',parentId:container.id,text:'Inside a container'};
 const slideshow={...baseNode,id:'slides_01',type:'slideshow',slides:[{image:'asset:plant',caption:'One'},{image:'asset:fern',caption:'Two'}],autoplay:true,interval:4000};
 return {version:3,name:'StoreCanvas test',settings:{snap:true,haptics:false},
  sections:[{id:'hero_01',name:'Hero',height:600,tabletHeight:490,mobileHeight:790,bg:'#eef1e8',radius:24,clip:true,layers:[heading,image,button,container,child,slideshow]}]};
}
test('v0.3 project normalizes without mutating input',()=>{const input=sample();const value=validateProject(input);assert.equal(value.version,4);assert.equal(value.sections.length,1);assert.equal(value.sections[0].layers.length,6);assert.equal(input.version,3)});
test('responsive CSS and accessible slideshow are emitted',()=>{const out=renderPreview(sample());assert.ok(out.css.includes('@media(max-width:700px)'));assert.match(out.html,/aria-label="Pause slideshow"/);assert.match(out.js,/focusin/)});
test('injected HTML is escaped and unsafe URLs are rejected',()=>{const p=sample();p.sections[0].layers[0].text='<script>alert(1)</script>';p.sections[0].layers[2].link='javascript:alert(1)';const out=renderPreview(p);assert.doesNotMatch(out.html,/<script>alert/);assert.match(out.html,/&lt;script&gt;/);assert.match(out.html,/href="#"/);assert.equal(safeUrl('//evil.example'),'');assert.equal(safeUrl('https://good.example/item'),'https://good.example/item');assert.equal(escapeHTML('"'),'&quot;')});
test('rejects duplicate IDs, bad dimensions and parent cycles',()=>{const a=sample();a.sections[0].layers[1].id=a.sections[0].layers[0].id;assert.throws(()=>validateProject(a),/Duplicate ID/);const b=sample();b.sections[0].layers[0].w=0;assert.throws(()=>validateProject(b),/Invalid dimensions/);const c=sample();c.sections[0].layers[3].parentId='container_01';assert.throws(()=>validateProject(c),/Parent cycle/)});
test('restricts excessive sections and unsupported layer types',()=>{const a=sample();a.sections=Array.from({length:41},(_,i)=>({...sample().sections[0],id:'hero_'+i,layers:[]}));assert.throws(()=>validateProject(a),/1–40/);const b=sample();b.sections[0].layers[0].type='iframe';assert.throws(()=>validateProject(b),/Unsupported/)});
test('full document has reduced-motion support and closes correctly',()=>{const html=fullHTML(sample());assert.match(html,/<main class="sc-page">/);assert.match(html,/prefers-reduced-motion/);assert.ok(html.endsWith('</script></body></html>'))});

test('slideshow transitions keep inaccessible slides out of screen readers',()=>{
 const out=renderPreview(sample());
 assert.match(out.html,/class="sc-slide" aria-hidden="true" hidden/);
 assert.match(out.css,/data-transition=slide/);
 assert.match(out.css,/data-transition=zoom/);
 assert.match(out.css,/\.sc-slide\.is-active/);
 assert.match(out.js,/focusout/);
 assert.match(out.js,/mouseleave/);
 assert.match(out.js,/aria-hidden/);
});
