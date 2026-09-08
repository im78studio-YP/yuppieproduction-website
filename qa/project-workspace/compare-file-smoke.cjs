const {chromium}=require('C:/Users/Admin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true});try{
  const page=await browser.newPage({viewport:{width:1440,height:1000}});
  await page.goto(require('node:url').pathToFileURL(require('node:path').resolve('public/yp-web-ai/index.html')).href);
  await page.waitForFunction(()=>window.YPProjectWorkspace?.state().ready&&window.YPCompareUI);await page.evaluate(()=>YPQuickSetupBridge.close());
  await page.locator('#projectDuplicate').click();await page.waitForFunction(()=>YPProjectWorkspace.state().active==='B'&&!YPProjectWorkspace.state().busy);
  await page.locator('#projectCompare').click();await page.waitForFunction(()=>document.querySelector('#compareStatus').textContent.includes('ภาพพร้อมแล้ว')||document.querySelector('#compareStatus').dataset.error==='true',{},{timeout:100000});
  console.log('FILE URL:',await page.locator('#compareStatus').textContent());
  assert.equal(await page.locator('#compareStatus').getAttribute('data-error'),'false');
  assert.equal(await page.locator('#compareImageA').isVisible(),true);assert.equal(await page.locator('#compareImageB').isVisible(),true);
  assert.equal(await page.locator('[data-choose=A]').isEnabled(),true);await page.locator('[data-choose=A]').click();await page.waitForFunction(()=>document.querySelector('.handoff-dialog').open);assert.equal(await page.locator('#handoffVariant').inputValue(),'A');
  console.log('PASS file URL compare data and selection');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
