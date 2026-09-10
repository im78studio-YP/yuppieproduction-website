import test from 'node:test';
import assert from 'node:assert/strict';
import '../../public/yp-web-ai/js/corner-templates.js';
const lib=globalThis.YPCornerTemplates,t=lib.templates[0];
const initial={wallStickerFaces:['back','left'],wallStickers:{left:{data:'readable left'},right:{data:'right'},back:{data:'back'}},assetAttachmentGraph:{attachments:[]}};
const catalog=[...new Set(lib.templates.flatMap(t=>t.objects.map(o=>o.catalogId)))].map(catalogId=>({catalogId,type:catalogId==='brand-artwork-copy'?'brandCopy':'panel',unitPrice:0}));
test('seven distinct layouts fit the 6x3 footprint in both orientations',()=>{
  assert.equal(lib.templates.length,7);assert.equal(new Set(lib.templates.map(t=>t.id)).size,7);
  for(const t of lib.templates)for(const side of ['left','right']){
    const s=lib.build(t.id,initial,catalog,side).spec;
    for(const o of s.objects){const a=o.rotationY*Math.PI/180,w=Math.abs(Math.cos(a))*o.size.w+Math.abs(Math.sin(a))*o.size.d,d=Math.abs(Math.sin(a))*o.size.w+Math.abs(Math.cos(a))*o.size.d;
      const message=t.id+' '+side+' '+o.id;
      assert.ok(o.position.x-w/2>=-1e-8&&o.position.x+w/2<=6+1e-8,message+' X');
      assert.ok(o.position.z-d/2>=-1e-8&&o.position.z+d/2<=3+1e-8,message+' depth');
      assert.ok(o.position.y>=0&&o.position.y+o.size.h<=(t.overallHeight||t.height||2.4)+1e-8,message+' height');
    }
  }
});
test('new templates preserve TV groups, readable logos, and asymmetric mesh reflection',()=>{
  for(const t of lib.templates.slice(1)){
    const s=lib.build(t.id,{...initial,logo:'data:image/svg+xml;base64,PHN2Zy8+'},catalog).spec,m=lib.mirror(s,'left'),back=lib.mirror(m,'right');
    const groups=new Map();
    s.objects.forEach((o,i)=>{
      const mirrored=m.objects[i];assert.ok(Math.abs(mirrored.position.x-(6-o.position.x))<1e-8);
      assert.ok(Math.abs(back.objects[i].position.x-o.position.x)<1e-8);
      if(o.type==='brandCopy')assert.equal(!!mirrored.flipX,false);
      else {assert.equal(mirrored.flipX,true);assert.equal(back.objects[i].flipX,false);}
      if(o.groupId)groups.set(o.groupId,(groups.get(o.groupId)||0)+1);
      assert.equal(mirrored.groupId,o.groupId);
    });
    for(const n of groups.values())assert.equal(n,2);
    assert.ok(s.objects.some(o=>o.appearance.textureName==='YP logo'));
  }
});
test('corner template fits 6x3 on both sides and has four bar stools',()=>{
  for(const side of ['left','right']){const {spec:s}=lib.build(t.id,initial,catalog,side);assert.equal(s.W,6);assert.equal(s.D,3);assert.equal(s.cornerSide,side);assert.equal(s.objects.filter(o=>o.catalogId==='bar-stool').length,4);
    for(const o of s.objects){assert.ok(o.position.x-o.size.w/2>=-1e-9);assert.ok(o.position.x+o.size.w/2<=6+1e-9);assert.ok(o.position.z-o.size.d/2>=-1e-9);assert.ok(o.position.z+o.size.d/2<=3+1e-9);assert.ok(o.position.y+o.size.h<=2.4+1e-9);}
  }
});
test('mirror preserves edits and readable graphics without mutating source',()=>{
  const s=lib.build(t.id,initial,catalog).spec;s.objects[0].position.x=1.85;s.objects[0].rotationY=27;s.objects[0].rotationZ=12;s.objects[0].appearance.color='#123456';const before=structuredClone(s),m=lib.mirror(s,'left');
  assert.deepEqual(s,before);assert.equal(m.objects[0].position.x,4.15);assert.equal(m.objects[0].rotationY,333);assert.equal(m.objects[0].rotationZ,348);assert.deepEqual(m.objects[0].size,s.objects[0].size);assert.deepEqual(m.objects[0].appearance,s.objects[0].appearance);assert.deepEqual(m.wallStickers.right,s.wallStickers.left);assert.equal(m.wallStickers.back.data,'back');assert.equal(m.logoWallU,1.7999999999999998);assert.deepEqual(m.wallStickerFaces,['back','right']);
  const again=lib.mirror(m,'right');s.objects.forEach((o,i)=>assert.ok(Math.abs(again.objects[i].position.x-o.position.x)<1e-9));assert.deepEqual(lib.mirror(m,'left'),m);
});
test('invalid side or attachment constraints cannot silently change the scene',()=>{
  const s=lib.build(t.id,initial,catalog).spec;s.assetAttachmentGraph.attachments.push({id:'anchor'});const before=structuredClone(s);assert.throws(()=>lib.mirror(s,'left'),/จุดยึด/);assert.throws(()=>lib.mirror(s,'invalid'));assert.deepEqual(s,before);
});
