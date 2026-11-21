/* Cloud save adapter: validated documents remain editable using the offline-first canvas. */
'use strict';
(function(){
 const bridge=window.StoreCanvasBridge;
 if(!bridge)return;
 const top=document.querySelector('.top-actions');if(!top)return;
 const back=document.createElement('a');back.href='/app/';back.className='btn btn-outline';back.textContent='Projects';
 const save=document.createElement('button');save.type='button';save.className='btn btn-primary';save.id='cloudSaveBtn';save.textContent='Save cloud draft';
 const note=document.createElement('span');note.setAttribute('role','status');note.setAttribute('aria-live','polite');note.style.cssText='font-size:12px;color:#b5dbc0;max-width:170px';
 top.prepend(back,save,note);
 const params=new URLSearchParams(window.location.search);let id=params.get('id');
 if(id&&!/^[0-9a-f-]{36}$/.test(id)){note.textContent='Invalid project URL';id=null;}
 let revision=null;
 async function api(route,options={}){
  if(typeof window.shopify?.idToken!=='function')throw Error('Open in Shopify Admin to save cloud drafts');
  const jwt=await window.shopify.idToken();
  const response=await fetch(route,{...options,headers:{...options.headers,Authorization:`Bearer ${jwt}`}});
  const payload=await response.json().catch(()=>({}));
  if(!response.ok)throw Error(payload.error||`Request failed (${response.status})`);
  return payload;
 }
 async function load(){if(!id)return;save.disabled=true;note.textContent='Loading draft…';try{const item=await api(`/api/projects/${id}`);bridge.setDocument(item.document);revision=item.revision;note.textContent=`Loaded revision ${revision}`;}catch(error){note.textContent='Load failed: '+error.message;}finally{save.disabled=false;}}
 save.onclick=async()=>{
  save.disabled=true;note.textContent='Saving…';
  try{
   const document=bridge.getDocument();
   const options={method:id?'PUT':'POST',headers:{'content-type':'application/json',...(id?{'if-match':`"${revision}"`}:{})},body:JSON.stringify({document})};
   const result=await api(id?`/api/projects/${id}`:'/api/projects',options);
   if(!id){id=result.id;history.replaceState(null,'',`/app/editor/?id=${encodeURIComponent(id)}`);}
   revision=result.revision;note.textContent=`Cloud saved · revision ${revision}`;
  }catch(error){note.textContent=error.message.includes('conflict')?'Revision conflict. Reload to see the newer draft.':'Save failed: '+error.message;}
  finally{save.disabled=false;}
 };
 load();
})();
