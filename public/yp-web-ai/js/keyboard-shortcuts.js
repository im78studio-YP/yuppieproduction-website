(function(global){
 'use strict';
 if(new URLSearchParams(location.search).get('comparePreview')==='1')return;
 const isEditing=e=>[...(e.composedPath?.()||[e.target]),document.activeElement].some(node=>node?.isContentEditable||node?.closest?.('input,textarea,select,[role="textbox"]'));
 const isModalOpen=()=>!!document.querySelector('dialog[open],.modal.show');
 const mac=/Mac|iPhone|iPad/.test(navigator.platform),mod=mac?'Cmd':'Ctrl';
 const actions=[
  {id:'btnUndoObject',label:'ย้อนกลับการแก้ไข (Undo)',keys:mod+'+Z',aria:'Control+Z Meta+Z'},
  {id:'btnRedoObject',label:'ทำซ้ำการแก้ไข (Redo)',keys:mod+'+Shift+Z / '+mod+'+Y',aria:'Control+Shift+Z Meta+Shift+Z Control+Y Meta+Y'},
  {id:'btnDeleteObject',label:'ลบวัตถุที่เลือก',keys:'Delete / Backspace',aria:'Delete Backspace'},
  {id:'projectSave',label:'บันทึกไฟล์โปรเจกต์',keys:mod+'+S',aria:'Control+S Meta+S'}
 ];
 actions.forEach(({id,label,keys,aria})=>{const button=document.getElementById(id);if(button){button.title=label+' ('+keys+')';button.setAttribute('aria-keyshortcuts',aria);}});
 const opener=document.createElement('button');opener.id='keyboardShortcutsOpen';opener.type='button';opener.className='btn';opener.textContent='คีย์ลัด';opener.title='ดูคีย์ลัด (F1)';opener.setAttribute('aria-keyshortcuts','F1');opener.setAttribute('aria-haspopup','dialog');
 document.getElementById('projectWizard')?.after(opener);
 const dialog=document.createElement('dialog');dialog.id='keyboardShortcutsDialog';dialog.className='project-dialog';dialog.setAttribute('aria-labelledby','keyboardShortcutsTitle');
 dialog.innerHTML='<div class="shortcut-heading"><h2 id="keyboardShortcutsTitle">คีย์ลัดในการออกแบบ</h2><button class="btn" type="button" id="keyboardShortcutsClose" aria-label="ปิดหน้าคีย์ลัด">ปิด</button></div><dl id="keyboardShortcutsList"></dl><p>ใช้ได้ทั้งแป้นพิมพ์ไทยและอังกฤษ ตามตำแหน่งปุ่มเดียวกัน</p><p>ขณะพิมพ์ชื่อ ข้อความ หรือกรอกตัวเลข คีย์ลัดจะไม่แก้ไขวัตถุในบูธ และจะพักคำสั่งไว้เมื่อเปิดหน้าต่างตั้งค่าหรือยืนยัน</p><p>Undo/Redo ใช้ประวัติเดียวกับปุ่มย้อนกลับของตัวแก้ไข ไม่รวมทุกการตั้งค่าของโปรเจกต์ วัตถุที่ล็อกยังคงได้รับการป้องกันตามเดิม</p>';
 document.body.append(dialog);
 for(const {label,keys} of [...actions,{label:'ยกเลิกการลาก / ยกเลิกการเลือก',keys:'Esc'},{label:'เปิดหน้าคีย์ลัด',keys:'F1'}]){
  const dt=document.createElement('dt'),dd=document.createElement('dd'),kbd=document.createElement('kbd');dt.textContent=label;kbd.textContent=keys;dd.append(kbd);document.getElementById('keyboardShortcutsList').append(dt,dd);
 }
 const style=document.createElement('style');style.textContent='#keyboardShortcutsDialog{width:min(600px,calc(100vw - 32px));max-height:calc(100dvh - 32px);box-sizing:border-box;overflow:auto;padding:24px}#keyboardShortcutsDialog .shortcut-heading{display:flex;align-items:center;justify-content:space-between;gap:16px}#keyboardShortcutsDialog h2{margin:0;font-size:20px}#keyboardShortcutsList{display:grid;grid-template-columns:1fr auto;gap:0;margin:20px 0}#keyboardShortcutsList dt,#keyboardShortcutsList dd{margin:0;padding:12px 0;border-bottom:1px solid #413547}#keyboardShortcutsList dd{text-align:right;padding-left:16px}#keyboardShortcutsList kbd{font:inherit;font-size:12px;color:#ff8fc2;background:#29222e;border:1px solid #55435d;border-radius:6px;padding:4px 7px;display:inline-block}#keyboardShortcutsDialog p{font-size:12px;line-height:1.7;color:#bdb3c2}@media(max-width:520px){#keyboardShortcutsDialog{padding:18px}#keyboardShortcutsList{grid-template-columns:1fr}#keyboardShortcutsList dt{border-bottom:0;padding-bottom:4px}#keyboardShortcutsList dd{text-align:left;padding:0 0 12px}}';document.head.append(style);
 let returnFocus;
 function open(){if(isModalOpen())return;returnFocus=document.activeElement;dialog.showModal();document.getElementById('keyboardShortcutsClose').focus();}
 opener.onclick=open;document.getElementById('keyboardShortcutsClose').onclick=()=>dialog.close();dialog.addEventListener('close',()=>returnFocus?.isConnected&&returnFocus.focus());
 function command(e){
  if(e.altKey)return null;
  if((e.code==='F1'||e.key==='F1')&&!e.ctrlKey&&!e.metaKey&&!e.shiftKey)return 'help';
  const key=e.code?.startsWith('Key')?e.code.slice(3).toLowerCase():e.key?.toLowerCase();
  if(e.ctrlKey||e.metaKey){
   if(key==='z')return e.shiftKey?'btnRedoObject':'btnUndoObject';
   if(key==='y'&&!e.shiftKey)return 'btnRedoObject';
   if(key==='s'&&!e.shiftKey)return 'projectSave';
  }else if(!e.shiftKey&&(e.key==='Delete'||e.key==='Backspace'))return 'btnDeleteObject';
  return null;
 }
 // Capture shortcuts once; ignore text editing/IME and never act behind dialogs.
 window.addEventListener('keydown',e=>{
  if(e.defaultPrevented||e.isComposing||e.keyCode===229||isEditing(e))return;
  const action=command(e);if(!action)return;
  e.preventDefault();e.stopImmediatePropagation();
  if(e.repeat||isModalOpen())return;
  if(action==='help'){open();return;}
  const state=global.YPProjectWorkspace?.state();if(!state?.ready||state.busy||state.pendingDraft)return;
  const button=document.getElementById(action);if(button&&!button.disabled)button.click();
 },true);
 global.YPKeyboardShortcuts={open,isEditing,isModalOpen,command};
})(globalThis);
