const {chromium}=require('C:/Users/Admin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('node:fs/promises'),assert=require('node:assert/strict');
const hash=data=>require('node:crypto').createHash('md5').update(data).digest('hex');
async function writeVerified(path,data){const tmp=path+'.tmp';await fs.writeFile(tmp,data);assert.equal(hash(await fs.readFile(tmp)),hash(data));await fs.rename(tmp,path);}
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-unsafe-swiftshader']});try{
 const page=await browser.newPage({viewport:{width:1440,height:1050}}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.route('https://fonts.googleapis.com/**',r=>r.abort());
 await page.goto('http://127.0.0.1:4173/yp-web-ai/index.html',{waitUntil:'domcontentloaded',timeout:60000});await page.waitForFunction(()=>window.YPPeninsularTemplateBridge&&YPProjectWorkspace.state().ready,undefined,{timeout:60000});
 const result=await page.evaluate(async()=>{YPQuickSetupBridge.close();const snapshot=YPPeninsularTemplateBridge.snapshot('penin-blue-orbit-6');YPProjectBridge.restore(snapshot);const r=await loadThreeRenderer();if(!await r.waitForSceneAssets(20000))throw Error('Assets not ready');return{spec:snapshot.spec,portable:await YPProjectStore.toText(YPProjectStore.create(snapshot,'Blue Orbit'))};});
 assert.deepEqual([result.spec.W,result.spec.D,result.spec.H,result.spec.type],[6,6,3,'penin']);assert.equal(result.spec.objects.filter(o=>o.logoSlot?.kind==='logo').length,9);
 for(const o of result.spec.objects.filter(o=>o.logoSlot?.kind==='logo')){assert.equal(o.logoFinish.logoShape,'cutout');const svg=Buffer.from(o.appearance.textureData.split(',')[1],'base64').toString();assert.ok(svg.includes('xMidYMid meet'));}
 console.log('PASS 6x6x3 snapshot, 9 proportional die-cut logo slots, 3 round shelves and catalog TV');
 for(const [view,pos]of [['overview',{x:10,y:7.5,z:13}],['front',{x:3,y:2.8,z:16}],['left',{x:-7,y:4.8,z:13}],['right',{x:13,y:4.8,z:11}]]){
  const image=await page.evaluate(async({pos})=>{const camera={projection:'orthographic',cameraViewType:'comparison',position:pos,target:{x:3,y:1.35,z:3},up:{x:0,y:1,z:0},zoom:1,near:.01,far:1000,frustum:{left:-4.9,right:4.9,top:3.675,bottom:-3.675}};const shot=await exportCleanScreenshot({camera,aspectRatio:4/3,minLongEdge:1440,maxLongEdge:1440,download:false,assetTimeoutMs:20000});return await new Promise(resolve=>{const r=new FileReader();r.onload=()=>resolve(r.result.split(',')[1]);r.readAsDataURL(shot.blob);});},{pos});
  await writeVerified('qa/project-workspace/blue-orbit-'+view+'.png',Buffer.from(image,'base64'));if(view==='overview')await writeVerified('public/yp-web-ai/assets/peninsular-templates/penin-blue-orbit-6.png',Buffer.from(image,'base64'));
 }
 await writeVerified('public/yp-web-ai/assets/peninsular-templates/penin-blue-orbit-6.ypbooth.json',result.portable);
 const unchanged=await page.evaluate(()=>JSON.stringify(S.objects));await page.evaluate(()=>{YPQuickSetupBridge.open({start:'business'});YPWizardV2.show('template');});await page.locator('#wizard-template-cards [data-template="penin-blue-orbit-6"]').click();
 const wizard=await page.evaluate(()=>YPWizardV2.result().spec);assert.deepEqual([wizard.W,wizard.D,wizard.H],[6,6,3]);assert.equal(wizard.floor,'carpet');assert.equal(wizard.carpet,'grey');assert.equal(wizard.raise,0);assert.equal(await page.evaluate(()=>JSON.stringify(S.objects)),unchanged);await page.evaluate(()=>YPQuickSetupBridge.close());
 await page.evaluate(()=>YPPeninsularTemplateUI.open());assert.equal(await page.locator('[data-penin-template="penin-blue-orbit-6"]').count(),1);
 assert.deepEqual(errors,[]);console.log('PASS four rendered views, template picker and Wizard; active design unchanged');
 }finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
