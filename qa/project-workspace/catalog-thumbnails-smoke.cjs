const {chromium}=require('C:/Users/Admin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path');
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true});try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:4173/yp-web-ai/index.html',{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.YPProjectWorkspace?.state().ready);
 await page.evaluate(()=>{YPQuickSetupBridge.close();showDockPage('catalog',document.querySelector('.dock-tool[data-dock-page="catalog"]'));});
 const manifest=JSON.parse(await fs.readFile(path.join(__dirname,'../../public/yp-web-ai/assets/catalog-thumbnails/manifest.json'),'utf8'));
 assert.equal(await page.locator('#objectCatalog .catalog-item').count(),manifest.items.length);
 assert.equal(await page.locator('#objectCatalog img').count(),manifest.items.length);
 await page.locator('#objectCatalog img').evaluateAll(async imgs=>{for(const img of imgs)img.loading='eager';await Promise.all(imgs.map(i=>i.decode()));});
 assert.equal(await page.locator('#objectCatalog img').evaluateAll(imgs=>imgs.every(i=>i.naturalWidth===320&&i.naturalHeight===240)),true);
 assert.equal((await page.locator('#catalogSection .hint').textContent()).trim(),manifest.items.length+' รายการ');
 for(const id of ['panel-oculus','screen-43','high-table-stool-set']){
  const before=await page.evaluate(()=>getBoothSpec().objects.length);
  await page.locator('[data-catalog-id="'+id+'"] .catalog-thumb').click();
  assert.equal(await page.evaluate(()=>getBoothSpec().objects.length),before+1);
  assert.equal(await page.evaluate(()=>getBoothSpec().objects.at(-1).catalogId),id);
 }
 for(const [w,h] of [[390,844],[768,1024],[1440,1000]]){
  await page.setViewportSize({width:w,height:h});await page.evaluate(()=>showDockPage('catalog',document.querySelector('.dock-tool[data-dock-page="catalog"]')));
  await page.locator('#objectCatalog').evaluate(e=>e.scrollIntoView());
  assert.equal(await page.locator('#objectCatalog').evaluate(e=>e.scrollWidth<=e.clientWidth+1),true);
  await page.screenshot({path:path.join(__dirname,'catalog-thumbnails-'+w+'.png')});
 }
 // Broken image falls back to the existing symbol; the add button remains usable.
 await page.route('**/missing-catalog-preview.webp',r=>r.fulfill({status:404,body:''}));
 await page.locator('[data-catalog-id="panel-standard"] img').evaluate(i=>{i.loading='eager';i.src='missing-catalog-preview.webp';});
 await page.waitForFunction(()=>!document.querySelector('[data-catalog-id="panel-standard"] img'));
 await page.locator('[data-catalog-id="panel-standard"]').click();
 assert.equal(await page.evaluate(()=>getBoothSpec().objects.at(-1).catalogId),'panel-standard');
 assert.deepEqual(errors,[]);
 // Contact sheet for visual review only (not shipped UI).
 const sheet=await browser.newPage({viewport:{width:1200,height:1500}});
 await sheet.goto('http://127.0.0.1:4173/yp-web-ai/assets/catalog-thumbnails/manifest.json');
 await sheet.setContent('<style>body{font:13px sans-serif;background:#f4f4f4;display:grid;grid-template-columns:repeat(5,1fr);gap:10px}figure{margin:0;background:white;padding:8px}img{width:100%}figcaption{min-height:32px}</style>'+manifest.items.map(i=>'<figure><img src="http://127.0.0.1:4173/yp-web-ai/assets/catalog-thumbnails/'+i.id+'.webp"><figcaption>'+i.name+'</figcaption></figure>').join(''));
 await sheet.locator('img').evaluateAll(imgs=>Promise.all(imgs.map(i=>i.decode())));
 await sheet.screenshot({path:path.join(__dirname,'catalog-thumbnails-contact.png'),fullPage:true});
 console.log('PASS: '+manifest.items.length+' previews decoded; add via images, fallback, mobile/tablet/desktop layout verified');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
