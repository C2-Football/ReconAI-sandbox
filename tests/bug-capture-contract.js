#!/usr/bin/env node
// Sentry launch error-capture contract tests.
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const appConfig = read('shared/app-config.js');
const bugCapture = read('shared/bug-capture.js');
const main = read('main.js');
const index = read('index.html');

let passed = 0;
let failed = 0;
const failures = [];

function read(relPath) {
  return fs.readFileSync(path.join(ROOT, relPath), 'utf8');
}

function test(name, fn) {
  try {
    fn();
    passed++;
    process.stdout.write('.');
  } catch (err) {
    failed++;
    failures.push(`  FAIL: ${name}\n        ${err.message}`);
    process.stdout.write('F');
  }
}

function group(label) {
  process.stdout.write(`\n  ${label}  `);
}

function ok(value, label) {
  if (!value) throw new Error(label || 'expected truthy value');
}

function hasEvery(source, fragments, label) {
  for (const fragment of fragments) ok(source.includes(fragment), `${label}: missing ${fragment}`);
}

console.log('\nBug capture contract tests');

group('config');

test('app-config exposes scoped Sentry DSNs and launch release', () => {
  hasEvery(appConfig, [
    'sentry:',
    'launch-2026-05-03',
    '60c6987e08918ef1306b1582a86b1941',
    'fbe10be66ec013dc267fb092dcf16fff',
  ], 'Sentry config');
});

group('client');

test('bug-capture loads Sentry without replay/performance and scrubs sensitive data', () => {
  hasEvery(bugCapture, [
    'browser.sentry-cdn.com',
    'tracesSampleRate: 0',
    'sendDefaultPii: false',
	    'beforeSend: sanitizeEvent',
	    'typeof dsnValue === \'string\'',
	    'window.addEventListener(\'error\'',
    'window.addEventListener(\'unhandledrejection\'',
    'captureError',
    'sensitiveKey',
    '[Filtered]',
    '[email]',
    '[jwt]',
  ], 'bug-capture client');
  ok(!/replayIntegration|replaysSessionSampleRate|replaysOnErrorSampleRate/i.test(bugCapture), 'session replay should not be enabled for launch');
});

test('Scout loads bug capture before app modules', () => {
  ok(index.includes("window.DYNASTY_HQ_APP = 'reconai'"), 'Scout app tag missing');
  ok(main.indexOf("import './shared/bug-capture.js';") > main.indexOf("import './shared/app-config.js';"), 'bug-capture should load after app-config');
  ok(main.indexOf("import './shared/bug-capture.js';") < main.indexOf("import './shared/utils.js';"), 'bug-capture should load before utility logging');
});

console.log('\n');
if (failures.length) {
  console.log(failures.join('\n'));
  console.log('');
}
const status = failed > 0 ? 'FAIL' : 'PASS';
console.log(`${status} ${passed + failed} tests - ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
