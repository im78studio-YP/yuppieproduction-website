import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import zlib from 'node:zlib';
import {createHash} from 'node:crypto';

const html=fs.readFileSync(new URL('../../public/lightbox_maker/YP-Lightbox-Studio.html',import.meta.url),'utf8');
const source=html.match(/<script>([\s\S]*?)<\/script>/)[1];
const methods=['butt','lap','scarf','tongue','dowel','butterfly','dovetail','plate','nut','selftap','snap','magnet','weld'];
const run=(c,s)=>vm.runInContext(s,c),plain=v=>JSON.parse(JSON.stringify(v));
const near=(a,b,e=1e-4)=>assert.ok(Math.abs(a-b)<=e,`${a} != ${b}`);
const hash=b=>createHash('sha256').update(b).digest('hex');

function fixture({px=.15,joint='lip',hardware=false,bands=1}={}){
  const c=vm.createContext({document:{readyState:'loading',addEventListener(){},querySelector(){return {textContent:'',classList:{toggle(){},add(){},remove(){}}};}},
    window:{},TextEncoder,TextDecoder,Blob,console,performance,setTimeout,clearTimeout,structuredClone});
  vm.runInContext(source,c);c.settings={px,joint,hardware,bands};
  run(c,`S=defaults();S.build.mode='service';S.box.W=132;S.box.H=138;S.box.depth=60;S.box.bandN=settings.bands;
    S.box.bandRules=[{pos:35,width:5},{pos:65,width:4}];S.hw.joint=settings.joint;S.hw.hole='none';S.hw.hang=false;
    S.exp={...S.exp,res:settings.px,bed:80,bedH:80,margin:10,smooth:false,autoSplit:true};
    S.seam={...S.seam,enabled:true,production:false,length:48,width:20,selected:[],hardware:{...S.seam.hardware,clearance:.4}};
    const px=settings.px,gw=Math.round(S.box.W/px),gh=Math.round(S.box.H/px),panel=new Uint8Array(gw*gh),owner=new Uint8Array(gw*gh).fill(255);
    for(let y=0;y<gh;y++)for(let x=0;x<gw;x++)if((x+.5)*px>=3&&(x+.5)*px<123&&(gh-y-.5)*px>=6&&(gh-y-.5)*px<126){panel[y*gw+x]=1;owner[y*gw+x]=1;}
    G={gw,gh,px,panel,owner,K:1,empty:false,edtIn:edtToOutside(panel,gw,gh),comp:components(panel,gw,gh)};
    computeAreas();PB=panelBounds();if(!settings.hardware)screwPoints=snapPoints=hangPoints=()=>[];`);
  return {
    c,
    build:()=>run(c,'buildParts(false)'),
    plan:()=>run(c,'seamProductionPlan()'),
    enable(method,axes=['x']){
      c.chosenMethod=method;c.axes=axes;
      run(c,`S.seam.method=chosenMethod;S.seam.production=true;S.seam.selected=[];if(chosenMethod==='selftap')S.seam.hardware.hole=2.5;
        (()=>{const p=buildSeamPlan(),chosen=[];
          for(const axis of axes){const q=p.candidates.find(q=>q.valid&&q.axis===axis&&!chosen.some(r=>seamOverlap(q.footprint,r.footprint)));
            if(!q)throw new Error(chosenMethod+': no feasible '+axis+' fixture site');chosen.push(q);}
          S.seam.selected=chosen.map(({axis,seamIndex,tileIndex,along})=>({axis,seamIndex,tileIndex,along}));})();`);
      return this.plan();
    },
    async export(format){c.format=format;run(c,'S.exp.fmt=format;buildGrid=()=>G;');return await run(c,'generateExportFiles()');}
  };
}

function digest(parts){return Array.from(parts,p=>({kind:p.kind,module:p.module,tile:p.tile?plain(p.tile):null,n:p.n,vol:p.vol,
  hash:hash(new Uint8Array(p.a.buffer,p.a.byteOffset,p.n*4))}));}

function closed(mesh){
  assert.ok(mesh.n>0&&mesh.n%12===0,mesh.name+': empty/incomplete mesh');
  const edges=new Map(),neighbors=new Map();let volume=0;
  const key=p=>p.map(v=>Math.round(v*1e5)).join(',');
  for(let i=0;i<mesh.n;i+=12){
    const p=[0,1,2].map(k=>Array.from(mesh.a.subarray(i+3+k*3,i+6+k*3))),keys=p.map(key);
    assert.ok(p.every(a=>a.every(Number.isFinite)),mesh.name+': nonfinite');
    const u=p[1].map((v,k)=>v-p[0][k]),v=p[2].map((a,k)=>a-p[0][k]);
    const n=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]],length=Math.hypot(...n);
    assert.ok(length>1e-10,mesh.name+': degenerate');
    near(Math.hypot(mesh.a[i],mesh.a[i+1],mesh.a[i+2]),1);
    assert.ok(n.reduce((s,v,k)=>s+v*mesh.a[i+k],0)/length>.9999,mesh.name+': incorrect normal');
    volume+=(p[0][0]*(p[1][1]*p[2][2]-p[1][2]*p[2][1])+p[0][1]*(p[1][2]*p[2][0]-p[1][0]*p[2][2])+p[0][2]*(p[1][0]*p[2][1]-p[1][1]*p[2][0]))/6;
    for(let k=0;k<3;k++){
      const a=keys[k],b=keys[(k+1)%3],edge=a<b?a+'|'+b:b+'|'+a,e=edges.get(edge)||[0,0];e[0]++;e[1]+=a<b?1:-1;edges.set(edge,e);
      if(!neighbors.has(a))neighbors.set(a,new Set());if(!neighbors.has(b))neighbors.set(b,new Set());neighbors.get(a).add(b);neighbors.get(b).add(a);
    }
  }
  for(const [edge,[count,balance]] of edges){assert.equal(count,2,mesh.name+': nonmanifold '+edge);assert.equal(balance,0,mesh.name+': orientation '+edge);}
  const seen=new Set(),todo=[neighbors.keys().next().value];while(todo.length){const p=todo.pop();if(seen.has(p))continue;seen.add(p);for(const q of neighbors.get(p))if(!seen.has(q))todo.push(q);}
  assert.equal(seen.size,neighbors.size,mesh.name+': disconnected solids');assert.ok(volume>0);
  near(volume,mesh.vol,Math.max(1e-3,mesh.vol*1e-5));return {volume,triangles:mesh.n/12};
}

function verticalProbe(mesh){
  const caps=[];
  for(let i=0;i<mesh.n;i+=12){
    const [ax,ay,az,bx,by,bz,cx,cy,cz]=mesh.a.subarray(i+3,i+12),d=(by-cy)*(ax-cx)+(cx-bx)*(ay-cy);
    if(Math.abs(d)>1e-12)caps.push([ax,ay,az,bx,by,bz,cx,cy,cz,d]);
  }
  const hits=(x,y)=>{
    const out=[];
    for(const [ax,ay,az,bx,by,bz,cx,cy,cz,d]of caps){
      const a=((by-cy)*(x-cx)+(cx-bx)*(y-cy))/d,b=((cy-ay)*(x-cx)+(ax-cx)*(y-cy))/d,c=1-a-b;
      if(Math.min(a,b,c)>=-1e-7)out.push(a*az+b*bz+c*cz);
    }
    return out.sort((a,b)=>a-b).filter((z,i,a)=>i===0||Math.abs(z-a[i-1])>1e-5);
  };
  return {hits,inside:(x,y,z)=>hits(x,y).filter(a=>a>z+1e-5).length%2===1};
}

function samples(component,px=.15){
  const zs=[...new Set(component.slabs.flatMap(s=>[s.z0,s.z1]))].sort((a,b)=>a-b),levels=zs.slice(0,-1).map((z,i)=>(z+zs[i+1])/2);
  const nx=Math.ceil((component.u1-component.u0)/px),ny=Math.ceil((component.v1-component.v0)/px),found=new Map();
  const expected=(u,v,z)=>component.slabs.some(s=>!s.cut&&z>s.z0&&z<s.z1&&s.contains(u,v))&&!component.slabs.some(s=>s.cut&&z>s.z0&&z<s.z1&&s.contains(u,v));
  for(let y=0;y<ny;y++)for(let x=0;x<nx;x++){
    const u=component.u0+(x+.5)*px,v=component.v1-(y+.5)*px;
    if(u>=component.u1||v<=component.v0)continue;
    const state=levels.map(z=>+expected(u,v,z));
    const key=state.join('')+':'+Math.floor(x*4/nx)+','+Math.floor(y*4/ny);
    if(!found.has(key))found.set(key,{u,v,x:u-component.u0,y:v-component.v0,levels,state});
  }
  return [...found.values()];
}

function verifyComponent(component,part){
  const probe=verticalProbe(part),points=samples(component);let solid=0,voids=0;
  for(const p of points)for(let i=0;i<p.levels.length;i++){
    const actual=probe.inside(p.x,p.y,p.levels[i]);
    assert.equal(actual,!!p.state[i],`${part.name}: solid/cut mismatch at (${p.u},${p.v},${p.levels[i]})`);
    if(p.state[i])solid++;else voids++;
  }
  assert.ok(solid>0,part.name+': no real solid samples');return {points,solid,voids};
}

function baseProbe(app,joint,parts){
  const bounds=plain(run(app.c,'PB')),frames=parts.filter(p=>p.module==='box'&&joint.tiles.includes(p.tile.id));
  const entries=Array.from(frames,p=>({part:p,probe:verticalProbe(p)}));
  return (u,v,z)=>{
    const x=joint.axis==='x'?joint.anchorMm.x+u:joint.anchorMm.x-v,y=joint.axis==='x'?joint.anchorMm.y+v:joint.anchorMm.y+u;
    return entries.some(({part,probe})=>probe.inside(bounds.w-x-part.offset.x,y-part.offset.y,joint.baseTop+z));
  };
}

function verifyBaseCuts(app,joint,parts){
  const design=joint.design,h=joint.spec,inside=baseProbe(app,joint,parts),px=run(app.c,'G.px'),bounds=plain(run(app.c,'PB'));
  const source=plain(run(app.c,'({width:S.box.W,height:S.box.H})'));
  const cuts=[-h.baseT,0,...design.baseAdds.flatMap(s=>[s.z0,s.z1]),...design.baseCuts.flatMap(s=>[s.z0,s.z1])]
    .filter(z=>z>=-h.baseT).sort((a,b)=>a-b),zs=[...new Set(cuts)],levels=zs.slice(0,-1).map((z,i)=>(z+zs[i+1])/2),found=new Map();
  const onPad=(x,y,p)=>{
    const dx=p.cx-p.wallX,dy=p.cy-p.wallY,t=Math.max(0,Math.min(1,((x-p.wallX)*dx+(y-p.wallY)*dy)/Math.max(dx*dx+dy*dy,1e-9))),r=p.platform;
    return (x-p.wallX-t*dx)**2+(y-p.wallY-t*dy)**2<=p.radius*p.radius||!!(r&&x>=r.x0&&x<=r.x1&&y>=r.y0&&y<=r.y1);
  };
  const expected=(u,v,z,x,y)=>(z<0&&joint.pads.some(p=>onPad(x,y,p))||design.baseAdds.some(s=>z>s.z0&&z<s.z1&&s.contains(u,v)))&&
    !design.baseCuts.some(s=>z>s.z0&&z<s.z1&&s.contains(u,v));
  const f=joint.footprint,gx0=Math.floor((bounds.ux0+f.x0)/px),gx1=Math.ceil((bounds.ux0+f.x1)/px),
    gy0=Math.floor((source.height-bounds.my0-f.y1)/px),gy1=Math.ceil((source.height-bounds.my0-f.y0)/px);
  for(let gy=gy0;gy<gy1;gy++)for(let gx=gx0;gx<gx1;gx++){
    const x=(gx+.5)*px-bounds.ux0,y=source.height-(gy+.5)*px-bounds.my0,
      u=joint.axis==='x'?x-joint.anchorMm.x:y-joint.anchorMm.y,v=joint.axis==='x'?y-joint.anchorMm.y:joint.anchorMm.x-x;
    if(Math.abs(u)>=joint.length/2-.8||Math.abs(v)>=joint.width/2-.8)continue;
    const state=levels.map(z=>+expected(u,v,z,x,y)),key=state.join('')+':'+Math.floor((u/joint.length+.5)*4)+','+Math.floor((v/joint.width+.5)*4);
    if(!found.has(key))found.set(key,{u,v,state});
  }
  let removed=0;
  for(const p of found.values())for(let i=0;i<levels.length;i++){
    assert.equal(inside(p.u,p.v,levels[i]),!!p.state[i],`${joint.method}: platform/cut mismatch at (${p.u},${p.v},${levels[i]})`);
    if(!p.state[i]&&design.baseCuts.some(s=>levels[i]>s.z0&&levels[i]<s.z1&&s.contains(p.u,p.v)))removed++;
  }
  if(design.baseCuts.length)assert.ok(removed>0,joint.method+': no genuine pocket/groove was sampled');
  return inside;
}

function verifyAssembly(app,joint,parts){
  const definitions=joint.design.components,free=parts.filter(p=>p.module==='joint'&&p.joint.parentId===joint.id),bounds=plain(run(app.c,'PB')),base=baseProbe(app,joint,parts);
  const records=definitions.map(component=>{const part=free.find(p=>p.joint.componentId===component.id);app.c.assemblyPart=part;
    return {component,part,probe:verticalProbe(part),points:samples(component),matrix:run(app.c,'partMatrix(assemblyPart,"asm")')};});
  let checked=0;
  for(const a of records)for(const point of a.points)for(let i=0;i<point.levels.length;i++){
    if(!point.state[i])continue;
    const z=point.levels[i],u=point.u,v=a.component.flipYZ?-point.v:point.v,
      assembledZ=(a.component.assemblyZ||0)+(a.component.flipYZ?-z:z);
    const x=joint.axis==='x'?joint.anchorMm.x+u:joint.anchorMm.x-v,y=joint.axis==='x'?joint.anchorMm.y+v:joint.anchorMm.y+u;
    const T=a.matrix,actual=[T[0]*point.x+T[4]*point.y+T[8]*z+T[12],T[1]*point.x+T[5]*point.y+T[9]*z+T[13],T[2]*point.x+T[6]*point.y+T[10]*z+T[14]];
    near(actual[0],x-bounds.w/2);near(actual[1],y-bounds.h/2);near(actual[2],-joint.baseTop-assembledZ);
    assert.equal(base(u,v,assembledZ),false,`${joint.method}/${a.component.id}: assembled printed solid intersects the real platform`);
    for(const b of records){
      if(b===a)continue;
      const localV=b.component.flipYZ?-v:v,localZ=b.component.flipYZ?(b.component.assemblyZ||0)-assembledZ:assembledZ-(b.component.assemblyZ||0);
      assert.equal(b.probe.inside(u-b.component.u0,localV-b.component.v0,localZ),false,
        `${joint.method}: assembled ${a.component.id} intersects ${b.component.id}`);
    }checked++;
  }
  assert.ok(checked>0);
}

function verifyPhysicalFeatures(app,j,parts){
  const h=j.spec,c=h.clearance,T=h.plateT,base=baseProbe(app,j,parts),centers=[-j.length*.3,j.length*.3];
  const printed=(id,u,v,z)=>{
    const component=j.design.components.find(a=>a.id===id),part=parts.find(p=>p.module==='joint'&&p.joint.parentId===j.id&&p.joint.componentId===id);
    assert.ok(component&&part);return verticalProbe(part).inside(u-component.u0,v-component.v0,z);
  };
  if(j.method==='lap'){
    assert.equal(printed('A',0,0,T/4),true);assert.equal(printed('B',0,0,T/4),true);
    assert.equal(printed('A',0,0,T/2),false);assert.equal(printed('B',0,0,T/2),false);
  }else if(j.method==='tongue'){
    const u=Math.min(j.length*.2,j.length/2-3)/2,edge=(j.width/2-1)*.45;
    assert.equal(printed('A',u,0,T/2),true);assert.equal(printed('B',u,0,T/2),false);
    assert.equal(printed('A',u,edge+c/2,T/2),false);assert.equal(printed('B',u,edge+c/2,T/2),false);
    assert.equal(printed('B',u,edge+c+.5,T/2),true);
  }else if(j.method==='dowel'){
    const d=Math.min(h.depth,h.baseT-1.5-c),r=h.pin/2;
    for(const u of centers){
      assert.equal(base(u,0,-d/2),false);assert.equal(base(u,0,-d-c-.3),true);
      assert.equal(base(u+r+c/2,0,-d/2),false);assert.equal(printed('key',u+r+c/2,0,T+d/2),false);
      assert.equal(printed('key',u,0,T+d/2),true);
    }
  }else if(j.method==='nut'){
    const roof=Math.max(1.5,T/2),bottom=-roof-h.nutT-2*c,z=(bottom-roof)/2;
    for(const u of centers){
      assert.equal(base(u,0,-roof/2),false);assert.equal(base(u+h.bolt/2+.5,0,-roof/2),true,'nut pocket needs an actual roof around the bolt shaft');
      assert.equal(base(u+h.bolt/2+.5,0,z),false);assert.equal(base(u,0,bottom-.3),true);
      assert.equal(base(Math.sign(u)*(j.length/2-.8),0,z),false,'side-entry channel must reach the outside platform edge');
    }
  }else if(j.method==='selftap'){
    for(const u of centers){assert.equal(base(u,0,-h.depth/2),false);assert.equal(base(u,0,-h.depth-.3),true);
      assert.equal(base(u+h.hole/2+.35,0,-h.depth/2),true,'plastic-screw pilot must retain a smaller bore than an insert seat');}
  }else if(j.method==='snap'){
    const seat=Math.max(1.5,T/2),top=seat+T;
    for(const u of centers){const sign=Math.sign(u);
      assert.equal(base(u,0,seat+T/2),true);assert.equal(base(u+.9,0,seat+T/2),false,'spring post must have open clearance beside its stem');
      assert.equal(base(u,2.1,.75),false,'cantilever must not be filled solid between post and support');
      assert.equal(base(u+sign,0,top+c+.1),true);assert.equal(base(u+sign,0,top-.5),false,'hook needs an actual retaining barb');
      assert.equal(printed('bridge',u-sign*1.5,0,T/2),false);assert.equal(printed('bridge',u+sign*1.5,0,T/2),true);
    }
  }else if(j.method==='magnet'){
    const height=Math.max(T,h.magnetT+c+1.5),stopInner=j.length/2-1.8;
    for(const u of centers){assert.equal(base(u,0,-h.magnetT/2),false);assert.equal(base(u,0,-h.magnetT-c-.3),true);
      assert.equal(printed('bridge',u,0,height-.1),false);assert.equal(printed('bridge',u,0,.75),true);}
    assert.equal(base(stopInner+.4,0,.75),true);assert.equal(base(stopInner-c/2,0,.75),false,'magnet bridge needs clearance to the lateral stop');
  }else if(j.method==='butt'||j.method==='weld'){
    const prep=j.design.processPrep,wallV=j.pads.reduce((n,p)=>n+(j.axis==='x'?p.wallY-j.anchorMm.y:j.anchorMm.x-p.wallX),0)/j.pads.length,
      stack=run(app.c,'geomStack()'),top=stack.frameZ0+60;
    if(j.method==='butt'){
      const start=run(app.c,'geomStack().colorT+geomStack().faceBaseT+FRONT_LIP_HEIGHT+1'),z=(start+top-2)/2-j.baseTop;
      assert.equal(base(.225,wallV,z),false,'glue prep must cut the real inner wall');assert.equal(base(prep.width,wallV,z),true);
    }else{
      assert.equal(base(.6,wallV,top-.3-j.baseTop),false,'weld V must open at the rear wall edge');
      assert.equal(base(.6,wallV,top-1.0-j.baseTop),true,'weld V must retain a narrower floor');
    }
  }
}

function unzip(buffer){
  const bytes=Buffer.from(buffer),files=new Map();let at=0;
  while(at+30<=bytes.length&&bytes.readUInt32LE(at)===0x04034b50){
    const method=bytes.readUInt16LE(at+8),size=bytes.readUInt32LE(at+18),n=bytes.readUInt16LE(at+26),e=bytes.readUInt16LE(at+28);
    const name=bytes.subarray(at+30,at+30+n).toString('utf8'),start=at+30+n+e,raw=bytes.subarray(start,start+size);
    assert.ok(method===0||method===8);files.set(name,method===8?zlib.inflateRawSync(raw):raw);at=start+size;
  }return files;
}

async function verifyExports(app,method,parts){
  const free=Array.from(parts).filter(p=>p.module==='joint'),hardwareCount={plate:4,nut:4,selftap:2,magnet:4}[method]||0;
  app.c.exportParts=parts;run(app.c,'S.price.qty=3;');const pack=run(app.c,'platePack(exportParts)');
  assert.equal(pack.plates.filter(p=>p.module==='joint').length,free.length);assert.equal(pack.fits,true);
  for(const format of ['3mf','stl','obj']){
    const output=await app.export(format);assert.equal(output.files.length,1);
    const files=unzip(await output.files[0].blob.arrayBuffer()),manifest=JSON.parse(files.get('assembly.json').toString('utf8'));
    assert.equal(manifest.schemaVersion,method==='plate'?2:3);assert.equal(manifest.joints.length,free.length);
    assert.equal(manifest.bom.printedConnectorsPerSign,free.length);assert.equal(manifest.bom.printedConnectorsTotal,free.length*3);
    assert.equal(manifest.bom.hardwarePerSign.reduce((n,h)=>n+h.quantity,0),hardwareCount);
    assert.equal(manifest.bom.hardwareTotal.reduce((n,h)=>n+h.quantity,0),hardwareCount*3);
    if(method!=='plate'){
      assert.equal(manifest.jointAssemblies.length,1);assert.equal(manifest.jointAssemblies[0].method,method);
      assert.equal(manifest.jointAssemblies[0].components.length,free.length);
    }
    for(const part of free){
      const record=manifest.joints.find(p=>p.jointId===part.jointId);assert.ok(record);assert.equal(record.method,method);
      assert.deepEqual(record.assemblyAnchor,plain(part.assemblyAnchor));
      if(part.assemblyBasis)assert.deepEqual(record.assemblyBasis,plain(part.assemblyBasis));
      if(format==='3mf'){
        assert.ok(files.has(record.file+'.3mf'));const xml=unzip(files.get(record.file+'.3mf')).get('3D/3dmodel.model').toString('utf8');
        assert.ok([...xml.matchAll(/<item /g)].length>0&&[...xml.matchAll(/<triangle /g)].length>0);
        assert.match(xml,/transform="1 0 0 0 1 0 0 0 1 10 10 0"/);
        const vertices=[...xml.matchAll(/<vertex x="([^"]+)" y="([^"]+)" z="([^"]+)"/g)].map(m=>m.slice(1).map(Number));
        assert.ok(vertices.length>0&&vertices.every(v=>v.every(Number.isFinite)));near(Math.min(...vertices.map(v=>v[2])),0,.001);
        assert.ok(vertices.every(v=>v[0]>=-.001&&v[1]>=-.001&&v[2]>=-.001&&v[0]<=60.001&&v[1]<=60.001));
      }else if(format==='stl'){
        const bytes=files.get(record.file+'.stl');assert.ok(bytes);const count=bytes.readUInt32LE(80);assert.ok(count>0);assert.equal(bytes.length,84+count*50);
        let floor=Infinity;
        for(let t=0;t<count;t++)for(let k=0;k<3;k++){
          const at=84+t*50+12+k*12,p=[bytes.readFloatLE(at),bytes.readFloatLE(at+4),bytes.readFloatLE(at+8)];
          assert.ok(p.every(Number.isFinite)&&p[0]>=-1e-5&&p[1]>=-1e-5&&p[2]>=-1e-5&&p[0]<=60.001&&p[1]<=60.001);floor=Math.min(floor,p[2]);
        }near(floor,0);
      }
    }
    if(format==='obj'){
      const obj=[...files].find(([name])=>name.endsWith('.obj'))?.[1].toString('utf8');assert.ok(obj);assert.ok([...files.keys()].some(name=>name.endsWith('.mtl')));
      const records=free.map(part=>{app.c.objectPart=part;return {part,name:run(app.c,'fileToken(objectPart.name)'),
        place:pack.items['joint:'+run(app.c,'fileToken(objectPart.jointId)')],count:0,faces:0,minZ:Infinity};});
      const names=new Map();for(const record of records){if(!names.has(record.name))names.set(record.name,[]);names.get(record.name).push(record);}
      let active=null;
      for(const line of obj.split('\n')){
        if(line.startsWith('o '))active=names.get(line.slice(2))?.shift()||null;
        else if(active&&line.startsWith('v ')){
          const p=line.slice(2).trim().split(/\s+/).map(Number),b=active.place;
          assert.ok(p.every(Number.isFinite)&&p[0]>=b.bx+10-1e-4&&p[1]>=b.by+10-1e-4&&p[0]<=b.bx+70+1e-4&&p[1]<=b.by+70+1e-4&&p[2]>=-1e-4);
          active.count++;active.minZ=Math.min(active.minZ,p[2]);
        }else if(active&&line.startsWith('f '))active.faces++;
      }
      for(const record of records){assert.ok(record.count>0&&record.faces>0,method+': missing OBJ component');near(record.minZ,0,1e-4);}
    }
  }
}

test('All 13 preview choices retain exact legacy meshes when physical production is disabled',()=>{
  const app=fixture({px:.3}),before=digest(app.build());
  for(const id of methods){app.c.id=id;run(app.c,'S.seam.method=id;');assert.equal(app.plan(),null);assert.deepEqual(digest(app.build()),before);}
});

const physicalSignatures=new Map();
for(const method of methods)test(`${method}: physical frames and free parts are real closed solids with distinct interfaces`,()=>{
  const app=fixture(),baseline=app.build(),plan=app.enable(method),parts=app.build();
  assert.equal(plan.method,method);assert.equal(plan.joints.length,1);const joint=plan.joints[0];
  const free=parts.filter(p=>p.module==='joint');assert.ok(free.length>0);
  for(const part of free){
    assert.equal(part.joint.method,method);assert.ok(part.jointId);assert.equal(part.tile,undefined);assert.equal(part.printBase,0);
    near(part.z0,0);closed(part);
  }
  for(const tile of joint.tiles)closed(parts.find(p=>p.module==='box'&&p.tile.id===tile));
  assert.deepEqual(digest(parts.filter(p=>p.module==='front'||p.module==='back')),digest(baseline.filter(p=>p.module==='front'||p.module==='back')));
  const geometry=digest(parts.filter(p=>p.module==='box'||p.module==='joint')).map(p=>({module:p.module,n:p.n,vol:p.vol,hash:p.hash}));
  const fingerprint=hash(JSON.stringify(geometry));
  for(const [id,previous]of physicalSignatures)assert.notEqual(fingerprint,previous,`${method} aliases ${id} geometry`);
  physicalSignatures.set(method,fingerprint);
  if(method!=='plate'){
    const design=joint.design;assert.ok(design&&design.components.length>0);assert.equal(free.length,design.components.length);
    for(const component of design.components){
      const part=free.find(p=>p.joint.componentId===component.id);assert.ok(part,component.id);
      assert.equal(part.joint.parentId,joint.id);verifyComponent(component,part);
    }
    verifyBaseCuts(app,joint,parts);verifyAssembly(app,joint,parts);verifyPhysicalFeatures(app,joint,parts);
    const actual=plain(free.flatMap(p=>plain(p.joint.hardware))),expected=plain(design.hardware);
    assert.deepEqual(actual,expected,'component splitting must not multiply the hardware BOM');
    if(['butt','weld'].includes(method)){
      assert.equal(design.processPrep.kind,method==='butt'?'glue':'weld');
      assert.ok(free.every(p=>p.joint.role==='temporary-jig'));
      assert.notDeepEqual(digest(parts.filter(p=>p.module==='box')),digest(baseline.filter(p=>p.module==='box')),'process choice must prepare actual wall geometry');
    }
  }
});

for(const method of ['lap','snap'])test(`${method}: both-axis assembly retains geometry and clearance with real hardware and color bands`,()=>{
  const app=fixture({joint:'snap',hardware:true,bands:3}),plan=app.enable(method,['x','y']),parts=app.build();
  assert.equal(plan.joints.length,2);assert.ok(parts.some(p=>p.module==='box'&&p.bossCount>0));assert.ok(parts.some(p=>p.module==='box'&&p.snapCount>0));
  for(const part of parts.filter(p=>p.module==='box'||p.module==='joint'))closed(part);
  for(const joint of plan.joints){verifyBaseCuts(app,joint,parts);verifyAssembly(app,joint,parts);}
});

for(const method of methods)test(`${method}: actual 3MF/STL/OBJ exports retain every component, grounding and BOM`,async()=>{
  const app=fixture();app.enable(method);const parts=app.build();await verifyExports(app,method,parts);
});

test('Unknown methods, inadequate resolution, fit clearance and impossible hardware profiles fail explicitly',()=>{
  for(const [method,px,setup]of [
    ['future-connector',.15,''],['lap',.3,''],['lap',.15,'S.seam.hardware.clearance=.1;'],
    ['selftap',.15,'S.seam.hardware.hole=4.2;'],['nut',.15,'S.seam.hardware.nutFlat=100;'],['magnet',.15,'S.seam.hardware.magnetD=0;']
  ]){
    const app=fixture({px});
    if(method==='future-connector')assert.throws(()=>app.enable(method));
    else if(px>.25)assert.throws(()=>app.enable(method));
    else{app.enable(method);run(app.c,setup);assert.throws(()=>app.build(),undefined,method+': unsupported settings must not be replaced silently');}
  }
});

test('A sloped wall that leaves material beyond the nut-entry cut is rejected before exporting a blocked mouth',()=>{
  const app=fixture(),{c}=app,width=144,height=100,px=.15,pad=4,
    gw=Math.ceil((width+pad*2)/px),gh=Math.ceil((height+pad*2)/px),panel=new Uint8Array(gw*gh);
  for(let y=0;y<gh;y++)for(let x=0;x<gw;x++){
    const xx=(x+.5)*px-pad,yy=(gh-y-.5)*px-pad;
    panel[y*gw+x]=+(xx>=0&&xx<width&&yy>=0&&yy<height&&yy>=.16*xx+3);
  }
  c.sloped={gw,gh,px,panel};
  run(c,`(()=>{S.box.W=sloped.gw*sloped.px;S.box.H=sloped.gh*sloped.px;
    const owner=new Uint8Array(sloped.panel.length).fill(255);for(let i=0;i<owner.length;i++)if(sloped.panel[i])owner[i]=1;
    G={...sloped,owner,K:1,empty:false,edtIn:edtToOutside(sloped.panel,sloped.gw,sloped.gh),comp:components(sloped.panel,sloped.gw,sloped.gh)};
    computeAreas();PB=panelBounds();S.seam={...S.seam,method:'nut',production:true,length:26,width:12,
      hardware:{...S.seam.hardware,clearance:.3},selected:[{axis:'x',seamIndex:1,tileIndex:2,along:21.7}]};})();`);
  const selected=run(c,'buildSeamPlan().candidates.find(p=>p.selected)');assert.equal(selected.valid,true,'the XY marker alone cannot identify this blocked side-entry mouth');
  assert.throws(()=>app.plan(),e=>e.name==='SeamProductionError'&&/ช่องใส่น็อต/.test(e.message));
});

test('A lap adapter with a 4 mm base does not depend on the unused 5 mm insert-pocket depth',()=>{
  const app=fixture();app.enable('lap');run(app.c,'S.seam.hardware.baseT=4;S.seam.hardware.depth=5;');
  const plan=app.plan(),parts=app.build(),joint=plan.joints[0];
  assert.equal(plan.spec.baseT,4);assert.equal(plan.spec.depth,5);near(joint.baseTop-joint.baseBottom,4);
  for(const part of parts.filter(p=>p.module==='joint'||p.module==='box'&&joint.tiles.includes(p.tile.id)))closed(part);
  verifyBaseCuts(app,joint,parts);verifyAssembly(app,joint,parts);
});
