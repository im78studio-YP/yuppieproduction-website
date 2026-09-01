(function(global){
  'use strict';

  const VERSION=1;
  const ALPHA_THRESHOLD=16;
  const MIN_VISIBLE_SIZE=.01;

  const finite=(value,fallback=0)=>Number.isFinite(Number(value))?Number(value):fallback;
  const clamp=(value,min,max)=>Math.min(max,Math.max(min,value));

  function normalizeBounds(input,fallback=null){
    const source=input&&typeof input==='object'?input:fallback;
    if(!source||typeof source!=='object')return null;
    const minX=clamp(finite(source.minX),0,1),maxX=clamp(finite(source.maxX,1),0,1),
      minY=clamp(finite(source.minY),0,1),maxY=clamp(finite(source.maxY,1),0,1);
    if(maxX<=minX||maxY<=minY)return fallback&&fallback!==source?normalizeBounds(fallback):null;
    return{minX,maxX,minY,maxY};
  }

  function scanAlphaBounds(data,width,height,options={}){
    const w=Math.max(1,Math.floor(finite(width,1))),h=Math.max(1,Math.floor(finite(height,1))),
      threshold=clamp(finite(options.alphaThreshold,ALPHA_THRESHOLD),0,255),step=Math.max(1,Math.floor(finite(options.step,1)));
    if(!data||data.length<w*h*4)return null;
    let minX=w,minY=h,maxX=-1,maxY=-1;
    for(let y=0;y<h;y+=step)for(let x=0;x<w;x+=step){
      if(data[(y*w+x)*4+3]<threshold)continue;
      if(x<minX)minX=x;if(x>maxX)maxX=x;if(y<minY)minY=y;if(y>maxY)maxY=y;
    }
    if(maxX<minX||maxY<minY)return null;
    /* max ขยายถึงขอบพิกเซลถัดไป เพื่อไม่ตัด Alpha แถวสุดท้ายออกจาก UV */
    return normalizeBounds({minX:minX/w,maxX:Math.min(w,maxX+step)/w,minY:minY/h,maxY:Math.min(h,maxY+step)/h});
  }

  function centeredFallback(fullWidth,fullHeight,visibleWidth,visibleHeight){
    const fw=Math.max(MIN_VISIBLE_SIZE,finite(fullWidth,1)),fh=Math.max(MIN_VISIBLE_SIZE,finite(fullHeight,1)),
      widthRatio=clamp(finite(visibleWidth,fw)/fw,MIN_VISIBLE_SIZE/fw,1),heightRatio=clamp(finite(visibleHeight,fh)/fh,MIN_VISIBLE_SIZE/fh,1);
    return{minX:(1-widthRatio)/2,maxX:(1+widthRatio)/2,minY:(1-heightRatio)/2,maxY:(1+heightRatio)/2};
  }

  function planeMetrics(input={}){
    const fullWidth=Math.max(MIN_VISIBLE_SIZE,finite(input.width,1)),fullHeight=Math.max(MIN_VISIBLE_SIZE,finite(input.height,1)),
      depth=Math.max(MIN_VISIBLE_SIZE,finite(input.depth,.01)),padding=Math.max(0,finite(input.padding,0)),
      visible=normalizeBounds(input.bounds)||{minX:0,maxX:1,minY:0,maxY:1},
      contentWidth=Math.max(MIN_VISIBLE_SIZE,fullWidth*(visible.maxX-visible.minX)),
      contentHeight=Math.max(MIN_VISIBLE_SIZE,fullHeight*(visible.maxY-visible.minY)),
      width=Math.min(fullWidth,Math.max(MIN_VISIBLE_SIZE,contentWidth+padding*2)),
      height=Math.min(fullHeight,Math.max(MIN_VISIBLE_SIZE,contentHeight+padding*2)),
      rawLocalX=fullWidth*((visible.minX+visible.maxX)/2-.5),rawLocalY=fullHeight*(.5-(visible.minY+visible.maxY)/2),
      localX=clamp(rawLocalX,-fullWidth/2+width/2,fullWidth/2-width/2),
      localY=clamp(rawLocalY,-fullHeight/2+height/2,fullHeight/2-height/2);
    return{visibleBounds:visible,fullWidth,fullHeight,contentWidth,contentHeight,width,height,depth,localX,localY};
  }

  function equalBounds(a,b,epsilon=1e-5){
    const left=normalizeBounds(a),right=normalizeBounds(b);if(!left||!right)return left===right;
    return['minX','maxX','minY','maxY'].every(key=>Math.abs(left[key]-right[key])<=epsilon);
  }

  global.YPBrandVisibleBounds=Object.freeze({VERSION,ALPHA_THRESHOLD,normalizeBounds,scanAlphaBounds,centeredFallback,planeMetrics,equalBounds});
})(typeof window!=='undefined'?window:globalThis);
