const {chromium}=require('C:/Users/Admin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-unsafe-swiftshader']});try{
 for(const viewport of [{width:1120,height:836},{width:1440,height:1000},{width:390,height:844}]){
  const page=await browser.newPage({viewport}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:4173/yp-web-ai/index.html',{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.YPWizardV2&&YPProjectWorkspace.state().ready);
  await page.evaluate(()=>YPQuickSetupBridge.open({start:'business'}));await page.locator('#quickBusinessGroups [role=radio]').first().waitFor();
  assert.equal(await page.locator('#quickBusinessGroups [role=radio]').count(),17);
  const geometry=await page.locator('#quickStepBusiness').evaluate(el=>{const scroll=el.querySelector('.quick-step-scroll'),button=el.querySelector('.quick-choice'),groups=el.querySelector('#quickBusinessGroups'),footer=el.querySelector('.quick-step-actions');return{overflow:el.scrollWidth>el.clientWidth+1,height:button.getBoundingClientRect().height,allCategoriesFit:groups.getBoundingClientRect().bottom<=scroll.getBoundingClientRect().bottom,footerBottom:footer.getBoundingClientRect().bottom};});
  assert.equal(geometry.overflow,false);assert.ok(geometry.height>=44&&geometry.height<60);assert.ok(geometry.footerBottom<=viewport.height);if(viewport.width>800)assert.equal(geometry.allCategoriesFit,true,'all categories visible on desktop');
  assert.equal(await page.locator('#quickBusinessBriefFields').getAttribute('open'),null);
  await page.screenshot({path:'qa/project-workspace/wizard-business-compact-'+viewport.width+'.png'});
  await page.locator('#quickBusinessGroups [data-value=other]').click();await page.locator('#quickBusinessCustom').fill('งานแสดงสินค้า');await page.locator('#quickBusinessCustom').press('Tab');
  await page.locator('#quickBusinessBriefFields summary').click();await page.locator('#quickBusinessBrief-product').fill('สินค้าเพื่อทดสอบ');
  await page.locator('#quickBusinessNext').click();await page.locator('#quickLayoutBack').click();assert.equal(await page.locator('#quickBusinessCustom').inputValue(),'งานแสดงสินค้า');assert.equal(await page.locator('#quickBusinessBrief-product').inputValue(),'สินค้าเพื่อทดสอบ');
  await page.locator('#quickBusinessGroups [data-value=food]').click();assert.equal(await page.locator('#quickBusinessGroups [data-value=food]').getAttribute('aria-checked'),'true');await page.locator('#quickBusinessNext').click();assert.equal(await page.locator('#quickStepLayout').isVisible(),true);await page.locator('#quickLayoutNext').click();assert.equal(await page.locator('#wizard-template-edit-later').isVisible(),true);assert.match(await page.locator('#wizard-template-edit-later').innerText(),/เพิ่ม ลบ หรือเปลี่ยนอุปกรณ์/);await page.screenshot({path:'qa/project-workspace/wizard-template-note-'+viewport.width+'.png'});assert.deepEqual(errors,[]);console.log('PASS',viewport.width,'compact geometry, all 17 choices, custom category, optional brief preservation and navigation');await page.close();
 }
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
