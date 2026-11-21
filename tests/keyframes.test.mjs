import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {normalizeFrames,keyframeCSS,atProgress,DEFAULT_FRAMES} from '../engine/keyframes.mjs';
import {validateProject,renderPreview} from '../engine/core.mjs';
import {compileShopifyTheme} from '../engine/theme.mjs';
import {themeZip} from '../engine/zip.mjs';
const fixture=JSON.parse(fs.readFileSync(new URL('./fixtures/project.json',import.meta.url),'utf8'));
const good=[{at:0,x:-30,y:22,scale:0.9,rotate:-7,opacity:0},{at:50,x:10,y:-5,scale:1.1,rotate:4,opacity:80},{at:100,x:0,y:0,scale:1,rotate:0,opacity:100}];
function make(){const p=structuredClone(fixture);p.sections[0].layers[0].motion={enter:'none',trigger:'scroll',duration:1600,delay:120,easing:'ease-in-out',keyframes:structuredClone(good)};return p;}
test('motion keyframes normalize and interpolate with exact offsets',()=>{
 assert.deepEqual(normalizeFrames(good),good);
 assert.equal(atProgress(good,0).x,-30);assert.equal(atProgress(good,100).opacity,100);
 const mid=atProgress(good,25);assert.equal(mid.x,-10);assert.equal(mid.opacity,40);
 assert.deepEqual(atProgress(DEFAULT_FRAMES,100),{at:100,x:0,y:0,scale:1,rotate:0,opacity:100});
});
test('rejects malformed keyframes before CSS export',()=>{
 assert.throws(()=>normalizeFrames([good[0]]),/2–12/);
 assert.throws(()=>normalizeFrames([good[0],{...good[1],at:0},good[2]]),/offsets must increase/);
 assert.throws(()=>normalizeFrames([{...good[0],at:1},good[2]]),/begin at 0%/);
 assert.throws(()=>normalizeFrames([{...good[0],x:Infinity},good[2]]),/Invalid motion x/);
 assert.throws(()=>normalizeFrames([{...good[0],scale:999},good[2]]),/Invalid motion scale/);
 assert.throws(()=>normalizeFrames(Array.from({length:13},(_,i)=>({...good[1],at:i*100/12}))),/2–12/);
 assert.throws(()=>keyframeCSS('malicious;}body{color:red',good),/Invalid motion ID/);
});
test('v0.9 projects retain preset animation compatibility',()=>{
 const parsed=validateProject(fixture);assert.deepEqual(parsed.sections[0].layers[0].motion.keyframes,[]);
 const out=renderPreview(fixture);assert.doesNotMatch(out.css,/sc-custom-/);
});
test('custom CSS is scoped to the layer and respects the shared runtime',()=>{
 const p=make(),r=renderPreview(p),id=p.sections[0].layers[0].id;
 assert.match(r.css,new RegExp('\\@keyframes sc-custom-'+id));
 assert.match(r.css,/50%\{opacity:0.8;transform:translate3d\(10px,-5px,0\) rotate\(4deg\) scale\(1.1\)/);
 assert.match(r.html,/sc-keyframe-surface/);
 assert.match(r.css,/prefers-reduced-motion:reduce/);
 assert.match(r.html,/--sc-easing:ease-in-out/);
 const files=compileShopifyTheme(p);
 assert.ok(files.get('assets/storecanvas.css').includes(`sc-custom-${id}`));
 assert.ok(files.get('sections/storecanvas-home.liquid').includes('sc-keyframe-surface'));
 assert.ok(themeZip(files).size>1200);
});
test('malicious keyframe values never enter generated Shopify assets',()=>{
 const p=make();p.sections[0].layers[0].motion.keyframes[1].x='10;url(https://bad.test)';
 assert.throws(()=>compileShopifyTheme(p),/Invalid motion x/);
});
