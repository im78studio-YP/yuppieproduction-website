(function(root){
 'use strict';
 function database(){return new Promise((resolve,reject)=>{const r=indexedDB.open('yp-personal-templates-v1',1);r.onupgradeneeded=()=>r.result.createObjectStore('templates',{keyPath:'id'});r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);r.onblocked=()=>reject(Error('คลังเทมเพลตถูกเปิดค้างในแท็บเก่า'));});}
 async function access(mode,value){const db=await database();return new Promise((resolve,reject)=>{const tx=db.transaction('templates',mode==='list'?'readonly':'readwrite'),s=tx.objectStore('templates'),r=mode==='list'?s.getAll():s.put(value);tx.oncomplete=()=>{db.close();resolve(r.result);};tx.onerror=tx.onabort=()=>{db.close();reject(tx.error||Error('บันทึกคลังไม่สำเร็จ'));};});}
 async function save(name,snapshot){name=String(name).trim();if(!name||name.length>80)throw Error('ตั้งชื่อเทมเพลต 1–80 ตัวอักษร');const value=structuredClone(snapshot);YPProjectStore.validate(YPProjectStore.create(value,name));const record={id:'personal-'+crypto.randomUUID(),name,snapshot:value,createdAt:new Date().toISOString()};await access('save',record);return record;}
 root.YPTemplateMixerLibrary={list:()=>access('list'),save};
})(globalThis);
