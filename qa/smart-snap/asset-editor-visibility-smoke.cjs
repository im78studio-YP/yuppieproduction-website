const {chromium}=require('C:/Users/Admin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-unsafe-swiftshader']});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:4173/yp-web-ai/index.html',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.YPProjectWorkspace?.state().ready);
  await page.evaluate(async()=>{YPQuickSetupBridge.close();S.objects=[];const a=makeCatalogObject('counter-standard',2,3);a.appearance={mode:'solid',color:'#f5f5f5'};mutateObjects(()=>S.objects.push(a),a.id);const r=await loadThreeRenderer();await r.waitForSceneAssets(15000,BoothSpec);closeDockPanel(false);});
  const before=await page.evaluate(()=>JSON.stringify(S.objects));
  await page.evaluate(()=>openAssetSettings());
  await page.locator('.asset-parts-dialog canvas').waitFor();
  await page.screenshot({path:'qa/smart-snap/asset-editor-visibility-desktop.png'});
  assert.equal(await page.locator('.asset-parts-view').evaluate(el=>getComputedStyle(el).backgroundColor),'rgb(101, 113, 126)');
  const box=await page.locator('.asset-parts-dialog canvas').boundingBox();
  await page.mouse.click(box.x+box.width*.5,box.y+box.height*.5);
  await page.locator('[data-part-frame]').click();
  await page.keyboard.press('Escape');
  assert.equal(await page.evaluate(()=>JSON.stringify(S.objects)),before,'preview lighting never changes saved objects');
  await page.setViewportSize({width:390,height:844});
  await page.evaluate(()=>openAssetSettings());await page.locator('.asset-parts-dialog canvas').waitFor();
  await page.screenshot({path:'qa/smart-snap/asset-editor-visibility-mobile.png'});
  await page.keyboard.press('Escape');assert.deepEqual(errors,[]);
  console.log('PASS studio preview desktop/mobile, selection/frame/cancel and unchanged object data');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
