import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const base=new URL('../../public/yp-web-ai/',import.meta.url),ctx={};
for(const file of ['imported-structure-assets.js','asset-tags.js'])vm.runInNewContext(readFileSync(new URL('js/'+file,base),'utf8'),ctx);
const matches=ctx.YPImportedStructureAssets.filter(i=>i.catalogId==='imported-counters-set-04');
test('Set 04 is one counter with correct dimensions and capabilities',()=>{
 assert.equal(matches.length,1);const item=matches[0];
 assert.equal(item.name,'Counters_Set_04 · เคาน์เตอร์');
 assert.equal(item.category,'reception');assert.equal(item.sceneAssetType,'Counter');
 assert.deepEqual(JSON.parse(JSON.stringify(item.size)),{w:2.05,d:.6,h:1});
 assert.equal(item.unitPrice,0);
 for(const capability of ['styleable','resizable','rotatable'])assert.ok(item.capabilities.includes(capability));
 assert.ok(ctx.YPAssetTags.tags(item).includes('เคาน์เตอร์'));
 const ids=ctx.YPImportedStructureAssets.map(i=>i.catalogId);assert.equal(new Set(ids).size,ids.length);
});
test('shipped GLB preserves both parts and authored blue material',()=>{
 const bytes=readFileSync(new URL(matches[0].modelUrl,base));
 assert.equal(bytes.toString('ascii',0,4),'glTF');assert.equal(bytes.readUInt32LE(8),bytes.length);
 const gltf=JSON.parse(bytes.toString('utf8',20,20+bytes.readUInt32LE(12)));
 assert.equal(gltf.meshes.length,2);assert.equal(gltf.nodes.filter(n=>n.mesh!==undefined).length,2);
 assert.equal(gltf.materials[0].name,'Teddy_DressShadow');
 const color=gltf.materials[0].pbrMetallicRoughness.baseColorFactor;
 assert.ok(color[2]>color[1]&&color[1]>color[0]);
 assert.equal(gltf.meshes[0].primitives[0].material,undefined);
 assert.equal(gltf.meshes[1].primitives[0].material,0);
});
test('both catalogue thumbnail paths contain the same rendered WebP',()=>{
 const image=readFileSync(new URL(matches[0].thumbUrl,base));
 const repaired=readFileSync(new URL('assets/catalog-thumbnails/surface-corrected/imported-counters-set-04.webp',base));
 assert.equal(image.toString('ascii',0,4),'RIFF');assert.equal(image.toString('ascii',8,12),'WEBP');
 assert.ok(image.length>1000);assert.deepEqual(image,repaired);
});
