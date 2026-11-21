/* StoreCanvas embedded dashboard. All writes require fresh Shopify ID tokens. */
'use strict';
const one=selector=>document.querySelector(selector);
const feedback=one('#feedback');
const projectsEl=one('#projectList');
const setMessage=(text,bad=false)=>{feedback.textContent=text;feedback.classList.toggle('error',bad);};
async function authorizedFetch(route,options={}){
 if(typeof window.shopify?.idToken!=='function')throw Error('Open StoreCanvas from Shopify Admin to access cloud drafts.');
 const jwt=await window.shopify.idToken();
 const response=await fetch(route,{...options,headers:{...options.headers,Authorization:`Bearer ${jwt}`}});
 const payload=await response.json().catch(()=>({}));
 if(!response.ok)throw Error(payload.error||`Request failed (${response.status})`);
 return payload;
}
function el(tag,cls,text){const node=document.createElement(tag);if(cls)node.className=cls;if(text!==undefined)node.textContent=text;return node;}
function drawProjects(items){
 projectsEl.replaceChildren();
 if(!items.length){projectsEl.append(el('div','empty','No cloud projects yet. Create a design or import a StoreCanvas JSON file to begin.'));return;}
 for(const item of items){
  const card=el('article','project'),name=el('h3','project-name',item.name||'Untitled design');
  const date=el('p','project-meta',`Updated ${new Date(item.updatedAt).toLocaleDateString()} · Revision ${item.revision}`);
  const actions=el('div','project-actions');
  const open=el('a','btn primary','Edit design');open.href=`/app/editor/?id=${encodeURIComponent(item.id)}`;
  const remove=el('button','delete','Delete');remove.type='button';remove.setAttribute('aria-label',`Delete ${item.name||'design'}`);
  remove.onclick=async()=>{if(!confirm(`Delete “${item.name}”? This cannot be undone.`))return;remove.disabled=true;try{await authorizedFetch(`/api/projects/${item.id}`,{method:'DELETE'});await refresh();}catch(error){setMessage(error.message,true);remove.disabled=false;}};
  actions.append(open,remove);card.append(name,date,actions);projectsEl.append(card);
 }
}
async function refresh(){const data=await authorizedFetch('/api/projects');drawProjects(data.projects);}
async function main(){
 try{
  const status=await authorizedFetch('/api/app/status');
  one('#shopStatus').textContent=`${status.shop} · ${status.connected?'Connected':'Draft mode'}`;
  if(!status.connected){
   one('#shopStatus').classList.add('offline');
   try{await authorizedFetch('/api/install/exchange',{method:'POST'});one('#shopStatus').textContent=`${status.shop} · Connected`;one('#shopStatus').classList.remove('offline');}
   catch{setMessage('Shopify catalog connection is not configured yet. Cloud project drafts remain available.');}
  }
  await refresh();
 }catch(error){one('#shopStatus').textContent='Shopify session required';one('#shopStatus').classList.add('offline');setMessage(error.message,true);projectsEl.replaceChildren(el('div','empty','Open the app inside Shopify Admin to authenticate.'));}
}
one('#newProject').onclick=()=>{window.location.href='/app/editor/';};
one('#projectImport').onchange=async event=>{
 const file=event.target.files?.[0];if(!file)return;
 if(file.size>2_000_000){setMessage('File must be less than 2MB',true);return;}
 try{const raw=JSON.parse(await file.text());const created=await authorizedFetch('/api/projects',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({document:raw})});window.location.href=`/app/editor/?id=${encodeURIComponent(created.id)}`;}
 catch(error){setMessage('Import failed: '+error.message,true)}finally{event.target.value='';}
};
main();
