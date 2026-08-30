import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const source = await readFile(new URL('../../public/yp-web-ai/js/ai-render-pipeline.js', import.meta.url), 'utf8');
let tick = 0;
const sandbox = {
  globalThis: {
    performance: { now: () => ++tick },
    crypto: { randomUUID: () => `test-${tick}` },
    console
  },
  performance: { now: () => ++tick },
  console,
  setTimeout,
  clearTimeout,
  Date,
  Math,
  Promise,
  Error
};
vm.runInNewContext(source, sandbox, { filename: 'ai-render-pipeline.js' });
const api = sandbox.globalThis.YPAIRenderPipeline;
const reference = { blob: { size: 440_507 }, width: 1536, height: 1137 };

test('ประกาศขั้นตอนจับเวลาครบและเรียงตาม Render Pipeline', () => {
  assert.deepEqual(Array.from(api.PIPELINE_STAGES), [
    'buildPrompt', 'prepareReferenceImage', 'uploadReferenceImage', 'sendRenderRequest',
    'waitForModel', 'downloadResult', 'displayResult'
  ]);
});

test('Reference preflight ตรวจ resolution, bytes และ aspect ratio', () => {
  const meta = api.validateReferenceImage(reference, { minLongEdge: 1536, maxLongEdge: 2048, maxBytes: 4 * 1024 * 1024 });
  assert.equal(meta.longEdge, 1536);
  assert.equal(meta.withinByteLimit, true);
  assert.throws(() => api.validateReferenceImage({ ...reference, blob: { size: 5 * 1024 * 1024 } }, { maxBytes: 4 * 1024 * 1024 }),
    error => error.code === 'REFERENCE_IMAGE_TOO_LARGE');
  assert.throws(() => api.validateReferenceImage(reference, { expectedAspect: 16 / 9 }),
    error => error.code === 'REFERENCE_ASPECT_MISMATCH');
});

test('หนึ่งการสร้างภาพส่ง Render Request เพียงครั้งเดียวและรายงานเวลาครบ', async () => {
  let sendCount = 0;
  const pipeline = api.create({ adapter: { sendRenderRequest: async payload => { sendCount += 1; return payload; } } });
  const report = await pipeline.run({
    buildPrompt: () => 'prompt',
    prepareReferenceImage: () => reference,
    referenceLimits: { minLongEdge: 1536, maxLongEdge: 2048 }
  });
  assert.equal(sendCount, 1);
  assert.equal(report.sentRequests, 1);
  assert.equal(report.promptCharacters, 6);
  api.PIPELINE_STAGES.forEach(stage => assert.equal(typeof report.timings[stage], 'number'));
});

test('Double Submit ใช้ Promise เดิมและไม่ยิงคำขอซ้ำ', async () => {
  let release;
  const gate = new Promise(resolve => { release = resolve; });
  let sendCount = 0;
  const pipeline = api.create({ adapter: { sendRenderRequest: async () => { sendCount += 1; await gate; return { ok: true }; } } });
  const input = { buildPrompt: () => 'prompt', prepareReferenceImage: () => reference };
  const first = pipeline.run(input);
  const second = pipeline.run(input);
  assert.strictEqual(first, second);
  await new Promise(resolve => setImmediate(resolve));
  release();
  await Promise.all([first, second]);
  assert.equal(sendCount, 1);
});

test('A/B Test ใช้ Reference เดียวกันและต่างกันเฉพาะ Full/Compact Prompt', async () => {
  let prepareCount = 0;
  const references = [];
  const pipeline = api.create({ adapter: { sendRenderRequest: async payload => { references.push(payload.reference); return payload; } } });
  const result = await pipeline.runABTest({
    prepareReferenceImage: () => { prepareCount += 1; return reference; },
    buildFullPrompt: () => 'FULL PROMPT LONG',
    buildCompactPrompt: () => 'COMPACT'
  });
  assert.equal(prepareCount, 1);
  assert.equal(references.length, 2);
  assert.strictEqual(references[0], references[1]);
  assert.equal(result.full.promptVariant, 'full');
  assert.equal(result.compact.promptVariant, 'compact');
  assert.ok(result.full.promptCharacters > result.compact.promptCharacters);
});
