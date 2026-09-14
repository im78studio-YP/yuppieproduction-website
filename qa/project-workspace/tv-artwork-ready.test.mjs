import test from 'node:test';
import assert from 'node:assert/strict';
import '../../public/yp-web-ai/js/tv-asset.js';
function fixture(){
 class Material{constructor(options){Object.assign(this,options);}}
 class CanvasTexture{constructor(image){this.image=image;}}
 const screen={isMesh:true,name:'tv-screen',userData:{},material:{name:'TV'}},body={isMesh:true,name:'body',userData:{},material:{}};
 const group={traverse(fn){[screen,body].forEach(fn);}};
 const renderer={THREE:{MeshBasicMaterial:Material,MeshStandardMaterial:Material,CanvasTexture,DoubleSide:2,SRGBColorSpace:'srgb'},buildId:1,brandImages:new Map(),renderer:{render(){}}};
 return{renderer,group,screen,body};
}
test('TV applies cached artwork synchronously before final export render',()=>{
 const {renderer,group,screen,body}=fixture(),decoded={_ypRasterSource:{width:900,height:550}};
 renderer.brandImages.set('customer-art',decoded);renderer.loadBrandImage=()=>{throw new Error('cached image must not load again');};
 YPTVAsset.appearance(renderer,group,{appearance:{textureData:'customer-art'}});
 assert.equal(screen.material.map.image,decoded._ypRasterSource);assert.equal(screen.material.map.flipY,true);assert.equal(body.material.color,'#101114');
});
test('TV waits on tracked artwork and ignores a superseded scene',async()=>{
 const {renderer,group,screen}=fixture();let finish,source;
 renderer.loadBrandImage=s=>{source=s;return new Promise(r=>finish=r);};
 YPTVAsset.appearance(renderer,group,{appearance:{}});assert.equal(source,YPTVAsset.image);assert.equal(screen.material.map,undefined);
 renderer.buildId++;finish({width:900,height:550});await Promise.resolve();assert.equal(screen.material.map,undefined);
});
