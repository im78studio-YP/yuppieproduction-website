(async function(){
 'use strict';const q=new URLSearchParams(location.search),token=q.get('mixToken');if(q.get('comparePreview')!=='1'||!token||parent===window)return;
 const send=data=>parent.postMessage({channel:'yp-mixer',token,...data},location.origin);
 try{await YPProjectBridge.ready;YPQuickSetupBridge.close();const r=await loadThreeRenderer();
  const style=document.createElement('style');style.textContent='body{visibility:hidden!important;overflow:hidden!important}#view{visibility:visible!important;position:fixed!important;inset:0!important;width:100vw!important;height:100vh!important;min-height:0!important;margin:0!important;border:0!important}.three-shell{min-height:0!important}.three-tools{display:none!important}.three-hint{display:none!important}';document.head.append(style);
  const canvas=r.renderer.domElement;canvas.removeEventListener('pointerdown',r.onObjectPointerDown,true);canvas.removeEventListener('pointermove',r.onObjectPointerMove);canvas.removeEventListener('pointerup',r.onObjectPointerUp);
  let start=null;canvas.addEventListener('pointerdown',e=>{start={x:e.clientX,y:e.clientY};});canvas.addEventListener('pointerup',e=>{if(!start||Math.hypot(e.clientX-start.x,e.clientY-start.y)>5)return;const rect=canvas.getBoundingClientRect();r.pointer.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);r.raycaster.setFromCamera(r.pointer,r.camera);const hits=r.raycaster.intersectObjects([...r.objectMeshes.values()],true);if(hits[0]){let node=hits[0].object;while(node&&!Array.from(r.objectMeshes.values()).includes(node))node=node.parent;const id=[...r.objectMeshes].find(([,root])=>root===node)?.[0];if(id)send({type:'pick',id});}});
  addEventListener('keydown',e=>{if(['Delete','Backspace'].includes(e.key)||e.ctrlKey||e.metaKey){e.preventDefault();e.stopImmediatePropagation();}},true);
  let shownBounds=null;
  function fit(){if(!shownBounds||!r.camera.isOrthographicCamera)return;r.camera.updateMatrixWorld(true);let extent=0;for(const x of [shownBounds.min.x,shownBounds.max.x])for(const y of [shownBounds.min.y,shownBounds.max.y])for(const z of [shownBounds.min.z,shownBounds.max.z]){const p=new r.THREE.Vector3(x,y,z).project(r.camera);extent=Math.max(extent,Math.abs(p.x),Math.abs(p.y));}if(extent>0){r.camera.zoom*=.86/extent;r.camera.updateProjectionMatrix();}}
  addEventListener('resize',()=>{r.resize();fit();r.renderer.render(r.scene,r.camera);});
  let busy=false;addEventListener('message',async e=>{const m=e.data;if(e.origin!==location.origin||e.source!==parent||m?.channel!=='yp-mixer'||m.token!==token)return;
   if(m.type==='highlight'){r.setSceneSelection(m.ids||[],m.ids?.[0]||null);r.renderer.render(r.scene,r.camera);return;}
   if(m.type!=='render'||busy)return;busy=true;
   try{YPProjectStore.validate(YPProjectStore.create(m.snapshot));YPProjectBridge.restore(m.snapshot);if(!await r.waitForSceneAssets(20000))throw Error('โหลดไฟล์ประกอบไม่ครบ');
    const b=r.presentationBounds(m.snapshot.spec),size=b.getSize(new r.THREE.Vector3()),center=b.getCenter(new r.THREE.Vector3()),span=Math.max(size.x,size.z,size.y*1.4),aspect=Math.max(.5,innerWidth/innerHeight),half=Math.max(span*.65,size.y*.75*aspect);
    r.cancelCameraTransition();r.applyingCameraPreset=false;
    r.applyCameraManifest({projection:'orthographic',cameraViewType:'comparison',position:{x:center.x+span*.9,y:center.y+span*.60,z:center.z+span*1.4},target:{x:center.x,y:center.y,z:center.z},up:{x:0,y:1,z:0},zoom:1,near:.01,far:span*20,frustum:{left:-half,right:half,top:half/aspect,bottom:-half/aspect}});
    shownBounds=b;r.controls.enableRotate=true;r.resize();fit();r.renderer.render(r.scene,r.camera);send({type:'rendered',revision:m.revision});
   }catch(error){send({type:'error',revision:m.revision,message:error.message});}finally{busy=false;}
  });send({type:'ready'});
 }catch(error){send({type:'error',message:error.message});}
})();
