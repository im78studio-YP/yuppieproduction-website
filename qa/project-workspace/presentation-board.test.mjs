import test from 'node:test';
import assert from 'node:assert/strict';
await import('../../public/yp-web-ai/js/handoff-package.js');
await import('../../public/yp-web-ai/js/presentation-board-package.js');
const snapshot={renderPackageId:'test-package',stateHash:'abc123',payload:{brand:{name:'YP',primary:'#ee3c96',secondary:'#ffffff'},boothType:'penin',boothTypeLabel:'Peninsular',width:6,depth:3,height:2.4,floor:{material:'กระเบื้องยาง',detail:'woodL'}}};
test('board prompt names six references and preserves geometry without invented prices',()=>{
  assert.equal(YPPresentationBoard.views.length,6);
  const prompt=YPPresentationBoard.prompt(snapshot);
  for(const phrase of ['A3','6 × ลึก 3','18 ตร.ม.','ห้ามคาดเดาราคา','ห้ามสลับซ้ายขวา','ไม่ใช่แบบผลิต','06-plan.png'])assert.ok(prompt.includes(phrase),phrase);
});
test('board ZIP requires all six PNGs and includes prompt and data',async()=>{
  await assert.rejects(()=>YPPresentationBoard.build(snapshot,[]),/6 มุม/);
  const images=YPPresentationBoard.views.map(v=>({id:v.id,blob:new Blob(['image'],{type:'image/png'})}));
  const result=await YPPresentationBoard.build(snapshot,images);
  assert.equal(result.blob.type,'application/zip');assert.equal(result.files.length,9);
  assert.ok(result.files.includes('board-prompt.txt'));assert.ok(result.files.includes('booth-data.json'));
});
