(function(root){
 'use strict';
 // Display-only range: never writes to the booth, unit prices or pricing formulas.
 const number=new Intl.NumberFormat('en-US',{maximumFractionDigits:0});
 function range(total){
  if(typeof total!=='number'||!Number.isFinite(total)||total<0)return null;
  return {low:Math.round(total),high:Math.round(total*1.5)};
 }
 function format(total){const r=range(total);return r?number.format(r.low)+'–'+number.format(r.high)+' บาท':'ยังประเมินงบประมาณไม่ได้';}
 let latest={total:null,lines:[]},visible=false;
 function paint(node){
  const expanded=node.querySelector('details')?.open===true;
  node.replaceChildren();const el=(tag,text)=>{const n=document.createElement(tag);n.textContent=text;return n;};
  node.append(el('p','งบประมาณเบื้องต้น'),el('strong',format(latest.total)),el('p','ยืนยันราคาอีกครั้งในใบเสนอราคา'));
  const explanation=el('small','ราคานี้เป็นประมาณการเพื่อวางแผนงบประมาณ อาจเปลี่ยนแปลงตามวัสดุ รูปแบบ รายละเอียดงาน และเงื่อนไขการติดตั้ง โดยทีมงานจะตรวจสอบและยืนยันราคาก่อนดำเนินงาน');node.append(explanation);
  const pending=latest.lines.filter(row=>!Number.isFinite(row[1])||row[1]<=0);
  if(pending.length){
   const warning=el('p','มี '+pending.length+' รายการที่ต้องตรวจสอบราคาเพิ่มเติม งบประมาณที่แสดงอาจยังไม่ครอบคลุมค่าใช้จ่ายทั้งหมด');warning.className='budget-warning';node.append(warning);
   const details=el('details','');details.open=expanded;details.append(el('summary','ดูรายการที่รอตรวจสอบราคา'));const list=el('ul','');pending.forEach(row=>list.append(el('li',row[0])));details.append(list);node.append(details);
  }
 }
 function update(total,lines=[]){latest={total,lines};if(!root.document)return;
  const price=document.getElementById('price');if(price)price.textContent=visible?format(total):'';
  document.querySelectorAll('[data-budget-summary]').forEach(paint);
 }
 function setVisible(value,{focus=false}={}){
  visible=!!value;const button=document.getElementById('budgetToggle'),panel=document.getElementById('budgetPanel');if(!button||!panel)return;
  button.textContent=visible?'ซ่อนงบประมาณ':'ดูงบประมาณ';button.setAttribute('aria-expanded',String(visible));panel.hidden=!visible;update(latest.total,latest.lines);
  if(focus)(visible?document.getElementById('budgetClose'):button).focus();
 }
 function createSummary(){const box=document.createElement('section');box.className='budget-summary';box.dataset.budgetSummary='';box.setAttribute('aria-label','งบประมาณของแบบที่เลือก');paint(box);return box;}
 function init(){const button=document.getElementById('budgetToggle');if(!button)return;
  button.onclick=()=>{if(!visible)root.closeHeaderSummary?.(false);setVisible(!visible);};document.getElementById('budgetClose').onclick=()=>setVisible(false,{focus:true});
  document.getElementById('summaryToggle')?.addEventListener('click',()=>setVisible(false));
  document.getElementById('budgetPanel').addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();event.stopPropagation();setVisible(false,{focus:true});}});
  setVisible(false);
 }
 root.YPBudgetEstimate={range,format,update,setVisible,createSummary};
 if(root.document)init();
})(globalThis);
