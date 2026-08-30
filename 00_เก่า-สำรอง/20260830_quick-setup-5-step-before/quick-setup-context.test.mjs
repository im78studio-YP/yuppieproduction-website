import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const source = await readFile(new URL('../../public/yp-web-ai/js/quick-setup.js', import.meta.url), 'utf8');
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
