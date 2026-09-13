import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const context=vm.createContext({});
vm.runInContext(fs.readFileSync('public/yp-web-ai/js/booth-lighting.js','utf8'),context);
const api=context.YPBoothLighting;
test('legacy state is read without mutating fixtures or inventing inventory',()=>{
 const s={lights:true,lightCol:'warm',lighting:{mode:'manual',approvedFixtures:[{id:'kept'}]}};
 const original=JSON.stringify(s);assert.equal(api.settings(s).tone,'warm');assert.equal(api.settings(s).enabled,true);assert.equal(JSON.stringify(s),original);
 assert.equal(api.settings({lights:false}).enabled,false);
 assert.equal(api.settings({lighting:{mode:'auto',enabled:false}}).enabled,false);
});
test('integrated warm templates have useful defaults; explicit controls win',()=>{
 const s={lighting:{mode:'auto'},objects:[{structure:{design:'soft-wave-led'}}]};
 assert.equal(api.settings(s).tone,'warm');
 s.lighting.boothControl={version:1,enabled:false,tone:'white'};
 assert.equal(api.settings(s).enabled,false);assert.equal(api.settings(s).tone,'white');
 const roundTrip=JSON.parse(JSON.stringify(s));assert.equal(api.settings(roundTrip).tone,'white');
});
test('prompts honour off state without removing hardware or studio lighting',()=>{
 const off=api.promptLines({lighting:{boothControl:{version:1,enabled:false,tone:'warm'}}}).join('\n');
 assert.match(off,/Switch off booth light emission/);assert.match(off,/Hide lamp housings/);assert.match(off,/Keep neutral studio/);assert.doesNotMatch(off,/AI Suggested|fixturePreference/);
 const on=api.promptLines({lighting:{boothControl:{version:1,enabled:true,tone:'white'}}}).join('\n');assert.match(on,/5000K/);
});
test('only white/warm emission is tintable, brand colours are protected',()=>{
 const c=(h,s)=>({getHSL:()=>({h,s,l:.5})});
 assert.equal(api.tintable(c(.1,.8)),true);assert.equal(api.tintable(c(.6,.1)),true);
 assert.equal(api.tintable(c(.5,.9)),false);assert.equal(api.tintable(c(.9,.9)),false);
});
test('UI, renderer and atomic AI prompt are connected to the same control',()=>{
 const html=fs.readFileSync('public/yp-web-ai/index.html','utf8');
 assert.match(html,/id="legacyLightingControls" hidden inert/);
 for(const id of ['boothLightOn','boothLightOff','boothLightWhite','boothLightWarm'])assert.match(html,new RegExp('id="'+id+'" aria-pressed='));
 assert.match(html,/lighting\.boothControl\|\|null/);assert.match(html,/YPBoothLighting\?\.apply\(this,spec\)/);
 assert.match(html,/\.\.\.lightingPromptForSpec\(snapshot\.spec\)/);
 const auto=html.slice(html.indexOf('  addAutoLightingFixtures('),html.indexOf('  applyCatalogObjectTransform('));
 assert.doesNotMatch(auto,/if\(!state.enabled\)return/);
});
