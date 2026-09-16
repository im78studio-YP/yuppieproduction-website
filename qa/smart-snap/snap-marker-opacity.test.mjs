import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const html=readFileSync(new URL('../../public/yp-web-ai/index.html',import.meta.url),'utf8');

test('Snapped move handle is 30% transparent and restores its idle appearance',()=>{
  const body=html.split("  styleAnchorMarker(marker,state='idle'){")[1].split('\n  updateAnchorMarkerScreenSize(')[0];
  const style=new Function('marker','state',body.slice(0,body.lastIndexOf('}')));
  const marker={material:{color:{setHex(value){this.value=value;}}},scale:{setScalar(value){this.value=value;}},userData:{anchorBaseColor:0xf0b53a,anchorBaseOpacity:.96}};
  const renderer={updateAnchorMarkerScreenSize(){}};
  style.call(renderer,marker,'snapped');
  assert.equal(marker.material.opacity,.7);
  assert.equal(marker.material.color.value,0x24d26f);
  assert.equal(marker.scale.value,undefined,'state changes must not enlarge the marker');
  style.call(renderer,marker,'idle');
  assert.equal(marker.material.opacity,.96);
  assert.equal(marker.material.color.value,0xf0b53a);
  assert.equal(marker.scale.value,undefined);
});

test('Move and snap markers stay 10 CSS pixels across zoom/depth; duplicate target is hidden',()=>{
  const body=html.split('  updateAnchorMarkerScreenSize(){')[1].split('\n  setHoveredAnchorMarker(')[0];
  const update=new Function(body.slice(0,body.lastIndexOf('}')));
  class Vector3 { applyMatrix4(){return this;} }
  const marker={geometry:{parameters:{radius:.065}},userData:{anchorVisualState:'snapped'},
    getWorldPosition(v){v.z=-this.depth;return v;},parent:{getWorldScale(v){v.x=v.y=v.z=1;return v;}},
    scale:{set(x,y,z){this.x=x;this.y=y;this.z=z;}}};
  const preview={...marker,scale:{...marker.scale}};
  const camera={updateMatrixWorld(){},projectionMatrix:{elements:Array(16).fill(0)}};
  const renderer={THREE:{Vector3},camera,renderer:{domElement:{clientHeight:800}},activeAnchorMarker:marker,
    anchorGuideGroup:{children:[marker]},snapPreviewGroup:{getObjectByName(){return preview;}}};
  for(const orthographic of [false,true])for(const depth of [.2,2,20])for(const projectionScale of [1,2,4]){
    marker.depth=preview.depth=depth;camera.isOrthographicCamera=orthographic;camera.projectionMatrix.elements[5]=projectionScale;
    update.call(renderer);
    const pixels=2*marker.geometry.parameters.radius*marker.scale.x*projectionScale*800/(2*(orthographic?1:depth));
    assert.ok(Math.abs(pixels-10)<1e-9);
    assert.equal(preview.visible,false);
  }
  marker.userData.anchorVisualState='active';update.call(renderer);assert.equal(preview.visible,true);
  assert.match(html,/hitRadius=event.pointerType==='touch'\?28:22/,'keep generous pointer hit area');
});

test('Snap preview is translucent without writing depth over the target',()=>{
  const preview=html.split('  showMagneticSnapPreview(match){')[1].split('\n  logoPoint(')[0];
  assert.match(preview,/opacity:valid \? \.7 : \.9,depthTest:false,depthWrite:false/);
});
