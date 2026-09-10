// Package original generated artwork unchanged so saved booth files are portable.
const fs=require('node:fs'),crypto=require('node:crypto');
const images=Object.fromEntries(['wide','portrait'].map(k=>[k,'data:image/png;base64,'+fs.readFileSync('public/yp-web-ai/assets/botanical/skincare-'+k+'.png').toString('base64')]));
const path='public/yp-web-ai/js/botanical-images.js',data='globalThis.YPBotanicalImages='+JSON.stringify(images)+';\n',tmp=path+'.tmp';
fs.writeFileSync(tmp,data);const hash=s=>crypto.createHash('md5').update(s).digest('hex');if(hash(fs.readFileSync(tmp))!==hash(data))throw Error('Asset verification failed');fs.renameSync(tmp,path);
