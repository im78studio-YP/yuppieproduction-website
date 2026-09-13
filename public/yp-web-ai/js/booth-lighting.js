(function(global){
  'use strict';
  const materialBases=new WeakMap();
  // Presentation controls are separate from the legacy fixture inventory/BOQ.
  // Never regenerate, delete, move or approve fixtures when changing these values.
  function settings(spec={}){
    const state=spec.lighting||{},saved=state.boothControl;
    if(saved?.version===1)return{version:1,enabled:saved.enabled!==false,tone:saved.tone==='warm'?'warm':'white'};
    const fixtures=[...(state.approvedFixtures||[]),...(state.suggestions||[])];
    const warmTemplate=(spec.objects||[]).some(o=>/^(soft-wave-|botanical-|timber-|beauty-|yellow-)/.test(o.structure?.design||''));
    const manual=state.mode==='manual'||!spec.lighting;
    return{version:1,enabled:manual?spec.lights!==false:state.enabled!==false,
      tone:manual?(spec.lightCol==='warm'?'warm':'white'):(fixtures.length?Number(state.temperatureK)<3500:warmTemplate)?'warm':'white'};
  }
  function summary(spec){const s=settings(spec);return(s.enabled?'เปิด':'ปิด')+' · '+(s.tone==='warm'?'แสงวอร์ม':'แสงขาว');}
  function promptLines(spec){const s=settings(spec);return[
    'BOOTH LIGHTING — '+summary(spec),
    s.enabled?'Show soft translucent light cones and surface illumination; use '+(s.tone==='warm'?'warm white (3000K)':'white (5000K)')+' for general light beams and white LED strips.':'Switch off booth light emission and all light cones, including integrated LED strips.',
    'Hide lamp housings (Arm Light, Clear Light, Downlight); show light only. Follow the template beam positions and directions in the reference. Keep supporting beams, ceiling, tracks and walls unchanged. Keep LED strips as continuous strip lighting, never convert them into cones. Keep brand-coloured decorative lights in their original hue; do not recolour screens, logos or artwork. Keep neutral studio/hall illumination so the booth remains readable. Hidden fixture inventory is retained, not a request to alter the BOQ.'
  ];}
  function tintable(color){
    if(!color?.getHSL)return true;
    const hsl=color.getHSL({});
    // Neutral/cool white and warm white may change; saturated cyan, pink, etc. stay branded.
    return hsl.s<.28||(hsl.h>=.055&&hsl.h<=.19);
  }
  function markEmitter(mesh){
    if(!mesh?.isMesh)return mesh;
    const materials=Array.isArray(mesh.material)?mesh.material:[mesh.material];
    if(materials.some(m=>m?.emissive?.getHex()&&m.emissiveIntensity>0&&!m.map&&!m.emissiveMap))
      mesh.userData.boothEmitter=true;
    return mesh;
  }
  function apply(renderer,spec){
    const root=renderer.boothGroup,T=renderer.THREE,s=settings(spec),tone=s.tone==='warm'?'#ffe1b3':'#f2f6ff';
    if(!root||!T)return;
    global.YPBoothBeams?.prepare(renderer,spec);
    // Applied only inside the booth, never to the studio key/fill/rim/background.
    let sourceCount=0;
    root.traverse(node=>{
      if(node.userData.boothBeamVisual){node.visible=s.enabled;node.material.uniforms.beamColor.value.set(tone);return;}
      if(node.isLight){
        sourceCount++;
        const base=node.userData.boothLightBase||(node.userData.boothLightBase={intensity:node.intensity,color:node.color.clone(),tintable:tintable(node.color)});
        node.intensity=s.enabled&&!node.userData.beamSuperseded?base.intensity:0;
        node.color.copy(base.color);if(base.tintable)node.color.set(tone);
        return;
      }
      if(!node.isMesh||!node.material)return;
      let lamp=node.userData.boothEmitter===true,ancestor=node;
      // Imported lamp lenses belong to fixtures, not arbitrary emissive GLB assets/screens.
      while(ancestor&&ancestor!==root){lamp||=/^(auto-light-visual-|spotlight-model|spotlight-fixture|downlight-model)/.test(ancestor.name||'');ancestor=ancestor.parent;}
      if(!lamp)return;
      const convert=material=>{
        let base=materialBases.get(material),next=material;
        if(!base){
          if(!material?.emissive?.getHex()||!material.emissiveIntensity||material.map||material.emissiveMap)return material;
          base={intensity:material.emissiveIntensity,emissive:material.emissive.clone(),color:material.color?.clone(),tintable:tintable(material.emissive)};
          next=material.clone();materialBases.set(next,base);
          next.userData={...next.userData,boothLightManaged:true};
        }
        next.emissiveIntensity=s.enabled?base.intensity:0;next.emissive.copy(base.emissive);
        if(base.color)next.color.copy(base.color);
        if(base.tintable){next.emissive.set(tone);if(next.color)next.color.set(s.enabled?tone:'#deded9');}
        return next;
      };
      node.material=Array.isArray(node.material)?node.material.map(convert):convert(node.material);
    });
    // Templates with only luminous surfaces, or an empty booth, still get a small
    // lighting-only preview wash. These are not physical fixtures or billable assets.
    if(!sourceCount&&!global.YPBoothBeams){
      const W=Number(spec.W)||6,D=Number(spec.D)||3,H=Number(spec.H)||2.4;
      for(const x of [W*.28,W*.72]){
        const light=new T.PointLight(tone,s.enabled?8:0,Math.max(W,D,H)*2,1.5);
        light.name='booth-light-preview-wash';light.userData.previewOnly=true;
        light.position.set(x,H*.86+(Number(spec.raise)||0)/100,D*.48);root.add(light);
      }
    }
    root.userData.boothLighting={...s};
  }
  global.YPBoothLighting={settings,summary,promptLines,markEmitter,apply,tintable};
})(globalThis);
