const {chromium}=require('C:/Users/Admin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('node:fs/promises');
const output='qa/project-workspace/responsive-audit';
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});
 try{
  await fs.mkdir(output,{recursive:true});
  const page=await browser.newPage({viewport:{width:390,height:844},hasTouch:true}),errors=[],results=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:4173/yp-web-ai/index.html');
  await page.waitForFunction(()=>window.YPProjectWorkspace?.state().ready&&window.YPPresentationBoardUI);
  await page.locator('#releaseStart').click();await page.locator('#quickBusinessNext').click();await page.locator('#quickBoothTypes [data-value=penin]').click();
  async function capture(size,state){
   await page.waitForTimeout(350);
   await page.screenshot({path:output+'/'+size+'-'+state+'.png',animations:'disabled'});
   const result=await page.evaluate(()=>{
    const visible=e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);return r.width>0&&r.height>0&&s.visibility!=='hidden'&&s.display!=='none'&&!e.closest('[hidden],[aria-hidden="true"]')&&r.bottom>0&&r.top<innerHeight;};
    const info=e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);return {id:e.id||e.className,text:(e.getAttribute('aria-label')||e.textContent||'').trim().slice(0,65),x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),h:Math.round(r.height),font:s.fontSize};};
    const controls=[...document.querySelectorAll('button,input,select,[role="radio"]')].filter(visible);
    return {viewport:[innerWidth,innerHeight],documentWidth:document.documentElement.scrollWidth,
     panels:['dockPanel','view','objectToolbar','promptImagePanel','promptBoardPanel'].map(id=>document.getElementById(id)).filter(e=>e&&visible(e)).map(info),
     clipped:controls.filter(e=>{const r=e.getBoundingClientRect();return r.left<0||r.right>innerWidth+1||r.top<0||r.bottom>innerHeight;}).map(info),
     smallTargets:controls.filter(e=>{const r=e.getBoundingClientRect();return r.width<36||r.height<36;}).map(info),
     overflowing:[...document.querySelectorAll('.prompt-card,.tool-page-body,.quick-step-scroll,.inline-template-dialog,#objectToolbar')].filter(visible).filter(e=>e.scrollWidth>e.clientWidth+2).map(e=>({...info(e),scrollWidth:e.scrollWidth,clientWidth:e.clientWidth}))};
   });
   results.push({size,state,...result});
   await fs.writeFile(output+'/results.json',JSON.stringify({errors,results},null,2));
  }
  const sizes=[[360,800],[390,844],[844,390],[768,1024],[1024,768],[820,1180]];
  for(const [w,h] of sizes){await page.setViewportSize({width:w,height:h});await capture(w+'x'+h,'wizard');}
  await page.evaluate(async()=>{YPQuickSetupBridge.close();YPProjectBridge.restore(YPPeninsularTemplateBridge.snapshot('penin-golden-oculus'));const r=await loadThreeRenderer();await r.waitForSceneAssets(20000);});
  for(const [w,h] of sizes){
   const size=w+'x'+h;await page.setViewportSize({width:w,height:h});
   for(const mode of ['business','booth','prompt']){
    await page.evaluate(mode=>showDockPage(mode,document.querySelector('.dock-tool[data-dock-page="'+mode+'"]')),mode);
    if(mode==='prompt')await page.locator('#promptImageTab').click();
    await capture(size,mode);
   }
   await page.locator('#promptBoardTab').click();await capture(size,'board');
   await page.locator('#promptBoard').scrollIntoViewIfNeeded();await capture(size,'board-actions');
   await page.evaluate(()=>YPPeninsularTemplateUI.open());await capture(size,'templates');await page.locator('#peninsularTemplatesClose').click();
   try{await page.locator('#dockClose').click({timeout:1500});}
   catch(error){results.push({size,state:'close-panel',actionError:error.message});await page.locator('#dockClose').evaluate(b=>b.click());}
   await page.evaluate(()=>{const o=getBoothSpec().objects.find(o=>o.type==='counter');setObjectSelection([o?.id||getBoothSpec().objects[0].id]);syncObjectControls();});
   await capture(size,'editor');
   console.log('AUDITED',size);
  }
  await fs.writeFile(output+'/results.json',JSON.stringify({errors,results},null,2));
  console.log(JSON.stringify(results.map(r=>({size:r.size,state:r.state,overflow:r.overflowing,clipped:r.clipped?.length,small:r.smallTargets?.length,actionError:r.actionError?.slice(0,100)})),null,2));
  console.log('PAGE ERRORS',errors);
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
