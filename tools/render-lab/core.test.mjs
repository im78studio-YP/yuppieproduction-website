import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createLab,validateInput,MODEL} from './core.mjs';

function fixture(id='test-request-00001'){
  const png=Buffer.alloc(40);Buffer.from('89504e470d0a1a0a','hex').copy(png);png.write('IHDR',12);png.writeUInt32BE(1536,16);png.writeUInt32BE(1152,20);
  return {id,image:png.toString('base64'),design:JSON.stringify({width:6,depth:3,height:2.4})};
}
function setup(options={}){return createLab({directory:fs.mkdtempSync(path.join(os.tmpdir(),'yp-render-lab-test-')),key:'unit-test-secret',approved:true,...options});}
const untilDone=async lab=>{for(let i=0;i<100&&lab.status().jobs.some(j=>j.status==='running');i++)await new Promise(r=>setTimeout(r,5));};
test('locked without key OR explicit approval; never calls provider',()=>{
  let calls=0;for(const options of [{key:''},{approved:false}]){const lab=setup({...options,providerFetch:()=>calls++});assert.throws(()=>lab.submit(fixture()),/PAID_RENDER_LOCKED/);assert.equal(lab.status().remaining,2);}assert.equal(calls,0);
});
test('validates PNG, dimensions, bounded design and request ID',()=>{
  assert.equal(validateInput(fixture()).size,'1536x1152');
  for(const patch of [{id:'../../secret'},{image:'bad'},{design:'a'.repeat(24001)},{design:'not json'}])assert.throws(()=>validateInput({...fixture(),...patch}));
  const png=Buffer.from(fixture().image,'base64');png.writeUInt32BE(9000,16);assert.throws(()=>validateInput({...fixture(),image:png.toString('base64')}),/DIMENSIONS/);
});
test('fixed one-image edit, secret only in provider header, no duplicate calls',async()=>{
  let calls=0,finish;
  const lab=setup({providerFetch:async(url,options)=>{
    calls++;assert.equal(url,'https://api.openai.com/v1/images/edits');assert.equal(options.headers.Authorization,'Bearer unit-test-secret');
    assert.equal(options.body.get('model'),MODEL);assert.equal(options.body.get('quality'),'high');assert.equal(options.body.get('n'),'1');assert.equal(options.body.get('size'),'1536x1152');assert(options.body.get('image[]') instanceof Blob);
    await new Promise(r=>finish=r);return {ok:true,json:async()=>({data:[{b64_json:fixture().image}],usage:{input_tokens:12,output_tokens:34}})};
  }});
  lab.submit(fixture());lab.submit(fixture());assert.equal(calls,1);
  assert.throws(()=>lab.submit({...fixture(),design:'{}'}),/ID_CONFLICT/);
  assert.throws(()=>lab.submit(fixture('test-request-00002')),/JOB_IN_PROGRESS/);
  finish();await untilDone(lab);lab.submit(fixture());assert.equal(calls,1);
  assert.equal(lab.status().jobs[0].status,'complete');assert.equal(lab.status().jobs[0].usage.input_tokens,12);
  assert(!JSON.stringify(lab.status()).includes('unit-test-secret'));
});
test('failures stay counted, have no retries, and do not leak provider errors',async()=>{
  let calls=0;const lab=setup({providerFetch:async()=>{calls++;throw Error('unit-test-secret');}});
  lab.submit(fixture());await untilDone(lab);assert.equal(calls,1);assert.equal(lab.status().remaining,1);
  assert.equal(lab.status().jobs[0].status,'uncertain');assert(!JSON.stringify(lab.status()).includes('unit-test-secret'));
  lab.submit(fixture('test-request-00002'));await untilDone(lab);assert.equal(calls,2);
  assert.throws(()=>lab.submit(fixture('test-request-00003')),/TEST_ALLOWANCE_EXHAUSTED/);
});
test('restart retains attempts; interrupted jobs become uncertain without resubmission',()=>{
  const directory=fs.mkdtempSync(path.join(os.tmpdir(),'yp-render-lab-restart-'));
  let calls=0;const options={directory,key:'unit-test-secret',approved:true,providerFetch:()=>{calls++;return new Promise(()=>{});}};
  const first=createLab(options);first.submit(fixture());const restarted=createLab(options);
  assert.equal(restarted.status().remaining,1);assert.equal(restarted.status().jobs[0].status,'uncertain');
  restarted.submit(fixture());assert.equal(calls,1);
});
test('bad ledger fails closed',()=>{
  const directory=fs.mkdtempSync(path.join(os.tmpdir(),'yp-render-lab-corrupt-'));fs.writeFileSync(path.join(directory,'ledger.json'),'broken');
  assert.throws(()=>createLab({directory}));
});
