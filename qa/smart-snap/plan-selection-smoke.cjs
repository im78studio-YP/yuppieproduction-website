const {chromium}=require('C:/Users/Admin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-unsafe-swiftshader']});try{
 for(const viewport of [{width:1440,height:1000},{width:390,height:844}]){
 const page=await browser.newPage({viewport}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:4173/yp-web-ai/index.html',{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.YPProjectWorkspace?.state().ready);
 const ids=await page.evaluate(()=>{YPQuickSetupBridge.close();document.getElementById('projectEntryDialog')?.close();Object.assign(S,{type:'island',W:6,D:6,stSize:'none',objects:[],view:'plan'});S.objects=[makeCatalogObject('counter-standard',1.3,1.5),makeCatalogObject('counter-standard',3,1.5),makeCatalogObject('counter-standard',4.5,4.5),makeCatalogObject('counter-standard',1.3,1.5)];S.objects[1].rotationY=35;S.objects[3].visible=false;setObjectSelection([]);objectEditor.multiSelect=false;closeDockPanel(false);render();return S.objects.map(o=>o.id);});
 const original=await page.evaluate(()=>({objects:JSON.stringify(S.objects),history:objectEditor.past.length}));
 const selection=()=>page.evaluate(()=>selectedSceneItemIds());
 const rect=async targetIds=>page.evaluate(targetIds=>{const svg=document.querySelector('#view svg'),m=svg.getScreenCTM(),bounds=targetIds.map(id=>document.querySelector('[data-object-id="'+id+'"] .plan-footprint').getBBox());const x=Math.min(...bounds.map(b=>b.x))-5,y=Math.min(...bounds.map(b=>b.y))-5,right=Math.max(...bounds.map(b=>b.x+b.width))+5,bottom=Math.max(...bounds.map(b=>b.y+b.height))+5;const a=new DOMPoint(x,y).matrixTransform(m),b=new DOMPoint(right,bottom).matrixTransform(m);return{a:{x:a.x,y:a.y},b:{x:b.x,y:b.y}};},targetIds);
 const drag=async(r,reverse=false)=>{const a=reverse?r.b:r.a,b=reverse?r.a:r.b;await page.mouse.move(a.x,a.y);await page.mouse.down();await page.mouse.move(b.x,b.y,{steps:8});};
 let r=await rect(ids.slice(0,2));await drag(r);assert.equal(await page.locator('.plan-marquee').count(),1);await page.mouse.up();assert.deepEqual((await selection()).sort(),ids.slice(0,2).sort());assert.equal(await page.locator('.plan-object.selected').count(),2);assert.equal(await page.locator('.plan-marquee').count(),0);
 await page.keyboard.down('Shift');await drag(await rect([ids[2]]),true);await page.mouse.up();await page.keyboard.up('Shift');assert.equal((await selection()).length,3,'additive reverse drag');
 await drag(await rect([ids[0]]));await page.keyboard.press('Escape');await page.mouse.up();assert.equal((await selection()).length,3,'Escape preserves original selection');
 await drag(await rect([ids[0]]));await page.locator('#view').dispatchEvent('pointercancel',{pointerId:1});await page.mouse.up();assert.equal((await selection()).length,3,'cancel preserves selection');
 await drag(await rect([ids[0]]),true);await page.mouse.up();assert.deepEqual(await selection(),[ids[0]],'replace selection');
 assert.equal(await page.evaluate(()=>JSON.stringify(S.objects)),original.objects,'marquee never moves objects');assert.equal(await page.evaluate(()=>objectEditor.past.length),original.history,'selection does not add history');
 // Drag an existing multi-selection as a unit; one Undo restores its positions.
 await drag(await rect(ids.slice(0,2)));await page.mouse.up();const a=await page.locator('[data-object-id="'+ids[0]+'"] .plan-footprint').boundingBox();await page.mouse.move(a.x+a.width/2,a.y+a.height/2);await page.mouse.down();await page.mouse.move(a.x+a.width/2+12,a.y+a.height/2+12,{steps:5});await page.mouse.up();
 assert.equal(await page.evaluate(()=>objectEditor.past.length),original.history+1);await page.evaluate(()=>undoObjectChange());
 // Group expansion and hidden members: selecting one grouped member selects visible peers.
 await page.evaluate(()=>{S.objects[0].groupId=S.objects[2].groupId=S.objects[3].groupId='qa-group';setObjectSelection([]);render();});await drag(await rect([ids[0]]));await page.mouse.up();assert.deepEqual((await selection()).sort(),[ids[0],ids[2]].sort());
 await page.screenshot({path:'qa/smart-snap/plan-selection-'+(viewport.width<700?'mobile':'desktop')+'.png'});
 const empty=await rect([ids[0]]);await page.mouse.click(empty.a.x,empty.a.y);assert.equal((await selection()).length,0,'blank click clears');
 await drag({a:empty.a,b:{x:(empty.a.x+empty.b.x)/2,y:empty.b.y}});await page.mouse.up();assert.equal((await selection()).length,0,'partial overlap is not fully enclosed');
 await page.evaluate(()=>{S.view='photo';render();});assert.equal(await page.locator('.plan-marquee').count(),0);assert.equal(await page.locator('#view').evaluate(el=>el.onpointerdown===null),true,'no stale handlers outside plan');assert.deepEqual(errors,[]);console.log('PASS',viewport.width,'marquee, multi-highlight, additive/reverse, cancel/Escape, no data mutation, group move/Undo, hidden/group filtering, blank clear/partial bounds');await page.close();
 }
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
