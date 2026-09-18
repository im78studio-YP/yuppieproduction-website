import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const context={};
for(const file of ['asset-edge-glow.js','asset-parts.js'])vm.runInNewContext(fs.readFileSync(new URL('../../public/yp-web-ai/js/'+file,import.meta.url),'utf8'),context);
test('Edge glow is bounded data-only and can inherit the original whole-object surface',()=>{
 const api=context.YPAssetParts,glow={enabled:true,color:'#FFAACC',intensity:999};
 const out=api.sanitize({'p.0:m0':{mode:'inherit',edgeGlow:glow},'p.1:m0':{mode:'inherit'}});
 assert.equal(out['p.0:m0'].mode,'inherit');assert.equal(out['p.0:m0'].color,null);assert.equal(out['p.0:m0'].edgeGlow.color,'#ffaacc');assert.equal(out['p.0:m0'].edgeGlow.intensity,3);assert.equal(out['p.1:m0'],undefined);
 assert.equal(context.YPAssetEdgeGlow.sanitize({enabled:false}),null);
 assert.equal(context.YPAssetEdgeGlow.sanitize({enabled:true,color:'bad',intensity:NaN}).color,'#fff1c2');
 assert.equal(context.YPAssetEdgeGlow.sanitize({enabled:true,intensity:-2}).intensity,.2);
});
test('Selected/custom routes retain ordered finite segments, deduplicate reversed edges and reject invalid points',()=>{
 const api=context.YPAssetEdgeGlow,a=[[0,0,0],[1,1,0]],b=[[1,1,0],[2,1,0]];
 const value=api.sanitize({enabled:true,pathMode:'custom',segments:[a,b,[a[1],a[0]],[[0,0,0],[0,0,0]],[[NaN,0,0],[1,0,0]],[[1e9,0,0],[1,0,0]]]});
 assert.equal(value.pathMode,'custom');assert.equal(value.segments.length,2);assert.deepEqual(JSON.parse(JSON.stringify(value.segments)),[a,b]);
 assert.equal(api.sanitize({enabled:true}).pathMode,'all');assert.equal(api.sanitize({enabled:true,pathMode:'selected',segments:[]}).segments.length,0);
});
test('Only data-only valid part overrides survive; duplicate/import get independent values',()=>{
 const input={'p.0.1:m0':{mode:'solid',color:'#ABCDEF',finish:'metal'},'p.1:m2':{mode:'original'},'bad':{mode:'solid',color:'#ffffff'},'p.2:m0':{mode:'solid',color:'red'},'p.3:m0':{mode:'code',color:'#ffffff'}};
 const out=context.YPAssetParts.sanitize(input);
 assert.deepEqual(Object.keys(out),['p.0.1:m0','p.1:m2']);
 assert.equal(out['p.0.1:m0'].color,'#abcdef');assert.equal(out['p.1:m2'].color,null);
 out['p.0.1:m0'].color='#000000';assert.equal(input['p.0.1:m0'].color,'#ABCDEF');
});
