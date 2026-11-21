/* StoreCanvas Studio v0.2 — offline-first, freeform layers and motion builder.
   All project content stays in the browser unless explicitly exported. */
'use strict';
const $=s=>document.querySelector(s);
const $$=s=>[...document.querySelectorAll(s)];
const clone=x=>JSON.parse(JSON.stringify(x));
const uid=()=> 'sc_'+Math.random().toString(36).slice(2,10);
const clamp=(v,a,b,def=a)=>Math.min(b,Math.max(a,Number.isFinite(+v)?+v:def));
const esc=(v)=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const sanitizeColor=(v,f='#ffffff')=>/^#[0-9a-f]{3,8}$/i.test(String(v))?v:f;
const safeLink=v=>/^(\/|#|https:\/\/)/.test(String(v||''))?String(v):'#';
const opt=(v,arr,def)=>arr.includes(v)?v:def;
const DEVICES={desktop:1100,tablet:750,mobile:390};
const TYPES=[['text','T','Text'],['image','▧','Image'],['button','▰','Button'],['container','▣','Container'],['shape','◯','Shape'],['slideshow','▤','Slideshow']];
const ENTRANCES=['none','fade-up','fade-in','slide-left','slide-right','zoom-in','rotate-in','bounce','reveal','float','pulse','wiggle'];
const HOVERS=['none','lift','scale','tilt','glow','shake'];
const EASINGS=['ease','ease-in','ease-out','ease-in-out','linear','cubic-bezier(0.2,0.7,0.2,1)'];
const TRANSITIONS=['fade','slide','zoom'];
const BUILTINS=['plant','fern','architecture','detail'];
const EMPTY_MOTION=()=>({enter:'none',trigger:'load',duration:800,delay:0,easing:'ease-out',hover:'none',haptic:'off',keyframes:[]});
const MOTION_ENGINE=()=>window.StoreCanvasEngine;
function keyframeWidget(l){
 const frames=l.motion?.keyframes||[];
 if(!frames.length)return `<div class="insp-group"><h3>Keyframe studio</h3><p class="muted-note">Animate position, scale, rotation and opacity across a custom timeline. Compatible with the exported Shopify storefront.</p><button class="btn btn-outline" data-action="kf-enable">＋ Create keyframe animation</button></div>`;
 return `<div class="insp-group"><h3>Keyframe studio · ${frames.length}/12</h3><p class="muted-note">Offsets must increase from 0% to 100%. All values are exported to Shopify CSS. Use the timeline scrubber to preview the selected layer.</p>${frames.map((f,i)=>`<div class="kf-card"><div class="kf-card-title"><strong>${i===0?'Start':i===frames.length-1?'Finish':'Keyframe '+(i+1)}</strong><span>${f.at}%</span>${i!==0&&i!==frames.length-1?`<button data-action="kf-remove" data-index="${i}" title="Remove this keyframe" aria-label="Remove keyframe ${i+1}">×</button>`:''}</div><div class="field-grid3">${field('Time %','keyframe.'+i+'.at',f.at,'number',null,'min="0" max="100" step="1" '+(i===0||i===frames.length-1?'readonly':''))}${field('X px','keyframe.'+i+'.x',f.x,'number',null,'min="-600" max="600"')}${field('Y px','keyframe.'+i+'.y',f.y,'number',null,'min="-600" max="600"')}${field('Scale','keyframe.'+i+'.scale',f.scale,'number',null,'min="0.1" max="3" step="0.05"')}${field('Rotate °','keyframe.'+i+'.rotate',f.rotate,'number',null,'min="-360" max="360"')}${field('Opacity %','keyframe.'+i+'.opacity',f.opacity,'number',null,'min="0" max="100"')}</div></div>`).join('')}<div class="quick-actions"><button data-action="kf-add" ${frames.length>=12?'disabled':''}>＋ Add middle keyframe</button><button data-action="kf-clear">Remove custom motion</button></div></div>`;
}
function scrubCurrent(){
 const root=$('#sectionStack');if(!root)return;
 root.querySelectorAll('.sc-motion-surface').forEach(n=>{n.style.removeProperty('transform');n.style.removeProperty('opacity')});
 if(ui.scrub===null||ui.playing)return;
 const l=layer(),f=l?.motion?.keyframes;if(!f?.length)return;
 const k=MOTION_ENGINE().atProgress(f,ui.scrub);
 const target=Array.from(root.querySelectorAll('.sc-node')).find(n=>n.dataset.node===l.id)?.querySelector('.sc-motion-surface');
 if(target&&k){target.style.transform=`translate3d(${k.x}px, ${k.y}px, 0) rotate(${k.rotate}deg) scale(${k.scale})`;target.style.opacity=String(k.opacity/100)}
}

function node(type,name,x,y,w,h,more={}){
 return {id:uid(),type,name,x,y,w,h,z:1,parentId:null,rotation:0,opacity:100,hidden:false,locked:false,fill:'#ffffff',color:'#183522',radius:18,shadow:0,feather:0,blend:'normal',text:'Edit this text',fontSize:35,fontWeight:600,fontFamily:'Georgia, serif',image:'asset:plant',fit:'cover',link:'/collections/all',motion:EMPTY_MOTION(),slides:[{image:'asset:fern',caption:'Inspired by nature'},{image:'asset:detail',caption:'The details matter'},{image:'asset:architecture',caption:'Made to last'}],transition:'fade',autoplay:true,interval:3500,mobile:null,tablet:null,...more};
}
function newSection(name='New section',height=420,bg='#f2f3ec'){
 return {id:uid(),name,height,mobileHeight:720,tabletHeight:Math.round(height*.8),bg,radius:28,clip:true,layers:[]};
}
function starter(){
 const hero=newSection('Hero · editorial',600,'#eff0e9');hero.mobileHeight=775;
 hero.layers=[
  node('text','Eyebrow',54,91,430,28,{text:'DESIGNED FOR BALANCE',fontSize:13,fontWeight:800,fontFamily:'Arial, sans-serif',color:'#3e654d',mobile:{x:22,y:48,w:310,h:24}}),
  node('text','Main headline',54,148,555,195,{text:'Restoring balance —\nEmpowering change.',fontSize:62,fontWeight:550,fontFamily:'Georgia, serif',color:'#172f20',motion:{...EMPTY_MOTION(),enter:'fade-up',duration:900,delay:100},mobile:{x:22,y:94,w:345,h:175},tablet:{x:38,y:117,w:410,h:190}}),
  node('text','Introduction',54,370,470,73,{text:'Thoughtfully designed pieces that make everyday living feel a little more natural.',fontSize:18,fontFamily:'Arial, sans-serif',fontWeight:400,color:'#5b715f',mobile:{x:22,y:286,w:330,h:90}}),
  node('button','Primary action',54,482,166,48,{text:'EXPLORE MORE ↗',fontSize:13,fontFamily:'Arial, sans-serif',fontWeight:700,fill:'#225335',color:'#ffffff',radius:8,motion:{...EMPTY_MOTION(),hover:'lift',haptic:'soft'},mobile:{x:22,y:389,w:170,h:49}}),
  node('image','Botanical visual',542,18,515,540,{image:'asset:plant',fit:'contain',radius:0,blend:'multiply',motion:{...EMPTY_MOTION(),enter:'slide-left',delay:200,duration:1050,hover:'scale'},mobile:{x:12,y:454,w:360,h:300}}),
  node('text','Corner detail',807,548,220,18,{text:'NATURALLY CURATED · 2026',fontSize:10,fontWeight:800,fontFamily:'Arial, sans-serif',color:'#718475',mobile:{x:130,y:730,w:230,h:20}})
 ];
 const cards=newSection('Editorial cards',560,'#ffffff');cards.mobileHeight=1130;
 const parent=node('container','Rounded image card',36,202,507,302,{fill:'#e5e7dc',radius:25,mobile:{x:16,y:168,w:358,h:335}});
 const ci=node('image','Card photograph',0,0,507,302,{parentId:parent.id,image:'asset:fern',radius:25,mobile:{x:0,y:0,w:358,h:335},motion:{...EMPTY_MOTION(),hover:'scale'}});
 const tag=node('text','Card title',24,237,450,51,{parentId:parent.id,text:'GROWING POSSIBILITIES',fontFamily:'Arial, sans-serif',fontSize:21,fontWeight:800,color:'#ffffff',mobile:{x:19,y:266,w:320,h:45}});
 cards.layers=[
  node('text','Section eyebrow',260,26,580,24,{text:'OUR APPROACH TO A BETTER WORLD',fontFamily:'Arial, sans-serif',fontSize:12,fontWeight:800,color:'#6f8972',mobile:{x:21,y:30,w:348,h:22}}),
  node('text','Section heading',240,67,650,101,{text:'Where nature thrives,\nand adventure awaits.',fontSize:42,fontWeight:550,color:'#1f3222',mobile:{x:21,y:71,w:350,h:105},motion:{...EMPTY_MOTION(),enter:'fade-up',trigger:'scroll'}}),
  parent,ci,tag,
  node('image','Architecture image',569,202,236,300,{image:'asset:architecture',radius:23,mobile:{x:16,y:520,w:169,h:260},motion:{...EMPTY_MOTION(),enter:'fade-up',trigger:'scroll',delay:180}}),
  node('image','Leafy image',823,202,245,300,{image:'asset:detail',radius:23,mobile:{x:203,y:520,w:171,h:260},motion:{...EMPTY_MOTION(),enter:'fade-up',trigger:'scroll',delay:300}}),
  node('text','Footnote',594,512,420,23,{text:'INNOVATION · SUSTAINABILITY · CREATIVITY',fontFamily:'Arial, sans-serif',fontSize:11,fontWeight:800,color:'#6c826c',mobile:{x:24,y:805,w:340,h:25}})
 ];
 const slides=newSection('Feature slideshow',470,'#e9ede4');slides.mobileHeight=850;
 slides.layers=[
  node('slideshow','Feature slideshow',39,37,495,397,{radius:25,interval:3200,transition:'fade',slides:[{image:'asset:architecture',caption:'Thoughtful environments'},{image:'asset:detail',caption:'Spaces that inspire'},{image:'asset:fern',caption:'A greener tomorrow'}],motion:{...EMPTY_MOTION(),enter:'zoom-in',trigger:'scroll',duration:850,haptic:'soft'},mobile:{x:16,y:28,w:357,h:347}}),
  node('text','Feature kicker',586,97,380,25,{text:'A BETTER WAY TO LIVE',fontFamily:'Arial, sans-serif',fontSize:12,fontWeight:800,color:'#578260',mobile:{x:25,y:415,w:340,h:25}}),
  node('text','Feature headline',581,154,436,135,{text:'Your vision,\nbeautifully brought\nto life.',fontSize:39,color:'#203d26',mobile:{x:25,y:450,w:334,h:148},motion:{...EMPTY_MOTION(),enter:'fade-up',trigger:'scroll',delay:160}}),
  node('text','Feature description',586,313,414,70,{text:'A curated story told through movement, texture, carefully layered spaces and interactive moments.',fontFamily:'Arial, sans-serif',fontSize:16,fontWeight:400,color:'#5f7663',mobile:{x:25,y:617,w:337,h:105}}),
  node('button','Explore button',586,396,190,48,{text:'EXPLORE COLLECTION ↗',fontFamily:'Arial, sans-serif',fontSize:12,fontWeight:800,fill:'#23462f',color:'#ffffff',radius:8,motion:{...EMPTY_MOTION(),hover:'scale',haptic:'medium'},mobile:{x:25,y:743,w:196,h:49}})
 ];
 return {version:2,name:'Botanical concept',settings:{snap:true,haptics:true},sections:[hero,cards,slides]};
}
let project=loadProject();let ui={sectionId:project.sections[0]?.id,selectedId:project.sections[0]?.layers[1]?.id,device:'desktop',panel:'elements',tab:'design',playing:false,scrub:null};
let undoStack=[],redoStack=[],drag=null,slideTimers=[],observer=null,toastTimer=null,slideIndexes={};
const STORAGE='storecanvas-studio-v02';
function loadProject(){try{let d=JSON.parse(localStorage.getItem('storecanvas-studio-v02'));if(d?.version===2&&Array.isArray(d.sections)&&d.sections.length)return validateProject(d)}catch(e){}return starter()}
function section(){return project.sections.find(x=>x.id===ui.sectionId)||project.sections[0]}
function layer(){return section()?.layers.find(x=>x.id===ui.selectedId)||null}
function findLayer(s,id){return s.layers.find(x=>x.id===id)}
function saveLocal(){try{localStorage.setItem(STORAGE,JSON.stringify(project));$('#saveStatus').innerHTML='<span class="dot"></span> Locally saved'}catch(e){$('#saveStatus').textContent='Autosave unavailable · Save JSON';notify('Local autosave is unavailable here; use Save JSON to back up your project')}}
function checkpoint(prev){undoStack.push(prev||clone(project));if(undoStack.length>80)undoStack.shift();redoStack=[];saveLocal();updateHistoryBtns()}
function change(fn,render=true){const prev=clone(project);fn();checkpoint(prev);if(render)renderAll()}
function undo(){if(!undoStack.length)return;redoStack.push(clone(project));project=undoStack.pop();repairSelection();saveLocal();renderAll()}
function redo(){if(!redoStack.length)return;undoStack.push(clone(project));project=redoStack.pop();repairSelection();saveLocal();renderAll()}
function repairSelection(){if(!section())ui.sectionId=project.sections[0]?.id; if(ui.selectedId!==null&&!section()?.layers.some(x=>x.id===ui.selectedId))ui.selectedId=section()?.layers[0]?.id||null}
function updateHistoryBtns(){$('#undoBtn').disabled=!undoStack.length;$('#redoBtn').disabled=!redoStack.length}
function notify(msg){const el=$('#toast');el.textContent=msg;el.classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('visible'),2800)}
function haptic(kind='soft'){if(!project.settings.haptics||!('vibrate' in navigator))return false;try{return navigator.vibrate(kind==='medium'?[18,22,19]:[12])}catch(e){return false}}
function assetUrl(v){v=String(v||'');if(v.startsWith('asset:'))return BUILTINS.includes(v.split(':')[1])?'assets/'+v.split(':')[1]+'.svg':'assets/plant.svg';if(/^https:\/\//i.test(v)||/^data:image\/(?:png|jpeg|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(v))return v;return 'assets/plant.svg'}
function dims(s){return ui.device==='mobile'?s.mobileHeight:ui.device==='tablet'?s.tabletHeight:s.height}
function boundBox(l,dev=ui.device){if(dev==='desktop')return {x:l.x,y:l.y,w:l.w,h:l.h};if(l[dev])return {...l[dev]};const factor=DEVICES[dev]/1100;return {x:Math.round(l.x*factor),y:Math.round(l.y*(dev==='tablet'?.87:1)),w:Math.round(l.w*factor),h:Math.round(l.h*(dev==='tablet'?.87:1))}}
function getFontSize(l,dev=ui.device){const v=clamp(l.fontSize,8,160,24);if(dev==='desktop')return v;if(Number.isFinite(+l[dev]?.fontSize))return clamp(l[dev].fontSize,8,160,v);return dev==='mobile'?(v>=35?Math.round(v*.62):v>=22?Math.round(v*.83):Math.max(11,Math.round(v*.94))):(v>=35?Math.round(v*.84):v)}
function updateBox(l,box){if(ui.device==='desktop'){for(const k of ['x','y','w','h'])l[k]=Math.round(box[k])}else l[ui.device]={...box}}
function isSelected(l){return ui.selectedId===l.id&&ui.sectionId===section().id}
function renderLayer(s,l,preview=false){
 if(l.hidden)return '';
 const b=boundBox(l),m=l.motion||EMPTY_MOTION(),radius=clamp(l.radius,0,150,12),rotation=clamp(l.rotation,-360,360,0),opacity=clamp(l.opacity,0,100,100)/100;
 const children=s.layers.filter(x=>x.parentId===l.id).sort((a,b)=>a.z-b.z).map(x=>renderLayer(s,x,preview)).join('');
 let interior='';
 if(l.type==='text')interior=`<div class="sc-layer-content sc-layer-text" style="font-family:${opt(l.fontFamily,['Georgia, serif','Arial, sans-serif','Inter, sans-serif'],'Georgia, serif')};font-size:${getFontSize(l)}px;font-weight:${clamp(l.fontWeight,100,900,600)};color:${sanitizeColor(l.color,'#1d3c24')}">${esc(l.text)}</div>`;
 else if(l.type==='button')interior=`<a class="sc-layer-button" href="${esc(safeLink(l.link))}" data-action="button" style="background:${sanitizeColor(l.fill,'#28573b')};color:${sanitizeColor(l.color,'#ffffff')};border-radius:${radius}px;font-size:${getFontSize(l)}px;font-family:${opt(l.fontFamily,['Georgia, serif','Arial, sans-serif','Inter, sans-serif'],'Arial, sans-serif')}">${esc(l.text)}</a>`;
 else if(l.type==='image')interior=`<div class="sc-layer-content sc-layer-image" style="border-radius:${radius}px;box-shadow:0 10px ${clamp(l.shadow,0,60,0)}px #1a301d30"><img src="${esc(assetUrl(l.image))}" alt="${esc(l.name)}" draggable="false" style="object-fit:${opt(l.fit,['cover','contain'],'cover')};${l.feather>0?`-webkit-mask-image:radial-gradient(ellipse,black ${Math.max(35,100-clamp(l.feather,0,55,0)*1.1)}%,transparent 100%);mask-image:radial-gradient(ellipse,black ${Math.max(35,100-clamp(l.feather,0,55,0)*1.1)}%,transparent 100%)`:''}"></div>`;
 else if(l.type==='container')interior=`<div class="sc-layer-container" style="background:${sanitizeColor(l.fill,'#ffffff')};border-radius:${radius}px;box-shadow:0 9px ${clamp(l.shadow,0,60,0)}px #1a301d28">${children}</div>`;
 else if(l.type==='shape')interior=`<div class="sc-layer-shape" style="background:${sanitizeColor(l.fill,'#eff1e8')};border-radius:${radius}px;box-shadow:0 9px ${clamp(l.shadow,0,60,0)}px #1a301d30"></div>`;
 else if(l.type==='slideshow'){
  const slides=(l.slides||[]).slice(0,16).map((slide,i)=>`<div class="sc-slide ${i===(slideIndexes[l.id]||0)?'is-active':''}" data-slideindex="${i}"><img src="${esc(assetUrl(slide.image))}" alt="${esc(slide.caption||'Slideshow image')}" draggable="false"><div class="sc-slide-caption">${esc(slide.caption||'')}</div></div>`).join('');
  const dots=(l.slides||[]).slice(0,16).map((sl,i)=>`<button aria-label="Go to slide ${i+1}" data-action="slide-dot" data-index="${i}" class="${i===(slideIndexes[l.id]||0)?'active':''}"></button>`).join('');
  interior=`<div class="sc-layer-slideshow" data-show-id="${esc(l.id)}" data-transition="${opt(l.transition,TRANSITIONS,'fade')}" style="border-radius:${radius}px;--sc-speed:.65s">${slides}<button class="sc-slide-control sc-slide-prev" data-action="slide-prev" aria-label="Previous slide">‹</button><button class="sc-slide-control sc-slide-next" data-action="slide-next" aria-label="Next slide">›</button><div class="sc-dots">${dots}</div></div>`;
 }
 const hover=opt(m.hover,HOVERS,'none');
 return `<div class="sc-node ${isSelected(l)&&!ui.playing?'is-selected':''} ${l.locked?'is-locked':''} sc-hover-${hover}" data-node="${esc(l.id)}" data-section="${esc(s.id)}" style="left:${b.x}px;top:${b.y}px;width:${b.w}px;height:${b.h}px;z-index:${clamp(l.z,0,999,1)};transform:rotate(${rotation}deg);opacity:${opacity};mix-blend-mode:${opt(l.blend,['normal','multiply','screen','darken','lighten'],'normal')};--motion-duration:${clamp(m.duration,100,8000,800)/1000}s;--motion-delay:${clamp(m.delay,0,8000,0)/1000}s;--motion-easing:${opt(m.easing,EASINGS,'ease-out')}"><div class="sc-motion-surface" data-entrance="${opt(m.enter,ENTRANCES,'none')}">${interior}</div>${l.locked||ui.playing?'':'<span class="resize-handle" data-resize="true" title="Resize"></span>'}</div>`;
}
function stopSlideTimers(){for(const t of slideTimers)clearInterval(t);slideTimers=[];if(observer){observer.disconnect();observer=null}}
function renderCanvas(){stopSlideTimers();const root=$('#sectionStack');const sSelected=section();if(!sSelected)return;
 const styles=$('#sc-editor-keyframe-style')||document.head.appendChild(Object.assign(document.createElement('style'),{id:'sc-editor-keyframe-style'}));
 styles.textContent=project.sections.flatMap(x=>x.layers).filter(n=>n.motion?.keyframes?.length).map(n=>{try{return MOTION_ENGINE().keyframeCSS(n.id,n.motion.keyframes).replace(`.sc-layer-${n.id}.sc-visible>.sc-keyframe-surface`,`[data-node="${n.id}"].sc-motion-active>.sc-motion-surface`)}catch{return ''}}).join('\n');
 root.innerHTML=project.sections.map(s=>`<div class="canvas-section ${s.id===sSelected.id&&!ui.playing?'selected-section':''}" data-section="${esc(s.id)}" style="height:${clamp(dims(s),150,2500,600)}px;background:${sanitizeColor(s.bg,'#ffffff')};border-radius:${clamp(s.radius,0,160,24)}px;overflow:${s.clip===false?'visible':'hidden'}"><span class="section-label">${esc(s.name)}</span>${s.layers.filter(l=>!l.parentId||!findLayer(s,l.parentId)).sort((a,b)=>a.z-b.z).map(l=>renderLayer(s,l)).join('')}</div>`).join('');
 $('#pagePreview').className='page-preview '+ui.device;
 $('#currentSectionName').textContent=sSelected.name;
 $('#editorHint').textContent=ui.playing?'Live preview · hover, click slideshow controls, or test a button · click Stop preview to edit again':'Drag layers on canvas · resize with the corner handle · double-click text to edit · Shift = precise movement';
 $('#app').classList.toggle('playing',ui.playing);$('#playBtn').textContent=ui.playing?'■ Stop preview':'▶ Preview motion';
 if(ui.playing){
   root.querySelectorAll('.sc-node').forEach(el=>{const l=project.sections.flatMap(s=>s.layers).find(x=>x.id===el.dataset.node);if(!l||(l.motion?.enter==='none'&&!l.motion?.keyframes?.length))return;if(l.motion?.trigger==='scroll')return;el.classList.add('sc-motion-active')});
   if('IntersectionObserver' in window){observer=new IntersectionObserver(entries=>{for(const e of entries)if(e.isIntersecting){const l=project.sections.flatMap(s=>s.layers).find(x=>x.id===e.target.dataset.node);if(l?.motion?.trigger==='scroll')e.target.classList.add('sc-motion-active')}},{threshold:.2});root.querySelectorAll('.sc-node').forEach(el=>observer.observe(el));}
   root.querySelectorAll('[data-show-id]').forEach(el=>{const sl=project.sections.flatMap(s=>s.layers).find(x=>x.id===el.dataset.showId);if(sl?.autoplay&&sl.slides?.length>1)slideTimers.push(setInterval(()=>advanceSlide(sl.id,1),clamp(sl.interval,1000,12000,3500)))});
 }
 scrubCurrent();
}
function advanceSlide(id,delta,nextIndex=null){let el=Array.from(document.querySelectorAll('[data-show-id]')).find(x=>x.dataset.showId===id),l=project.sections.flatMap(s=>s.layers).find(x=>x.id===id);if(!el||!l||!l.slides?.length)return;const old=slideIndexes[id]||0;const idx=nextIndex===null?(old+delta+l.slides.length)%l.slides.length:clamp(nextIndex,0,l.slides.length-1,0);slideIndexes[id]=idx;el.querySelectorAll('.sc-slide').forEach((s,i)=>s.classList.toggle('is-active',i===idx));el.querySelectorAll('.sc-dots button').forEach((s,i)=>s.classList.toggle('active',i===idx))}
function leftPanel(){const root=$('#leftContent');$$('[data-panel]').forEach(b=>b.classList.toggle('active',b.dataset.panel===ui.panel));
 if(ui.panel==='elements'){
 root.innerHTML=`<p class="panel-note">Add anything to a section. Nest layers inside a selected container and move them freely.</p><div class="tiny-title">ELEMENT LIBRARY <span>06 ELEMENTS</span></div><div class="element-grid">${TYPES.map(([k,icon,name])=>`<button class="element-tile" data-add="${k}"><span class="element-icon">${icon}</span><span>${name}</span></button>`).join('')}</div><button class="add-section" data-action="new-section">＋ Add a new page section</button><div class="feature-card"><strong>✦ Unlimited design freedom</strong><p>Drag & resize layers, create nested containers, mix images, and animate every element.</p></div>`;
 }else if(ui.panel==='layers'){
 root.innerHTML=`<p class="panel-note">Select, lock, hide, and reorder layers. Objects inside containers move with their parent.</p>`+project.sections.map(s=>`<div class="layer-section"><div class="layer-section-h"><button data-select-section="${esc(s.id)}">▾</button><button data-select-section="${esc(s.id)}" style="flex:1;text-align:left;color:${ui.sectionId===s.id?'#b9ebc7':'#c0d4c1'}">${esc(s.name)}</button><button data-move-section="${esc(s.id)}" data-dir="-1" title="Move section up">↑</button><button data-move-section="${esc(s.id)}" data-dir="1" title="Move section down">↓</button><button data-rename-section="${esc(s.id)}" title="Rename">✎</button></div><div class="layer-list">${s.layers.filter(l=>!l.parentId||!findLayer(s,l.parentId)).sort((a,b)=>b.z-a.z).map(l=>layerRow(s,l,0)).join('')}</div></div>`).join('');
 }else{
 root.innerHTML=`<p class="panel-note">Reusable starting layouts for rapid design exploration.</p><div class="preset-list"><button class="preset" data-preset="hero"><strong>Editorial hero</strong><span>Typography, image, CTA and layered decoration</span></button><button class="preset" data-preset="cards"><strong>Asymmetric cards</strong><span>Feature card + stacked media tiles</span></button><button class="preset" data-preset="slides"><strong>Immersive slideshow</strong><span>Responsive slider with caption and controls</span></button></div>`;
 }
}
function layerRow(s,l,depth){let children=s.layers.filter(x=>x.parentId===l.id).sort((a,b)=>b.z-a.z);return `<div class="${depth?'layer-nested':''}"><button class="layer-item ${ui.selectedId===l.id&&ui.sectionId===s.id?'selected':''}" data-select-layer="${esc(l.id)}" data-section="${esc(s.id)}"><span class="layer-icon">${TYPES.find(x=>x[0]===l.type)?.[1]||'▣'}</span><span class="layer-name">${esc(l.name)}</span><span class="layer-small">${l.locked?'◈ ':''}${l.hidden?'◌':''}</span></button>${children.map(c=>layerRow(s,c,depth+1)).join('')}</div>`}
function selectNode(secId,layerId){ui.sectionId=secId;ui.selectedId=layerId;renderAll()}
function renderAll(){repairSelection();$('#projectName').value=project.name;$('#snapCheck').checked=!!project.settings.snap;$$('[data-device]').forEach(b=>b.classList.toggle('active',b.dataset.device===ui.device));leftPanel();renderCanvas();renderInspector();renderTimeline();updateHistoryBtns()}
function addLayer(type){const s=section();let parent=layer()?.type==='container'?layer():null;let l=node(type,TYPES.find(x=>x[0]===type)?.[2]||'Layer',parent?16:85,parent?18:115,type==='text'?345:type==='button'?210:type==='shape'?130:330,type==='text'?100:type==='button'?50:type==='shape'?130:230,{z:Math.max(1,...s.layers.map(l=>l.z||1))+1});
 if(type==='text'){l.text='Your next big idea';l.fontSize=36;l.fill='#ffffff'}
 if(type==='button'){l.text='LEARN MORE ↗';l.fontSize=13;l.color='#fff';l.fill='#245a3c';l.radius=8;l.motion.hover='lift';l.motion.haptic='soft'}
 if(type==='image'){l.image='asset:detail';l.radius=23;l.fit='cover'}
 if(type==='container'){l.w=440;l.h=270;l.radius=25;l.fill='#e5ebdf';l.name='Group container'}
 if(type==='shape'){l.radius=65;l.fill='#d6e7cc';l.name='Decoration'}
 if(type==='slideshow'){l.name='Image slideshow';l.w=420;l.h=300;l.radius=24;l.motion.haptic='soft'}
 if(parent){l.parentId=parent.id;l.w=Math.min(l.w,parent.w-28);l.h=Math.min(l.h,parent.h-30)}
 if(ui.device!=='desktop')l[ui.device]={x:20,y:parent?20:130,w:Math.min(l.w,DEVICES[ui.device]-40),h:l.h};
 change(()=>{s.layers.push(l);ui.selectedId=l.id;ui.panel='layers';ui.tab='design'});notify(type+' layer added')
}
function newSectionAction(){const s=newSection('Custom freeform section',460,'#f0f2eb');s.layers=[node('text','New heading',56,75,750,100,{text:'Your next beautiful section',fontSize:52,color:'#183b28',mobile:{x:20,y:30,w:350,h:110}})];change(()=>{project.sections.push(s);ui.sectionId=s.id;ui.selectedId=s.layers[0].id;ui.panel='layers'});notify('New section added')}
function addPreset(which){const original=starter().sections[which==='cards'?1:which==='slides'?2:0];const s=clone(original),mapping={};s.id=uid();s.layers.forEach(l=>{mapping[l.id]=uid()});s.layers.forEach(l=>{let old=l.id;l.id=mapping[old];l.parentId=l.parentId?mapping[l.parentId]:null});change(()=>{project.sections.push(s);ui.sectionId=s.id;ui.selectedId=s.layers[0].id;ui.panel='layers'});notify('Preset section added')}
function field(label,key,val,type='text',options=null,attrs=''){const path=esc(key),v=val??'';const attr=`data-field="${path}"`;
 if(type==='color')return `<div class="field"><label>${esc(label)}</label><input ${attr} type="color" value="${esc(sanitizeColor(v))}"></div>`;
 if(type==='textarea')return `<div class="field"><label>${esc(label)}</label><textarea ${attr}>${esc(v)}</textarea></div>`;
 if(type==='select')return `<div class="field"><label>${esc(label)}</label><select ${attr}>${options.map(x=>`<option value="${esc(x)}" ${x===v?'selected':''}>${esc(x)}</option>`).join('')}</select></div>`;
 if(type==='number')return `<div class="field"><label>${esc(label)}</label><input ${attr} type="number" ${attrs} value="${esc(v)}"></div>`;
 if(type==='range')return `<div class="field"><label>${esc(label)} <span style="float:right;color:#879b8d">${esc(v)}</span></label><input ${attr} type="range" ${attrs} value="${esc(v)}"></div>`;
 if(type==='checkbox')return `<label class="inline-check"><input ${attr} type="checkbox" ${v?'checked':''}> ${esc(label)}</label>`;
 return `<div class="field"><label>${esc(label)}</label><input ${attr} type="text" value="${esc(v)}"></div>`;
}
function renderInspector(){const l=layer(),s=section();$('#inspectorTitle').textContent=l?l.name:'Canvas';$$('[data-tab]').forEach(b=>b.classList.toggle('active',b.dataset.tab===ui.tab));$('#duplicateBtn').disabled=!l;$('#deleteBtn').disabled=!l;
 let html='';
 if(!l){html=`<div class="info-note">Choose any layer to edit its design and motion properties.</div><div class="insp-group"><h3>Selected section</h3>${field('Name','section.name',s.name)}${field('Background','section.bg',s.bg,'color')}${field('Corner radius','section.radius',s.radius,'range',null,'min="0" max="90"')}${field('Height at selected breakpoint','section.height',dims(s),'number',null,'min="200" max="2500"')}${field('Clip overflowing content','section.clip',s.clip!==false,'checkbox')}</div>`}
 else if(ui.tab==='design'){
 const b=boundBox(l),parents=s.layers.filter(x=>x.type==='container'&&x.id!==l.id&&!isDescendant(s,x.id,l.id));
 html=`<div class="insp-group"><h3>Position · ${ui.device.toUpperCase()}</h3><div class="field-row">${field('X','bounds.x',b.x,'number')}${field('Y','bounds.y',b.y,'number')}${field('Width','bounds.w',b.w,'number',null,'min="12"')}${field('Height','bounds.h',b.h,'number',null,'min="12"')}</div>${field('Rotation (degrees)','layer.rotation',l.rotation,'range',null,'min="-180" max="180"')}${field('Corner radius','layer.radius',l.radius,'range',null,'min="0" max="120"')}</div>`+
 `<div class="insp-group"><h3>Appearance</h3><div class="field-row">${field('Fill','layer.fill',l.fill,'color')}${field('Text color','layer.color',l.color,'color')}</div>${field('Opacity %','layer.opacity',l.opacity,'range',null,'min="0" max="100"')}${field('Shadow blur','layer.shadow',l.shadow,'range',null,'min="0" max="60"')}${l.type==='image'?field('Edge feather','layer.feather',l.feather||0,'range',null,'min="0" max="55"'):''}${field('Blend mode','layer.blend',l.blend,'select',['normal','multiply','screen','darken','lighten'])}</div>`+
 `<div class="insp-group"><h3>Hierarchy & layout</h3>${field('Parent container','layer.parentId',l.parentId||'none','select',['none',...parents.map(x=>x.id)])}<div class="quick-actions"><button data-action="front">Bring to front</button><button data-action="back">Send backward</button><button data-action="center">Center horizontally</button></div>${field('Lock layer','layer.locked',l.locked,'checkbox')}${field('Hide layer','layer.hidden',l.hidden,'checkbox')}<p class="muted-note">Position and size changes made in tablet/mobile view override the desktop layout.</p></div>`;
 }else if(ui.tab==='motion'){
 const m=l.motion||EMPTY_MOTION();html=`<div class="insp-group"><h3>Entrance & scroll effects</h3>${field('Animation preset','motion.enter',m.enter,'select',ENTRANCES)}${field('Trigger','motion.trigger',m.trigger,'select',['load','scroll'])}<div class="field-row">${field('Duration (ms)','motion.duration',m.duration,'number',null,'min="100" max="8000"')}${field('Delay (ms)','motion.delay',m.delay,'number',null,'min="0" max="8000"')}</div>${field('Timing curve','motion.easing',m.easing,'select',EASINGS)}</div><div class="insp-group"><h3>Interaction effects</h3>${field('Hover animation','motion.hover',m.hover,'select',HOVERS)}${field('Touch feedback','motion.haptic',m.haptic,'select',['off','soft','medium'])}${field('Enable project haptics','project.haptics',project.settings.haptics,'checkbox')}<p class="muted-note">Haptic feedback uses the device Vibration API when supported and triggered by user interaction. Unsupported devices receive ordinary visual feedback.</p></div>${keyframeWidget(l)}<button class="btn btn-primary" style="width:100%" data-action="preview-motion">▶ Preview animations</button>`;
 }else if(ui.tab==='content'){
 html=`<div class="insp-group"><h3>${esc(l.type.toUpperCase())} content</h3>${field('Layer name','layer.name',l.name)}${['text','button'].includes(l.type)?field('Text','layer.text',l.text,'textarea'):''}${l.type==='button'?field('Destination','layer.link',l.link):''}${['text','button'].includes(l.type)?`<div class="field-row">${field('Font size · '+ui.device,'responsive.fontSize',getFontSize(l),'number',null,'min="8" max="160"')}${field('Font weight','layer.fontWeight',l.fontWeight,'number',null,'min="100" max="900"')}</div>${field('Font family','layer.fontFamily',l.fontFamily,'select',['Georgia, serif','Arial, sans-serif','Inter, sans-serif'])}`:''}${l.type==='image'?field('Image URL / asset','layer.image',l.image):''}${l.type==='image'?uploadField('image'):''}${l.type==='image'?field('Image fit','layer.fit',l.fit,'select',['cover','contain']):''}</div>`;
 if(l.type==='slideshow'){
 html=`<div class="insp-group"><h3>Slideshow behavior</h3>${field('Transition','layer.transition',l.transition,'select',TRANSITIONS)}${field('Autoplay','layer.autoplay',l.autoplay,'checkbox')}${field('Interval (ms)','layer.interval',l.interval,'number',null,'min="1000" max="12000"')}</div><div class="insp-group"><h3>Slides (${(l.slides||[]).length})</h3>${(l.slides||[]).map((x,i)=>`<div class="slide-edit"><strong>Slide ${i+1}</strong>${field('Image','slide.'+i+'.image',x.image)}${field('Caption','slide.'+i+'.caption',x.caption)}${uploadField('slide',i)}<div class="quick-actions"><button data-action="slide-up" data-index="${i}">↑</button><button data-action="slide-down" data-index="${i}">↓</button><button data-action="slide-remove" data-index="${i}" ${l.slides.length<2?'disabled':''}>Remove</button></div></div>`).join('')}<button class="btn btn-outline" style="width:100%" data-action="slide-add">＋ Add slide</button></div>`;
 }
 if(l.type==='container')html+=`<div class="info-note">Select this container, then add new elements using the left sidebar. Child layers will move together with the container.</div>`;
 }
 $('#inspectorContent').innerHTML=html;
}
function uploadField(which,i=''){return `<label class="file-upload">↑ Upload image (PNG, JPEG, WebP, GIF)<input data-upload="${which}" data-index="${i}" type="file" accept="image/png,image/jpeg,image/webp,image/gif"></label>`}
function renderTimeline(){
 const s=section(),r=$('#timelineTrack');if(!s)return;
 const anims=s.layers.filter(x=>(x.motion?.enter&&x.motion.enter!=='none')||x.motion?.keyframes?.length);
 const selected=layer(),frames=selected?.motion?.keyframes||[];
 $('#timelineLabel').textContent=anims.length+' animated layers · 100px ≈ 1 second';
 const controls=frames.length?`<div class="kf-scrubber"><label for="sc-scrub-control">Scrub motion</label><input id="sc-scrub-control" type="range" min="0" max="100" step="1" value="${ui.scrub??0}" aria-label="Preview selected keyframe animation at percentage"><output id="sc-scrub-output">${ui.scrub??0}%</output><button type="button" data-scrub-clear>Reset</button></div>`:'';
 r.innerHTML=controls+(anims.length?anims.map(l=>{const m=l.motion,b=(clamp(m.delay,0,8000,0)/1000)*74,w=Math.max(28,clamp(m.duration,100,8000,800)/1000*74);return `<div class="track-row" data-track="${esc(l.id)}"><span class="track-name">${esc(l.name)}</span><div class="track-line"><span class="track-bar" style="left:${b}px;width:${w}px">${m.keyframes?.length?'Custom · '+m.keyframes.length+' keys':esc(m.enter)}</span>${(m.keyframes||[]).map(f=>`<span class="track-key" style="left:${b+w*f.at/100}px" title="Keyframe at ${f.at}%"></span>`).join('')}</div><span class="track-end">${((m.delay+m.duration)/1000).toFixed(1)}s</span></div>`}).join(''):'<div class="muted-note">Choose a layer and create a keyframe motion in Motion properties.</div>');
}

function isDescendant(s,maybeChild,ancestorId){let cur=findLayer(s,maybeChild);let count=0;while(cur?.parentId&&count++<40){if(cur.parentId===ancestorId)return true;cur=findLayer(s,cur.parentId)}return false}
function reparent(s,l,newParent){if(newParent===l.parentId)return;let old=l.parentId?findLayer(s,l.parentId):null,parent=newParent?findLayer(s,newParent):null;if(parent?.type!=='container'&&newParent)return;if(newParent===l.id||isDescendant(s,newParent,l.id))return notify('Cannot nest a container inside itself');let newX=l.x+(old?old.x:0)-(parent?parent.x:0),newY=l.y+(old?old.y:0)-(parent?parent.y:0);l.parentId=newParent;l.x=Math.max(0,newX);l.y=Math.max(0,newY);l.mobile=null;l.tablet=null}
function fieldChange(el){const k=el.dataset.field;if(!k)return;const s=section(),l=layer();let v=el.type==='checkbox'?el.checked:el.type==='number'||el.type==='range'?+el.value:el.value;
 if(l&&k.startsWith('keyframe.')){
  const [,rawIndex,prop]=k.split('.'),index=Number(rawIndex),draft=clone(l.motion.keyframes||[]);
  if(!draft[index]||!['at','x','y','scale','rotate','opacity'].includes(prop))return;
  draft[index][prop]=v;
  try{MOTION_ENGINE().normalizeFrames(draft)}catch(error){notify(error.message);renderInspector();return}
  ui.scrub=null;change(()=>{l.motion.keyframes=draft});return;
 }
 change(()=>{
 if(k==='project.haptics')project.settings.haptics=!!v;
 else if(k.startsWith('section.')){let name=k.slice(8);if(name==='height'){if(ui.device==='mobile')s.mobileHeight=clamp(v,180,2500,600);else if(ui.device==='tablet')s.tabletHeight=clamp(v,180,2500,500);else s.height=clamp(v,180,2500,600)}else if(name==='radius')s.radius=clamp(v,0,120,20);else if(name==='bg')s.bg=sanitizeColor(v,s.bg);else if(name==='name')s.name=String(v).slice(0,90);else if(name==='clip')s.clip=!!v}
 else if(l&&k==='responsive.fontSize'){if(ui.device==='desktop')l.fontSize=clamp(v,8,160,24);else l[ui.device]={...boundBox(l),fontSize:clamp(v,8,160,24)}}
 else if(l&&k.startsWith('bounds.')){let b=boundBox(l);b[k.split('.')[1]]=clamp(v,k.endsWith('.w')||k.endsWith('.h')?12:-1500,3000,0);updateBox(l,b)}
 else if(l&&k.startsWith('motion.')){const p=k.slice(7);l.motion[p]=p==='duration'?clamp(v,100,8000,800):p==='delay'?clamp(v,0,8000,0):v}
 else if(l&&k.startsWith('slide.')){const [ignore,index,p]=k.split('.');if(l.slides[+index])l.slides[+index][p]=String(v).slice(0,1200)}
 else if(l&&k.startsWith('layer.')){let p=k.slice(6);if(p==='parentId')reparent(s,l,v==='none'?null:v);else if(['x','y','w','h','rotation','radius','opacity','shadow','feather','fontSize','fontWeight','interval'].includes(p))l[p]=clamp(v,p==='rotation'?-360:0, p==='interval'?12000: p==='fontSize'?160: p==='fontWeight'?900: p==='rotation'?360:3000,0);else if(['text','name'].includes(p))l[p]=String(v).slice(0,2000);else if(['hidden','locked','autoplay'].includes(p))l[p]=!!v;else l[p]=v}
 });
}
function duplicateSelected(){const s=section(),l=layer();if(!l)return;let ids=new Set([l.id]);let more=true;while(more){more=false;for(const n of s.layers)if(n.parentId&&ids.has(n.parentId)&&!ids.has(n.id)){ids.add(n.id);more=true}}const cp=s.layers.filter(n=>ids.has(n.id)).map(clone),map={};cp.forEach(n=>map[n.id]=uid());cp.forEach(n=>{const old=n.id;n.id=map[old];n.parentId=n.parentId&&map[n.parentId]?map[n.parentId]:n.parentId;n.x+=n===cp[0]?20:0;n.y+=n===cp[0]?20:0;n.z+=3});change(()=>{s.layers.push(...cp);ui.selectedId=cp[0].id});notify('Layer duplicated')}
function deleteSelected(){const s=section(),l=layer();if(!l)return;let ids=new Set([l.id]),more=true;while(more){more=false;for(const n of s.layers)if(n.parentId&&ids.has(n.parentId)&&!ids.has(n.id)){ids.add(n.id);more=true}}change(()=>{s.layers=s.layers.filter(x=>!ids.has(x.id));ui.selectedId=s.layers.at(-1)?.id||null});notify('Layer deleted')}
function actionClick(type,index){const s=section(),l=layer();if(type==='new-section')return newSectionAction();if(type==='preview-motion')return togglePlay(true);if(!l)return;
 if(type==='kf-enable')return change(()=>{l.motion.keyframes=clone(MOTION_ENGINE().DEFAULT_FRAMES||[{at:0,x:0,y:24,scale:0.96,rotate:0,opacity:0},{at:100,x:0,y:0,scale:1,rotate:0,opacity:100}]);l.motion.enter='none';ui.scrub=null});
 if(type==='kf-clear')return change(()=>{l.motion.keyframes=[];ui.scrub=null});
 if(type==='kf-remove'&&index>0&&index<(l.motion.keyframes?.length||0)-1)return change(()=>{l.motion.keyframes.splice(index,1);ui.scrub=null});
 if(type==='kf-add'){
  const frames=l.motion.keyframes||[];if(frames.length<2||frames.length>=12)return;
  const longest=frames.slice(1).map((f,i)=>({i:i+1,gap:f.at-frames[i].at})).sort((a,b)=>b.gap-a.gap)[0];
  if(!longest||longest.gap<=1)return notify('No room between keyframes');
  const midway=Math.floor((frames[longest.i-1].at+frames[longest.i].at)/2),frame=MOTION_ENGINE().atProgress(frames,midway);
  return change(()=>{l.motion.keyframes.splice(longest.i,0,frame);ui.scrub=null});
 }

 if(type==='front')return change(()=>{l.z=Math.max(1,...s.layers.map(x=>x.z||1))+1});
 if(type==='back')return change(()=>{l.z=Math.max(0,l.z-1)});
 if(type==='center')return change(()=>{let b=boundBox(l);b.x=Math.round(((l.parentId?boundBox(findLayer(s,l.parentId)).w:DEVICES[ui.device])-b.w)/2);updateBox(l,b)});
 if(type==='slide-add')return change(()=>{l.slides.push({image:'asset:plant',caption:'New slide'})});
 if(type==='slide-remove'&&l.slides.length>1)return change(()=>{l.slides.splice(index,1);slideIndexes[l.id]=0});
 if(type==='slide-up'&&index>0)return change(()=>{[l.slides[index-1],l.slides[index]]=[l.slides[index],l.slides[index-1]]});
 if(type==='slide-down'&&index<l.slides.length-1)return change(()=>{[l.slides[index+1],l.slides[index]]=[l.slides[index],l.slides[index+1]]});
}
function togglePlay(force=null){ui.playing=force===null?!ui.playing:!!force;ui.scrub=null;renderCanvas();$('#playBtn').textContent=ui.playing?'■ Stop preview':'▶ Preview motion';notify(ui.playing?'Live motion preview running':'Returned to editing')}
function importLegacy(data){let sections=(data.sections||data).map((old,i)=>{let s=newSection((old.content?.title||old.type||'Legacy section').split('\n')[0].slice(0,45),old.type==='hero'?600:500,old.style?.bg||'#f1f2ed');s.layers=[node('text','Heading',50,75,530,150,{text:old.content?.title||'Welcome',fontSize:50,mobile:{x:20,y:45,w:340,h:150}}),node('text','Body',50,270,495,90,{text:old.content?.body||'',fontSize:18,fontFamily:'Arial, sans-serif',mobile:{x:20,y:205,w:340,h:95}}),node('image','Image',595,40,430,410,{image:String(old.content?.image||'builtin:plant').replace('builtin:','asset:'),radius:old.style?.imageRadius||20,mobile:{x:20,y:335,w:340,h:300}})];return s});return {version:2,name:'Imported v0.1 project',settings:{snap:true,haptics:false},sections}}
function validateProject(d){if(!Array.isArray(d.sections)||!d.sections.length||d.sections.length>40)throw Error('Project must contain 1–40 sections');d.name=String(d.name||'Imported project').slice(0,120);d.settings=d.settings||{};d.settings.snap=!!d.settings.snap;d.settings.haptics=!!d.settings.haptics;let layerCount=0,seen=new Set();for(const s of d.sections){if(!s.id||!Array.isArray(s.layers)||s.layers.length>100)throw Error('Invalid section or too many layers');s.height=clamp(s.height,180,2500,500);s.mobileHeight=clamp(s.mobileHeight,180,2500,720);s.tabletHeight=clamp(s.tabletHeight,180,2500,500);s.bg=sanitizeColor(s.bg,'#fff');s.clip=s.clip!==false;s.name=String(s.name||'Section').slice(0,80);for(const l of s.layers){if(!l.id||seen.has(l.id)||!TYPES.some(t=>t[0]===l.type))throw Error('Invalid or duplicate layer');seen.add(l.id);layerCount++;for(let k of ['x','y','w','h','z','rotation','radius','fontSize','opacity'])l[k]=clamp(l[k],k==='x'||k==='y'?-1500:0,3000,0);l.name=String(l.name||l.type).slice(0,100);l.text=String(l.text||'').slice(0,2000);l.image=String(l.image||'asset:plant').slice(0,6000000);l.motion={...EMPTY_MOTION(),...l.motion};l.slides=Array.isArray(l.slides)?l.slides.slice(0,16):[];if(l.parentId&&l.parentId===l.id)l.parentId=null}}
 if(layerCount>800)throw Error('Too many layers in project');for(const s of d.sections){for(const l of s.layers){const visited=new Set([l.id]);let p=l.parentId,depth=0;while(p){if(visited.has(p)||depth++>12){l.parentId=null;break}visited.add(p);const parent=s.layers.find(x=>x.id===p);if(!parent||parent.type!=='container'){l.parentId=null;break}p=parent.parentId}}}return d}
function download(name,blob){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),4000)}
function exportJSON(){download('storecanvas-v0.2-project.json',new Blob([JSON.stringify(project,null,2)],{type:'application/json'}));notify('Project saved as JSON')}
function onFileUpload(el){const file=el.files?.[0],l=layer();if(!file||!l)return;if(!/image\/(png|jpeg|webp|gif)/.test(file.type))return notify('Use PNG, JPEG, WebP or GIF');if(file.size>3*1024*1024)return notify('Image must be smaller than 3MB');const reader=new FileReader();reader.onload=()=>{let src=String(reader.result);change(()=>{if(el.dataset.upload==='image')l.image=src;else if(l.slides?.[+el.dataset.index])l.slides[+el.dataset.index].image=src});notify('Image added locally')};reader.readAsDataURL(file)}
function pointerStart(e){if(ui.playing||e.button!==0)return;const handle=e.target.closest('[data-resize]'),nodeEl=e.target.closest('.sc-node');if(!nodeEl||e.target.closest('input,textarea,button'))return;const secEl=nodeEl.closest('.canvas-section'),s=project.sections.find(x=>x.id===secEl?.dataset.section),l=s&&findLayer(s,nodeEl.dataset.node);if(!l)return;e.preventDefault();if(l.locked)return notify('Layer is locked');if(ui.sectionId!==s.id||ui.selectedId!==l.id){ui.sectionId=s.id;ui.selectedId=l.id;leftPanel();renderInspector();renderTimeline();$('#inspectorTitle').textContent=l.name;$$('.sc-node.is-selected').forEach(x=>x.classList.remove('is-selected'));nodeEl.classList.add('is-selected')}
 const rect=secEl.getBoundingClientRect(),scale=rect.width/DEVICES[ui.device];drag={id:l.id,secId:s.id,handle:!!handle,startX:e.clientX,startY:e.clientY,b:boundBox(l),scale,before:clone(project),changed:false,nodeEl,pointerId:e.pointerId};nodeEl.setPointerCapture(e.pointerId);nodeEl.addEventListener('pointermove',pointerMove);nodeEl.addEventListener('pointerup',pointerEnd);nodeEl.addEventListener('pointercancel',pointerEnd)}
function pointerMove(e){if(!drag||e.pointerId!==drag.pointerId)return;const s=project.sections.find(x=>x.id===drag.secId),l=findLayer(s,drag.id);if(!l)return;const snap=project.settings.snap&&!e.shiftKey?8:1,dx=(e.clientX-drag.startX)/drag.scale,dy=(e.clientY-drag.startY)/drag.scale;const round=n=>Math.round(n/snap)*snap;const b={...drag.b};if(drag.handle){b.w=clamp(round(drag.b.w+dx),20,2200,drag.b.w);b.h=clamp(round(drag.b.h+dy),20,2200,drag.b.h)}else{b.x=round(drag.b.x+dx);b.y=round(drag.b.y+dy)}updateBox(l,b);drag.changed=true;const el=drag.nodeEl;el.style.left=b.x+'px';el.style.top=b.y+'px';el.style.width=b.w+'px';el.style.height=b.h+'px'}
function pointerEnd(e){if(!drag||e.pointerId!==drag.pointerId)return;const el=drag.nodeEl;try{el.releasePointerCapture(drag.pointerId)}catch(_e){}el.removeEventListener('pointermove',pointerMove);el.removeEventListener('pointerup',pointerEnd);el.removeEventListener('pointercancel',pointerEnd);if(drag.changed){checkpoint(drag.before);haptic('soft')}drag=null;renderAll()}
function startInlineEdit(e){if(ui.playing)return;const el=e.target.closest('.sc-node'),s=section(),l=el&&s.layers.find(x=>x.id===el.dataset.node);if(!l||l.type!=='text')return;ui.selectedId=l.id;const text=el.querySelector('.sc-layer-text');if(!text)return;text.setAttribute('contenteditable','true');text.focus();const selection=window.getSelection(),r=document.createRange();r.selectNodeContents(text);selection.removeAllRanges();selection.addRange(r);text.addEventListener('blur',()=>{const next=text.innerText.trim();if(next!==l.text){change(()=>l.text=next)}else renderAll()},{once:true});text.addEventListener('keydown',ev=>{if(ev.key==='Escape'){ev.preventDefault();text.textContent=l.text;text.blur()}ev.stopPropagation()})}
function handleKey(e){const editable=e.target.closest('input,textarea,select,[contenteditable=true]');if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'&&!editable){e.preventDefault();undo();return}if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='y'&&!editable){e.preventDefault();redo();return}if(editable||ui.playing)return;const l=layer();if(!l)return;if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='d'){e.preventDefault();duplicateSelected();return}if(e.key==='Delete'||e.key==='Backspace'){e.preventDefault();deleteSelected();return}if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){e.preventDefault();const dx=e.key==='ArrowRight'?1:e.key==='ArrowLeft'?-1:0,dy=e.key==='ArrowDown'?1:e.key==='ArrowUp'?-1:0;change(()=>{let b=boundBox(l);b.x+=dx*(e.shiftKey?1:8);b.y+=dy*(e.shiftKey?1:8);updateBox(l,b)})}}
function bindEvents(){
 $('#projectName').addEventListener('change',e=>change(()=>project.name=e.target.value.slice(0,120),false));
 $('#undoBtn').onclick=undo;$('#redoBtn').onclick=redo;$('#saveBtn').onclick=exportJSON;$('#importBtn').onclick=()=>$('#fileImport').click();
 $('#fileImport').onchange=async e=>{const f=e.target.files?.[0];if(!f)return;try{let data=JSON.parse(await f.text());if(data.version!==2)data=importLegacy(data);data=validateProject(data);change(()=>{project=data;ui.sectionId=data.sections[0].id;ui.selectedId=data.sections[0].layers[0]?.id;ui.playing=false});notify('Project imported successfully')}catch(err){notify('Could not import: '+err.message)}e.target.value=''};
 $('#exportBtn').onclick=async()=>{try{const zip=await window.SCExporter.exportTheme(clone(project));download('storecanvas-v0.5-shopify-theme.zip',zip);notify('Validated Shopify theme ZIP generated · test on an unpublished theme')}catch(e){console.error(e);notify('Export failed: '+e.message)}};
 $('#playBtn').onclick=()=>togglePlay();$('#replayBtn').onclick=()=>{togglePlay(true);notify('Animations replayed')};
 $('#snapCheck').onchange=e=>{project.settings.snap=e.target.checked;saveLocal()};
 $$('#inspectorTabs [data-tab]').forEach(el=>el.onclick=()=>{ui.tab=el.dataset.tab;renderInspector()});
 $$('[data-panel]').forEach(el=>el.onclick=()=>{ui.panel=el.dataset.panel;leftPanel()});
 $$('[data-device]').forEach(el=>el.onclick=()=>{ui.device=el.dataset.device;renderAll()});
 $('#newSectionBtn').onclick=newSectionAction;$('#duplicateBtn').onclick=duplicateSelected;$('#deleteBtn').onclick=deleteSelected;
 $('#leftContent').addEventListener('click',e=>{let add=e.target.closest('[data-add]');if(add)return addLayer(add.dataset.add);let preset=e.target.closest('[data-preset]');if(preset)return addPreset(preset.dataset.preset);let sec=e.target.closest('[data-select-section]');if(sec){ui.sectionId=sec.dataset.selectSection;ui.selectedId=null;return renderAll()}let ly=e.target.closest('[data-select-layer]');if(ly)return selectNode(ly.dataset.section,ly.dataset.selectLayer);let move=e.target.closest('[data-move-section]');if(move){const i=project.sections.findIndex(x=>x.id===move.dataset.moveSection),j=i+(+move.dataset.dir);if(j>=0&&j<project.sections.length)change(()=>{[project.sections[i],project.sections[j]]=[project.sections[j],project.sections[i]]});return}let ren=e.target.closest('[data-rename-section]');if(ren){let s=project.sections.find(x=>x.id===ren.dataset.renameSection),name=prompt('Name this section',s.name);if(name)change(()=>s.name=name.slice(0,90));return}let act=e.target.closest('[data-action]');if(act)actionClick(act.dataset.action)});
 $('#inspectorContent').addEventListener('change',e=>{let field=e.target.closest('[data-field]');if(field)return fieldChange(field);let file=e.target.closest('[data-upload]');if(file)onFileUpload(file)});
 $('#inspectorContent').addEventListener('click',e=>{let act=e.target.closest('[data-action]');if(act)actionClick(act.dataset.action,+act.dataset.index||0)});
 $('#sectionStack').addEventListener('pointerdown',pointerStart);$('#sectionStack').addEventListener('dblclick',startInlineEdit);
 $('#sectionStack').addEventListener('click',e=>{if(ui.playing){let act=e.target.closest('[data-action]'),node=e.target.closest('.sc-node');if(act&&node){const l=project.sections.flatMap(s=>s.layers).find(x=>x.id===node.dataset.node);if(!l)return;if(act.dataset.action==='slide-next')advanceSlide(l.id,1);else if(act.dataset.action==='slide-prev')advanceSlide(l.id,-1);else if(act.dataset.action==='slide-dot')advanceSlide(l.id,0,+act.dataset.index);else if(act.dataset.action==='button'){e.preventDefault();notify('Storefront link: '+safeLink(l.link))}if(l.motion?.haptic!=='off')haptic(l.motion.haptic)}else if(e.target.closest('a'))e.preventDefault();return}let sec=e.target.closest('.canvas-section');if(sec&&!e.target.closest('.sc-node')){ui.sectionId=sec.dataset.section;ui.selectedId=null;renderAll()}e.preventDefault()});
 $('#timelineTrack').onclick=e=>{const reset=e.target.closest('[data-scrub-clear]');if(reset){ui.scrub=null;renderTimeline();return scrubCurrent()}const track=e.target.closest('[data-track]');if(track){ui.selectedId=track.dataset.track;ui.scrub=null;ui.tab='motion';renderAll()}};
 $('#timelineTrack').addEventListener('input',e=>{if(e.target.id==='sc-scrub-control'){ui.scrub=clamp(+e.target.value,0,100,0);const output=$('#sc-scrub-output');if(output)output.textContent=ui.scrub+'%';scrubCurrent()}});
 document.addEventListener('keydown',handleKey);
}
renderAll();bindEvents();saveLocal();
// Narrow bridge for the authenticated Shopify app shell. Browser code never sees an Admin token.
window.StoreCanvasBridge=Object.freeze({
 getDocument:()=>clone(project),
 setDocument:(incoming)=>{
  const safe=MOTION_ENGINE().validateProject(clone(incoming));
  const data=validateProject(clone(safe));
  change(()=>{project=data;ui.sectionId=data.sections[0].id;ui.selectedId=data.sections[0].layers[0]?.id||null;ui.playing=false});
  notify('Cloud draft loaded');
 }
});
