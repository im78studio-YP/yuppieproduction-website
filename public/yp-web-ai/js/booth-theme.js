(function(root){
 'use strict';
 const hex=v=>/^#[\da-f]{6}$/i.test(v||'');
 const valid=t=>!!t&&t.version===1&&['primary','secondary','accent'].every(k=>hex(t[k]));
 const presets=[
  {name:'เขียวธรรมชาติ',primary:'#87b51a',secondary:'#f3efdf',accent:'#36482c'},
  {name:'น้ำเงินร่วมสมัย',primary:'#167fb5',secondary:'#f4f6f7',accent:'#163449'},
  {name:'ยัพพีชมพู',primary:'#f72585',secondary:'#f9eef3',accent:'#332335'},
  {name:'ดำ–ทอง',primary:'#bd903c',secondary:'#ede9e1',accent:'#222326'},
  {name:'ส้มอบอุ่น',primary:'#e77531',secondary:'#fff3e5',accent:'#534137'},
  {name:'ม่วงโมเดิร์น',primary:'#7753b2',secondary:'#f2eef8',accent:'#302a48'}
 ];
 function normalize(t){if(!valid({...t,version:1}))throw Error('ใช้รหัสสี 6 หลัก เช่น #167FB5');return{version:1,name:String(t.name||'กำหนดเอง').slice(0,60),primary:t.primary,secondary:t.secondary,accent:t.accent,keepWood:t.keepWood!==false,keepPlants:t.keepPlants!==false,keepGraphics:t.keepGraphics!==false};}
 function protectedKind(obj,nodeName=''){
  const text=[obj?.type,obj?.catalogId,obj?.structure?.design,obj?.label,nodeName].join(' ').toLowerCase();
  if(/brand|logo|graphic|artwork|screen|monitor|television|bottle|product|helix-display|โลโก้|สินค้า|จอ/.test(text))return'graphics';
  if(/plant|foliage|flower|grass|bamboo|ต้นไม้|ใบไม้|ดอกไม้/.test(text))return'plants';
  if(/wood|timber|floor|rod-screen|side-frame|ลายไม้/.test(text))return'wood';
  return null;
 }
 function colorRole(color){
  const rgb=color.replace('#','').match(/../g).map(v=>parseInt(v,16)/255),max=Math.max(...rgb),min=Math.min(...rgb),d=max-min,l=(max+min)/2,s=d===0?0:d/(1-Math.abs(2*l-1));
  let h=0;if(d){h=(max===rgb[0]?(rgb[1]-rgb[2])/d+(rgb[1]<rgb[2]?6:0):max===rgb[1]?(rgb[2]-rgb[0])/d+2:(rgb[0]-rgb[1])/d+4)*60;}
  if(h>=18&&h<=52&&s>.18&&l>.16&&l<.84)return'wood';
  if(l<.28)return'accent';if(s<.22||l>.84)return'secondary';return'primary';
 }
 function apply(renderer,spec){const theme=spec.boothColorTheme;if(!valid(theme))return;
  const objects=new Map(spec.objects.map(o=>[o.id,o]));let changed=0;
  renderer.boothGroup.traverse(node=>{
   if(!node.isMesh||!node.material||node.userData.systemHelper)return;
   let ancestor=node,obj=null,brand=false,path='';while(ancestor&&ancestor!==renderer.boothGroup){path+=' '+ancestor.name;brand||=!!ancestor.userData.brandPlacement;obj||=objects.get(ancestor.userData.objectId);ancestor=ancestor.parent;}
   // Only authored objects and booth surfaces, never light fixtures, helpers or scene background.
   if(!obj&&!brand&&!/booth-wall|storage-wall|storage-door|booth-floor/.test(path))return;
   if(obj?.locked)return;
   const kind=brand?'graphics':protectedKind(obj,path);
   if(kind==='graphics'&&theme.keepGraphics!==false||kind==='plants'&&theme.keepPlants!==false||kind==='wood'&&theme.keepWood!==false)return;
   if(theme.keepGraphics!==false&&obj?.appearance?.textureData)return;
   const convert=material=>{
    if(!material.color||material.isShaderMaterial||material.opacity<.98||material.transmission>0||material.metalness>.6)return material;
    if(material.isMeshBasicMaterial&&theme.keepGraphics!==false)return material;
    if(material.map&&theme.keepGraphics!==false&&!(kind==='wood'&&theme.keepWood===false))return material;
    const role=colorRole('#'+material.color.getHexString());if(role==='wood'&&theme.keepWood!==false)return material;
    const next=material.clone();next.color.set(theme[kind?'primary':role==='wood'?'primary':role]);next.userData={...next.userData,boothThemeRole:kind||role};changed++;return next;
   };
   node.material=Array.isArray(node.material)?node.material.map(convert):convert(node.material);
  });renderer.boothGroup.userData.themeChangedMaterials=changed;
 }
 root.YPBoothTheme={valid,normalize,presets,protectedKind,colorRole,apply};
})(globalThis);
