import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const intentSource = await readFile(new URL('../../public/yp-web-ai/js/ai-render-intent.js', import.meta.url), 'utf8');
const pipelineSource = await readFile(new URL('../../public/yp-web-ai/js/ai-render-pipeline.js', import.meta.url), 'utf8');
const html = await readFile(new URL('../../public/yp-web-ai/index.html', import.meta.url), 'utf8');

function load(source) {
  let tick = 0;
  const globalThis = { performance: { now: () => ++tick }, crypto: { randomUUID: () => `intent-${tick}` }, console };
  vm.runInNewContext(source, { globalThis, performance: globalThis.performance, console, setTimeout, clearTimeout, Date, Math, Promise, Error }, { filename: 'module.js' });
  return globalThis;
}

test('Render Intent เหลือ structure_enhancement เพียงโหมดเดียว', () => {
  const api = load(intentSource).YPAIRenderIntent;
  for (const value of ['concept', 'precision', 'from3d', 'structure_enhancement', undefined]) assert.equal(api.normalizeIntent(value), 'structure_enhancement');
  assert.equal(api.INTENTS.STRUCTURE_ENHANCEMENT, 'structure_enhancement');
});

test('Pipeline บังคับ structure_enhancement และส่ง Reference หนึ่งครั้ง', async () => {
  const api = load(pipelineSource).YPAIRenderPipeline;
  let prepareCount = 0, uploadCount = 0, sendCount = 0;
  const pipeline = api.create({ adapter: {
    uploadReferenceImage: async reference => { uploadCount += 1; return { id: 'ref', reference }; },
    sendRenderRequest: async payload => { sendCount += 1; assert.equal(payload.renderIntent, 'structure_enhancement'); assert.ok(payload.reference); return { ok: true }; }
  } });
  const report = await pipeline.run({ renderIntent: 'concept', requiresReference: true, buildPrompt: () => 'atomic prompt',
    prepareReferenceImage: async () => { prepareCount += 1; return { blob: { size: 10 }, width: 1536, height: 900 }; } });
  assert.equal(prepareCount, 1); assert.equal(uploadCount, 1); assert.equal(sendCount, 1); assert.equal(report.sentRequests, 1);
});

test('Customer Flow ไม่มี Concept/Precision และมีปุ่ม Atomic Render Package เดียว', () => {
  assert.doesNotMatch(html, /id=["']promptRenderConcept["']|id=["']promptRender3d["']|id=["']promptConceptQuality["']/);
  assert.match(html, /id="promptCopy">เตรียมชุดสร้างภาพ/);
  assert.match(html, /STRUCTURE_ENHANCEMENT_INTENT='structure_enhancement'/);
  assert.match(html, /promptCopyButton\.onclick=prepareRenderPackage/);
});

test('Atomic Snapshot ครบ State หลักและใช้ Hash Revision Package ID เดียวกัน', () => {
  for (const token of ['boothType:', 'cornerSide:', 'activeWalls', 'openSides', 'floor:', 'room:', 'brand:', 'assets:', 'camera:', 'qualityMode:', 'aiEnhancementOptions:']) assert.match(html, new RegExp(token));
  for (const token of ['sceneRevision', 'renderPackageId', 'stateHash']) assert.match(html, new RegExp(token));
  assert.match(html, /buildStructureEnhancementPrompt\(snapshot\)/);
  assert.match(html, /createCleanScreenshot\(\{snapshot,download:true/);
  assert.match(html, /validateState:\(\)=>assertAtomicRenderSnapshot\(snapshot\)/);
  assert.match(html, /manifest\.renderPackage=\{intent:STRUCTURE_ENHANCEMENT_INTENT/);
  assert.match(html, /snapshot\.renderPackageId\+'-'\+snapshot\.stateHash\.slice\(0,12\)\+'\.png'/);
  assert.match(html, /camera:stableRenderCameraSnapshot\(camera\)/);
});

test('State เปลี่ยนระหว่างเตรียมชุดต้องยกเลิกด้วยข้อความที่กำหนด', () => {
  assert.match(html, /captureRenderDraft\(\)\.signature!==snapshot\.signature/);
  assert.match(html, /throw new Error\('RENDER_STATE_CHANGED'\)/);
  assert.match(html, /แบบ 3D มีการเปลี่ยนแปลง กรุณาเตรียมชุดสร้างภาพใหม่/);
  assert.match(html, /invalidatePreparedRenderPackage/);
  assert.match(html, /commitCameraState\(\)[\s\S]*syncSceneRevision\(\)/);
});

test('Prompt ล็อก Geometry และแยกสิ่งที่ AI เติมได้', () => {
  for (const text of ['LAYER A — LOCKED 3D GEOMETRY', 'LAYER B — AI STRUCTURE ENHANCEMENT', 'วัสดุและแสง', 'สินค้าและเฟอร์นิเจอร์', 'คนและบรรยากาศ']) assert.match(html, new RegExp(text));
  assert.match(html, /ห้ามเปลี่ยนขนาดหรือรูปทรงบูธ จำนวนและตำแหน่งผนัง ด้านเปิด ห้อง มุมกล้อง หรือ Asset/);
  assert.match(html, /ห้ามสร้างพื้น ผนัง ห้อง หรือโครงสร้างถาวรใหม่/);
});

test('UI แสดง Summary และผลสำเร็จสองรายการแยกกัน', () => {
  assert.match(html, /id="promptProjectSummary"/);
  assert.match(html, /✓ คัดลอกคำสั่งสำหรับ AI แล้ว/);
  assert.match(html, /✓ ดาวน์โหลดภาพอ้างอิงแล้ว/);
  assert.match(html, /renderPackageSummary\(snapshot\)/);
});

test('Inline JavaScript ของหน้า Booth Editor parse ได้ครบ', () => {
  const start = html.indexOf('<script>', html.indexOf('ai-render-pipeline.js'));
  const end = html.indexOf('</script>', start);
  assert.ok(start >= 0 && end > start);
  assert.doesNotThrow(() => new Function(html.slice(start + '<script>'.length, end)));
});
