const {chromium}=require('C:/Users/Admin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');const assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-unsafe-swiftshader']});try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:4173/yp-web-ai/index.html',{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.YPKeyboardShortcuts&&YPProjectWorkspace.state().ready,null,{timeout:60000});
 await page.evaluate(()=>YPQuickSetupBridge.close());
 const id=await page.evaluate(()=>{const o=makeCatalogObject('counter-corner-round',2,2);mutateObjects(()=>S.objects.push(o),o.id);document.activeElement?.blur();return o.id;});
 const exists=()=>page.evaluate(id=>!!objectById(id),id);
 await page.keyboard.press('Control+z');assert.equal(await exists(),false);await page.keyboard.press('Control+Shift+z');assert.equal(await exists(),true);
 // Actual Thai key value with the physical Z/Y/S codes.
 const thai=async(key,code,extra={})=>page.evaluate(({key,code,extra})=>(document.activeElement||document.body).dispatchEvent(new KeyboardEvent('keydown',{key,code,ctrlKey:true,bubbles:true,cancelable:true,...extra})),{key,code,extra});
 await thai('ผ','KeyZ');assert.equal(await exists(),false);await thai('ั','KeyY');assert.equal(await exists(),true);
 await page.evaluate(id=>selectObject(id),id);await page.keyboard.press('Delete');assert.equal(await exists(),false);await page.keyboard.press('Control+z');assert.equal(await exists(),true);
 await page.evaluate(id=>{selectObject(id);objectById(id).locked=true;sync();},id);await page.keyboard.press('Delete');assert.equal(await exists(),true);await page.evaluate(id=>{objectById(id).locked=false;sync();},id);
 const history=await page.evaluate(()=>objectSnapshot());
 await page.locator('#projectName').fill('ชื่อทดลอง');await page.keyboard.press('Control+z');await page.keyboard.press('Delete');await page.keyboard.press('Escape');assert.equal(await page.evaluate(()=>objectSnapshot()),history);assert.equal(await page.evaluate(()=>objectEditor.selectedId),id);
 await page.evaluate(()=>{const text=document.createElement('div');text.id='qaEditable';text.contentEditable='true';text.textContent='ข้อความ';document.body.append(text);text.focus();});
 await page.keyboard.press('Delete');await thai('ผ','KeyZ');assert.equal(await page.evaluate(()=>objectSnapshot()),history);
 await page.evaluate(()=>document.getElementById('qaEditable').remove());
 await thai('ผ','KeyZ',{isComposing:true});await thai('ผ','KeyZ',{repeat:true});assert.equal(await page.evaluate(()=>objectSnapshot()),history);
 await page.locator('#keyboardShortcutsOpen').click();assert.ok(await page.locator('#keyboardShortcutsDialog').evaluate(d=>d.open));await page.keyboard.press('Delete');await thai('ผ','KeyZ');assert.equal(await page.evaluate(()=>objectSnapshot()),history);
 await page.screenshot({path:'qa/project-workspace/keyboard-shortcuts-desktop.png'});
 await page.setViewportSize({width:390,height:844});assert.ok(await page.locator('#keyboardShortcutsDialog').evaluate(d=>d.scrollWidth<=d.clientWidth+1));await page.screenshot({path:'qa/project-workspace/keyboard-shortcuts-390.png'});
 await page.keyboard.press('Escape');assert.equal(await page.locator('#keyboardShortcutsDialog').evaluate(d=>d.open),false);assert.equal(await page.evaluate(()=>document.activeElement.id),'keyboardShortcutsOpen');assert.equal(await exists(),true);
 await page.keyboard.press('F1');assert.ok(await page.locator('#keyboardShortcutsDialog').evaluate(d=>d.open));await page.locator('#keyboardShortcutsClose').click();
 await page.evaluate(()=>openAssetSettings());const snapshot=await page.evaluate(()=>objectSnapshot());await page.locator('#mAssetSettings button').first().focus();await thai('ผ','KeyZ');await page.keyboard.press('Delete');assert.equal(await page.evaluate(()=>objectSnapshot()),snapshot);await page.evaluate(()=>{closeAssetSettings();document.activeElement?.blur();});
 let saves=0;page.on('download',()=>saves++);const downloading=page.waitForEvent('download');await thai('ห','KeyS');const download=await downloading;assert.ok(download.suggestedFilename().endsWith('.json'));assert.equal(saves,1);
 assert.ok(await page.locator('#btnUndoObject').getAttribute('aria-keyshortcuts'));assert.match(await page.locator('#projectSave').getAttribute('title'),/Ctrl\+S|Cmd\+S/);
 assert.deepEqual(errors,[]);console.log('PASS English/Thai Undo, Redo, Delete, locked object, inputs/contenteditable/IME/repeat guards, modal safety, F1/Esc focus, mobile, single Save download and tooltips');
}finally{await browser.close();}})().catch(e=>{console.error(e.name,e.stack.split('\n').filter(l=>l.trim().startsWith('at ')).join('\n'));process.exitCode=1;});
