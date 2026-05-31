#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const ROOT = path.join(__dirname, '..');
const contentPath = path.join(ROOT, 'public', 'content', 'landing-pages.json');
const indexPath = path.join(ROOT, 'index.html');

const content = JSON.parse(fs.readFileSync(contentPath, 'utf8'));
const scout = content.pages && content.pages.scoutFrontDoor;

assert.strictEqual(content.schemaVersion, 1, 'schemaVersion must be 1');
assert(scout, 'pages.scoutFrontDoor is required');
assert(scout.meta?.title, 'Scout meta title is required');
assert(scout.auth?.welcomeTitle, 'Scout welcome title is required');
assert(scout.auth?.googleCta && scout.auth?.appleCta, 'Scout auth CTAs are required');
assert(scout.connect?.heading, 'Scout connect heading is required');
assert(Array.isArray(scout.connect?.instantExamples) && scout.connect.instantExamples.length === 4, 'Scout needs 4 instant examples');
assert(Array.isArray(scout.connect?.featurePills) && scout.connect.featurePills.length === 3, 'Scout needs 3 feature pills');

const html = fs.readFileSync(indexPath, 'utf8');
assert(html.includes('./js/landing-content.js'), 'index.html must load js/landing-content.js');
assert(html.includes('id="scout-welcome-title"'), 'index.html must expose editable Scout welcome title');
assert(html.includes('id="connect-heading"'), 'index.html must expose editable connect heading');

console.log('Scout landing content contract ok');
