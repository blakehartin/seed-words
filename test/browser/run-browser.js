#!/usr/bin/env node
// Launches headless Chromium via Playwright, loads the bundled harness, waits
// for the spec to complete, prints results, and exits non-zero on any failure.
// One-time setup: `npx playwright install chromium`.
'use strict';

const path = require('path');
const { chromium } = require('@playwright/test');

async function main() {
    const harness = path.resolve(__dirname, 'harness.html');
    const url = 'file://' + harness.replace(/\\/g, '/');

    const browser = await chromium.launch();
    const page = await browser.newPage();

    const pageErrors = [];
    page.on('pageerror', (err) => pageErrors.push('pageerror: ' + err.message));
    page.on('console', (msg) => {
        if (msg.type() === 'error') pageErrors.push('console.error: ' + msg.text());
    });

    await page.goto(url);
    await page.waitForFunction(() => window.__specResults && window.__specResults.done, null, { timeout: 180000 });
    const results = await page.evaluate(() => window.__specResults);
    await browser.close();

    console.log('Browser (Chromium) spec results:');
    for (const s of results.specs) {
        const status = s.ok ? 'PASS' : 'FAIL';
        const checks = s.checks != null ? ` (${s.checks} checks)` : '';
        const err = s.error ? ` - ${s.error}` : '';
        console.log(`  [${status}] ${s.name}${checks}${err}`);
    }
    console.log(`passed=${results.passed} failed=${results.failed}`);

    if (pageErrors.length) {
        console.log('Page/console errors:');
        for (const e of pageErrors) console.log('  ' + e);
    }

    if (results.failed > 0 || results.passed === 0) {
        process.exit(1);
    }
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
