(function(root){
 'use strict';
 const values=[0,.5,1];
 function get(obj){const a=obj?.transform?.resizeAnchor;return{x:values.includes(a?.x)?a.x:.5,y:values.includes(a?.y)?a.y:0,z:values.includes(a?.z)?a.z:.5};}
 // Reference frame: authored dimensions before rotation/flip, centered in X/Z
 // with Y at the base. This is independent of the camera and decorative meshes.
 function local(T,obj){const a=get(obj);return new T.Vector3((a.x-.5)*obj.size.w,a.y*obj.size.h,(a.z-.5)*obj.size.d);}
 function point(renderer,obj){const frame=new renderer.THREE.Object3D();renderer.applyCatalogObjectTransform(frame,obj,0);frame.updateMatrix();return local(renderer.THREE,obj).applyMatrix4(frame.matrix);}
 function preserve(renderer,before,after){if(!renderer)return;const delta=point(renderer,before).sub(point(renderer,after));after.position={x:Number(after.position.x)+delta.x,y:Number(after.position.y)+delta.y,z:Number(after.position.z)+delta.z};}
 function set(obj,a){if(!obj||!['x','y','z'].every(k=>values.includes(a[k])))return false;obj.transform={...(obj.transform||{}),resizeAnchor:{...a}};return true;}
 root.YPResizeAnchor={get,local,point,preserve,set};
})(globalThis);
