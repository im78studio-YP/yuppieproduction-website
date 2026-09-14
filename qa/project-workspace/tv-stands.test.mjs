import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import '../../public/yp-web-ai/js/tv-asset.js';
import '../../public/yp-web-ai/js/tv-stands.js';
const html=await readFile(new URL('../../public/yp-web-ai/index.html',import.meta.url),'utf8');
const catalog=Function('furnitureItem','return '+html.match(/const OBJECT_CATALOG=(\[[\s\S]*?\]);/)[1])(x=>x);
test('three independent TV stands have editable dimensions and separate thumbnails',()=>{
 const stands=catalog.filter(YPTVStands.isStand);
 assert.equal(stands.length,3);assert.equal(new Set(stands.map(s=>s.thumbUrl)).size,3);
 assert.deepEqual(stands.map(s=>s.size),[{w:.96,d:.55,h:1.32},{w:1.12,d:.55,h:1.20},{w:.92,d:.40,h:1.50}]);
 for(const s of stands){assert.equal(s.category,'media');assert.ok(s.transformPolicy.canResize);assert.ok(YPTVAsset.isTV(s));assert.equal(s.modelUrl,undefined);assert.equal(s.unitPrice,0);}
});
test('stand dispatcher is before TV fallback and does not claim existing standalone TVs',()=>{
 assert.ok(html.indexOf('YPTVStands?.build')<html.indexOf('root.add(YPTVAsset.fallback'));
 assert.ok(html.indexOf('YPTVStands?.isStand(obj)')<html.indexOf('YPTVAsset.appearance(this,root,obj)'));
 assert.equal(YPTVStands.isStand(YPTVAsset.definition),false);assert.equal(YPTVStands.isStand(YPTVAsset.definition65),false);
});
test('Yuppie artwork is shared by all stands and contained without cropping or stretching',async()=>{
 for(const id of YPTVStands.ids)assert.equal(YPTVStands.screenImage(id),'assets/tv-stands/yuppie-screen.png');
 const png=await readFile(new URL('../../public/yp-web-ai/assets/tv-stands/yuppie-screen.png',import.meta.url));
 assert.equal(png.subarray(1,4).toString(),'PNG');
 for(const [w,h]of [[1600,900],[1200,800],[900,1600],[3000,600]]){
  const r=YPTVStands.containRect(1017,341,w,h);
  assert.ok(Math.abs(r.w/r.h-1017/341)<1e-9);assert.ok(r.x>=0&&r.y>=0);assert.ok(r.x+r.w<=w+.001&&r.y+r.h<=h+.001);
  assert.ok(Math.abs(2*r.x+r.w-w)<1e-9&&Math.abs(2*r.y+r.h-h)<1e-9);
 }
});
