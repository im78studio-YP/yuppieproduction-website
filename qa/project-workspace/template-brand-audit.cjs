const {chromium}=require('C:/Users/Admin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('node:fs/promises'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const base='http://127.0.0.1:4173/yp-web-ai/';
async function writeAsset(path,data){const bytes=Buffer.isBuffer(data)?data:Buffer.from(data),tmp=path+'.tmp',hash=b=>crypto.createHash('md5').update(b).digest('hex');await fs.writeFile(tmp,bytes);assert.equal(hash(await fs.readFile(tmp)),hash(bytes));await fs.rename(tmp,path);}
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-unsafe-swiftshader']});try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base+'index.html?comparePreview=1');await page.waitForFunction(()=>window.YPIslandTemplateBridge);
 const groups=await page.evaluate(()=>[['inline',YPInlineTemplates],['corner',YPCornerTemplates],['peninsular',YPPeninsularTemplates],['island',YPIslandTemplates]].map(([group,l])=>({group,templates:l.templates.map(t=>({id:t.id,name:t.name}))})));
 assert.equal(groups.reduce((n,g)=>n+g.templates.length,0),33);
 const report=[];
 for(const group of groups)for(const t of group.templates)for(const side of group.group==='corner'?['right','left']:['']){
  const selection=process.argv.slice(2);if(selection.length&&!selection.includes(t.id+(side?'-'+side:'')))continue;
  const result=await page.evaluate(async ({group,id,side})=>{
   await YPProjectBridge.ready;YPQuickSetupBridge.close();const names={inline:'Inline',corner:'Corner',peninsular:'Peninsular',island:'Island'},prefix=names[group],bridge=window['YP'+prefix+'TemplateBridge'],library=window['YP'+prefix+'Templates'];
   const t=library.templates.find(t=>t.id===id),snapshot=bridge.snapshot(id,{cornerSide:side||'right'}),before=JSON.stringify(t);
   if(snapshot.spec.logo!==YPDefaultLogo.data||snapshot.spec.brand!==YPDefaultLogo.brand)throw Error('Wrong brand '+id);
   let logos=0,details=0;
   for(let i=0;i<t.objects.length;i++){
    const o=snapshot.spec.objects[i],part=t.objects[i];if(part.brandLogo||part.graphic?.startsWith('six-')||part.graphic?.startsWith('beauty-')||['header','poster','counter','screen','blue-info','light-rings','blue-rings','blush-beauty'].includes(part.graphic)){
     if(!o.appearance.textureId.startsWith(YPTemplateBranding.revision))throw Error('Unbranded '+o.id);
     const svg=atob(o.appearance.textureData.split(',')[1]);if(!svg.includes('xMidYMid meet')||/<text[\s>]/.test(svg))throw Error('Distorted/text logo '+o.id);
     const image=new Image();image.src=o.appearance.textureData;await image.decode();logos++;
    }
    if(o.structure?.design)details++;
   }
   if(before!==JSON.stringify(t))throw Error('Library mutation');
   const serialized=await YPProjectStore.toText(YPProjectStore.create(snapshot,id));YPProjectStore.fromText(serialized);YPProjectBridge.restore(snapshot);
   const renderer=await loadThreeRenderer();for(const o of snapshot.spec.objects.filter(o=>o.structure?.design)){const box=new renderer.THREE.Box3().setFromObject(renderer.buildCatalogObject(o));if(box.isEmpty()||![...box.min.toArray(),...box.max.toArray()].every(Number.isFinite))throw Error('Geometry '+o.id);}
   const deep=snapshot.spec.D>3.5,black=id.includes('noir-mobile'),yellow=id==='island-yellow-frame',h=snapshot.spec.H,span=deep?4.9:4.2;
   const camera={projection:'orthographic',cameraViewType:'comparison',position:{x:yellow?-.8:deep?-4:side==='left'?-3:9,y:yellow?6.4:black?4.5:deep?10:7,z:deep?13:11},target:{x:3,y:h*.44,z:snapshot.spec.D*.45},up:{x:0,y:1,z:0},zoom:1,near:.01,far:1000,frustum:{left:-span,right:span,top:span*.75,bottom:-span*.75}};
   if(id==='corner-luminous-beauty'){camera.position={x:side==='left'?-2:8,y:4.2,z:12};camera.target.y=1.55;}
   const capture=await exportCleanScreenshot({camera,aspectRatio:4/3,minLongEdge:1280,maxLongEdge:1280,download:false,assetTimeoutMs:20000});const png=await new Promise(resolve=>{const r=new FileReader();r.onload=()=>resolve(r.result.split(',')[1]);r.readAsDataURL(capture.blob);});
   // Restoring a customer-authored logo is deliberately NOT a template migration.
   const custom=structuredClone(snapshot);custom.spec.brand='Customer retained';YPProjectBridge.restore(custom);if(YPProjectBridge.capture().spec.brand!=='Customer retained')throw Error('Customer brand overwritten');
   return {png,serialized,logos,details,objects:snapshot.spec.objects.length};
  },{group:group.group,id:t.id,side});
  const stem=t.id+(side?'-'+side:''),folder='public/yp-web-ai/assets/'+group.group+'-templates/';
  await writeAsset(folder+stem+'.png',Buffer.from(result.png,'base64'));await writeAsset(folder+stem+'.ypbooth.json',result.serialized);
  report.push({group:group.group,id:t.id,side,logos:result.logos,details:result.details,objects:result.objects});console.log('PASS',stem,'logos='+result.logos,'detail='+result.details);
 }
 assert.deepEqual(errors,[]);
 for(const group of groups){const contact=await browser.newPage({viewport:{width:1400,height:Math.ceil(group.templates.length/4)*270+80}});
  await contact.goto(base+'assets/'+group.group+'-templates/overview.html');
  await contact.setContent('<style>body{background:#20232a;color:white;font:16px Arial}main{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}img{width:100%}h1{font-size:20px}p{margin:4px}</style><h1>'+group.group+' — Yuppie branding audit</h1><main>'+group.templates.map(t=>'<article><img src="'+base+'assets/'+group.group+'-templates/'+t.id+(group.group==='corner'?'-right':'')+'.png"><p>'+t.name+'</p></article>').join('')+'</main>');await contact.locator('img').evaluateAll(imgs=>Promise.all(imgs.map(i=>i.decode())));await contact.screenshot({path:'qa/project-workspace/template-audit-'+group.group+'.png',fullPage:true});await contact.close();
 }
 const path='qa/project-workspace/template-brand-audit-results.json',key=r=>r.id+'-'+r.side,previous=process.argv.length>2?JSON.parse(await fs.readFile(path,'utf8')):[];
 await writeAsset(path,JSON.stringify(previous.filter(r=>!report.some(n=>key(n)===key(r))).concat(report),null,2));console.log('PASS: '+report.length+' orientations, vectors, serialization, restore and unchanged customer brands');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
