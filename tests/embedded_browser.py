"""Offline Chromium smoke test. No real Shopify requests."""
import json
from pathlib import Path
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1]
fixture=json.loads((root/'tests/fixtures/project.json').read_text())
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 page=browser.new_page(viewport={'width':1440,'height':940})
 errors=[]
 page.on('pageerror',lambda error:errors.append(str(error)))
 html=(root/'editor/index.html').read_text()
 for tag in ('runtime.js','exporter.js','app.js'):
  html=html.replace('<script src="'+tag+'"></script>','')
 page.set_content(html,wait_until='domcontentloaded')
 page.add_style_tag(path=str(root/'editor/styles.css'))
 page.evaluate("window.history.replaceState=(a,b,route)=>{window.__newRoute=route}")
 page.evaluate("""window.shopify={idToken:async()=> 'fake-signed-token'};
 window.fetch=async function(url){
  if(url.startsWith('/api/projects/'))return {ok:true,json:async()=>({id:'11111111-1111-4111-8111-111111111111',revision:3,document:window.__fixture})};
  if(url==='/api/projects')return {ok:true,json:async()=>({id:'11111111-1111-4111-8111-111111111111',revision:1})};
  throw Error('Unexpected route '+url);
 };void 0;""")
 page.evaluate('(document)=>{window.__fixture=document}',fixture)
 for name in ('runtime.js','exporter.js','app.js','cloud.js'):
  target=root/('app/public/'+name if name=='cloud.js' else 'editor/'+name)
  page.add_script_tag(path=str(target))
 page.wait_for_selector('#cloudSaveBtn',timeout=10000)
 page.locator('#cloudSaveBtn').click()
 page.wait_for_function("document.querySelector('.top-actions [role=status]').textContent.includes('Cloud saved')",timeout=10000)
 assert 'id=11111111-1111-4111-8111-111111111111' in page.evaluate('window.__newRoute')
 assert page.locator('.canvas-section').count()==3
 assert not errors,errors
 tab=browser.new_page(viewport={'width':390,'height':844})
 errs=[];tab.on('pageerror',lambda error:errs.append(str(error)))
 tab.evaluate("""window.shopify={idToken:async()=> 'fake-token'};window.fetch=async function(url){
  const data=url==='/api/app/status'?{shop:'test.myshopify.com',connected:true,scope:'read_products'}:url==='/api/projects'?{projects:[{id:'11111111-1111-4111-8111-111111111111',name:'My storefront',revision:2,updatedAt:new Date().toISOString()}]}:{};
  return {ok:true,json:async()=>data};};void 0;""")
 tab.set_content((root/'app/public/index.html').read_text().replace('<script src="/app/assets/dashboard.js"></script>',''),wait_until='domcontentloaded')
 tab.add_style_tag(path=str(root/'app/public/dashboard.css'))
 tab.add_script_tag(path=str(root/'app/public/dashboard.js'))
 tab.wait_for_selector('.project .project-name',timeout=10000)
 assert tab.locator('.project-name').inner_text()=='My storefront'
 assert not errs,errs
 browser.close()
print('Offline StoreCanvas embedded browser smoke: passed')
