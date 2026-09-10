const {chromium}=require('C:/Users/Admin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
(async()=>{
  const browser=await chromium.launch({channel:'chrome',headless:true});
  try{
    // Fresh isolated storage. Exercise the actual editor model/collision pipeline,
    // without depending on CDN availability or changing the user's open design.
    const page=await browser.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.route('https://cdn.jsdelivr.net/**',route=>route.abort());
    await page.goto('http://127.0.0.1:4173/yp-web-ai/index.html');
    await page.waitForFunction(()=>YPProjectWorkspace?.state().ready);
    const result=await page.evaluate(()=>{
      YPQuickSetupBridge.close();
      Object.assign(S,{W:6,D:3,H:2.4,raise:0,type:'inline',stSize:'custom',stW:1.2,stD:1.2,stHmode:2.4,stPos:'center',objects:[]});
      const source=makeCatalogObject('fascia-curved',3,1.1);source.id='support-test';S.objects=[source];syncSceneAssetRegistryState();
      const roomId=SCENE_ASSET_IDS.room,room=sceneAssetRegistry.getAssetById(roomId),
        top=smartSnapEngine.getWorldSurfaces(roomId).find(s=>s.surfaceType==='horizontal-top'),
        solved=smartSnapEngine.solve({sourceAssetId:source.id,surface:top,surfacePoint:{x:3,y:top.worldOrigin.y,z:1.1},gridStep:0}),
        accepted=solved&&smartSnapCandidateCollision(source,solved,roomId),
        // Put the solid front strip through the room front, not its hollow interior.
        penetrating=solved&&smartSnapCandidateCollision(source,{...solved,transform:{...solved.transform,position:{...solved.transform.position,y:1.8,z:.4}}},roomId);
      const obstacle=makeCatalogObject('panel-standard',3,1.98);obstacle.id='obstacle-test';obstacle.position.y=2.4;obstacle.size={w:1,d:.5,h:1};S.objects.push(obstacle);
      const blocked=solved&&smartSnapCandidateCollision(source,solved,roomId);S.objects.pop();
      // Run the real Smart Move surface-placement method using a deterministic ray hit.
      const renderer=Object.create(ThreeBoothRenderer.prototype);
      renderer.setRayFromEvent=()=>{};renderer.surfaceSnapTargets=()=>[];
      renderer.raycaster={intersectObjects:()=>[{face:{}}]};
      renderer.smartSnapSurfaceFromHit=()=>({owner:room,surface:top,point:{x:3,y:top.worldOrigin.y,z:1.1}});
      const moved=renderer.smartSurfacePlacement({},source,null,{startY:0,grabOffset:{x:0,y:.2,z:0}});
      source.position={x:moved.x,y:moved.y,z:moved.z};
      const committed=commitPersistentAttachmentFromSnap(source,moved.snapCandidate);
      syncSceneAssetRegistryState();
      const persisted=JSON.parse(JSON.stringify(assetAttachmentGraph.getAttachment(source.id))),afterSync={...source.position};
      source.placement.surfaceSnap=false;
      const disabled=renderer.smartSurfacePlacement({},source,null,{startY:0});
      removePersistentAttachment(source.id);
      source.transform.scale={x:1.2,y:1.2,z:1.2};source.transform.uniformScale=1.2;
      syncSceneAssetRegistryState();
      const corner=smartSnapEngine.getAnchors(source.id).find(a=>a.id.endsWith('max-x.min-y.min-z')),
        cornerSnap=smartSnapEngine.solve({sourceAssetId:source.id,anchorId:corner.id,surface:top,surfacePoint:{x:3.5,y:2.4,z:.2},gridStep:0});
      source.position={...cornerSnap.transform.position};
      const scaledCommit=commitPersistentAttachmentFromSnap(source,{valid:true,targetAssetId:roomId,surfaceId:top.id,anchorId:corner.id,snapType:'anchor-surface'}),
        committedScale={...sceneAssetRegistry.getAssetById(source.id).transform.scale};
      syncSceneAssetRegistryState();
      const scaledAfterSync={...source.position};
      return{semantics:sceneObjectAssetSemantics(source),solved,accepted,penetrating,blocked,moved,disabled,committed,persisted,afterSync,scaledCommit,committedScale,scaledAfterSync,cornerSnap};
    });
    assert.equal(result.semantics.category,'structure');assert.equal(result.solved.valid,true);
    assert.equal(result.accepted.valid,true,JSON.stringify(result.accepted));
    assert.equal(result.penetrating.valid,true,'user may intentionally intersect a room panel');
    assert.equal(result.blocked.valid,true,'overlap is advisory, never a placement veto');
    assert.equal(result.moved.snapValid,true,JSON.stringify(result.moved));
    assert.ok(Math.abs(result.moved.y-2.401)<1e-6);assert.equal(result.disabled,null);
    assert.equal(result.committed.valid,true);assert.equal(result.persisted.valid,true);
    assert.ok(Math.abs(result.afterSync.y-result.moved.y)<1e-6);
    assert.equal(result.scaledCommit.valid,true);
    assert.deepEqual(result.committedScale,{x:1.2,y:1.2,z:1.2});
    assert.deepEqual(result.scaledAfterSync,result.cornerSnap.transform.position);
    assert.deepEqual(errors,[]);
    console.log('PASS: real catalog fascia, room-top solver, Smart Move surface path, unrestricted room/asset overlaps, snap off (isolated model test; ray hit stubbed)');
  }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
