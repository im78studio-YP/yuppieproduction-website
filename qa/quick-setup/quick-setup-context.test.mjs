import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const source = await readFile(new URL('../../public/yp-web-ai/js/quick-setup.js', import.meta.url), 'utf8');
const html = await readFile(new URL('../../public/yp-web-ai/index.html', import.meta.url), 'utf8');
const sandbox = { globalThis: {} };
vm.runInNewContext(source, sandbox, { filename: 'quick-setup.js' });
const api = sandbox.globalThis.YPQuickSetupContext;

test('มี Business Design Context ครบทุกหมวดธุรกิจเดิม', () => {
  const expected = ['food', 'fash', 'beau', 'jewe', 'home', 'furn', 'appl', 'baby', 'heal', 'pet', 'spor', 'trav', 'tech', 'auto', 'cons', 'indu', 'other'];
  assert.deepEqual(Object.keys(api.BUSINESS_DESIGN_CONTEXTS).sort(), expected.sort());
});

test('User choice ชนะคำแนะนำหมวดธุรกิจและไม่ซ้ำ', () => {
  assert.deepEqual(
    [...api.mergeSuggestionLayers(['Demo station'], ['Demo station', 'Display screen'], ['จุดให้ข้อมูล'])],
    ['Demo station', 'Display screen', 'จุดให้ข้อมูล']
  );
});

test('Category suggestion เติมข้อมูลที่ยังว่างก่อน Generic default', () => {
  assert.deepEqual(
    [...api.mergeSuggestionLayers([], ['ชั้นโชว์แบบมีไฟ'], ['จุดให้ข้อมูล'])],
    ['ชั้นโชว์แบบมีไฟ', 'จุดให้ข้อมูล']
  );
});

test('Generic default ใช้ได้เมื่อไม่มีข้อมูลชั้นก่อนหน้า', () => {
  assert.deepEqual([...api.mergeSuggestionLayers([], [], ['จุดให้ข้อมูล'])], ['จุดให้ข้อมูล']);
});

test('Custom business category ถูกส่งเข้า Prompt', () => {
  const lines = api.categoryPromptLines({ categoryId: 'other', categoryLabel: 'ธุรกิจอื่น ๆ', customBusinessCategory: 'บริการจัดดอกไม้' });
  assert.equal(lines[0], 'บริบทหมวดธุรกิจ: บริการจัดดอกไม้');
});

test('Final suggestion ไม่สร้างองค์ประกอบซ้ำ', () => {
  const result = [...api.mergeSuggestionLayers(['จุดให้ข้อมูล'], ['จุดให้ข้อมูล'], ['จุดให้ข้อมูล'])];
  assert.deepEqual(result, ['จุดให้ข้อมูล']);
});

test('Booth preset ใช้แกน W/D เดิมและขนาดมาตรฐานตาม Wizard', () => {
  assert.deepEqual(
    Object.fromEntries(['inline', 'corner', 'penin', 'island'].map(key => {
      const value = api.boothDefaultsFor(key);
      return [key, [value.width, value.depth, value.height, value.openSides]];
    })),
    {
      inline: [6, 3, 2.4, 1],
      corner: [6, 3, 2.4, 2],
      penin: [6, 6, 2.4, 3],
      island: [6, 6, 2.4, 4]
    }
  );
});

test('Booth preset ที่ไม่รองรับไม่สร้างค่าหลอก', () => {
  assert.equal(api.boothDefaultsFor('photo360'), null);
});

test('HEX สีแบรนด์ถูก normalize และมี fallback ที่ปลอดภัย', () => {
  assert.equal(api.normalizeHexColor('f72585'), '#F72585');
  assert.equal(api.normalizeHexColor('#12abEF'), '#12ABEF');
  assert.equal(api.normalizeHexColor('pink', '#F72585'), '#F72585');
});

test('Wizard ใช้ภาพทีมติดตั้งเป็นพื้นหลังพร้อมชั้นสีเข้มเพื่อรักษาความชัดของข้อความ', () => {
  assert.match(html, /#mRelease\{[^}]*background-image:url\('assets\/wizard\/yuppie-production-build-team\.jpg'\)/);
  assert.match(html, /#mRelease:before\{[^}]*background:rgba\(5,3,8,\.7\)/);
  assert.match(html, /\.release-sheet\{[^}]*backdrop-filter:blur\(14px\)/);
});
