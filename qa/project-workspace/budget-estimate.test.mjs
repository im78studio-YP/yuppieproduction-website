import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import '../../public/yp-web-ai/js/budget-estimate.js';
const budget=globalThis.YPBudgetEstimate;
test('customer copy explains uncertainty without exposing the range multiplier',async()=>{
 const js=await readFile(new URL('../../public/yp-web-ai/js/budget-estimate.js',import.meta.url),'utf8');
 assert.doesNotMatch(js,/บวก 50%|ราคาปัจจุบัน ถึง|ยอดเป็นศูนย์/);
 assert.match(js,/วัสดุ รูปแบบ รายละเอียดงาน และเงื่อนไขการติดตั้ง/);
 assert.match(js,/ยืนยันราคาอีกครั้งในใบเสนอราคา/);
 assert.match(js,/อาจยังไม่ครอบคลุมค่าใช้จ่ายทั้งหมด/);
});
test('range is current price through current price plus 50%, rounded to baht',()=>{
 assert.deepEqual(budget.range(164017),{low:164017,high:246026});assert.equal(budget.format(164017),'164,017–246,026 บาท');
 assert.deepEqual(budget.range(100000),{low:100000,high:150000});assert.deepEqual(budget.range(100.2),{low:100,high:150});assert.deepEqual(budget.range(0),{low:0,high:0});
});
test('invalid totals do not masquerade as zero or show NaN',()=>{for(const n of [NaN,Infinity,-1,null,undefined,'100']){assert.equal(budget.range(n),null);assert.equal(budget.format(n),'ยังประเมินงบประมาณไม่ได้');}});
test('range calculation does not alter underlying pricing lines',()=>{const rows=[['wall',100000],['TV',0]],before=structuredClone(rows);budget.update(100000,rows);assert.deepEqual(rows,before);});
test('initial HTML has no visible single-price value and all three update paths use range',async()=>{
 const html=await readFile(new URL('../../public/yp-web-ai/index.html',import.meta.url),'utf8');
 assert.match(html,/id="budgetPanel"[^>]* hidden/);assert.match(html,/id="budgetToggle"[^>]*aria-expanded="false"/);assert.equal((html.match(/updateBudgetEstimate\(\);/g)||[]).length,3);
 assert.doesNotMatch(html,/getElementById\('price'\)\.textContent=/);
 assert.match(html,/const priceTotal=\(\)=>priceLines\(\)\.reduce\(\(sum,row\)=>sum\+row\[1\],0\);/);
});
