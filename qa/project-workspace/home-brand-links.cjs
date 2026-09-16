const { chromium } = require('C:/Users/Admin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert = require('node:assert/strict');
const base = 'http://127.0.0.1:4173';
(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--enable-unsafe-swiftshader'] });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    await page.goto(base + '/yp-web-ai/index.html', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => window.YPWizardV2 && window.YPProjectWorkspace?.state().ready, null, { timeout: 60000 });
    const wizard = page.locator('.release-brand-home');
    await wizard.waitFor({ state: 'visible' });
    assert.match(await page.title(), /^YUPPIE BOOTH WIZARD/);
    assert.equal(await page.locator('.app-name').innerText(), 'YUPPIE BOOTH WIZARD');
    assert.equal(await page.locator('#releaseTitle').innerText(), 'YUPPIE BOOTH WIZARD');
    assert.match(await page.locator('#quickSetupDialogLabel').textContent(), /^YUPPIE BOOTH WIZARD/);
    assert.equal(await page.locator('#mRelease .release-list > li').count(), 6);
    assert.equal(await page.locator('#quickSetupProgress .quick-progress-item').count(), 5);
    assert.match(await page.locator('.release-phase-notice').innerText(), /06.*เฟส 1.*API.*Prompt.*AI ภายนอก/s);
    assert.equal(await page.locator('.release-phase-notice').evaluate(n => getComputedStyle(n).color), 'rgb(255, 136, 150)');
    await page.setViewportSize({ width: 390, height: 844 });
    assert.ok(await page.locator('.release-top').evaluate(n => n.scrollWidth <= n.clientWidth));
    await page.locator('.release-phase-notice').scrollIntoViewIfNeeded();
    assert.ok(await page.locator('.release-phase-notice').evaluate(n => n.scrollWidth <= n.clientWidth));
    await page.locator('#mRelease').screenshot({ path: 'qa/project-workspace/wizard-phase1-notice-mobile.png' });
    await page.setViewportSize({ width: 1440, height: 1000 });
    await wizard.locator('img').evaluate(i => i.decode());
    assert.equal(await wizard.getAttribute('href'), '/');
    assert.equal(await wizard.locator('img').getAttribute('src'), '/logo-nav.png');
    await page.locator('.release-top').screenshot({ path: 'qa/project-workspace/home-logo-wizard.png' });
    page.on('dialog', d => d.accept());
    await wizard.click();
    await page.waitForURL(base + '/', { waitUntil: 'domcontentloaded' });
    await page.goto(base + '/yp-web-ai/index.html', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => window.YPWizardV2 && window.YPProjectWorkspace?.state().ready, null, { timeout: 60000 });
    if (await page.locator('#releaseClose').isVisible()) await page.locator('#releaseClose').click();
    const header = page.locator('body > header'), link = header.locator('.brand-home');
    await link.locator('img').evaluate(i => i.decode());
    for (const width of [1440, 1024, 768, 390, 320]) {
      await page.setViewportSize({ width, height: 1000 });
      const bounds = await header.evaluate(h => [...h.querySelectorAll('.brand-home, .header-actions')].map(n => { const r = n.getBoundingClientRect(); return { x: r.x, right: r.right }; }));
      console.log(width, bounds);
      for (const r of bounds) assert.ok(r.x >= 0 && r.right <= width + 1, 'header fits viewport ' + width);
      assert.ok(bounds[0].right <= bounds[1].x, 'logo does not overlap actions ' + width);
      const ratio = await link.locator('img').evaluate(i => { const r = i.getBoundingClientRect(); return [r.width / r.height, i.naturalWidth / i.naturalHeight]; });
      assert.ok(Math.abs(ratio[0] - ratio[1]) < .01);
      await header.screenshot({ path: `qa/project-workspace/home-logo-header-${width}.png` });
    }
    await link.focus();
    await page.keyboard.press('Enter');
    await page.waitForURL(base + '/', { waitUntil: 'domcontentloaded' });
    console.log('PASS shared logo source, wizard click and header keyboard navigate home, logo aspect ratio, responsive header bounds');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
