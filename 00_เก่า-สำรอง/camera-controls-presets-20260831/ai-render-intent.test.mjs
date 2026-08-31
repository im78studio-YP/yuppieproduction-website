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

test('Prompt กำกับ AI Digital Display Placement โดยไม่เปลี่ยน Geometry', () => {
  for (const text of ['AI DIGITAL DISPLAY PLACEMENT', 'ได้ไม่เกิน 1 จุด', 'พื้นผิวแนวตั้งด้านหน้าของโครงสร้างเดิม', 'ผนังหรือโครงสร้างเดิมด้านหลังเคาน์เตอร์', 'ผนังรองที่มีพื้นที่ว่าง']) assert.match(html, new RegExp(text));
  assert.match(html, /ห้ามสร้างกรอบ แผง เสา ฐาน หรือโครงสร้างใหม่เพื่อรองรับจอ/);
  assert.match(html, /ห้ามปิดทับโลโก้ ประตู ช่องเปิด ชั้นสินค้า โคมไฟ งานพิมพ์ หรือ Asset/);
  assert.match(html, /AI Suggested \/ Render Staging เท่านั้น ไม่รวมใน Project, BOQ หรือขอบเขตการผลิต/);
  assert.match(html, /digitalDisplayLines=p\.aiEnhancementOptions\.enabled\?/);
});

test('Render Package ใช้ Hero Front Right แบบ Two-Point และภาพ Landscape 4:3', () => {
  for (const text of ['Hero Front Right', 'Two-Point Perspective', 'Camera Height:', 'Lens Equivalent:', 'Vertical Lines:', 'Straight', 'approximately ', 'of image width', 'Landscape 4:3']) assert.match(html, new RegExp(text));
  assert.match(html, /heightM:1\.6,lensEquivalentMm:40/);
  assert.match(html, /framingWidthRatio:\.85,aspectRatio:4\/3/);
  assert.match(html, /camera\.heightM\.toFixed\(2\)\+' m'/);
  assert.match(html, /camera\.lensEquivalentMm\+' mm'/);
  assert.match(html, /setHeroFrontRightCamera\(S,RENDER_CAMERA_PROFILE\)/);
  assert.match(html, /aspectRatio:RENDER_CAMERA_PROFILE\.aspectRatio/);
  assert.match(html, /target=new T\.Vector3\(Number\(spec\.W\)\/2,floorY\+Number\(profile\.heightM\|\|1\.6\),Number\(spec\.D\)\/2\)/);
  assert.match(html, /this\.camera\.up\.set\(0,1,0\)/);
  assert.match(html, /frameRatio\*2/);
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
