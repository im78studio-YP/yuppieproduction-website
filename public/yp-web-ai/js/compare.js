(function(root){
  'use strict';
  const format=n=>Number(n.toFixed(3)).toLocaleString('th-TH');
  function signature(project){
    const variants=structuredClone(project.variants);
    // Viewport/camera updates and AI request caches are not changes to the design.
    for(const snapshot of Object.values(variants))if(snapshot){delete snapshot.spec.aiRendering;delete snapshot.spec.view;}
    return JSON.stringify(variants);
  }
  function describe(snapshot){
    if(!snapshot)return null;
    const s=snapshot.spec,names=new Map((s.sceneAssetRegistry?.assets||[]).map(a=>[a.id,a.name])),items=new Map();
    for(const o of s.objects){const row=items.get(o.catalogId)||{id:o.catalogId,name:names.get(o.id)||o.name||o.catalogId,count:0,hidden:0};row.count++;if(o.visible===false)row.hidden++;items.set(o.catalogId,row);}
    return {size:[s.W,s.D,s.H].map(format).join(' × ')+' ม.',area:format(s.W*s.D)+' ตร.ม.',
      type:({inline:'ด้านเปิด 1 ด้าน',corner:'มุมเปิด 2 ด้าน',penin:'เปิด 3 ด้าน',island:'เปิด 4 ด้าน'})[s.type]||s.type||'ยังไม่ระบุ',
      purpose:({display:'โชว์สินค้า',sales:'ขายสินค้า',meeting:'เจรจาธุรกิจ'})[s.designPurpose]||'ยังไม่ระบุ',brand:s.brand||'ยังไม่ระบุ',logo:s.logo?'มีไฟล์โลโก้':'ยังไม่มีไฟล์โลโก้',
      count:s.objects.length,hidden:s.objects.filter(o=>o.visible===false).length,items:[...items.values()]};
  }
  function compare(project){
    const a=describe(project.variants.A),b=describe(project.variants.B),rows=[];
    if(a&&b){
      for(const [key,label] of Object.entries({size:'ขนาด กว้าง × ลึก × สูง',area:'พื้นที่บูธ',type:'ด้านเปิด',purpose:'วัตถุประสงค์',brand:'ชื่อแบรนด์',logo:'ไฟล์โลโก้',count:'วัตถุทั้งหมด',hidden:'วัตถุที่ซ่อน'}))rows.push({label,a:String(a[key]),b:String(b[key]),different:a[key]!==b[key]});
      const left=new Map(a.items.map(i=>[i.id,i])),right=new Map(b.items.map(i=>[i.id,i]));
      for(const id of new Set([...left.keys(),...right.keys()])){
        const x=left.get(id),y=right.get(id);rows.push({id,label:(x||y).name,a:String(x?.count||0),b:String(y?.count||0),different:(x?.count||0)!==(y?.count||0)});
      }
    }
    return {A:a,B:b,rows};
  }
  function extent(spec){
    // A rotation-independent envelope is deliberately conservative: no auto-fit per image.
    let min=[0,0,0],max=[spec.W,Math.max(spec.H,Number(spec.stHv)||0)+(Number(spec.raise)||0)/100,spec.D];
    for(const o of spec.objects){
      if(o.visible===false)continue;
      const scale=Math.max(.001,Math.abs(Number(typeof o.transform?.scale==='number'?o.transform.scale:o.transform?.scale?.x??o.transform?.uniformScale??1))||1);
      const radius=Math.hypot(o.size.w,o.size.d,o.size.h)*scale;
      const p=[o.position.x,o.position.y+(Number(spec.raise)||0)/100,o.position.z];
      min=min.map((v,i)=>Math.min(v,p[i]-radius));max=max.map((v,i)=>Math.max(v,p[i]+radius));
    }
    const half=max.map((v,i)=>(v-min[i])/2);
    return {center:min.map((v,i)=>(v+max[i])/2),half,radius:Math.hypot(...half)};
  }
  function cameras(project,measured={}){
    const boxes=Object.fromEntries(['A','B'].filter(k=>project.variants[k]).map(k=>{
      const bounds=measured[k];if(!bounds)return[k,extent(project.variants[k].spec)];
      if(!['min','max'].every(key=>Array.isArray(bounds[key])&&bounds[key].length===3&&bounds[key].every(Number.isFinite))||bounds.max.some((v,i)=>v<bounds.min[i]))throw new Error('กรอบภาพแบบ '+k+' ไม่ถูกต้อง');
      const half=bounds.max.map((v,i)=>(v-bounds.min[i])/2);
      return[k,{center:bounds.min.map((v,i)=>(v+bounds.max[i])/2),half,radius:Math.hypot(...half)}];
    }));
    const radius=Math.max(1,...Object.values(boxes).map(b=>b.radius)),aspect=4/3,distance=radius*4,dir=[1,.7,1],len=Math.hypot(...dir);
    const right=[Math.SQRT1_2,0,-Math.SQRT1_2],up=[-.7*Math.SQRT1_2/len,Math.SQRT2/len,-.7*Math.SQRT1_2/len];
    const span=(half,axis)=>half.reduce((n,value,i)=>n+value*Math.abs(axis[i]),0);
    const height=Math.max(1,...Object.values(boxes).map(b=>Math.max(span(b.half,up),span(b.half,right)/aspect)))*2.25;
    return Object.fromEntries(Object.entries(boxes).map(([slot,box])=>{
      const target={x:box.center[0],y:box.center[1],z:box.center[2]},position={x:target.x+dir[0]/len*distance,y:target.y+dir[1]/len*distance,z:target.z+dir[2]/len*distance};
      return [slot,{projection:'orthographic',cameraViewType:'comparison',position,target,up:{x:0,y:1,z:0},zoom:1,near:.01,far:Math.max(1000,distance*10),frustum:{left:-height*aspect/2,right:height*aspect/2,top:height/2,bottom:-height/2},renderProfile:{aspectRatio:aspect,comparison:true}}];
    }));
  }
  root.YPCompare={describe,compare,cameras,signature};
})(globalThis);
