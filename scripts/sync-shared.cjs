#!/usr/bin/env node
// Vendor the shared browser-engine modules into ReconAI's shared/ for local dev
// + deploy. Canonical source is the neutral C2-Football/dhq-shared repo — checked
// out as a sibling ../dhq-shared locally, or pointed at via $SHARED_SOURCE in CI.
//
// ReconAI no longer authors these 30 modules in-place: they are vendored
// (gitignored) so dhq-shared stays the single source of truth. The Scout-only
// modules that also live in shared/ (dev-preview-config.js, data-cache.js,
// season-calendar.js, roster-snapshot.js, league-memory.js) stay tracked here.
//
// IMPORTANT: unlike War Room's sync, this does NOT wipe shared/ — it overwrites
// only the 30 vendored files in place, leaving the Scout-owned modules untouched.

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const TARGET = path.join(ROOT, 'shared');

// Keep in lockstep with C2-Football/dhq-shared/manifest.json and War Room's
// scripts/sync-reconai-shared.cjs FILES list.
const FILES = [
  'app-config.js',
  'bug-capture.js',
  'constants.js',
  'utils.js',
  'storage.js',
  'event-bus.js',
  'platform-provider.js',
  'sleeper-api.js',
  'espn-api.js',
  'mfl-api.js',
  'yahoo-api.js',
  'supabase-client.js',
  'tier.js',
  'pick-value-model.js',
  'dhq-providers.js',
  'dhq-core.js',
  'intelligence-context.js',
  'dhq-engine.js',
  'nfl-fit.js',
  'team-assess.js',
  'analytics-engine.js',
  'dhq-ai.js',
  'assistant-tutorial.js',
  'ai-dispatch.js',
  'strategy.js',
  'trade-engine.js',
  'mock-engine.js',
  'gm-engine.js',
  'player-modal.js',
  'rookie-data.js',
];

function findSourceDir() {
  const candidates = [
    process.env.SHARED_SOURCE,
    path.resolve(ROOT, '..', 'dhq-shared'),
  ].filter(Boolean);

  return candidates.find(candidate => fs.existsSync(candidate)) || null;
}

function hasLocalCopies() {
  return FILES.every(file => fs.existsSync(path.join(TARGET, file)));
}

const SOURCE = findSourceDir();

if (!SOURCE) {
  if (hasLocalCopies()) {
    console.log('[sync-shared] dhq-shared checkout unavailable; using existing shared/ copies');
    process.exit(0);
  }
  console.error('[sync-shared] Missing dhq-shared source and local shared/ copies');
  process.exit(1);
}

fs.mkdirSync(TARGET, { recursive: true });

for (const file of FILES) {
  const src = path.join(SOURCE, file);
  if (!fs.existsSync(src)) {
    console.error(`[sync-shared] Missing shared file in dhq-shared: ${src}`);
    process.exit(1);
  }
  fs.copyFileSync(src, path.join(TARGET, file));
}

console.log(`[sync-shared] Vendored ${FILES.length} shared modules from dhq-shared into shared/`);
