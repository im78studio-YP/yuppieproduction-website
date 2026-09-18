const {chromium}=require('C:/Users/Admin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-unsafe-swiftshader']});
 try{for(const width of [1440,390]){
  const page=await browser.newPage({viewport:{width,height:1000}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://fonts.googleapis.com/**',route=>route.abort());
  await page.goto('http://127.0.0.1:4173/yp-web-ai/index.html',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.YPProjectWorkspace?.state().ready);
  await page.evaluate(async()=>{YPQuickSetupBridge.close();S.type='island';S.W=6;S.D=6;S.objects=[];S.stSize='none';S.lights=false;const obj=makeCatalogObject('counter-standard',3,3);mutateObjects(()=>S.objects.push(obj),obj.id);selectObject(null);await loadThreeRenderer();await threeRenderer.waitForSceneAssets(15000,BoothSpec);closeDockPanel(false);});
  const dock=page.locator('.dock-tool[data-dock-page="catalog"]');
  const active=()=>page.locator('[data-asset-tab="editor"]').getAttribute('aria-selected');
  await dock.click();assert.equal(await page.locator('#catalogPane').isVisible(),true,'menu keeps library behavior');
  await page.locator('#dockClose').click();
  const assetPoint=()=>page.evaluate(()=>{const T=threeRenderer.THREE,root=threeRenderer.objectMeshes.get(S.objects[0].id),p=new T.Box3().setFromObject(root).getCenter(new T.Vector3()).project(threeRenderer.camera),r=threeRenderer.renderer.domElement.getBoundingClientRect();return{x:r.left+(p.x+1)*r.width/2,y:r.top+(1-p.y)*r.height/2};});
  let p=await assetPoint();await page.mouse.click(p.x,p.y);assert.equal(await active(),'true');
  assert.equal(await page.locator('#assetEditorPane').isVisible(),true);
  assert.equal(await page.locator('[data-ae-body]').isVisible(),true);
  assert.equal(await page.evaluate(()=>objectEditor.selectedId===S.objects[0].id),true,'actual canvas click selects asset');
  const flip=page.locator('[data-ae-action="flip-z"]');
  const flipped=()=>page.evaluate(()=>S.objects[0].transform.flipZ);
  await flip.click();assert.equal(await flipped(),true,'front/back flip enabled');
  assert.equal(await page.evaluate(()=>threeRenderer.objectMeshes.get(S.objects[0].id).scale.z<0),true,'rendered mesh mirrored');
  await page.locator('[data-ae-action="undo"]').click();assert.equal(await flipped(),false);
  await page.locator('[data-ae-action="redo"]').click();assert.equal(await flipped(),true);
  await flip.click();assert.equal(await flipped(),false,'second click restores front/back');
  await page.locator('[data-ae-action="lock"]').click();assert.equal(await flip.isDisabled(),true);
  await page.locator('[data-ae-action="lock"]').click();assert.equal(await flip.isEnabled(),true);
  for(const tab of ['catalog','my']){
   await page.locator(`[data-asset-tab="${tab}"]`).click();
   assert.equal(await page.locator(`[data-asset-pane="${tab}"]`).isVisible(),true);
  }
  await page.locator('#dockClose').click();await dock.click();assert.equal(await page.locator('[data-asset-tab="my"]').getAttribute('aria-selected'),'true','menu preserves chosen tab');
  await page.locator('#dockClose').click();
  await page.locator('#editorLevelToggle').click();
  p=await assetPoint();await page.mouse.click(p.x,p.y);
  assert.equal(await active(),'true');
  assert.equal(await page.locator('[data-ae-body]').isVisible(),true);
  // Background selection clearing must not override a manually chosen library tab.
  await page.locator('[data-asset-tab="my"]').click();await page.evaluate(()=>selectObject(null));
  assert.equal(await page.locator('[data-asset-tab="my"]').getAttribute('aria-selected'),'true');
  await page.locator('#dockClose').click();
  p=await assetPoint();await page.mouse.move(p.x,p.y);await page.mouse.down();await page.mouse.move(p.x+45,p.y+20,{steps:8});await page.mouse.up();
  assert.equal(await page.locator('#dockPanel').getAttribute('aria-hidden'),'true','drag does not open panel');
  assert.deepEqual(errors,[]);console.log('PASS',width,'canvas click opens editor in basic/advanced, menu preserved, drag does not open');await page.close();
 }}finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
