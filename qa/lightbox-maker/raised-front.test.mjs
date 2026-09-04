import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,'../..');
const html=fs.readFileSync(path.join(root,'public/lightbox_maker/YP-Lightbox-Studio.html'),'utf8');

test('เผื่อสวมแผ่นแสดงเฉพาะ shell มีช่วง 0.1–0.3 มม. ค่าเริ่มต้น 0.2',()=>{
  assert.match(html,/<div id="shellThick">[\s\S]*?id="shCl" min="0.1" max="0.3" step="0.05" value="0.2"/);
  assert.match(html,/show\('shellThick',sh\)/);
  assert.match(html,/sheet:\{ acrT:3, frontRim:1.2, backRim:1.2, acrLedge:2, plsT:5, plsLedge:2, cl:0.2 \}/);
  assert.ok(html.includes("['shCl','sheet.cl','num','shClV'"));
  assert.ok(html.includes('S.sheet.cl=sheetClearance(S.sheet.cl)'));
  const helper=html.match(/function sheetClearance\(value\)\{[\s\S]*?\n\}/)[0];
  const spec=html.match(/function shellSpec\(\)\{[\s\S]*?\n\}/)[0];
  const ctx={S:{box:{frame:2.4,depth:40},sheet:{}},isShellCap:()=>false,SHELL_FACE:1.2,clamp:(n,lo,hi)=>Math.max(lo,Math.min(hi,n))};
  vm.createContext(ctx);vm.runInContext(helper+'\n'+spec,ctx);
  for(const [input,expected] of [[undefined,.2],[null,.2],['',.2],['bad',.2],[0,.1],[1,.3],[.1,.1],[.15,.15],[.2,.2],[.25,.25],[.3,.3]]){
    ctx.S.sheet.cl=input;
    const result=vm.runInContext('shellSpec()',ctx);
    assert.equal(result.cl,expected);
    assert.ok(Math.abs(result.inset-(1.2+expected))<1e-9);
    assert.ok(Math.abs(result.frontInset-(1.2+expected))<1e-9);
    assert.equal(ctx.S.box.frame,2.4);
  }
  assert.ok(html.includes("lim=(side==='front'?H.frontInset:H.inset)/G.px"));
  assert.ok(html.includes('const G0=sheetLoops(false)'));
});

test('ชื่อส่งออก shell แสดง 3MF + DXF + SVG ตรงกับไฟล์ที่แนบจริง',()=>{
  assert.ok(html.includes("mfOption.textContent=sh?'3MF + DXF + SVG (แนะนำ)':'3MF รวมทุกชิ้น (แนะนำ)'"));
  assert.ok(html.includes('id="exportFormatHint"'));
  assert.match(html,/if\(isShell\(\)\)\{\s*busy\(true,'กำลังเขียนไฟล์ตัดแผ่น…'\);[\s\S]*?await cutFilesZip\(\)/);
});

test('Lightbox Maker ไม่มีโหมดชิ้นหน้ายกขอบรุ่นเดิม',()=>{
  assert.doesNotMatch(html,/<option value="raised">/);
  assert.doesNotMatch(html,/id="raisedFrontH"|id="raisedFrontW"/);
  assert.doesNotMatch(html,/function isRaisedFront\(|function addRaisedFrontSolid\(|function weldRaisedPreviewNormals\(/);
  assert.doesNotMatch(html,/raisedbase|ชิ้นหน้ายกขอบ/);
});

test('โปรเจกต์เก่าที่เคยใช้ raised ถูกย้ายไปฝหน้าถอดเปลี่ยนได้',()=>{
  assert.match(html,/if\(S\.build\.mode==='layered'\|\|S\.build\.mode==='raised'\) S\.build\.mode='service'/);
  assert.match(html,/function isFrontModule\(\)\{ return isService\(\); \}/);
});

test('ไฟล์ STL ของโมดูลฝาหน้ายังคงส่งออกครบ',()=>{
  assert.match(html,/_ฝาหน้า_รวมชั้นกระจายแสง\.stl/);
  assert.match(html,/_ตัวกล่อง\.stl/);
  assert.match(html,/_ฐาน_ฝาหลัง\.stl/);
});

test('Inline JavaScript ของ Lightbox Maker parse ได้ครบ',()=>{
  const scripts=[...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/gi)].map(match=>match[1]).filter(Boolean);
  assert.ok(scripts.length>0);
  scripts.forEach(source=>assert.doesNotThrow(()=>new Function(source)));
});
