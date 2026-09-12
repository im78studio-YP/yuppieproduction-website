(function(root){
 'use strict';
 function plan(sources,bounds,options,idFactory=()=>crypto.randomUUID()){
  const {axis,direction,mode,unit}=options,count=Number(options.count),distance=Number(options.distance);
  if(!sources.length)throw Error('เลือกอุปกรณ์ก่อนทำสำเนา');
  if(!['x','y','z'].includes(axis)||![1,-1].includes(Number(direction)))throw Error('เลือกแกนและทิศทางให้ถูกต้อง');
  if(!['gap','step'].includes(mode)||!['cm','m'].includes(unit))throw Error('เลือกวิธีวัดระยะและหน่วย');
  if(!Number.isInteger(count)||count<1||count>100||count*sources.length>300)throw Error('จำนวนต้องเป็นจำนวนเต็ม 1–100 และรวมไม่เกิน 300 ชิ้นต่อครั้ง');
  if(String(options.distance).trim()===''||!Number.isFinite(distance)||distance<0)throw Error('ระยะห่างต้องเป็นตัวเลขตั้งแต่ 0 ขึ้นไป');
  const extent=bounds.max[axis]-bounds.min[axis],metres=distance/(unit==='cm'?100:1),step=(mode==='gap'?extent+metres:metres)*Number(direction);
  if(!Number.isFinite(extent)||extent<0||!Number.isFinite(step))throw Error('ยังอ่านขนาดวัตถุไม่ได้');
  const objects=[],offsets=[];
  for(let n=1;n<=count;n++){
   const offset={x:0,y:0,z:0};offset[axis]=step*n;offsets.push(offset);const groups=new Map();
   for(const source of sources){
    const o=structuredClone(source);o.id='obj-array-'+idFactory();o.locked=false;
    o.position={...source.position,[axis]:Number((source.position[axis]+offset[axis]).toFixed(6))};
    if(!Object.values(o.position).every(Number.isFinite))throw Error('พิกัดสำเนาไม่ถูกต้อง');
    if(source.groupId){if(!groups.has(source.groupId))groups.set(source.groupId,'group-array-'+idFactory());o.groupId=groups.get(source.groupId);}else delete o.groupId;
    // Copies keep their current world pose. They never inherit a live constraint
    // back to the original wall/asset, nor mutate the original attachment graph.
    o.attachment=null;o.placement={...(o.placement||{}),mode:'free',surface:'free',targetId:null,anchorAttachment:null,snapCandidate:null,installFreely:true,allowOutsideBooth:true,duplicateSourceId:source.id};
    objects.push(o);
   }
  }
  return {objects,offsets,step,extent,total:objects.length};
 }
 root.YPCopyArray={plan};
})(globalThis);
