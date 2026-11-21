import {normalizeFrames,keyframeCSS} from './keyframes.mjs';
/** StoreCanvas core v0.4 — deterministic, dependency-free, browser/Node compatible.
 * Accepts v0.3 page JSON, rejects hostile/invalid documents, and produces inert HTML.
 * This is a safe preview compiler, NOT an unrestricted Liquid/theme writer.
 */
export const LIMITS = Object.freeze({bytes: 2_000_000, sections: 40, layers: 160, slides: 12, depth: 10});
export const NODE_TYPES = Object.freeze(['text','image','button','container','shape','slideshow']);
export const MOTION = Object.freeze(['none','fade-up','fade-in','slide-left','slide-right','zoom-in','rotate-in','bounce','reveal','float','pulse','wiggle']);
export const HOVERS = Object.freeze(['none','lift','scale','tilt','glow','shake']);
const ID=/^[a-zA-Z][a-zA-Z0-9_-]{1,63}$/;
const COLORS=/^#(?:[0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
const finite=(v,min,max,def)=>typeof v==='number'&&Number.isFinite(v)?Math.min(max,Math.max(min,v)):def;
const string=(v,max,def='')=>typeof v==='string'?v.slice(0,max):def;
const choice=(v,options,def)=>options.includes(v)?v:def;
export const escapeHTML=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const safeColor=(value,fallback='#ffffff')=>typeof value==='string'&&COLORS.test(value)?value:fallback;
export function safeUrl(value,{image=false}={}){
 if(typeof value!=='string'||value.length>2000)return '';
 if(image&&/^asset:[a-z0-9_-]{1,60}$/i.test(value))return value;
 if(image&&/^data:image\/(png|jpeg|webp|gif);base64,[A-Za-z0-9+/=]+$/i.test(value)&&value.length<900000)return value;
 if(value.startsWith('/')&&!value.startsWith('//')&&!/\\|[\u0000-\u001f]/.test(value))return value;
 if(/^#[a-z0-9_-]+$/i.test(value))return value;
 try{const u=new URL(value);if(u.protocol==='https:'&&u.username===''&&u.password==='')return u.href;}catch{}
 return '';
}
function position(v,defaults){const p=v&&typeof v==='object'&&!Array.isArray(v)?v:{};return {
 x:finite(p.x,-2500,2500,defaults.x), y:finite(p.y,-2500,3000,defaults.y),
 w:finite(p.w,1,2400,defaults.w), h:finite(p.h,1,2400,defaults.h)};
}
function motion(v){const m=v&&typeof v==='object'&&!Array.isArray(v)?v:{};return {
 enter:choice(m.enter,MOTION,'none'), trigger:choice(m.trigger,['load','scroll'],'load'),
 duration:finite(m.duration,100,10000,700), delay:finite(m.delay,0,20000,0),
 easing:choice(m.easing,['ease','ease-in','ease-out','ease-in-out','linear','cubic-bezier(0.2,0.7,0.2,1)'],'ease-out'),
 hover:choice(m.hover,HOVERS,'none'), haptic:choice(m.haptic,['off','soft','medium'],'off'),keyframes:normalizeFrames(m.keyframes)};
}
export function validateProject(raw){
 if(!raw||typeof raw!=='object'||Array.isArray(raw))throw Error('Project must be an object');
 let bytes;try{bytes=new TextEncoder().encode(JSON.stringify(raw)).length;}catch{throw Error('Project is not JSON serializable');}
 if(bytes>LIMITS.bytes)throw Error('Project exceeds 2 MB limit');
 if(!Array.isArray(raw.sections)||!raw.sections.length||raw.sections.length>LIMITS.sections)throw Error('Project must contain 1–40 sections');
 const ids=new Set();const sections=raw.sections.map((s,index)=>{
   if(!s||typeof s!=='object'||Array.isArray(s)||!ID.test(s.id||''))throw Error(`Invalid section ID at ${index}`);
   if(ids.has(s.id))throw Error(`Duplicate ID ${s.id}`);ids.add(s.id);
   if(!Array.isArray(s.layers)||s.layers.length>LIMITS.layers)throw Error(`Too many layers in ${s.id}`);
   const nodes=s.layers.map((l,j)=>{
     if(!l||typeof l!=='object'||Array.isArray(l)||!ID.test(l.id||''))throw Error(`Invalid layer ID ${j}`);
     if(ids.has(l.id))throw Error(`Duplicate ID ${l.id}`);ids.add(l.id);
     if(!NODE_TYPES.includes(l.type))throw Error(`Unsupported layer type: ${String(l.type)}`);
     const p=position(l,{x:20,y:20,w:240,h:120});
     if(!(typeof l.w==='number'&&Number.isFinite(l.w)&&l.w>0&&typeof l.h==='number'&&Number.isFinite(l.h)&&l.h>0))throw Error(`Invalid dimensions for ${l.id}`);
     const slides=(l.slides??[]);
     if(!Array.isArray(slides)||slides.length>LIMITS.slides)throw Error('Slideshow exceeds 12 slides');
     return {...p, id:l.id,type:l.type,name:string(l.name,120,l.type),parentId:l.parentId??null,
       z:finite(l.z,-1000,1000,1),rotation:finite(l.rotation,-360,360,0),opacity:finite(l.opacity,0,100,100),
       hidden:l.hidden===true,locked:l.locked===true, fill:safeColor(l.fill),color:safeColor(l.color,'#203728'),
       radius:finite(l.radius,0,200,0),shadow:finite(l.shadow,0,100,0),feather:finite(l.feather,0,100,0),
       blend:choice(l.blend,['normal','multiply','screen','overlay','darken','lighten'],'normal'),
       text:string(l.text,4000),fontSize:finite(l.fontSize,9,160,24),fontWeight:finite(l.fontWeight,100,900,500),
       fontFamily:choice(l.fontFamily,['Georgia, serif','Arial, sans-serif','Inter, sans-serif'],'Georgia, serif'),
       link:safeUrl(l.link)||'#',image:safeUrl(l.image,{image:true}),fit:choice(l.fit,['cover','contain','fill'],'cover'),
       slides:slides.map(sl=>({image:safeUrl(sl?.image,{image:true}),caption:string(sl?.caption,200)})),
       transition:choice(l.transition,['fade','slide','zoom'],'fade'),
       autoplay:l.autoplay===true,interval:finite(l.interval,1800,20000,4000),
       motion:motion(l.motion),mobile:l.mobile?position(l.mobile,p):null,tablet:l.tablet?position(l.tablet,p):null};
   });
   const map=new Map(nodes.map(l=>[l.id,l]));
   for(const n of nodes){
     if(n.parentId===null)continue;
     if(!map.has(n.parentId)||map.get(n.parentId).type!=='container')throw Error(`Invalid container reference on ${n.id}`);
     let seen=new Set([n.id]),cursor=n;
     while(cursor.parentId){if(seen.has(cursor.parentId))throw Error(`Parent cycle involving ${n.id}`);seen.add(cursor.parentId);
       if(seen.size>LIMITS.depth)throw Error(`Maximum nesting depth exceeded at ${n.id}`);
       cursor=map.get(cursor.parentId);if(!cursor)throw Error(`Missing parent for ${n.id}`);}
   }
   return {id:s.id,name:string(s.name,160,`Section ${index+1}`),height:finite(s.height,180,2600,600),
     tabletHeight:finite(s.tabletHeight,180,2600,500),mobileHeight:finite(s.mobileHeight,180,3200,760),
     bg:safeColor(s.bg,'#f3f4ec'),radius:finite(s.radius,0,100,24),clip:s.clip!==false,layers:nodes};
 });
 return {version:4,name:string(raw.name,120,'Untitled project'),settings:{snap:raw.settings?.snap!==false,haptics:raw.settings?.haptics===true},sections};
}
const fmt=n=>Number(n.toFixed(3));
function frame(n,device){const orig={x:n.x,y:n.y,w:n.w,h:n.h};if(device==='desktop')return orig;
 const custom=n[device];if(custom)return custom;
 const scale=(device==='tablet'?750:390)/1100;return {x:n.x*scale,y:n.y*scale,w:n.w*scale,h:n.h*scale};}
function cssBox(n,device,parent){const f=frame(n,device),base=parent?frame(parent,device).w:(device==='desktop'?1100:device==='tablet'?750:390);
 return `left:${fmt(100*f.x/Math.max(base,1))}%;top:${fmt(f.y)}px;width:${fmt(100*f.w/Math.max(base,1))}%;height:${fmt(f.h)}px;`;}
function mediaTag(src,alt){const safe=safeUrl(src,{image:true});if(!safe)return '<span class="sc-media-placeholder" aria-hidden="true"></span>';
 if(safe.startsWith('asset:'))return `<span class="sc-media-placeholder" aria-hidden="true" data-sc-asset="${escapeHTML(safe.slice(6))}"></span>`;
 return `<img loading="lazy" decoding="async" width="640" height="480" src="${escapeHTML(safe)}" alt="${escapeHTML(alt)}">`;}
function renderLayer(n,map,seen){if(n.hidden)return '';
 const children=n.type==='container'?[...map.values()].filter(x=>x.parentId===n.id).sort((a,b)=>a.z-b.z).map(x=>renderLayer(x,map,seen)).join(''):'';
 const m=n.motion;let inner='';
 if(n.type==='text')inner=`<div class="sc-text" style="color:${n.color};font-family:${n.fontFamily};font-size:${n.fontSize}px;font-weight:${n.fontWeight}">${escapeHTML(n.text)}</div>`;
 else if(n.type==='button')inner=`<a class="sc-button" href="${escapeHTML(n.link)}" style="color:${n.color};background:${n.fill};border-radius:${n.radius}px" data-haptic="${m.haptic}">${escapeHTML(n.text||'Shop now')}</a>`;
 else if(n.type==='image')inner=`<div class="sc-media" style="border-radius:${n.radius}px;opacity:${fmt(n.opacity/100)};mix-blend-mode:${n.blend}">${mediaTag(n.image,n.name)}</div>`;
 else if(n.type==='shape')inner=`<div class="sc-shape" style="border-radius:${n.radius}px;background:${n.fill}"></div>`;
 else if(n.type==='container')inner=`<div class="sc-container" style="background:${n.fill};border-radius:${n.radius}px">${children}</div>`;
 else if(n.type==='slideshow'){
   const slides=n.slides.map((s,i)=>`<figure class="sc-slide${i===0?' is-active':''}" aria-hidden="${i===0?'false':'true'}" ${i===0?'':'hidden'}>${mediaTag(s.image,s.caption)}<figcaption>${escapeHTML(s.caption)}</figcaption></figure>`).join('');
   inner=`<div class="sc-slideshow" data-autoplay="${n.autoplay}" data-interval="${n.interval}" data-transition="${n.transition}" role="region" aria-label="${escapeHTML(n.name)}"><div class="sc-slides">${slides}</div><button type="button" data-prev aria-label="Previous slide">‹</button><button type="button" data-next aria-label="Next slide">›</button><button type="button" data-pause aria-label="Pause slideshow">Pause</button></div>`;
 }
 const id=escapeHTML(n.id);return `<div class="sc-layer sc-layer-${id}" data-motion="${m.enter}" data-trigger="${m.trigger}" data-hover="${m.hover}" style="${cssBox(n,'desktop',n.parentId?map.get(n.parentId):null)}--sc-delay:${m.delay}ms;--sc-duration:${m.duration}ms;--sc-easing:${m.easing};z-index:${fmt(n.z)};transform:rotate(${fmt(n.rotation)}deg)">${m.keyframes.length?`<div class="sc-keyframe-surface">${inner}</div>`:inner}</div>`;
}
export function renderPreview(input){const doc=validateProject(input);let sheets=[];
 const sections=doc.sections.map(s=>{const map=new Map(s.layers.map(n=>[n.id,n]));
   for(const n of s.layers){const parent=n.parentId?map.get(n.parentId):null;
     sheets.push(`@media(min-width:701px) and (max-width:1040px){#${s.id} .sc-layer-${n.id}{${cssBox(n,'tablet',parent)}}}`);
     sheets.push(`@media(max-width:700px){#${s.id} .sc-layer-${n.id}{${cssBox(n,'mobile',parent)}}}`);
     if(n.motion.keyframes.length)sheets.push(keyframeCSS(n.id,n.motion.keyframes));
   }
   return `<section class="sc-section" id="${s.id}" aria-label="${escapeHTML(s.name)}" style="--height:${s.height}px;--tablet:${s.tabletHeight}px;--mobile:${s.mobileHeight}px;background:${s.bg};border-radius:${s.radius}px;overflow:${s.clip?'hidden':'visible'}"><div class="sc-stage">${s.layers.filter(n=>!n.parentId).sort((a,b)=>a.z-b.z).map(n=>renderLayer(n,map)).join('')}</div></section>`;
 }).join('');
 return {html:sections,css:BASE_CSS+'\n'+sheets.join('\n'),js:BEHAVIOR_JS,document:doc};}
export const BASE_CSS = `*,*::before,*::after{box-sizing:border-box}.sc-page{display:grid;gap:20px;max-width:1200px;margin:auto;padding:20px}.sc-section{position:relative;isolation:isolate}.sc-stage{height:var(--height);position:relative}.sc-layer{position:absolute;transform-origin:center}.sc-keyframe-surface{position:relative;width:100%;height:100%;transform-origin:center}.sc-text{white-space:pre-wrap;line-height:1.1;overflow-wrap:anywhere}.sc-media,.sc-shape,.sc-container,.sc-slideshow{width:100%;height:100%;position:relative;overflow:hidden}.sc-media img,.sc-slide img{display:block;width:100%;height:100%;object-fit:cover}.sc-media-placeholder{display:block;width:100%;height:100%;background:linear-gradient(140deg,#a2c19b,#245034)}.sc-button{display:flex;align-items:center;justify-content:center;width:100%;min-height:44px;text-decoration:none;text-align:center;padding:10px}.sc-slide{position:absolute;inset:0;margin:0;opacity:0;pointer-events:none;transition:opacity .55s ease,transform .55s cubic-bezier(.2,.7,.2,1)}.sc-slide.is-active{opacity:1;pointer-events:auto;z-index:1}.sc-slide[hidden]{display:none}.sc-slideshow[data-transition=slide] .sc-slide{transform:translateX(8%)}.sc-slideshow[data-transition=slide] .sc-slide.is-active{transform:translateX(0)}.sc-slideshow[data-transition=zoom] .sc-slide{transform:scale(1.08)}.sc-slideshow[data-transition=zoom] .sc-slide.is-active{transform:scale(1)}.sc-slide figcaption{position:absolute;bottom:16px;left:16px;background:#143a2dda;color:white;padding:8px;border-radius:6px}.sc-slideshow button{position:absolute;z-index:1;top:50%;transform:translateY(-50%);min-width:44px;min-height:44px;background:#ffffffef;border:1px solid #678771;border-radius:50%;cursor:pointer}.sc-slideshow button[data-prev]{left:10px}.sc-slideshow button[data-next]{right:10px}.sc-slideshow button[data-pause]{top:auto;bottom:10px;left:50%;transform:translateX(-50%);border-radius:8px;font-size:12px}.sc-layer[data-hover=lift]:hover{translate:0 -5px}.sc-layer[data-hover=scale]:hover{scale:1.03}.sc-layer[data-hover=tilt]:hover{rotate:2deg}.sc-layer[data-motion=fade-up].sc-visible{animation:scFadeUp var(--sc-duration) ease-out var(--sc-delay) both}.sc-layer[data-motion=fade-in].sc-visible{animation:scFadeIn var(--sc-duration) ease-out var(--sc-delay) both}@keyframes scFadeUp{from{opacity:0;translate:0 16px}to{opacity:1;translate:0 0}}@keyframes scFadeIn{from{opacity:0}to{opacity:1}}.sc-layer:focus-within{outline:2px solid #28794a;outline-offset:2px}@media(min-width:701px) and (max-width:1040px){.sc-stage{height:var(--tablet)}}@media(max-width:700px){.sc-page{padding:12px;gap:12px}.sc-stage{height:var(--mobile)}}@media(prefers-reduced-motion:reduce){*,*::before,*::after{animation:none!important;transition:none!important;scroll-behavior:auto!important}}`;
export const BEHAVIOR_JS = `(()=>{'use strict';const reduced=matchMedia('(prefers-reduced-motion:reduce)').matches;let io=null;const motion=document.querySelectorAll('.sc-layer[data-motion]');if(!reduced){if('IntersectionObserver'in window){io=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('sc-visible');io.unobserve(e.target)}}));motion.forEach(n=>{if(n.dataset.trigger==='scroll')io.observe(n);else n.classList.add('sc-visible')})}else motion.forEach(n=>n.classList.add('sc-visible'))}const timers=[];document.querySelectorAll('.sc-slideshow').forEach(el=>{const slides=[...el.querySelectorAll('.sc-slide')];if(!slides.length)return;let i=0,explicitPaused=reduced||el.dataset.autoplay!=='true',hoverPaused=false,focusPaused=false;const isPaused=()=>explicitPaused||hoverPaused||focusPaused||document.hidden;const paint=()=>{el.dataset.ready='true';slides.forEach((s,j)=>{s.hidden=false;s.classList.toggle('is-active',j===i);s.setAttribute('aria-hidden',String(j!==i))})};const toggle=el.querySelector('[data-pause]');const sync=()=>{toggle.textContent=explicitPaused?'Play':'Pause';toggle.setAttribute('aria-label',explicitPaused?'Play slideshow':'Pause slideshow');toggle.setAttribute('aria-pressed',String(!explicitPaused))};const advance=n=>{i=(n+slides.length)%slides.length;paint()};el.querySelector('[data-prev]').addEventListener('click',()=>advance(i-1));el.querySelector('[data-next]').addEventListener('click',()=>advance(i+1));toggle.addEventListener('click',()=>{explicitPaused=!explicitPaused;sync()});el.addEventListener('focusin',()=>{focusPaused=true});el.addEventListener('focusout',e=>{if(!el.contains(e.relatedTarget))focusPaused=false});el.addEventListener('mouseenter',()=>{hoverPaused=true});el.addEventListener('mouseleave',()=>{hoverPaused=false});const ms=Math.max(1800,Number(el.dataset.interval)||4000);timers.push(setInterval(()=>{if(!isPaused())advance(i+1)},ms));sync();paint()});document.addEventListener('click',e=>{const t=e.target.closest('[data-haptic]');if(!t||window.SC_HAPTICS_ENABLED!==true||!navigator.vibrate)return;try{const h=t.dataset.haptic;if(h!=='off')navigator.vibrate(h==='medium'?24:12)}catch{}});addEventListener('pagehide',()=>{timers.forEach(clearInterval);if(io)io.disconnect()},{once:true})})();`;
export function fullHTML(input){const out=renderPreview(input);return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHTML(out.document.name)}</title><style>${out.css}</style></head><body><main class="sc-page">${out.html}</main><script>${out.js.replace(/<\/script/gi,'<\\/script')}<\/script></body></html>`.replace('<\\/script>','</script>');}
