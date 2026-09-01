import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,'../..');
const moduleSource=fs.readFileSync(path.join(root,'public/yp-web-ai/js/auto-lighting.js'),'utf8');
const html=fs.readFileSync(path.join(root,'public/yp-web-ai/index.html'),'utf8');
const context={globalThis:{}};vm.createContext(context);vm.runInContext(moduleSource,context);
const api=context.globalThis.YPAutoLighting;
const baseSpec=()=>({type:'inline',W:6,D:3,H:2.4,brand:'YOUR BRAND',logoScale:25,logoWidth:2,logoWallY:1.6,objects:[],wallStickerFaces:[],lighting:api.defaultLightingState()});

test('1. โปรเจกต์ใหม่ใช้ Auto Lighting balanced 4000K standard',()=>{
  const state=api.defaultLightingState();assert.equal(state.mode,'auto');assert.equal(state.intent,'balanced');assert.equal(state.temperatureK,4000);assert.equal(state.brightness,'standard');assert.equal(state.fixturePreference,'auto');
});

test('2. โปรเจกต์เก่าที่ไม่มี lighting.mode ย้ายเป็น Manual โดยรักษาค่าเดิม',()=>{
  const state=api.normalizeLightingState(null,{legacyProject:true});assert.equal(state.mode,'manual');assert.equal(state.suggestions.length,0);assert.equal(state.approvedFixtures.length,0);
});

test('3. ตรวจ Target โลโก้ กราฟิก เคาน์เตอร์ และพื้นที่ทั่วไป',()=>{
  const spec=baseSpec();spec.wallStickerFaces=['back'];spec.wallStickers={back:{data:'x',w:3}};spec.objects=[{id:'c1',type:'counter',position:{x:2,y:0,z:2},size:{w:1.2,d:.6,h:1}}];
  const types=api.collectTargets(spec).map(item=>item.type);assert.ok(types.includes('logo'));assert.ok(types.includes('graphic'));assert.ok(types.includes('counter'));assert.ok(types.includes('general'));
});

test('4. ตรวจพื้นผิวติดตั้งจากผนังและคานเดิม',()=>{
  const spec=baseSpec();spec.objects=[{id:'b1',type:'downlightBeam',position:{x:3,y:2.2,z:1},size:{w:5,d:.3,h:.2}}];
  const mounts=api.collectMountSurfaces(spec);assert.ok(mounts.some(item=>item.id==='wall-back'));assert.ok(mounts.some(item=>item.id==='asset-b1'&&item.type==='overhead'));
});

test('5. มีคานเหนือศีรษะ Auto เลือก Clear Light',()=>{
  const spec=baseSpec();spec.objects=[{id:'b1',type:'downlightBeam',position:{x:3,y:2.2,z:1},size:{w:5,d:.3,h:.2}}];
  const plan=api.generateLightingPlan({spec,sceneRevision:2});assert.ok(plan.suggestions.some(item=>item.fixtureType==='clear'));assert.ok(plan.suggestions.every(item=>item.targetAssetId||item.targetZoneId));
});

test('6. มีเฉพาะผนัง Auto เลือก Arm Light',()=>{
  const plan=api.generateLightingPlan({spec:baseSpec(),sceneRevision:2});assert.ok(plan.suggestions.some(item=>item.fixtureType==='arm'));
});

test('7. Island ไม่มีพื้นผิวติดตั้งใช้ Invisible Preview โดยไม่สร้าง Mount ปลอม',()=>{
  const spec={...baseSpec(),type:'island',logoScale:0,brand:'',objects:[]};
  const plan=api.generateLightingPlan({spec,sceneRevision:2});assert.ok(plan.suggestions.length);assert.ok(plan.suggestions.every(item=>item.fixtureType==='invisible'&&item.mountSurfaceId===null));
});

test('8. โลโก้กว้างได้โคมสองจุดสมมาตร',()=>{
  const spec=baseSpec();spec.logoWidth=4;const plan=api.generateLightingPlan({spec,sceneRevision:2});const logo=plan.suggestions.filter(item=>item.targetType==='logo');assert.equal(logo.length,2);assert.ok(Math.abs((logo[0].position.x+logo[1].position.x)/2-spec.W/2)<.02);
});

test('9. Intent brand จัดโลโก้ก่อน general',()=>{
  const spec=baseSpec();spec.lighting={...api.defaultLightingState(),intent:'brand'};const plan=api.generateLightingPlan({spec,sceneRevision:3});assert.equal(plan.suggestions[0].targetType,'logo');
});

test('10. คำนวณใหม่รักษา Approved และไม่สร้าง Suggested ซ้ำตำแหน่งเดิม',()=>{
  const spec=baseSpec();let plan=api.generateLightingPlan({spec,sceneRevision:1});plan=api.approveSuggestions(plan);const approvedIds=plan.approvedFixtures.map(item=>item.id);const recalculated=api.recalculateLightingPlan({spec,sceneRevision:2,lighting:plan});assert.deepEqual(recalculated.approvedFixtures.map(item=>item.id),approvedIds);assert.equal(recalculated.suggestions.length,0);
});

test('11. Approve ย้ายเฉพาะ Fixture ที่ผ่าน Validation',()=>{
  const state=api.defaultLightingState();state.suggestions=[api.normalizeFixture({id:'ok',fixtureType:'arm',valid:true,targetZoneId:'general'}),api.normalizeFixture({id:'bad',fixtureType:'arm',valid:false,targetZoneId:'general'})];
  const approved=api.approveSuggestions(state);assert.equal(approved.approvedFixtures.map(item=>item.id).join(','),'ok');assert.equal(approved.suggestions.map(item=>item.id).join(','),'bad');
});

test('12. Scene เปลี่ยนทำ Suggested stale และเตือน Approved โดยไม่ย้าย',()=>{
  const spec=baseSpec();let state=api.generateLightingPlan({spec,sceneRevision:1});state=api.approveSuggestions(state);const before=JSON.stringify(state.approvedFixtures.map(item=>item.position));const stale=api.markStale(state,2);assert.equal(stale.stale,true);assert.equal(JSON.stringify(stale.approvedFixtures.map(item=>item.position)),before);assert.ok(stale.approvedFixtures.every(item=>item.validationWarnings.length));
});

test('13. Prompt แยก Approved LOCKED และ Suggested Render Staging',()=>{
  const spec=baseSpec();let state=api.generateLightingPlan({spec,sceneRevision:1});const one=state.suggestions.shift();state.approvedFixtures=[{...one,status:'approved'}];const lines=api.promptLines(state).join('\n');assert.match(lines,/LIGHTING INTENT/);assert.match(lines,/LOCKED/);assert.match(lines,/AI Suggested \/ Render Staging/);
});

test('14. Fixture Preference invisible บังคับ Preview Light ไม่มีตัวโคม',()=>{
  const spec=baseSpec();spec.lighting={...api.defaultLightingState(),fixturePreference:'invisible'};const plan=api.generateLightingPlan({spec,sceneRevision:1});assert.ok(plan.suggestions.every(item=>item.fixtureType==='invisible'&&item.status==='preview'));assert.equal(api.approveSuggestions(plan).approvedFixtures.length,0);
});

test('14.1 เมนูรูปแบบโคมเลือกชนิดที่ต้องการและใช้โคมที่ติดตั้งได้แทนโดยไม่ทำให้จุดไฟหาย',()=>{
  const spec=baseSpec();spec.objects=[{id:'entrance-1',type:'entranceFrame',catalogId:'entrance-frame',position:{x:.5,y:0,z:1.5},size:{w:1,d:2.4,h:2.4},structure:{pierWidth:1,projection:2.4,height:2.4,thickness:.15}}];
  for(const preference of ['auto','clear','arm','downlight','mixed']){
    spec.lighting={...api.defaultLightingState(),fixturePreference:preference};const plan=api.generateLightingPlan({spec,sceneRevision:1});
    assert.ok(plan.suggestions.length>0,preference);assert.ok(plan.suggestions.every(item=>item.fixtureType!=='invisible'),preference+' must keep compatible visible fixtures');
  }
  spec.lighting={...api.defaultLightingState(),fixturePreference:'mixed'};const mixed=api.generateLightingPlan({spec,sceneRevision:1});
  assert.ok(mixed.suggestions.filter(item=>item.mountSurfaceId==='wall-back').every(item=>item.fixtureType==='arm'));
  assert.ok(mixed.suggestions.filter(item=>item.targetType==='entrance').every(item=>item.fixtureType==='downlight'));
});

test('14.2 ผนังด้านข้างเพิ่ม Arm Light ซ้าย–ขวาโดยรักษาชุดไฟผนังหลังเดิม',()=>{
  const inline=baseSpec();inline.lighting={...api.defaultLightingState(),fixturePreference:'side-wall'};const sidePlan=api.generateLightingPlan({spec:inline,sceneRevision:1}),sideFixtures=sidePlan.suggestions.filter(item=>item.fixtureType!=='invisible');
  assert.deepEqual(Array.from(api.inferWalls(inline)),['back','left','right']);assert.equal(sideFixtures.filter(item=>item.mountSurfaceId==='wall-back').length,4);assert.equal(sideFixtures.filter(item=>item.mountSurfaceId==='wall-left').length,1);assert.equal(sideFixtures.filter(item=>item.mountSurfaceId==='wall-right').length,1);assert.equal(sideFixtures.length,6);
  assert.ok(sideFixtures.filter(item=>item.targetZoneId?.startsWith('side-wall-')).every(item=>item.fixtureType==='arm'));
  const penin={...baseSpec(),type:'penin',lighting:{...api.defaultLightingState(),fixturePreference:'side-wall'}},fallback=api.generateLightingPlan({spec:penin,sceneRevision:1});
  assert.equal(fallback.suggestions.filter(item=>item.fixtureType!=='invisible').length,4);assert.ok(fallback.suggestions.filter(item=>item.fixtureType!=='invisible').every(item=>item.mountSurfaceId==='wall-back'));
});

test('14.3 Asset สูงที่ทับผนังข้างตัดเฉพาะโคมด้านที่ถูกบัง',()=>{
  const spec=baseSpec();spec.lighting={...api.defaultLightingState(),fixturePreference:'side-wall'};spec.objects=[{id:'side-panel',type:'custom',catalogId:'opaque-panel',position:{x:.25,y:0,z:1.65},size:{w:.5,d:1.2,h:2.4}}];
  const plan=api.generateLightingPlan({spec,sceneRevision:1}),visible=plan.suggestions.filter(item=>item.fixtureType!=='invisible');
  assert.equal(visible.filter(item=>item.mountSurfaceId==='wall-back').length,4);assert.equal(visible.filter(item=>item.mountSurfaceId==='wall-left').length,0);assert.equal(visible.filter(item=>item.mountSurfaceId==='wall-right').length,1);
  assert.equal(plan.diagnostics.wallLayout.sideLayouts.left.removedFixtureIds.length,1);assert.equal(plan.diagnostics.wallLayout.sideLayouts.right.removedFixtureIds.length,0);
});

test('14.4 กรอบทางเข้าสงวนพื้นที่ใต้กรอบให้ Downlight และไม่ซ้อน Approved กับ Suggested',()=>{
  const spec=baseSpec();let state=api.approveSuggestions(api.generateLightingPlan({spec,sceneRevision:1}));state.fixturePreference='side-wall';spec.objects=[{id:'entrance-left',type:'entranceFrame',catalogId:'entrance-frame',position:{x:.75,y:0,z:1.5},size:{w:1,d:2.4,h:2.4},structure:{pierWidth:1,projection:2.4,height:2.4,thickness:.15}}];
  const next=api.recalculateLightingPlan({spec,sceneRevision:2,lighting:state}),combined=next.approvedFixtures.concat(next.suggestions),positions=new Set(combined.map(item=>item.mountSurfaceId+'/'+item.position.x+'/'+item.position.y+'/'+item.position.z));
  assert.equal(positions.size,combined.length);assert.equal(combined.filter(item=>item.mountSurfaceId==='wall-left').length,0);assert.equal(combined.filter(item=>item.targetType==='entrance'&&item.fixtureType==='downlight').length,2);assert.equal(combined.filter(item=>item.mountSurfaceId==='wall-right').length,1);
});

test('15. Validation ตรวจโคมซ้ำไม่วางจุดเดียวกัน',()=>{
  const spec=baseSpec();spec.logoWidth=4;const plan=api.generateLightingPlan({spec,sceneRevision:1});const positions=new Set(plan.suggestions.map(item=>`${item.position.x}/${item.position.y}/${item.position.z}`));assert.equal(positions.size,plan.suggestions.length);
});

test('UI, Renderer, Manifest และ Prompt เชื่อม Auto Lighting ครบ',()=>{
  for(const token of ['id="oLightingMode"','id="btnAutoLightGenerate"','id="btnAutoLightRecalculate"','id="btnAutoLightApprove"','Manual Lighting · ขั้นสูง','addAutoLightingFixtures','BoothSpec.lighting.','lightingPromptForSpec','AI Suggested / Render Staging','recalculateSuggestions','fixturePreference=v,true,true'])assert.ok(html.includes(token),token);
  const preferenceMenu=html.split('\n').find(line=>line.includes("mk('oLightPreference'"))||'';assert.match(preferenceMenu,/k:'side-wall'.*ผนังด้านข้าง.*เพิ่มไฟผนังซ้าย–ขวา/);for(const removed of ["k:'downlight'","k:'mixed'","k:'invisible'"])assert.ok(!preferenceMenu.includes(removed),removed);
});

test('16. Peninsular ใช้ผนังหลังเป็น Mount Surface',()=>{
  const spec={...baseSpec(),type:'peninsular'};assert.deepEqual(Array.from(api.inferWalls(spec)),['back']);assert.ok(api.collectMountSurfaces(spec).some(item=>item.id==='wall-back'));
});

test('17. ห้องและประตูไม่ถูกสร้างเป็น Lighting Target',()=>{
  const spec=baseSpec();spec.stSize='1.2x1.2';spec.objects=[{id:'storage-door',type:'storage-door',position:{x:5,y:0,z:.2},size:{w:.8,d:.1,h:2}}];
  assert.ok(!api.collectTargets(spec).some(item=>item.id==='storage-door'));
});

test('18. Screen และ Product Shelf ถูกตรวจเป็น Target ตามประเภท',()=>{
  const spec=baseSpec();spec.objects=[{id:'tv',type:'digital-screen',position:{x:1,y:.8,z:.1},size:{w:1,d:.1,h:.7}},{id:'shelf',type:'product-shelf',position:{x:4,y:0,z:1},size:{w:1.4,d:.5,h:1.8}}];
  const targets=api.collectTargets(spec);assert.equal(targets.find(item=>item.id==='tv').type,'screen');assert.equal(targets.find(item=>item.id==='shelf').type,'product');
});

test('19. เปลี่ยนขนาดบูธหลังจัดแสงทำ State stale โดยไม่ย้าย Approved',()=>{
  const spec=baseSpec();let state=api.approveSuggestions(api.generateLightingPlan({spec,sceneRevision:5}));const positions=JSON.stringify(state.approvedFixtures.map(item=>item.position));state=api.markStale(state,6);assert.equal(state.stale,true);assert.equal(JSON.stringify(state.approvedFixtures.map(item=>item.position)),positions);
});

test('20. ย้าย Counter แล้วคำนวณใหม่รักษา Approved และสร้าง Suggested ชุดใหม่',()=>{
  const spec=baseSpec();spec.objects=[{id:'counter',type:'counter',position:{x:1,y:0,z:2},size:{w:1.2,d:.6,h:1}}];let state=api.approveSuggestions(api.generateLightingPlan({spec,sceneRevision:1}));const approved=JSON.stringify(state.approvedFixtures);
  spec.objects[0].position.x=4;const next=api.recalculateLightingPlan({spec,sceneRevision:2,lighting:state});assert.equal(JSON.stringify(next.approvedFixtures),approved);assert.ok(next.suggestions.some(item=>item.targetAssetId==='counter'));
});

test('21. Save และ Reload รักษา Lighting Fixture schema ครบ',()=>{
  const spec=baseSpec();const saved=JSON.stringify(api.generateLightingPlan({spec,sceneRevision:1}));const loaded=api.normalizeLightingState(JSON.parse(saved));assert.equal(loaded.suggestions.length,JSON.parse(saved).suggestions.length);assert.ok(loaded.suggestions.every(item=>item.id&&item.position&&item.rotation&&item.aimTarget&&Array.isArray(item.validationWarnings)));
});

test('21.1 Save และ Reload รักษา Local Canopy Attachment ของ Downlight',()=>{
  const spec=baseSpec();spec.objects=[{id:'entrance-save',type:'entranceFrame',catalogId:'entrance-frame',position:{x:.5,y:0,z:1.5},size:{w:1,d:2.4,h:2.4},structure:{pierWidth:1,projection:2.4,height:2.4,thickness:.15}}];
  const saved=JSON.stringify(api.generateLightingPlan({spec,sceneRevision:1})),loaded=api.normalizeLightingState(JSON.parse(saved)),fixtures=loaded.suggestions.filter(item=>item.targetType==='entrance');
  assert.equal(fixtures.length,2);assert.deepEqual(fixtures.map(item=>item.mountAttachment.surfaceUV.v),[.28,.72]);
  assert.ok(fixtures.every(item=>item.mountAttachment.parentAssetId==='entrance-save'&&item.mountAttachment.mountRole==='entrance-canopy'&&item.mountAttachment.aimMode==='world-down'));
});

test('22. UI รองรับ Undo/Redo และแก้ Fixture รายจุด',()=>{
  for(const token of ['objectSnapshot','recordObjectHistory(before)','id="autoLightingFixtureEditor"','data-light-axis="x"','id="autoLightRotate"','id="autoLightAim"','id="autoLightDelete"'])assert.ok(html.includes(token),token);
});

test('23. Invisible Preview ไม่ถูกเพิ่มใน Asset List',()=>{
  assert.match(html,/lighting\.suggestions\.filter\(fixture=>fixture\.fixtureType!==['"]invisible['"]\)/);
});

test('24. Clean Screenshot และ Render Package ใช้ Lighting State',()=>{
  for(const token of ['createCleanScreenshot','createAtomicRenderSnapshot','lighting:cloneRenderValue'])assert.ok(html.includes(token),token);
});

test('25. Prompt Approved ส่ง Mount, Aim, Temperature และ Intensity',()=>{
  const state=api.defaultLightingState();state.approvedFixtures=[api.normalizeFixture({id:'approved',status:'approved',fixtureType:'arm',mountSurfaceId:'wall-back',targetType:'logo',position:{x:1,y:2,z:0},aimTarget:{x:1,y:1,z:0},temperatureK:4000,intensity:1})];const prompt=api.promptLines(state).join('\n');for(const token of ['Mount wall-back','Aim 1.00,1.00,0.00','4000K','Intensity 1'])assert.match(prompt,new RegExp(token));
});

test('26. Aim Target แปลงจาก World Space เป็น Local Space โดยไม่ถูก Parent Rotation หมุนซ้ำ',()=>{
  const fixture=api.normalizeFixture({position:{x:4.2,y:2.28,z:.03},rotation:{x:.468,y:-.685,z:.17},aimTarget:{x:3,y:1.32,z:1.5}}),local=api.fixtureAimLocalOffset(fixture);
  const {x,y,z}=fixture.rotation,a=Math.cos(x),b=Math.sin(x),c=Math.cos(y),d=Math.sin(y),e=Math.cos(z),f=Math.sin(z);
  const world={
    x:fixture.position.x+(c*e)*local.x+(-c*f)*local.y+d*local.z,
    y:fixture.position.y+(a*f+b*e*d)*local.x+(a*e-b*f*d)*local.y+(-b*c)*local.z,
    z:fixture.position.z+(b*f-a*e*d)*local.x+(b*e+a*f*d)*local.y+(a*c)*local.z
  };
  for(const axis of ['x','y','z'])assert.ok(Math.abs(world[axis]-fixture.aimTarget[axis])<1e-9,axis+' must resolve to the intended world target');
});

test('27. Lighting State เป็นส่วนหนึ่งของ Renderer visual key และ Renderer ใช้ local aim offset',()=>{
  assert.match(html,/lightingKey/);assert.match(html,/sceneItemState\|\|\{\},lightingKey/);assert.match(html,/fixtureAimLocalOffset\(renderFixture\)/);
});

test('27.1 Renderer แก้ Local Canopy Attachment ตาม Resize, Scale, Rotate และ Flip โดยไม่ Scale ตัวโคม',()=>{
  for(const token of ['resolveAutoLightingFixture(data,spec,allFixtures=[])','attachment.surfaceUV','sceneObjectScaleValue(obj)','sceneObjectOrientationLift(obj)','obj.transform?.flipX===true?-scale:scale','obj.transform?.flipY===true?-scale:scale','parentQuaternion=heading.multiply(localRotation)','localMount.multiply(signedScale).applyQuaternion(parentQuaternion)','if(runtime.mountQuaternion)root.quaternion.copy(runtime.mountQuaternion)'])assert.ok(html.includes(token),token);
  assert.ok(!/auto-light-visual-[^\n]+\.scale\.set/.test(html),'ตัวโคมต้องไม่รับ Scale ของกรอบทางเข้า');
  assert.match(html,/fixture\.mountAttachment=null/,'การปรับโคมด้วยตนเองต้อง detach หลัง materialise world transform');
  assert.ok(html.includes('resolvedAutoLightingFixtureForView(fixture,lightingFixtures,spec)'),'Asset Registry ต้องใช้ตำแหน่งที่ resolve แล้ว');
});

test('28. Auto Lighting ปล่อยแสงจากหน้าหัวโคมเข้าหาผนังและใช้ความเข้มที่มองเห็นได้',()=>{
  const back=api.normalizeFixture({fixtureType:'arm',mountSurfaceId:'wall-back',position:{x:3,y:2.28,z:.03},aimTarget:{x:3,y:1.6,z:.04},intensity:1}),source=api.fixtureLightWorldPosition(back);
  assert.ok(source.z>back.position.z,'หัวโคมผนังหลังต้องยื่นเข้าบูธ');assert.ok(source.y<back.position.y,'หัวโคมต้องอยู่ต่ำกว่าฐานติดตั้ง');
  assert.ok(back.aimTarget.z-source.z<0,'ลำแสงต้องย้อนเข้าหาพื้นผิวผนัง');assert.equal(api.fixtureRenderIntensity(back),16);
  const left=api.fixtureLightWorldPosition({...back,mountSurfaceId:'wall-left'}),right=api.fixtureLightWorldPosition({...back,mountSurfaceId:'wall-right'});
  assert.ok(left.x>back.position.x);assert.ok(right.x<back.position.x);
  assert.match(html,/fixtureLightLocalOffset\(renderFixture\)/);assert.match(html,/fixtureRenderIntensity\(fixture\)/);
});

test('29. บูธ 6 เมตรจัด Arm Light คู่เหนือโลโก้อย่างสมมาตร',()=>{
  const spec=baseSpec(),plan=api.generateLightingPlan({spec,sceneRevision:1}),logo=plan.suggestions.filter(item=>item.targetType==='logo');
  assert.equal(logo.length,2);assert.ok(Math.abs((logo[0].position.x+logo[1].position.x)/2-spec.W/2)<1e-9);assert.ok(logo[0].position.x<spec.W/2&&logo[1].position.x>spec.W/2);
  assert.ok(logo.every(item=>item.fixtureType==='arm'&&item.mountSurfaceId==='wall-back'&&item.mountRotation.y===0&&item.position.y===spec.H));
});

test('30. Renderer แยก Mount Rotation ออกจาก Beam Aim และใช้การวางโมเดลแบบ Manual',()=>{
  for(const token of ['const mountRotation=fixture.mountRotation','rotation:mountRotation','auto-light-visual-','modelDef?.mountMode','modelDef.modelFlipZ','autoUsesKey'])assert.ok(html.includes(token),token);
  assert.match(html,/fixture\.mountRotation=fixture\.mountRotation\|\|/);
});

test('31. อุณหภูมิสีและความสว่างอัปเดต Fixture เดิมทันทีโดยไม่ย้ายตำแหน่ง',()=>{
  const state=api.generateLightingPlan({spec:baseSpec(),sceneRevision:1}),positions=JSON.stringify(state.suggestions.map(item=>item.position));state.temperatureK=3000;state.brightness='soft';api.applyPhotometricSettings(state);
  assert.ok(state.suggestions.every(item=>item.temperatureK===3000));assert.ok(state.suggestions.filter(item=>item.targetType!=='general').every(item=>item.intensity===.72));assert.equal(JSON.stringify(state.suggestions.map(item=>item.position)),positions);
  assert.match(html,/applyPhotometricSettings\(state\)/);
});

test('32. ลำแสงทุกดวงใช้ขนาดกรวยมาตรฐานเดียวกัน รวมถึงโคมที่ส่องโลโก้',()=>{
  const plan=api.generateLightingPlan({spec:baseSpec(),sceneRevision:1}),visible=plan.suggestions.filter(item=>item.fixtureType!=='invisible'),logo=visible.filter(item=>item.targetType==='logo');assert.equal(logo.length,2);
  assert.ok(logo[0].aimTarget.x<3&&logo[1].aimTarget.x>3);assert.ok(logo.every(item=>Math.abs(item.aimTarget.x-item.position.x)<1e-9));
  assert.deepEqual([...new Set(visible.map(item=>item.beamAngle))],[.68]);
});

test('33. โหมดสมดุลกระจาย Brand Pair และ General Pair แบบสมมาตรตลอดความกว้างบูธ',()=>{
  const spec=baseSpec(),plan=api.generateLightingPlan({spec,sceneRevision:1}),brand=plan.suggestions.filter(item=>item.targetType==='logo'),general=plan.suggestions.filter(item=>item.targetType==='general');
  assert.equal(brand.length,2);assert.equal(general.length,2);assert.equal(plan.suggestions.length,4);
  assert.ok(general[0].position.x<brand[0].position.x&&general[1].position.x>brand[1].position.x);
  assert.ok(Math.abs((general[0].position.x+general[1].position.x)/2-spec.W/2)<1e-9);assert.ok(general[0].aimTarget.z>0&&general[1].aimTarget.z>0);
  assert.equal(general[0].targetZoneId,'general-left');assert.equal(general[1].targetZoneId,'general-right');
});

test('34. โคมติดผนังทุกด้านใช้ขอบบนของผนังเป็นระดับติดตั้ง',()=>{
  const back=api.generateLightingPlan({spec:baseSpec(),sceneRevision:1});
  assert.ok(back.suggestions.filter(item=>item.mountSurfaceId==='wall-back').every(item=>item.position.y===2.4));
  for(const type of ['corner','inline']){
    const spec={...baseSpec(),type};
    for(const fixture of api.generateLightingPlan({spec,sceneRevision:1}).suggestions.filter(item=>String(item.mountSurfaceId||'').startsWith('wall-'))){
      assert.equal(fixture.position.y,spec.H);
    }
  }
});

test('35. โคมคู่ General เล็งกลับเข้าผิวผนังเพื่อให้ทุกดวงเกิดลำแสง',()=>{
  const plan=api.generateLightingPlan({spec:baseSpec(),sceneRevision:1}),fixtures=plan.suggestions.filter(item=>item.fixtureType!=='invisible');
  assert.equal(fixtures.length,4);
  for(const fixture of fixtures){
    const source=api.fixtureLightWorldPosition(fixture);
    assert.equal(fixture.mountSurfaceId,'wall-back');
    assert.ok(Math.abs(fixture.aimTarget.x-fixture.position.x)<1e-9,'ลำแสงต้องลงตรงตามแนว X ของโคม');
    assert.ok(fixture.aimTarget.z<=.05,'Aim ต้องอยู่บนผิวผนังหลัง');
    assert.ok(fixture.aimTarget.z<source.z,'ลำแสงต้องยิงจากหัวโคมกลับเข้าหาผนัง');
  }
});

test('36. กรอบทางเข้าใช้ Downlight ฝังเสมอใต้ Canopy และตัดโคมผนังที่ถูกโครงสร้างบัง',()=>{
  const spec=baseSpec();spec.objects=[{id:'entrance-1',type:'entranceFrame',catalogId:'entrance-frame',position:{x:.5,y:0,z:1.5},size:{w:1,d:2.4,h:2.4},structure:{pierWidth:1,projection:2.4,height:2.4,thickness:.15}}];
  const targets=api.collectTargets(spec),mounts=api.collectMountSurfaces(spec),canopy=mounts.find(item=>item.mountRole==='entrance-canopy'),plan=api.generateLightingPlan({spec,sceneRevision:2}),entrance=plan.suggestions.filter(item=>item.targetType==='entrance'),logo=plan.suggestions.filter(item=>item.targetType==='logo'),general=plan.suggestions.filter(item=>item.targetType==='general');
  assert.ok(targets.some(item=>item.type==='entrance'&&item.assetId==='entrance-1'));assert.ok(canopy);assert.ok(Math.abs(canopy.undersideY-2.25)<1e-9);
  assert.equal(entrance.length,2);assert.ok(entrance.every(item=>item.fixtureType==='downlight'&&item.mountSurfaceId==='asset-entrance-1'&&Math.abs(item.position.y-2.25)<1e-9&&item.aimTarget.y===.05&&Math.abs(item.mountRotation.x-Math.PI/2)<.001));
  assert.deepEqual(Array.from(entrance,item=>item.mountAttachment.surfaceUV.v),[.28,.72]);assert.ok(entrance.every(item=>item.mountAttachment.parentAssetId==='entrance-1'));
  assert.notEqual(entrance[0].position.z,entrance[1].position.z);assert.ok(entrance.every(item=>item.aimTarget.x===item.position.x&&item.aimTarget.z===item.position.z));
  assert.ok(entrance.every(item=>api.fixtureLightWorldPosition(item).y<item.position.y),'จุดกำเนิดแสงต้องอยู่ใต้ขอบหน้าโคม');
  assert.equal(logo.length,2);assert.ok(logo.every(item=>item.fixtureType==='arm'&&item.mountSurfaceId==='wall-back'));
  assert.equal(general.length,1);assert.ok(general.every(item=>item.fixtureType==='arm'&&item.mountSurfaceId==='wall-back'&&item.position.x>spec.W/2));assert.equal(plan.suggestions.length,5);
  assert.deepEqual([...new Set(plan.suggestions.map(item=>item.beamAngle))],[.68]);
  assert.equal(plan.diagnostics.wallLayout.desiredWallCount,3);assert.equal(plan.diagnostics.wallLayout.removedFixtureIds.length,1);
});

test('37. Downlight_V1 ใช้ระนาบหน้า Mesh 0 และมี Offline bundle ตรงกับไฟล์ GLB',()=>{
  for(const token of ["k:'downlight'","baseMeshIndex:0","baseAxis:'z'","baseSide:'max'","mountMode:'ceiling-recessed'","fixture.fixtureType==='downlight'?'downlight'","this.requestFixtureTemplate('downlight')","model.rotation.x=Math.PI/2"])assert.ok(html.includes(token),token);
  assert.ok(api.PREFERENCES.includes('downlight'));assert.ok(api.FIXTURE_TYPES.includes('downlight'));
  const source=fs.readFileSync(path.join(root,'public/yp-web-ai/assets/lights/embedded-downlight-model.js'),'utf8'),offline={globalThis:{OFFLINE_LIGHT_MODELS:{}}};vm.createContext(offline);vm.runInContext(source,offline);
  const data=offline.globalThis.OFFLINE_LIGHT_MODELS.downlight;assert.ok(data.startsWith('data:model/gltf-binary;base64,'));
  const decoded=Buffer.from(data.slice(data.indexOf(',')+1),'base64'),original=fs.readFileSync(path.join(root,'public/yp-web-ai/assets/lights/Downlight_V1.glb'));assert.deepEqual(decoded,original);
});
