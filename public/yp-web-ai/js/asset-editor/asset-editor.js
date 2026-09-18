const mount=document.getElementById('assetEditorMount');
const alignRows=[
  ['ซ้าย–ขวา', [['left','เสมอซ้าย'],['horizontal','กึ่งกลางแนวนอน'],['right','เสมอขวา']]],
  ['บน–ล่าง', [['top','เสมอบน'],['vertical','กึ่งกลางแนวตั้ง'],['bottom','เสมอล่าง']]],
  ['หน้า–หลัง', [['front','เสมอหน้า'],['depth','กึ่งกลางความลึก'],['back','เสมอหลัง']]]
];
function alignIcon(mode){
  const horizontal=['left','horizontal','right'].includes(mode),depth=['front','depth','back'].includes(mode);
  const center=['horizontal','vertical','depth'].includes(mode),end=['right','bottom','back'].includes(mode);
  const line=center?12:end?21:3,a=center?8:end?12:5,b=center?6:end?8:5;
  return `<svg viewBox="0 0 24 24" aria-hidden="true"><g ${horizontal?'':`transform="${depth?'translate(3 1) skewY(-12) ':''}translate(24 0) rotate(90)"`}><path d="M${line} 2v20" fill="none" stroke="currentColor" stroke-width="1.7"/><rect x="${a}" y="5" width="7" height="5" rx=".6" fill="currentColor"/><rect x="${b}" y="14" width="11" height="5" rx=".6" fill="currentColor"/></g></svg>`;
}

if(mount){
  mount.innerHTML=`
    <section class="asset-editor" aria-label="Asset Editor">
      <div class="asset-editor-head">
        <div><div class="asset-editor-kicker">Asset Editor</div><h3>ปรับแต่งวัตถุที่เลือก</h3></div>
        <span class="asset-editor-badge" data-ae-lock-state>ยังไม่เลือก</span>
      </div>
      <div class="asset-editor-empty" data-ae-empty><b>เลือก Asset ในภาพ 3D ก่อน</b>เมื่อเลือกแล้ว สามารถปรับขนาด การวาง พื้นผิว และคำสั่งหลักได้จากเมนูนี้</div>
      <div class="asset-editor-body" data-ae-body hidden>
        <section class="asset-editor-card asset-editor-selection-card">
          <div class="asset-editor-selection-head"><h4>การเลือกและจัดกลุ่ม</h4><b data-ae-selection-count>เลือก 1 ชิ้น</b></div>
          <button class="btn sm asset-editor-multi" data-ae-action="multi-select" type="button">เลือกหลายชิ้น</button>
          <div class="asset-editor-note">คอมพิวเตอร์ใช้ Shift/Ctrl + คลิกได้ · มือถือเปิดโหมดนี้แล้วแตะ Asset ทีละชิ้น · สีชมพูคือชิ้นอ้างอิงหลัก</div>
          <div class="asset-editor-subtitle">Align · ตามแนวแกนบูธ ไม่ใช่มุมกล้อง</div>
          <div class="asset-editor-reference" data-ae-reference></div>
          ${alignRows.map(([axis,commands])=>`<div class="asset-editor-align-row"><span>${axis}</span><div class="asset-editor-actions asset-editor-align">${commands.map(([mode,label])=>`<button class="btn sm" data-ae-align="${mode}" type="button" title="${label} · ตามชิ้นอ้างอิงหลัก" aria-label="${label}">${alignIcon(mode)}<span>${label.replace('กึ่งกลางแนวนอน','กึ่งกลาง').replace('กึ่งกลางแนวตั้ง','กึ่งกลาง').replace('กึ่งกลางความลึก','กึ่งกลาง')}</span></button>`).join('')}</div></div>`).join('')}
          <div class="asset-editor-actions" style="margin-top:7px"><button class="btn sm" data-ae-action="group" type="button">Group</button><button class="btn sm" data-ae-action="ungroup" type="button">Ungroup</button></div>
        </section>
        <section class="asset-editor-card">
          <h4>ข้อมูล Asset</h4>
          <input class="asset-editor-name" data-ae-name type="text" maxlength="60" aria-label="ชื่อ Asset">
          <div class="asset-editor-meta">
            <span>พิกัด X<b data-ae-x>0.00</b></span><span>ระดับ Y<b data-ae-y>0.00</b></span><span>พิกัด Z<b data-ae-z>0.00</b></span>
          </div>
        </section>
        <section class="asset-editor-card">
          <h4>ขนาดจริง</h4>
          <div class="asset-editor-grid">
            <label class="asset-editor-field">กว้าง (ม.)<input data-ae-size="w" type="number" min="${MIN_ASSET_DIMENSION}" max="${MAX_ASSET_DIMENSION}" step="0.01" inputmode="decimal"></label>
            <label class="asset-editor-field">ลึก (ม.)<input data-ae-size="d" type="number" min="${MIN_ASSET_DIMENSION}" max="${MAX_ASSET_DIMENSION}" step="0.01" inputmode="decimal"></label>
            <label class="asset-editor-field">สูง (ม.)<input data-ae-size="h" type="number" min="${MIN_ASSET_DIMENSION}" max="${MAX_ASSET_DIMENSION}" step="0.01" inputmode="decimal"></label>
          </div>
          <label class="asset-editor-check"><input data-ae-ratio type="checkbox" checked> ล็อกสัดส่วนขณะปรับขนาด</label>
          <div class="asset-editor-actions" style="margin-top:9px"><button class="btn sm" data-ae-action="reset-size" type="button">คืนขนาดเดิม</button><button class="btn sm" data-ae-action="details" type="button">ตั้งค่าละเอียด</button></div>
        </section>
        <section class="asset-editor-card">
          <h4>การจัดวางและรูปทรง</h4>
          <div class="asset-editor-subtitle">แนววาง Asset</div>
          <div class="asset-editor-actions orientation">
            <button class="btn sm" data-ae-orientation="horizontal" type="button">แนวนอน</button><button class="btn sm" data-ae-orientation="upright" type="button">แนวตั้ง</button>
            <button class="btn sm" data-ae-orientation="side-left" type="button">ตะแคงซ้าย</button><button class="btn sm" data-ae-orientation="side-right" type="button">ตะแคงขวา</button>
          </div>
          <div class="asset-editor-note" data-ae-orientation-note>ระบบจะรักษาจุดกึ่งกลางฐานและคำนวณ Snap ตามขนาดหลังหมุน</div>
          <div class="asset-editor-subtitle">การเคลื่อนย้าย</div>
          <div class="asset-editor-actions compact">
            <button class="btn sm" data-ae-move="smart" type="button">Smart Move</button><button class="btn sm" data-ae-move="plane" type="button">พื้น X/Z</button><button class="btn sm" data-ae-move="height" type="button">ระดับ Y</button>
            <button class="btn sm" data-ae-move="surface" type="button">Snap ผิว</button><button class="btn sm" data-ae-action="rotate" type="button">หมุน 45°</button><button class="btn sm" data-ae-action="lock" type="button">Lock</button>
            <button class="btn sm" data-ae-action="flip-x" type="button">Flip ซ้าย–ขวา</button><button class="btn sm" data-ae-action="flip-y" type="button">Flip บน–ล่าง</button><button class="btn sm" data-ae-action="flip-z" type="button">Flip หน้า–หลัง</button>
          </div>
        </section>
        <section class="asset-editor-card">
          <h4>พื้นผิว</h4>
          <button class="btn pri" data-ae-action="details" type="button">แก้ไขพื้นผิวและสติ๊กเกอร์ · 3D</button>
          <div class="asset-editor-note" data-ae-surface-note style="margin-top:8px">สี วัสดุ สติ๊กเกอร์ และไฟขอบ · แก้ในหน้าต่างเดียว</div>
        </section>
        <section class="asset-editor-card">
          <div class="asset-editor-actions compact">
            <button class="btn sm" data-ae-action="duplicate" type="button">ทำสำเนา</button><button class="btn sm" data-ae-action="undo" type="button">Undo</button><button class="btn sm" data-ae-action="redo" type="button">Redo</button><button class="btn sm danger" data-ae-action="delete" type="button">ลบ</button>
          </div>
        </section>
      </div>
    </section>`;

  const $=selector=>mount.querySelector(selector);
  const $$=selector=>[...mount.querySelectorAll(selector)];
  const bridge=()=>window.YPAssetEditorBridge;
  const format=value=>(Number(value)||0).toFixed(2);
  const lockedControls=()=>$$('[data-ae-size],[data-ae-name],[data-ae-move],[data-ae-orientation],[data-ae-surface],[data-ae-color],[data-ae-action="reset-size"],[data-ae-action="rotate"],[data-ae-action="flip-x"],[data-ae-action="flip-y"],[data-ae-action="flip-z"],[data-ae-action="duplicate"],[data-ae-action="delete"]');

  function syncEditor(){
    const api=bridge(),state=api?.getState?.()||{selection:null},selection=state.selection;
    $('[data-ae-empty]').hidden=!!selection;$('[data-ae-body]').hidden=!selection;
    const badge=$('[data-ae-lock-state]');badge.textContent=selection?(state.selectionCount>1?'เลือก '+state.selectionCount+' ชิ้น':(selection.locked?'Locked':'พร้อมแก้ไข')):'ยังไม่เลือก';badge.classList.toggle('is-locked',!!selection?.locked);
    if(!selection)return;
    $('[data-ae-selection-count]').textContent='เลือก '+state.selectionCount+' ชิ้น';
    $('[data-ae-reference]').textContent='● ชิ้นอ้างอิง: '+selection.name;
    const multi=$('[data-ae-action="multi-select"]');multi.classList.toggle('on',!!state.multiSelect);multi.textContent=state.multiSelect?'✓ กำลังเลือกหลายชิ้น':'เลือกหลายชิ้น';
    $$('[data-ae-align]').forEach(button=>button.disabled=state.selectionCount<2);
    $('[data-ae-action="group"]').disabled=!state.canGroup;$('[data-ae-action="ungroup"]').disabled=!state.canUngroup;
    const name=$('[data-ae-name]');if(document.activeElement!==name)name.value=selection.name||'';
    $('[data-ae-x]').textContent=format(selection.position.x);$('[data-ae-y]').textContent=format(selection.position.y);$('[data-ae-z]').textContent=format(selection.position.z);
    lockedControls().forEach(control=>control.disabled=selection.locked);
    $$('[data-ae-size]').forEach(input=>{if(document.activeElement!==input)input.value=format(selection.size[input.dataset.aeSize]);input.disabled=selection.locked||!selection.transformPolicy?.canResize||state.selectionCount!==1;input.title=selection.transformPolicy?.canResize?'':'ใช้เมนูเปลี่ยนขนาด → ย่อ–ขยายทั้งชิ้น';});
    $('[data-ae-action="reset-size"]').disabled=selection.locked||!selection.transformPolicy?.canResize||state.selectionCount!==1;
    $$('[data-ae-action="details"]').forEach(button=>button.disabled=selection.locked);$('[data-ae-action="lock"]').disabled=false;$('[data-ae-action="lock"]').textContent=selection.locked?'Unlock':'Lock';
    $$('[data-ae-move]').forEach(button=>button.classList.toggle('on',button.dataset.aeMove===state.moveMode));
    $$('[data-ae-orientation]').forEach(button=>{button.classList.toggle('on',button.dataset.aeOrientation===selection.orientation);button.disabled=selection.locked||selection.canOrient===false;});
    $('[data-ae-orientation-note]').textContent=selection.canOrient===false?'Asset โครงสร้างชนิดนี้ล็อกแนววางไว้':'รักษาจุดกึ่งกลางฐาน · หมุนแกน X/Z อัตโนมัติ · Snap ใช้ขนาดหลังหมุน';
    $$('[data-ae-surface]').forEach(button=>button.classList.toggle('on',button.dataset.aeSurface===selection.appearance.mode));
    $('[data-ae-surface-note]').textContent=(selection.appearance.hasSticker?'มีสติ๊กเกอร์อยู่บน Asset · ':'')+'สี วัสดุ สติ๊กเกอร์ และไฟขอบ · บันทึกในหน้าต่างเดียว';
    $('[data-ae-action="undo"]').disabled=!state.canUndo;$('[data-ae-action="redo"]').disabled=!state.canRedo;
  }

  $('[data-ae-name]').addEventListener('change',event=>bridge()?.setName?.(event.target.value));
  $$('[data-ae-size]').forEach(input=>{
    let timer=null;
    const commit=()=>{clearTimeout(timer);timer=null;bridge()?.setSize?.(input.dataset.aeSize,input.value,$('[data-ae-ratio]').checked);};
    input.addEventListener('input',()=>{clearTimeout(timer);timer=setTimeout(commit,280);});
    input.addEventListener('change',commit);
    input.addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();commit();input.blur();}});
  });
  $$('[data-ae-move]').forEach(button=>button.addEventListener('click',()=>bridge()?.setMoveMode?.(button.dataset.aeMove)));
  $$('[data-ae-align]').forEach(button=>button.addEventListener('click',()=>bridge()?.align?.(button.dataset.aeAlign)));
  $$('[data-ae-orientation]').forEach(button=>button.addEventListener('click',()=>bridge()?.setOrientation?.(button.dataset.aeOrientation)));
  $$('[data-ae-surface]').forEach(button=>button.addEventListener('click',()=>bridge()?.setAppearanceMode?.(button.dataset.aeSurface)));
  mount.addEventListener('click',event=>{
    const action=event.target.closest('[data-ae-action]')?.dataset.aeAction;if(!action)return;const api=bridge();
    const commands={
      'reset-size':()=>api?.resetSize?.(),'details':()=>api?.openSettings?.(),'rotate':()=>api?.rotate?.(),'lock':()=>api?.toggleLock?.(),
      'flip-x':()=>api?.flip?.('x'),'flip-y':()=>api?.flip?.('y'),'flip-z':()=>api?.flip?.('z'),'duplicate':()=>api?.duplicate?.(),'delete':()=>api?.remove?.(),
      'multi-select':()=>api?.toggleMultiSelect?.(),'group':()=>api?.group?.(),'ungroup':()=>api?.ungroup?.(),
      'undo':()=>api?.undo?.(),'redo':()=>api?.redo?.()
    };commands[action]?.();
  });
  window.addEventListener('yp:asset-editor-sync',syncEditor);
  document.querySelector('[data-asset-tab="editor"]')?.addEventListener('click',syncEditor);
  syncEditor();
}
