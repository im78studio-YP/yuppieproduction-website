(function(root){
  'use strict';
  const presets=['โครงสร้าง','เคาน์เตอร์','Standee','ชั้นโชว์','เฟอร์นิเจอร์','ไฟ','โลโก้–ป้าย','จัดแสดงสินค้า','สื่อและจอ','ตกแต่ง','ทรงกลม','ทรงเหลี่ยม'];
  const categories={structure:'โครงสร้าง',reception:'เคาน์เตอร์',display:'จัดแสดงสินค้า',media:'สื่อและจอ',hospitality:'เฟอร์นิเจอร์',decor:'ตกแต่ง'};
  function normalize(values){return [...new Set((Array.isArray(values)?values:[]).filter(v=>typeof v==='string').map(v=>v.trim().slice(0,32)).filter(Boolean))].slice(0,16);}
  function tags(item){
    if(Array.isArray(item.tags))return normalize(item.tags);
    const found=[],text=(item.catalogId+' '+item.name).toLowerCase();
    if(categories[item.category])found.push(categories[item.category]);
    for(const [pattern,label] of [[/standee|แท่น|ฐานโชว์/,'Standee'],[/counter|เคาน์เตอร์/,'เคาน์เตอร์'],[/shelf|tray.wall|ชั้น/,'ชั้นโชว์'],[/chair|stool|table|sofa|เก้าอี้|โต๊ะ|โซฟา/,'เฟอร์นิเจอร์'],[/light|lamp|ไฟ/,'ไฟ'],[/logo|brand|artwork|sign|โลโก้|ป้าย/,'โลโก้–ป้าย'],[/กลม|round|cylinder/,'ทรงกลม'],[/เหลี่ยม|square/,'ทรงเหลี่ยม']])if(pattern.test(text))found.push(label);
    return normalize(found);
  }
  function badges(item){
    const el=document.createElement('span');el.className='asset-tag-badges';
    const values=tags(item);el.textContent=values.slice(0,2).join(' · ')+(values.length>2?' +'+(values.length-2):'');el.title=values.join(' · ');return el;
  }
  function filters(host,items,active,onChange){
    if(!host)return '';const counts=new Map();items.forEach(item=>tags(item).forEach(tag=>counts.set(tag,(counts.get(tag)||0)+1)));
    if(active&&!counts.has(active))active='';
    const hadFocus=host.contains(document.activeElement);
    host.replaceChildren();host.setAttribute('role','group');host.setAttribute('aria-label','กรองด้วย Tag');
    const order=[...presets.filter(t=>counts.has(t)),...Array.from(counts.keys()).filter(t=>!presets.includes(t))];
    for(const tag of ['',...order]){
      const button=document.createElement('button');button.type='button';button.className='asset-tag-filter';button.dataset.tag=tag;
      button.textContent=(tag||'ทั้งหมด')+' '+(tag?counts.get(tag):items.length);button.setAttribute('aria-pressed',String(tag===active));
      button.onclick=()=>onChange(tag);host.append(button);
    }if(hadFocus)[...host.children].find(button=>button.dataset.tag===active)?.focus({preventScroll:true});return active;
  }
  function picker(host,initial=[]){
    host.replaceChildren();const values=normalize(initial);
    for(const tag of [...presets,...values.filter(t=>!presets.includes(t))]){
      const label=document.createElement('label'),input=document.createElement('input');input.type='checkbox';input.value=tag;input.checked=values.includes(tag);
      label.append(input,document.createTextNode(tag));host.append(label);
    }
  }
  function read(host){return normalize([...host.querySelectorAll('input:checked')].map(input=>input.value));}
  root.YPAssetTags={presets,normalize,tags,badges,filters,picker,read};
})(globalThis);
