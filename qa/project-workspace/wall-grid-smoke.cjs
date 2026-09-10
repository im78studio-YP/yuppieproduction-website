const {chromium}=require('C:/Users/Admin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict'),path=require('node:path');
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true});try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:4173/yp-web-ai/index.html',{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.YPProjectWorkspace?.state().ready);
 await page.evaluate(async()=>{YPQuickSetupBridge.close();S.type='inline';S.W=6;S.D=3;S.objects=[];S.stSize=0;S.raise=10;sync();closeDockPanel(false);await loadThreeRenderer();});
 const roots=()=>page.evaluate(()=>{const result=[];threeRenderer.boothGroup.traverse(p=>{if(p.name==='booth-editing-grid'||p.name.startsWith('booth-wall-editing-grid-'))result.push(p.name);});return result;});
 assert.deepEqual(await roots(),[]);const original=await page.evaluate(()=>JSON.stringify(getBoothSpec()));
 const gridToggle=require('./grid-menu-test-helper.cjs'),wall=gridToggle(page,'dockWallGridToggle'),floor=gridToggle(page,'dockGridToggle');await wall.click();
 assert.deepEqual((await roots()).sort(),['back','left','right'].map(f=>'booth-wall-editing-grid-'+f).sort());
 assert.equal(await floor.getAttribute('aria-pressed'),'false');assert.equal(await page.evaluate(()=>JSON.stringify(getBoothSpec())),original);
 const geometry=await page.evaluate(()=>{const result=[];threeRenderer.boothGroup.traverse(g=>{if(!g.name.startsWith('booth-wall-editing-grid-'))return;
  const {gridLength:l,gridHeight:h}=g.userData,lines=[...viewGridLines(l),...viewGridLines(h)];result.push({parent:g.parent.name,minor:g.getObjectByName('wall-grid-minor').geometry.attributes.position.count,major:g.getObjectByName('wall-grid-major').geometry.attributes.position.count,expectedMinor:lines.filter(l=>!l.major).length*2,expectedMajor:lines.filter(l=>l.major).length*6});});return result;});
 for(const g of geometry){assert.ok(g.parent.startsWith('booth-wall-'));assert.equal(g.minor,g.expectedMinor);assert.equal(g.major,g.expectedMajor);}
 await page.screenshot({path:path.join(__dirname,'wall-grid-desktop.png')});
 await floor.click();assert.equal((await roots()).length,4);
 const clean=await page.evaluate(async()=>{const r=threeRenderer,render=r.renderer.render.bind(r.renderer),checks=[];r.renderer.render=(scene,camera)=>{const size=r.renderer.getSize(new r.THREE.Vector2());if(Math.max(size.x,size.y)>=1536)scene.traverse(p=>{if(p.name==='booth-editing-grid'||p.name.startsWith('booth-wall-editing-grid-'))checks.push(p.visible);});return render(scene,camera);};try{await exportCleanScreenshot({download:false,minLongEdge:1536,maxLongEdge:1536,assetTimeoutMs:20000});}finally{r.renderer.render=render;}return checks;});
 assert.ok(clean.length>=4);assert.ok(clean.every(v=>!v));
 await floor.click();assert.equal((await roots()).length,3);
 await page.evaluate(()=>{window.gridDisposed=0;threeRenderer.boothGroup.traverse(p=>{if(p.name==='wall-grid-minor'||p.name==='wall-grid-major')p.geometry.addEventListener('dispose',()=>window.gridDisposed++);});});
 await wall.click();assert.deepEqual(await roots(),[]);assert.equal(await page.evaluate(()=>window.gridDisposed),6);
 for(const [type,side,expected] of [['penin','left',1],['corner','left',2],['corner','right',2],['island','left',0],['photo360','left',1]]){
  await page.evaluate(({type,side})=>{S.type=type;S.cornerSide=side;sync();},{type,side});await wall.click();assert.equal((await roots()).length,expected,type+' '+side);
  if(type==='photo360'){
   assert.equal(await page.evaluate(()=>threeRenderer.boothGroup.getObjectByName('booth-wall-editing-grid-back').parent.name),'booth-wall-back-curved');
   await page.screenshot({path:path.join(__dirname,'wall-grid-curved.png')});
  }
  await wall.click();assert.deepEqual(await roots(),[]);
 }
 await page.evaluate(()=>{S.type='inline';sync();});
 const baseline=await page.evaluate(()=>threeRenderer.renderer.info.memory.geometries);
 for(let i=0;i<5;i++){await wall.click();await wall.click();}
 assert.equal(await page.evaluate(()=>threeRenderer.renderer.info.memory.geometries),baseline);
 for(const [width,height] of [[390,844],[768,1024]]){await page.setViewportSize({width,height});await wall.click();assert.equal(await wall.getAttribute('aria-pressed'),'true');assert.equal(await floor.getAttribute('aria-pressed'),'false');await wall.click();}
 assert.deepEqual(errors,[]);console.log('PASS: independent wall/floor controls, default off, straight/left/right/curved walls, 1m/10cm geometry, clean export, disposal and stable GPU geometry count, mobile/tablet');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
