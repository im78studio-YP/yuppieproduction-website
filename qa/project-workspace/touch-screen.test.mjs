import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import '../../public/yp-web-ai/js/tv-asset.js';
import '../../public/yp-web-ai/js/touch-screen.js';
const html=readFileSync(new URL('../../public/yp-web-ai/index.html',import.meta.url),'utf8');
const catalog=Function('furnitureItem','return '+html.match(/const OBJECT_CATALOG=(\[[\s\S]*?\]);/)[1])(x=>x);
test('portrait touch screen is a separate editable media asset',()=>{
 const item=catalog.find(i=>i.catalogId===YPTouchScreen.id);assert.deepEqual(item,YPTouchScreen.definition);assert.deepEqual(item.size,{w:.82,d:.4,h:2});assert.ok(item.transformPolicy.canResize&&item.transformPolicy.canScale);assert.ok(YPTVAsset.isTV(item));assert.ok(!YPTouchScreen.isTouch({catalogId:'tv-65'}));
 assert.ok(html.indexOf('js/touch-screen.js')<html.indexOf('const OBJECT_CATALOG='));assert.ok(html.indexOf('YPTouchScreen?.build')<html.indexOf('const tv=YPTVAsset.isTV(item),furniture='));
});
test('contain fit preserves customer artwork without cropping or stretching',()=>{
 for(const [iw,ih,w,h]of [[1017,341,704,1420],[704,1420,704,1420],[100,200,1200,500]]){const r=YPTouchScreen.contain(iw,ih,w,h);assert.ok(Math.abs(r.w/r.h-iw/ih)<1e-8);assert.ok(r.x>=0&&r.y>=0&&r.w<=w+.001&&r.h<=h+.001);}
});
test('touch artwork participates in screenshot loading and settings keep the casing',()=>{
 assert.ok(html.includes('filter(o=>YPTouchScreen.isTouch(o)).map(o=>o.appearance?.textureData||YPTouchScreen.image)'));
 const settings=readFileSync(new URL('../../public/yp-web-ai/js/tv-asset.js',import.meta.url),'utf8');assert.ok(settings.includes('touch?root.YPTouchScreen.image'));assert.ok(settings.includes('ขนาดเริ่มต้นประมาณจากภาพอ้างอิง'));
});
