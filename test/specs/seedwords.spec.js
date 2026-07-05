'use strict';

// Environment-agnostic spec suite for seed-words. Run by both the Node runner
// (test/seedwords.test.js) and the browser harness (test/browser/entry.js).
// Every test is deterministic (no randomness) and exercises the public API of
// seedwords.js. The gzip+base64 decode path in initialize() is covered here:
// a true return means DecompressionStream produced byte-identical CSV and the
// SEED_HASH check plus the full 0..255 x 0..255 verify loop passed. In the
// browser this is where DecompressionStream actually matters.

const TOTAL_WORDS = 65536; // 256 x 256

// Each test calls initialize() first. It is idempotent (guarded by an internal
// flag), so after the first call it returns true immediately and leaves the
// loaded word maps intact regardless of test ordering.
async function ready(seedwords) {
    const ok = await seedwords.initialize();
    if (ok !== true) throw new Error('initialize() did not return true');
}

const tests = [
    {
        name: 'initialize() succeeds and is idempotent',
        async run(seedwords, assert) {
            const first = await seedwords.initialize();
            assert.equal(first, true, 'first initialize() should return true');
            const second = await seedwords.initialize();
            assert.equal(second, true, 'second initialize() should also return true');
        },
    },

    {
        name: 'getAllSeedWords() returns 65536 unique words',
        async run(seedwords, assert) {
            await ready(seedwords);
            const all = seedwords.getAllSeedWords();
            assert.ok(Array.isArray(all), 'getAllSeedWords() should return an array');
            assert.equal(all.length, TOTAL_WORDS, 'expected 65536 seed words');
            assert.equal(new Set(all).size, TOTAL_WORDS, 'all seed words should be unique');

            // Returns a defensive copy: mutating the result must not affect later calls.
            all.push('__mutation__');
            assert.equal(seedwords.getAllSeedWords().length, TOTAL_WORDS, 'getAllSeedWords() must return a fresh copy');
        },
    },

    {
        name: 'doesSeedWordExist() is correct and case-insensitive',
        async run(seedwords, assert) {
            await ready(seedwords);
            const all = seedwords.getAllSeedWords();
            const known = all[0];

            assert.equal(seedwords.doesSeedWordExist(known), true, 'a known word should exist');
            assert.equal(seedwords.doesSeedWordExist(known.toUpperCase()), true, 'lookup should be case-insensitive');
            assert.equal(seedwords.doesSeedWordExist('zzzznotarealseedword'), false, 'a bogus word should not exist');
        },
    },

    {
        name: 'getWordListFromSeedArray() maps bytes to words deterministically',
        async run(seedwords, assert) {
            await ready(seedwords);

            // Fixed byte array -> a fixed, reproducible list of 3 words.
            const seedArray = [0, 0, 0, 1, 255, 255];
            const words = seedwords.getWordListFromSeedArray(seedArray);
            assert.ok(Array.isArray(words) && words.length === 3, 'expected 3 words from a 6-byte array');
            for (const w of words) {
                assert.equal(seedwords.doesSeedWordExist(w), true, 'each produced word should be a valid seed word');
            }

            // Two-byte minimum produces exactly one word.
            const single = seedwords.getWordListFromSeedArray([0, 0]);
            assert.ok(Array.isArray(single) && single.length === 1, 'a 2-byte array should yield one word');
        },
    },

    {
        name: 'getWordListFromSeedArray() rejects invalid input',
        async run(seedwords, assert) {
            await ready(seedwords);
            assert.equal(seedwords.getWordListFromSeedArray([]), null, 'empty array should return null');
            assert.equal(seedwords.getWordListFromSeedArray([0]), null, 'array shorter than 2 should return null');
            assert.equal(seedwords.getWordListFromSeedArray([0, 0, 0]), null, 'odd-length array should return null');
            assert.equal(seedwords.getWordListFromSeedArray([0, 300]), null, 'out-of-range byte should return null');
        },
    },

    {
        name: 'getSeedArrayFromWordList() reverses getWordListFromSeedArray()',
        async run(seedwords, assert) {
            await ready(seedwords);
            const seedArray = [0, 0, 0, 1, 255, 255];
            const words = seedwords.getWordListFromSeedArray(seedArray);
            const back = seedwords.getSeedArrayFromWordList(words);
            assert.deepEqual(back, seedArray, 'seed array round-trip should match');
        },
    },

    {
        name: 'getSeedArrayFromWordList() is case-insensitive and rejects unknown words',
        async run(seedwords, assert) {
            await ready(seedwords);
            const known = seedwords.getAllSeedWords()[0];

            const lower = seedwords.getSeedArrayFromWordList([known]);
            const upper = seedwords.getSeedArrayFromWordList([known.toUpperCase()]);
            assert.ok(Array.isArray(lower) && lower.length === 2, 'one word should yield two bytes');
            assert.deepEqual(upper, lower, 'word lookup should be case-insensitive');

            assert.equal(seedwords.getSeedArrayFromWordList(['zzzznotarealseedword']), null, 'unknown word should return null');
        },
    },

    {
        name: 'byte<->word round-trips exactly across a deterministic sample of the space',
        async run(seedwords, assert) {
            await ready(seedwords);

            // Deterministic stride over the full 0..255 x 0..255 space (coprime-ish
            // step 37 gives good coverage without iterating all 65536 pairs).
            for (let a = 0; a <= 255; a += 37) {
                for (let b = 0; b <= 255; b += 37) {
                    const seedArray = [a, b];
                    const words = seedwords.getWordListFromSeedArray(seedArray);
                    assert.ok(words && words.length === 1, `expected a word for [${a}, ${b}]`);
                    const back = seedwords.getSeedArrayFromWordList(words);
                    assert.deepEqual(back, seedArray, `round-trip should preserve [${a}, ${b}]`);
                }
            }
        },
    },
];

module.exports = {
    name: 'seedwords',
    tests,
};
