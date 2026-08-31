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

test('Concept Prompt ใช้ Project State แบบสั้นและไม่ปะปน Precision Geometry', () => {
  const api = load(intentSource).YPAIRenderIntent;
  const prompt = api.buildConceptPrompt({ business: 'อาหาร', primary: '#f72585', secondary: '#111318', quality: 'preview',
    booth: { type: 'Corner', width: 6, depth: 3, height: 2.4, openSides: 'หน้าและซ้าย', cornerSide: 'left' } });
  assert.doesNotMatch(prompt, /Clean Screenshot|พิกัด Asset|LOCKED 3D GEOMETRY|Geometry Reference แบบบังคับ/);
  assert.match(prompt, /Scene Proposal JSON/);
  assert.match(prompt, /Auto-Staging Freedom: สูง/);
  assert.match(prompt, /ด้านเปิด: หน้าและซ้าย · หัวมุมซ้าย/);
  assert.match(prompt, /Preview · สร้างแนวคิดรวดเร็ว รายละเอียดปานกลาง/);
  assert.match(prompt, /เคาน์เตอร์ ชั้นและแท่นแสดงสินค้า โต๊ะและเก้าอี้/);
});

test('Concept Prompt เปลี่ยนเฉพาะคำสั่งคุณภาพระหว่าง Preview และ Final', () => {
  const api = load(intentSource).YPAIRenderIntent;
  const preview = api.buildConceptPrompt({ quality: 'preview' });
  const final = api.buildConceptPrompt({ quality: 'final' });
  assert.match(preview, /Preview · สร้างแนวคิดรวดเร็ว/);
  assert.match(final, /Final · Photorealistic รายละเอียดสูง/);
  assert.equal(api.normalizeIntent('concept'), 'concept');
  assert.equal(api.normalizeIntent('from3d'), 'precision');
  assert.equal(api.normalizeIntent('precision'), 'precision');
});

test('Scene Proposal normalize สถานะ AI Suggested และ Render Staging แยกกัน', () => {
  const api = load(intentSource).YPAIRenderIntent;
  const proposal = api.normalizeSceneProposal({ sceneProposal: { summary: 'test', suggestedAssets: [
    { id: 'chair', name: 'เก้าอี้', category: 'furniture', dimensions: { w: .5, d: .5, h: .85 } },
    { id: 'guest', name: 'ผู้เข้าชม', category: 'people', dimensions: { w: .5, d: .5, h: 1.7 } }
  ] } });
  assert.equal(proposal.suggestedAssets[0].status, 'AI Suggested');
  assert.equal(proposal.suggestedAssets[1].renderOnly, true);
  assert.equal(proposal.suggestedAssets[1].status, 'Render Staging เท่านั้น');
});

test('Suggested Asset จับคู่คลังด้วย category และขนาด', () => {
  const api = load(intentSource).YPAIRenderIntent;
  const match = api.matchSuggestedAsset({ category: 'chair', dimensions: { w: .52, d: .48, h: .86 } }, [
    { catalogId: 'counter', category: 'reception', type: 'counter', name: 'เคาน์เตอร์', size: { w: 1.2, d: .6, h: 1 } },
    { catalogId: 'chair', category: 'hospitality', type: 'chair', name: 'เก้าอี้', size: { w: .5, d: .5, h: .85 } }
  ]);
  assert.equal(match.catalogId, 'chair');
});

test('Concept Pipeline ไม่เตรียมหรืออัปโหลด Reference แต่ส่ง API หนึ่งครั้ง', async () => {
  const global = load(pipelineSource), api = global.YPAIRenderPipeline;
  let sendCount = 0, prepareCount = 0, uploadCount = 0;
  const pipeline = api.create({ adapter: {
    uploadReferenceImage: async () => { uploadCount += 1; },
    sendRenderRequest: async payload => { sendCount += 1; assert.equal(payload.reference, null); assert.equal(payload.renderIntent, 'concept'); return { ok: true }; }
  } });
  const report = await pipeline.run({ renderIntent: 'concept', requiresReference: false, buildPrompt: () => 'concept', prepareReferenceImage: () => { prepareCount += 1; } });
  assert.equal(prepareCount, 0);
  assert.equal(uploadCount, 0);
  assert.equal(sendCount, 1);
  assert.equal(report.reference, null);
});

test('Precision Pipeline ใช้ชื่อ Intent ใหม่และยังส่ง Reference ตามเดิม', async () => {
  const global = load(pipelineSource), api = global.YPAIRenderPipeline;
  let prepareCount = 0, uploadCount = 0;
  const pipeline = api.create({ adapter: {
    uploadReferenceImage: async reference => { uploadCount += 1; return { id: 'ref', reference }; },
    sendRenderRequest: async payload => { assert.equal(payload.renderIntent, 'precision'); assert.ok(payload.reference); return { ok: true }; }
  } });
  await pipeline.run({ renderIntent: 'precision', requiresReference: true, buildPrompt: () => 'precision',
    prepareReferenceImage: async () => { prepareCount += 1; return { blob: { size: 10 }, width: 1536, height: 900 }; } });
  assert.equal(prepareCount, 1);
  assert.equal(uploadCount, 1);
});

test('หน้า Prompt แยก Intent จาก Preview/Final และมี Workflow ยืนยัน Proposal', () => {
  for (const id of ['promptRenderConcept', 'promptRender3d', 'conceptProposal', 'conceptAddAll', 'conceptAddSelected', 'conceptReject']) {
    assert.match(html, new RegExp(`id=["']${id}["']`));
  }
  assert.match(html, /data-render-quality="preview"/);
  assert.match(html, /AI Concept — ผังยังไม่ยืนยัน/);
  assert.match(html, /3D-Based Render/);
  assert.match(html, /aiConceptUI=\{proposal:null,suggestions:\[\]/);
  assert.match(html, /recordObjectHistory\(before\)/);
});

test('Render Intent เริ่มที่ Precision และปุ่มทำหน้าที่เลือก Prompt โดยไม่ยิง Render', () => {
  assert.match(html, /let renderIntent='precision'/);
  assert.match(html, /promptRenderConceptButton\.onclick=\(\)=>setRenderIntent\('concept'\)/);
  assert.match(html, /promptRender3dButton\.onclick=\(\)=>setRenderIntent\('precision'\)/);
  assert.doesNotMatch(html, /promptRenderConceptButton\.onclick=\(\)=>runAIRender/);
  assert.match(html, /copy\.textContent=concept\?'คัดลอก CONCEPT PROMPT':'เตรียมชุดสร้างภาพ'/);
  assert.match(html, /if\(clean\)clean\.hidden=true/);
  assert.match(html, /Concept Prompt ไม่ใช้ Clean Screenshot/);
  assert.match(html, /currentRenderIntent\(\)==='concept'\?'คัดลอก Concept Prompt แล้ว':'คัดลอก Prompt แล้ว'/);
  assert.match(html, /function renderIntentMissingFields\(\)/);
  assert.match(html, /กรุณาตั้งค่าก่อน: /);
  assert.doesNotMatch(html, /id="promptRenderConcept" disabled|id="promptRender3d" disabled/);
});

test('Precision แสดงชุดเตรียมภาพและรวม Copy Prompt กับ Clean Screenshot ในปุ่มเดียว', () => {
  assert.match(html, /สร้างภาพจำลองเมื่อบูธเสร็จสมบูรณ์/);
  assert.match(html, /ระบบจะยึดโครงสร้าง 3D ของคุณ แล้วเติมรายละเอียดให้ดูพร้อมใช้งานจริง/);
  assert.match(html, /รักษาขนาด ผนัง ห้อง และ Asset ที่คุณจัดวาง/);
  for (const text of ['วัสดุและแสง', 'สินค้าและเฟอร์นิเจอร์', 'คนและบรรยากาศ', 'ร่างเร็ว', 'ภาพนำเสนอ']) {
    assert.match(html, new RegExp(text));
  }
  assert.match(html, /id="promptCopy">เตรียมชุดสร้างภาพ/);
  assert.match(html, /คัดลอกคำสั่งและดาวน์โหลดภาพอ้างอิง 3D/);
  assert.match(html, /async function prepareRenderPackage\(\)/);
  assert.match(html, /const copied=await copyDesignPrompt\(\)/);
  assert.match(html, /const image=await downloadCleanScreenshot\(\)/);
  assert.match(html, /promptCopyButton\.onclick=prepareRenderPackage/);
});
