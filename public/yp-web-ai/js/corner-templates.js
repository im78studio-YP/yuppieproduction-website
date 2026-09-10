(function(root){
  'use strict';
  const panel=(x,z,w,d,h,color,y=0)=>({catalogId:'panel-standard',position:{x,y,z},size:{w,d,h},color});
  const part=(catalogId,x,z,w,d,h,color,y=0,rotationY=0)=>({...panel(x,z,w,d,h,color,y),catalogId,rotationY});
  const templates=[{id:'corner-timber-lounge',name:'01 · Timber Lounge',tagline:'โครงไม้ + มุมนั่งคุย + เคาน์เตอร์บาร์',description:'ผนังโทนดำ–ไม้ ระแนงตกแต่ง เสาไม้แบ่งโซน มุมนั่งคุยด้านหน้า และเคาน์เตอร์บาร์พร้อมสตูล 4 ที่นั่ง เลือกหัวมุมซ้าย–ขวาเพื่อสลับผังได้',primary:'#333d38',secondary:'#c5a66e',background:'#333d38',floor:'tile',tile:'woodL',purpose:'meeting',
    objects:[panel(2.55,1.25,.4,.42,2.4,'#c5a66e'),panel(1.415,1.25,1.87,.38,.32,'#333d38',2.08),panel(.39,.76,.18,1.04,2.4,'#c5a66e'),
      ...Array.from({length:15},(_,i)=>panel(.66+i*.105,.39,.036,.07,2.04,'#c5a66e')),
      panel(2.55,1.478,.29,.025,.24,'#1d2928',1.18),part('counter-standard',4.3,.72,2.55,.52,.98,'#f1eee7'),
      ...[3.36,3.98,4.6,5.22].map(x=>part('bar-stool',x,1.37,.37,.37,.9,null,0,180)),
      panel(4.23,.36,1.12,.08,.65,'#151b1a',1.23),panel(4.23,.407,1,.014,.53,'#294644',1.29),part('panel-rounded',5.2,.42,.38,.045,.38,'#bea357',1.43),
      panel(.85,2.21,.54,.58,.44,'#26322d'),panel(2.08,2.21,.54,.58,.44,'#26322d'),part('table-standard',1.46,2.2,.54,.46,.51,'#d4c3a0'),
      part('chair-standard',1.36,.82,.44,.44,.78,'#a3a69b'),part('chair-standard',2.03,.82,.44,.44,.78,'#a3a69b')]}];
  // All source layouts use the right-hand open corner. Mirror once at the boundary.
  const rounded=(...args)=>part('panel-rounded',...args);
  const logo=(x,z,w,y,rotationY=0)=>({...part('brand-artwork-copy',x,z,w,.01,w*.18,null,y,rotationY),brandLogo:true});
  const graphic=(kind,x,z,w,h,y,rotationY=0)=>({...part('brand-artwork-copy',x,z,w,.01,h,null,y,rotationY),graphic:kind});
  const tv=(key,x,z,w,y)=>[
    {...panel(x,z,w,.07,w*.58,'#121b22',y),tv:key},
    {...panel(x,z+.042,w-.09,.012,w*.58-.09,'#075578',y+.045),tv:key}
  ];
  const meet=(x,z)=>[part('table-standard',x,z,.7,.6,.72,'#e9e5db'),
    part('chair-standard',x-.59,z,.42,.43,.78,'#ffffff',0,90),part('chair-standard',x+.59,z,.42,.43,.78,'#ffffff',0,270),
    part('chair-standard',x,z-.57,.42,.43,.78,'#ffffff'),part('chair-standard',x,z+.57,.42,.43,.78,'#ffffff',0,180)];
  const grass=(x,z,w=1.1)=>part('planter-grass',x,z,w,.24,.5,null);
  const shelves=(x,z,w,color='#ffffff')=>[.48,.98,1.48].map(y=>panel(x,z,w,.3,.05,color,y));
  const slats=(x,z,w,h,color,y=0)=>Array.from({length:16},(_,i)=>panel(x-w/2+i*w/15,z,.035,.06,h,color,y));
  const collection=(id,name,tagline,description,primary,secondary,background,objects)=>({id,name,tagline,description,primary,secondary,background,objects,floor:'tile',tile:'woodL',purpose:'meeting',customArtwork:true,logoScale:0});
  templates.push(
    collection('corner-sunshine-garden','02 · Sunshine Garden','ซุ้มคลื่นเหลือง + ผนังสวน + เลานจ์',
      'อ้างอิงภาพ 1: ซุ้มคลื่นสีเหลือง กรอบกราฟิกทรงเฉียง มุมนั่งพัก และผนังสวนพร้อมโต๊ะเจรจา ปรับสัดส่วนให้พอดีพื้นที่ 6×3 ม.', '#f6bf12','#bfa780','#f4f3ec',[
        part('fascia-wave',3,2.15,5.7,.65,.36,'#f6bf12',2.04),panel(.23,1.24,.16,1.91,.36,'#f6bf12',2.04),
        rounded(.57,2.15,.25,.28,2.04,'#ffffff'),panel(5.7,2.15,.18,.2,2.04,'#ffffff'),
        rounded(1.17,2.12,1.18,.16,2.02,'#ffffff'),graphic('slanted',1.17,2.211,1.06,1.88,.06),
        panel(4.74,.3,1.99,.1,2.03,'#426c29'),graphic('garden',4.74,.361,1.96,2.01,.01),
        logo(4.74,.373,1.3,1.61),logo(3.13,.28,1.65,2.09),
        part('lounge-sofa',1.38,.79,1.5,.68,.8,null),part('table-standard',1.65,1.43,.67,.45,.42,'#e9e5db'),
        ...tv('lounge',1.6,.27,1.18,1.14),...meet(4.53,1.47),
        panel(2.65,.73,.09,1.04,1.83,'#e4e3dc')
      ]),
    collection('corner-graphite-grid','03 · Graphite Grid','ดำ–เหลือง + ระแนงจอ + ชั้นโชว์',
      'อ้างอิงภาพ 2: โทนดำตัดเหลือง ซุ้มระแนงพร้อมจอ ผนังกราฟิกสูง ชั้นสินค้า 3 ชั้น โต๊ะเจรจา 2 ชุด และเคาน์เตอร์รับรอง', '#edc51b','#333536','#292b2c',[
        rounded(3.62,.32,1.38,.16,2.35,'#edc51b'),graphic('facets-light',3.62,.411,1.17,1.38,.32),logo(3.62,.422,1.06,1.97),
        ...[0,1,2,3,4,5].flatMap(i=>[panel(.54+i*.27,1.28,.045,1.88,.08,'#353839',1.9),panel(.54+i*.27,2.2,.045,.05,1.9,'#353839')]),
        panel(1.22,2.24,1.63,.09,.32,'#ffffff',1.56),logo(1.22,2.296,1.25,1.61),
        ...tv('divider',1.23,2.3,1.16,.81),grass(1.23,2.47,1.51),...tv('back',1.41,.27,1.08,1.22),
        ...meet(1.65,1.07),...meet(4.2,1.39),...shelves(5.24,.47,1.1,'#9f9b87'),
        rounded(5.21,2.45,1.24,.45,.88,'#292b2c'),rounded(5.56,2.686,.37,.015,.66,'#edc51b',.11),logo(4.99,2.689,.59,.38),
        logo(5.03,.27,1.36,2.04)
      ]),
    collection('corner-orchid-studio','04 · Orchid Studio','ขาว–ม่วง + ชั้นโค้ง + เคาน์เตอร์โค้ง',
      'อ้างอิงภาพ 3: ซุ้มขาวโค้ง ชั้นโชว์สีม่วง กราฟิกชมพู เคาน์เตอร์โค้ง มุมนั่งคุยและเลานจ์หลังบูธ โดยเว้นทางเข้าด้านหน้าและหัวมุม', '#9431ac','#e9b1d0','#f5eef5',[
        part('fascia-curved',3,1.43,5.64,2.62,.22,'#ffffff',2.18),
        rounded(3.02,2.47,.77,.22,2.18,'#ffffff'),rounded(3.02,2.595,.59,.02,1.96,'#9431ac',.08),...shelves(3.02,2.69,.58),
        rounded(5.65,1.97,.48,.23,2.18,'#ffffff'),rounded(5.65,2.1,.34,.015,1.97,'#9431ac',.07),...shelves(5.65,2.22,.32),
        rounded(.32,1.26,.37,.16,1.4,'#9431ac',.5,90),
        graphic('beauty',1.53,.266,2.27,1.62,.4),grass(1.55,.49,1.7),
        ...meet(1.7,1.32),part('lounge-sofa',4.53,.77,1.53,.66,.77,null),part('table-standard',4.55,1.45,.62,.45,.44,'#f1e8ed'),
        ...tv('lounge',4.55,.27,1.15,1.15),
        part('counter-corner-round',1.11,2.55,1.7,.73,.78,'#f9f4f8'),rounded(1.03,2.919,1.29,.012,.48,'#9431ac',.16),logo(1.03,2.929,.94,.31),
        part('plant-trailing',.47,2.32,.48,.2,.69,null,1.47),logo(3.56,2.751,1.04,2.195),logo(4.28,.26,1.15,2.04)
      ]),
    collection('corner-green-link','05 · Green Link','กรอบขาว–เขียว + ผนังข้อมูล + ห้องเก็บของจำลอง',
      'อ้างอิงภาพ 4: โครงกรอบเหลี่ยมสีขาว ผนังข้อมูลพร้อมชั้นและกระบะต้นไม้ เคาน์เตอร์รับรอง และส่วนเก็บของพร้อมประตูตกแต่งจำลอง', '#579862','#bdd4a7','#f3f5ed',[
        panel(3,2.68,5.7,.2,.21,'#ffffff',2.19),panel(.25,1.47,.19,2.6,.21,'#ffffff',2.19),
        panel(5.74,2.45,.17,.3,2.19,'#ffffff'),panel(2.48,2.61,.17,.22,2.19,'#ffffff'),
        panel(1.21,2.62,1.98,.12,1.95,'#ffffff'),graphic('green-info',1.21,2.691,1.83,1.06,.64),logo(1.21,2.7,1.37,1.64),
        ...[.58,.9].map(y=>panel(1.21,2.8,1.72,.2,.045,'#d9e4dd',y)),grass(1.21,2.84,1.81),
        panel(4.63,.66,1.04,.95,2.19,'#579862'),panel(4.63,1.15,.79,.025,1.86,'#70ab77',.04),
        panel(4.94,1.17,.12,.015,.035,'#f0f2ed',.92),logo(4.63,1.172,.68,1.58),
        graphic('green-wave',1.74,.27,2.65,1.53,.45),...meet(2.19,1.25),
        panel(3.25,2.42,1.06,.6,.83,'#ffffff'),panel(2.96,2.729,.33,.014,.6,'#579862',.13),logo(3.41,2.741,.59,.42),
        part('plant-trailing',4.02,2.5,.5,.2,.72,null,1.42),panel(4.08,2.57,.09,.08,2.18,'#579862')
      ]),
    collection('corner-timber-angle','06 · Timber Angle','ไม้ธรรมชาติ + ผนังเฉียง + เคาน์เตอร์ L',
      'อ้างอิงภาพ 5 (ภาพ 6 ซ้ำ): ผนังไม้ระแนงซ้อนแผงเฉียง จอทีวี กราฟิกฟ้าด้านข้าง โต๊ะเจรจา 4 ที่นั่ง และเคาน์เตอร์ไม้รูปตัว L', '#b99b77','#e9e9e3','#f3f4ee',[
        ...slats(4.78,.28,1.87,2.27,'#b99b77'),graphic('diagonal-white',4.77,.324,1.94,2.27,0),
        ...tv('back',3.6,.29,1.45,1.09),logo(3.99,.339,1.7,2.025),
        part('panel-standard',.29,1.47,2.36,.11,1.67,'#ffffff',.25,90),
        graphic('blue-facets',.356,1.47,2.15,1.48,.35,90),
        part('panel-standard',.29,1.39,2.45,.12,.35,'#9fa29d',2.01,90),logo(.361,1.39,1.59,2.07,90),
        ...meet(2.38,1.39),
        panel(4.64,2.58,1.91,.53,.88,'#b99b77'),panel(5.46,2.1,.27,.47,.88,'#b99b77'),
        panel(4.64,2.58,1.96,.57,.06,'#d2b792',.88),panel(5.46,2.1,.31,.49,.06,'#d2b792',.88),
        logo(4.61,2.877,1.23,.44),logo(5.627,2.2,.49,.46,90)
      ])
  );
  const beautyPart=(design,catalogId,x,z,w,d,h,y=0,rotationY=0,extra={})=>({...part(catalogId,x,z,w,d,h,null,y,rotationY),structure:{design,...extra}});
  const beautyArt=(kind,x,z,w,h,y,rotationY=0)=>({...graphic(kind,x,z,w,h,y,rotationY),structure:{design:'beauty-lit-artwork'}});
  templates.push({...collection('corner-luminous-beauty','07 · Luminous Beauty','ผนังขาว + กราฟิกพาสเทล + ตู้โชว์กระจก',
    'อ้างอิงภาพ: ผนังหัวมุมสีขาว คิ้วบนพร้อมดาวน์ไลต์ กราฟิกสินค้า 4 สี ตู้โชว์กระจกยาวหน้าบูธพร้อมขวดจำลอง จอด้านข้าง และที่นั่งด้านใน · เปลี่ยนทุกแบรนด์เป็น Yuppie · ผนังสูงประมาณ 2.9 ม. รวมป้าย 3.5 ม.',
    '#ee3c96','#ffffff','#ffffff',[
      panel(3,.20,6,.36,.14,'#ffffff',2.76),panel(.20,1.64,.36,2.72,.14,'#ffffff',2.76),
      ...[.65,1.8,3,4.2,5.4].map(x=>beautyPart('beauty-downlight','panel-standard',x,.31,.09,.09,.025,2.735)),
      ...[.85,1.8,2.6].map(z=>beautyPart('beauty-downlight','panel-standard',.31,z,.09,.09,.025,2.735)),
      {...logo(3.25,.20,2.25,2.96),size:{w:2.25,d:.01,h:.56},structure:{design:'beauty-lit-artwork'}},
      ...['yellow','pink','white','blue'].flatMap((tone,i)=>{
        const x=.90+i*1.40;return [beautyArt('beauty-'+tone,x,.112,1.25,1.55,.85),{...logo(x,.117,.88,2.46),size:{w:.88,d:.01,h:.20},structure:{design:'beauty-lit-artwork'}}];
      }),
      {...logo(.112,1.64,1.95,2.17,90),size:{w:1.95,d:.01,h:.49},structure:{design:'beauty-lit-artwork'}},
      {...part('panel-standard',.15,1.64,1.22,.08,.70,'#282a2d',1.36,90),tv:'side'},
      {...graphic('beauty-pink',.199,1.64,1.12,.60,1.41,90),tv:'side',structure:{design:'beauty-lit-artwork'}},
      beautyPart('beauty-vitrine','counter-standard',2.63,2.56,4.70,.64,1.34),
      beautyArt('beauty-wide',1.205,2.89,1.77,.77,.095),
      ...['magenta','coral','pink','cyan'].map((tone,i)=>beautyArt('beauty-'+tone,2.455+i*.685,2.89,.66,.77,.095)),
      ...Array.from({length:18},(_,i)=>beautyPart('beauty-bottle','panel-standard',.50+i*.249,2.54,.043,.043,.15+(i%3)*.025,.952,0,{color:i%5===0?'#526368':'#242a2b'})),
      beautyPart('beauty-chair','chair-standard',4.9,.82,.44,.47,.85,0,20),
      beautyPart('beauty-chair','chair-standard',4.15,1.32,.44,.47,.85,0,160),
      part('table-standard',4.75,1.55,.60,.60,.73,'#ffffff')
    ]),height:2.9,overallHeight:3.52,tile:'conc'});
  const aqua=(design,id,x,z,w,d,h,y=0,rotationY=0)=>({...part(id,x,z,w,d,h,null,y,rotationY),structure:{design}});
  const aquaLogo=(x,z,w,y,rotationY=0,h=w*.252)=>({...logo(x,z,w,y,rotationY),size:{w,d:.01,h}});
  templates.push({...collection('corner-aqua-wave','08 · Aqua Wave Lounge','คานโค้งเทา + ป้ายฟ้า + เคาน์เตอร์โค้ง',
    'ตามภาพอ้างอิง: คานโค้งสีเทา ป้ายฟ้าปลายเฉียง เสาตกแต่งซี่ฟ้า ห้องเก็บของจำลองพร้อมประตูและลายแผนที่ ตู้โชว์ 2 ตู้ ชั้นไม้ 3 ชั้น มุมนั่งคุยและเคาน์เตอร์โค้งขาว–ฟ้า · ใช้โลโก้ Yuppie ทุกป้าย · ผนัง 2.5 ม. รวมป้ายประมาณ 3.3 ม.',
    '#008da7','#cbb18a','#f5f4ef',[
      // Front-left sculpted pier supports the curved overhead band.
      panel(.65,2.45,1.05,.16,2.50,'#f5f4ef'),
      ...[.26,.51,.76,1.01].map((x,i)=>panel(x,2.537,.11,.014,i%2?1.52:1.90,'#00869c',i%2?.16:.26)),
      aqua('aqua-wave-fascia','panel-standard',2.10,1.59,4.10,2.20,.65,2.50),aquaLogo(.70,2.545,1.05,2.69),
      aqua('aqua-wood-shelf','panel-standard',4.10,.38,3.78,.60,.12,2.50),
      aqua('aqua-slanted-sign','panel-standard',4.77,.19,2.26,.20,.70,2.62),aquaLogo(5.00,.302,1.35,2.79,0,.34),
      // A closed, editable room mock-up; no hidden automatic storage-room generation.
      panel(1.78,.60,1.40,.90,2.48,'#4b4a4c'),panel(2.18,1.064,.52,.018,2.12,'#a4a49f',.02),panel(2.18,1.076,.48,.012,2.08,'#4b4a4c',.04),panel(2.01,1.089,.09,.02,.02,'#bdbfba',.94),
      {...graphic('aqua-map',1.60,1.059,.75,.66,.70),structure:{design:'beauty-lit-artwork'}},
      panel(.98,1.04,.66,.07,2.45,'#f5f4ef'),
      {...part('panel-standard',.98,1.086,.62,.055,.43,'#272c30',1.20),tv:'side'},
      {...graphic('aqua-screen',.98,1.12,.55,.36,1.235),tv:'side'},
      part('lounge-sofa',1.13,1.46,1.10,.62,.69,'#f5f4ef'),part('planter-grass',1.24,1.98,1.12,.24,.97,null),
      aqua('aqua-display-plinth','display-standard',1.35,2.47,.50,.50,.94),aqua('aqua-display-plinth','display-standard',1.95,2.47,.50,.50,.94),
      aquaLogo(1.35,2.731,.35,.28),aquaLogo(1.95,2.731,.35,.28),
      ...[.80,1.12,1.44].map(y=>aqua('aqua-wood-shelf','shelf-standard',3.18,.30,1.33,.35,.045,y)),
      ...meet(3.15,1.32),
      aqua('aqua-timber-backdrop','panel-standard',4.85,.175,2.20,.10,1.35),aquaLogo(4.80,.233,1.10,1.00),panel(4.8,.35,1.25,.28,.055,'#f5f4ef',.79),
      ...tv('main',4.87,.17,1.35,1.64).map(o=>({...o,color:'#141518'})),
      aqua('aqua-curved-counter','counter-standard',4.68,2.50,2.52,.80,.89),
      aquaLogo(4.10,2.83,.85,.31,-7,.19),aquaLogo(5.22,2.835,.85,.31,7,.19),
      ...[2.65,3.6,4.55,5.5].map(x=>beautyPart('beauty-downlight','panel-standard',x,.48,.085,.085,.024,2.474))
    ]),height:2.50,overallHeight:3.32});
  function mirror(spec,side){
    if(!['left','right'].includes(side))throw new Error('กรุณาเลือกหัวมุมซ้ายหรือขวา');
    const out=structuredClone(spec);if(out.cornerSide===side)return out;
    if(out.assetAttachmentGraph?.attachments?.length)throw new Error('โปรดปลดจุดยึดชิ้นงานที่เพิ่มไว้ก่อนสลับหัวมุม เพื่อไม่ให้จุดยึดผิดตำแหน่ง');
    const flip=a=>(360-(Number(a)||0)%360)%360;
    for(const o of out.objects||[]){o.position.x=out.W-o.position.x;o.rotationY=flip(o.rotationY);o.rotationZ=flip(o.rotationZ);
      // Reflect asymmetric geometry too, but keep lettering/front-facing artwork readable.
      if((o.type!=='brandCopy'&&o.catalogId!=='brand-artwork-copy')||['slanted','diagonal-white'].includes(o.appearance?.textureName)){
        o.flipX=!o.flipX;
        // Native Aqua meshes use the renderer's normalized transform, not the legacy flag.
        if(o.structure?.design?.startsWith('aqua-'))o.transform={...o.transform,flipX:!o.transform?.flipX};
      }
    }
    const swap=face=>face==='left'?'right':face==='right'?'left':face;
    if(out.wallStickers)[out.wallStickers.left,out.wallStickers.right]=[out.wallStickers.right,out.wallStickers.left];
    if(out.wallStickerFaces)out.wallStickerFaces=out.wallStickerFaces.map(swap);
    if(out.logoWall==='back'||!out.logoWall){if(Number.isFinite(out.logoWallU))out.logoWallU=out.W-out.logoWallU;}else out.logoWall=swap(out.logoWall);
    if(out.stPos==='left'||out.stPos==='right')out.stPos=swap(out.stPos);
    if(out.stDoor==='left'||out.stDoor==='right')out.stDoor=swap(out.stDoor);
    out.cornerSide=side;globalThis.YPTemplateLighting?.mirror(out);return out;
  }
  function build(id,initial,catalog,side='right'){
    const t=templates.find(t=>t.id===id);if(!t)throw new Error('ไม่พบเทมเพลตบูธหัวมุม');
    let spec=structuredClone(initial);Object.assign(spec,{W:6,D:3,H:2.4,type:'corner',cornerSide:'right',primary:t.primary,secondary:t.secondary,colTouched:true,secTouched:true,wallCol:'white',wallMat:'paint',floor:t.floor,tile:t.tile,raise:0,stSize:'none',logoWall:'back',logoMount:'wall',sideLogo:false,logoWallU:4.2,logoWallY:1.98,logoScale:22,nameScale:0,designPurpose:t.purpose,boothTemplate:{id:t.id,type:'corner',name:t.name,version:1},objects:[],view:'three'});
    if(t.height)spec.H=t.height;
    if(t.logoScale!==undefined)spec.logoScale=t.logoScale;
    spec.objects=t.objects.map((o,i)=>{const item=catalog.find(c=>c.catalogId===o.catalogId);if(!item)throw new Error('ไม่พบอุปกรณ์ '+o.catalogId);return {id:t.id+'-'+i,catalogId:item.catalogId,type:item.type,...(o.tv?{groupId:t.id+'-tv-'+o.tv}:{}),position:{...o.position},size:{...o.size},rotationX:0,rotationY:o.rotationY||0,rotationZ:0,locked:false,orientation:'horizontal',geometryMode:'parametric',unitPrice:item.unitPrice,appearance:o.brandLogo&&spec.logo?{mode:'original',textureData:spec.logo,textureName:'YP logo',textureId:t.id+'-logo'}:o.color?{mode:'solid',color:o.color}:{mode:'original'}};});
    t.objects.forEach((o,i)=>{if(o.structure)spec.objects[i].structure={...o.structure};});
    if(side!=='right')spec=mirror(spec,side);return {spec,assets:[]};
  }
  root.YPCornerTemplates={templates,build:(...args)=>{const result=build(...args);root.YPTemplateTVGroups?.apply(result.spec);return result;},mirror};
})(globalThis);
