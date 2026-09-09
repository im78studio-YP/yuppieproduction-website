(function(root){
  'use strict';
  // Authored pairs only: never infer a TV from colour or accidentally group a wall.
  const pairs={
    'penin-adventure':[[4,5],[6,7]],'penin-connect':[[4,5]],
    'penin-aqua-curve':[[5,6],[18,19],[29,30]],'penin-timber-noir':[[17,18]],
    'penin-blue-axis':[[7,8]],'corner-timber-lounge':[[24,25]]
  };
  function apply(spec){
    const id=spec.boothTemplate?.id,version=id+':1';
    if(!pairs[id]||spec.templateTVGroupsVersion===version)return spec;
    for(const [frameIndex,screenIndex] of pairs[id]){
      const frame=spec.objects?.find(o=>o.id===id+'-'+frameIndex),screen=spec.objects?.find(o=>o.id===id+'-'+screenIndex);
      if(!frame||!screen||frame.catalogId!=='panel-standard'||screen.catalogId!=='panel-standard')continue;
      // Respect groups the user has already created; do not merge separate groups.
      if(frame.groupId||screen.groupId)continue;
      frame.groupId=screen.groupId='tv-'+id+'-'+frameIndex;
    }
    // One-time migration also honours an intentional Ungroup after saving/reopening.
    spec.templateTVGroupsVersion=version;return spec;
  }
  root.YPTemplateTVGroups={apply,pairs};
})(globalThis);
