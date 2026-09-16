const {chromium}=require('C:/Users/Admin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-unsafe-swiftshader']});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1000},acceptDownloads:true,permissions:['clipboard-read','clipboard-write']}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('console',msg=>{if(msg.type()==='error')console.log('BROWSER',msg.text());});
  await page.goto('http://127.0.0.1:4173/yp-web-ai/index.html',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.YPPresentationBoardUI&&window.YPProjectWorkspace?.state().ready,null,{timeout:60000});
  await page.evaluate(()=>YPQuickSetupBridge.close());
  const open=()=>page.locator('.dock-tool[data-dock-page="prompt"]').click();
  await open();
  assert.equal(await page.locator('#promptImageTextCopy').count(),0);
  assert.ok(await page.locator('#dockUpdate').isHidden());
  assert.equal(await page.locator('#dockUpdateBar #promptCopy').count(),1);
  await page.locator('#promptBoardTab').click();assert.ok(await page.locator('#promptCopy').isHidden());assert.ok(await page.locator('#dockUpdate').isVisible());
  await page.locator('#promptImageTab').click();assert.ok(await page.locator('#promptCopy').isVisible());
  // Force clipboard failure only in this isolated session: keep the panel open and allow retry.
  await page.evaluate(()=>{window.originalCopy=copyRenderPackagePrompt;copyRenderPackagePrompt=async()=>{throw new Error('COPY_FAILED');};});
  await page.locator('#promptCopy').click();
  await page.waitForFunction(()=>document.getElementById('promptStatus').textContent.includes('คัดลอกไม่สำเร็จ'));
  assert.equal(await page.locator('#dockPanel').getAttribute('aria-hidden'),'false');
  assert.ok(await page.locator('#promptCopy').isEnabled());
  await page.evaluate(()=>{copyRenderPackagePrompt=window.originalCopy;});
  await page.setViewportSize({width:390,height:844});
  const bounds=await page.locator('#promptCopy').boundingBox();assert.ok(bounds.x>=0&&bounds.x+bounds.width<=390&&bounds.y+bounds.height<=844);
  await page.screenshot({path:'qa/project-workspace/unified-prompt-action-mobile.png'});
  const download=page.waitForEvent('download',{timeout:120000}).catch(e=>({error:e}));
  await page.locator('#promptCopy').click();
  await page.waitForFunction(()=>!prepareRenderPackage.busy,null,{timeout:120000});
  console.log('RESULT',await page.locator('#promptStatus').textContent());
  assert.equal(await page.locator('#dockPanel').getAttribute('aria-hidden'),'true');
  const file=await download;if(file.error)throw file.error;assert.match(file.suggestedFilename(),/^YUPPIE-Booth-.*\.png$/);
  await page.waitForFunction(()=>document.getElementById('dockPanel').getAttribute('aria-hidden')==='true',null,{timeout:120000});
  assert.match(await page.evaluate(()=>navigator.clipboard.readText()),/LAYER A/);
  await open();assert.ok(await page.locator('#promptCopy').isEnabled());
  await page.locator('#promptBoardTab').click();await page.locator('#dockUpdate').click();
  assert.equal(await page.locator('#dockPanel').getAttribute('aria-hidden'),'true');
  assert.deepEqual(errors,[]);
  console.log('PASS one footer action, tab-specific Done, failure stays open, mobile bounds, actual clipboard + PNG download, close only after success, reopen/retry');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
