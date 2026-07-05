'use strict';

// Node runner for the shared seed-words spec suite via node:test. Each entry in
// the shared spec becomes its own node:test case so failures are isolated.
const { test } = require('node:test');

const seedwords = require('../seedwords.js');
const makeAssert = require('./specs/assert');
const suite = require('./specs/seedwords.spec');

for (const t of suite.tests) {
    test(`${suite.name}: ${t.name}`, async () => {
        const assert = makeAssert();
        await t.run(seedwords, assert);
    });
}
