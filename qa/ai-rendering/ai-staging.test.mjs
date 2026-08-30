import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const source = await readFile(new URL('../../public/yp-web-ai/js/ai-staging.js', import.meta.url), 'utf8');
const sandbox = { globalThis: {} };
vm.runInNewContext(source, sandbox, { filename: 'ai-staging.js' });
const api = sandbox.globalThis.YPAIStaging;

test('Auto-Staging defaults ตรงกับ Project State ที่กำหนด', () => {
  const state = api.normalizeAIStaging();
  assert.equal(state.enabled, true);
  assert.equal(state.density, 'medium');
  assert.equal(state.allowFurniture, true);
  assert.equal(state.allowProducts, true);
  assert.equal(state.allowPeople, true);
  assert.equal(state.allowDecor, true);
  assert.equal(state.allowPlants, true);
  assert.equal(state.allowNewPermanentStructures, false);
  const freedom = api.normalizeAIRenderFreedom({});
  assert.equal(freedom.geometryFidelity, 10);
  assert.equal(freedom.stagingFreedom, 6);
});

test('Geometry Fidelity คงที่ 10 แม้ State เก่าระบุค่าต่ำกว่า', () => {
  const freedom = api.normalizeAIRenderFreedom({ geometryFidelity: 2, stagingFreedom: 8 });
  assert.equal(freedom.geometryFidelity, 10);
  assert.equal(freedom.stagingFreedom, 8);
});

test('ไม่มี selectedAssets ให้สร้างบูธที่เปิดใช้งานจริงโดยล็อก Geometry', () => {
  const prompt = api.buildAutoStagingPromptLines({
    settings: {}, selectedAssetCount: 0, business: 'เทคโนโลยีและไอที', brandColor: '#F72585', renderStyle: 'Futuristic Tech'
  }).join('\n');
  assert.match(prompt, /บูธที่เปิดใช้งานจริง/);
  assert.match(prompt, /รักษา Geometry พิกัด สัดส่วน และมุมกล้องจากแบบ 3 มิติเดิมอย่างเคร่งครัด/);
  assert.match(prompt, /ระดับองค์ประกอบ ปานกลาง/);
  assert.match(prompt, /เฟอร์นิเจอร์ลอยตัว/);
  assert.match(prompt, /AI Suggested \/ Render Staging/);
});

test('มี selectedAssets แล้ว Prompt สั่งคงของเดิมและห้ามวางชน', () => {
  const prompt = api.buildAutoStagingPromptLines({ settings: {}, selectedAssetCount: 3 }).join('\n');
  assert.match(prompt, /คงไว้ทั้งหมด/);
  assert.match(prompt, /ห้ามชนหรือซ้อนกับอุปกรณ์เดิม/);
});

test('ปิด Auto-Staging แล้วแสดงเฉพาะองค์ประกอบในแบบ 3D', () => {
  const prompt = api.buildAutoStagingPromptLines({ settings: { enabled: false }, selectedAssetCount: 0 }).join('\n');
  assert.match(prompt, /สถานะ: ปิด/);
  assert.match(prompt, /แสดงเฉพาะองค์ประกอบที่อยู่ในแบบ 3D/);
  assert.doesNotMatch(prompt, /บูธที่เปิดใช้งานจริง/);
});

test('AI suggestions ถูกบังคับให้อยู่นอก BOQ และ Confirmed Geometry', () => {
  const [suggestion] = api.normalizeAIStaging({ suggestions: [{ id: 'render-chair', name: 'เก้าอี้ประกอบภาพ', includedInBOQ: true }] }).suggestions;
  assert.equal(suggestion.status, 'AI Suggested / Render Staging');
  assert.equal(suggestion.confirmed, false);
  assert.equal(suggestion.countsAsSelectedAsset, false);
  assert.equal(suggestion.includedInBOQ, false);
  assert.equal(suggestion.includedInProductionScope, false);
  assert.equal(suggestion.includedInConfirmedGeometry, false);
});

test('Permanent structures ไม่สามารถถูกปลดล็อกผ่าน State ที่รับเข้ามา', () => {
  assert.equal(api.normalizeAIStaging({ allowNewPermanentStructures: true }).allowNewPermanentStructures, false);
});
