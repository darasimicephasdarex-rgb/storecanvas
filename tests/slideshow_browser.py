"""Browser regression for slideshow autoplay, hover/focus and explicit Pause.
Requires local Playwright and Chromium; never places orders on Shopify.
"""
import asyncio
import subprocess
from pathlib import Path
from playwright.async_api import async_playwright

ROOT=Path(__file__).resolve().parents[1]

async def main():
    subprocess.run(['node','--input-type=module','-e',
        "import fs from 'node:fs'; import {fullHTML} from './engine/core.mjs'; fs.mkdirSync('dist',{recursive:true}); fs.writeFileSync('dist/slideshow-browser-test.html',fullHTML(JSON.parse(fs.readFileSync('tests/fixtures/project.json','utf8'))));"
    ],cwd=ROOT,check=True)
    async with async_playwright() as playwright:
        browser=await playwright.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
        page=await browser.new_page(viewport={'width':1440,'height':900})
        errors=[]
        page.on('pageerror',lambda error:errors.append(str(error)))
        html=(ROOT/'dist/slideshow-browser-test.html').read_text().replace('</head>',
            '<script>window.setInterval=(function(original){return (callback,delay)=>original(callback,65)})(window.setInterval.bind(window))</script></head>')
        await page.set_content(html)
        slider=page.locator('.sc-slideshow').first
        assert await slider.count()==1
        async def caption():
            return await slider.locator('.sc-slide.is-active figcaption').inner_text()
        initial=await caption()
        await page.wait_for_timeout(240)
        assert await caption()!=initial,'Autoplay should advance'
        await slider.hover()
        hovered=await caption()
        await page.wait_for_timeout(260)
        assert await caption()==hovered,'Autoplay must pause on hover'
        await page.mouse.move(0,0)
        await page.wait_for_timeout(240)
        assert await caption()!=hovered,'Autoplay must resume after pointer leave'
        await slider.locator('[data-next]').focus()
        focused=await caption()
        await page.wait_for_timeout(260)
        assert await caption()==focused,'Autoplay must pause when focused'
        await page.evaluate('document.activeElement.blur()')
        await page.wait_for_timeout(240)
        assert await caption()!=focused,'Autoplay must resume after focus leaves'
        button=slider.locator('[data-pause]')
        await button.click()
        assert await button.get_attribute('aria-pressed')=='false'
        await page.mouse.move(0,0)
        await page.evaluate('document.activeElement.blur()')
        paused=await caption()
        await page.wait_for_timeout(260)
        assert await caption()==paused,'Explicit Pause must persist'
        await button.click()
        assert await button.get_attribute('aria-pressed')=='true'
        await page.mouse.move(0,0)
        await page.evaluate('document.activeElement.blur()')
        await page.wait_for_timeout(220)
        assert await caption()!=paused,'Explicit Play must resume'
        assert not errors,errors
        await browser.close()
        print('Slideshow browser regression passed')

if __name__=='__main__':
    asyncio.run(main())
