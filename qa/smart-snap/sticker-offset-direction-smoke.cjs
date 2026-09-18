const {chromium}=require('C:/Users/Admin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-unsafe-swiftshader']});try{
 const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:4173/yp-web-ai/index.html',{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.YPProjectWorkspace?.state().ready);
 const result=await page.evaluate(async()=>{
  const r=await loadThreeRenderer(),f=YPAssetFaceStickers.uiOffset;
  const image=document.createElement('canvas');image.width=image.height=100;const ctx=image.getContext('2d');ctx.fillStyle='#ff0000';ctx.fillRect(40,40,20,20);
  const centroid=(mode,rotation,x,y)=>{const texture=r.artworkTexture(image,1,1,{mode,rotation,offsetX:f('offsetX',x),offsetY:f('offsetY',y)}),c=texture.image,p=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let sx=0,sy=0,n=0;for(let i=0;i<p.length;i+=4)if(p[i+3]>128){sx+=(i/4)%c.width;sy+=Math.floor(i/4/c.width);n++;}texture.dispose();return[sx/n,sy/n];};
  for(const mode of ['single','cover'])for(const rotation of [0,90,180,270]){
   const center=centroid(mode,rotation,0,0),up=centroid(mode,rotation,0,.1),down=centroid(mode,rotation,0,-.1),right=centroid(mode,rotation,.1,0),left=centroid(mode,rotation,-.1,0);
   if(!(up[1]<center[1]-90&&down[1]>center[1]+90&&right[0]>center[0]+90&&left[0]<center[0]-90))throw Error('wrong image direction '+mode+' '+rotation);
  }
  for(const yUp of [true,false]){
   const host=document.createElement('div'),calls=[];appendStickerDisplayControls(host,{mode:'single',offsetX:.12,offsetY:.07},(k,v)=>calls.push([k,v]),{x:1,y:1,yUp});
   const nums=host.querySelectorAll('input[type=number]'),ranges=host.querySelectorAll('input[type=range]');
   if(Number(nums[1].value)!==(yUp?-.07:.07))throw Error('old offset display changed');
   nums[1].value='.2';nums[1].onchange();if(calls.at(-1)[1]!==(yUp?-.2:.2))throw Error('number offset wrong');
   ranges[1].value='-.15';ranges[1].oninput();if(calls.at(-1)[1]!==(yUp?.15:-.15))throw Error('slider offset wrong');
   nums[0].value='.2';nums[0].onchange();if(calls.at(-1)[1]!==.2)throw Error('horizontal changed');
  }
  return 'texture pixel positions: ±X/±Y, single/cover, four rotations; wall number/slider; floor unchanged';
 });assert.deepEqual(errors,[]);console.log('PASS',result);
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
