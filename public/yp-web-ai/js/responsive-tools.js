(function(){
  'use strict';
  const toolbar=document.getElementById('objectToolbar');if(!toolbar)return;
  const workspace=document.getElementById('workspace');
  const sync=()=>{
    const covered=matchMedia('(max-width:1100px)').matches&&!workspace.classList.contains('dock-collapsed');
    toolbar.classList.toggle('covered-by-panel',covered);
  };
  new MutationObserver(sync).observe(workspace,{attributes:true,attributeFilter:['class']});
  window.addEventListener('yp:asset-editor-sync',sync);window.addEventListener('resize',sync);sync();
  // Match panel offsets to the actual header, including wrapping and device rotation.
  const header=document.querySelector('header');
  const syncHeader=()=>{const height=Math.ceil(header.getBoundingClientRect().height);document.documentElement.style.setProperty('--header-h',height+'px');};
  new ResizeObserver(syncHeader).observe(header);syncHeader();
})();
