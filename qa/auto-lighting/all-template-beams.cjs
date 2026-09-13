const {chromium}=require('C:/Users/Admin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-unsafe-swiftshader']});
 try{
  const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:4173/yp-web-ai/index.html',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.YPBoothBeams&&window.YPInlineTemplateBridge&&YPProjectWorkspace.state().ready);
  await page.evaluate(()=>YPQuickSetupBridge.close());
  const entries=await page.evaluate(()=>['Inline','Corner','Peninsular','Island'].flatMap(type=>window['YP'+type+'Templates'].templates.map(t=>({type,id:t.id}))));
  for(const entry of entries.filter(e=>!process.argv[2]||e.id.includes(process.argv[2]))){
   const result=await page.evaluate(async({type,id})=>{
    YPProjectBridge.restore(window['YP'+type+'TemplateBridge'].snapshot(id));const r=await loadThreeRenderer();await r.waitForSceneAssets(20000);setBoothLighting({enabled:true,tone:'warm'});
    return {layout:r.boothGroup.userData.beamLayout,objects:S.objects.length};
   },entry);
   assert.ok(result.layout.length>0,entry.id+' missing beams');
   assert.ok(result.layout.every(b=>[...b.source,...b.target].every(Number.isFinite)),entry.id+' invalid beam');
   console.log('PASS',entry.type,entry.id,result.layout.length,'beams');
  }
  assert.deepEqual(errors,[]);console.log('PASS template audit',process.argv[2]||entries.length+' templates');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
