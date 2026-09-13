import test from 'node:test';
import assert from 'node:assert/strict';
await import('../../public/yp-web-ai/js/logo-finishes.js');
test('front-lit emission is doubled without changing rear/painted finishes or off/zero',()=>{
 const T={MeshStandardMaterial:class{constructor(options){Object.assign(this,options);this.userData={};}}};
 const emission=(logoType,intensity,enabled=true)=>YPLogoFinishes.front(T,{}, {logoType,logoLight:{intensity,enabled}}).emissiveIntensity;
 assert.equal(emission('light',1),1.8);
 assert.equal(emission('light',.5),.9);
 assert.equal(emission('light',0),0);
 assert.equal(emission('light',1,false),0);
 for(const type of ['backlit','diecut','sticker'])assert.equal(emission(type,1),0);
});
test('logo light defaults are independent, finite and bounded',()=>{
 assert.deepEqual(YPLogoFinishes.settings({}),{enabled:true,tone:'warm',intensity:.65});
 assert.equal(YPLogoFinishes.settings({logoLight:{intensity:-1}}).intensity,0);
 assert.equal(YPLogoFinishes.settings({logoLight:{intensity:3}}).intensity,1);
 assert.equal(YPLogoFinishes.settings({logoLight:{intensity:'bad'}}).intensity,.65);
});
test('painted and legacy sticker faces never emit; two illuminated styles can switch off',()=>{
 for(const logoType of ['diecut','sticker'])assert.equal(YPLogoFinishes.lit({logoType}),false);
 for(const logoType of ['backlit','light']){assert.equal(YPLogoFinishes.lit({logoType}),true);assert.equal(YPLogoFinishes.lit({logoType,logoLight:{enabled:false}}),false);}
});
test('original artwork can be restored without discarding a saved tint',()=>{
 assert.equal(YPLogoFinishes.colorMode({}),'original');
 assert.equal(YPLogoFinishes.colorMode({logoColorTouched:true}),'tint');
 assert.equal(YPLogoFinishes.colorMode({logoColorTouched:true,logoColorMode:'original'}),'original');
});
test('render prompt differentiates face emission and rear halo, without cones',()=>{
 assert.match(YPLogoFinishes.prompt({logoType:'backlit'}),/rear halo/);
 assert.match(YPLogoFinishes.prompt({logoType:'light'}),/evenly illuminated coloured faces/);
 assert.match(YPLogoFinishes.prompt({logoType:'light',logoLight:{enabled:false}}),/independently off/);
 assert.match(YPLogoFinishes.prompt({}),/No light cones/);
});
