(function(root){
  'use strict';
  const keys=['W','D','H'];
  const dimensions=spec=>Object.fromEntries(keys.map(key=>[key,spec[key]]));
  function valid(spec){return keys.every(key=>Number.isFinite(spec[key]))&&spec.W>=1&&spec.W<=30&&spec.D>=1&&spec.D<=30&&spec.H>=2.4&&spec.H<=4.9;}
  function options(source,current){
    if(!valid(source)||!valid(current)||source.type==='photo360'||keys.every(key=>source[key]===current[key]))return null;
    return {original:dimensions(source),current:dimensions(current),preferred:keys.every(key=>current[key]>=source[key])?'current':'original'};
  }
  function apply(snapshot,area){
    if(!valid(area))throw new Error('ขนาดพื้นที่เทมเพลตไม่ถูกต้อง');
    const out=structuredClone(snapshot);
    // Only the system floor/walls follow the area. Keep all catalog geometry,
    // coordinates, artwork, groups and explicit attachments at real-world size.
    Object.assign(out.spec,dimensions(area));
    return out;
  }
  root.YPTemplateArea={options,apply};
})(globalThis);
