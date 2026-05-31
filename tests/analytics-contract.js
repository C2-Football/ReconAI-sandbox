#!/usr/bin/env node
// Analytics instrumentation contract tests.
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const supabaseClient = fs.readFileSync(path.join(ROOT, 'shared', 'supabase-client.js'), 'utf8');
const aiDispatch = fs.readFileSync(path.join(ROOT, 'shared', 'ai-dispatch.js'), 'utf8');
const bugCapture = fs.readFileSync(path.join(ROOT, 'shared', 'bug-capture.js'), 'utf8');
const proLaunch = fs.readFileSync(path.join(ROOT, 'js', 'pro-launch.js'), 'utf8');
const migration = fs.readFileSync(path.join(ROOT, 'supabase', 'migrations', '009_analytics_events.sql'), 'utf8');
const rollupMigration = fs.readFileSync(path.join(ROOT, 'supabase', 'migrations', '016_analytics_rollups.sql'), 'utf8');
const analyticsPermissionMigration = fs.readFileSync(path.join(ROOT, 'supabase', 'migrations', '019_analytics_insert_permissions.sql'), 'utf8');

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

console.log('\nAnalytics contract tests');

group('schema');

test('analytics_events table stores product events without prompt content columns', () => {
  [
    'event_id text primary key',
    'session_id text not null',
    'platform text not null',
    'module text',
    'widget text',
    'event_name text not null',
    'duration_ms integer',
    'entity_type text',
    'entity_id text',
    'metadata jsonb',
  ].forEach(fragment => ok(migration.includes(fragment), `missing ${fragment}`));
  ok(!/^\s*(prompt|message|content)\s+text\b/im.test(migration), 'analytics schema should not store raw prompt/message/content columns');
});

test('RLS lockdown makes analytics client-insert-only', () => {
  const rlsMigration = fs.readFileSync(path.join(ROOT, 'supabase', 'migrations', '014_rls_lockdown.sql'), 'utf8');
  ok(rlsMigration.includes('alter table if exists public.analytics_events enable row level security;'), 'analytics RLS enable repair missing');
  ok(rlsMigration.includes('create policy analytics_events_insert_own'), 'analytics insert policy missing');
  ok(!/create\s+policy\s+analytics_events_select/i.test(rlsMigration), 'analytics should not be client-readable');
  ok(analyticsPermissionMigration.includes('revoke all on table public.analytics_events from anon, authenticated'), 'analytics browser grants should be reset');
  ok(analyticsPermissionMigration.includes('grant insert on table public.analytics_events to anon, authenticated'), 'analytics browser insert grant missing');
  ok(!/grant\s+(select|update|delete)[\s\S]*analytics_events\s+to\s+(anon|authenticated)/i.test(analyticsPermissionMigration), 'analytics browser role must not get read/update/delete grants');
});

group('client events');

test('shared analytics client exposes product-specific helpers', () => {
  [
    'window.OD.trackWidgetClick',
    'window.OD.trackPlayerModal',
    'window.OD.trackTradeStarted',
    'window.OD.trackTradeEvaluated',
    'window.OD.trackWaiverTargetSaved',
    'window.OD.trackDraftPlayerExpanded',
    'window.OD.trackFunnelStep',
    'window.OD.trackFeatureGate',
    'window.OD.trackClientError',
    "'app_loaded'",
    "'module_dwell'",
    "'widget_clicked'",
    "'ui_clicked'",
    "'session_heartbeat'",
  ].forEach(fragment => ok(supabaseClient.includes(fragment), `missing ${fragment}`));
});

test('shared analytics client uses insert-only browser writes', () => {
  ok(supabaseClient.includes("db.from('analytics_events').insert(batch)"), 'analytics flush should use insert-only writes');
  ok(!/from\('analytics_events'\)\.upsert/i.test(supabaseClient), 'analytics flush must not require browser update privileges');
  ok(supabaseClient.includes('function getAnalyticsUsername()'), 'analytics username helper missing');
  ok(supabaseClient.includes('function normalizeQueuedAnalyticsEvent'), 'analytics flush should normalize queued rows before insert');
  ok(!supabaseClient.includes('...evt,\n            username:'), 'analytics flush should not spread stale local queue keys into PostgREST rows');
});

test('analytics metadata sanitizer rejects raw prompt-like fields', () => {
  ok(/prompt\|message\|body\|text\|doc\|content/i.test(supabaseClient), 'prompt/content sanitizer missing');
  ok(supabaseClient.includes('route: safeAnalyticsRoute()'), 'route metadata should be sanitized and query-free');
  ok(supabaseClient.includes('return getSessionToken() && username ? username : null'), 'anonymous launch-funnel events should be flushable');
});

test('AI dispatcher tracks prompt, response, and error lifecycle without raw prompt text', () => {
  [
    'trackAIEvent',
    "'alex_prompt_sent'",
    "'alex_response_received'",
    "'alex_response_error'",
    'inputTokens',
    'outputTokens',
    'costUsd',
  ].forEach(fragment => ok(aiDispatch.includes(fragment), `missing ${fragment}`));
  ok(!/metadata:\s*\{[^}]*prompt/i.test(aiDispatch), 'AI analytics should not store raw prompt text in metadata');
});

test('bug capture sends privacy-light client error correlation to analytics', () => {
  [
    'window.OD?.trackClientError',
    "'client_error'",
    'sentryEventId',
    'errorName',
  ].forEach(fragment => ok(bugCapture.includes(fragment) || supabaseClient.includes(fragment), `missing ${fragment}`));
});

test('upgrade launch path records checkout intent', () => {
  ok(proLaunch.includes("'checkout_started'"), 'checkout intent event missing');
  ok(proLaunch.includes("source: 'pro_launch'"), 'checkout source metadata missing');
});

group('admin rollups');

test('analytics rollup function is service-role only and returns launch report sections', () => {
  [
    'create or replace function public.admin_analytics_report',
    'security definer',
    'revoke all on function public.admin_analytics_report',
    'grant execute on function public.admin_analytics_report',
    "'funnel'",
    "'dropoffs'",
    "'topModules'",
    "'topWidgets'",
    "'topRoutes'",
    "'errors'",
  ].forEach(fragment => ok(rollupMigration.includes(fragment), `missing ${fragment}`));
  ok(rollupMigration.includes('analytics_events_ts_idx'), 'event timestamp index missing');
});

console.log('\n');
if (failures.length) {
  console.log(failures.join('\n'));
  console.log('');
}
const status = failed > 0 ? 'FAIL' : 'PASS';
console.log(`${status} ${passed + failed} tests - ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
