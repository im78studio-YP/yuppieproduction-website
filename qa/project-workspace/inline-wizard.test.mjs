import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
await import('../../public/yp-web-ai/assets/branding/default-logo.js');
await import('../../public/yp-web-ai/js/inline-templates.js');
const html=await readFile(new URL('../../public/yp-web-ai/index.html',import.meta.url),'utf8');
test('default vector bundle matches the supplied SVG byte for byte',async()=>{
  const bytes=await readFile(new URL('../../public/yp-web-ai/assets/branding/YP_LOGO.svg',import.meta.url));
  assert.deepEqual(Buffer.from(YPDefaultLogo.data.split(',')[1],'base64'),bytes);
  assert.equal(YPDefaultLogo.color,'#ee3c96');assert.ok(YPDefaultLogo.aspect>3.9&&YPDefaultLogo.aspect<4);
});
test('template honors the default logo, aspect, and brand color',()=>{
  const catalog=Function('furnitureItem','return '+html.match(/const OBJECT_CATALOG=(\[[\s\S]*?\]);/)[1])(item=>item);
  const initial={logo:YPDefaultLogo.data,logoAR:YPDefaultLogo.aspect,logoColor:YPDefaultLogo.color,brand:YPDefaultLogo.brand};
  for(const t of YPInlineTemplates.templates){const s=YPInlineTemplates.build(t.id,initial,catalog).spec;assert.equal(s.logo,initial.logo);assert.equal(s.logoAR,initial.logoAR);assert.equal(s.logoColor,initial.logoColor);assert.equal(s.logoScale,35);assert.equal(s.nameScale,0);}
});
test('image export includes logo loads and refuses unresolved logo placeholders',()=>{
  assert.ok(html.includes('this.brandImageLoads.forEach(promise=>promises.push(promise))'));
  assert.ok(html.includes('if(spec.logo&&!this.brandImages.has(spec.logo))throw'));
  assert.ok(html.includes('const raster=image._ypRasterSource||image'));
});
test('nullable legacy logo fields remain supported',()=>assert.ok(html.includes("['logo','logoAcc','logoHasTransparency'].includes(key)")));
test('wizard template completion bypasses a second starter prompt',async()=>{
  const ui=await readFile(new URL('../../public/yp-web-ai/js/starter-layout-ui.js',import.meta.url),'utf8');
  assert.ok(ui.includes('if(!event.detail?.templateId)open()'));
  assert.ok(html.includes("new CustomEvent('yp:quick-setup-complete',{detail:{templateId}})"));
});
