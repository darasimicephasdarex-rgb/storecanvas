/* StoreCanvas storefront enhancement. Native content remains visible without JavaScript. */
(()=>{'use strict';
 const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
 const userHaptic=(el)=>{if(!el||reduced.matches||!navigator.vibrate)return;const m=el.dataset.scHaptic;if(m==='soft')navigator.vibrate(9);else if(m==='medium')navigator.vibrate(18)};
 document.addEventListener('click',e=>{const a=e.target.closest('[data-sc-haptic]');if(a)userHaptic(a)});
 function init(root){root.querySelectorAll('[data-sc-slider]').forEach(slider=>{
  if(slider.dataset.scReady)return;slider.dataset.scReady='true';const slides=[...slider.querySelectorAll('[data-sc-slide]')];if(slides.length<2)return;
  let index=0,interval=null,paused=false;const status=slider.querySelector('.sc-freeform__slider-status');const pauseButton=slider.querySelector('[data-sc-pause]');
  const stop=()=>{if(interval){clearInterval(interval);interval=null}};
  const show=(next,announce=true)=>{index=(next+slides.length)%slides.length;slides.forEach((s,i)=>{s.classList.toggle('is-active',i===index);s.setAttribute('aria-hidden',i===index?'false':'true')});if(announce&&status)status.textContent=`Slide ${index+1} of ${slides.length}`};
  const start=()=>{stop();if(paused||reduced.matches||document.hidden||!slider.isConnected||slider.dataset.scAutoplay!=='true')return;if(slider.matches(':hover')||slider.matches(':focus-within'))return;interval=setInterval(()=>show(index+1,false),Math.max(2000,Number(slider.dataset.scInterval||5)*1000))};
  const prev=slider.querySelector('[data-sc-prev]'),next=slider.querySelector('[data-sc-next]');prev?.addEventListener('click',()=>{show(index-1);start()});next?.addEventListener('click',()=>{show(index+1);start()});
  pauseButton?.addEventListener('click',()=>{paused=!paused;pauseButton.textContent=paused?'Play slideshow':'Pause slideshow';pauseButton.setAttribute('aria-pressed',String(paused));start()});
  slider.addEventListener('mouseenter',stop);slider.addEventListener('mouseleave',start);slider.addEventListener('focusin',stop);slider.addEventListener('focusout',()=>setTimeout(start,0));
  document.addEventListener('visibilitychange',start);reduced.addEventListener?.('change',start);const observer=new IntersectionObserver(entries=>{if(entries[0].isIntersecting)start();else stop()});observer.observe(slider);start();
  slider.addEventListener('shopify:section:unload',()=>{stop();observer.disconnect()},{once:true});
 })}
 const scan=()=>document.querySelectorAll('.sc-freeform').forEach(init);
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',scan,{once:true});else scan();
 document.addEventListener('shopify:section:load',scan);
})();