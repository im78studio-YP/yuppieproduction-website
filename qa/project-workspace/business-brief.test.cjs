const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
for(const file of ['quick-setup.js','business-brief.js'])vm.runInThisContext(fs.readFileSync('public/yp-web-ai/js/'+file,'utf8'));
test('repeated selected assets do not consume category suggestions',()=>{for(const count of [0,1,20,53])assert.match(YPQuickSetupContext.categoryPromptLines({categoryId:'food',userChoices:Array(count).fill('แผงผนัง')}).join('\n'),/เคาน์เตอร์ชิมสินค้า/);});
test('normalize optional legacy input without inventing data',()=>{assert.deepEqual(YPBusinessBrief.normalize(),{product:'',audience:'',activities:''});assert.equal(YPBusinessBrief.normalize({product:' a\nb ',audience:{},activities:'x'.repeat(300)}).activities.length,240);});
test('brief and category fallback respect permissions and immutable geometry',()=>{const ctx={categoryId:'food',categoryLabel:'อาหาร',brief:{product:'กาแฟพร้อมดื่ม',audience:'ตัวแทนจำหน่าย',activities:'แจกชิม'}};
 const on=YPBusinessBrief.promptLines(ctx,{enabled:true},Array(53).fill('แผงผนัง')).join('\n');assert.match(on,/กาแฟพร้อมดื่ม/);assert.match(on,/เคาน์เตอร์ชิมสินค้า/);assert.match(on,/คงพื้น ผนัง โครงสร้าง/);
 const off=YPBusinessBrief.promptLines(ctx,{enabled:false}).join('\n');assert.doesNotMatch(off,/เคาน์เตอร์ชิมสินค้า/);assert.match(off,/สินค้า = ไม่อนุญาต/);assert.match(off,/ห้ามเติมสินค้า/);
 const restricted=YPBusinessBrief.promptLines(ctx,{allowFurniture:false,allowProducts:false}).join('\n');assert.doesNotMatch(restricted,/เคาน์เตอร์ชิมสินค้า/);assert.match(restricted,/สินค้า = ไม่อนุญาต/);
});
