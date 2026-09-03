import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,'../..');
const html=fs.readFileSync(path.join(root,'public/lightbox_maker/YP-Lightbox-Studio.html'),'utf8');

test('ชั้นสีหน้า 5D เป็นรูปแบบงานใหม่ ไม่ใช่ตัวเลือกย่อยของฝหน้ามาตรฐาน',()=>{
  assert.match(html,/<option value="face5d">ชั้นสีหน้า 5D — ฝาหน้ายกสูง \+ ตัวกล่อง \+ ฝาหลัง<\/option>/);
  assert.doesNotMatch(html,/id="faceStyle"/);
  assert.doesNotMatch(html,/\['faceStyle','face\.style'/);
  assert.match(html,/build:\{ mode:'service' \}/);
});

test('พารามิเตอร์ความสูงและรัศมีขอบทำงานเฉพาะรูปแบบงาน 5D',()=>{
  assert.match(html,/id="face5dH" min="3" max="10" step="0\.5" value="5"/);
  assert.match(html,/id="face5dR" min="0\.6" max="2\.4" step="0\.2" value="2"/);
  assert.match(html,/function isFace5D\(\)\{ return !!\(S\.build&&S\.build\.mode==='face5d'\); \}/);
  assert.match(html,/show\('flatColorTRow',!sh\); show\('face5dRow',!sh&&isFace5D\(\)\);/);
  assert.match(html,/show\('face5dRadiusRow',!sh&&isFace5D\(\)\);/);
  assert.match(html,/const colorT=clamp\(\+b\.colorT\|\|0\.6,0\.4,2\.4\);/);
  assert.match(html,/const faceH=isFace5D\(\)\?clamp\(\+\(S\.face&&S\.face\.height5d\)\|\|5,3,10\):colorT;/);
  assert.match(html,/const frameZ0=isFace5D\(\)\?faceH:\(isLayered\(\)\?colorT:bgT\);/);
});

test('ขอบหน้า 5D ใช้ fillet เฉพาะขอบนอกสุด ผิวสีด้านในราบเสมอกัน',()=>{
  assert.match(html,/const FACE5D_FILLET_SEGMENTS=5;/);
  assert.match(html,/function addRoundedPrism\(M,groups,z0,z1,radius,outerOnly=false\)/);
  assert.match(html,/rounded=!outerOnly\|\|li===0;/);
  assert.match(html,/function splitOuterEdgeMask\(mask,support=G\.panel\)/);
  assert.match(html,/const split=splitOuterEdgeMask\(wallMk,frontFit\|\|P\);/);
  assert.match(html,/addRoundedSolid\(W,split\.edge,0,st\.faceH,[\s\S]*?,undefined,undefined,true\);/);
  assert.match(html,/addSolid\(W,split\.inner,0,st\.faceH\);/);
  assert.match(html,/addSolid\(M,capMk,0,layerT\);/);
  assert.match(html,/M\.smoothN\.set\(ti,/);
  assert.match(html,/const s=i\*12, sn=M\.smoothN&&M\.smoothN\.get\(i\);/);
  assert.match(html,/M\.gloss=true;/);
});

test('5D แยกผิวสีบางออกจากผนังยกกลวงเพื่อเปิดทางเดินแสง',()=>{
  assert.match(html,/const face5dWallFit=isFace5D\(\)\?maskWhere\(i=>frontFit\[i\]&&\(!tongueFit\|\|!tongueFit\[i\]\)\):null;/);
  assert.match(html,/const wallMk=maskWhere\(i=>mk\[i\]&&face5dWallFit\[i\]\);/);
  assert.match(html,/const capMk=maskWhere\(i=>mk\[i\]&&!face5dWallFit\[i\]\);/);
  assert.match(html,/W\.kind='face5dwall'; W\.module='front'; W\.glow=false;/);
  assert.match(html,/const frontZ=st\.colorT, seatZ=frontZ\+st\.faceBaseT;/);
  assert.match(html,/const lipFrontZ=st\.colorT\+st\.faceBaseT;/);
  assert.match(html,/const lipBackZ=isFace5D\(\)\?st\.faceH:lipFrontZ;/);
  assert.match(html,/addSolid\(lip,lipFit,lipFrontZ-ZEPS,lipBackZ\+lipHeight\);/);
  assert.match(html,/const EXPLODE=\{color:46,face5dwall:46,diffuser:46,lightseal:46,/);
  assert.match(html,/สีหน้า 5D หนา \$\{st\.colorT\.toFixed\(1\)\} มม\. · ผนังยกกลวงสูง \$\{st\.faceH\.toFixed\(1\)\} มม\./);
});

test('เกาะสีในช่องว่างถูกแยกจาก component ที่สัมผัสขอบนอกจริง',()=>{
  const match=html.match(/function splitOuterEdgeMask\(mask,support=G\.panel\)\{[\s\S]*?\n\}\nfunction maskGlow/);
  assert.ok(match,'ต้องพบฟังก์ชัน splitOuterEdgeMask');
  const src=match[0].replace(/\nfunction maskGlow[\s\S]*$/,'');
  const gw=9, gh=7, panel=new Uint8Array(gw*gh), support=new Uint8Array(gw*gh), mask=new Uint8Array(gw*gh);
  panel.fill(1); // panel เดิมกว้างกว่า frontFit หลังร่นขอบ
  for(let y=1;y<=5;y++) for(let x=1;x<=7;x++) support[y*gw+x]=1;
  mask[3*gw+1]=1; // component ริม frontFit — ต้องมน แม้ยังอยู่ภายใน panel เดิม
  mask[3*gw+4]=1; // เกาะด้านในที่ถูกเนื้ออื่นล้อม — ต้องราบ
  const split=new Function('G',`${src}; return splitOuterEdgeMask;`)({gw,gh,panel})(mask,support);
  assert.equal(split.edge[3*gw+1],1);
  assert.equal(split.inner[3*gw+1],0);
  assert.equal(split.edge[3*gw+4],0);
  assert.equal(split.inner[3*gw+4],1);
});

test('5D ยังคงโครงสร้างสามโมดูล แต่มีชื่อและเอกสารผลิตแยกจากงานมาตรฐาน',()=>{
  assert.match(html,/function isService\(\)[\s\S]*?S\.build\.mode==='face5d'/);
  assert.match(html,/function frontModuleLabel\(\)\{ return isFace5D\(\)\?'ชั้นสีหน้า 5D \+ กันแสงรั่ว'/);
  assert.match(html,/if\(isFace5D\(\)\) download\(blob,`\$\{name\}_ชุดชั้นสีหน้า_5D\.3mf`\)/);
  assert.match(html,/ชั้นสีหน้าแบบ 5D: ผิวสีหนา /);
});

test('ตัวกล่อง 5D ลงฐานพิมพ์ที่ระดับเดียวกับชิ้นหน้าและฝาหลัง',()=>{
  assert.match(html,/function printBaseZ\(parts\)\{[\s\S]*?return Number\.isFinite\(z\)\?z:0;[\s\S]*?\}/);
  assert.match(html,/const peers=M\.module\?\(V3\.parts\|\|\[\]\)\.filter\(p=>p\.module===M\.module\):\[M\];/);
  assert.match(html,/return mkM\(1,0,0, 0,0,1, 0,-1,0, px-BED\/2, -baseZ, BED\/2-py\);/);
  assert.match(html,/const ids=group\.map\(r=>r\.id\), baseZ=printBaseZ\(group\.map\(r=>r\.p\)\);/);
  assert.match(html,/\$\{place\.x\} \$\{place\.y\} \$\{-baseZ\}/);
  assert.match(html,/M\.a\[i\+5\]-=baseZ; M\.a\[i\+8\]-=baseZ; M\.a\[i\+11\]-=baseZ;/);
});

test('state 5D ชั่วคราวจากรุ่นก่อนถูกย้ายเข้ารูปแบบงานใหม่',()=>{
  assert.match(html,/if\(S\.face&&S\.face\.style==='5d'&&S\.build\.mode==='service'\) S\.build\.mode='face5d'/);
});
