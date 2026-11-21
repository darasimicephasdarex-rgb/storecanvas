"""Self-contained Chromium verification for editable keyframes and Shopify export parity."""
import asyncio, zipfile
from pathlib import Path
from playwright.async_api import async_playwright
ROOT=Path(__file__).resolve().parents[1]

async def run():
 async with async_playwright() as p:
  browser=await p.chromium.launch(headless=True, executable_path='/usr/bin/chromium', args=['--no-sandbox'])
  page=await browser.new_page(viewport={'width':1440,'height':900},accept_downloads=True)
  errors=[]
  page.on('pageerror',lambda err:errors.append(str(err)))
  html=(ROOT/'editor/index.html').read_text()
  html=html.replace('<link rel="stylesheet" href="styles.css">','').replace('<script src="runtime.js"></script>','').replace('<script src="exporter.js"></script>','').replace('<script src="app.js"></script>','')
  await page.set_content(html)
  await page.add_style_tag(content=(ROOT/'editor/styles.css').read_text())
  for name in ('runtime.js','exporter.js','app.js'):
   await page.add_script_tag(content=(ROOT/'editor'/name).read_text())
  await page.locator('#inspectorTabs [data-tab="motion"]').click()
  await page.locator('#inspectorContent [data-action="kf-enable"]').click()
  assert await page.locator('.kf-card').count()==2
  layer_id=await page.locator('.sc-node.is-selected').first.get_attribute('data-node')
  await page.locator('#inspectorContent [data-action="kf-add"]').click()
  assert await page.locator('.kf-card').count()==3
  await page.locator('[data-field="keyframe.1.x"]').fill('30')
  await page.locator('[data-field="keyframe.1.x"]').press('Tab')
  assert await page.locator('[data-field="keyframe.1.x"]').input_value()=='30'
  assert await page.locator('[data-field="keyframe.1.at"]').input_value()=='50'
  await page.locator('#sc-scrub-control').evaluate("el=>{el.value='50';el.dispatchEvent(new Event('input',{bubbles:true}))}")
  style=await page.locator('.sc-node.is-selected .sc-motion-surface').get_attribute('style')
  assert 'translate3d(30px' in (style or ''),style
  await page.locator('#timelineTrack [data-scrub-clear]').click()
  assert await page.locator('.sc-node.is-selected .sc-motion-surface').get_attribute('style')=='', 'Reset should clear preview styles'
  await page.screenshot(path=str(ROOT/'tests/keyframe-studio.png'))
  await page.locator('#playBtn').click()
  await page.wait_for_timeout(150)
  animation_name=await page.locator(f'[data-node="{layer_id}"]>.sc-motion-surface').evaluate('(e)=>getComputedStyle(e).animationName')
  assert f'sc-custom-{layer_id}' in animation_name,animation_name
  await page.locator('#playBtn').click()
  async with page.expect_download(timeout=20000) as task:
   await page.locator('#exportBtn').click()
  artifact=ROOT/'tests/keyframes-browser-export.zip'
  await (await task.value).save_as(artifact)
  with zipfile.ZipFile(artifact) as zipped:
   assert zipped.testzip() is None
   css=zipped.read('assets/storecanvas.css').decode()
   home=zipped.read('sections/storecanvas-home.liquid').decode()
   assert f'@keyframes sc-custom-{layer_id}' in css
   assert f'sc-custom-{layer_id}' in css
   assert 'sc-keyframe-surface' in home
   assert '50%{opacity:' in css
  assert not errors,errors
  await browser.close()
  print('Offline Chromium keyframe studio QA passed: author 3 frames, edit, scrub, replay, and exported CSS parity.')

if __name__=='__main__':asyncio.run(run())
