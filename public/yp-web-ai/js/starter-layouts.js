(function(root){
  'use strict';
  const PURPOSES=Object.freeze([
    {id:'display',name:'โชว์สินค้า',description:'เน้นแท่นโชว์และชั้นสินค้า พร้อมจุดต้อนรับ'},
    {id:'sales',name:'ขายสินค้า',description:'เน้นเคาน์เตอร์ขายและพื้นที่เลือกสินค้า'},
    {id:'meeting',name:'เจรจาธุรกิจ',description:'เน้นโต๊ะและเก้าอี้ 2 ที่นั่ง พร้อมจุดต้อนรับ'}
  ]);
  const SUPPORTED=['inline','corner','penin','island'],GAP=.12,LANE=.9;
  const overlaps=(a,b,gap=0)=>a.x0<b.x1+gap-1e-7&&a.x1>b.x0-gap+1e-7&&a.z0<b.z1+gap-1e-7&&a.z1>b.z0-gap+1e-7;
  const rect=(x,z,w,d)=>({x0:x-w/2,x1:x+w/2,z0:z-d/2,z1:z+d/2});
  function plan(context,purpose){
    const info=PURPOSES.find(item=>item.id===purpose),{width:W,depth:D}=context;
    const empty={ok:false,purpose,placements:[],skipped:[],lanes:[],sourceKey:context.sourceKey};
    if(!info)return {...empty,message:'กรุณาเลือกวัตถุประสงค์'};
    if(!SUPPORTED.includes(context.type))return {...empty,message:'ผังตั้งต้นรองรับ Inline, Corner, Peninsular และ Island เท่านั้น รูปแบบพิเศษยังจัดเองได้ตามเดิม'};
    if(!Number.isFinite(W)||!Number.isFinite(D)||W<1||D<1)return {...empty,message:'ขนาดบูธไม่ถูกต้อง'};
    const catalog=new Map(context.catalog.map(item=>[item.catalogId,item]));
    const unit=(id,x=0,z=0,rotationY=0)=>({catalogId:id,x,z,rotationY});
    const displayId=context.walls.includes('back')?'shelf-standard':'display-standard';
    const recipes={
      display:[{parts:[unit('display-standard')],role:'show',required:true},{parts:[unit(displayId)],role:'back'},
        {parts:[unit(displayId)],role:'back'},{parts:[unit('counter-standard')],role:'front'}],
      sales:[{parts:[unit('counter-standard')],role:'front',required:true},{parts:[unit('counter-standard')],role:'front'},
        {parts:[unit(displayId)],role:'back'},{parts:[unit('display-standard')],role:'show'}],
      meeting:[{parts:[unit('table-standard'),unit('chair-standard',0,-.85,0),unit('chair-standard',0,.85,180)],role:'meeting',required:true},
        {parts:[unit('counter-standard')],role:'front'},{parts:[unit('plant-medium')],role:'back'}]
    };
    const recipe=recipes[purpose];
    if(recipe.some(group=>group.parts.some(part=>!catalog.has(part.catalogId))))return {...empty,message:'อุปกรณ์ที่จำเป็นไม่ครบในคลัง จึงยังไม่สร้างผัง'};
    const wall=context.wallThickness||.1,edge=.12,limits={x0:edge+(context.walls.includes('left')?wall:0),x1:W-edge-(context.walls.includes('right')?wall:0),z0:edge+(context.walls.includes('back')?wall:0),z1:D-edge};
    const obstacles=context.obstacles||[],room=context.room;
    const laneXs=[W/2,limits.x0+LANE/2+.04,limits.x1-LANE/2-.04];
    let best=null;
    for(const laneX of laneXs){
      const lane={x0:laneX-LANE/2,x1:laneX+LANE/2,z0:D*.25,z1:D};
      if(lane.x0<limits.x0||lane.x1>limits.x1||obstacles.some(o=>overlaps(o,lane)))continue;
      const lanes=[lane];
      // Connect additional open sides to the same reserved circulation space.
      if(!context.walls.includes('left'))lanes.push({x0:0,x1:lane.x1,z0:D*.65-LANE/2,z1:D*.65+LANE/2});
      if(!context.walls.includes('right'))lanes.push({x0:lane.x0,x1:W,z0:D*.65-LANE/2,z1:D*.65+LANE/2});
      if(!context.walls.includes('back'))lanes.push({x0:lane.x0,x1:lane.x1,z0:0,z1:lane.z0});
      if(obstacles.some(o=>lanes.some(l=>overlaps(o,l))))continue;
      const placements=[],occupied=[],skipped=[];let failed=false;
      for(const group of recipe){
        const parts=group.parts.map(part=>{
          const item=catalog.get(part.catalogId),swap=Math.abs(Math.sin(part.rotationY*Math.PI/180))>.5;
          return {...part,w:swap?item.size.d:item.size.w,d:swap?item.size.w:item.size.d,h:item.size.h};
        });
        const bounds={x0:Math.min(...parts.map(p=>p.x-p.w/2)),x1:Math.max(...parts.map(p=>p.x+p.w/2)),z0:Math.min(...parts.map(p=>p.z-p.d/2)),z1:Math.max(...parts.map(p=>p.z+p.d/2))};
        const minX=limits.x0-bounds.x0,maxX=limits.x1-bounds.x1,minZ=limits.z0-bounds.z0,maxZ=limits.z1-bounds.z1;
        const candidates=[],step=Math.max(.18,Math.max(W,D)/55);
        if(minX<=maxX&&minZ<=maxZ){
          const xs=[minX,maxX],zs=[minZ,maxZ];for(let x=minX;x<maxX;x+=step)xs.push(x);for(let z=minZ;z<maxZ;z+=step)zs.push(z);
          for(const x of xs)for(const z of zs){
            const box={x0:x+bounds.x0,x1:x+bounds.x1,z0:z+bounds.z0,z1:z+bounds.z1};
            if(obstacles.some(o=>overlaps(box,o,GAP))||occupied.some(o=>overlaps(box,o,GAP))||lanes.some(l=>overlaps(box,l)))continue;
            const proposed=parts.map(p=>({catalogId:p.catalogId,x:+(x+p.x).toFixed(4),z:+(z+p.z).toFixed(4),rotationY:p.rotationY,w:p.w,d:p.d,h:p.h}));
            if(context.accept&&!proposed.every(context.accept))continue;
            const targetZ=group.role==='front'?D*.82:group.role==='back'?limits.z0:D*.4;
            const targetX=room&&room.x0>W/2?W*.25:W*.7;
            const score=Math.abs(z-targetZ)*3+Math.abs(x-targetX)*.2;
            candidates.push({proposed,box,score});
          }
        }
        candidates.sort((a,b)=>a.score-b.score);const choice=candidates[0];
        if(!choice){if(group.required){failed=true;break;}skipped.push(...group.parts.map(p=>catalog.get(p.catalogId).name));continue;}
        placements.push(...choice.proposed);occupied.push(choice.box);
      }
      if(!failed&&(!best||placements.length>best.placements.length))best={...empty,ok:true,placements,skipped,lanes,room,occupied,message:skipped.length?'ลดอุปกรณ์เสริม '+skipped.length+' ชิ้น เพราะพื้นที่ไม่พอ':'จัดอุปกรณ์ตามผังได้ครบ'};
    }
    return best||{...empty,message:'พื้นที่ว่างไม่พอสำหรับผังนี้โดยคงทางเข้าและอุปกรณ์ที่ต้องเก็บไว้ ลองลดห้องเก็บของ เพิ่มพื้นที่ หรือจัดวางเอง'};
  }
  root.YPStarterLayouts={PURPOSES,plan,overlaps,rect,LANE};
})(globalThis);
