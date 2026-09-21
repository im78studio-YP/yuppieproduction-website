// Package the exact approved artwork; no resizing or changes to the source PNG.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const source=path.resolve(__dirname,'../../../AW/ChatGPT Image Sep 10, 2026, 12_32_31 PM.png');
const target=path.resolve(__dirname,'../../public/yp-web-ai/assets/branding/photo-backdrop-artwork.js');
const bytes=fs.readFileSync(source);
const content='/* Generated from approved Yuppie backdrop PNG; run build-photo-backdrop-artwork.cjs. */\n'+
 'globalThis.YPPhotoBackdropArtwork=Object.freeze('+JSON.stringify({name:path.basename(source),data:'data:image/png;base64,'+bytes.toString('base64'),aspect:2043/770,sourceMD5:crypto.createHash('md5').update(bytes).digest('hex')})+');\n';
const tmp=target+'.tmp';fs.writeFileSync(tmp,content);if(fs.readFileSync(tmp,'utf8')!==content)throw Error('Verification failed');fs.renameSync(tmp,target);console.log('Packaged approved backdrop artwork');
