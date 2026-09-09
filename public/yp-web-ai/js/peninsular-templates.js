(function(root){
  'use strict';
  const part=(catalogId,x,z,w,d,h,color,y=0,extra={})=>({catalogId,position:{x,y,z},size:{w,d,h},color,...extra});
  const panel=(x,z,w,d,h,color,y=0)=>part('panel-standard',x,z,w,d,h,color,y);
  const rounded=(x,z,w,d,h,color,y=0)=>part('panel-rounded',x,z,w,d,h,color,y);
  const frame=(x,color)=>[panel(x,.39,1.25,.14,2.2,color,.1),panel(x,.48,1.07,.06,2.02,'#527b35',.19)];
  const logo=(x,z,w,y)=>part('brand-artwork-copy',x,z,w,.012,w*.18,null,y,{label:'โลโก้ YP บนซุ้ม',brandLogo:true});
  const screen=(x,z,w,y)=>[panel(x,z,w,.07,w*.58,'#202b35',y),panel(x,z+.041,w-.1,.012,w*.58-.1,'#14618a',y+.05)];
  const meeting=(x,z)=>[part('table-standard',x,z,.78,.62,.72,'#eeeae0'),part('chair-standard',x-.65,z,.45,.46,.78,'#f4f1e9',0,{rotationY:90}),part('chair-standard',x+.65,z,.45,.46,.78,'#f4f1e9',0,{rotationY:-90})];
  const planter=(x,z,w)=>[panel(x,z,w,.28,.19,'#ffffff'),...Array.from({length:5},(_,i)=>part('plant-medium',x-w*.39+i*w*.195,z,.21,.21,.42,null,.19))];
  const pairedScreen=(key,...args)=>screen(...args).map(o=>({...o,tv:key}));
  const graphicPanel=(key,x,z,w,h,y)=>part('brand-artwork-copy',x,z,w,.012,h,null,y,{graphic:key});
  const fourSeats=(x,z)=>[...meeting(x,z),part('chair-standard',x,z-.58,.45,.46,.78,'#f4f1e9'),part('chair-standard',x,z+.58,.45,.46,.78,'#f4f1e9',0,{rotationY:180})];
  const templates=[
    {id:'penin-adventure',name:'01 · Adventure Gateway',tagline:'เคาน์เตอร์ใหญ่ + กรอบทางเข้า',description:'อ้างอิงภาพ 1: เคาน์เตอร์หน้าซ้าย ผนังกราฟิก จอหลัง และกรอบสีทองฝั่งขวาพร้อมจอเล็ก เปิดด้านข้างไว้',primary:'#c58b24',secondary:'#32363b',background:'#555b50',floor:'tile',tile:'woodL',graphic:'EXPLORE / CONNECT / DISCOVER',purpose:'display',
      objects:[part('counter-standard',1.85,2.12,2.8,.7,1.02,'#32363b'),part('entrance-frame',5.12,1.3,.72,1.9,2.4,'#c58b24',0,{structure:{projection:1.9,height:2.4,pierWidth:.72,thickness:.16,color:'#c58b24'}}),panel(.08,.36,.12,.1,2.4,'#c58b24'),panel(2.4,.36,4.7,.1,.1,'#c58b24',2.3),panel(3.82,.36,.92,.08,.55,'#151a24',1.3),panel(3.82,.41,.8,.025,.43,'#244271',1.36),panel(5.12,2.265,.54,.035,.35,'#151a24',1.42),panel(5.12,2.29,.46,.014,.27,'#244271',1.46),...Array.from({length:24},(_,i)=>panel(.57+i*.111,2.487,.022,.015,.86,'#20252b',.05))]},
    {id:'penin-connect',name:'02 · Connect & Demo',tagline:'ต้อนรับ + โต๊ะสาธิตพร้อมที่นั่ง',description:'อ้างอิงภาพ 2: เคาน์เตอร์ต้อนรับหน้าซ้าย โต๊ะสูงพร้อมเก้าอี้ 2 ตัวฝั่งขวา จอติดผนัง และเสาตกแต่งสีเขียวน้ำทะเล',primary:'#208c8b',secondary:'#a87a4c',background:'#edf0ed',floor:'tile',tile:'woodL',graphic:'CONNECT / EXPERIENCE / TALK TO US',purpose:'meeting',
      objects:[part('counter-standard',.98,2.06,1.35,.68,1,'#a87a4c'),part('high-table-stool-set',4.05,1.65,2.05,.8,1.08,null,0,{geometryMode:'model'}),panel(3,.43,.2,.25,2.4,'#208c8b'),panel(5.85,.43,.2,.25,2.4,'#208c8b'),panel(4.4,.37,1.35,.09,.78,'#151a24',1.36),panel(4.4,.425,1.2,.025,.63,'#dcebf2',1.44),part('plant-medium',.98,2.06,.28,.28,.45,null,1.04)]},
    {id:'penin-natural',name:'03 · Natural Showcase',tagline:'กรอบไม้ + แผงสีเขียว',description:'อ้างอิงภาพ 3: เคาน์เตอร์หน้าซ้าย กรอบไม้และแผงสีเขียวสองฝั่ง ผนังเล่าเรื่องสินค้าตรงกลาง และพื้นที่รับลูกค้าเปิดโล่ง',primary:'#997944',secondary:'#c6ad82',background:'#e7e1d5',floor:'tile',tile:'conc',graphic:'NATURALLY GOOD / MADE FOR EVERYDAY',purpose:'sales',
      objects:[part('counter-standard',1.04,2.12,1.65,.68,1,'#dfd2b8'),...frame(.75,'#c6ad82'),...frame(5.25,'#c6ad82'),panel(3,.38,3.35,.13,.16,'#333029',2.24),panel(.75,.525,.79,.025,.58,'#f4efdf',1.14),panel(5.25,.525,.79,.025,.58,'#f4efdf',1.14),panel(3.15,.36,.72,.18,.07,'#c6ad82',1.1),panel(3.95,.36,.72,.18,.07,'#c6ad82',.83)]},
    {id:'penin-blue-pavilion',name:'04 · Blue Pavilion',tagline:'ซุ้มขาว–น้ำเงิน + ระแนงไม้ + พื้นที่เจรจา',description:'อ้างอิงภาพ 4: ซุ้มคาดหน้าสีขาว–น้ำเงิน ป้ายแนวตั้งมุมโค้ง เสาระแนงไม้พร้อมกรอบโชว์ เคาน์เตอร์ต้อนรับซ้าย และโต๊ะเจรจา 2 ชุด เปิดด้านหน้าและด้านข้าง',primary:'#125b94',secondary:'#ac8c6b',background:'#f4f5f3',floor:'tile',tile:'woodL',graphic:'DESIGNED TO CONNECT',purpose:'meeting',
      objects:[
        panel(3,2.55,6,.28,.4,'#ffffff',2),
        panel(.14,1.43,.28,2.26,.4,'#ffffff',2),panel(5.86,1.43,.28,2.26,.4,'#ffffff',2),
        rounded(.66,2.7,1.12,.025,.25,'#125b94',2.025),rounded(5.38,2.7,1.02,.025,.25,'#125b94',2.025),
        panel(1.48,2.5,.3,.24,2,'#ffffff'),panel(4.25,2.5,.88,.24,2,'#ffffff'),
        ...Array.from({length:8},(_,i)=>panel(3.94+i*.087,2.645,.047,.045,2,'#ac8c6b')),
        rounded(1.48,2.68,.7,.14,1.38,'#ffffff',.48),rounded(1.48,2.765,.57,.035,1.2,'#125b94',.57),
        panel(4.25,2.73,1.22,.12,.74,'#ffffff',.67),panel(4.25,2.801,1.08,.02,.62,'#ac8c6b',.73),panel(4.25,2.816,.98,.01,.52,'#f3efe5',.78),
        part('counter-standard',.65,2.27,.94,.55,.85,'#ffffff'),rounded(.65,2.568,.78,.02,.69,'#125b94',.06),
        part('table-standard',2.45,1.13,.85,.55,.73,'#eee9df'),
        part('chair-standard',1.68,1.13,.46,.48,.79,'#f4f1e9',0,{rotationY:90}),part('chair-standard',3.21,1.13,.46,.48,.79,'#f4f1e9',0,{rotationY:-90}),
        part('table-standard',4.75,1.13,.85,.55,.73,'#eee9df'),
        part('chair-standard',4.01,1.13,.46,.48,.79,'#f4f1e9',0,{rotationY:90}),part('chair-standard',5.49,1.13,.46,.48,.79,'#f4f1e9',0,{rotationY:-90}),
        part('brand-artwork-copy',3,2.707,2,.012,.34,null,2.03,{label:'โลโก้ YP บนซุ้ม',brandLogo:true})
      ]},
    {id:'penin-aqua-curve',name:'05 · Aqua Curve',tagline:'ซุ้มโค้งขาว–ฟ้า + ระแนงไม้และสวน',description:'ซุ้มโค้งเข้ามุมขาว–ฟ้า ป้ายแนวตั้งฝั่งซ้าย ระแนงไม้ติดจอพร้อมกระบะต้นไม้ และจุดเจรจาฝั่งขวา ปรับจากภาพอ้างอิงให้เปิดทางเข้าทั้งสามด้าน',primary:'#09b7d1',secondary:'#b99c74',background:'#f4f5f3',floor:'tile',tile:'woodL',graphic:'IDEAS / PEOPLE / CONNECTIONS',purpose:'meeting',
      objects:[part('fascia-curved',3.75,1.62,4.35,2.14,.33,'#ffffff',2.07),part('fascia-curved',3.75,1.62,4.35,2.14,.09,'#09b7d1',1.98),
        panel(5.82,.62,.18,.2,2.07,'#ffffff'),panel(1.66,2.55,.16,.2,2.07,'#ffffff'),
        rounded(.7,.47,1.18,.24,2.05,'#ffffff',.05),...screen(.7,.602,.99,.65),
        part('counter-standard',.68,1.92,.86,.58,.88,'#ffffff'),rounded(.68,2.229,.72,.023,.66,'#09b7d1',.08),
        ...Array.from({length:8},(_,i)=>panel(2.45+i*.15,2.5,.065,.08,1.93,'#b99c74',.05)),
        panel(2.975,2.56,1.28,.1,.6,'#147590',.77),...screen(2.975,2.626,1.03,.82),...planter(2.975,2.55,1.4),
        ...meeting(4.76,1.33),...screen(4.7,.37,1.04,1.12),
        logo(3.15,2.707,1.7,2.08)]},
    {id:'penin-timber-noir',name:'06 · Timber Noir',tagline:'โครงไม้ + ผนังดำ + โคมวงแหวน',description:'โครงไม้เปิดโล่ง ผนังดำสลับลายไม้เฉียง โคมห้อยวงแหวน แท่นโชว์สินค้าหน้าซ้าย โต๊ะเจรจากลาง และเคาน์เตอร์ขาวหน้าขวา',primary:'#303336',secondary:'#ba9972',background:'#303336',floor:'tile',tile:'woodL',graphic:'CRAFTED FOR YOUR NEXT IDEA',purpose:'display',logoU:1.65,logoY:1.35,logoScale:18,
      objects:[panel(.2,2.52,.28,.32,2.4,'#ba9972'),panel(2.25,2.52,4.38,.32,.16,'#ba9972',2.24),panel(.2,1.43,.28,2.18,.16,'#ba9972',2.24),
        part('pendant-ring',1.08,2.47,.54,.54,.4,null,1.84),part('pendant-ring',2.15,2.47,.54,.54,.4,null,1.84),
        panel(3,.42,5.75,.2,.33,'#303336',2.07),logo(3,.535,2.05,2.025),
        panel(1.42,2.25,.58,.55,.9,'#303336'),panel(2.1,2.25,.58,.55,.9,'#303336'),
        panel(1.42,2.25,.46,.43,.045,'#bdb9ae',.9),panel(2.1,2.25,.46,.43,.045,'#bdb9ae',.9),
        ...planter(.9,.67,1.1),...screen(3.9,.39,1.3,1.12),...meeting(3.64,1.55),
        part('counter-standard',5.22,2.37,1.08,.6,.94,'#ffffff'),panel(4.98,2.683,.23,.018,.56,'#14618a',.2),panel(5.84,2.38,.12,.65,1.07,'#ba9972')]},
    {id:'penin-blue-axis',name:'07 · Blue Axis',tagline:'ซุ้มน้ำเงิน + เสาทรง X + แท่นโชว์',description:'ซุ้มน้ำเงินทรงเรขาคณิต เสาขาวทรง X หน้าขวา ผนังกราฟิกแนวเฉียง เคาน์เตอร์ซ้าย แท่นโชว์คู่ และมุมเจรจาด้านใน',primary:'#285d91',secondary:'#edf0f3',background:'#285d91',floor:'tile',tile:'woodL',graphic:'BOLD IDEAS / BUILT TO CONNECT',purpose:'display',
      objects:[panel(3,2.53,5.9,.3,.38,'#285d91',2.02),panel(.2,1.47,.3,2.12,.38,'#285d91',2.02),panel(5.8,1.47,.3,2.12,.38,'#285d91',2.02),
        part('pier-cross',4.67,2.49,1.15,.24,2.02,'#ffffff'),panel(.2,2.53,.25,.3,2.02,'#285d91'),
        logo(3,2.695,2.05,2.01),
        part('counter-standard',.83,2.12,1,.62,.94,'#285d91'),...screen(1.04,.38,1.08,1.15),
        panel(2.48,2.35,.59,.58,.92,'#ffffff'),panel(3.18,2.35,.59,.58,.92,'#ffffff'),
        panel(2.48,2.35,.48,.47,.04,'#afc1ca',.92),panel(3.18,2.35,.48,.47,.04,'#afc1ca',.92),
        ...meeting(3.96,1.06),...planter(4.65,2.82,.96)]},
    {id:'penin-orchard',name:'08 · Orchard Pavilion',tagline:'ซุ้มออร์แกนิก + เสากิ่งไม้ + เคาน์เตอร์ระแนง',description:'ซุ้มเขียวทรงโค้งรองรับด้วยเสากิ่งไม้ ผนังโชว์ช่องโค้งพร้อมสินค้าจำลอง ชั้นโชว์สองฝั่ง โต๊ะคุยงานด้านใน และเคาน์เตอร์หน้าระแนงไม้ ปรับขนาดจากภาพอ้างอิงให้พอดี 6×3 ม.',primary:'#97b622',secondary:'#c8ae82',background:'#f6f5ec',floor:'tile',tile:'woodL',graphic:'FRESH IDEAS / NATURAL CONNECTIONS',purpose:'sales',logoU:3,logoY:1.91,logoScale:22,
      objects:[part('canopy-organic',3,1.35,5.7,1.65,.24,'#97b622',2.16),part('canopy-organic',3,1.35,5.62,1.57,.04,'#dfca38',2.12),
        part('pier-tree',.7,1.18,1,.32,2.12,'#c8ae82'),part('pier-tree',5.3,1.18,1,.32,2.12,'#c8ae82'),
        part('display-organic',3,.55,4.1,.36,1.48,null,.32),
        ...Array.from({length:3},(_,row)=>Array.from({length:7},(_,i)=>panel(2.03+i*.32,.59,.14,.1,.16,['#aab748','#d9ae3d','#ba6455'][(row+i)%3],.32+1.48*[.24,.43,.62][row]+.02))).flat(),
        part('shelf-standard',.55,.68,.6,.32,1.08,'#ffffff'),part('shelf-standard',5.45,.68,.6,.32,1.08,'#97b622'),
        ...[.55,5.45].flatMap(x=>[.37,.69].flatMap(y=>[-.16,0,.16].map((dx,i)=>panel(x+dx,.78,.1,.08,.17,['#97b622','#e1ad39','#d9dedc'][i],y)))),
        ...meeting(1.8,1.68),...meeting(4.18,1.68),
        part('counter-fluted',3,2.56,4.7,.6,.8,null),
        panel(3,2.56,1.9,.41,.06,'#d1dcd9',.8),
        ...Array.from({length:5},(_,i)=>panel(2.28+i*.36,2.56,.29,.3,.045,['#ddc664','#d98849','#b6c951','#d6a977','#db6651'][i],.86)),
        logo(3,2.872,1.18,.56)]},
    {id:'penin-noir-lounge',name:'09 · Noir Lounge',tagline:'โซนกระจกกรอบไม้ + ซุ้มดำ + เคาน์เตอร์เขียว',description:'โซนนั่งคุยซ้ายมีแผงกระจกจำลอง กรอบไม้และคานขาว ด้านขวาเป็นซุ้มดำคาดเหลืองพร้อมโต๊ะเจรจา 4 ที่นั่ง เคาน์เตอร์เขียวด้านหน้า ปรับจากภาพอ้างอิงให้พอดี 6×3 ม. เว้นทางเข้าโซนซ้ายจากด้านใน',primary:'#343739',secondary:'#bfa07a',background:'#343739',floor:'tile',tile:'woodL',graphic:'CONNECT / DISCUSS / CREATE',purpose:'meeting',logoU:3,logoY:1.9,logoScale:0,
      objects:[
        panel(.24,1.3,.12,1.94,2.32,'#bfa07a'),panel(.24,2.2,.14,.16,2.32,'#bfa07a'),panel(2.38,2.2,.14,.16,2.32,'#bfa07a'),
        panel(1.31,2.2,2.28,.18,.18,'#bfa07a',2.14),
        ...Array.from({length:5},(_,i)=>panel(.55+i*.35,1.3,.095,1.94,.11,'#ffffff',2.14)),
        part('glass-panel',1.31,2.18,2.0,.012,1.95,null,.12),
        part('lounge-sofa',1.25,.83,1.55,.58,.72,'#eeece5'),
        part('lounge-sofa',.62,1.48,1.02,.54,.72,'#eeece5',0,{rotationY:90}),
        part('table-standard',1.55,1.57,.55,.45,.48,'#e9e6df'),
        panel(2.73,1.02,.5,1.4,2.4,'#343739'),panel(4.39,1.77,2.83,.24,.25,'#343739',2.15),panel(5.75,1.77,.18,.24,2.15,'#343739'),
        panel(3.04,1.898,.025,.015,2.15,'#e8ed75'),panel(5.71,1.898,.025,.015,2.15,'#e8ed75'),panel(4.375,1.898,2.695,.015,.025,'#e8ed75',2.15),
        ...Array.from({length:3},(_,i)=>panel(3.6+i*.66,1.04,.07,1.22,.15,'#343739',2.15)),
        graphicPanel('light-rings',4.4,.345,2.25,1.23,.54),...fourSeats(4.32,1.16),
        panel(4.96,2.57,1.45,.62,.82,'#343739'),panel(4.96,2.57,1.5,.66,.045,'#343739',.82),panel(4.79,2.892,1.16,.025,.55,'#5eaa68',.22),logo(4.79,2.91,.87,.37),
        part('planter-grass',.99,2.48,1.4,.25,.52,null),logo(1.31,2.197,1.45,1.22),
        ...pairedScreen('lounge',1.28,.36,1.12,1.03),logo(2.73,1.731,.41,1.28)
      ]},
    {id:'penin-aqua-wave',name:'10 · Aqua Wave',tagline:'ซุ้มคลื่นฟ้า–ไม้ + ตู้โชว์ + เคาน์เตอร์โค้ง',description:'ซุ้มคลื่นสีฟ้าซ้อนแถบไม้ ผนังขาวพร้อมจอและกราฟิกวงแหวน ประตูตกแต่งจำลอง ตู้โชว์ 3 ใบ โต๊ะเจรจา 4 ที่นั่ง และเคาน์เตอร์โค้งหน้าขวา เปิดทางเข้าด้านหน้าและสองข้าง',primary:'#17bad5',secondary:'#c8ae87',background:'#f4f5f1',floor:'tile',tile:'woodL',graphic:'IDEAS / EXPERIENCE / CONNECTIONS',purpose:'display',logoU:3,logoY:1.9,logoScale:0,
      objects:[
        part('fascia-wave',3,.68,5.8,.7,.24,'#c8ae87',1.91),part('fascia-wave',3,.68,5.8,.72,.25,'#17bad5',2.15),rounded(5.8,.63,.2,.45,1.91,'#17bad5'),
        logo(1.25,1.045,1.1,1.93),logo(4.6,1.045,1.1,1.93),
        ...pairedScreen('left',.86,.38,1.24,1.01),panel(.86,.5,1.28,.34,.05,'#c8ae87',.88),part('planter-grass',.86,.6,1.2,.26,.55,null),
        panel(2.03,.45,.72,.2,1.86,'#ffffff'),panel(1.72,.568,.025,.025,1.78,'#5a6062',.04),panel(2.34,.568,.025,.025,1.78,'#5a6062',.04),panel(2.03,.568,.65,.025,.025,'#5a6062',1.8),panel(2.26,.586,.12,.02,.035,'#353a3c',.87),
        panel(3.08,.375,1.22,.04,.48,'#178e9f',1.04),...pairedScreen('demo',3.23,.414,.62,1.1),
        graphicPanel('blue-rings',4.76,.35,1.87,1.32,.53),...fourSeats(4.25,1.32),
        ...[.43,1.04,1.65].flatMap(x=>[panel(x,2.42,.49,.46,.78,'#ffffff'),part('display-glass-case',x,2.42,.49,.46,.25,null,.78)]),
        part('counter-corner-round',5.15,2.46,1.35,.87,.8,null),logo(5.08,2.902,.84,.33)
      ]}
  ];
  function build(id,initial,catalog){
    const t=templates.find(t=>t.id===id);if(!t)throw new Error('ไม่พบเทมเพลต Peninsular');
    const spec=structuredClone(initial);Object.assign(spec,{W:6,D:3,H:2.4,type:'penin',primary:t.primary,secondary:t.secondary,colTouched:true,secTouched:true,wallCol:'white',wallMat:'paint',floor:t.floor,tile:t.tile,carpet:'cream',raise:0,stSize:'none',logoWallU:t.id==='penin-adventure'?2:t.id==='penin-connect'?1.42:3,logoWallY:1.91,logoScale:t.id==='penin-connect'?24:30,nameScale:0,designPurpose:t.purpose,boothTemplate:{id:t.id,type:'penin',name:t.name,version:1},objects:[],view:'three'});
    if(t.logoU!==undefined)Object.assign(spec,{logoWallU:t.logoU,logoWallY:t.logoY,logoScale:t.logoScale});
    // This layout brands the upper header; keep the default wall logo available
    // in the asset list, but hidden so the foreground timber does not cut it.
    if(t.id==='penin-timber-noir')spec.sceneItemState={...spec.sceneItemState,'branding.logo.main':{visible:false}};
    spec.objects=t.objects.map((o,i)=>{const item=catalog.find(v=>v.catalogId===o.catalogId);if(!item)throw new Error('ไม่พบอุปกรณ์ '+o.catalogId);return {id:t.id+'-'+i,catalogId:item.catalogId,type:item.type,...(o.label?{label:o.label}:{}),...(o.tv?{groupId:t.id+'-tv-'+o.tv}:{}),position:{...o.position},size:{...o.size},rotationX:0,rotationY:o.rotationY||0,rotationZ:0,orientation:'horizontal',locked:false,unitPrice:item.unitPrice,geometryMode:o.geometryMode==='model'?'model':'parametric',appearance:o.brandLogo&&spec.logo?{mode:'original',textureData:spec.logo,textureName:'YP logo',textureId:t.id+'-logo'}:o.color?{mode:'solid',color:o.color}:{mode:'original'},...(o.structure?{structure:{...o.structure}}:{})};});return {spec,assets:[]};
  }
  root.YPPeninsularTemplates={templates,build:(...args)=>{const result=build(...args);root.YPTemplateTVGroups?.apply(result.spec);return result;}};
})(globalThis);
