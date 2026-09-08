/* Offline handoff: data-only summary and ZIP (store method, no network dependencies). */
(function(root){
  'use strict';
  const fields={contact:'ชื่อผู้ติดต่อ',phone:'เบอร์โทร',company:'บริษัท',event:'ชื่องาน',venue:'สถานที่',eventDate:'วันเริ่มงาน',install:'วันติดตั้ง',dismantle:'วันรื้อถอน',budget:'งบประมาณที่แจ้ง',notes:'รายละเอียดเพิ่มเติม'};
  const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function validateBrief(input){
    const brief={};
    for(const key of Object.keys(fields)){
      brief[key]=String(input[key]??'').trim();
      if(brief[key].length>(key==='notes'?2000:200)||/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(brief[key]))throw new Error(fields[key]+' ยาวเกินไปหรือมีอักขระไม่รองรับ');
    }
    if(!brief.contact)throw new Error('กรุณากรอกชื่อผู้ติดต่อ');
    if(!/^[+\d ()-]{7,30}$/.test(brief.phone)||brief.phone.replace(/\D/g,'').length<7)throw new Error('กรุณากรอกเบอร์โทรให้ครบ');
    for(const key of ['eventDate','install','dismantle'])if(brief[key]){
      const date=new Date(brief[key]+'T00:00:00Z');
      if(!/^\d{4}-\d{2}-\d{2}$/.test(brief[key])||!Number.isFinite(date.getTime())||date.toISOString().slice(0,10)!==brief[key])throw new Error(fields[key]+' ไม่ถูกต้อง');
    }
    if(brief.install&&brief.dismantle&&brief.install>brief.dismantle)throw new Error('วันรื้อถอนต้องไม่ก่อนวันติดตั้ง');
    return brief;
  }
  function selectProject(project,slot){
    root.YPProjectStore.validate(project);
    if(!['A','B'].includes(slot)||!project.variants[slot])throw new Error('ไม่พบแบบที่เลือก');
    const selected=root.YPProjectStore.clone(project);selected.active=slot;selected.variants[slot==='A'?'B':'A']=null;return selected;
  }
  function inspect(spec,brief,geometry){
    const warnings=[],add=(code,message,extra={})=>warnings.push({code,message,...extra});
    if(!spec.logo)add('missing-logo','ยังไม่มีไฟล์โลโก้ กรุณาแนบในแบบหรือส่งให้ทีมภายหลัง');
    if(!String(spec.brand||'').trim())add('missing-brand','ยังไม่ระบุชื่อแบรนด์');
    for(const key of ['event','venue','eventDate','install','dismantle'])if(!brief[key])add('missing-'+key,'ยังไม่ระบุ'+fields[key],{field:key});
    if(brief.install&&brief.eventDate&&brief.install>brief.eventDate)add('install-after-event','วันติดตั้งอยู่หลังวันเริ่มงาน กรุณาตรวจวันอีกครั้ง',{field:'install'});
    if(brief.dismantle&&brief.eventDate&&brief.dismantle<brief.eventDate)add('dismantle-before-event','วันรื้อถอนอยู่ก่อนวันเริ่มงาน กรุณาตรวจวันอีกครั้ง',{field:'dismantle'});
    const names=new Map((spec.sceneAssetRegistry?.assets||[]).map(a=>[a.id,a.name])),bounds=new Map((geometry||[]).map(row=>[row.id,row.bounds]));
    let checked=0;
    const rectangular=['inline','corner','penin','island'].includes(spec.type);
    if(!rectangular)add('unsupported-boundary','บูธรูปแบบนี้ต้องให้ทีมตรวจขอบเขตพื้นที่เอง ระบบยังไม่ตรวจพื้นที่รูปทรงพิเศษ');
    else for(const obj of spec.objects){
      const b=bounds.get(obj.id),name=obj.label||names.get(obj.id)||obj.name||obj.catalogId;
      if(!b||!['x0','x1','z0','z1'].every(key=>Number.isFinite(b[key]))||b.x1<b.x0||b.z1<b.z0){add('bounds-unavailable','ยังตรวจขอบเขต “'+name+'” ไม่ได้ ให้ทีมตรวจตำแหน่งเพิ่มเติม',{objectId:obj.id});continue;}
      checked++;
      const excess={left:Math.max(0,-b.x0),right:Math.max(0,b.x1-spec.W),back:Math.max(0,-b.z0),front:Math.max(0,b.z1-spec.D)};
      const sides=Object.entries(excess).filter(([,distance])=>distance>.005);
      if(sides.length){
        const labels={left:'ซ้าย',right:'ขวา',back:'หลัง',front:'หน้า'};
        add('outside-booth','“'+name+'” อาจล้ำพื้นที่ด้าน'+sides.map(([side,distance])=>labels[side]+'ประมาณ '+(distance*100).toFixed(1)+' ซม.').join(' / ')+(obj.visible===false?' (วัตถุถูกซ่อนอยู่)':''),{objectId:obj.id,excess});
      }
    }
    const priority=code=>code==='outside-booth'?0:['bounds-unavailable','unsupported-boundary'].includes(code)?1:code.includes('before-event')||code.includes('after-event')?2:3;
    warnings.sort((a,b)=>priority(a.code)-priority(b.code));
    return {version:1,kind:'advisory-only',checkedObjects:checked,totalObjects:spec.objects.length,toleranceM:.005,warnings,
      scope:'ตรวจขอบเขตโดยประมาณจากกรอบวัตถุและพื้นที่สี่เหลี่ยม ไม่ตรวจการชน ทางเดิน การรับน้ำหนัก หรือข้อกำหนดสถานที่ ไม่ใช่การรับรองแบบผลิต'};
  }
  function summary(project,brief,geometry){
    const spec=project.variants[project.active].spec;
    const names=new Map((spec.sceneAssetRegistry?.assets||[]).map(asset=>[asset.id,asset.name]));
    return {format:'yuppie-booth-handoff',version:1,createdAt:new Date().toISOString(),projectId:project.id,projectName:project.name,selected:project.active,
      status:'prepared-offline-not-sent',brief:validateBrief(brief),booth:{width:spec.W,depth:spec.D,height:spec.H,unit:'m',brand:spec.brand||'',purpose:spec.designPurpose||'',type:spec.type||'',storage:spec.stSize||'none'},
      equipment:spec.objects.map(o=>({id:o.id,catalogId:o.catalogId,name:o.label||names.get(o.id)||o.name||o.catalogId,size:{...o.size},position:{...o.position},rotationY:o.rotationY||0})),
      readiness:inspect(spec,brief,geometry),
      disclaimer:'แบบร่างสำหรับหารือ ไม่ใช่ใบเสนอราคาหรือแบบผลิต รายการอุปกรณ์ไม่ใช่ BOM ครบทุกวัสดุ ทีมงานต้องตรวจขนาด โครงสร้าง และราคาก่อนผลิต'};
  }
  function summaryHTML(data,hasImage){
    const rows=data.equipment.map((o,i)=>`<tr><td>${i+1}</td><td>${escape(o.name)}<br><small>${escape(o.catalogId)}</small></td><td>${escape(o.size.w)} × ${escape(o.size.d)} × ${escape(o.size.h)}</td></tr>`).join('');
    const report=data.readiness;
    const review=report?`<section><h2>จุดที่ต้องให้ทีมตรวจต่อ (${report.warnings.length})</h2><p>${escape(report.scope)}</p><ul>${report.warnings.map(w=>`<li>${escape(w.message)}</li>`).join('')||'<li>ไม่พบคำเตือนจากรายการที่ตรวจ ยังต้องให้ทีมตรวจแบบก่อนผลิต</li>'}</ul></section>`:'';
    return `<!doctype html><html lang="th"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>สรุปงาน ${escape(data.projectName)}</title><style>body{font:16px/1.6 system-ui,sans-serif;max-width:900px;margin:32px auto;padding:0 20px;color:#20232b}h1{font-size:26px}table{width:100%;border-collapse:collapse}td,th{padding:8px;text-align:left;border-bottom:1px solid #ccc}dt{font-weight:bold}dd{margin:0 0 12px;white-space:pre-wrap;overflow-wrap:anywhere}img{max-width:100%}.notice{background:#fff3d3;padding:16px}@media print{tr,img{break-inside:avoid}}</style><h1>${escape(data.projectName)} · แบบ ${escape(data.selected)}</h1><p class="notice">เตรียมชุดงานไว้ในเครื่องแล้ว — ยังไม่ได้ส่งถึงทีม Yuppie<br>${escape(data.disclaimer)}</p><p>สร้างเมื่อ ${escape(data.createdAt)} · รหัส ${escape(data.projectId)}</p><h2>ข้อมูลงาน</h2><dl>${Object.entries(fields).map(([k,label])=>`<dt>${label}</dt><dd>${escape(data.brief[k]||'ยังไม่ระบุ')}</dd>`).join('')}</dl><h2>แบบบูธที่เลือก</h2><p>แบรนด์: ${escape(data.booth.brand||'ยังไม่ระบุ')} · กว้าง ${data.booth.width} × ลึก ${data.booth.depth} × สูง ${data.booth.height} เมตร</p>${hasImage?'<img src="booth.png" alt="ภาพบูธจากแบบที่เลือก">':'<p class="notice">ไม่มีภาพบูธในชุดนี้ ให้เปิด project.ypbooth.json ในเว็บเพื่อตรวจแบบ</p>'}${review}<h2>วัตถุในแบบ ${data.equipment.length} ชิ้น</h2><table><thead><tr><th>ลำดับ</th><th>รายการ</th><th>กว้าง × ลึก × สูง (ม.)</th></tr></thead><tbody>${rows||'<tr><td colspan="3">ไม่มีวัตถุเพิ่มเติมในแบบ</td></tr>'}</tbody></table><p>แตกไฟล์ ZIP ก่อนเปิด summary.html และนำ project.ypbooth.json ไปเปิดผ่านปุ่ม “เปิดไฟล์” ในเว็บเพื่อแก้ต่อ ชุดนี้รวมเฉพาะแบบที่เลือก</p></html>`;
  }
  const encoder=new TextEncoder();
  function crc32(bytes){let crc=0xffffffff;for(const b of bytes){crc^=b;for(let j=0;j<8;j++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);}return (crc^0xffffffff)>>>0;}
  async function zip(files){
    const parts=[],central=[];let offset=0,total=0;
    if(files.length>100)throw new Error('จำนวนไฟล์มากเกินไป');
    for(const file of files){
      if(!/^[a-zA-Z0-9_.-]+$/.test(file.name))throw new Error('ชื่อไฟล์ไม่ปลอดภัย');
      const blob=file.data instanceof Blob?file.data:new Blob([file.data]);total+=blob.size;
      if(total>160*1024*1024)throw new Error('ชุดไฟล์เกิน 160 MB กรุณาลดขนาดรูปหรือโมเดล');
      const bytes=new Uint8Array(await blob.arrayBuffer()),name=encoder.encode(file.name),crc=crc32(bytes);
      const local=new Uint8Array(30+name.length),lv=new DataView(local.buffer);
      lv.setUint32(0,0x04034b50,true);lv.setUint16(4,20,true);lv.setUint16(6,0x800,true);lv.setUint16(12,33,true);lv.setUint32(14,crc,true);lv.setUint32(18,bytes.length,true);lv.setUint32(22,bytes.length,true);lv.setUint16(26,name.length,true);local.set(name,30);
      const header=new Uint8Array(46+name.length),cv=new DataView(header.buffer);
      cv.setUint32(0,0x02014b50,true);cv.setUint16(4,20,true);cv.setUint16(6,20,true);cv.setUint16(8,0x800,true);cv.setUint16(14,33,true);cv.setUint32(16,crc,true);cv.setUint32(20,bytes.length,true);cv.setUint32(24,bytes.length,true);cv.setUint16(28,name.length,true);cv.setUint32(42,offset,true);header.set(name,46);
      parts.push(local,bytes);central.push(header);offset+=local.length+bytes.length;
    }
    const end=new Uint8Array(22),ev=new DataView(end.buffer);ev.setUint32(0,0x06054b50,true);ev.setUint16(8,files.length,true);ev.setUint16(10,files.length,true);ev.setUint32(12,central.reduce((n,b)=>n+b.length,0),true);ev.setUint32(16,offset,true);
    return new Blob([...parts,...central,end],{type:'application/zip'});
  }
  async function build(project,brief,picture,geometry){
    const selected=selectProject(project,project.active),data=summary(selected,brief,geometry),hasImage=picture instanceof Blob&&picture.size>0&&picture.type==='image/png';
    data.imageIncluded=hasImage;
    const files=[{name:'project.ypbooth.json',data:await root.YPProjectStore.toText(selected)},{name:'brief.json',data:JSON.stringify(data,null,2)},{name:'summary.html',data:summaryHTML(data,hasImage)},
      {name:'README.txt',data:'ชุดงานนี้ยังไม่ได้ส่งถึงทีม Yuppie และไม่ใช่ใบเสนอราคา\nแตกไฟล์ ZIP แล้วเปิด summary.html เพื่ออ่านข้อมูล\nเปิด project.ypbooth.json ในเว็บเพื่อแก้แบบต่อ (เฉพาะแบบ '+selected.active+')\n'+(hasImage?'มีภาพบูธ booth.png':'ไม่มีภาพบูธในชุดนี้')+'\nมีข้อมูลติดต่อส่วนบุคคล โปรดตรวจผู้รับก่อนส่งไฟล์'}];
    if(hasImage)files.push({name:'booth.png',data:picture});
    return {blob:await zip(files),data};
  }
  root.YPHandoffPackage={fields,validateBrief,selectProject,inspect,summary,summaryHTML,crc32,zip,build};
})(globalThis);
