import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import crypto from 'node:crypto';
import '../../public/yp-web-ai/assets/branding/photo360-artwork.js';
import '../../public/yp-web-ai/js/photo360-templates.js';
const lib=globalThis.YPPhoto360Templates,art=globalThis.YPPhoto360Artwork;
test('template uses the exact approved BD_01 source bytes',()=>{
 const source=fs.readFileSync('../AW/BD_01.png'),packaged=Buffer.from(art.data.split(',')[1],'base64');
 assert.deepEqual(packaged,source);assert.equal(art.sourceMD5,crypto.createHash('md5').update(source).digest('hex'));assert.equal(art.name,'BD_01.png');
});
test('360 template has fixed size, full arc sticker, black backing and platform type',()=>{
 assert.equal(lib.templates.length,1);const s=lib.build('photo360-circle-stage',{}).spec;
 assert.deepEqual([s.type,s.W,s.D,s.H,s.wallRadius],['photo360',6,3,2.4,3.5]);
 assert.deepEqual([s.floor,s.carpet,s.raise],['carpet','grey',0]);assert.equal(s.wallPaintOverrides.back,'#111111');
 assert.equal(s.wallStickers.back.w,7*Math.asin(6/7));assert.equal(s.wallStickers.back.data,art.data);assert.equal(s.wallStickers.back.h,2.4);
 assert.equal(s.logoScale,0);assert.equal(s.nameScale,0);assert.deepEqual(s.objects,[]);assert.equal(s.lights,true);
});
test('build is detached and clears customer equipment/graphics without mutation',()=>{
 const input={objects:[{id:'customer'}],sceneItemState:{'equipment.platform.photo360':{visible:false}},wallStickers:{left:{data:'customer'}},floorStickerData:'customer'};
 const before=structuredClone(input),out=lib.build('photo360-circle-stage',input);
 assert.deepEqual(input,before);assert.deepEqual(out.spec.sceneItemState,{});assert.equal(out.spec.wallStickers.left,undefined);assert.equal(out.spec.floorStickerData,null);
 assert.throws(()=>lib.build('missing',input),/ไม่พบ/);
});
test('all template selection entry points include Photo360 and require normal workspace confirmation',()=>{
 const html=fs.readFileSync('public/yp-web-ai/index.html','utf8'),wizard=fs.readFileSync('public/yp-web-ai/js/wizard-v2.js','utf8'),ui=fs.readFileSync('public/yp-web-ai/js/photo360-template-ui.js','utf8'),entry=fs.readFileSync('public/yp-web-ai/js/template-entry.js','utf8');
 assert.ok(html.indexOf('js/photo360-template-ui.js')<html.indexOf('js/wizard-v2.js'));assert.match(html,/YPPhoto360TemplateUI\?\.syncType\(S.type\)/);
 assert.match(wizard,/photo360:YPPhoto360Templates/);assert.match(wizard,/photo360:YPPhoto360TemplateBridge/);assert.match(wizard,/photo360:'photo360'/);
 assert.match(entry,/window.YPPhoto360Templates/);assert.match(ui,/YPProjectWorkspace.useTemplate/);assert.match(ui,/type!=='photo360'/);
 for(const code of [wizard,ui,entry])new vm.Script(code);
});
test('template preview is an exported PNG',()=>{
 const png=fs.readFileSync('public/yp-web-ai/assets/photo360-templates/photo360-circle-stage.png');assert.equal(png.subarray(1,4).toString(),'PNG');assert.equal(png.readUInt32BE(16),960);assert.equal(png.readUInt32BE(20),600);
});
