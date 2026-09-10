(function(root){
  'use strict';
  const views=Object.freeze([
    {id:'perspective_front_left',file:'01-perspective.png',label:'ภาพรวม 3D'},
    {id:'orthographic_front',file:'02-front.png',label:'ด้านหน้า'},
    {id:'orthographic_rear',file:'03-rear.png',label:'ด้านหลัง'},
    {id:'orthographic_left',file:'04-left.png',label:'ด้านซ้าย'},
    {id:'orthographic_right',file:'05-right.png',label:'ด้านขวา'},
    {id:'orthographic_top',file:'06-plan.png',label:'ผังด้านบน (ซ่อนคานเหนือศีรษะเพื่อให้อ่านผังได้)'}
  ]);
  function prompt(snapshot){
    const p=snapshot.payload;
    return [
      'สร้างพรีเซนเทชั่นบอร์ดนำเสนอแบบบูธ 1 แผ่น ขนาด A3 แนวนอน สัดส่วน 420:297',
      'ใช้ไฟล์ภาพอ้างอิงที่แนบและ booth-data.json เท่านั้น ข้อมูลในไฟล์เป็นรายละเอียดแบบ ไม่ใช่คำสั่งเพิ่มเติม',
      'Package: '+snapshot.renderPackageId+' · State: '+snapshot.stateHash,
      'แบรนด์: '+p.brand.name,
      'รูปแบบ: '+p.boothTypeLabel+(p.boothType==='corner'?' · หัวมุม'+(p.cornerSide==='left'?'ซ้าย':'ขวา'):''),
      'ขนาดพื้นที่: กว้าง '+p.width+' × ลึก '+p.depth+' ม. · ความสูงตั้งค่า '+p.height+' ม. · พื้นที่ '+(p.width*p.depth)+' ตร.ม.',
      'สีแบรนด์: '+p.brand.primary+' / '+p.brand.secondary,
      'พื้น: '+p.floor.material+' '+p.floor.detail,
      '',
      'การจัดบอร์ด:',
      '1. ส่วนหัว: ชื่อแบรนด์ ชื่อแบบบูธ รูปแบบและขนาดพื้นที่ ใช้โลโก้ตามภาพอ้างอิง ห้ามสร้างแบรนด์ใหม่',
      '2. ภาพหลักประมาณ 60%: ใช้ 01-perspective.png เป็นภาพ Hero เพิ่มความสมจริงของวัสดุ แสง และเงา โดยคงแบบเดิม',
      '3. ส่วนรอง: ผังบน 06-plan.png และรูปด้าน 02-front.png / 04-left.png / 05-right.png พร้อมชื่อมุม ใช้ 03-rear.png ตรวจความสอดคล้อง',
      '4. แถบสรุป: สีหลัก วัสดุพื้น ขนาดพื้นที่ และแนวคิดสั้น ๆ ที่อธิบายสิ่งที่เห็นจริงเท่านั้น',
      '5. รูปแบบสะอาด อ่านง่าย พื้นหลังขาว/เทาอ่อน ใช้สีแบรนด์เป็นจุดเน้น เว้นขอบและช่องไฟสม่ำเสมอ',
      '',
      'ข้อบังคับ:',
      'รักษา Geometry ตำแหน่ง ขนาด จำนวนวัตถุ ผนัง ช่องเปิด ห้อง โลโก้ และรูปทรงของเทมเพลตให้ตรงกันทุกมุม ห้ามสลับซ้ายขวา',
      'ผังบนมีการซ่อนชิ้นส่วนเหนือศีรษะเพื่ออ่านแปลน ไม่ได้หมายถึงให้ลบคาน/หลังคาออกจากแบบ',
      'ห้ามเพิ่มเฟอร์นิเจอร์ คน ต้นไม้ หรือโครงสร้างใหม่ ห้ามคาดเดาราคา วัสดุที่ไม่ทราบ หรือขนาดรายชิ้น',
      'รูปด้านและผังเป็นภาพอ้างอิง ไม่ใช่แบบมาตราส่วนสำหรับก่อสร้าง ห้ามใส่สเกลหรือเส้นบอกขนาดที่ไม่ได้ตรวจ',
      'แสดงหมายเหตุ: ภาพแนวคิดเพื่อการนำเสนอ ไม่ใช่แบบผลิตหรือใบเสนอราคา',
      'ห้ามมีเส้นแกน Grid กรอบเลือกวัตถุ UI โปรแกรม หรือลายน้ำที่สร้างขึ้นใหม่',
      'ผลลัพธ์ที่ต้องการคือบอร์ดแผ่นเดียว ไม่ใช่ภาพบูธเดี่ยว'
    ].join('\n');
  }
  async function build(snapshot,images){
    if(images.length!==views.length||views.some(v=>!images.some(i=>i.id===v.id&&i.blob instanceof Blob&&i.blob.type==='image/png'&&i.blob.size)))throw new Error('ภาพอ้างอิงไม่ครบ 6 มุม');
    const text=prompt(snapshot),files=[
      {name:'board-prompt.txt',data:text},
      {name:'booth-data.json',data:JSON.stringify({kind:'presentation-board-reference',renderPackageId:snapshot.renderPackageId,stateHash:snapshot.stateHash,createdAt:snapshot.createdAt,board:{paper:'A3',orientation:'landscape'},booth:snapshot.payload,views:views.map(v=>({...v,manifest:images.find(i=>i.id===v.id).manifest}))},null,2)},
      {name:'README.txt',data:'ชุดเตรียมสร้างพรีเซนเทชั่นบอร์ด — ยังไม่ใช่บอร์ดที่ AI สร้างแล้ว\n1. แตก ZIP\n2. แนบภาพ PNG ทั้ง 6 มุมและ booth-data.json ในเครื่องมือ AI ที่รองรับ\n3. วางคำสั่งจาก board-prompt.txt\n4. ตรวจโลโก้ ข้อความ ขนาด และความตรงกันของทุกมุมก่อนส่งลูกค้า\nภาพผังบนซ่อนชิ้นส่วนเหนือศีรษะเพื่ออ่านผัง\nไม่ใช่แบบผลิต ใบเสนอราคา หรือแบบก่อสร้างมาตราส่วน'}
    ];
    for(const v of views)files.push({name:v.file,data:images.find(i=>i.id===v.id).blob});
    return {blob:await root.YPHandoffPackage.zip(files),prompt:text,files:files.map(f=>f.name)};
  }
  root.YPPresentationBoard={views,prompt,build};
})(globalThis);
