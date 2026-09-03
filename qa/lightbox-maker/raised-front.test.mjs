import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,'../..');
const html=fs.readFileSync(path.join(root,'public/lightbox_maker/YP-Lightbox-Studio.html'),'utf8');

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
