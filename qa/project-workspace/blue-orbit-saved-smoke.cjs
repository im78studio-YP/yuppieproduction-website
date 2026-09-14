const {chromium}=require('C:/Users/Admin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('node:fs/promises'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const hash=x=>crypto.createHash('md5').update(x).digest('hex');
async function write(path,data){await fs.writeFile(path+'.tmp',data);assert.equal(hash(await fs.readFile(path+'.tmp')),hash(data));await fs.rename(path+'.tmp',path);}
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-unsafe-swiftshader']});try{
 const page=await browser.newPage({viewport:{width:1440,height:1050}}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.route('https://fonts.googleapis.com/**',r=>r.abort());
 await page.goto('http://127.0.0.1:4173/yp-web-ai/index.html',{waitUntil:'domcontentloaded',timeout:60000});await page.waitForFunction(()=>window.YPPeninsularTemplateBridge&&YPProjectWorkspace.state().ready,undefined,{timeout:60000});
 const saved=JSON.parse(await fs.readFile('D:/YP Job/2026/CoWork/00_เก่า-สำรอง/2026-09-14-blue-orbit-open-shelf/user-current.ypbooth.json','utf8')),expected=saved.variants[saved.active];
 expected.spec.objects.find(o=>o.id==='penin-blue-orbit-6-10').structure.openBack=true;expected.spec.boothTemplate.version=2;delete expected.spec.sceneSnapData;delete expected.spec.sceneAssetRegistry;
 const actual=await page.evaluate(()=>YPPeninsularTemplateBridge.snapshot('penin-blue-orbit-6'));assert.deepEqual(actual,expected);
 await page.evaluate(async()=>{YPQuickSetupBridge.close();YPProjectBridge.restore(YPPeninsularTemplateBridge.snapshot('penin-blue-orbit-6'));const r=await loadThreeRenderer();if(!await r.waitForSceneAssets(20000))throw Error('Assets not ready');});
 for(const [name,pos,target,span] of [['overview',{x:11,y:7,z:14},{x:3,y:1.5,z:3},4.9],['shelf',{x:11,y:2.8,z:3.4},{x:5.86,y:1.2,z:.99},1.65]]){
 const data=await page.evaluate(async({pos,target,span})=>{const shot=await exportCleanScreenshot({camera:{projection:'orthographic',cameraViewType:'comparison',position:pos,target,up:{x:0,y:1,z:0},zoom:1,near:.01,far:1000,frustum:{left:-span,right:span,top:span*.75,bottom:-span*.75}},aspectRatio:4/3,minLongEdge:1440,maxLongEdge:1440,download:false,assetTimeoutMs:20000});return await new Promise(resolve=>{const r=new FileReader();r.onload=()=>resolve(r.result.split(',')[1]);r.readAsDataURL(shot.blob);});},{pos,target,span});
 await write('qa/project-workspace/blue-orbit-saved-'+name+'.png',Buffer.from(data,'base64'));if(name==='overview')await write('public/yp-web-ai/assets/peninsular-templates/penin-blue-orbit-6.png',Buffer.from(data,'base64'));
 }
 assert.deepEqual(errors,[]);console.log('PASS exact saved layout including all graphics/theme; render and thumbnail; no page errors');
 }finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
