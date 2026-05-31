#!/usr/bin/env node
// Canonical rookie-data source contract.
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const source = fs.readFileSync(path.join(ROOT, 'shared', 'rookie-data.js'), 'utf8');

let passed = 0;
let failed = 0;
const failures = [];

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

console.log('\nRookie-data contract tests');

group('exports');

test('shared module exposes the canonical browser API', () => {
  [
    'window.RookieData',
    'window.loadRookieProspects',
    'window.findProspect',
    'window.getProspects',
    'window.getIDPProspects',
    'Object.assign(window.App',
  ].forEach(fragment => ok(source.includes(fragment), `missing ${fragment}`));
});

group('data model');

test('provider owns War Room scoring and post-draft enrichment fields', () => {
  [
    'rankToTierBase',
    'pickToBase',
    'draftCapitalValue',
    'rankValue',
    'baseDynastyValue',
    'mergeSyntheticProspects',
    'draftRound',
    'draftPick',
    'isUDFA',
    'rookiePosRank',
  ].forEach(fragment => ok(source.includes(fragment), `missing ${fragment}`));
});

test('provider supports local and deployed rookie CSV bases', () => {
  ok(source.includes('window.ROOKIE_DATA_BASE'), 'ROOKIE_DATA_BASE override missing');
  ok(source.includes('player.csv'), 'player.csv fetch missing');
  ok(source.includes('players.csv'), 'players.csv fallback missing');
  ok(source.includes('data/mock_draft_db.csv'), 'mock_draft_db fallback missing');
  ok(source.includes('player-enrichment.csv'), 'player-enrichment fetch missing');
});

test('provider preserves nickname/suffix matching used by War Room', () => {
  [
    'aliasKeys',
    'stripSuffix',
    'first[0]',
    'byName',
  ].forEach(fragment => ok(source.includes(fragment), `missing ${fragment}`));
});

test('provider does not merge post-draft data by last name only', () => {
  ok(!source.includes('keys.add(last)'), 'last-name-only aliases can merge distinct prospects');
  ok(!source.includes('surnameSchoolIndex'), 'surname plus school matching can transfer draft capital across players');
  ok(source.includes('applyPostDraftEnrichment(aliasMatch, e)'), 'safe alias post-draft merge missing');
});

console.log('\n');
if (failures.length) {
  console.log(failures.join('\n'));
  console.log('');
}
const status = failed > 0 ? 'FAIL' : 'PASS';
console.log(`${status} ${passed + failed} tests - ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
