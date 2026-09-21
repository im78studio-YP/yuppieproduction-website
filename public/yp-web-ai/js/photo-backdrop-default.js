(function(root){
 'use strict';
 // Opt-in only on choosing a new Photo Backdrop; never applied during restore/sync.
 function apply(spec,{dimensions=true,preserveGraphics=false}={}){
  if(dimensions)Object.assign(spec,{W:6,D:3,H:2.4});
  const artwork=root.YPPhotoBackdropArtwork,logo=root.YPDefaultLogo;
  Object.assign(spec,{type:'backdrop',floor:'carpet',carpet:'grey',raise:0,
   carpetTextureData:null,carpetTextureName:'',carpetTextureMode:'builtin',carpetTextureActiveId:'',
   stSize:'none',sideLogo:false,logoMount:'floor',logoShape:'cutout',logoType:'diecut',
   logoScale:35,nameScale:0,logoDepth:.05,logoBaseWidth:2.19,logoBaseDepth:.19,logoBaseColor:'#20252d',
   logoFloorX:spec.W/2,logoFloorZ:Math.max(.2,spec.D-.2),logoFloorRotation:0,lights:true});
  if(logo&&(!preserveGraphics||!spec.logo)){
   Object.assign(spec,{logo:logo.data,logoAR:logo.aspect,logoAcc:logo.color,logoColor:logo.color,
    logoColorTouched:true,logoColorMode:'tint',logoHasTransparency:true,logoVisibleBounds:null,brand:logo.brand});
  }
  if(artwork&&(!preserveGraphics||!spec.wallStickers?.back?.data)){
   spec.wallStickers={...(spec.wallStickers||{}),back:{data:artwork.data,name:artwork.name,id:20260921,
    ar:artwork.aspect,w:spec.W,h:spec.H,lock:false,rotation:0,mode:'cover',patternSize:1.2,offsetX:0,offsetY:0}};
   spec.wallStickerFaces=[...new Set([...(spec.wallStickerFaces||[]),'back'])];spec.wallMat='sticker';
  }
  return spec;
 }
 root.YPPhotoBackdropDefault={apply};
})(globalThis);
