import test from 'node:test';
import assert from 'node:assert/strict';
await import('../../public/yp-web-ai/js/project-store.js');
await import('../../public/yp-web-ai/js/handoff-package.js');
const api=globalThis.YPHandoffPackage,store=globalThis.YPProjectStore;
const brief={contact:'ลูกค้าทดสอบ',phone:'081-234-5678',notes:'https://example.test <script>alert(1)</script>'};
const base=()=>({spec:{version:3,W:6,D:3,H:2.4,view:'three',objects:[],brand:'ACME',logo:null},assets:[]});
const project=()=>{const p=store.create(base());store.duplicate(p,base());p.variants.B.spec.W=8;return p;};
export async function unzip(blob){
  const bytes=new Uint8Array(await blob.arrayBuffer()),v=new DataView(bytes.buffer),files={};let pos=0;
  while(v.getUint32(pos,true)===0x04034b50){const size=v.getUint32(pos+18,true),n=v.getUint16(pos+26,true),extra=v.getUint16(pos+28,true),name=new TextDecoder().decode(bytes.slice(pos+30,pos+30+n)),start=pos+30+n+extra;files[name]=bytes.slice(start,start+size);assert.equal(api.crc32(files[name]),v.getUint32(pos+14,true));pos=start+size;}
  assert.equal(v.getUint32(pos,true),0x02014b50);assert.equal(v.getUint32(bytes.length-22,true),0x06054b50);assert.equal(v.getUint32(bytes.length-6,true),pos);return files;
}
test('validates required contact, phone and calendar/order',()=>{assert.equal(api.validateBrief(brief).contact,brief.contact);for(const bad of [{contact:''},{phone:'ab1234'},{install:'2026-02-30'},{install:'2026-09-10',dismantle:'2026-09-09'}])assert.throws(()=>api.validateBrief({...brief,...bad}));});
test('brief allows plain-text URLs and escapes HTML in summary',()=>{const html=api.summaryHTML(api.summary(project(),brief),false);assert.ok(!html.includes('<script>'));assert.ok(html.includes('&lt;script&gt;'));assert.ok(html.includes('ไม่มีภาพบูธ'));assert.ok(!html.includes('<img'));});
test('selection excludes other variant, preserves original, remains editable',async()=>{const p=project(),selected=api.selectProject(p,'B');assert.equal(selected.variants.A,null);assert.ok(p.variants.A);assert.equal(store.fromText(await store.toText(selected)).variants.B.spec.W,8);assert.throws(()=>api.selectProject(p,'C'));});
test('ZIP CRC matches known vector and rejects unsafe names',async()=>{assert.equal(api.crc32(new TextEncoder().encode('123456789')),0xcbf43926);await assert.rejects(api.zip([{name:'../bad',data:'x'}]));});
test('package contains selected project, safe summary, UTF8 details; no image claim',async()=>{const out=await api.build(project(),brief,null),files=await unzip(out.blob);assert.deepEqual(Object.keys(files),['project.ypbooth.json','brief.json','summary.html','README.txt']);const info=JSON.parse(new TextDecoder().decode(files['brief.json']));assert.equal(info.brief.contact,brief.contact);assert.equal(info.imageIncluded,false);assert.equal(info.status,'prepared-offline-not-sent');const p=store.fromText(new TextDecoder().decode(files['project.ypbooth.json']));assert.equal(p.active,'B');assert.equal(p.variants.A,null);assert.equal(p.brief,undefined);});
test('PNG included only when supplied as PNG',async()=>{const out=await api.build(project(),brief,new Blob(['png'],{type:'image/png'})),files=await unzip(out.blob);assert.ok(files['booth.png']);assert.ok(new TextDecoder().decode(files['summary.html']).includes('src="booth.png"'));});
const completeBrief={...brief,event:'Expo',venue:'Hall 1',eventDate:'2026-09-10',install:'2026-09-09',dismantle:'2026-09-11'};
const readySpec=()=>({...base().spec,type:'inline',logo:'data:image/png;base64,aGVsbG8=',objects:[{id:'item',catalogId:'counter',size:{w:1,d:1,h:1},position:{x:1,y:0,z:1},unitPrice:0}]});
test('readiness checks missing details and dates without blocking export',()=>{
  const report=api.inspect(base().spec,brief,[]);assert.ok(report.warnings.some(w=>w.code==='missing-logo'));assert.ok(report.warnings.some(w=>w.field==='eventDate'));assert.equal(report.kind,'advisory-only');
  assert.ok(api.inspect(readySpec(),{...completeBrief,install:'2026-09-11'},[]).warnings.some(w=>w.code==='install-after-event'));
  assert.throws(()=>api.validateBrief({...brief,eventDate:'2026-02-30'}));
});
test('bounds include every side with 5mm tolerance; never modify input',()=>{
  const spec=readySpec(),before=structuredClone(spec),geometry=[{id:'item',bounds:{x0:-.004,x1:6.004,z0:0,z1:3}}];
  assert.equal(api.inspect(spec,completeBrief,geometry).warnings.length,0);
  geometry[0].bounds={x0:-.2,x1:6.3,z0:-.1,z1:3.4};const report=api.inspect(spec,completeBrief,geometry);
  assert.equal(report.warnings.length,1);assert.equal(report.warnings[0].objectId,'item');assert.equal(report.warnings[0].excess.right,.2999999999999998);assert.equal(report.checkedObjects,1);assert.deepEqual(spec,before);
});
test('unsupported layout and missing geometry explicitly remain unchecked',()=>{
  const spec=readySpec();assert.equal(api.inspect(spec,completeBrief,[]).warnings[0].code,'bounds-unavailable');
  spec.type='custom';const report=api.inspect(spec,completeBrief,[]);assert.equal(report.checkedObjects,0);assert.equal(report.warnings[0].code,'unsupported-boundary');
});
test('warnings travel in JSON and escaped HTML even when outside the booth',async()=>{
  const spec=readySpec();spec.objects[0].label='Counter';const p=store.create({spec,assets:[]});
  const {blob}=await api.build(p,completeBrief,null,[{id:'item',bounds:{x0:-1,x1:1,z0:0,z1:1}}]);const files=await unzip(blob),decoder=new TextDecoder();
  const data=JSON.parse(decoder.decode(files['brief.json']));assert.equal(data.readiness.warnings[0].code,'outside-booth');assert.ok(decoder.decode(files['summary.html']).includes('จุดที่ต้องให้ทีมตรวจต่อ'));assert.ok(decoder.decode(files['summary.html']).includes('Counter'));
});
