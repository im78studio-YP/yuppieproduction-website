/* Runs only in an isolated child page. No workspace draft reads/writes. */
(async function(){
  const params=new URLSearchParams(location.search),token=params.get('compareToken');
  if(params.get('comparePreview')!=='1'||!token||window.parent===window)return;
  const target=location.protocol==='file:'?'*':location.origin;
  const send=payload=>window.parent.postMessage({channel:'yp-compare',token,...payload},target);
  let busy=false;
  try{
    await YPProjectBridge.ready;YPQuickSetupBridge.close();
    window.addEventListener('message',async event=>{
      if(event.source!==window.parent||event.data?.channel!=='yp-compare'||event.data?.token!==token||event.data?.type!=='render'||busy)return;
      busy=true;const {id,snapshot,camera}=event.data;
      try{
        YPProjectStore.validate(YPProjectStore.create(snapshot));
        for(const asset of snapshot.assets){const header=new DataView(await asset.file.slice(0,12).arrayBuffer());if(header.byteLength<12||header.getUint32(0,true)!==0x46546c67||header.getUint32(4,true)!==2||header.getUint32(8,true)!==asset.file.size)throw new Error('ไฟล์โมเดล '+asset.name+' ไม่ใช่ GLB ที่สมบูรณ์');}
        YPProjectBridge.restore(snapshot);
        const renderer=await loadThreeRenderer(),models=YPProjectBridge.capture().spec.objects.filter(o=>o.visible!==false&&o.geometryMode!=='parametric').map(o=>objectCatalogDef(o.catalogId)).filter(item=>item?.modelUrl);
        for(const item of models)renderer.requestFurnitureTemplate(item);
        if(!await renderer.waitForSceneAssets(20000))throw new Error('โหลดโมเดลไม่ครบภายในเวลาที่กำหนด');
        for(const item of models)if(renderer.furnitureErrors.has(item.catalogId)||!renderer.furnitureTemplates.has(item.catalogId))throw new Error('โหลดโมเดล '+item.name+' ไม่สำเร็จ จึงไม่ใช้กล่องแทนในภาพเปรียบเทียบ');
        const result=await window.exportCleanScreenshot({camera,aspectRatio:4/3,minLongEdge:1536,maxLongEdge:1536,download:false,assetTimeoutMs:20000});
        if(!result?.blob?.size||result.blob.type!=='image/png')throw new Error('ไม่ได้รับภาพ PNG');
        send({type:'result',id,blob:result.blob,camera:result.camera});
      }catch(error){send({type:'error',id,message:error.message});}finally{busy=false;}
    });
    send({type:'ready'});
  }catch(error){send({type:'error',message:error.message});}
})();
