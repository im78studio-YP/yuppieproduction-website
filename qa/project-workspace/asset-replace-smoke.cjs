const {chromium}=require('C:/Users/Admin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-unsafe-swiftshader']});try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:4173/yp-web-ai/index.html');await page.waitForFunction(()=>window.YPAssetReplaceUI&&YPProjectWorkspace.state().ready);await page.evaluate(()=>YPQuickSetupBridge.close());
 const original=await page.evaluate(()=>{const o=makeCatalogObject('counter-standard',2,2);o.position.y=.73;o.rotationY=45;o.rotationX=10;o.size.w=2.8;o.transform.scale={x:1.5,y:1.5,z:1.5};o.transform.uniformScale=1.5;mutateObjects(()=>S.objects.push(o),o.id);return structuredClone(o);});
 await page.locator('#btnReplaceObject').click();assert.equal(await page.locator('#replaceCategory').inputValue(),'reception');
 await page.locator('[data-replace-id="counter-corner-round"]').click();await page.waitForFunction(()=>!document.getElementById('replaceConfirm').disabled,{},{timeout:120000});
 assert.equal(await page.evaluate(id=>objectById(id).catalogId,original.id),'counter-standard');
 await page.screenshot({path:'qa/project-workspace/asset-replace-desktop.png'});
 for(const width of [390,768]){await page.setViewportSize({width,height:844});assert.ok(await page.locator('#assetReplace').evaluate(d=>d.scrollWidth<=d.clientWidth+1));await page.screenshot({path:`qa/project-workspace/asset-replace-${width}.png`});}
 await page.locator('#replaceCancel').click();assert.equal(await page.evaluate(id=>objectById(id).catalogId,original.id),'counter-standard');
 await page.setViewportSize({width:1440,height:1000});await page.locator('#btnReplaceObject').click();await page.locator('#replaceCategory').selectOption('');await page.locator('[data-replace-id="shelf-standard"]').click();await page.waitForFunction(()=>!document.getElementById('replaceConfirm').disabled,{},{timeout:120000});
 await page.locator('#replaceConfirm').click();assert.equal(await page.locator('#assetReplace').evaluate(d=>d.open),false);
 const result=await page.evaluate(id=>structuredClone(objectById(id)),original.id);assert.equal(result.catalogId,'shelf-standard');assert.deepEqual(result.position,original.position);assert.equal(result.rotationY,45);assert.equal(result.rotationX,10);assert.deepEqual(result.size,{w:1,d:.45,h:2});assert.equal(result.transform.uniformScale,1);assert.equal(result.unitPrice,18000);
 await page.evaluate(()=>undoObjectChange());assert.equal(await page.evaluate(id=>objectById(id).catalogId,original.id),'counter-standard');assert.equal(await page.evaluate(id=>objectById(id).size.w,original.id),2.8);await page.evaluate(()=>redoObjectChange());assert.equal(await page.evaluate(id=>objectById(id).catalogId,original.id),'shelf-standard');
 assert.equal(await page.evaluate(id=>{objectById(id).groupId='qa-group';return YPAssetReplaceUI.open();},original.id),false);
 const extra=await page.evaluate(id=>{
  const source=objectById(id);delete source.groupId;source.position={x:-2.31,y:5.27,z:8.13};source.transform.flipX=true;sync();
  const next=makeReplacementObject(source,'counter-standard'),text=JSON.stringify(source),other=makeCatalogObject('display-standard',1,1);S.objects.push(other);sync();
  // Link cleanup must not change a neighbouring object's world position.
  other.placement.anchorAttachment={sourceAnchorId:'test',targetId:id,targetAnchorId:'test'};
  const beforePosition=structuredClone(other.position);commitReplacementObject(text,next);
  const result={position:structuredClone(objectById(id).position),flip:objectById(id).transform.flipX,childPosition:structuredClone(other.position),beforePosition,childLink:other.placement.anchorAttachment};
  let stale=false;try{commitReplacementObject(text,next);}catch{stale=true;}result.stale=stale;
  undoObjectChange();result.undoLink=objectById(other.id).placement.anchorAttachment?.targetId;
  const fixture={objects:[],assetAttachmentGraph:{attachments:[{childAssetId:id,attachment:{targetAssetId:'parent'}},{childAssetId:'child',attachment:{targetAssetId:id}},{childAssetId:'unrelated',attachment:{targetAssetId:'parent'}}]}};
  clearReplacementLinks(fixture,id);result.graphCount=fixture.assetAttachmentGraph.attachments.length;return result;
 },original.id);
 assert.deepEqual(extra.position,{x:-2.31,y:5.27,z:8.13});assert.equal(extra.flip,true);assert.deepEqual(extra.childPosition,extra.beforePosition);assert.equal(extra.childLink,null);assert.equal(extra.undoLink,original.id);assert.equal(extra.graphCount,1);assert.equal(extra.stale,true);
 assert.deepEqual(errors,[]);console.log('PASS replacement: preview isolation, cancel, cross-category, position/rotation, real dimensions, price, undo/redo, groups, mobile/tablet, outside placement, link cleanup, stale guard');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
