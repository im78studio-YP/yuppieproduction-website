import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,'../..');
const html=fs.readFileSync(path.join(root,'public/lightbox_maker/YP-Lightbox-Studio.html'),'utf8');

test('ปิดช่องโปร่งภายในโลโก้เป็นค่าเริ่มต้นและยังเก็บค่าแยกจากข้อความ',()=>{
  assert.match(html,/shape:\{ mode:'contour', fillHoles:true, fillHolesImage:true \}/);
  assert.match(html,/return S\.src\.mode==='image' \? !!S\.shape\.fillHolesImage : !!S\.shape\.fillHoles;/);
  assert.match(html,/if\(S\.src\.mode==='image'\) S\.shape\.fillHolesImage=!!v;/);
  assert.match(html,/if\(unit\) unit\.textContent=image \? 'ปิดช่องโปร่งภายในโลโก้'/);
});
