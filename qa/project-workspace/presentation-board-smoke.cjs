const {chromium}=require('C:/Users/Admin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict'),fs=require('node:fs/promises');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1050},acceptDownloads:true,permissions:['clipboard-read','clipboard-write']}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:4173/yp-web-ai/index.html');
  await page.waitForFunction(()=>window.YPPresentationBoardUI&&window.YPProjectWorkspace?.state().ready);
  await page.evaluate(async()=>{YPQuickSetupBridge.close();YPProjectBridge.restore(YPPeninsularTemplateBridge.snapshot('penin-golden-oculus'));const r=await loadThreeRenderer();await r.waitForSceneAssets(20000);});
  const before=await page.evaluate(()=>({objects:getBoothSpec().objects,camera:threeRenderer.cameraManifest()}));
  const download=page.waitForEvent('download',{timeout:120000});
  assert.equal(await page.evaluate(()=>YPPresentationBoardUI.prepare()),true);
  const file=await download,bytes=await fs.readFile(await file.path()),entries={};
  let offset=0;
  while(bytes.readUInt32LE(offset)===0x04034b50){const size=bytes.readUInt32LE(offset+18),length=bytes.readUInt16LE(offset+26),extra=bytes.readUInt16LE(offset+28),name=bytes.subarray(offset+30,offset+30+length).toString(),start=offset+30+length+extra;entries[name]=bytes.subarray(start,start+size);offset=start+size;}
  assert.equal(Object.keys(entries).length,9);
  for(const [name,data] of Object.entries(entries).filter(([name])=>name.endsWith('.png'))){assert.ok(data.length>1000,name);assert.equal(data.subarray(1,4).toString(),'PNG');}
  const brief=JSON.parse(entries['booth-data.json']);assert.equal(brief.booth.width,6);assert.equal(brief.booth.depth,3);assert.equal(brief.views.length,6);
  assert.ok(entries['board-prompt.txt'].toString().includes(brief.stateHash));
  assert.equal(await page.locator('#boardPrompt').inputValue(),entries['board-prompt.txt'].toString());
  const after=await page.evaluate(()=>({objects:getBoothSpec().objects,camera:threeRenderer.cameraManifest()}));
  assert.deepEqual(after.objects,before.objects);
  for(const key of ['projection','cameraViewType','position','target'])assert.deepEqual(after.camera[key],before.camera[key],key);
  assert.equal(await page.locator('#promptCopy').isEnabled(),true);assert.equal(await page.locator('#promptBoard').isEnabled(),true);
  await page.locator('.dock-tool[data-dock-page="prompt"]').click();
  await page.locator('#promptBoardTab').click();
  assert.equal(await page.locator('#promptImagePanel').isVisible(),false);
  assert.equal(await page.locator('#promptBoardPanel').isVisible(),true);
  await page.locator('#promptBoardTextCopy').click();
  assert.equal((await page.evaluate(()=>navigator.clipboard.readText())).replace(/\r\n/g,'\n'),entries['board-prompt.txt'].toString());
  await page.locator('#promptImageTab').click();
  await page.locator('#promptImageTextCopy').click();
  const imagePrompt=await page.evaluate(()=>navigator.clipboard.readText());
  assert.ok(imagePrompt.includes('LAYER A'));assert.notEqual(imagePrompt,entries['board-prompt.txt'].toString());
  await page.locator('#promptBoardTab').click();
  await page.locator('#promptBoardTab').press('ArrowLeft');
  assert.equal(await page.locator('#promptImageTab').getAttribute('aria-selected'),'true');
  await page.locator('#promptImageTab').press('End');
  assert.equal(await page.locator('#promptBoardTab').getAttribute('aria-selected'),'true');
  await page.setViewportSize({width:390,height:844});
  await page.locator('#promptBoard').scrollIntoViewIfNeeded();
  assert.ok(await page.locator('#promptBoard').evaluate(b=>b.scrollWidth<=b.clientWidth+1));
  await page.screenshot({path:'qa/project-workspace/presentation-board-mobile.png'});
  await page.locator('#promptBoardTab').scrollIntoViewIfNeeded();
  await page.screenshot({path:'qa/project-workspace/presentation-board-tabs-mobile.png'});
  // A failed export must restore the camera and unlock both actions without a download.
  assert.equal(await page.evaluate(async()=>{const r=threeRenderer,original=r.exportCleanScreenshot;r.exportCleanScreenshot=async()=>{throw new Error('test failure');};try{return await YPPresentationBoardUI.prepare();}finally{r.exportCleanScreenshot=original;}}),false);
  assert.equal(await page.locator('#promptCopy').isEnabled(),true);assert.equal(await page.locator('#promptBoard').isEnabled(),true);
  assert.equal(await page.evaluate(()=>threeRenderer.cameraManifest().cameraViewType),before.camera.cameraViewType);
  await page.evaluate(()=>{const previous=S.W;S.W=9;YPPresentationBoardUI.refreshPreview();window.boardChangedPreview=document.getElementById('boardPrompt').value;S.W=previous;YPPresentationBoardUI.refreshPreview();});
  assert.ok(await page.evaluate(()=>window.boardChangedPreview.includes('กว้าง 9')&&window.boardChangedPreview.includes('DRAFT')));
  assert.deepEqual(errors,[]);
  console.log('PASS: ZIP with six PNG views, prompt and booth data; original objects/camera preserved; failure unlocks actions');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
