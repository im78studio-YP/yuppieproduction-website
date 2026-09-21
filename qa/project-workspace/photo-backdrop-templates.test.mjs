import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import '../../public/yp-web-ai/js/photo-backdrop-default.js';
import '../../public/yp-web-ai/js/photo-backdrop-templates.js';
globalThis.YPPhotoBackdropArtwork={data:'data:image/png;base64,wall',name:'wall.png',aspect:2043/770};
globalThis.YPDefaultLogo={data:'data:image/png;base64,logo',aspect:4,color:'#ee3c96',brand:''};
const lib=globalThis.YPPhotoBackdropTemplates;
test('both template cards have renderer-exported 960x600 PNG previews',()=>{
 for(const t of lib.templates){const png=fs.readFileSync('public/yp-web-ai/assets/photo-backdrop-templates/'+t.id+'.png');assert.equal(png.subarray(1,4).toString(),'PNG');assert.equal(png.readUInt32BE(16),960);assert.equal(png.readUInt32BE(20),600);}
});
test('two 6x3x2.4 templates differ only in floor logo visibility and metadata',()=>{
 assert.equal(lib.templates.length,2);
 const results=lib.templates.map(t=>lib.build(t.id,{objects:[],wallStickers:{}}).spec);
 for(const s of results){assert.deepEqual([s.W,s.D,s.H],[6,3,2.4]);assert.equal(s.type,'backdrop');assert.deepEqual([s.floor,s.carpet,s.raise],['carpet','grey',0]);assert.equal(s.wallStickers.back.data,YPPhotoBackdropArtwork.data);assert.deepEqual(s.objects,[]);assert.equal(s.nameScale,0);}
 assert.equal(results[0].logoScale,0);assert.equal(results[1].logoScale,35);assert.equal(results[1].logoMount,'floor');
 assert.deepEqual([results[1].logoFloorX,results[1].logoFloorZ],[3,2.8]);
 assert.equal(results[0].sceneItemState['branding.logo.main'].visible,false);assert.equal(results[1].sceneItemState['branding.logo.main'].visible,true);
 for(const s of results){delete s.photoBackdropTemplate;delete s.logoScale;delete s.sceneItemState;}assert.deepEqual(results[0],results[1]);
});
test('template build never mutates the source and does not carry hidden walls or user equipment',()=>{
 const source={objects:[{id:'customer'}],sceneItemState:{'structure.wall.back':{visible:false}},wallStickers:{left:{data:'customer-art'}},logo:'customer-logo'};
 const before=structuredClone(source),out=lib.build('backdrop-wall-only',source);
 assert.deepEqual(source,before);assert.deepEqual(out.spec.sceneItemState,{'branding.logo.main':{visible:false}});assert.deepEqual(out.spec.wallStickerFaces,['back']);assert.equal(out.spec.wallStickers.left,undefined);
 assert.throws(()=>lib.build('missing',source),/ไม่พบ/);
});
test('Wizard, main editor and navigation load the same backdrop library',()=>{
 const html=fs.readFileSync('public/yp-web-ai/index.html','utf8'),wizard=fs.readFileSync('public/yp-web-ai/js/wizard-v2.js','utf8');
 assert.ok(html.indexOf('js/photo-backdrop-template-ui.js')<html.indexOf('js/wizard-v2.js'));
 assert.match(html,/YPPhotoBackdropTemplateUI\?\.syncType\(S.type\)/);
 assert.match(wizard,/backdrop:YPPhotoBackdropTemplates/);assert.match(wizard,/backdrop:YPPhotoBackdropTemplateBridge/);
 for(const name of ['photo-backdrop-templates','photo-backdrop-template-ui','wizard-v2'])new vm.Script(fs.readFileSync('public/yp-web-ai/js/'+name+'.js','utf8'));
});
