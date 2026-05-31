#!/usr/bin/env node
// Supabase RLS ownership contract tests for shared ReconAI / War Room tables.
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const migration = fs.readFileSync(path.join(ROOT, 'supabase', 'migrations', '014_rls_lockdown.sql'), 'utf8');
const cleanupMigration = fs.readFileSync(path.join(ROOT, 'supabase', 'migrations', '015_rls_policy_cleanup.sql'), 'utf8');
const identityHardeningMigration = fs.readFileSync(path.join(ROOT, 'supabase', 'migrations', '018_security_identity_hardening.sql'), 'utf8');
const analyticsPermissionMigration = fs.readFileSync(path.join(ROOT, 'supabase', 'migrations', '019_analytics_insert_permissions.sql'), 'utf8');
const securityDoc = fs.readFileSync(path.join(ROOT, 'SECURITY-RLS.md'), 'utf8');
const analyticsMigration = fs.readFileSync(path.join(ROOT, 'supabase', 'migrations', '009_analytics_events.sql'), 'utf8');
const fieldLogRepair = fs.readFileSync(path.join(ROOT, 'supabase', 'migrations', '011_field_log_schema_repair.sql'), 'utf8');

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

function hasEvery(source, fragments, label) {
  for (const fragment of fragments) {
    ok(source.includes(fragment), `${label}: missing ${fragment}`);
  }
}

function hasPolicy(table, policy, operation) {
  const pattern = new RegExp(`create\\s+policy\\s+${policy}[\\s\\S]*?on\\s+public\\.${table}\\s+for\\s+${operation}\\s+to\\s+public`, 'i');
  ok(pattern.test(migration), `${table}.${policy} ${operation} policy missing`);
}

function currentDhqUsernameHelper(source, label) {
  const match = source.match(/create\s+or\s+replace\s+function\s+public\.current_dhq_username\(\)[\s\S]*?\$\$;/i);
  ok(match, `${label}: current_dhq_username helper missing`);
  return match[0];
}

console.log('\nRLS contract tests');

group('owner identity');

test('RLS uses one canonical username claim helper', () => {
  const helper = currentDhqUsernameHelper(migration, 'base migration');
  const hardeningHelper = currentDhqUsernameHelper(identityHardeningMigration, 'identity hardening migration');
  hasEvery(helper, [
    'create or replace function public.current_dhq_username()',
    "auth.jwt() -> 'app_metadata' ->> 'sleeper_username'",
    "auth.jwt() ->> 'sleeper_username'",
  ], 'username helper');
  ok(!helper.includes("auth.jwt() ->> 'sub'"), 'username helper must not treat JWT sub as a Sleeper username');
  hasEvery(hardeningHelper, [
    'create or replace function public.current_dhq_username()',
    "auth.jwt() -> 'app_metadata' ->> 'sleeper_username'",
    "auth.jwt() ->> 'sleeper_username'",
  ], 'identity hardening helper');
  ok(!hardeningHelper.includes("auth.jwt() ->> 'sub'"), 'identity hardening helper must not reintroduce sub fallback');
});

group('client-writable');

test('personal data tables are writable only for the current owner', () => {
  [
    ['users', 'users_own'],
    ['calendar_events', 'calendar_own'],
    ['earnings', 'earnings_own'],
    ['fa_targets', 'fa_targets_own'],
    ['ai_analysis', 'ai_analysis_own'],
    ['owner_dna', 'owner_dna_own'],
    ['draft_boards', 'draft_boards_own'],
    ['field_log', 'field_log_own'],
    ['ai_chat_memory', 'ai_chat_memory_own'],
    ['gm_strategy', 'gm_strategy_own'],
    ['league_docs', 'league_docs_own'],
    ['player_tags', 'player_tags_own'],
  ].forEach(([table, policy]) => hasPolicy(table, policy, 'all'));
});

test('messages keep operation-specific sender and recipient rules', () => {
  hasPolicy('messages', 'messages_select', 'select');
  hasPolicy('messages', 'messages_insert', 'insert');
  hasPolicy('messages', 'messages_update', 'update');
  hasEvery(migration, [
    'public.current_dhq_username() in (from_username, to_username)',
    'from_username = public.current_dhq_username()',
    'to_username = public.current_dhq_username()',
  ], 'message ownership rules');
});

test('analytics is client-insert-only, not client-readable', () => {
  hasEvery(migration, [
    'alter table if exists public.analytics_events enable row level security;',
    'create policy analytics_events_insert_own',
    'on public.analytics_events for insert to public',
  ], 'analytics insert-only policy');
  hasEvery(analyticsPermissionMigration, [
    'revoke all on table public.analytics_events from anon, authenticated',
    'grant insert on table public.analytics_events to anon, authenticated',
    'grant select, insert, update, delete on table public.analytics_events to service_role',
  ], 'analytics insert-only grants');
  ok(!/grant\s+(select|update|delete)[\s\S]*analytics_events\s+to\s+(anon|authenticated)/i.test(analyticsPermissionMigration), 'analytics_events should not grant client read/update/delete privileges');
  ok(!/create\s+policy\s+analytics_events_select/i.test(migration), 'analytics_events should not expose client select policy');
  ok(analyticsMigration.includes('alter table public.analytics_events disable row level security;'), 'test fixture should still catch the old unsafe base migration');
});

group('server-only');

test('token and rate-limit tables are not browser-writable', () => {
  hasEvery(migration, [
    'create policy ai_rate_limits_read_own',
    'on public.ai_rate_limits for select to public',
    'create policy yahoo_tokens_deny_all',
    'on public.yahoo_tokens for all to public',
    'using (false)',
    'with check (false)',
  ], 'server-only policies');
  ok(!/on\s+public\.ai_rate_limits\s+for\s+(insert|update|delete|all)\s+to\s+public/i.test(migration), 'ai_rate_limits must not be browser-writable');
});

test('Yahoo token sessions are owner-bound for server lookup', () => {
  hasEvery(identityHardeningMigration, [
    'add column if not exists owner_key text',
    'create index if not exists yahoo_tokens_owner_key_idx',
    'on public.yahoo_tokens(owner_key)',
  ], 'yahoo token owner binding');
});

group('docs');

test('SECURITY-RLS.md documents client-writable and server-only ownership', () => {
  [
    'Client-Writable Tables',
    'Server-Only Tables',
    '`analytics_events` | insert own events only; no client read/update/delete',
    '`yahoo_tokens` | none',
    '`app_users` | read own account row only',
    '`subscriptions` | read own subscription rows only',
  ].forEach(fragment => ok(securityDoc.includes(fragment), `missing doc fragment: ${fragment}`));
});

test('RLS lockdown repairs earlier disabled field_log state', () => {
  ok(fieldLogRepair.includes('alter table public.field_log disable row level security;'), 'field_log repair fixture should still show prior disabled state');
  hasEvery(migration, [
    'alter table if exists public.field_log enable row level security;',
    'drop policy if exists "Users manage own field_log" on public.field_log;',
    'create policy field_log_own',
  ], 'field_log lockdown');
  ok(cleanupMigration.includes('drop policy if exists "Users manage own field_log" on public.field_log;'), 'cleanup migration must drop legacy field_log policy');
});

console.log('\n');
if (failures.length) {
  console.log(failures.join('\n'));
  console.log('');
}
const status = failed > 0 ? 'FAIL' : 'PASS';
console.log(`${status} ${passed + failed} tests - ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
