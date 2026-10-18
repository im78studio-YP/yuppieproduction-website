import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createHash} from 'node:crypto';

const html=fs.readFileSync(new URL('../../public/lightbox_maker/YP-Lightbox-Studio.html',import.meta.url),'utf8');
const source=html.match(/<script>([\s\S]*?)<\/script>/)[1];
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
function context(){
  const c=vm.createContext({document:{readyState:'loading',addEventListener(){}},window:{},TextEncoder,console});
  vm.runInContext(source,c);return c;
}

// Golden fields captured before narrowing the convolution to boundary bands.
// Compare every float, including constant regions, so thin strokes, holes and
// smoothing at crop/image edges cannot silently change during optimization.
const fields=[
  ['empty',()=>false],
  ['full',()=>true],
  ['hole',(x,y)=>x>2&&x<126&&y>3&&y<81&&!((x-64)**2+(y-42)**2<19**2)],
  ['thin',(x,y)=>Math.abs(y-x*.55-2)<1.1],
  ['touching',(x,y)=>(x>=8&&x<36&&y>=5&&y<30)||(x>=36&&x<61&&y>=30&&y<57)],
  ['islands',(x,y)=>((x-17)**2+(y-15)**2<13**2)||((x-111)**2+(y-69)**2<8**2)],
  ['neck',(x,y)=>(x>4&&x<42&&y>2&&y<74)||(x>=42&&x<=89&&y>=41&&y<=42)||(x>89&&x<127&&y>5&&y<80)],
  ['noise',(x,y)=>(Math.imul(x+1,73856093)^Math.imul(y+1,19349663))%11===0],
];
const expectedFields={
  empty:'empty',full:'1882595ea10ebb2ecd775bc95fdcd0f55ddca918ed97e4f9706ac4f7595703ed',
  hole:'7b5ff1c563fe600a0fbab089d051c31c3145aa3d3298469d0f0c467e53296d82',
  thin:'049540773d56c9a51deb823654d29e1847b447a5e8b330583cede66a84ea176d',
  touching:'4e09ea390cb90bd692d80190903b75de0a2170ce5f06e0267395464ac2cc410a',
  islands:'babb9023fb88bec1dac81cf0e3ed4f00eac75952aac01047f5876a3fded87593',
  neck:'2f51d3e18d8bbb07c42956ecc487fce776146e681a3f7f9bf93a631f36115b7d',
  noise:'eb1dfbad1c792b4bfba155f1ae23bc990caae0a854b50c8593ddd8c033a37d70',
};
for(const [name,inside] of fields) test(`SDF preserves all float values: ${name}`,()=>{
  const c=context(),gw=131,gh=85,mask=Uint8Array.from({length:gw*gh},(_,i)=>+inside(i%gw,Math.floor(i/gw)));
  c.mask=mask;
  const f=vm.runInContext(`sdfOf(mask,${gw},${gh})`,c);
  const actual=f?hash(new Uint8Array(f.sd.buffer,f.sd.byteOffset,f.sd.byteLength)):'empty';
  assert.equal(actual,expectedFields[name]);
  if(f){
    c.field=f;
    const loops=vm.runInContext('JSON.stringify(msLoops(field,0))',c);
    const dense=vm.runInContext('JSON.stringify(msLoops({...field,runs:null},0))',c);
    assert.equal(loops,dense,'bounded traversal must retain every vertex in the same order');
  }
});

const expectedMeshes={
  snap:'314d180f0462e6945344a8f7d1703ab5e3dfb54b4be78c0466c65d5149fca539',
  screw:'953d9eca5d4f7de18ae1201f89c18930d9a5a0db983c160846b505dd3170558c',
  lip:'8fd9341862fabaa843786058eff70485d777247de6d1510bb1489753f7a1a8a7',
  butt:'d40926c4b652ebe099f30850c58affe0ff5016e9cfc82832623c880a12b30e36',
};
for(const joint of ['snap','screw','lip','butt'])test(`Production geometry unchanged for ${joint} joints and frame bands`,()=>{
  const c=context();c.joint=joint;
  const parts=vm.runInContext(`(()=>{
    S=defaults();S.exp={...S.exp,res:.5,bed:80,bedH:90,margin:10,autoSplit:true};
    S.box.W=164;S.box.H=104;S.box.depth=40;S.hw.joint=joint;S.hw.hang=true;
    S.box.bandN=3;S.box.bandRules=[{sideGlow:true,sideT:1.2},{}];
    const gw=328,gh=208,panel=new Uint8Array(gw*gh),owner=new Uint8Array(gw*gh).fill(255);
    for(let y=4;y<gh-4;y++)for(let x=4;x<gw-4;x++){
      if(x>130&&x<190&&y<45)continue;
      panel[y*gw+x]=1;owner[y*gw+x]=1;
    }
    G={gw,gh,px:.5,panel,owner,K:1,empty:false,edtIn:edtToOutside(panel,gw,gh),comp:components(panel,gw,gh)};
    computeAreas();PB=panelBounds();return buildParts(false);
  })()`,c);
  const actual=parts.map(m=>({name:m.name,n:m.n,tile:m.tile,vol:m.vol,
    hash:hash(new Uint8Array(m.a.buffer,0,m.n*4))}));
  const digest=hash(JSON.stringify(actual));
  assert.equal(digest,expectedMeshes[joint]);
});
