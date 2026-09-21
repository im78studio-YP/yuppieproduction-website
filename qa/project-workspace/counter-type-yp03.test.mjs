import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import vm from 'node:vm';
const base=new URL('../../public/yp-web-ai/',import.meta.url);
const ctx={};vm.runInNewContext(readFileSync(new URL('js/imported-structure-assets.js',base),'utf8'),ctx);
const matches=ctx.YPImportedStructureAssets.filter(i=>i.catalogId==='imported-counter-type-yp03');
test('YP03 has a unique counter entry with source dimensions and edit capabilities',()=>{
 assert.equal(matches.length,1);const item=matches[0];assert.equal(item.name,'Counter_Type_YP03');
 assert.equal(item.category,'reception');assert.equal(item.sceneAssetType,'Counter');assert.equal(item.type,'custom');
 assert.deepEqual(JSON.parse(JSON.stringify(item.size)),{w:1.52,d:.61,h:.85});
 assert.equal(item.unitPrice,0);assert.ok(item.capabilities.includes('styleable'));assert.ok(item.capabilities.includes('resizable'));
});
test('shipped GLB keeps both meshes and embedded wood texture',()=>{
 const bytes=readFileSync(new URL(matches[0].modelUrl,base));assert.equal(bytes.toString('ascii',0,4),'glTF');
 assert.equal(bytes.readUInt32LE(8),bytes.length);const gltf=JSON.parse(bytes.toString('utf8',20,20+bytes.readUInt32LE(12)));
 assert.equal(gltf.meshes.length,2);assert.ok(gltf.materials.some(m=>m.name.includes('Wood Veneer')&&m.pbrMetallicRoughness.baseColorTexture));
 assert.ok(gltf.images.every(i=>Number.isInteger(i.bufferView)),'textures must remain self-contained');
});
test('catalogue preview exists at the surface-corrected runtime path',()=>{
 const image=readFileSync(new URL('assets/catalog-thumbnails/surface-corrected/imported-counter-type-yp03.webp',base));
 assert.equal(image.toString('ascii',0,4),'RIFF');assert.equal(image.toString('ascii',8,12),'WEBP');
 assert.ok(image.length>1000);assert.ok(existsSync(new URL(matches[0].thumbUrl,base)));
});
