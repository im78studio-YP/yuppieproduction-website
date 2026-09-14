const {chromium}=require('C:/Users/Admin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-unsafe-swiftshader']});try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:4173/yp-web-ai/index.html');await page.waitForFunction(()=>window.YPHandoffUI&&YPProjectWorkspace.state().ready);
 const ids=await page.evaluate(async()=>{YPQuickSetupBridge.close();S.objects=[];const a=makeCatalogObject(YPTVAsset.id,2,2),b=makeCatalogObject('tv-65',4,2);mutateObjects(()=>S.objects.push(a,b),b.id);await loadThreeRenderer();closeDockPanel(false);return[a.id,b.id];});
 await page.waitForFunction(ids=>ids.every(id=>{let ready=false;threeRenderer?.objectMeshes.get(id)?.traverse(m=>{if(m.name==='3DGeom-4'&&m.material.map?.image)ready=true;});return ready;}),ids);
 const sizes=await page.evaluate(ids=>ids.map(id=>{const o=objectById(id),T=threeRenderer.THREE,b=new T.Box3().setFromObject(threeRenderer.objectMeshes.get(id)).getSize(new T.Vector3());return{name:selectedAssetName(o),size:o.size,actual:{w:b.x,d:b.z,h:b.y}};}),ids);
 for(const [i,expected]of [{w:.91,d:.1,h:.55},{w:1.46,d:.1,h:.8}].entries()){assert.deepEqual(sizes[i].size,expected);for(const k of ['w','d','h'])assert.ok(Math.abs(sizes[i].actual[k]-expected[k])<.0001);}
 assert.deepEqual(sizes.map(s=>s.name),['ทีวี 40 นิ้ว','ทีวี 65 นิ้ว']);
 await page.evaluate(id=>{selectObject(id);openAssetSettings();},ids[1]);assert.equal(await page.locator('#assetChooseSticker').textContent(),'เปลี่ยนภาพหน้าจอ');
 assert.deepEqual(errors,[]);console.log('PASS both catalog TVs: names, saved sizes, actual GLB bounds, editable screen; '+JSON.stringify(sizes));
 }finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
