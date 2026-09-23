// Run only against the locked local lab. These probes never contact OpenAI.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
const base='http://127.0.0.1:4174';
test('local lab serves editor and client but not repository files',async()=>{
  assert.equal((await fetch(base+'/')).status,200);
  const client=await fetch(base+'/client.js');assert.match(client.headers.get('content-type'),/javascript/);
  assert.equal((await fetch(base+'/yp-web-ai/index.html?comparePreview=1')).status,200);
  for(const url of ['/package.json','/.env','/tools/render-lab/core.mjs','/yp-web-ai/%2e%2e%2f%2e%2e%2fpackage.json']){
    const response=await fetch(base+url);assert(response.status>=400,url);
  }
});
test('rejects foreign origins and DNS rebinding Host',async()=>{
  assert.equal((await fetch(base+'/api/status',{headers:{Origin:'https://example.com'}})).status,403);
  // Fetch normalizes Host; use an HTTP request to test the actual wire header.
  const status=await new Promise((resolve,reject)=>{
    http.get(base+'/api/status',{headers:{Host:'attacker.example:4174'}},response=>{response.resume();resolve(response.statusCode);}).on('error',reject);
  });
  assert.equal(status,403);
});
test('locked render endpoint does not create jobs, even with valid CSRF header',async()=>{
  const before=await (await fetch(base+'/api/status')).json();
  assert.equal(before.enabled,false,'Only run this smoke test against preparation mode');
  const unauthorized=await fetch(base+'/api/render',{method:'POST',headers:{Origin:base,'Content-Type':'application/json'},body:'{}'});
  assert.equal(unauthorized.status,403);
  const locked=await fetch(base+'/api/render',{method:'POST',headers:{Origin:base,'Content-Type':'application/json','X-Lab-Token':before.token},body:'{}'});
  assert.equal(locked.status,403);assert.equal((await locked.json()).error,'PAID_RENDER_LOCKED');
  const after=await (await fetch(base+'/api/status')).json();assert.deepEqual(after.jobs,before.jobs);assert.equal(after.remaining,before.remaining);
});
