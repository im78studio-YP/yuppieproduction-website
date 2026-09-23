import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const base=new URL('../../public/yp-web-ai/',import.meta.url);
const ctx={};
for(const file of ['imported-structure-assets.js','asset-tags.js']){
 vm.runInNewContext(readFileSync(new URL('js/'+file,base),'utf8'),ctx);
}
const matches=ctx.YPImportedStructureAssets.filter(i=>i.catalogId==='imported-standee-sq02');

test('SQ02 is one shelf entry with source dimensions, tags and edit capabilities',()=>{
 assert.equal(matches.length,1);
 const item=matches[0];
 assert.equal(item.name,'Standee_SQ02 · ชั้นโชว์');
 assert.equal(item.category,'display');
 assert.equal(item.sceneAssetType,'Shelf');
 assert.equal(item.type,'custom');
 assert.deepEqual(JSON.parse(JSON.stringify(item.size)),{w:1.3,d:.7,h:1.6});
 assert.equal(item.unitPrice,0);
 for(const capability of ['styleable','resizable'])assert.ok(item.capabilities.includes(capability));
 for(const tag of ['ชั้นโชว์','จัดแสดงสินค้า'])assert.ok(ctx.YPAssetTags.tags(item).includes(tag));
 const ids=ctx.YPImportedStructureAssets.map(i=>i.catalogId);
 assert.equal(new Set(ids).size,ids.length);
});

test('GLB preserves 11 meshes and the embedded sign texture',()=>{
 const bytes=readFileSync(new URL(matches[0].modelUrl,base));
 assert.equal(bytes.toString('ascii',0,4),'glTF');
 assert.equal(bytes.readUInt32LE(4),2);
 assert.equal(bytes.readUInt32LE(8),bytes.length);
 const gltf=JSON.parse(bytes.toString('utf8',20,20+bytes.readUInt32LE(12)));
 assert.equal(gltf.meshes.length,11);
 assert.ok(gltf.materials.some(m=>m.name==='STK'&&m.pbrMetallicRoughness.baseColorTexture));
 assert.ok(gltf.materials.some(m=>m.name==='Teddy_HairLight'));
 assert.equal(gltf.images.length,1);
 assert.ok(gltf.images.every(i=>Number.isInteger(i.bufferView)&&gltf.bufferViews[i.bufferView]));
});

test('both catalogue thumbnail paths contain the same rendered WebP',()=>{
 const image=readFileSync(new URL(matches[0].thumbUrl,base));
 const repaired=readFileSync(new URL('assets/catalog-thumbnails/surface-corrected/imported-standee-sq02.webp',base));
 assert.equal(image.toString('ascii',0,4),'RIFF');
 assert.equal(image.toString('ascii',8,12),'WEBP');
 assert.ok(image.length>1000);
 assert.deepEqual(image,repaired);
});
