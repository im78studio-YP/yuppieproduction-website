(function(global){
  'use strict';
  function create(THREE,onView){
    const root=document.createElement('div');root.className='viewport-gizmo';
    root.setAttribute('role','group');root.setAttribute('aria-label','ทิศทางและมุมมองบูธ');
    const dial=document.createElement('div');dial.className='viewport-gizmo-dial';
    const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
    svg.setAttribute('viewBox','0 0 120 120');svg.setAttribute('aria-hidden','true');dial.append(svg);
    // Match Fine Position's Z-up labels; persisted Three.js coordinates stay Y-up.
    const axes=[
      ['X',[1,0,0],'#ed6478','orthographic_right','ด้านขวา'],
      ['−X',[-1,0,0],'#ed6478','orthographic_left','ด้านซ้าย'],
      ['Y',[0,0,1],'#82cf55','orthographic_front','ด้านหน้า'],
      ['−Y',[0,0,-1],'#82cf55','orthographic_rear','ด้านหลัง'],
      ['Z',[0,1,0],'#68a7ff','orthographic_top','ด้านบน'],
      ['−Z',[0,-1,0],'#68a7ff',null,'ด้านล่าง']
    ].map(([label,vector,color,view,name])=>{
      const line=document.createElementNS(svg.namespaceURI,'line');line.setAttribute('x1','60');line.setAttribute('y1','60');line.setAttribute('stroke',color);svg.append(line);
      const node=document.createElement(view?'button':'span');node.className='viewport-gizmo-axis';node.textContent=label;
      node.style.setProperty('--axis-color',color);node.title=view?'มุมมอง'+name:name+' (แสดงทิศทาง)';
      if(view){node.type='button';node.dataset.view=view;node.setAttribute('aria-label','มุมมอง'+name);node.onclick=()=>onView(view);}
      else{node.classList.add('is-reference');node.setAttribute('aria-hidden','true');}
      dial.append(node);return {vector:new THREE.Vector3(...vector),line,node,view};
    });
    const reset=document.createElement('button');reset.type='button';reset.className='viewport-gizmo-reset';reset.textContent='↗ Perspective';reset.title='กลับมุมมอง Perspective';reset.setAttribute('aria-label',reset.title);reset.onclick=()=>onView('perspective');
    root.append(dial,reset);
    for(const type of ['pointerdown','dblclick','keydown'])root.addEventListener(type,e=>e.stopPropagation());
    const inverse=new THREE.Quaternion(),point=new THREE.Vector3();let signature='';
    function update(camera,currentView){
      const next=camera.quaternion.toArray().join(',')+'|'+currentView;if(next===signature)return;signature=next;
      inverse.copy(camera.quaternion).invert();
      for(const axis of axes){
        point.copy(axis.vector).applyQuaternion(inverse);
        const x=60+point.x*40,y=60-point.y*40;
        axis.node.style.left=(x/120*100)+'%';axis.node.style.top=(y/120*100)+'%';
        axis.node.style.zIndex=String(10+Math.round((point.z+1)*10));
        axis.node.classList.toggle('is-back',point.z<-.01);
        if(axis.view)axis.node.setAttribute('aria-pressed',String(currentView===axis.view));
        axis.line.setAttribute('x2',x.toFixed(3));axis.line.setAttribute('y2',y.toFixed(3));axis.line.style.opacity=point.z<-.01?'.35':'.8';
      }
      reset.setAttribute('aria-pressed',String(currentView==='perspective'));
    }
    return {element:root,update,dispose(){root.remove();}};
  }
  global.YPViewportGizmo={create};
})(globalThis);
