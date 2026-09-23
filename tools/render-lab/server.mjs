import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {randomBytes} from 'node:crypto';
import {createLab} from './core.mjs';

const here=path.dirname(fileURLToPath(import.meta.url)), root=path.resolve(here,'../..');
const port=4174, host=`127.0.0.1:${port}`, origin=`http://${host}`;
const directory=path.join(root,'.render-lab.local'), token=randomBytes(32).toString('hex');
let lab;
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml','.glb':'model/gltf-binary','.woff2':'font/woff2'};
function send(res,code,value){res.writeHead(code,{'Content-Type':'application/json; charset=utf-8'});res.end(JSON.stringify(value));}
function serve(res,base,relative){
  const baseReal=fs.realpathSync(base), file=fs.realpathSync(path.resolve(base,relative));
  if(!file.startsWith(baseReal+path.sep)||!fs.statSync(file).isFile())throw Error('NOT_FOUND');
  res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream'});
  const stream=fs.createReadStream(file);stream.on('error',()=>res.destroy());stream.pipe(res);
}
const server=http.createServer(async(req,res)=>{
  res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('X-Frame-Options','SAMEORIGIN');
  if(req.headers.host!==host || (req.headers.origin&&req.headers.origin!==origin) || req.headers['sec-fetch-site']==='cross-site')return send(res,403,{error:'LOCAL_ORIGIN_ONLY'});
  try{
    const url=new URL(req.url,origin), pathname=decodeURIComponent(url.pathname);
    if(req.method==='GET'&&pathname==='/api/status')return send(res,200,{...lab.status(),token});
    if(req.method==='POST'&&pathname==='/api/render'){
      if(req.headers.origin!==origin||req.headers['x-lab-token']!==token||req.headers['content-type']!=='application/json')return send(res,403,{error:'REQUEST_NOT_AUTHORIZED'});
      if(!lab.status().enabled)return send(res,403,{error:'PAID_RENDER_LOCKED'});
      let size=0;const chunks=[];
      for await(const chunk of req){size+=chunk.length;if(size>5700000)return send(res,413,{error:'BODY_TOO_LARGE'});chunks.push(chunk);}
      return send(res,202,lab.submit(JSON.parse(Buffer.concat(chunks).toString('utf8'))));
    }
    if(req.method!=='GET')return send(res,405,{error:'METHOD_NOT_ALLOWED'});
    if(pathname.startsWith('/api/results/')){
      const id=pathname.slice('/api/results/'.length);
      if(!lab.status().jobs.some(j=>j.id===id&&j.status==='complete'))return send(res,404,{error:'NOT_FOUND'});
      return serve(res,directory,id+'.png');
    }
    if(pathname==='/'||pathname==='/client.js')return serve(res,here,pathname==='/'?'index.html':'client.js');
    if(pathname.startsWith('/yp-web-ai/'))return serve(res,path.join(root,'public/yp-web-ai'),pathname.slice('/yp-web-ai/'.length));
    send(res,404,{error:'NOT_FOUND'});
  }catch(error){send(res,400,{error:/^[A-Z_0-9]+$/.test(error.message)?error.message:'REQUEST_FAILED'});}
});
server.requestTimeout=300000;
// Acquire the port before reading/writing the ledger: a second launch must not
// mark another process's in-flight job interrupted before failing EADDRINUSE.
server.listen(port,'127.0.0.1',()=>{
  lab=createLab({directory,key:process.env.OPENAI_API_KEY,approved:process.env.YP_RENDER_PAID_APPROVED==='YES'});
  console.log(`Render lab ${origin} — ${lab.status().enabled?'PAID TEST ENABLED':'LOCKED: preparation only, no paid requests'}`);
});
