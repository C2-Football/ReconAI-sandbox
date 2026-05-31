#!/usr/bin/env node
// Assistant tutorial shared-engine contract checks.
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

const engine = read('shared/assistant-tutorial.js');
const scoutConfig = read('js/tutorial.js');
const client = read('shared/supabase-client.js');
const appConfig = read('shared/app-config.js');
const main = read('main.js');
const settings = read('index.html');
const migration = read('supabase/migrations/017_tutorial_state.sql');

let passed = 0;
let failed = 0;
const failures = [];

function read(relPath) {
  return fs.readFileSync(path.join(ROOT, relPath), 'utf8');
}

function test(name, fn) {
  try {
    fn();
    passed += 1;
    process.stdout.write('.');
  } catch (err) {
    failed += 1;
    failures.push(`  FAIL: ${name}\n        ${err.message}`);
    process.stdout.write('F');
  }
}

function ok(value, label) {
  if (!value) throw new Error(label || 'expected truthy value');
}

function hasEvery(source, fragments, label) {
  fragments.forEach(fragment => ok(source.includes(fragment), `${label}: missing ${fragment}`));
}

console.log('\nAssistant tutorial contract tests');

test('shared engine exposes required tutorial API and events', () => {
  hasEvery(engine, [
    'window.App.AssistantTutorial',
    'start,',
    'shouldShow,',
    'complete,',
    'reset,',
    "'tutorial_started'",
    "'tutorial_step_viewed'",
    "'tutorial_completed'",
    "'tutorial_skipped'",
    "'tutorial_replayed'",
    "'dhq:tutorial-complete'",
    'prefers-reduced-motion',
  ], 'shared engine');
});

test('Scout config uses shared engine with legacy completion compatibility', () => {
  hasEvery(scoutConfig, [
    "productKey: 'scout'",
    "version: 'gm-brief-v1'",
    "legacyKeys: ['scout_tutorial_done_v1']",
    'window.SCOUT_TUTORIAL_CONFIG',
    'window.replayScoutTutorial',
    'AssistantTutorial.start',
  ], 'Scout tutorial config');
  ok(settings.includes('Replay GM Briefing'), 'Scout settings replay button missing');
  ok(main.includes("import './shared/assistant-tutorial.js';"), 'shared tutorial import missing');
});

test('tutorial state sync prefers app account and falls back to legacy users table', () => {
  hasEvery(client, [
    'fwProfile',
    'window.OD.loadTutorialState',
    'window.OD.saveTutorialState',
    "select('tutorial_state')",
    ".update({ tutorial_state:",
    'getAppSession',
  ], 'Supabase client tutorial state');
  ok(appConfig.includes('fwProfile'), 'app-config fwProfile endpoint missing');
  ok(migration.includes('add column if not exists tutorial_state jsonb'), 'legacy users tutorial_state migration missing');
});

console.log('\n');
if (failures.length) console.log(failures.join('\n') + '\n');
console.log(`${failed ? 'FAIL' : 'PASS'} ${passed + failed} tests - ${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
