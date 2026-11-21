"""Local file:// browser smoke tests for the free, no-server StoreCanvas editor."""
import asyncio, base64, io, zipfile
from pathlib import Path
from playwright.async_api import async_playwright
ROOT=Path(__file__).resolve().parents[1]
async def run():
 async with async_playwright() as p:
  browser=await p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
  page=await browser.new_page(viewport={'width':1440,'height':900},accept_downloads=True)
  errors=[]
  page.on('pageerror',lambda err: errors.append(str(err)))
  html=(ROOT/'editor/index.html').read_text().replace('<link rel="stylesheet" href="styles.css">','').replace('<script src="runtime.js"></script>','').replace('<script src="exporter.js"></script>','').replace('<script src="app.js"></script>','')
  await page.set_content(html)
  await page.add_style_tag(content=(ROOT/'editor/styles.css').read_text())
  for jsfile in ['runtime.js','exporter.js','app.js']:
   await page.add_script_tag(content=(ROOT/'editor'/jsfile).read_text())
  assert await page.evaluate('Boolean(window.StoreCanvasEngine?.compileShopifyTheme)'),'Unified engine missing in file:// editor'
  assert await page.locator('.sc-node').count()>3
  await page.locator('[data-device="mobile"]').click()
  await page.wait_for_timeout(250)
  assert await page.locator('#pagePreview').evaluate('(e)=>e.clientWidth')==390
  await page.locator('[data-device="desktop"]').click()
  async with page.expect_download(timeout=20000) as dl:
   await page.locator('#exportBtn').click()
  export=await dl.value
  localzip=ROOT/'tests/storecanvas-v05-browser-export.zip'
  await export.save_as(localzip)
  with zipfile.ZipFile(localzip) as z:
   bad=z.testzip();assert bad is None,bad
   names=set(z.namelist())
   assert 'sections/storecanvas-home.liquid' in names
   assert 'templates/product.json' in names
   home=z.read('sections/storecanvas-home.liquid').decode().split('{% schema %}')[0]
   assert '{{ ' in home and '.svg' in home
   for name in ['plant','fern','architecture','detail']:
    content=z.read('assets/storecanvas-'+name+'.svg')
    home=home.replace("{{ 'storecanvas-"+name+".svg' | asset_url }}",'data:image/svg+xml;base64,'+base64.b64encode(content).decode())
   css=z.read('assets/storecanvas.css').decode()
   js=z.read('assets/storecanvas.js').decode()
   assert 'prefers-reduced-motion' in css
  preview=await browser.new_page(viewport={'width':1360,'height':950})
  preview_errors=[]
  preview.on('pageerror',lambda err:preview_errors.append(str(err)))
  await preview.set_content('<!doctype html><html><head><meta charset="utf-8"></head><body>'+home+'</body></html>')
  await preview.add_style_tag(content=css)
  await preview.add_script_tag(content=js)
  assert await preview.locator('.sc-section').count()==3
  assert await preview.locator('.sc-slideshow').count()==1
  await preview.locator('.sc-slideshow [data-next]').click()
  assert await preview.locator('.sc-slideshow .sc-slide.is-active[aria-hidden="false"]').count()==1
  assert await preview.locator('.sc-slideshow .sc-slide[aria-hidden="true"]').count()==2
  assert not preview_errors,preview_errors
  assert not errors,errors
  # Option-value selection (v0.8+) is tested in high_variant_browser.py.
  await page.screenshot(path=str(ROOT/'tests/editor-v05.png'))
  await preview.screenshot(path=str(ROOT/'tests/storefront-v05.png'))
  print('No-server browser-loaded editor, 390px preview, ZIP download, ZIP integrity, 3 sections, slideshow and JS checks passed.')
  await browser.close()
asyncio.run(run())
