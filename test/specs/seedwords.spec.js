'use strict';

// Environment-agnostic spec for seed-words. Run by both the Node runner
// (test/seedwords.test.js) and the browser harness (test/browser/entry.js).
// This exercises the gzip+base64 decode path added in initialize(): a true
// return means DecompressionStream produced byte-identical CSV and the
// unchanged SEED_HASH check passed. In the browser this is where
// DecompressionStream actually matters.

module.exports = {
    name: 'seedwords',
    async run(seedwords, assert) {
        // initialize() returning true proves the decompressed CSV reproduced
        // the SEED_HASH constant and the full 0..255 x 0..255 verify loop.
        const ok = await seedwords.initialize();
        assert.equal(ok, true, 'initialize() should return true');

        const all = seedwords.getAllSeedWords();
        assert.equal(all.length, 65536, 'expected 65536 seed words');

        // Known word exists; a bogus word does not.
        assert.equal(seedwords.doesSeedWordExist(all[0]), true, 'first word should exist');
        assert.equal(seedwords.doesSeedWordExist('zzzznotarealseedword'), false, 'bogus word should not exist');

        // Round-trip: seed byte array -> words -> seed byte array.
        const seedArray = [0, 0, 0, 1, 255, 255];
        const words = seedwords.getWordListFromSeedArray(seedArray);
        assert.ok(Array.isArray(words) && words.length === 3, 'expected 3 words from seed array');
        const back = seedwords.getSeedArrayFromWordList(words);
        assert.deepEqual(back, seedArray, 'seed array round-trip should match');
    },
};
