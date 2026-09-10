const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'C:/Users/Admin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
(async()=>{
  const browser=await chromium.launch({channel:'chrome',headless:true});
  try{
    const page=await browser.newPage({viewport:{width:1440,height:1000}});
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto('http://127.0.0.1:4173/yp-web-ai/index.html');
    await page.waitForFunction(()=>window.YPProjectWorkspace?.state().ready&&window.YPInlineWizard);
    const noPurposePrompt=async()=>{
      assert.equal(await page.locator('.starter-dialog, #starterOpen').count(),0);
      assert.equal(await page.getByText('บูธนี้เน้นอะไร?',{exact:true}).count(),0);
      assert.equal(await page.evaluate(()=>typeof window.YPStarterLayoutUI),'undefined');
    };
    await noPurposePrompt();
    // Complete the real template flow; the selected booth must survive unchanged.
    await page.locator('#releaseStart').click();
    await page.locator('#quickBusinessNext').click();
    await page.locator('#quickBoothTypes [data-value=penin]').click();
    await page.locator('#quickTemplateChoices [data-value=penin-golden-oculus]').click();
    await page.locator('#quickLayoutNext').click();
    await page.locator('#quickBrandNext').click();
    await page.locator('#quickFloorNext').click();
    await page.locator('#quickRoomFinish').click();
    await page.waitForFunction(()=>!YPQuickSetupBridge.getState().open&&!YPProjectWorkspace.state().busy);
    assert.equal(await page.evaluate(()=>getBoothSpec().boothTemplate.id),'penin-golden-oculus');
    assert.deepEqual(await page.evaluate(()=>[getBoothSpec().W,getBoothSpec().D]),[6,3]);
    await noPurposePrompt();
    // Manual completion no longer opens a second question or changes assets.
    const before=await page.evaluate(()=>getBoothSpec().objects);
    await page.evaluate(()=>window.dispatchEvent(new CustomEvent('yp:quick-setup-complete',{detail:{templateId:null}})));
    await noPurposePrompt();
    assert.deepEqual(await page.evaluate(()=>getBoothSpec().objects),before);
    await page.setViewportSize({width:390,height:844});
    await noPurposePrompt();
    assert.deepEqual(errors,[]);
    console.log('PASS: no purpose card/dialog on desktop or mobile, template wizard applies 6x3 booth, manual completion preserves assets');
  }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
