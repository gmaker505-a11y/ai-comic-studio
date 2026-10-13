const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');

const base = process.env.PANELFORGE_BASE_URL || 'http://127.0.0.1:4173';
const out = path.join(process.cwd(), 'artifacts');
const shots = path.join(out, 'screenshots');
fs.mkdirSync(shots, { recursive: true });
const results = [];
const problems = [];
const record = (name, ok, details = '') => {
  results.push({ name, status: ok ? 'PASS' : 'FAIL', details });
  console.log((ok ? 'PASS' : 'FAIL') + ': ' + name + (details ? ' — ' + details : ''));
  if (!ok) problems.push(name + (details ? ': ' + details : ''));
};
const checkOverflow = async (page, label) => {
  const result = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    pageWidth: document.documentElement.scrollWidth,
    bodyWidth: document.body.scrollWidth,
    title: document.title
  }));
  const delta = Math.max(result.pageWidth, result.bodyWidth) - result.viewport;
  record(label + ' has no horizontal overflow', delta <= 2,
    delta > 2 ? 'viewport=' + result.viewport + ', document=' + result.pageWidth + ', overflow=' + delta + 'px' : 'viewport ' + result.viewport + 'px');
  return result;
};
(async () => {
  const browser = await chromium.launch({ headless: true });
  const browserErrors = [];
  try {
    for (const device of [
      { name: 'mobile', viewport: { width: 390, height: 844 }, isMobile: true, deviceScaleFactor: 1 },
      { name: 'tablet', viewport: { width: 768, height: 1024 }, isMobile: false, deviceScaleFactor: 1 },
      { name: 'desktop', viewport: { width: 1440, height: 1000 }, isMobile: false, deviceScaleFactor: 1 }
    ]) {
      const context = await browser.newContext({ viewport: device.viewport, isMobile: device.isMobile, deviceScaleFactor: device.deviceScaleFactor });
      const page = await context.newPage();
      page.on('pageerror', error => browserErrors.push(device.name + ' page error: ' + error.message));
      const mainResponse = await page.goto(base + '/', { waitUntil: 'networkidle', timeout: 45000 });
      record(device.name + ' studio HTTP response', !!mainResponse && mainResponse.status() < 400, mainResponse ? String(mainResponse.status()) : 'no response');
      await page.screenshot({ path: path.join(shots, 'studio-' + device.name + '.png'), fullPage: true, animations: 'disabled' });
      const mainInfo = await checkOverflow(page, device.name + ' studio');
      record(device.name + ' studio title', /PanelForge/i.test(mainInfo.title), mainInfo.title);
      const novelLink = page.locator('a[href*="graphic-novel"]');
      record(device.name + ' studio links to original comic', await novelLink.count() > 0);
      if (device.name === 'mobile' && await novelLink.count()) {
        await novelLink.first().click();
        await page.waitForLoadState('domcontentloaded');
        record('Comic link opens graphic novel', page.url().includes('/graphic-novel/'), page.url());
      }
      await context.close();
    }

    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true });
    const comic = await context.newPage();
    comic.on('pageerror', error => browserErrors.push('comic page error: ' + error.message));
    const response = await comic.goto(base + '/graphic-novel/', { waitUntil: 'networkidle', timeout: 45000 });
    record('Graphic novel HTTP response', !!response && response.status() < 400, response ? String(response.status()) : 'no response');
    record('Graphic novel title is present', await comic.getByRole('heading', { name: /LAST STOP AT DAWN/i }).count() > 0);
    record('Four original comic pages exist', await comic.locator('.comic-page').count() === 4);
    record('First page is visible initially', await comic.locator('.comic-page.active').getAttribute('data-page') === '1');
    await comic.screenshot({ path: path.join(shots, 'comic-mobile-page-1.png'), fullPage: true, animations: 'disabled' });
    await comic.getByRole('button', { name: /Next/i }).click();
    record('Next button advances page', await comic.locator('.comic-page.active').getAttribute('data-page') === '2');
    record('Page counter updates', (await comic.locator('#count').innerText()).includes('2 of 4'));
    await comic.screenshot({ path: path.join(shots, 'comic-mobile-page-2.png'), fullPage: true, animations: 'disabled' });
    await comic.getByRole('button', { name: /Show all pages/i }).click();
    record('Show all pages reveals every page', await comic.locator('.comic-page:visible').count() === 4);
    await comic.screenshot({ path: path.join(shots, 'comic-mobile-all-pages.png'), fullPage: true, animations: 'disabled' });
    await checkOverflow(comic, 'mobile graphic novel');
    const panelCount = await comic.locator('.comic-page svg').count();
    record('Comic artwork panels render as SVG', panelCount >= 10, panelCount + ' illustrated panels');
    await context.close();

    for (const device of [
      { name: 'tablet', viewport: { width: 768, height: 1024 } },
      { name: 'desktop', viewport: { width: 1440, height: 1000 } }
    ]) {
      const ctx = await browser.newContext({ viewport: device.viewport });
      const p = await ctx.newPage();
      p.on('pageerror', error => browserErrors.push(device.name + ' comic page error: ' + error.message));
      await p.goto(base + '/graphic-novel/', { waitUntil: 'networkidle', timeout: 45000 });
      await p.screenshot({ path: path.join(shots, 'comic-' + device.name + '.png'), fullPage: true, animations: 'disabled' });
      await checkOverflow(p, device.name + ' graphic novel');
      await ctx.close();
    }
    record('No uncaught browser JavaScript errors', browserErrors.length === 0, browserErrors.join(' | ') || 'none observed');
  } catch (error) {
    record('Visual test runner completed', false, error.stack || error.message);
  } finally {
    await browser.close();
  }
  const report = {
    generatedAt: new Date().toISOString(),
    baseUrl: base,
    result: problems.length ? 'FAIL' : 'PASS',
    passed: results.filter(x => x.status === 'PASS').length,
    failed: results.filter(x => x.status === 'FAIL').length,
    results,
    problems,
    browserErrors
  };
  fs.writeFileSync(path.join(out, 'visual-report.json'), JSON.stringify(report, null, 2));
  fs.writeFileSync(path.join(out, 'visual-report.md'), '# PanelForge visual QA report\n\n- Result: **' + report.result + '**\n- Passed: ' + report.passed + '\n- Failed: ' + report.failed + '\n- Target: ' + base + '\n\n## Checks\n\n' + results.map(x => '- **' + x.status + '** — ' + x.name + (x.details ? ': ' + x.details : '')).join('\n') + '\n');
  if (problems.length) process.exitCode = 1;
})().catch(error => { console.error(error); process.exitCode = 1; });
