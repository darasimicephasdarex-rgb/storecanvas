"""Offline Playwright smoke test for StoreCanvas option-value handling. No merchant network access."""
import asyncio,subprocess,json
from pathlib import Path
from playwright.async_api import async_playwright,expect
ROOT=Path(__file__).resolve().parents[1]
def markup(section='main',color='a',size='s',variant='v1',price='$24',available=True):
 def select(index,vals,chosen):
  opts=''.join(f'<option value="{key}" data-sc-option-value-id="{value}" '+('selected' if key==chosen else '')+f'>{key}</option>' for key,value in vals)
  return f'<label for="{section}-{index}">Option {index}</label><select id="{section}-{index}" data-sc-option data-sc-option-index="{index}">{opts}</select>'
 return f'<section data-sc-product data-sc-section-id="{section}" data-sc-product-url="/products/test" data-sc-msg-loading="Updating selection…" data-sc-msg-blocked="Select an available variant before adding to cart." data-sc-msg-incomplete="Choose all product options." data-sc-msg-updated="Product options updated." data-sc-msg-invalid="This combination is unavailable." data-sc-msg-failed="Unable to update product selection. Please retry."><div class="sc-product-media"><img src="/image.jpg"></div><p data-sc-price>{price}</p><form action="/cart/add" method="post">{select(1,[("a",101),("b",102)],color)}{select(2,[("s",201),("l",202)],size)}<input type="hidden" name="id" data-sc-variant-id value="{variant}"><input type="number" data-sc-quantity min="1" value="1"><button type="submit" name="add" data-sc-add {"disabled" if not available else ""}>Add to cart</button><p data-sc-status role="status" aria-live="polite"></p><button type="button" data-sc-retry hidden>Retry</button></form></section>'
async def main():
 source=subprocess.check_output(['node','--input-type=module','-e',"import {COMMERCE_JS} from './engine/commerce.mjs';process.stdout.write(COMMERCE_JS);"],cwd=ROOT,text=True)
 source=source.replace('location.origin',"'https://storecanvas.example'").replace('location.href',"'https://storecanvas.example/products/test?preview_theme_id=153717899429&view=storecanvas-qa'").replace('history.replaceState(','window.__recordHistory(')
 replies={'102,201':markup(color='b',variant='v2',price='$28'),'102,202':markup(color='b',size='l',variant='',available=False),'101,202':markup(color='a',size='l',variant='v3',price='$26')}
 stub="window.__requests=[];window.__errorOnce=true;window.__recordHistory=()=>{};const replies="+json.dumps(replies)+""";window.fetch=async url=>{const query=Object.fromEntries(new URL(url).searchParams);window.__requests.push(query);if(query.option_values==='101,202'&&window.__errorOnce){window.__errorOnce=false;return{ok:false,status:503,text:async()=>''}};return{ok:true,text:async()=>replies[query.option_values]}};"""
 async with async_playwright() as p:
  browser=await p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
  page=await browser.new_page()
  errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  await page.set_content('<html><body>'+markup()+markup('secondary')+'</body></html>')
  await page.add_script_tag(content=stub+source)
  item=page.locator('[data-sc-product]').first
  await item.locator('[data-sc-option-index="1"]').select_option('b')
  await expect(item.locator('[data-sc-variant-id]')).to_have_value('v2')
  assert await page.locator('[data-sc-product]').nth(1).locator('[data-sc-variant-id]').input_value()=='v1'
  q=await page.evaluate('window.__requests')
  assert q[0]['option_values']=='102,201' and q[0]['preview_theme_id']=='153717899429'
  await item.locator('[data-sc-option-index="2"]').select_option('l')
  await expect(item.locator('[data-sc-variant-id]')).to_have_value('')
  assert await item.locator('[data-sc-add]').is_disabled()
  await item.locator('[data-sc-option-index="1"]').select_option('a')
  await expect(item.locator('[data-sc-status]')).to_contain_text('Unable to update')
  assert await item.locator('form').evaluate("el=>!el.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}))")
  await item.locator('[data-sc-retry]').click()
  await expect(item.locator('[data-sc-variant-id]')).to_have_value('v3')
  assert not errors,errors
  await browser.close()
 print('Offline option-value browser test passed')
if __name__=='__main__':asyncio.run(main())
