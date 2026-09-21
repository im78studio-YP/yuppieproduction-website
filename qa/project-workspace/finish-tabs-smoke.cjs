const {chromium}=require('C:/Users/Admin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true});try{
 for(const width of [1280,390]){
  const page=await browser.newPage({viewport:{width,height:900}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:4173/yp-web-ai/index.html',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.YPProjectWorkspace?.state().ready&&window.YPWallFinishUI);
  await page.evaluate(()=>{YPQuickSetupBridge.close();S.type='inline';S.view='plan';sync();showDockPage('finish',document.querySelector('.dock-tool[data-dock-page="finish"]'));});
  const floor=page.locator('#finishFloorTab'),wall=page.locator('#finishWallTab');
  assert.equal(await floor.getAttribute('aria-selected'),'true');
  assert.ok(await page.locator('#settingsFloor').isVisible());assert.ok(!await page.locator('#settingsWall').isVisible());
  const a=await floor.boundingBox(),b=await wall.boundingBox();assert.ok(Math.abs(a.y-b.y)<1&&b.x>=a.x+a.width&&b.x+b.width<=width);
  await page.locator('#oRaise button').nth(1).click();const raised=await page.evaluate(()=>S.raise);
  await wall.click();assert.ok(await page.locator('#settingsWall').isVisible());assert.ok(!await page.locator('#settingsFloor').isVisible());
  const hex=page.locator('#wallPaintHex-back');await hex.fill('#123456');await hex.press('Enter');
  assert.equal(await page.evaluate(()=>S.wallPaintOverrides.back),'#123456');
  await page.evaluate(()=>document.getElementById('dockFinishPage').scrollTop=500);
  const bounds=await wall.boundingBox();assert.ok(bounds.y>=0&&bounds.y+bounds.height<250,'tabs stay accessible while scrolling');
  await wall.focus();await wall.press('ArrowLeft');assert.equal(await floor.getAttribute('aria-selected'),'true');assert.ok(await floor.evaluate(e=>e===document.activeElement));
  assert.equal(await page.evaluate(()=>S.raise),raised);
  await page.evaluate(()=>{closeDockPanel();showDockPage('finish',document.querySelector('.dock-tool[data-dock-page="finish"]'));});
  assert.equal(await floor.getAttribute('aria-selected'),'true');
  assert.equal(await page.evaluate(()=>YPWallFinishUI.openFace('back')),true);
  assert.equal(await wall.getAttribute('aria-selected'),'true');assert.ok(await hex.isVisible());assert.equal(await hex.inputValue(),'#123456');
  await page.evaluate(()=>document.getElementById('dockFinishPage').scrollTop=0);
  await page.screenshot({path:'qa/project-workspace/finish-tabs-wall-'+width+'.png'});
  await floor.click();await page.screenshot({path:'qa/project-workspace/finish-tabs-floor-'+width+'.png'});
  assert.deepEqual(errors,[]);console.log('PASS finish tabs',width,'layout, sticky header, keyboard, edits retained, direct wall entry');await page.close();
 }
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
