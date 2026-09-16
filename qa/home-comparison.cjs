const { chromium } = require('C:/Users/Admin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert = require('node:assert/strict');
const base='http://127.0.0.1:4173';
const fixture=`<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/src/index.css"></head><body><div id="root" style="max-width:900px;margin:20px auto"></div><script type="module">
import RefreshRuntime from '/@react-refresh';RefreshRuntime.injectIntoGlobalHook(window);window.$RefreshReg$=()=>{};window.$RefreshSig$=()=>type=>type;window.__vite_plugin_react_preamble_installed__=true;
const {default:Compare}=await import('/src/components/BeforeAfterCompare.tsx');
import React from '/node_modules/.vite/deps/react.js';import ReactDOM from '/node_modules/.vite/deps/react-dom_client.js';
const root=ReactDOM.createRoot(document.getElementById('root'));window.scene={position:{x:1,y:2,z:3},camera:{x:4,y:5,z:6}};
window.mountCompare=(props)=>root.render(React.createElement(Compare,{...props,key:JSON.stringify(props)}));
window.mountCompare({beforeImage:'/images/booth-comparison/peninsular-before.png',afterImage:'/images/booth-comparison/peninsular-after.png',illustrative:true});</script></body></html>`;
async function ready(page){await page.locator('[role=slider]').waitFor();await page.waitForFunction(()=>document.querySelector('[role=slider]').getAttribute('aria-disabled')==='false');}
async function pairReady(page){await page.locator('.booth-comparison-card img').first().waitFor();await page.locator('.booth-comparison-card img').evaluateAll(imgs=>Promise.all(imgs.map(i=>i.decode())));}
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true});try{
 const context=await browser.newContext({viewport:{width:1440,height:1050}}),page=await context.newPage(),errors=[];
 page.on('pageerror',e=>{errors.push(e.message);console.error('Browser error:',e.message);});await context.route('https://**/*',r=>r.abort());
 // Actual homepage integration, menu and section ordering.
 await page.goto(base,{waitUntil:'domcontentloaded',timeout:60000});const close=page.getByRole('button',{name:/ปิด/});await page.waitForTimeout(900);if(await close.count())await close.first().click();
 const showcase=page.locator('#booth-online');await showcase.scrollIntoViewIfNeeded();await pairReady(page);
 assert.equal(await page.locator('.nav-design').getAttribute('href'),'/yp-web-ai/');
 assert.equal(await page.locator('#booth-online + #about').count(),1);
 const cards=page.locator('.booth-comparison-card'),imgs=cards.locator('img');
 assert.equal(await imgs.nth(0).getAttribute('src'),'/images/booth-comparison/peninsular-before-v4.png');
 assert.equal(await imgs.nth(1).getAttribute('src'),'/images/booth-comparison/peninsular-after-v4.png');
 assert.deepEqual(await imgs.evaluateAll(items=>items.map(i=>[i.naturalWidth,i.naturalHeight])),[[1448,1086],[1448,1086]]);
 assert.match(await cards.nth(0).innerText(),/BEFORE.*ภาพเรนเดอร์เบื้องต้น/s);assert.match(await cards.nth(1).innerText(),/AFTER/);
 assert.equal(await showcase.getByRole('slider').count(),0);assert.equal(await showcase.locator('.ba-modes').count(),0);
 const left=await cards.nth(0).boundingBox(),right=await cards.nth(1).boundingBox();assert.ok(right.x>=left.x+left.width);assert.equal(left.y,right.y);
 assert.deepEqual(await imgs.evaluateAll(items=>items.map(i=>getComputedStyle(i).objectFit)),['contain','contain']);
 const popupPromise=page.waitForEvent('popup');await cards.nth(0).locator('a').click();const full=await popupPromise;await full.waitForLoadState('domcontentloaded');assert.ok(full.url().endsWith('/peninsular-before-v4.png'));await full.close();
 await showcase.screenshot({path:'qa/home-comparison-desktop.png'});
 await page.getByRole('button',{name:'02 Island',exact:true}).click();await pairReady(page);assert.match(await imgs.nth(0).getAttribute('src'),/island-before/);assert.match(await cards.nth(0).innerText(),/แบบ 3D/);assert.equal(await showcase.getByRole('slider').count(),0);
 const zoom=await imgs.nth(0).evaluate(i=>{const m=new DOMMatrix(getComputedStyle(i).transform);return [m.a,m.d];});assert.deepEqual(zoom,[1.35,1.35]);assert.equal(await imgs.nth(1).evaluate(i=>getComputedStyle(i).transform),'none');
 await page.locator('.booth-comparison-pair').screenshot({path:'qa/island-comparison-framing-desktop.png'});
 await page.setViewportSize({width:390,height:844});await page.locator('.booth-comparison-pair').screenshot({path:'qa/island-comparison-framing-mobile.png'});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth));await page.setViewportSize({width:1440,height:1050});
 await page.getByRole('button',{name:'01 Peninsular',exact:true}).click();await pairReady(page);assert.equal(await imgs.nth(0).evaluate(i=>getComputedStyle(i).transform),'none');
 // Isolated reusable widget, real pointer capture + keyboard and no scene/network effects.
 await page.route('**/__compare-test',r=>r.fulfill({contentType:'text/html',body:fixture}));await page.goto(base+'/__compare-test');await ready(page);
 const slider=page.getByRole('slider'),box=await slider.boundingBox(),scene=await page.evaluate(()=>JSON.stringify(window.scene));
 const requests=[];const listen=r=>requests.push(r.url());page.on('request',listen);
 await page.mouse.move(box.x+box.width*.5,box.y+box.height*.5);await page.mouse.down();await page.mouse.move(box.x+box.width*.8,box.y+box.height*.5,{steps:12});
 assert.ok(Number(await slider.getAttribute('aria-valuenow'))>=79);await page.mouse.move(box.x+box.width+100,box.y+20);assert.equal(await slider.getAttribute('aria-valuenow'),'100');await page.mouse.move(box.x-100,box.y+20);assert.equal(await slider.getAttribute('aria-valuenow'),'0');await page.mouse.up();
 await slider.focus();await page.keyboard.press('ArrowRight');assert.equal(await slider.getAttribute('aria-valuenow'),'5');await page.keyboard.press('End');assert.equal(await slider.getAttribute('aria-valuenow'),'100');await page.keyboard.press('Home');assert.equal(await slider.getAttribute('aria-valuenow'),'0');
 await page.getByRole('button',{name:'ภาพเรนเดอร์ AI',exact:true}).click();assert.equal(await slider.count(),0);assert.equal(await page.locator('.ba-stage').evaluate(e=>e.style.getPropertyValue('--compare-position')),'0%');
 await page.getByRole('button',{name:'แบบ 3D',exact:true}).click();assert.equal(await page.locator('.ba-stage').evaluate(e=>e.style.getPropertyValue('--compare-position')),'100%');
 await page.getByRole('button',{name:'เปรียบเทียบ',exact:true}).click();assert.equal(await page.evaluate(()=>JSON.stringify(window.scene)),scene);assert.deepEqual(requests,[]);page.off('request',listen);
 const ref={renderPackageId:'render-1',stateHash:'hash-1',cameraSnapshotId:'camera-1',sceneRevision:4};
 async function mount(extra){await page.evaluate(extra=>window.mountCompare({beforeImage:'/images/booth-comparison/peninsular-before.png',afterImage:'/images/booth-comparison/peninsular-after.png',...extra}),extra);await page.waitForTimeout(120);}
 await mount({beforeReference:ref,afterReference:ref});await ready(page);
 for(const mismatch of [{renderPackageId:'render-2'},{stateHash:'hash-2'},{cameraSnapshotId:'camera-2'},{sceneRevision:5}]){await mount({beforeReference:ref,afterReference:{...ref,...mismatch}});assert.ok(await page.getByRole('button',{name:'เปรียบเทียบ',exact:true}).isDisabled());assert.equal(await slider.count(),0);assert.equal(await page.locator('.ba-stage').evaluate(e=>e.style.getPropertyValue('--compare-position')),'0%');}
 await mount({});assert.ok(await page.getByRole('button',{name:'เปรียบเทียบ',exact:true}).isDisabled());
 await mount({beforeImage:undefined,illustrative:true});assert.equal(await page.locator('.ba-image').count(),1);assert.equal(await slider.count(),0);
 await mount({beforeImage:undefined,afterImage:undefined});assert.equal(await page.locator('.ba-empty').count(),1);
 await page.route('**/broken-example.png',r=>r.fulfill({status:404,body:''}));await mount({beforeImage:'/broken-example.png',illustrative:true});await page.waitForFunction(()=>document.querySelector('.ba-hint').textContent.includes('ไม่สำเร็จ'));assert.equal(await slider.count(),0);
 // Mobile touch uses a real browser touch sequence, not synthetic React callbacks.
 const mobile=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:1});await mobile.route('https://**/*',r=>r.abort());const m=await mobile.newPage();await m.route('**/__compare-test',r=>r.fulfill({contentType:'text/html',body:fixture}));await m.goto(base+'/__compare-test');await ready(m);
 const mb=await m.getByRole('slider').boundingBox(),cdp=await mobile.newCDPSession(m),y=mb.y+mb.height/2;
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:mb.x+mb.width*.5,y}]});for(const ratio of [.55,.6,.7,.8])await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:mb.x+mb.width*ratio,y}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});assert.ok(Number(await m.getByRole('slider').getAttribute('aria-valuenow'))>=79);
 await m.goto(base,{waitUntil:'domcontentloaded',timeout:60000});await m.waitForTimeout(900);const mc=m.getByRole('button',{name:/ปิด/});if(await mc.count())await mc.first().click();await m.locator('#booth-online').scrollIntoViewIfNeeded();await pairReady(m);
 for(const width of [320,390,768,1024]){await m.setViewportSize({width,height:844});assert.ok(await m.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth));const n=await m.locator('.nav-design').boundingBox();assert.ok(n.x>=0&&n.x+n.width<=width&&n.height>=44);}
 await m.setViewportSize({width:390,height:844});await m.locator('#booth-online').scrollIntoViewIfNeeded();const mobileCards=m.locator('.booth-comparison-card');const top=await mobileCards.nth(0).boundingBox(),bottom=await mobileCards.nth(1).boundingBox();assert.ok(bottom.y>=top.y+top.height);assert.equal(top.x,bottom.x);assert.equal(await m.locator('#booth-online [role=slider]').count(),0);await m.locator('#booth-online').screenshot({path:'qa/home-comparison-mobile.png'});await mobile.close();
 assert.deepEqual(errors,[]);console.log('PASS side-by-side homepage, before-left/after-right, full-size image link, mobile stacked order, both pairs, no homepage slider; legacy widget regression checks and responsive navigation');
 }finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
