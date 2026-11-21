/** StoreCanvas motion keyframes: bounded, deterministic, CSS-safe. */
export const KEYFRAME_MAX = 12;
export const DEFAULT_FRAMES = Object.freeze([
  Object.freeze({at:0,x:0,y:24,scale:0.96,rotate:0,opacity:0}),
  Object.freeze({at:100,x:0,y:0,scale:1,rotate:0,opacity:100}),
]);
const bounded=(value,min,max,label)=>{
 if(typeof value!=='number'||!Number.isFinite(value)||value<min||value>max)throw Error(`Invalid motion ${label}`);
 return value;
};
export function normalizeFrames(input){
 if(input===undefined||input===null)return [];
 if(!Array.isArray(input))throw Error('Motion keyframes must be an array');
 if(input.length===0)return [];
 if(input.length<2||input.length>KEYFRAME_MAX)throw Error('Motion requires 2–12 keyframes');
 const frames=input.map((raw,i)=>{
  if(!raw||typeof raw!=='object'||Array.isArray(raw))throw Error(`Invalid motion keyframe ${i}`);
  return {
   at:bounded(raw.at,0,100,'offset'),
   x:bounded(raw.x??0,-600,600,'x'),
   y:bounded(raw.y??0,-600,600,'y'),
   scale:bounded(raw.scale??1,0.1,3,'scale'),
   rotate:bounded(raw.rotate??0,-360,360,'rotation'),
   opacity:bounded(raw.opacity??100,0,100,'opacity'),
  };
 });
 if(frames[0].at!==0||frames.at(-1).at!==100)throw Error('Motion must begin at 0% and end at 100%');
 for(let i=1;i<frames.length;i++)if(frames[i].at<=frames[i-1].at)throw Error('Motion keyframe offsets must increase');
 return frames;
}
const kfFmt=n=>Number(n.toFixed(3));
export function frameStyle(frame){return `opacity:${kfFmt(frame.opacity/100)};transform:translate3d(${kfFmt(frame.x)}px,${kfFmt(frame.y)}px,0) rotate(${kfFmt(frame.rotate)}deg) scale(${kfFmt(frame.scale)});`;}
export function keyframeCSS(layerId,frames){
 if(!/^[a-zA-Z][a-zA-Z0-9_-]{1,63}$/.test(layerId))throw Error('Invalid motion ID');
 const list=normalizeFrames(frames);
 if(!list.length)return '';
 return `@keyframes sc-custom-${layerId}{${list.map(f=>`${kfFmt(f.at)}%{${frameStyle(f)}}`).join('')}}.sc-layer-${layerId}.sc-visible>.sc-keyframe-surface{animation:sc-custom-${layerId} var(--sc-duration,800ms) var(--sc-easing,ease-out) var(--sc-delay,0ms) both}`;
}
export function atProgress(frames,at){
 const list=normalizeFrames(frames);if(!list.length)return null;
 const time=typeof at==='number'&&Number.isFinite(at)?Math.max(0,Math.min(100,at)):0;
 let next=1;while(next<list.length-1&&list[next].at<time)next++;
 const a=list[next-1],b=list[next],t=Math.max(0,Math.min(1,(time-a.at)/(b.at-a.at)));
 const out={at:time};for(const prop of ['x','y','scale','rotate','opacity'])out[prop]=a[prop]+(b[prop]-a[prop])*t;
 return out;
}
