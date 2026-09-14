import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import '../../public/yp-web-ai/js/tv-asset.js';
import '../../public/yp-web-ai/js/template-tv-groups.js';
import '../../public/yp-web-ai/js/inline-templates.js';
import '../../public/yp-web-ai/js/inline-soft-wave.js';
import '../../public/yp-web-ai/js/peninsular-six-templates.js';
import '../../public/yp-web-ai/js/peninsular-botanical.js';
import '../../public/yp-web-ai/js/peninsular-templates.js';
import '../../public/yp-web-ai/js/corner-templates.js';
import '../../public/yp-web-ai/js/island-templates.js';
const api=globalThis.YPTVAsset,base=new URL('../../public/yp-web-ai/',import.meta.url);
const html=await readFile(new URL('index.html',base),'utf8');
const catalog=Function('furnitureItem','return '+html.match(/const OBJECT_CATALOG=(\[[\s\S]*?\]);/)[1])(x=>x);
const initial={wallStickers:{back:{}},objects:[],sceneItemState:{}};
for(const library of [YPInlineTemplates,YPPeninsularTemplates,YPCornerTemplates,YPIslandTemplates])for(const t of library.templates)test(t.id+' TV conversion preserves non-TV objects and transforms',()=>{
 const s=library.build(t.id,initial,catalog).spec,before=structuredClone(s),source=JSON.stringify(t);
 api.template(s,t);assert.equal(JSON.stringify(t),source);
 for(const o of s.objects){const old=before.objects.find(x=>x.id===o.id);assert.ok(old);if(o.catalogId!==api.id){assert.deepEqual(o,old);continue;}
  assert.deepEqual(o.position,old.position);assert.deepEqual(o.size,old.size);assert.equal(o.rotationY,old.rotationY);assert.equal(o.geometryMode,'model');assert.deepEqual(o.appearance,{mode:'original'});assert.equal(o.groupId,undefined);assert.equal(o.logoSlot,undefined);
 }
 assert.equal(new Set(s.objects.map(o=>o.id)).size,s.objects.length);
});
test('only supplied GLB promotes; unrelated equal-size file is untouched',async()=>{
 const file=new Blob([await readFile(new URL('assets/furniture/tv-samsung-40/model.glb',base))]);
 const record={id:'my-asset-original',name:'arbitrary name',file};await api.recognize(record);assert.equal(record.catalogPromotion,api.id);assert.equal(record.file,file);
 const unrelated={name:'SamsungLED-TV40',file:new Blob([new Uint8Array(file.size)])};await api.recognize(unrelated);assert.equal(unrelated.catalogPromotion,undefined);
});
test('screen source and model are exact user-provided binary files',async()=>{
 assert.equal(createHash('sha256').update(await readFile(new URL('assets/furniture/tv-samsung-40/screen.jpg',base))).digest('hex'),'7fa553733c1109c6439a0b4180718340df9822ec3f480001eb670b22d7dd6caa');
});
test('all template snapshot UIs convert after authored artwork and before validation',async()=>{
 for(const name of ['inline','corner','peninsular','island']){const js=await readFile(new URL('js/'+name+'-template-ui.js',base),'utf8');assert.ok(js.indexOf('YPTVAsset.template')>js.indexOf('YPTemplateBranding.apply'));assert.ok(js.indexOf('YPTVAsset.template')<js.indexOf('YPProjectStore.validateSpec'));}
});
