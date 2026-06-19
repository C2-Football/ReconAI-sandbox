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
  // WS0: browser engines promoted from War Room into dhq-shared
  'startsit-engine.js',
  'weekly-proj.js',
  'nfl-context.js',
  'matchup.js',
  'player-value.js',
  'draft-gameplan.js',
  'alex-voice.js',
  'gm-mode.js',
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

// ── Rookie/prospect CSVs (shared data) ──────────────────────────────────────
// Vendored from dhq-shared/draft-war-room into public/draft-war-room so Vite
// serves them same-origin at <base>/draft-war-room/ — Scout no longer fetches
// rookie data cross-repo from WarRoom@main via jsDelivr.
const DATA_FILES = ['player.csv', 'player-enrichment.csv', 'data/mock_draft_db.csv'];
const DATA_SOURCE = path.join(SOURCE, 'draft-war-room');
const DATA_TARGET = path.join(ROOT, 'public', 'draft-war-room');

if (fs.existsSync(DATA_SOURCE)) {
  for (const file of DATA_FILES) {
    const src = path.join(DATA_SOURCE, file);
    if (!fs.existsSync(src)) {
      console.error(`[sync-shared] Missing shared data file in dhq-shared: ${src}`);
      process.exit(1);
    }
    const dest = path.join(DATA_TARGET, file);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
  }
  console.log(`[sync-shared] Vendored ${DATA_FILES.length} rookie CSVs into public/draft-war-room/`);
} else if (DATA_FILES.every(f => fs.existsSync(path.join(DATA_TARGET, f)))) {
  console.log('[sync-shared] No draft-war-room/ in source; keeping existing vendored CSVs');
} else {
  console.error('[sync-shared] Missing rookie CSVs in source and locally');
  process.exit(1);
}
