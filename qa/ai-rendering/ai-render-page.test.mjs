import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const html = await readFile(new URL('../../public/yp-web-ai/index.html', import.meta.url), 'utf8');

test('Inline JavaScript ของหน้า Booth Editor parse ได้ครบ', () => {
  const scripts = [...html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/gi)]
    .filter(match => !/\bsrc\s*=/.test(match[1]) && !/type\s*=\s*["'](?:application\/|importmap)/i.test(match[1]))
    .map(match => match[2]).filter(source => source.trim());
  assert.ok(scripts.length > 0);
  scripts.forEach((source, index) => assert.doesNotThrow(() => new vm.Script(source, { filename: `index-inline-${index}.js` })));
});

test('หน้า PROMPT มี Progress, Development A/B และ provider bridge โดยไม่ฝัง API URL', () => {
  for (const id of ['promptRenderProgress', 'promptDevTools', 'promptVariant', 'promptRunAB']) {
    assert.match(html, new RegExp(`id=["']${id}["']`));
  }
  assert.match(html, /js\/ai-render-pipeline\.js/);
  assert.match(html, /window\.YPAIRenderBridge/);
  assert.match(html, /buildFullDesignPrompt/);
  assert.match(html, /buildCompactDesignPrompt/);
  assert.doesNotMatch(html, /AI_RENDER_API_URL\s*=/);
});

test('Clean Screenshot ถูก cap และตรวจขนาดก่อนส่ง', () => {
  assert.match(html, /maxLongEdge[^\n]+2048/);
  assert.match(html, /maxBytes[^\n]+4\*1024\*1024/);
  assert.match(html, /withinByteLimit/);
});
