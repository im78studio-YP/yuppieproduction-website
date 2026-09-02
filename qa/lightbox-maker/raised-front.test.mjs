import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,'../..');
const html=fs.readFileSync(path.join(root,'public/lightbox_maker/YP-Lightbox-Studio.html'),'utf8');

test('Lightbox Maker มีรูปแบบงานชิ้นหน้ายกขอบและตัวปรับความสูง',()=>{
  assert.match(html,/<option value="raised">ชิ้นหน้ายกขอบ — ลาด 45° รอบรูปทรง<\/option>/);
  assert.match(html,/id="raisedFrontH"[^>]+min="0\.4"[^>]+max="10"[^>]+step="0\.2"/);
  assert.match(html,/\['raisedFrontH','build\.raisedH','num','raisedFrontHV'/);
});

test('ชิ้นหน้ายกขอบถูกจัดเป็นสามโมดูลแยกบนฐานพิมพ์และไฟล์ส่งออก',()=>{
  assert.match(html,/function isFrontModule\(\)\{ return isService\(\)\|\|isRaisedFront\(\); \}/);
  assert.match(html,/function platePack\(\)[\s\S]*?if\(isFrontModule\(\)\)\{/);
  assert.match(html,/M\.module=isFrontModule\(\)\?'front':''/);
  assert.match(html,/FM\.module=isFrontModule\(\)\?'box':''/);
  assert.match(html,/BM\.module=isFrontModule\(\)\?'back':''/);
  assert.match(html,/const files=isFrontModule\(\)\? \[/);
});

test('เมชชิ้นหน้ายกขอบใช้ระยะ X\/Y เท่ากับระยะ Z เพื่อสร้างมุม 45°',()=>{
  assert.match(html,/function addRaisedFrontSolid\(M,mask,thickness\)/);
  assert.match(html,/inset=Math\.max\(0,rise-mid\)/);
  assert.match(html,/if\(isRaisedFront\(\)\) addRaisedFrontSolid\(M,mk,layerT\)/);
  assert.match(html,/frameZ0=\(isLayered\(\)\?colorT:bgT\)\+frontRaise/);
  assert.match(html,/stepTarget=clamp\(\(G\.px\|\|\.2\)\*\.65,\.09,\.12\),steps=clamp\(Math\.ceil\(rise\/stepTarget\),8,32\)/);
});

test('Preview และไฟล์ส่งออกอ้างอิง buildParts ชุดเดียวและระบุโหมดในเอกสารผลิต',()=>{
  assert.match(html,/function glBuild\(\)[\s\S]*?const parts=buildParts\(false\)/);
  assert.match(html,/async function doExport\(\)[\s\S]*?const parts=buildParts\(\)/);
  assert.match(html,/ชิ้นหน้ายกขอบ45องศา/);
  assert.match(html,/รูปแบบชิ้นหน้า: ยกขอบลาด 45° สูง/);
  assert.match(html,/ชิ้นหน้าไม่มีผิวสัมผัสฐานพิมพ์/);
});

test('Inline JavaScript ของ Lightbox Maker parse ได้ครบ',()=>{
  const scripts=[...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/gi)].map(match=>match[1]).filter(Boolean);
  assert.ok(scripts.length>0);
  scripts.forEach(source=>assert.doesNotThrow(()=>new Function(source)));
});
