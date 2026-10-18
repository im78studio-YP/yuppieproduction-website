const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const html = fs.readFileSync(path.join(__dirname, '../public/lightbox_maker/YP-Lightbox-Studio.html'), 'utf8');
const source = html.match(/<script>([\s\S]*?)<\/script>/)[1];

function studio(w = 300, h = 250, options = {}) {
  const nodes = new Map();
  const context = vm.createContext({ console, TextEncoder, Blob, setTimeout, clearTimeout,
    document: { readyState: 'loading', addEventListener() {}, querySelector(selector) {
      if (!nodes.has(selector)) nodes.set(selector, { textContent: '', classList: { toggle() {}, add() {}, remove() {} } });
      return nodes.get(selector);
    } }, window: {} });
  vm.runInContext(source + `
    globalThis.api={
      configure(w,h,options){ S=defaults(); Object.assign(S.exp,options); PB={w,h,empty:false}; },
      plan:printPlan, clip:clipPrintGroups, area:loopArea, pack:platePack, matrix:partMatrix,
      rebuildOnPrinter(w,h){S.exp.bed=w;S.exp.bedH=h;return buildParts(false);},
      selectPrinter(key){applyPrinter(key);return printPlan();},
      rebuildSelectedPrinter(key){applyPrinter(key);return buildParts(false);},
      backing(){S.backing.enabled=true;return buildParts(false);},
      grid(){return previewGridSpec('plate',{mn:[0,0,0],mx:[1,1,1],c:[0,0,0]},100,true);},
      groups:printGroups, model:make3mf, stl:stlOf, merge:mergeForSTL, support:splitSupportFiles,
      issues:exportMeshIssues,
      async exportScene(fmt,margin){
        S.exp.fmt=fmt;if(margin!==undefined) S.exp.margin=margin;
        const downloads=[],messages=[];
        buildGrid=()=>G;updateBadges=()=>{};runChecks=()=>{};
        const toastNode=$('#toast');Object.defineProperty(toastNode,'textContent',{set(value){messages.push(value);}});
        download=(blob,name)=>downloads.push({blob,name});
        await doExport();clearTimeout(toastNode._h);return {downloads,messages};
      },
      extrude(groups,back=false){
        const plan=printPlan(), M=Mesh('test','#ffffff');
        M.noMirrorX=back; M.module=back?'back':'front'; M.kind=back?'back':'color';
        ACTIVE_PRINT_PLAN=plan.enabled&&plan.tiles.length>1?plan:null;
        try{ addPrism(M,groups,0,2); return finishPrintParts([M],plan); }
        finally{ ACTIVE_PRINT_PLAN=null; }
      },
      synthetic(smooth=true,mode='service',autoSplit=true,joint='butt',dimensions={width:118,height:108}){
        S=defaults();S.exp={...S.exp,bed:80,bedH:90,margin:10,res:1,smooth,autoSplit};
        const gw=dimensions.width+6,gh=dimensions.height+6;
        S.box.W=gw;S.box.H=gh;S.box.depth=20;S.hw.joint=joint;S.hw.hole='none';S.build.mode=mode;
        if(dimensions.printer) applyPrinter(dimensions.printer);
        const panel=new Uint8Array(gw*gh),owner=new Uint8Array(gw*gh).fill(255);
        for(let y=3;y<gh-3;y++)for(let x=3;x<gw-3;x++){panel[y*gw+x]=1;owner[y*gw+x]=1;}
        G={gw,gh,px:1,panel,owner,K:1,empty:false,edtIn:edtToOutside(panel,gw,gh),comp:components(panel,gw,gh)};
        computeAreas();PB=panelBounds();return buildParts(false);
      }
    };`, context);
  context.api.configure(w, h, { bed: 180, bedH: 180, margin: 10, ...options });
  return context.api;
}

const rectangle = (w, h) => [{ out: [[0, 0], [w, 0], [w, h], [0, h]], holes: [] }];
const area = (app, groups) => groups.reduce((a, g) => a + Math.abs(app.area(g.out)) - g.holes.reduce((s, h) => s + Math.abs(app.area(h)), 0), 0);
const near = (a, b, eps = 1e-5) => assert.ok(Math.abs(a - b) <= eps, `${a} != ${b}`);
const plain = value => JSON.parse(JSON.stringify(value));

function assertClosed(mesh) {
  const edges = new Map();
  const key = p => p.map(v => Math.round(v * 1e5)).join(',');
  for (let i = 0; i < mesh.n; i += 12) {
    const p = [0, 1, 2].map(k => key(Array.from(mesh.a.subarray(i + 3 + 3 * k, i + 6 + 3 * k))));
    for (let k = 0; k < 3; k++) {
      const a = p[k], b = p[(k + 1) % 3], edge = a < b ? `${a}|${b}` : `${b}|${a}`;
      const n = edges.get(edge) || [0, 0]; n[0]++; n[1] += a < b ? 1 : -1; edges.set(edge, n);
    }
  }
  for (const [edge, [count, balance]] of edges) {
    assert.equal(count, 2, `Unclosed edge: ${edge}`);
    assert.equal(balance, 0, `Misoriented edge: ${edge}`);
  }
}

function unzipStored(buffer) {
  const bytes = Buffer.from(buffer), files = new Map();
  let at = 0;
  while (at + 30 <= bytes.length && bytes.readUInt32LE(at) === 0x04034b50) {
    assert.equal(bytes.readUInt16LE(at + 8), 0);
    const n = bytes.readUInt32LE(at + 18), len = bytes.readUInt16LE(at + 26), extra = bytes.readUInt16LE(at + 28);
    const name = bytes.subarray(at + 30, at + 30 + len).toString('utf8');
    const start = at + 30 + len + extra;
    files.set(name, bytes.subarray(start, start + n)); at = start + n;
  }
  return files;
}

test('10 mm per side leaves 236 x 236 mm on a 256 mm bed', () => {
  const p = studio(500, 300, { bed: 256, bedH: 256 }).plan();
  assert.deepEqual([p.w, p.h, p.nx, p.ny], [236, 236, 3, 2]);
  for (const t of p.tiles) { assert.ok(t.x1 - t.x0 <= p.w); assert.ok(t.y1 - t.y0 <= p.h); }
});

test('custom clearance and rectangular printers use independent X/Y limits', () => {
  const p = studio(600, 400, { bed: 300, bedH: 200, margin: 15 }).plan();
  assert.deepEqual([p.w, p.h, p.nx, p.ny], [270, 170, 3, 3]);
  near(p.tiles.reduce((s, t) => s + (t.x1 - t.x0) * (t.y1 - t.y0), 0), 600 * 400);
});

test('exact usable dimensions and zero clearance do not create extra cuts', () => {
  for (const options of [{ margin: 10 }, { margin: 0, bed: 160, bedH: 160 }]) {
    assert.equal(studio(160, 160, options).plan().tiles.length, 1);
  }
});

test('invalid clearance and impractical tile counts fail explicitly', () => {
  assert.match(studio(300, 300, { margin: 90 }).plan().error, /ระยะเผื่อขอบ/);
  assert.match(studio(2000, 2000, { margin: 89 }).plan().error, /512/);
});

test('clipping preserves holes, concave outlines, and disconnected intersections', () => {
  const app = studio();
  const ring = [{ out: [[0, 0], [100, 0], [100, 100], [0, 100]], holes: [[[20, 20], [20, 80], [80, 80], [80, 20]]] }];
  near(area(app, app.clip(ring, { x0: 0, x1: 50, y0: 0, y1: 100 })), 3200);
  const contained = app.clip(ring, { x0: -1, x1: 101, y0: -1, y1: 101 });
  assert.equal(contained[0].holes.length, 1);
  near(area(app, contained), 6400);
  const u = [{ out: [[0, 0], [100, 0], [100, 100], [70, 100], [70, 30], [30, 30], [30, 100], [0, 100]], holes: [] }];
  const clipped = app.clip(u, { x0: 0, x1: 100, y0: 50, y1: 100 });
  assert.equal(clipped.length, 2);
  near(area(app, clipped), 3000);
});

test('split prisms conserve volume and produce closed meshes at every cut', () => {
  const app = studio();
  const parts = app.extrude(rectangle(300, 250));
  assert.equal(parts.length, 4);
  near(parts.reduce((s, p) => s + p.vol, 0), 300 * 250 * 2);
  for (const p of parts) { assertClosed(p); assert.ok(p.x1 <= 160); assert.ok(p.y1 <= 160); }
});

test('asymmetric front/back cuts agree after mirroring and assembly transforms', () => {
  const app = studio(300, 250);
  const outline = [[0, 0], [300, 0], [300, 170], [230, 170], [230, 250], [0, 250]];
  const front = app.extrude([{ out: outline.map(([x, y]) => [300 - x, y]).reverse(), holes: [] }]);
  const back = app.extrude([{ out: outline, holes: [] }], true);
  for (const f of front) {
    const b = back.find(p => p.tile.id === f.tile.id);
    const fm = app.matrix(f, 'asm'), bm = app.matrix(b, 'asm');
    const fx = [fm[0] * f.x0 + fm[12], fm[0] * f.x1 + fm[12]].sort((a, b) => a - b);
    const bx = [bm[0] * b.x0 + bm[12], bm[0] * b.x1 + bm[12]].sort((a, b) => a - b);
    near(fx[0], bx[0]); near(fx[1], bx[1]);
    near(fm[5] * f.y0 + fm[13], bm[5] * b.y0 + bm[13]);
  }
});

test('disabled splitting preserves whole geometry and existing placement', () => {
  const app = studio(300, 250, { autoSplit: false });
  const parts = app.extrude(rectangle(300, 250));
  assert.equal(parts.length, 1); assert.equal(parts[0].tile, undefined);
  near(parts[0].x1, 300); assert.equal(app.pack().plates, undefined);
});

test('small work stays geometrically unchanged and still receives a separate print plate', () => {
  const app = studio(100, 80), parts = app.extrude(rectangle(100, 80));
  assert.equal(parts.length, 1); assertClosed(parts[0]);
  near(parts[0].vol, 16000); assert.equal(app.groups(parts).length, 1);
  assert.ok(app.pack().plates.every(p => p.x - p.bx === 10 && p.y - p.by === 10));
});

test('actual buildParts splits front, frame and back on matching tile IDs', () => {
  for (const smooth of [true, false]) {
    const app = studio(), parts = app.synthetic(smooth);
    assert.ok(parts.length > 3);
    assert.equal(app.issues(parts).length, 0);
    for (const module of ['front', 'box', 'back']) {
      assert.deepEqual([...new Set(parts.filter(p => p.module === module).map(p => p.tile.id))].sort(), ['R1C1', 'R1C2', 'R2C1', 'R2C2']);
    }
    for (const p of parts) { assert.ok(p.x0 >= -0.001); assert.ok(p.y0 >= -0.001); assert.ok(p.x1 <= 60.001); assert.ok(p.y1 <= 70.001); }
    const pack = app.pack();
    assert.equal(pack.plates.length, 12);
    assert.ok(pack.plates.every(p => p.bx + 80 <= pack.maxX && p.by + 90 <= pack.maxY));
  }
});

test('shell splitting leaves acrylic/plaswood display sheets intact', () => {
  const app = studio(), parts = app.synthetic(true, 'shell');
  const display = parts.filter(p => p.display), printed = parts.filter(p => !p.display);
  assert.equal(display.length, 2); assert.ok(display.every(p => !p.tile));
  assert.equal(new Set(printed.map(p => p.tile.id)).size, 4);
  assert.equal(app.issues(printed).length, 0);
});

test('3MF places each multicolor tile inside the cleared bed and retains material grouping', async () => {
  const app = studio(), parts = app.synthetic();
  for (const g of app.groups(parts)) {
    const blob = await app.model(g.parts, g.key);
    const xml = unzipStored(await blob.arrayBuffer()).get('3D/3dmodel.model').toString('utf8');
    assert.equal([...xml.matchAll(/<item /g)].length, 1);
    assert.match(xml, /transform="1 0 0 0 1 0 0 0 1 10 10 0"/);
    assert.equal([...xml.matchAll(/<component /g)].length, g.parts.length);
    for (const m of xml.matchAll(/<vertex x="([^"]+)" y="([^"]+)" z="([^"]+)"/g)) {
      assert.ok(+m[1] >= -0.001 && +m[1] <= 60.001);
      assert.ok(+m[2] >= -0.001 && +m[2] <= 70.001);
    }
  }
});

test('STL groups and assembly manifest preserve tile identity and print origins', () => {
  const app = studio(), parts = app.synthetic();
  const manifest = JSON.parse(new TextDecoder().decode(app.support(parts, 'test')[0].data));
  assert.deepEqual(manifest.usable, [60, 70]); assert.equal(manifest.margin, 10);
  for (const g of app.groups(parts)) {
    const record = manifest.groups.find(r => r.file === `test_${g.module}_${g.tile.id}`);
    assert.ok(record); assert.deepEqual(record.printOrigin, plain(g.parts[0].offset));
    assert.equal(record.mirrorX, g.module !== 'back');
    const buffer = app.stl(app.merge(g.key, g.parts));
    const bytes = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
    assert.equal(bytes.getUint32(80, true), g.parts.reduce((n, p) => n + p.n / 12, 0));
  }
});

test('existing snap/screw hardware remains inside the same split front and back regions', () => {
  const app = studio(), parts = app.synthetic(true, 'service', true, 'snap');
  assert.equal(app.issues(parts).length, 0);
  assert.ok(parts.some(p => p.kind === 'back' && p.snapCount > 0));
  for (const p of parts) { assert.ok(p.x1 <= 60.001); assert.ok(p.y1 <= 70.001); }
});

test('irregular outlines crossing cut corners conserve area and close every exported prism', () => {
  const app = studio();
  for (let sample = 0; sample < 12; sample++) {
    const out = Array.from({ length: 18 }, (_, i) => {
      const angle = 2 * Math.PI * i / 18 + sample * 0.031;
      const radius = i % 2 ? 70 : 110;
      return [150 + radius * Math.cos(angle), 125 + radius * Math.sin(angle)];
    });
    const hole = Array.from({ length: 10 }, (_, i) => {
      const angle = -2 * Math.PI * i / 10;
      return [150 + 18 * Math.cos(angle), 125 + 18 * Math.sin(angle)];
    });
    const groups = [{ out, holes: [hole] }], parts = app.extrude(groups);
    near(parts.reduce((n, p) => n + p.vol, 0), area(app, groups) * 2);
    for (const p of parts) assertClosed(p);
  }
});

test('splitting actual smooth and rectangular meshes preserves the original material volume', () => {
  for (const smooth of [true, false]) {
    const split = studio().synthetic(smooth), whole = studio().synthetic(smooth, 'service', false);
    for (const module of ['front', 'box', 'back']) {
      const sum = parts => parts.filter(p => p.module === module).reduce((n, p) => n + p.vol, 0);
      near(sum(split), sum(whole), 1e-4);
    }
  }
});

test('clear backing remains a complete display sheet while printable modules are split', () => {
  const app = studio();
  app.synthetic();
  const parts = app.backing(), sheet = parts.find(p => p.kind === 'backing');
  assert.ok(sheet?.display && sheet.n > 0);
  assert.equal(sheet.tile, undefined);
  assert.equal(sheet.chunks, undefined);
  assert.ok(parts.filter(p => !p.display).every(p => p.tile && p.n > 0));
  assertClosed(sheet);
});

test('5D curved and chamfer modes keep their existing complete meshes and export filenames', async () => {
  for (const mode of ['face5d', 'face5dChamfer']) {
    const app = studio(), parts = app.synthetic(true, mode);
    const original = studio().synthetic(true, mode, false);
    assert.equal(app.plan().enabled, false);
    assert.ok(parts.every(p => !p.tile));
    assert.deepEqual(plain(parts.map(p => [p.kind, p.n, p.vol])), plain(original.map(p => [p.kind, p.n, p.vol])));
    const result = await app.exportScene('3mf');
    assert.deepEqual(plain(result.messages), ['ส่งออกเรียบร้อย']);
    assert.equal(result.downloads.length, 1);
    assert.match(result.downloads[0].name, mode === 'face5d' ? /5D_ขอบโค้งมน\.3mf$/ : /5D_Chamfer\.3mf$/);
  }
});

test('3D preview grid spans every print plate and respects rectangular printer height', () => {
  const app = studio();
  app.synthetic();
  const pack = app.pack(), grid = app.grid();
  near(grid.x0, -pack.bed / 2);
  near(grid.x1, pack.maxX - pack.bed / 2);
  near(grid.z0, pack.bed / 2 - pack.maxY);
  near(grid.z1, pack.bed / 2);
});

test('every tiled 3MF module starts at Z=0, including cap shells', async () => {
  for (const mode of ['service', 'shell', 'shellCap']) {
    const app = studio(), parts = app.synthetic(true, mode).filter(p => !p.display);
    for (const group of app.groups(parts)) {
      const zip = unzipStored(await (await app.model(group.parts, group.key)).arrayBuffer());
      const model = zip.get('3D/3dmodel.model').toString('utf8');
      const z = [...model.matchAll(/<vertex x="[^"]+" y="[^"]+" z="([^"]+)"/g)].map(m => +m[1]);
      assert.ok(z.length > 0);
      near(Math.min(...z), 0, 0.001);
      assert.ok(z.every(value => value >= -0.001));
      if (mode === 'shellCap') {
        assert.equal(group.module, 'shell');
        assert.ok(group.parts.every(p => p.printBase > 0));
        const place = app.pack().items[group.key];
        assert.ok(place && place.x > 0 && place.y > 0);
      }
    }
  }
});

test('smooth work fitting a single plate retains edge material and normalizes negative back coordinates', () => {
  const app = studio();
  const original = studio().synthetic(true, 'service', false);
  app.synthetic();
  const parts = app.rebuildOnPrinter(256, 256);
  assert.equal(app.plan().tiles.length, 1);
  assert.equal(app.issues(parts).length, 0);
  near(parts.reduce((sum, p) => sum + p.vol, 0), original.reduce((sum, p) => sum + p.vol, 0));
  assert.ok(parts.every(p => p.x0 >= 0 && p.y0 >= 0));
});

test('export action bundles individual print rounds with assembly instructions for 3MF and STL', async () => {
  for (const fmt of ['3mf', 'stl']) {
    const app = studio(), parts = app.synthetic();
    const result = await app.exportScene(fmt);
    assert.equal(result.downloads.length, 1);
    assert.deepEqual(plain(result.messages), ['ส่งออกเรียบร้อย']);
    const files = unzipStored(await result.downloads[0].blob.arrayBuffer());
    const manifest = JSON.parse(files.get('assembly.json').toString('utf8'));
    assert.equal(manifest.groups.length, app.groups(parts).length);
    for (const record of manifest.groups) assert.ok(files.has(record.file + '.' + fmt));
    assert.ok([...files.keys()].some(name => name.endsWith('_ผังประกอบ.txt')));
  }
});

test('173 cm work replans automatically for the selected printer while preserving assembly coordinates', () => {
  const app = studio(1730, 400, { bed: 256, bedH: 256 });
  const originalTiles = plain(app.plan().tiles);
  for (const [printer, width, height, columns, rows] of [
    ['bambu-a1-mini', 160, 160, 11, 3],
    ['bambu-a1', 236, 236, 8, 2],
    ['creality-k1max', 280, 280, 7, 2],
    ['mingda-adf4', 1180, 780, 2, 1],
  ]) {
    const plan = app.selectPrinter(printer);
    assert.deepEqual([plan.w, plan.h, plan.nx, plan.ny], [width, height, columns, rows]);
    near(Math.min(...plan.tiles.map(t => t.x0)), 0);
    near(Math.max(...plan.tiles.map(t => t.x1)), 1730);
    near(Math.max(...plan.tiles.map(t => t.y1)), 400);
    assert.ok(plan.tiles.every(t => t.x1 - t.x0 <= width && t.y1 - t.y0 <= height));
  }
  assert.deepEqual(plain(app.selectPrinter('bambu-a1').tiles), originalTiles);
});

test('173 cm front, box, and back have identical physical seam positions on each selected printer', () => {
  const width = 1730, app = studio();
  let parts = app.synthetic(true, 'service', true, 'snap', { width, height: 100, printer: 'bambu-a1' });
  const worldX = group => {
    let min = Infinity, max = -Infinity;
    for (const part of group.parts) {
      const m = app.matrix(part, 'asm');
      for (const x of [part.x0, part.x1]) { const at = m[0] * x + m[12]; min = Math.min(min, at); max = Math.max(max, at); }
    }
    return [min, max];
  };
  for (const [printer, columns] of [['bambu-a1', 8], ['bambu-a1-mini', 11], ['creality-k1max', 7]]) {
    if (printer !== 'bambu-a1') parts = app.rebuildSelectedPrinter(printer);
    const plan = app.plan(), groups = app.groups(parts);
    assert.equal(plan.nx, columns); assert.equal(plan.ny, 1);
    assert.equal(app.issues(parts).length, 0);
    for (const module of ['front', 'box', 'back']) {
      const byModule = groups.filter(g => g.module === module);
      assert.equal(byModule.length, columns);
      for (let column = 1; column < columns; column++) {
        const left = byModule.find(g => g.tile.id === `R1C${column}`);
        const right = byModule.find(g => g.tile.id === `R1C${column + 1}`);
        const expected = left.tile.x1 - width / 2;
        near(worldX(left)[1], expected, 0.001);
        near(worldX(right)[0], expected, 0.001);
      }
    }
    for (const p of parts) {
      assert.ok(p.x0 >= -0.001 && p.y0 >= -0.001 && p.x1 <= plan.w + 0.001 && p.y1 <= plan.h + 0.001);
    }
  }
});

test('173 cm export includes a matching front, box, and back file for every 256 mm printer column', async () => {
  const app = studio();
  app.synthetic(true, 'service', true, 'snap', { width: 1730, height: 100, printer: 'bambu-a1' });
  const result = await app.exportScene('3mf');
  assert.deepEqual(plain(result.messages), ['ส่งออกเรียบร้อย']);
  assert.equal(result.downloads.length, 1);
  const files = unzipStored(await result.downloads[0].blob.arrayBuffer());
  const manifest = JSON.parse(files.get('assembly.json').toString('utf8'));
  assert.equal(manifest.width, 1730);
  assert.equal(manifest.columns, 8); assert.equal(manifest.rows, 1);
  assert.deepEqual(manifest.usable, [236, 236]);
  assert.equal(manifest.groups.length, 24);
  for (let column = 1; column <= 8; column++) {
    const tileGroups = manifest.groups.filter(g => g.tile.id === `R1C${column}`);
    assert.deepEqual(tileGroups.map(g => g.module).sort(), ['back', 'box', 'front']);
    assert.ok(tileGroups.every(g => files.has(g.file + '.3mf')));
    assert.ok(tileGroups.every(g => JSON.stringify(g.tile) === JSON.stringify(tileGroups[0].tile)));
  }
});
