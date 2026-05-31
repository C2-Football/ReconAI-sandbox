#!/usr/bin/env node
// Local deploy-readiness verification for ReconAI + War Room shared changes.
'use strict';

const fs = require('fs');
const path = require('path');

const RECON_ROOT = path.resolve(__dirname, '..');
const WARROOM_ROOT = path.resolve(RECON_ROOT, '..', 'warroom');

const checks = [];

function add(name, ok, detail) {
  checks.push({ name, ok: !!ok, detail });
}

function exists(root, relPath) {
  return fs.existsSync(path.join(root, relPath));
}

function read(root, relPath) {
  return fs.readFileSync(path.join(root, relPath), 'utf8');
}

function migrationPrefixesUnique() {
  const dir = path.join(RECON_ROOT, 'supabase', 'migrations');
  const seen = new Map();
  for (const file of fs.readdirSync(dir).filter(f => f.endsWith('.sql'))) {
    const prefix = file.match(/^(\d+)_/)?.[1];
    if (!prefix) continue;
    if (prefix === '004' && file === '004_field_log.sql') continue;
    if (seen.has(prefix)) return `${prefix}: ${seen.get(prefix)}, ${file}`;
    seen.set(prefix, file);
  }
  return null;
}

function main() {
  add('ReconAI migrations include analytics events', exists(RECON_ROOT, 'supabase/migrations/009_analytics_events.sql'));
  add('ReconAI migrations include AI usage accounting', exists(RECON_ROOT, 'supabase/migrations/010_ai_usage_accounting.sql'));
  add('ReconAI migrations include field-log repair', exists(RECON_ROOT, 'supabase/migrations/011_field_log_schema_repair.sql'));
  add('ReconAI migrations include Yahoo tokens with unique prefix', exists(RECON_ROOT, 'supabase/migrations/012_yahoo_tokens.sql'));
  add('ReconAI migrations include player tag policy repair', exists(RECON_ROOT, 'supabase/migrations/013_player_tags_policy_repair.sql'));

  const duplicate = migrationPrefixesUnique();
  add('ReconAI migration prefixes are unique except the deprecated 004 no-op', !duplicate, duplicate ? `duplicate ${duplicate}` : 'ok');

  add('ReconAI no longer owns the server AI function', !exists(RECON_ROOT, 'supabase/functions/ai-analyze/index.ts'));

  const reconDeployWorkflow = read(RECON_ROOT, '.github/workflows/deploy-functions.yml');
  add('ReconAI deploy workflow requires the Supabase token secret',
    reconDeployWorkflow.includes('SUPABASE_ACCESS_TOKEN repo secret is required'));
  add('ReconAI deploy workflow ships proxy functions without gateway JWT enforcement',
    reconDeployWorkflow.includes('supabase functions deploy espn-proxy')
    && reconDeployWorkflow.includes('supabase functions deploy mfl-proxy')
    && reconDeployWorkflow.includes('supabase functions deploy yahoo-proxy')
    && (reconDeployWorkflow.match(/--use-api --no-verify-jwt/g) || []).length >= 3);
  add('ReconAI deploy workflow verifies security hardening migrations',
    reconDeployWorkflow.includes('018_security_identity_hardening.sql')
    && reconDeployWorkflow.includes('ReconAI-WarRoom-GitHub-Actions'));

  const warroomFunction = read(WARROOM_ROOT, 'supabase/functions/ai-analyze/index.ts');
  add('War Room AI function records usage analytics', warroomFunction.includes('analytics_events') && warroomFunction.includes('add_ai_tokens_used'));
  add('War Room AI function has current vendor-neutral model routing',
    warroomFunction.includes('AI_POLICY_VERSION')
    && warroomFunction.includes('gemini-2.5-flash-lite')
    && warroomFunction.includes('gpt-5.4-mini')
    && warroomFunction.includes('claude-sonnet-4-6'));
  add('War Room migrations include AI margin rollups',
    exists(WARROOM_ROOT, 'supabase/migrations/20260503020000_ai_margin_rollups.sql'));
  add('War Room migrations include tutorial state sync',
    exists(WARROOM_ROOT, 'supabase/migrations/20260503010000_tutorial_state.sql'));

  const warroomDeployWorkflow = read(WARROOM_ROOT, '.github/workflows/deploy-functions.yml');
  add('War Room deploy workflow includes all launch Edge Functions',
    warroomDeployWorkflow.includes('supabase functions deploy ai-analyze')
    && warroomDeployWorkflow.includes('supabase functions deploy fw-profile')
    && warroomDeployWorkflow.includes('supabase functions deploy fw-request-password-reset')
    && warroomDeployWorkflow.includes('supabase functions deploy fw-confirm-password-reset')
    && warroomDeployWorkflow.includes('supabase functions deploy admin-analytics-report'));
  add('War Room deploy workflow requires the Supabase token secret',
    warroomDeployWorkflow.includes('SUPABASE_ACCESS_TOKEN repo secret is required')
    && !warroomDeployWorkflow.includes('skipping migration'));
  add('War Room deploy workflow verifies recorded migrations through Supabase API',
    warroomDeployWorkflow.includes('20260503020000_ai_margin_rollups.sql')
    && warroomDeployWorkflow.includes('ReconAI-WarRoom-GitHub-Actions'));
  add('War Room deploy workflow avoids Docker and gateway JWT enforcement',
    (warroomDeployWorkflow.match(/--use-api --no-verify-jwt/g) || []).length >= 12);

  const warroomIndex = read(WARROOM_ROOT, 'index.html');
  add('War Room uses shared-loader instead of hardcoded ReconAI shared scripts',
    warroomIndex.includes('js/shared/shared-loader.js') && !warroomIndex.includes('https://jcc100218.github.io/ReconAI/shared/'));

  const packageJson = JSON.parse(read(WARROOM_ROOT, 'package.json'));
  add('War Room has local shared sync script', !!packageJson.scripts?.['sync:shared']);
  add('War Room has browser QA script', !!packageJson.scripts?.['test:browser']);

  const failed = checks.filter(check => !check.ok);
  console.log('\nDeploy readiness checks');
  checks.forEach(check => {
    console.log(`${check.ok ? 'OK  ' : 'FAIL'} ${check.name}${check.detail ? ` - ${check.detail}` : ''}`);
  });

  console.log('\nProduction verification still required after deploy:');
  console.log('  Confirm GitHub Actions deploy workflows are green');
  console.log('  Download deployed Edge Functions and verify source markers');
  console.log('  Smoke-test analytics_events, ai_rate_limits.tokens_used, field_log, player_tags, and fa_targets writes');

  process.exit(failed.length ? 1 : 0);
}

main();
