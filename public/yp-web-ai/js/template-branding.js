(function(root){
 'use strict';
 const REV='yp-brand-audit-20260911';
 const escape=s=>String(s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;');
 // Inline the supplied vector paths: no font substitution, async image race or
 // external SVG dependency. The viewport uses the actual panel's physical ratio.
 function artwork(background,w,h,{zone=[.07,.08,.86,.84]}={}){
  const source=root.YPDefaultLogo;if(!source?.data)throw new Error('ไม่พบโลโก้ Yuppie ตั้งต้น');
  const svg=new DOMParser().parseFromString(atob(source.data.split(',')[1]),'image/svg+xml').documentElement;
  const W=1200,H=Math.max(32,Math.round(W*h/w)),[x,y,bw,bh]=zone;
  const body='<svg xmlns="http://www.w3.org/2000/svg" width="'+W+'" height="'+H+'" viewBox="0 0 '+W+' '+H+'">'+
   (background?'<image href="'+escape(background)+'" width="'+W+'" height="'+H+'" preserveAspectRatio="none"/>':'')+
   '<svg x="'+x*W+'" y="'+y*H+'" width="'+bw*W+'" height="'+bh*H+'" viewBox="'+escape(svg.getAttribute('viewBox'))+'" preserveAspectRatio="xMidYMid meet">'+svg.innerHTML+'</svg></svg>';
  return 'data:image/svg+xml;base64,'+btoa(unescape(encodeURIComponent(body)));
 }
 function apply(spec,t){
  // Called only for freshly built templates, never restore/open-file/customer drafts.
  spec.logo=root.YPDefaultLogo.data;spec.brand=root.YPDefaultLogo.brand;spec.nameScale=0;
  for(let i=0;i<t.objects.length;i++){
   const source=t.objects[i],o=spec.objects[i];if(!o)continue;
   if(source.brandLogo){Object.assign(o.appearance,{mode:'original',textureData:artwork(null,o.size.w,o.size.h),textureName:'Yuppie Production',textureId:REV+'-'+o.id});}
   else if(source.graphic){
    const key=source.graphic,needsLogo=key.startsWith('six-')||key.startsWith('beauty-')||['header','poster','counter','screen','blue-info','light-rings','blue-rings','blush-beauty'].includes(key);
    if(needsLogo){const poster=key.startsWith('beauty-')||/six-(technology|gold|digital|mobile|inventors|product|devices)$/.test(key)||['poster','screen','blush-beauty','blue-info','blue-rings','light-rings'].includes(key);
     Object.assign(o.appearance,{textureData:artwork(o.appearance.textureData,o.size.w,o.size.h,{zone:poster?[.08,.07,.84,.25]:[.06,.06,.88,.88]}),textureName:'Yuppie Production · '+key,textureId:REV+'-'+o.id});}
   }
   // Opt-in detail on template instances only. No change to dimensions, placement,
   // catalogue defaults, saved objects, grouping, prices or snapping behaviour.
   if(!o.structure?.design){
    if(o.catalogId==='chair-standard')o.structure={...o.structure,design:'timber-shell-chair'};
    if(o.catalogId==='table-standard'&&o.size.h<.85)o.structure={...o.structure,design:'timber-glass-table',glassRim:true};
    if(o.catalogId==='planter-grass')o.structure={...o.structure,design:'timber-grass-planter'};
    if(o.catalogId==='lounge-sofa')o.structure={...o.structure,design:'timber-sofa',color:o.appearance.color||'#eeece5'};
    if(o.structure?.design)o.appearance={mode:'original'};
   }
  }
  return spec;
 }
 root.YPTemplateBranding={artwork,apply,revision:REV};
})(globalThis);
