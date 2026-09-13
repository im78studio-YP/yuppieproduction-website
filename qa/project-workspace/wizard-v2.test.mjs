import test from 'node:test';
import assert from 'node:assert/strict';
await import('../../public/yp-web-ai/js/wizard-model.js');
const draft=()=>({businessCategoryId:'food',businessBrief:{product:'Tea'},boothType:'inline',cornerSide:'right',width:6,depth:6,height:3.8,roomMode:'keep',theme:null});
const base=()=>({assets:[],spec:{W:6,D:3,H:3.8,objects:[{id:'room-wall',locked:true,appearance:{textureData:'logo'}}],stSize:'none',floor:'tile',tile:'woodL',raise:5,primary:'#123456',boothColorTheme:{name:'original'},wallPaintOverrides:{back:'#123456'}}});
test('five steps with separate templates and final review',()=>assert.deepEqual(YPWizardModel.steps,['business','layout','template','customize','review']));
test('area changes do not scale geometry or alter original materials and custom rooms',()=>{const input=base(),before=structuredClone(input),s=YPWizardModel.build(input,draft(),v=>v);assert.deepEqual(input,before);assert.equal(s.spec.D,6);assert.deepEqual(s.spec.objects,input.spec.objects);assert.deepEqual(s.spec.boothColorTheme,input.spec.boothColorTheme);assert.equal(s.spec.tile,'woodL');assert.equal(s.spec.raise,5);assert.equal(s.spec.stSize,'none');});
test('explicit floor and theme overrides only, independent room handling',()=>{const d={...draft(),floorChanged:true,floor:'carpet',carpet:'grey',tile:'woodD',raise:10,roomMode:'add',theme:{name:'new',primary:'#ff0088'}};const s=YPWizardModel.build(base(),d,v=>v).spec;assert.equal(s.floor,'carpet');assert.equal(s.raise,10);assert.equal(s.stSize,'a');assert.equal(s.stW,1.2);assert.equal(s.objects.length,1);assert.equal(s.primary,'#ff0088');assert.equal(s.objects[0].appearance.textureData,'logo');});
test('remove-standard never deletes a modeled room or other objects',()=>{const b=base();b.spec.stSize='a';const s=YPWizardModel.build(b,{...draft(),roomMode:'remove-standard'},v=>v).spec;assert.equal(s.stSize,'none');assert.deepEqual(s.objects,b.spec.objects);});
test('reject invalid / blank / out of range area, business and corner',()=>{for(const change of [{width:NaN},{depth:0},{height:5},{height:2},{width:31},{businessCategoryId:''},{businessCategoryId:'other',customBusinessCategory:' '},{boothType:'corner',cornerSide:''}])assert.throws(()=>YPWizardModel.build(base(),{...draft(),...change},v=>v));});
test('late logo bounds, snap registry and viewport are not design edits',()=>{
 const a={...base().spec,logo:'same-svg',logoVisibleBounds:null,sceneItemState:{wall:{visible:true}},sceneAssetRegistry:{assets:[]},sceneSnapData:{anchors:[]},view:'three',aiRendering:{camera:null,cameraViewType:'perspective',quality:'final',preview:null,renderPackage:null}};
 const original=structuredClone(a),b=structuredClone(a);b.logoVisibleBounds={minX:.318,maxX:.684,minY:.41,maxY:.594};b.sceneAssetRegistry.assets=[{id:'brand',bounds:{width:2.25}}];b.sceneSnapData.anchors=[{localPosition:{x:1.125}}];b.view='plan';Object.assign(b.aiRendering,{camera:{position:{x:12},viewport:{width:800}},cameraViewType:'front',preview:{cached:true},renderPackage:{id:'generated'}});
 assert.equal(YPWizardModel.designSignature(a),YPWizardModel.designSignature(b));assert.deepEqual(a,original);
});
test('every real design edit remains protected, including system state and AI preferences',()=>{
 const a={...base().spec,logo:'original-logo',sceneItemState:{},assetAttachmentGraph:{attachments:[]},aiRendering:{quality:'preview',renderStyle:'studio'}};
 for(const edit of [s=>s.W++,s=>s.objects[0].appearance.textureData='new-art',s=>s.objects[0].position={x:1,y:2,z:3},s=>s.objects[0].locked=false,s=>s.objects.push({id:'new'}),s=>s.logo='new-logo',s=>s.primary='#ff0088',s=>s.tile='woodD',s=>s.sceneItemState.wall={visible:false},s=>s.assetAttachmentGraph.attachments.push({childId:'room-wall',targetId:'floor'}),s=>s.wallPaintOverrides.back='#ff0088',s=>s.boothColorTheme.name='new',s=>s.aiRendering.quality='final',s=>s.aiRendering.renderStyle='new']){
  const b=structuredClone(a);edit(b);assert.notEqual(YPWizardModel.designSignature(a),YPWizardModel.designSignature(b));
 }
});
test('signature ignores property insertion order but preserves array order',()=>{
 assert.equal(YPWizardModel.designSignature({W:6,objects:[{id:'a',label:'A'}]}),YPWizardModel.designSignature({objects:[{label:'A',id:'a'}],W:6}));
 assert.notEqual(YPWizardModel.designSignature({objects:['a','b']}),YPWizardModel.designSignature({objects:['b','a']}));
});
