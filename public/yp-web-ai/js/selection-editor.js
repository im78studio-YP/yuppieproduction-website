(function(root){
 'use strict';
 // Resolve from explicit scene identity/role, never a display name or image content.
 function resolve(items,{isLogo=()=>false}={}){
  if(!items.length)return null;
  if(items.length>1)return {page:'catalog',tab:'editor',kind:'multi'};
  const item=items[0],id=item.id;
  if(id==='branding.logo.main'||isLogo(item.object))return {page:'signage',kind:'logo'};
  if(item.object)return {page:'catalog',tab:'editor',kind:'asset'};
  const face=id.match(/^(?:structure\.wall\.|branding\.graphic\.wall\.)(back|left|right)$/)?.[1];
  if(face)return {page:'finish',tab:'wall',face,kind:'wall'};
  if(['structure.floor.main','branding.graphic.floor'].includes(id))return {page:'finish',tab:'floor',kind:'floor'};
  if(['structure.room.main','structure.door.main'].includes(id))return {page:'storage',kind:'room'};
  if(item.lightingFixtureId||id==='lighting.fixture.manual')return {page:'lighting',fixtureId:item.lightingFixtureId,kind:'light'};
  if(id==='equipment.platform.photo360')return {page:'booth',kind:'booth'};
  return {page:'catalog',tab:'editor',kind:'system'};
 }
 root.YPSelectionEditor={resolve};
})(globalThis);
