import test from 'node:test';
import assert from 'node:assert/strict';
await import('../../public/yp-web-ai/js/template-branding.js');
test('explicit logo positions include standalone text placeholders, not composite media',()=>{
 for(const source of [{brandLogo:true},{waveArtwork:'logo'},...['header','counter','six-blue-brand','six-blue-name','six-information','six-handa','six-handa-dark','six-website','six-mobile-label','six-store'].map(graphic=>({graphic}))])assert.equal(YPTemplateBranding.isLogoSource(source),true,JSON.stringify(source));
 for(const source of [null,{},...['six-technology','six-gold','six-digital','six-mobile','six-inventors','six-product','six-devices','botanical-wide','botanical-portrait','poster','screen','aqua-screen','beauty-pink'].map(graphic=>({graphic})),{waveArtwork:'screen'},{waveArtwork:'info'}])assert.equal(YPTemplateBranding.isLogoSource(source),false,JSON.stringify(source));
});
