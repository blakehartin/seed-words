'use strict';

// Node runner for the shared seed-words spec via node:test.
const { test } = require('node:test');

const seedwords = require('../seedwords.js');
const makeAssert = require('./specs/assert');
const spec = require('./specs/seedwords.spec');

test(spec.name, async () => {
    const assert = makeAssert();
    await spec.run(seedwords, assert);
});
