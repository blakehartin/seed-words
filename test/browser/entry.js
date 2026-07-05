'use strict';

// Browser test entry point. esbuild bundles this (+ seedwords.js with its
// gzip+base64 blob and the shared spec) into a single IIFE. It runs the same
// environment-agnostic spec used by the Node runner and records results on
// window.__specResults. This is where the DecompressionStream gunzip path is
// exercised in a real browser.

const seedwords = require('../../seedwords.js');
const makeAssert = require('../specs/assert');
const spec = require('../specs/seedwords.spec');

async function runSpec(spec, results) {
    const assert = makeAssert();
    const started = Date.now();
    try {
        await spec.run(seedwords, assert);
        results.specs.push({ name: spec.name, ok: true, checks: assert.count, ms: Date.now() - started });
        results.passed++;
    } catch (e) {
        results.specs.push({ name: spec.name, ok: false, checks: assert.count, error: (e && e.message) || String(e), ms: Date.now() - started });
        results.failed++;
    }
}

async function main() {
    const results = { passed: 0, failed: 0, specs: [] };
    try {
        await runSpec(spec, results);
    } catch (e) {
        results.failed++;
        results.specs.push({ name: 'harness', ok: false, error: (e && e.stack) || String(e) });
    }
    results.done = true;
    (typeof window !== 'undefined' ? window : globalThis).__specResults = results;
}

main();
