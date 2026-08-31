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

test('Camera Controls มี Preset ครบตามลำดับและเลื่อนได้บนจอแคบ', () => {
  assert.match(html, /\[\['perspective','Perspective'\],\['perspective_front_left','เฉียงซ้าย'\],\['perspective_front_right','เฉียงขวา'\],\['orthographic_front','หน้า'\],\['orthographic_rear','หลัง'\],\['orthographic_left','ซ้าย'\],\['orthographic_right','ขวา'\],\['orthographic_top','บน'\]\]/);
  assert.match(html, /\.three-tools\{[^}]*flex-wrap:nowrap[^}]*overflow-x:auto/s);
  assert.match(html, /\.three-tools button\{[^}]*white-space:nowrap/s);
});

test('Camera Presets ใช้มุมเรนเดอร์ Two-Point และรูปด้าน Orthographic จริง', () => {
  for (const text of ['Front-Left', 'Front-Right', 'Front Orthographic Elevation', 'Rear Orthographic Elevation', 'Left Orthographic Elevation', 'Right Orthographic Elevation', 'Top Orthographic Plan View', 'Two-Point Perspective', 'Landscape 4:3']) assert.match(html, new RegExp(text));
  assert.match(html, /heightM:1\.6,lensEquivalentMm:40/);
  assert.match(html, /framingWidthRatio:\.85,aspectRatio:4\/3/);
  assert.match(html, /angleDeg:-35/);assert.match(html, /angleDeg:35/);
  assert.match(html, /new THREE\.OrthographicCamera/);
  assert.match(html, /setTwoPointCameraPreset/);assert.match(html, /setOrthographicCameraPreset/);
  assert.match(html, /profile\.axis==='front'/);assert.match(html, /profile\.axis==='rear'/);
  assert.match(html, /profile\.axis==='left'/);assert.match(html, /profile\.axis==='right'/);
  assert.match(html, /occlusionAdjusted/);
});

test('Presentation Views ใช้สเกลร่วม เว้นขอบ 8–10% ซ่อน Overhead เฉพาะ Top และมี Export API', () => {
  assert.match(html, /presentationElevationFrameHeight/);
  assert.match(html, /usable=\.82/);
  assert.match(html, /marginPercent:9/);
  assert.match(html, /frameHeight=commonFrameHeight/);
  assert.match(html, /hideTopViewOverheadAssets/);
  assert.match(html, /restoreTopViewHidden/);
  assert.match(html, /transitionCameraTo\([\s\S]*duration=400/);
  assert.match(html, /capturePresentationView\(cameraViewType/);
  assert.match(html, /capturePresentationViews\(options=/);
  for (const view of ['orthographic_front','orthographic_rear','orthographic_left','orthographic_right','orthographic_top']) assert.match(html, new RegExp(view));
});

test('Camera Preset บันทึก Project State และ Render Package ใช้มุม Snapshot ปัจจุบัน', () => {
  for (const token of ['cameraViewType', 'cameraPresetId', 'cameraPosition', 'cameraTarget', 'fov', 'aspectRatio']) assert.match(html, new RegExp(token));
  assert.match(html, /settings\.camera=state;settings\.cameraViewType=state\.cameraViewType/);
  assert.match(html, /renderCameraPromptLines\(snapshot\)/);
  assert.match(html, /aspectRatio:renderPackageAspectRatio\(snapshot\)/);
  assert.doesNotMatch(html, /applyStandardRenderCamera|setHeroFrontRightCamera|RENDER_CAMERA_PROFILE/);
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
