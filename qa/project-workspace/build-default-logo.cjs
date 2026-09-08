// Bundle the supplied vector unchanged so file:// and portable projects need no fetch.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const source=process.argv[2];if(!source)throw new Error('Pass the approved source SVG path');
const bytes=fs.readFileSync(source),svg=bytes.toString('utf8');
if(/<(?:script|foreignObject|image|use|animate|set)\b|\bon\w+\s*=|(?:href\s*=|url\s*\()/i.test(svg))throw new Error('Unexpected active or external SVG content');
const box=svg.match(/viewBox="([\d.]+) ([\d.]+) ([\d.]+) ([\d.]+)"/);if(!box)throw new Error('No viewBox');
const output=path.resolve('public/yp-web-ai/assets/branding');fs.mkdirSync(output,{recursive:true});
const hash=data=>crypto.createHash('md5').update(data).digest('hex');
function staged(file,data){const temp=file+'.tmp';fs.writeFileSync(temp,data);if(hash(fs.readFileSync(temp))!==hash(data))throw new Error('Checksum mismatch');fs.renameSync(temp,file);}
staged(path.join(output,'YP_LOGO.svg'),bytes);
const data={data:'data:image/svg+xml;base64,'+bytes.toString('base64'),aspect:Number(box[3])/Number(box[4]),color:'#ee3c96',name:'YP_LOGO.svg',brand:'YUPPIE Production'};
staged(path.join(output,'default-logo.js'),'/* Generated from YP_LOGO.svg; do not edit the vector bundle by hand. */\nglobalThis.YPDefaultLogo=Object.freeze('+JSON.stringify(data)+');\n');
console.log('Bundled SVG unchanged:',bytes.length,'bytes, MD5',hash(bytes));
