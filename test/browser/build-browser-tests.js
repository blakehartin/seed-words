#!/usr/bin/env node
// Bundles the browser test entry (seedwords.js + the gzip+base64 blob + shared
// spec) into test/browser/bundle.js via esbuild. platform:'browser' fails the
// build if any Node-only builtin sneaks into the runtime graph - a useful guard
// for browser compatibility of the DecompressionStream/base64 decode path.
'use strict';

const path = require('path');
const esbuild = require('esbuild');

const root = path.resolve(__dirname, '..', '..');

esbuild
    .build({
        entryPoints: [path.join(root, 'test', 'browser', 'entry.js')],
        bundle: true,
        outfile: path.join(root, 'test', 'browser', 'bundle.js'),
        platform: 'browser',
        format: 'iife',
        logLevel: 'info',
    })
    .then(() => {
        console.log('Built test/browser/bundle.js');
    })
    .catch((err) => {
        console.error(err);
        process.exit(1);
    });
