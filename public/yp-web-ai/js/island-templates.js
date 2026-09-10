(function(root){
  'use strict';
  const part=(catalogId,x,z,w,d,h,color,y=0,extra={})=>({catalogId,position:{x,y,z},size:{w,d,h},color,...extra});
  const panel=(...args)=>part('panel-standard',...args);
  const rounded=(...args)=>part('panel-rounded',...args);
  const logo=(x,z,w,y,rotationY=0)=>part('brand-artwork-copy',x,z,w,.014,w*.252,null,y,{rotationY,brandLogo:true});
  const tv=(x,z,w,y,key)=>[panel(x,z,w,.09,w*.58,'#17242b',y,{tv:key}),panel(x,z+.052,w-.1,.015,w*.58-.1,'#12547e',y+.05,{tv:key})];
  const meeting=(x,z)=>[part('table-standard',x,z,.8,.65,.74,'#f3eee4'),part('chair-standard',x-.7,z,.48,.5,.8,'#e8e5dc',0,{rotationY:90}),part('chair-standard',x+.7,z,.48,.5,.8,'#e8e5dc',0,{rotationY:270})];
  const planter=(x,z,w)=>[part('planter-grass',x,z,w,.3,.7,null)];
  const templates=[{id:'island-canopy-garden',name:'01 · Canopy Garden',tagline:'ซุ้มไม้โค้ง + สวนแขวน + พื้นที่เจรจา',description:'ซุ้มไม้โค้งออร์แกนิก ระแนงไม้ด้านใน แผงทีวีสีฟ้าและป้ายโชว์ทรงวงกลม พร้อมโต๊ะเจรจา 2 ชุด เปิดทางเข้าออกทั้งสี่ด้าน',width:6,depth:6,height:3,primary:'#168da5',secondary:'#c8ae87',floor:'tile',tile:'woodL',purpose:'meeting',
    objects:[part('canopy-organic',3,4.1,5.65,1.65,.22,'#c8ae87',2.7),
      panel(.85,1.3,.12,.12,2.7,'#c8ae87'),panel(5.15,1.3,.12,.12,2.7,'#c8ae87'),panel(.85,4.15,.12,.12,2.7,'#c8ae87'),panel(5.15,4.15,.12,.12,2.7,'#c8ae87'),
      panel(.85,2.725,.14,2.99,.21,'#c8ae87',2.69),panel(5.15,2.725,.14,2.99,.21,'#c8ae87',2.69),panel(3,1.3,4.16,.14,.21,'#c8ae87',2.69),
      ...Array.from({length:10},(_,i)=>{const a=Math.PI*.95+i*Math.PI*.065;return panel(1.6+Math.cos(a)*.75,1.9+Math.sin(a)*.75,.065,.07,2.7,'#c8ae87');}),
      rounded(4.7,4.6,1.85,.22,2.35,'#168da5'),...tv(4.7,4.76,1.4,1.18,'main'),
      rounded(3.85,1.45,1.2,.18,2.22,'#f8f5ed'),rounded(3.85,1.552,1.06,.024,1.9,'#142738',.15),logo(3.85,1.57,.87,.88),
      part('display-ring',.85,4.4,1.18,.18,1.55,'#f8f5ed',.16),panel(.85,4.43,.9,.28,.06,'#168da5',.7),panel(.85,4.43,.9,.28,.06,'#168da5',1.14),
      ...meeting(2.25,2.55),...meeting(2.9,4.5),
      ...planter(.85,5.1,1.15),...planter(4.7,5.15,1.4),
      ...[2.45,3.4].map((x,i)=>part('plant-trailing',x,4.38,.65,.3,.72+i*.12,null,1.98-i*.12)),
      rounded(1.2,4.86,1.7,.12,.43,'#f8f5ed',2.23),rounded(3,1.08,1.9,.12,.43,'#f8f5ed',2.3),
      logo(1.2,4.93,1.12,2.32),logo(4.7,4.731,1.22,1.99),logo(3,1.01,1.5,2.33,180)]},
    {id:'island-blue-ribbon',name:'02 · Blue Ribbon',tagline:'ซุ้มโค้งน้ำเงิน + แผงกราฟิก + เคาน์เตอร์เข้ามุม',description:'ซุ้มริบบิ้นสีน้ำเงินคาดเส้นขาว แผงกราฟิกสูง แผงทีวีสีขาว ระแนงไม้และสวนแขวน พร้อมเคาน์เตอร์โค้ง จุดข้อมูล และโต๊ะเจรจา 4 ที่นั่ง จัดพื้นที่ให้เข้าออกได้ทั้งสี่ด้าน',width:6,depth:6,height:3,primary:'#167bd9',secondary:'#c8ae87',floor:'tile',tile:'woodL',purpose:'meeting',
      objects:[part('portal-ribbon',3,3.8,5.2,.6,3,'#167bd9'),
        part('canopy-ribbon',4.5,2.65,2.0,2.6,.22,'#167bd9',2.78),
        panel(5.1,1.4,.18,.18,2.79,'#167bd9'),
        ...Array.from({length:10},(_,i)=>panel(3.67+i*.14,1.65,.065,.09,2.78,'#c8ae87')),
        rounded(1.16,3.91,1.25,.19,2.62,'#ffffff',.03),part('brand-artwork-copy',1.16,4.014,1.08,.014,2.36,null,.13,{graphic:'blue-wave'}),
        rounded(4.6,2.8,1.8,.24,2.75,'#ffffff'),...tv(4.6,2.978,1.48,1.13,'main'),logo(4.6,2.932,1.3,2.12),
        ...meeting(3.15,1.95),part('chair-standard',3.15,1.18,.48,.5,.8,'#e8e5dc'),part('chair-standard',3.15,2.72,.48,.5,.8,'#e8e5dc',0,{rotationY:180}),
        part('counter-corner-round',1.72,4.98,2.25,1.22,.88,null),logo(1.42,5.602,.87,.4),...planter(1.7,5.73,1.38),
        panel(4.66,4.16,.48,.42,.07,'#ffffff'),panel(4.66,4.16,.14,.14,.95,'#ffffff',.07),...tv(4.66,4.18,.54,1.01,'kiosk'),
        ...[.66,1.26].flatMap(x=>[panel(x,2.13,.5,.52,.82,'#ffffff'),panel(x,2.13,.52,.54,.025,'#12547e',.82)]),
        panel(2.16,3.13,.48,.35,.06,'#ffffff'),panel(2.16,3.13,.12,.12,.95,'#ffffff',.06),panel(2.16,3.13,.62,.42,.055,'#ffffff',1.01),
        ...[3.15,3.8].map((x,i)=>part('plant-trailing',x,3.72,.6,.3,.8+i*.12,null,1.92-i*.12)),
        logo(3.15,4.108,1.1,2.72),rounded(4.5,1.46,1.6,.12,.4,'#ffffff',2.4),logo(4.5,1.392,1.15,2.43,180)]}
  ];
  const yellow='#f2c52e',coal='#252628';
  const detail=(design,id,x,z,w,d,h,y=0,extra={})=>part(id,x,z,w,d,h,null,y,{structure:{design},...extra});
  templates.push({id:'island-yellow-frame',name:'03 · Yellow Frame Pavilion',tagline:'ดำ–เหลือง · ระแนงพาดหลังคาและโต๊ะบาร์',
    description:'ตามภาพอ้างอิง: โครงเหลี่ยมดำขอบเหลือง ระแนงต่อเนื่องขึ้นหลังคา แอ่งวงกลมสีเหลือง 2 จุด รางสปอตไลต์ จอติดแผงระแนง โต๊ะบาร์ผิวหิน 2 ตัว สตูลขาโครเมียมและกระถางดำ · โลโก้ Yuppie · สูงประมาณ 3.5 ม.',
    width:6,depth:6,height:3.5,primary:yellow,secondary:coal,floor:'tile',tile:'woodD',purpose:'meeting',objects:[
      // Left brand pier, open central portal and deep right pier, not perimeter walls.
      panel(.92,4.83,1.42,.20,3.42,coal),panel(1.69,4.83,.16,.24,3.5,yellow),
      panel(5.64,4.36,.25,1.16,3.32,coal),panel(5.50,4.83,.12,.25,3.32,yellow),
      panel(2.8725,4.83,2.495,.25,.18,yellow,3.32),
      panel(.30,.87,.18,.24,3.32,yellow),panel(3.8825,.87,4.125,.24,.18,yellow,3.32),
      panel(5.77,1.5,.16,1.48,3.32,coal),
      // Recessed yellow circles in the stone-faced roof caps, as visible in the reference.
      detail('yellow-oculus-roof','panel-standard',.99,.92,1.66,1.44,.18,3.32),
      detail('yellow-oculus-roof','panel-standard',4.95,4.235,1.66,1.44,.18,3.32),
      ...Array.from({length:10},(_,i)=>{
        const x=.27+i*.14;return [panel(x,4.968,.065,.085,3.5,'#161719'),panel(x,3.335,.065,3.35,.075,'#242527',3.425)];
      }).flat(),
      // Screen wall is a freestanding narrow pier, with open routes either side.
      panel(3.92,2.30,1.60,.20,1.12,yellow),
      ...Array.from({length:8},(_,i)=>panel(3.17+i*.213,2.30,.105,.20,2.20,yellow,1.12)),
      panel(3.92,2.30,1.60,.20,.10,yellow,3.22),
      ...tv(3.92,2.46,1.42,1.32,'main'),
      part('brand-artwork-copy',3.92,2.524,1.29,.014,.70,null,1.37,{graphic:'six-technology',tv:'main'}),
      panel(3.92,2.53,1.86,.43,.055,coal,1.11),
      detail('yellow-track','panel-standard',3.28,3.525,3.06,2.53,.42,2.90),
      detail('yellow-bar','table-standard',3.89,4.54,2.64,.59,1.08),
      detail('yellow-bar','table-standard',1.71,1.77,2.26,.57,1.08),
      ...[[3.14,5.28],[4.64,5.28],[3.95,3.78],[1.17,2.5],[2.12,2.5],[1.73,1.06]].map(([x,z])=>detail('yellow-stool','bar-stool',x,z,.40,.45,.72)),
      ...[[2.58,5.43,.32,.37,.73],[3.18,3.01,.42,.4,.74],[4.47,3.00,.42,.4,.66]].map(([x,z,w,d,h])=>detail('yellow-planter','plant-medium',x,z,w,d,h)),
      detail('yellow-planter','plant-medium',2.38,1.77,.24,.24,.32,1.08),
      ...[[3.13,4.53],[3.78,4.54],[4.47,4.50],[1.10,1.77],[1.67,1.78]].map(([x,z],i)=>part('panel-standard',x,z,.30,.21,.003,'#f7f6ef',1.083,{rotationY:i%2?13:-11})),
      logo(.92,5.019,1.34,1.80),logo(.92,4.722,1.13,1.87,180),
    ]});
  function build(id,initial,catalog){
    const t=templates.find(t=>t.id===id);if(!t)throw new Error('ไม่พบเทมเพลต Island');const spec=structuredClone(initial);
    Object.assign(spec,{W:t.width,D:t.depth,H:t.height,type:'island',primary:t.primary,secondary:t.secondary,colTouched:true,secTouched:true,wallCol:'white',wallMat:'paint',wallStickerFaces:[],floor:t.floor,tile:t.tile,raise:0,stSize:'none',logoScale:0,nameScale:0,sideLogo:false,designPurpose:t.purpose,boothTemplate:{id:t.id,type:'island',name:t.name,version:1},objects:[],view:'three'});
    spec.objects=t.objects.map((o,i)=>{const c=catalog.find(c=>c.catalogId===o.catalogId);if(!c)throw new Error('ไม่พบอุปกรณ์ '+o.catalogId);return {id:t.id+'-'+i,catalogId:c.catalogId,type:c.type,position:{...o.position},size:{...o.size},rotationX:0,rotationY:o.rotationY||0,rotationZ:0,orientation:'horizontal',geometryMode:'parametric',locked:false,unitPrice:c.unitPrice,...(o.tv?{groupId:'tv-'+t.id+'-'+o.tv}:{}),appearance:o.brandLogo&&spec.logo?{mode:'original',textureData:spec.logo,textureId:t.id+'-logo',textureName:'YP logo'}:o.color?{mode:'solid',color:o.color}:{mode:'original'}};});
    t.objects.forEach((o,i)=>{if(o.structure)spec.objects[i].structure={...o.structure};});
    return{spec,assets:[]};
  }
  root.YPIslandTemplates={templates,build};
})(globalThis);
