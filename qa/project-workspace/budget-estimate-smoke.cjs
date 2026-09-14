const {chromium}=require('C:/Users/Admin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-unsafe-swiftshader']});try{for(const mobile of [false,true]){
 const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1440,height:1000},isMobile:mobile,hasTouch:mobile}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:4173/yp-web-ai/index.html');await page.waitForFunction(()=>window.YPHandoffUI&&YPProjectWorkspace.state().ready);await page.evaluate(()=>YPQuickSetupBridge.close());
 assert.equal(await page.locator('#budgetToggle').textContent(),'ดูงบประมาณ');assert.equal(await page.locator('#price').isVisible(),false);
 const original=await page.evaluate(()=>({total:priceTotal(),spec:serializeBoothSpec()}));await page.locator('#budgetToggle').click();assert.equal(await page.locator('#price').textContent(),await page.evaluate(()=>YPBudgetEstimate.format(priceTotal())));assert.equal(await page.evaluate(()=>priceTotal()),original.total);
 await page.evaluate(()=>{S.W=7;syncDims();sync();});assert.equal(await page.locator('#price').textContent(),await page.evaluate(()=>YPBudgetEstimate.format(priceTotal())));
 await page.evaluate(()=>{const tv=makeCatalogObject(YPTVAsset.id,1,1);mutateObjects(()=>S.objects.push(tv),tv.id);});assert.equal(await page.locator('#budgetPanel .budget-warning').isVisible(),true);
 await page.screenshot({path:`qa/project-workspace/budget-${mobile?'mobile':'desktop'}.png`});
 const panel=await page.locator('#budgetPanel').boundingBox();assert.ok(panel.x>=0&&panel.x+panel.width<=(mobile?390:1440));
 await page.locator('#budgetClose').click();assert.equal(await page.locator('#price').isVisible(),false);assert.equal(await page.locator('#price').textContent(),'');
 await page.evaluate(()=>sendQuote());assert.equal(await page.locator('.handoff-dialog .budget-summary').isVisible(),true);assert.equal(await page.locator('.handoff-dialog .budget-summary strong').textContent(),await page.evaluate(()=>YPBudgetEstimate.format(priceTotal())));await page.locator('#handoffClose').click();
 await page.reload();await page.waitForFunction(()=>window.YPBudgetEstimate);assert.equal(await page.locator('#price').isVisible(),false);assert.deepEqual(errors,[]);console.log('PASS '+(mobile?'mobile':'desktop')+' hidden default, range, live updates, unknown-price warning, handoff review, reload reset');await context.close();
 }}finally{await browser.close();}})().catch(error=>{console.error(error);process.exitCode=1;});
