/* StoreCanvas generated runtime. Edit engine/*.mjs and run npm run build:browser. */
(()=>{'use strict';

/* engine/core.mjs */
/** StoreCanvas core v0.4 — deterministic, dependency-free, browser/Node compatible.
 * Accepts v0.3 page JSON, rejects hostile/invalid documents, and produces inert HTML.
 * This is a safe preview compiler, NOT an unrestricted Liquid/theme writer.
 */
const LIMITS = Object.freeze({bytes: 2_000_000, sections: 40, layers: 160, slides: 12, depth: 10});
const NODE_TYPES = Object.freeze(['text','image','button','container','shape','slideshow']);
const MOTION = Object.freeze(['none','fade-up','fade-in','slide-left','slide-right','zoom-in','rotate-in','bounce','reveal','float','pulse','wiggle']);
const HOVERS = Object.freeze(['none','lift','scale','tilt','glow','shake']);
const ID=/^[a-zA-Z][a-zA-Z0-9_-]{1,63}$/;
const COLORS=/^#(?:[0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
const finite=(v,min,max,def)=>typeof v==='number'&&Number.isFinite(v)?Math.min(max,Math.max(min,v)):def;
const string=(v,max,def='')=>typeof v==='string'?v.slice(0,max):def;
const choice=(v,options,def)=>options.includes(v)?v:def;
const escapeHTML=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safeColor=(value,fallback='#ffffff')=>typeof value==='string'&&COLORS.test(value)?value:fallback;
function safeUrl(value,{image=false}={}){
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
 hover:choice(m.hover,HOVERS,'none'), haptic:choice(m.haptic,['off','soft','medium'],'off')};
}
function validateProject(raw){
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
 const id=escapeHTML(n.id);return `<div class="sc-layer sc-layer-${id}" data-motion="${m.enter}" data-trigger="${m.trigger}" data-hover="${m.hover}" style="${cssBox(n,'desktop',n.parentId?map.get(n.parentId):null)}--sc-delay:${m.delay}ms;--sc-duration:${m.duration}ms;z-index:${fmt(n.z)};transform:rotate(${fmt(n.rotation)}deg)">${inner}</div>`;
}
function renderPreview(input){const doc=validateProject(input);let sheets=[];
 const sections=doc.sections.map(s=>{const map=new Map(s.layers.map(n=>[n.id,n]));
   for(const n of s.layers){const parent=n.parentId?map.get(n.parentId):null;
     sheets.push(`@media(min-width:701px) and (max-width:1040px){#${s.id} .sc-layer-${n.id}{${cssBox(n,'tablet',parent)}}}`);
     sheets.push(`@media(max-width:700px){#${s.id} .sc-layer-${n.id}{${cssBox(n,'mobile',parent)}}}`);
   }
   return `<section class="sc-section" id="${s.id}" aria-label="${escapeHTML(s.name)}" style="--height:${s.height}px;--tablet:${s.tabletHeight}px;--mobile:${s.mobileHeight}px;background:${s.bg};border-radius:${s.radius}px;overflow:${s.clip?'hidden':'visible'}"><div class="sc-stage">${s.layers.filter(n=>!n.parentId).sort((a,b)=>a.z-b.z).map(n=>renderLayer(n,map)).join('')}</div></section>`;
 }).join('');
 return {html:sections,css:BASE_CSS+'\n'+sheets.join('\n'),js:BEHAVIOR_JS,document:doc};}
const BASE_CSS = `*,*::before,*::after{box-sizing:border-box}.sc-page{display:grid;gap:20px;max-width:1200px;margin:auto;padding:20px}.sc-section{position:relative;isolation:isolate}.sc-stage{height:var(--height);position:relative}.sc-layer{position:absolute;transform-origin:center}.sc-text{white-space:pre-wrap;line-height:1.1;overflow-wrap:anywhere}.sc-media,.sc-shape,.sc-container,.sc-slideshow{width:100%;height:100%;position:relative;overflow:hidden}.sc-media img,.sc-slide img{display:block;width:100%;height:100%;object-fit:cover}.sc-media-placeholder{display:block;width:100%;height:100%;background:linear-gradient(140deg,#a2c19b,#245034)}.sc-button{display:flex;align-items:center;justify-content:center;width:100%;min-height:44px;text-decoration:none;text-align:center;padding:10px}.sc-slide{position:absolute;inset:0;margin:0;opacity:0;pointer-events:none;transition:opacity .55s ease,transform .55s cubic-bezier(.2,.7,.2,1)}.sc-slide.is-active{opacity:1;pointer-events:auto;z-index:1}.sc-slide[hidden]{display:none}.sc-slideshow[data-transition=slide] .sc-slide{transform:translateX(8%)}.sc-slideshow[data-transition=slide] .sc-slide.is-active{transform:translateX(0)}.sc-slideshow[data-transition=zoom] .sc-slide{transform:scale(1.08)}.sc-slideshow[data-transition=zoom] .sc-slide.is-active{transform:scale(1)}.sc-slide figcaption{position:absolute;bottom:16px;left:16px;background:#143a2dda;color:white;padding:8px;border-radius:6px}.sc-slideshow button{position:absolute;z-index:1;top:50%;transform:translateY(-50%);min-width:44px;min-height:44px;background:#ffffffef;border:1px solid #678771;border-radius:50%;cursor:pointer}.sc-slideshow button[data-prev]{left:10px}.sc-slideshow button[data-next]{right:10px}.sc-slideshow button[data-pause]{top:auto;bottom:10px;left:50%;transform:translateX(-50%);border-radius:8px;font-size:12px}.sc-layer[data-hover=lift]:hover{translate:0 -5px}.sc-layer[data-hover=scale]:hover{scale:1.03}.sc-layer[data-hover=tilt]:hover{rotate:2deg}.sc-layer[data-motion=fade-up].sc-visible{animation:scFadeUp var(--sc-duration) ease-out var(--sc-delay) both}.sc-layer[data-motion=fade-in].sc-visible{animation:scFadeIn var(--sc-duration) ease-out var(--sc-delay) both}@keyframes scFadeUp{from{opacity:0;translate:0 16px}to{opacity:1;translate:0 0}}@keyframes scFadeIn{from{opacity:0}to{opacity:1}}.sc-layer:focus-within{outline:2px solid #28794a;outline-offset:2px}@media(min-width:701px) and (max-width:1040px){.sc-stage{height:var(--tablet)}}@media(max-width:700px){.sc-page{padding:12px;gap:12px}.sc-stage{height:var(--mobile)}}@media(prefers-reduced-motion:reduce){*,*::before,*::after{animation:none!important;transition:none!important;scroll-behavior:auto!important}}`;
const BEHAVIOR_JS = `(()=>{'use strict';const reduced=matchMedia('(prefers-reduced-motion:reduce)').matches;let io=null;const motion=document.querySelectorAll('.sc-layer[data-motion]');if(!reduced){if('IntersectionObserver'in window){io=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('sc-visible');io.unobserve(e.target)}}));motion.forEach(n=>{if(n.dataset.trigger==='scroll')io.observe(n);else n.classList.add('sc-visible')})}else motion.forEach(n=>n.classList.add('sc-visible'))}const timers=[];document.querySelectorAll('.sc-slideshow').forEach(el=>{const slides=[...el.querySelectorAll('.sc-slide')];if(!slides.length)return;let i=0,explicitPaused=reduced||el.dataset.autoplay!=='true',hoverPaused=false,focusPaused=false;const isPaused=()=>explicitPaused||hoverPaused||focusPaused||document.hidden;const paint=()=>{el.dataset.ready='true';slides.forEach((s,j)=>{s.hidden=false;s.classList.toggle('is-active',j===i);s.setAttribute('aria-hidden',String(j!==i))})};const toggle=el.querySelector('[data-pause]');const sync=()=>{toggle.textContent=explicitPaused?'Play':'Pause';toggle.setAttribute('aria-label',explicitPaused?'Play slideshow':'Pause slideshow');toggle.setAttribute('aria-pressed',String(!explicitPaused))};const advance=n=>{i=(n+slides.length)%slides.length;paint()};el.querySelector('[data-prev]').addEventListener('click',()=>advance(i-1));el.querySelector('[data-next]').addEventListener('click',()=>advance(i+1));toggle.addEventListener('click',()=>{explicitPaused=!explicitPaused;sync()});el.addEventListener('focusin',()=>{focusPaused=true});el.addEventListener('focusout',e=>{if(!el.contains(e.relatedTarget))focusPaused=false});el.addEventListener('mouseenter',()=>{hoverPaused=true});el.addEventListener('mouseleave',()=>{hoverPaused=false});const ms=Math.max(1800,Number(el.dataset.interval)||4000);timers.push(setInterval(()=>{if(!isPaused())advance(i+1)},ms));sync();paint()});document.addEventListener('click',e=>{const t=e.target.closest('[data-haptic]');if(!t||window.SC_HAPTICS_ENABLED!==true||!navigator.vibrate)return;try{const h=t.dataset.haptic;if(h!=='off')navigator.vibrate(h==='medium'?24:12)}catch{}});addEventListener('pagehide',()=>{timers.forEach(clearInterval);if(io)io.disconnect()},{once:true})})();`;
function fullHTML(input){const out=renderPreview(input);return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHTML(out.document.name)}</title><style>${out.css}</style></head><body><main class="sc-page">${out.html}</main><script>${out.js.replace(/<\/script/gi,'<\\/script')}<\/script></body></html>`.replace('<\\/script>','</script>');}


/* engine/builtin-images.mjs */
/* Generated from editor/assets/*.svg: deterministic self-contained export assets. */
const BUILTIN_IMAGES = Object.freeze({"fern":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 660 700\"><defs><linearGradient id=\"a\" x2=\"1\" y2=\"1\"><stop stop-color=\"#dce8c9\"/><stop offset=\"1\" stop-color=\"#a9bd9d\"/></linearGradient></defs><rect width=\"660\" height=\"700\" fill=\"url(#a)\"/><circle cx=\"501\" cy=\"145\" r=\"170\" fill=\"#f5efe0\" opacity=\".6\"/><g stroke=\"#476f4e\" stroke-width=\"8\" fill=\"none\" stroke-linecap=\"round\"><path d=\"M303 688Q360 410 263 160\"/><path d=\"M320 688Q223 393 99 318\"/><path d=\"M335 689Q409 407 537 265\"/></g><g fill=\"#376b43\"><ellipse cx=\"240\" cy=\"200\" rx=\"100\" ry=\"30\" transform=\"rotate(36 240 200)\"/><ellipse cx=\"317\" cy=\"260\" rx=\"100\" ry=\"32\" transform=\"rotate(-43 317 260)\"/><ellipse cx=\"180\" cy=\"333\" rx=\"110\" ry=\"36\" transform=\"rotate(32 180 333)\"/><ellipse cx=\"382\" cy=\"385\" rx=\"110\" ry=\"35\" transform=\"rotate(-45 382 385)\"/><ellipse cx=\"195\" cy=\"478\" rx=\"114\" ry=\"39\" transform=\"rotate(38 195 478)\"/><ellipse cx=\"423\" cy=\"503\" rx=\"111\" ry=\"37\" transform=\"rotate(-27 423 503)\"/></g></svg>","architecture":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 660 700\"><rect width=\"660\" height=\"700\" fill=\"#e4e2d3\"/><path d=\"M0 420h660v280H0z\" fill=\"#c5c4ae\"/><path d=\"M135 55h440v560H135z\" fill=\"#bec9b8\"/><path d=\"M161 80h378v478H161z\" fill=\"#f4f1e6\"/><path d=\"M211 80v478M350 80v478M490 80v478M161 315h378\" stroke=\"#b1b8a4\" stroke-width=\"15\"/><circle cx=\"285\" cy=\"330\" r=\"155\" fill=\"#edebb9\" opacity=\".6\"/><path d=\"M323 650Q302 465 236 282M320 648Q375 467 479 381\" stroke=\"#50734b\" stroke-width=\"11\" fill=\"none\"/><g fill=\"#42764c\"><ellipse cx=\"225\" cy=\"298\" rx=\"101\" ry=\"41\" transform=\"rotate(30 225 298)\"/><ellipse cx=\"340\" cy=\"365\" rx=\"99\" ry=\"42\" transform=\"rotate(-40 340 365)\"/><ellipse cx=\"460\" cy=\"388\" rx=\"100\" ry=\"37\" transform=\"rotate(-28 460 388)\"/><ellipse cx=\"244\" cy=\"464\" rx=\"117\" ry=\"42\" transform=\"rotate(36 244 464)\"/><ellipse cx=\"398\" cy=\"532\" rx=\"100\" ry=\"45\" transform=\"rotate(-29 398 532)\"/></g><path d=\"M252 583h160l-20 115H275z\" fill=\"#d7a77c\"/></svg>","detail":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 660 700\"><defs><linearGradient id=\"c\" x1=\"0\" y1=\"0\" x2=\"1\" y2=\"1\"><stop stop-color=\"#b5cdb5\"/><stop offset=\"1\" stop-color=\"#5f805e\"/></linearGradient></defs><rect width=\"660\" height=\"700\" fill=\"url(#c)\"/><circle cx=\"515\" cy=\"149\" r=\"240\" fill=\"#f2e9cf\" opacity=\".24\"/><g stroke=\"#c4d4ae\" stroke-width=\"7\" fill=\"none\"><path d=\"M95 700Q345 421 490 100\"/><path d=\"M190 700Q396 459 585 389\"/></g><g fill=\"#244d30\"><ellipse cx=\"360\" cy=\"298\" rx=\"132\" ry=\"65\" transform=\"rotate(29 360 298)\"/><ellipse cx=\"464\" cy=\"150\" rx=\"131\" ry=\"61\" transform=\"rotate(-38 464 150)\"/><ellipse cx=\"278\" cy=\"477\" rx=\"123\" ry=\"67\" transform=\"rotate(-20 278 477)\"/><ellipse cx=\"480\" cy=\"491\" rx=\"132\" ry=\"58\" transform=\"rotate(23 480 491)\"/><ellipse cx=\"182\" cy=\"598\" rx=\"145\" ry=\"67\" transform=\"rotate(30 182 598)\"/></g><g fill=\"none\" stroke=\"#68966d\" stroke-width=\"4\"><path d=\"M235 596l253-442M287 464l184 40M363 293l-8-8\"/></g></svg>","plant":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 640 600\"><defs><linearGradient id=\"pot\" x1=\"0\" x2=\"1\"><stop stop-color=\"#cfddc8\"/><stop offset=\".55\" stop-color=\"#f1ead7\"/><stop offset=\"1\" stop-color=\"#a5b99a\"/></linearGradient><radialGradient id=\"light\"><stop stop-color=\"#e8ead5\"/><stop offset=\"1\" stop-color=\"#e9eddd\" stop-opacity=\"0\"/></radialGradient></defs><ellipse cx=\"337\" cy=\"490\" rx=\"172\" ry=\"24\" fill=\"#76907b\" opacity=\".12\"/><circle cx=\"325\" cy=\"295\" r=\"245\" fill=\"url(#light)\"/><g fill=\"none\" stroke=\"#53784d\" stroke-width=\"6\" stroke-linecap=\"round\"><path d=\"M320 410Q316 260 253 130\"/><path d=\"M318 392Q377 241 462 144\"/><path d=\"M314 375Q226 292 135 243\"/><path d=\"M310 339Q410 310 485 305\"/><path d=\"M313 360Q255 217 350 80\"/><path d=\"M313 395Q400 405 502 440\"/></g><g fill=\"#4d8651\"><ellipse cx=\"228\" cy=\"152\" rx=\"53\" ry=\"27\" transform=\"rotate(38 228 152)\"/><ellipse cx=\"281\" cy=\"124\" rx=\"57\" ry=\"27\" transform=\"rotate(-23 281 124)\"/><ellipse cx=\"359\" cy=\"107\" rx=\"65\" ry=\"31\" transform=\"rotate(-30 359 107)\"/><ellipse cx=\"442\" cy=\"169\" rx=\"68\" ry=\"32\" transform=\"rotate(-44 442 169)\"/><ellipse cx=\"153\" cy=\"222\" rx=\"67\" ry=\"29\" transform=\"rotate(27 153 222)\"/><ellipse cx=\"227\" cy=\"286\" rx=\"56\" ry=\"27\" transform=\"rotate(40 227 286)\"/><ellipse cx=\"467\" cy=\"313\" rx=\"66\" ry=\"29\" transform=\"rotate(-14 467 313)\"/><ellipse cx=\"492\" cy=\"428\" rx=\"55\" ry=\"28\" transform=\"rotate(19 492 428)\"/></g><g fill=\"#77a96b\"><ellipse cx=\"227\" cy=\"201\" rx=\"54\" ry=\"26\" transform=\"rotate(-33 227 201)\"/><ellipse cx=\"388\" cy=\"180\" rx=\"65\" ry=\"31\" transform=\"rotate(30 388 180)\"/><ellipse cx=\"165\" cy=\"287\" rx=\"60\" ry=\"26\" transform=\"rotate(-22 165 287)\"/><ellipse cx=\"417\" cy=\"276\" rx=\"58\" ry=\"29\" transform=\"rotate(28 417 276)\"/><ellipse cx=\"405\" cy=\"408\" rx=\"63\" ry=\"29\" transform=\"rotate(41 405 408)\"/></g><path d=\"M238 392h173l-20 147q-65 27-132 0z\" fill=\"url(#pot)\"/><ellipse cx=\"325\" cy=\"391\" rx=\"88\" ry=\"19\" fill=\"#dce4c9\"/><ellipse cx=\"325\" cy=\"393\" rx=\"76\" ry=\"11\" fill=\"#788066\"/><path d=\"M260 416q-7 80 5 112\" fill=\"none\" stroke=\"#fff\" stroke-opacity=\".42\" stroke-width=\"8\"/></svg>"});


/* engine/commerce.mjs */
/** StoreCanvas commerce primitives for the generated independent starter theme.
 * Server-rendered Liquid is the source of truth. JS progressively updates product
 * variant price/media/quantity and never bypasses native Shopify forms. */
const PRODUCT_SECTION = String.raw`{% liquid
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

const CART_SECTION = String.raw`<section class="sc-commerce sc-cart" aria-labelledby="sc-cart-title">
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

const COMMERCE_JS = String.raw`(()=>{'use strict';
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


/* engine/theme.mjs */
/** StoreCanvas v0.5: one validated preview document => Shopify Online Store 2.0 package.
 * Pure ESM; no auth, network access, or live theme publishing. */



const schema = json => `{% schema %}${JSON.stringify(json)}{% endschema %}`;
const section = (name, body) => `${body}\n${schema({name, settings:[], presets:[{name}]})}`;
const template = name => JSON.stringify({sections:{main:{type:name,settings:{}}},order:['main']});
const cssExtra = `
body{margin:0;color:#183522;background:#fff;font-family:Arial,sans-serif}
.sc-site-header,.sc-site-footer{padding:18px max(18px,4vw);display:flex;align-items:center;justify-content:space-between;gap:24px;background:#f4f6f0;color:#183522}
.sc-site-nav{display:flex;flex-wrap:wrap;gap:18px}.sc-site-nav a{text-decoration:none;color:inherit}
.sc-commerce{max-width:1150px;margin:30px auto;padding:24px}.sc-commerce-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:24px}
.sc-commerce-grid img,.sc-product-main img{width:100%;height:auto;object-fit:cover}.sc-commerce a{color:inherit}.sc-product-main{display:grid;grid-template-columns:1fr 1fr;gap:48px}
.sc-cta{display:inline-flex;align-items:center;justify-content:center;min-height:44px;border:0;border-radius:8px;background:#245538;color:white;padding:12px 24px;text-decoration:none;font-weight:700}
.sc-commerce :is(input,select,button){font:inherit;max-width:100%}.sc-commerce input[type=number]{width:72px}.sc-commerce form{display:grid;gap:12px}.sc-product-price{font-size:1.5rem;font-weight:700}.sc-commerce label{font-weight:600}.sc-commerce button:disabled{opacity:.55;cursor:not-allowed}.sc-cart-actions{display:flex;flex-wrap:wrap;gap:12px}.sc-cta-secondary{background:#e1e7df;color:#183522}.sc-discount{color:#236643}.sc-product-placeholder{height:350px;background:#e7ecdf}
.sc-cart-row{display:flex;align-items:center;gap:22px;border-bottom:1px solid #ddd;padding:18px 0}.sc-cart-row img{width:84px;height:98px;object-fit:cover}
@media(max-width:700px){.sc-product-main{grid-template-columns:1fr}.sc-site-header{align-items:flex-start;flex-direction:column}}
`;
const header = section('StoreCanvas header', `<header class="sc-site-header"><a href="{{ routes.root_url }}" aria-label="{{ shop.name | escape }} home"><strong>{{ shop.name | escape }}</strong></a><nav class="sc-site-nav" aria-label="Main navigation"><a href="{{ routes.root_url }}">Home</a><a href="{{ routes.all_products_collection_url }}">Shop</a><a href="{{ routes.cart_url }}">Cart ({{ cart.item_count }})</a></nav></header>`);
const footer = section('StoreCanvas footer', `<footer class="sc-site-footer"><span>&copy; {{ 'now' | date: '%Y' }} {{ shop.name | escape }}</span><a href="{{ routes.root_url }}">Home</a></footer>`);
const product = section('StoreCanvas product', PRODUCT_SECTION);
const collection = section('StoreCanvas collection', `<div class="sc-commerce"><h1>{{ collection.title | escape }}</h1><div>{{ collection.description }}</div>{% paginate collection.products by 24 %}<div class="sc-commerce-grid">{% for p in collection.products %}<a href="{{ p.url }}">{% if p.featured_image %}{{ p.featured_image | image_url: width: 640 | image_tag: loading: 'lazy' }}{% endif %}<h2>{{ p.title | escape }}</h2><p>{{ p.price | money }}</p></a>{% endfor %}</div>{{ paginate | default_pagination }}{% endpaginate %}</div>`);
const cart = section('StoreCanvas cart', CART_SECTION);
const page = section('StoreCanvas page', '<article class="sc-commerce"><h1>{{ page.title | escape }}</h1>{{ page.content }}</article>');
const search = section('StoreCanvas search', `<div class="sc-commerce"><h1>Search</h1><form method="get" action="{{ routes.search_url }}"><label for="sc-search">Search products</label><input id="sc-search" name="q" type="search" value="{{ search.terms | escape }}"><button class="sc-cta" type="submit">Search</button></form><div class="sc-commerce-grid">{% for p in search.results %}<a href="{{ p.url }}">{% if p.featured_image %}{{ p.featured_image | image_url: width: 640 | image_tag: loading: 'lazy' }}{% endif %}<h2>{{ p.title | escape }}</h2></a>{% endfor %}</div></div>`);
const notFound = section('StoreCanvas 404', '<div class="sc-commerce"><h1>Page not found</h1><a class="sc-cta" href="{{ routes.root_url }}">Go home</a></div>');

const ALLOWED_IMG = new Set(['png','jpeg','webp','gif']);
function decodeImage(uri){const match=/^data:image\/(png|jpeg|webp|gif);base64,([A-Za-z0-9+/=]+)$/i.exec(uri);
 if(!match || !ALLOWED_IMG.has(match[1].toLowerCase()))throw Error('Unsupported uploaded image');
 let raw;try{raw=atob(match[2]);}catch{throw Error('Invalid base64 image');}
 const bytes=Uint8Array.from(raw, c=>c.charCodeAt(0)); if(!bytes.length||bytes.length>700000)throw Error('Uploaded image too large for ZIP export');
 const type=match[1].toLowerCase();
 const signatures={png:[137,80,78,71,13,10,26,10],jpeg:[255,216,255],gif:[71,73,70,56],webp:[82,73,70,70]};
 if(!signatures[type].every((n,i)=>bytes[i]===n))throw Error(`Invalid ${type} image signature`);
 if(type==='webp' && String.fromCharCode(...bytes.slice(8,12))!=='WEBP')throw Error('Invalid WebP signature');
 return {bytes, extension:type==='jpeg'?'jpg':type};
}
function replaceMedia(html,files){
 // Remove Liquid interpreter syntax from all merchant-authored content, before inserting trusted asset_url expressions.
 let result=html.replaceAll('{','&#123;').replaceAll('}','&#125;');
 const builtIn=/<span class="sc-media-placeholder" aria-hidden="true" data-sc-asset="([A-Za-z0-9_-]+)"><\/span>/g;
 result=result.replace(builtIn,(_,name)=>{const svg=BUILTIN_IMAGES[name];if(!svg)throw Error(`Unknown bundled asset: ${name}`);
 const filename=`storecanvas-${name}.svg`;files.set(`assets/${filename}`,svg);
 const view=svg.match(/viewBox="0 0 (\d+) (\d+)"/);
 const width=view?Number(view[1]):640,height=view?Number(view[2]):600;
 return `<img loading="lazy" decoding="async" width="${width}" height="${height}" alt="Botanical illustration" src="{{ '${filename}' | asset_url }}">`;});
 let uploaded=0;const assetNames=new Map();
 result=result.replace(/src="(data:image\/(?:png|jpeg|webp|gif);base64,[A-Za-z0-9+/=]+)"/gi,(original,url)=>{
   if(!assetNames.has(url)){
     const {bytes,extension}=decodeImage(url);const name=`storecanvas-upload-${++uploaded}.${extension}`;
     files.set(`assets/${name}`,bytes);assetNames.set(url,name);
   }
   const name=assetNames.get(url);return `src="{{ '${name}' | asset_url }}"`;
 });
 // Unresolved image data URLs would bloat templates or leak data; block instead.
 if(/data:image\/|data-sc-asset=/.test(result))throw Error('Unresolved image source in export');
 // Shopify route objects preserve language and market-specific paths.
 return result.replace(/href="\/collections\/all"/g,'href="{{ routes.all_products_collection_url }}"')
   .replace(/href="\/cart"/g,'href="{{ routes.cart_url }}"');
}

function compileShopifyTheme(project){
 const preview=renderPreview(project); // validates before any generated file
 const files=new Map(); const homeHtml=replaceMedia(preview.html,files);
 const liquid=section('StoreCanvas homepage',`<main class="sc-page">${homeHtml}</main>`);
 if(new TextEncoder().encode(liquid).length>230000)throw Error('Homepage exceeds safe Shopify section size; split it into pages');
 files.set('layout/theme.liquid',`<!doctype html><html lang="{{ request.locale.iso_code }}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>{{ page_title | escape }} – {{ shop.name | escape }}</title>{{ content_for_header }}{{ 'storecanvas.css' | asset_url | stylesheet_tag }}<script>window.SC_HAPTICS_ENABLED=${preview.document.settings.haptics?'true':'false'};</script><script src="{{ 'storecanvas.js' | asset_url }}" defer></script><script src="{{ 'storecanvas-commerce.js' | asset_url }}" defer></script></head><body><a class="sc-skip" href="#MainContent">Skip to content</a>{% section 'storecanvas-header' %}<div id="MainContent">{{ content_for_layout }}</div>{% section 'storecanvas-footer' %}</body></html>`);
 files.set('assets/storecanvas.css',preview.css+cssExtra);files.set('assets/storecanvas.js',preview.js);files.set('assets/storecanvas-commerce.js',COMMERCE_JS);
 const sections={'storecanvas-home':liquid,'storecanvas-header':header,'storecanvas-footer':footer,'main-product':product,'main-collection':collection,'main-cart':cart,'main-page':page,'main-search':search,'main-404':notFound};
 for(const [name,body] of Object.entries(sections))files.set(`sections/${name}.liquid`,body);
 const templates={index:'storecanvas-home',product:'main-product',collection:'main-collection',cart:'main-cart',page:'main-page',search:'main-search','404':'main-404'};
 for(const [name,sectionName] of Object.entries(templates))files.set(`templates/${name}.json`,template(sectionName));
 files.set('config/settings_schema.json',JSON.stringify([{name:'theme_info',theme_name:'StoreCanvas Starter',theme_author:'StoreCanvas',theme_version:'0.6.0',theme_documentation_url:'https://shopify.dev/docs/storefronts/themes',theme_support_url:'https://shopify.dev/'}]));
 files.set('locales/en.default.json','{}');
 return files;
}


/* engine/zip.mjs */
/** Small deterministic ZIP store writer (no compression, no external packages). */
const te=new TextEncoder();const buf=x=>x instanceof Uint8Array?x:te.encode(String(x));
function crc32(bytes){let crc=0xffffffff;for(const b of bytes){crc^=b;for(let i=0;i<8;i++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);}return(crc^0xffffffff)>>>0;}
function themeZip(files){if(!(files instanceof Map)||files.size===0)throw Error('No ZIP files');if(files.size>500)throw Error('Too many ZIP files');
 const chunks=[],central=[];let offset=0,count=0;const view=(a)=>new DataView(a.buffer,a.byteOffset,a.byteLength);
 for(const [name,value] of files){if(typeof name!=='string'||!/^(assets|layout|sections|templates|config|locales)\/[a-z0-9_.\/-]+$/i.test(name)||name.includes('..'))throw Error('Invalid ZIP entry path');
 const nameBytes=te.encode(name),data=buf(value);if(data.length>6_000_000)throw Error('ZIP file too large');const crc=crc32(data);
 const local=new Uint8Array(30+nameBytes.length),l=view(local);l.setUint32(0,0x04034b50,true);l.setUint16(4,20,true);l.setUint16(6,0x0800,true);l.setUint32(14,crc,true);l.setUint32(18,data.length,true);l.setUint32(22,data.length,true);l.setUint16(26,nameBytes.length,true);local.set(nameBytes,30);
 const dir=new Uint8Array(46+nameBytes.length),d=view(dir);d.setUint32(0,0x02014b50,true);d.setUint16(4,20,true);d.setUint16(6,20,true);d.setUint16(8,0x0800,true);d.setUint32(16,crc,true);d.setUint32(20,data.length,true);d.setUint32(24,data.length,true);d.setUint16(28,nameBytes.length,true);d.setUint32(42,offset,true);dir.set(nameBytes,46);
 chunks.push(local,data);central.push(dir);offset+=local.length+data.length;count++;
 }
 const size=central.reduce((n,b)=>n+b.length,0);const end=new Uint8Array(22),e=view(end);e.setUint32(0,0x06054b50,true);e.setUint16(8,count,true);e.setUint16(10,count,true);e.setUint32(12,size,true);e.setUint32(16,offset,true);
 return new Blob([...chunks,...central,end],{type:'application/zip'});
}


window.StoreCanvasEngine=Object.freeze({validateProject,renderPreview,compileShopifyTheme,themeZip});
})();
