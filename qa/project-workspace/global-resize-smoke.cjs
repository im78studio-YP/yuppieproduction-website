const {chromium}=require('C:/Users/Admin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-unsafe-swiftshader']});try{
 for(const mobile of [false,true]){const ctx=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1440,height:1000},isMobile:mobile,hasTouch:mobile}),page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('https://fonts.googleapis.com/**',r=>r.abort());await page.goto('http://127.0.0.1:4173/yp-web-ai/index.html',{waitUntil:'domcontentloaded',timeout:60000});await page.waitForFunction(()=>window.YPResizeSubmenu&&YPProjectWorkspace.state().ready,null,{timeout:60000});
 const audit=await page.evaluate(async()=>{
  YPQuickSetupBridge.close();
  const catalog=OBJECT_CATALOG.map(item=>{const o=makeCatalogObject(item.catalogId,1,1);return{id:item.catalogId,resize:o.transformPolicy.canResize,scale:o.transformPolicy.canScale};});
  const templates=[];for(const [library,bridge]of [[YPInlineTemplates,YPInlineTemplateBridge],[YPCornerTemplates,YPCornerTemplateBridge],[YPPeninsularTemplates,YPPeninsularTemplateBridge],[YPIslandTemplates,YPIslandTemplateBridge]])for(const t of library.templates){const s=bridge.snapshot(t.id).spec;for(const o of s.objects)normalizeSceneObjectModel(o);templates.push({id:t.id,blocked:s.objects.filter(o=>!o.transformPolicy.canResize&&!o.transformPolicy.canScale).map(o=>o.catalogId)});}
  const snapshot=YPPeninsularTemplateBridge.snapshot('penin-oak-gallery-6');for(const o of snapshot.spec.objects)if(o.catalogId==='panel-standard')o.transformPolicy={version:4,family:'generic',canResize:false,canScale:false,canMove:true,defaultMode:'move'};
  const persisted=await YPProjectStore.toText(YPProjectStore.create(snapshot)),loaded=YPProjectStore.fromText(persisted);YPProjectBridge.restore(loaded.variants[loaded.active]);
  const beam=S.objects.find(o=>o.size.d===5.72),migration=S.objects.filter(o=>!o.transformPolicy.canResize).map(o=>o.catalogId);selectObject(beam.id);await loadThreeRenderer();closeDockPanel(false);return{catalog,templates,migration,id:beam.id};
 });
 assert.deepEqual(audit.catalog.filter(o=>!o.resize&&!o.scale),[]);assert.deepEqual(audit.templates.filter(t=>t.blocked.length),[]);assert.deepEqual(audit.migration,[]);console.log('AUDIT',mobile?'mobile':'desktop',audit.catalog.length+' catalog / '+audit.templates.length+' templates; saved v4 migration');
 const size=()=>page.evaluate(id=>({...objectById(id).size}),audit.id);
 await page.locator('#btnResizeObject').click();assert.equal(await page.locator('#resizeValued').inputValue(),'5.72');await page.locator('#resizeSubmenuLock').uncheck();await page.locator('#resizeValued').fill('6');await page.locator('#resizeValued').press('Enter');assert.equal((await size()).d,6);
 await page.locator('#resizeValueh').fill('.5');await page.locator('#resizeValueh').press('Enter');assert.equal((await size()).h,.5);
 const mesh=await page.evaluate(id=>{const sizes=[];threeRenderer.objectMeshes.get(id).traverse(m=>{if(m.geometry?.type==='BoxGeometry')sizes.push(m.geometry.parameters);});return sizes;},audit.id);assert.ok(mesh.some(s=>s.depth===6&&s.height===.5));
 await page.locator('#resizeSubmenuDone').click();
 const atomic=await page.evaluate(id=>{const o=objectById(id),before=JSON.stringify(o.size),history=objectEditor.past.length;document.getElementById('assetSizeLock').checked=true;updateSelectedObjectSize('h',30);return{same:JSON.stringify(o.size)===before,sameHistory:objectEditor.past.length===history};},audit.id);assert.deepEqual(atomic,{same:true,sameHistory:true});
 const scaleId=await page.evaluate(()=>{const o=makeCatalogObject('high-table-stool-set',2,2);mutateObjects(()=>S.objects.push(o),o.id);closeDockPanel(false);return o.id;});
 await page.locator('#btnResizeObject').click();assert.equal(await page.locator('#resizeSubmenuMode').inputValue(),'scale');assert.equal(await page.locator('#resizeSubmenuLock').isDisabled(),true);assert.equal(await page.locator('#resizeSubmenuMode option[value="resize"]').isDisabled(),true);
 const original=await page.evaluate(id=>({size:{...objectById(id).size},position:{...objectById(id).position},history:objectEditor.past.length}),scaleId);
 await page.locator('#resizeValuew').fill(String(original.size.w*1.5));await page.locator('#resizeValuew').press('Enter');
 const scaled=await page.evaluate(id=>({size:{...objectById(id).size},position:{...objectById(id).position},scale:sceneObjectScaleValue(objectById(id)),history:objectEditor.past.length,handles:threeRenderer.resizeHandleGroup?.children.filter(m=>m.userData.resizeHandle).length}),scaleId);
 assert.deepEqual(scaled.size,original.size);assert.deepEqual(scaled.position,original.position);assert.equal(scaled.scale,1.5);assert.equal(scaled.history,original.history+1);assert.equal(scaled.handles,8);
 assert.equal(+(await page.locator('#resizeValueh').inputValue()),+(original.size.h*1.5).toFixed(3));
 await page.evaluate(()=>undoObjectChange());assert.equal(await page.evaluate(id=>sceneObjectScaleValue(objectById(id)),scaleId),1);await page.evaluate(()=>redoObjectChange());assert.equal(await page.evaluate(id=>sceneObjectScaleValue(objectById(id)),scaleId),1.5);
 await page.locator('#resizeValuew').fill(String(original.size.w*6));await page.locator('#resizeValuew').press('Enter');assert.equal(await page.locator('#resizeValuew').getAttribute('aria-invalid'),'true');
 assert.ok(await page.locator('#resizeSubmenu').evaluate(p=>{const r=p.getBoundingClientRect();return p.scrollWidth<=p.clientWidth+1&&r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight;}));
 await page.screenshot({path:'qa/project-workspace/global-resize-'+(mobile?'mobile':'desktop')+'.png'});
 await page.locator('#resizeSubmenuDrag').click();assert.equal(await page.evaluate(()=>objectEditor.transformMode),'scale');
 const saved=await page.evaluate(async id=>{const out=YPProjectStore.fromText(await YPProjectStore.toText(YPProjectStore.create(YPProjectBridge.capture())));return out.variants[out.active].spec.objects.find(o=>o.id===id).transform.uniformScale;},scaleId);assert.equal(saved,1.5);
 await page.evaluate(id=>{selectObject(id);objectById(id).locked=true;sync();},scaleId);assert.equal(await page.locator('#btnResizeObject').isDisabled(),true);
 await page.evaluate(id=>{objectById(id).locked=false;objectById(id).transformPolicy={...objectById(id).transformPolicy,version:5,canResize:false,canScale:false};selectObject(id);},audit.id);assert.equal(await page.locator('#btnResizeObject').isDisabled(),true);
 assert.deepEqual(errors,[]);console.log('PASS',mobile?'mobile':'desktop','large dimensions, real mesh, atomic rejection, scale-only, Undo/Redo, persistence, lock and explicit restriction');await ctx.close();
 }
 }finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
