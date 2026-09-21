import test from 'node:test';
import assert from 'node:assert/strict';
await import('../../public/yp-web-ai/js/photo-backdrop-default.js');
globalThis.YPPhotoBackdropArtwork={data:'data:image/png;base64,art',name:'approved.png',aspect:2043/770};
globalThis.YPDefaultLogo={data:'logo',aspect:4,color:'#ee3c96',brand:''};
test('Photo Backdrop defaults match approved image and do not add duplicate objects',()=>{
 const s={objects:[]};YPPhotoBackdropDefault.apply(s);
 assert.deepEqual([s.W,s.D,s.H],[6,3,2.4]);assert.deepEqual([s.floor,s.carpet,s.raise],['carpet','grey',0]);
 assert.deepEqual([s.logoMount,s.logoFloorX,s.logoFloorZ,s.logoScale,s.nameScale],['floor',3,2.8,35,0]);
 assert.equal(s.wallStickers.back.data,YPPhotoBackdropArtwork.data);assert.equal(s.wallStickers.back.mode,'cover');
 YPPhotoBackdropDefault.apply(s);assert.deepEqual(s.wallStickerFaces,['back']);assert.deepEqual(s.objects,[]);
});
test('explicit type switch can preserve customer graphics; no implicit restore mutation',()=>{
 const logo='customer-logo',wall={data:'customer-wall',offsetY:1};const s={logo,wallStickers:{back:wall},objects:[{id:'customer'}]};
 YPPhotoBackdropDefault.apply(s,{preserveGraphics:true});assert.equal(s.logo,logo);assert.deepEqual(s.wallStickers.back,wall);assert.equal(s.objects[0].id,'customer');
});
