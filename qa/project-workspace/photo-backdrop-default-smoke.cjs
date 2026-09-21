const {chromium}=require('C:/Users/Admin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-unsafe-swiftshader']});try{
 const page=await browser.newPage({viewport:{width:1280,height:900}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:4173/yp-web-ai/index.html',{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.YPWizardV2&&YPProjectWorkspace.state().ready);
 await page.evaluate(()=>{YPQuickSetupBridge.close();selectBoothType('backdrop');});
 const check=()=>page.evaluate(()=>({type:S.type,dims:[S.W,S.D,S.H],floor:[S.floor,S.carpet,S.raise],logo:[S.logoMount,S.logoFloorX,S.logoFloorZ,S.logoScale,S.nameScale],wall:S.wallStickers.back.data===YPPhotoBackdropArtwork.data,faces:S.wallStickerFaces}));
 let result=await check();assert.equal(result.wall,true);assert.deepEqual(result.logo,['floor',3,2.8,35,0]);assert.deepEqual(result.floor,['carpet','grey',0]);assert.deepEqual(result.faces,['back']);
 await page.evaluate(async()=>{const project=YPProjectStore.fromText(await YPProjectStore.toText(YPProjectStore.create(YPProjectBridge.capture())));YPProjectBridge.restore(project.variants.A);closeDockPanel(false);const r=await loadThreeRenderer();await r.waitForSceneAssets(20000,BoothSpec);});
 assert.deepEqual(await check(),result);
 await page.screenshot({path:'qa/project-workspace/photo-backdrop-default-preview.png'});
 await page.evaluate(()=>YPQuickSetupBridge.open({start:'business'}));await page.locator('#quickBusinessGroups [data-value=food]').click();await page.locator('#quickBusinessNext').click();await page.locator('#quickBoothTypes [data-value=backdrop]').click();await page.locator('#quickLayoutNext').click();await page.locator('#wizard-template-next').click();
 const draft=await page.evaluate(()=>{const s=YPWizardV2.result().spec;return{logo:[s.logoMount,s.logoFloorZ],wall:s.wallStickers.back.data===YPPhotoBackdropArtwork.data};});assert.deepEqual(draft,{logo:['floor',2.8],wall:true});
 await page.keyboard.press('Escape');
 await page.evaluate(()=>{S.wallStickers.back.offsetX=.25;S.logoFloorZ=2.5;sync();YPQuickSetupBridge.open();YPWizardV2.begin('current','layout');});
 assert.deepEqual(await page.evaluate(()=>{const s=YPWizardV2.result().spec;return [s.wallStickers.back.offsetX,s.logoFloorZ];}),[.25,2.5]);
 await page.keyboard.press('Escape');assert.deepEqual(errors,[]);console.log('PASS backdrop approved defaults, actual render, portable save/load, new Wizard, preserved existing edits');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
