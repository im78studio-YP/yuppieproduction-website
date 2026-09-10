(function(root){
 'use strict';
 // Decorative backgrounds only. All lettering is supplied by template-branding
 // using the original Yuppie vector at the panel's real aspect ratio.
 root.YPPeninsularSixArtwork=kind=>{
  const canvas=document.createElement('canvas');canvas.width=1200;canvas.height=600;const c=canvas.getContext('2d');
  const key=kind.replace('six-',''),screens=['technology','gold','digital','mobile','inventors','product','devices'];
  if(screens.includes(key)){
   canvas.height=['mobile','inventors','digital'].includes(key)?1500:680;
   const g=c.createLinearGradient(0,0,1200,canvas.height);g.addColorStop(0,key==='gold'?'#120e02':key==='inventors'?'#7551e8':'#03183c');g.addColorStop(1,key==='gold'?'#9f7612':key==='mobile'?'#690bc7':'#0c91cf');c.fillStyle=g;c.fillRect(0,0,1200,canvas.height);
   for(let i=0;i<32;i++){c.strokeStyle=key==='gold'?'#dfbe5155':'#86ddff44';c.lineWidth=2;c.beginPath();c.ellipse(610,canvas.height*.59,50+i*19,40+i*10,i*.07,0,Math.PI*2);c.stroke();}
   if(key==='devices'||key==='product')for(let i=0;i<5;i++){c.fillStyle='#14191f';c.fillRect(150+i*188,240,120,330);c.fillStyle=['#6bdddf','#ffae96','#8f64f3'][i%3];c.fillRect(158+i*188,255,104,296);}
  }else{
   c.fillStyle=['handa','website'].includes(key)?'#222327':key==='mobile-label'?'#246bd7':key==='blue-name'?'#087eae':'#f7f7f1';c.fillRect(0,0,1200,600);
  }
  return canvas.toDataURL('image/png');
 };
})(globalThis);
