import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const html=fs.readFileSync(new URL('../../public/lightbox_maker/YP-Lightbox-Studio.html',import.meta.url),'utf8');
const script=[...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/gi)].map(m=>m[1]).join('\n');
function fixture(){
  const ctx=vm.createContext({document:{readyState:'loading',addEventListener(){}},window:{},TextEncoder,console});
  vm.runInContext(script,ctx);
  vm.runInContext(`
    S.box.W=20; S.box.H=16; S.backing={enabled:true,offset:0,thickness:3};
    G={gw:100,gh:80,px:0.2,panel:new Uint8Array(8000),empty:false};
    for(let y=20;y<60;y++)for(let x=10;x<45;x++)G.panel[y*100+x]=1;
    for(let y=25;y<35;y++)for(let x=60;x<70;x++)G.panel[y*100+x]=1;
    PB=panelBounds();
  `,ctx);
  return ctx;
}
const run=(ctx,s)=>vm.runInContext(s,ctx);

test('Shell does not automatically expand the logo; clear backing offset remains available',()=>{
  assert.doesNotMatch(html,/shellAutoOffset|shellPaddedGrid|shapeBorderMM/);
  assert.ok(html.includes('const total=acc;'));
  assert.ok(html.includes('function backingGeometry()'));
});

test('Backing defaults preserve old projects; offset and thickness are independent of frame',()=>{
  const c=fixture();
  assert.equal(run(c,'defaults().backing.enabled'),false);
  assert.equal(run(c,'defaults().backing.offset'),5);
  assert.equal(run(c,'defaults().backing.thickness'),3);
  assert.equal(run(c,'S.backing={};backingSpec().offset'),5);
  assert.equal(run(c,'S.backing={offset:99,thickness:-1};backingSpec().offset'),30);
  assert.equal(run(c,'backingSpec().thickness'),1);
  assert.equal(run(c,'S.box.frame'),2.4);
});

test('Outward offset merges detached symbols without mutating the panel and fills internal holes',()=>{
  const c=fixture(),before=run(c,'Array.from(G.panel).join()');
  assert.equal(run(c,'backingGeometry().count'),2);
  assert.equal(run(c,'S.backing.offset=2;backingGeometry().count'),1);
  assert.equal(run(c,'Array.from(G.panel).join()'),before);
  assert.equal(run(c,'backingGeometry().groups.every(g=>g.holes.length===0)'),true);
  assert.equal(run(c,'backingGeometry()===backingGeometry()'),true);
});

test('Padded raster allows offsets beyond the original bed with bounded allocation',()=>{
  const c=fixture();
  const result=run(c,`(()=>{const p=new Uint8Array(100).fill(1);const r=backingRaster(p,10,10,1,5);return {count:r.mask.reduce((a,b)=>a+b,0),cells:r.w*r.h,edge:r.mask.slice(0,r.w).some(Boolean)};})()`);
  assert.ok(result.count>100);assert.ok(result.cells<=1500000);assert.equal(result.edge,false);
  assert.ok(run(c,'S.backing.offset=30;backingGeometry().groups[0].out.some(p=>p[0]<-20)'));
});

test('Transparent backing sits behind the assembly and is omitted from print meshes',()=>{
  const c=fixture();
  const m=run(c,'backingPart()');
  assert.equal(m.display,true);assert.equal(m.kind,'backing');assert.equal(m.opacity,.25);
  assert.ok(m.n>0);assert.equal(m.z0,run(c,'geomStack().total'));
  assert.equal(run(c,'appendBacking([],true).length'),0);
  assert.equal(run(c,'S.backing.enabled=false;appendBacking([],false).length'),0);
  assert.ok(html.includes('const pr=parts.filter(p=>!p.display)'));
  assert.ok(html.includes("mode==='plate' && M.display"));
});

test('DXF and SVG have the same unmirrored 1:1 outline with no negative SVG clipping',()=>{
  const c=fixture();run(c,'S.backing.offset=2');
  const files=run(c,'backingCutFiles()');
  const text=new TextDecoder();
  const dxf=text.decode(files[0].data),svg=text.decode(files[1].data),note=text.decode(files[2].data);
  assert.match(dxf,/CLEAR_BACKING/);assert.match(dxf,/\$INSUNITS\n70\n4/);
  assert.match(svg,/width="[0-9.]+mm" height="[0-9.]+mm"/);
  assert.doesNotMatch(svg,/NaN|Infinity/);assert.match(note,/จำนวนชิ้นแยก 1/);
  assert.match(note,/ไม่รวมใน 3MF\/STL/);
  assert.ok(files[0].name.endsWith('.dxf'));assert.ok(files[1].name.endsWith('.svg'));
});

test('Slider updates reuse printable meshes; state and file export are wired',()=>{
  assert.ok(html.includes("['backingOffset','backing.offset','num','backingOffsetV',v=>v+' มม.','b']"));
  assert.ok(html.includes("if(mode==='b'&&!full){ refreshBackingPreview(); return; }"));
  const refresh=html.match(/function refreshBackingPreview\(\)\{[\s\S]*?\n\}/)[0];
  assert.doesNotMatch(refresh,/buildGrid\(|buildParts\(/);
  assert.ok(html.includes("'sheet','backing']"));
  assert.ok(html.includes('S.backing=backingSpec()'));
  assert.ok(html.includes('_แผ่นรองหลังใส_DXF_SVG.zip'));
});

test('Backing supports every build mode and never changes inset shell cutting outlines',()=>{
  const c=fixture();
  for(const mode of ['full','service','face5d','face5dChamfer','shell','shellCap']){
    run(c,`S.build.mode=${JSON.stringify(mode)};S.backing.enabled=true;`);
    assert.equal(run(c,'backingPart().z0'),run(c,'geomStack().total'));
  }
  run(c,'G.edtIn=edtToOutside(G.panel,G.gw,G.gh);S.backing.enabled=false');
  const before=run(c,'JSON.stringify(sheetLoops(false))');
  run(c,'S.backing.enabled=true;S.backing.offset=20;backingGeometry()');
  assert.equal(run(c,'JSON.stringify(sheetLoops(false))'),before);
});

test('Shell preview has milky white 80% transmission acrylic and opaque white plaswood',()=>{
  const c=fixture();
  run(c,`S.build.mode='shell';S.hw.hole='none';G.edtIn=edtToOutside(G.panel,G.gw,G.gh);`);
  const cuts=run(c,'JSON.stringify(sheetLoops(false))');
  const parts=run(c,'buildShell(false)'),front=parts.find(p=>p.kind==='acrylic'),back=parts.find(p=>p.kind==='plaswood');
  for(const p of [front,back]){
    assert.ok(p.n>0);assert.equal(p.hex,'#FFFFFF');assert.equal(p.display,true);
    assert.equal(run(c,`skipIn({display:true},'plate')`),true);
  }
  assert.equal(front.lightTransmission,.8);assert.equal(front.glow,true);
  assert.equal(front.opacity,undefined,'Milky diffusion must not be confused with 80% see-through alpha');
  assert.equal(back.opacity,undefined);assert.equal(back.glow,undefined);
  assert.equal(front.z0,0);assert.equal(front.z1,run(c,'shellSpec().acrT'));
  assert.equal(back.z0,run(c,'shellSpec().zB2'));
  assert.equal(back.z1-back.z0,run(c,'shellSpec().plsT'));
  assert.ok(run(c,"EXPLODE.acrylic>0&&EXPLODE.plaswood<0&&EXPLODE.backing<EXPLODE.plaswood"));
  assert.equal(run(c,'buildShell(true).some(p=>p.display)'),false);
  assert.equal(run(c,'JSON.stringify(sheetLoops(false))'),cuts);
  assert.ok(html.includes('emis*uTransmission'));
});

function capFixture(){
  const c=fixture();
  run(c,`S.build.mode='shellCap';S.hw.hole='none';G.edtIn=edtToOutside(G.panel,G.gw,G.gh);`);
  return c;
}

test('Cap is a separate opt-in mode with original front contour and unchanged inset back',()=>{
  const c=capFixture();
  assert.equal(run(c,'defaults().build.mode'),'service');
  assert.match(html,/<option value="shellCap">/);
  const panel=run(c,'JSON.stringify(Array.from(G.panel))');
  const front=run(c,'JSON.stringify(sheetLoops(false))');
  assert.equal(front,run(c,'JSON.stringify(contoursOf(G.panel,G.gw,G.gh,true))'));
  assert.ok(run(c,"cutMetrics(sheetLoops(false)).areaM2>cutMetrics(sheetLoops(false,'back')).areaM2"));
  const back=run(c,"JSON.stringify(sheetLoops(false,'back'))");
  run(c,'S.sheet.cl=.3;S.sheet.acrLedge=8;buildShell(false)');
  assert.equal(front,run(c,'JSON.stringify(sheetLoops(false))'));
  assert.equal(panel,run(c,'JSON.stringify(Array.from(G.panel))'));
  run(c,"S.sheet.cl=.2;S.build.mode='shell'");
  assert.notEqual(back,run(c,'JSON.stringify(sheetLoops(false))'));
  assert.equal(back,run(c,"JSON.stringify(sheetLoops(false,'back'))"));
});

test('Cap has no front ledge, touches white acrylic, and printed vertices are grounded',()=>{
  const c=capFixture();
  const spec=run(c,'shellSpec()');
  assert.equal(spec.lA,0);assert.equal(spec.fA,0);
  run(c,'globalThis.capParts=buildShell(false);globalThis.body=capParts.find(p=>!p.display)');
  const front=run(c,"capParts.find(p=>p.kind==='acrylic')");
  assert.equal(front.hex,'#FFFFFF');assert.equal(front.lightTransmission,.8);
  assert.equal(front.z1,run(c,'body.z0'));
  assert.equal(run(c,'body.printBase'),spec.acrT);
  assert.equal(run(c,'Math.min(...indexMesh(body).V.filter((_,i)=>i%3===2))'),0);
  const bytes=run(c,'stlOf(body)'),dv=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
  let minZ=Infinity;
  for(let i=0;i<dv.getUint32(80,true);i++)for(const j of [5,8,11])minZ=Math.min(minZ,dv.getFloat32(84+i*50+j*4,true));
  assert.equal(minZ,0);
  assert.equal(run(c,'body.z0'),spec.acrT,'Export must not mutate assembled preview');
});

test('Thin cap still has a front sheet when inset rear disappears; no empty rear cut files',()=>{
  const c=capFixture();
  run(c,`G.panel.fill(0);for(let y=25;y<35;y++)for(let x=10;x<70;x++)G.panel[y*100+x]=1;
    G.edtIn=edtToOutside(G.panel,G.gw,G.gh);PB=panelBounds();`);
  assert.ok(run(c,'sheetLoops(false).length>0'));
  assert.equal(run(c,"sheetLoops(false,'back').length"),0);
  assert.equal(run(c,"buildShell(false).some(p=>p.kind==='acrylic')"),true);
  assert.equal(run(c,"buildShell(false).some(p=>p.kind==='plaswood')"),false);
  const files=run(c,'sheetCutFiles()');
  assert.equal(files.length,3);
  assert.equal(files.some(f=>f.name.includes('พลาสวูด')),false);
  assert.match(new TextDecoder().decode(files.at(-1).data),/ไม่มีพื้นที่ฝาหลังสวมใน/);
});

test('Inset shell uses a thin front mouth and flat main-wall shoulder without logo expansion',()=>{
  const c=capFixture();run(c,"S.build.mode='shell';S.sheet.frontRim=1.2");
  const spec=run(c,'shellSpec()');
  assert.equal(spec.rim,1.2);assert.equal(spec.frontInset,1.4);
  assert.equal(spec.inset,2.6);assert.equal(spec.frontSupport,1);
  assert.equal(spec.gA,3);assert.equal(spec.zA2,3);assert.equal(spec.fA,0);
  assert.equal(spec.total,48);assert.equal(run(c,'S.box.frame'),2.4);
  assert.ok(html.includes('slab(H.rim,0,H.acrT)'));
  assert.doesNotMatch(html,/slab\(F\+H\.lA/);
  const before=run(c,'JSON.stringify(Array.from(G.panel))');
  const parts=run(c,'buildShell(false)');
  assert.equal(parts.find(p=>p.kind==='acrylic').z1,3);
  assert.equal(parts.find(p=>p.kind==='shell').z0,0);
  assert.equal(run(c,'JSON.stringify(Array.from(G.panel))'),before);
});

test('A four-mm stroke retains an inset acrylic face even when its rear sheet disappears',()=>{
  const c=capFixture();
  run(c,`S.build.mode='shell';G.panel.fill(0);
    for(let y=20;y<40;y++)for(let x=10;x<70;x++)G.panel[y*100+x]=1;
    G.edtIn=edtToOutside(G.panel,G.gw,G.gh);PB=panelBounds();`);
  assert.ok(run(c,'sheetLoops(false).length>0'));
  assert.equal(run(c,"sheetLoops(false,'back').length"),0);
  assert.equal(run(c,"buildShell(false).some(p=>p.kind==='acrylic')"),true);
  const files=run(c,'sheetCutFiles()');assert.equal(files.length,3);
  assert.equal(files.some(f=>f.name.includes('พลาสวูด')),false);
  const note=new TextDecoder().decode(files.at(-1).data);
  assert.match(note,/1.40 มม.\/ด้าน/);assert.match(note,/ไม่มีพื้นที่ฝาหลังสวมใน/);
});

test('Front rim adjustment changes only front cutting contour, not rear or outer logo',()=>{
  const c=capFixture();run(c,"S.build.mode='shell'");
  const rear=run(c,"JSON.stringify(sheetLoops(false,'back'))"),front=run(c,'JSON.stringify(sheetLoops(false))');
  const panel=run(c,'JSON.stringify(Array.from(G.panel))');
  run(c,'S.sheet.frontRim=.8;S.sheet.acrLedge=8;buildShell(false)');
  assert.notEqual(run(c,'JSON.stringify(sheetLoops(false))'),front);
  assert.equal(run(c,"JSON.stringify(sheetLoops(false,'back'))"),rear);
  assert.equal(run(c,'JSON.stringify(Array.from(G.panel))'),panel);
  assert.equal(run(c,'shellSpec().zA2'),3,'Legacy front ledge must not add a new projection');
  assert.ok(run(c,'S.sheet.frontRim=2.4;shellSpec().frontSupport<.5'));
  assert.match(html,/H.frontSupport<0.5\?'err':'ok'/);
});

test('Inset front and rear exports use separate contours and millimetre units',()=>{
  const c=capFixture();run(c,"S.build.mode='shell'");
  const files=run(c,'sheetCutFiles()'),decoder=new TextDecoder();
  assert.equal(files.length,5);
  const front=decoder.decode(files[0].data),back=decoder.decode(files[2].data);
  assert.match(front,/\$INSUNITS\n70\n4/);assert.match(back,/\$INSUNITS\n70\n4/);
  assert.notEqual(front.replaceAll('ACRYLIC','PLASWOOD'),back);
  const note=decoder.decode(files[4].data);
  assert.match(note,/1.40 มม.\/ด้าน/);assert.match(note,/2.60 มม.\/ด้าน/);
  assert.match(note,/หน้าและหลังคนละเส้นตัด/);
  assert.doesNotMatch(note,/ทั้งสองแผ่นใช้เส้นตัดเดียวกัน/);
});
