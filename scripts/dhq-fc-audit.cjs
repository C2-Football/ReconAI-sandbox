#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const REPO = path.resolve(__dirname, '..');
const DEFAULT_SNAPSHOT = path.join(REPO, 'tests/fixtures/psycho-league-snapshot.json');
const DEFAULT_OUT_DIR = path.join(REPO, 'reports');
const OFFENSE = new Set(['QB', 'RB', 'WR', 'TE']);

function parseArgs(argv) {
  const args = {
    snapshot: DEFAULT_SNAPSHOT,
    outDir: DEFAULT_OUT_DIR,
    teams: null,
    numQbs: null,
    ppr: null,
  };
  for (let i = 2; i < argv.length; i++) {
    const key = argv[i];
    const next = argv[i + 1];
    if (key === '--snapshot') args.snapshot = path.resolve(next), i++;
    else if (key === '--out-dir') args.outDir = path.resolve(next), i++;
    else if (key === '--teams') args.teams = Number(next), i++;
    else if (key === '--num-qbs') args.numQbs = Number(next), i++;
    else if (key === '--ppr') args.ppr = Number(next), i++;
  }
  return args;
}

function csvCell(value) {
  if (value == null) return '';
  const s = String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function writeCsv(file, rows) {
  const headers = Object.keys(rows[0] || {});
  const body = [
    headers.map(csvCell).join(','),
    ...rows.map(row => headers.map(h => csvCell(row[h])).join(',')),
  ].join('\n');
  fs.writeFileSync(file, body + '\n');
}

function rankBy(rows, key, rankKey, filterFn = () => true) {
  rows
    .filter(filterFn)
    .sort((a, b) => (b[key] || 0) - (a[key] || 0))
    .forEach((row, idx) => { row[rankKey] = idx + 1; });
}

function spearman(rows, aKey, bKey) {
  const usable = rows.filter(r => Number.isFinite(r[aKey]) && Number.isFinite(r[bKey]));
  const n = usable.length;
  if (n < 3) return null;
  const d2 = usable.reduce((sum, row) => sum + Math.pow(row[aKey] - row[bKey], 2), 0);
  return 1 - (6 * d2) / (n * (n * n - 1));
}

function summarize(rows, pos = null) {
  const slice = pos ? rows.filter(r => r.position === pos) : rows;
  const n = slice.length;
  const avgAbsOverall = n ? slice.reduce((s, r) => s + Math.abs(r.overall_rank_delta), 0) / n : 0;
  const avgAbsPos = n ? slice.reduce((s, r) => s + Math.abs(r.position_rank_delta), 0) / n : 0;
  const avgValuePct = n ? slice.reduce((s, r) => s + Math.abs(r.value_delta_pct), 0) / n : 0;
  return {
    n,
    rhoOverall: spearman(slice, 'dhq_offense_rank', 'fc_offense_rank'),
    rhoPos: spearman(slice, 'dhq_position_rank', 'fc_position_rank'),
    avgAbsOverall,
    avgAbsPos,
    avgValuePct,
  };
}

function table(rows, cols) {
  const header = `| ${cols.map(c => c.label).join(' | ')} |`;
  const sep = `| ${cols.map(() => '---').join(' | ')} |`;
  const body = rows.map(row => `| ${cols.map(c => csvCell(c.format ? c.format(row[c.key], row) : row[c.key])).join(' | ')} |`);
  return [header, sep, ...body].join('\n');
}

function parsePickName(name) {
  const match = String(name || '').match(/^(\d{4}) Pick (\d+)\.(\d{2})$/);
  if (!match) return null;
  return {
    season: Number(match[1]),
    round: Number(match[2]),
    slot: Number(match[3]),
  };
}

async function main() {
  const args = parseArgs(process.argv);
  const snap = JSON.parse(fs.readFileSync(args.snapshot, 'utf8'));
  const meta = snap.meta || {};
  const teams = args.teams || meta.totalTeams || 16;
  const numQbs = args.numQbs || (meta.isSF ? 2 : 1);
  const ppr = args.ppr ?? meta.ppr ?? 0.5;
  const fcUrl = `https://api.fantasycalc.com/values/current?isDynasty=true&numQbs=${numQbs}&numTeams=${teams}&ppr=${ppr}`;
  const fcData = await fetch(fcUrl).then(r => {
    if (!r.ok) throw new Error(`FantasyCalc ${r.status}`);
    return r.json();
  });

  const playerNames = snap.playerNames || {};
  const allDhqRows = Object.entries(snap.playerScores || {})
    .map(([pid, dhq]) => {
      const metaRow = snap.playerMeta?.[pid] || {};
      return {
        sleeper_id: pid,
        name: playerNames[pid] || pid,
        position: metaRow.pos,
        dhq_value: dhq || 0,
        meta: metaRow,
      };
    })
    .filter(row => OFFENSE.has(row.position));

  rankBy(allDhqRows, 'dhq_value', 'dhq_offense_rank');
  ['QB', 'RB', 'WR', 'TE'].forEach(pos => rankBy(allDhqRows, 'dhq_value', 'dhq_position_rank', row => row.position === pos));
  const dhqById = new Map(allDhqRows.map(row => [String(row.sleeper_id), row]));

  const fcPlayers = fcData
    .filter(row => OFFENSE.has(row.player?.position) && row.player?.sleeperId)
    .map(row => ({
      sleeper_id: String(row.player.sleeperId),
      name: row.player.name,
      position: row.player.position,
      nfl_team: row.player.maybeTeam || '',
      age: row.player.maybeAge ?? '',
      fc_value: row.value || 0,
      fc_overall_rank: row.overallRank || null,
      fc_position_rank: row.positionRank || null,
      fc_trend_30d: row.trend30Day ?? '',
    }));

  rankBy(fcPlayers, 'fc_value', 'fc_offense_rank');
  ['QB', 'RB', 'WR', 'TE'].forEach(pos => rankBy(fcPlayers, 'fc_value', 'fc_position_rank_calc', row => row.position === pos));

  const rows = fcPlayers
    .filter(row => dhqById.has(row.sleeper_id))
    .map(row => {
      const dhq = dhqById.get(row.sleeper_id);
      const valueDelta = (dhq.dhq_value || 0) - (row.fc_value || 0);
      return {
        sleeper_id: row.sleeper_id,
        name: row.name,
        position: row.position,
        nfl_team: row.nfl_team,
        age: row.age,
        fc_offense_rank: row.fc_offense_rank,
        dhq_offense_rank: dhq.dhq_offense_rank,
        overall_rank_delta: dhq.dhq_offense_rank - row.fc_offense_rank,
        fc_position_rank: row.fc_position_rank,
        dhq_position_rank: dhq.dhq_position_rank,
        position_rank_delta: dhq.dhq_position_rank - row.fc_position_rank,
        fc_value: row.fc_value,
        dhq_value: dhq.dhq_value,
        value_delta: valueDelta,
        value_delta_pct: row.fc_value ? +(valueDelta / row.fc_value * 100).toFixed(1) : '',
        fc_trend_30d: row.fc_trend_30d,
        dhq_source: dhq.meta.source || '',
        ppg: dhq.meta.ppg ?? '',
        starter_seasons: dhq.meta.starterSeasons ?? '',
        league_starter_pool: dhq.meta.leagueStarterPool ?? '',
        replacement_line_ppg: dhq.meta.replacementLinePPG ?? '',
        age_curve_phase: dhq.meta.ageCurvePhase || '',
        fc_weight: dhq.meta.fcWeight ?? '',
      };
    })
    .sort((a, b) => a.fc_offense_rank - b.fc_offense_rank);

  fs.mkdirSync(args.outDir, { recursive: true });
  const csvPath = path.join(args.outDir, 'dhq-fantasycalc-offense-comparison.csv');
  writeCsv(csvPath, rows);

  const fcPicks = fcData
    .filter(row => row.player?.position === 'PICK')
    .map(row => ({ ...parsePickName(row.player.name), name: row.player.name, fc_value: row.value, fc_rank: row.overallRank }))
    .filter(row => row.season && row.round && row.slot);
  const currentPickRows = fcPicks
    .filter(row => row.season === Number(meta.season || new Date().getFullYear()))
    .map(row => {
      const pickNo = (row.round - 1) * teams + row.slot;
      const dhq = snap.dhqPickValues?.[pickNo]?.value || '';
      return {
        pick: row.name,
        fc_value: row.fc_value,
        dhq_value: dhq,
        delta: dhq === '' ? '' : dhq - row.fc_value,
        fc_rank: row.fc_rank,
      };
    })
    .filter(row => row.dhq_value !== '')
    .slice(0, teams * 2);

  const summary = summarize(rows);
  const byPos = ['QB', 'RB', 'WR', 'TE'].map(pos => ({ position: pos, ...summarize(rows, pos) }));
  const under = [...rows].sort((a, b) => b.overall_rank_delta - a.overall_rank_delta).slice(0, 15);
  const over = [...rows].sort((a, b) => a.overall_rank_delta - b.overall_rank_delta).slice(0, 15);
  const top50 = rows.slice(0, 50);

  const fmt = n => Number.isFinite(n) ? n.toFixed(2) : 'n/a';
  const fmt1 = n => Number.isFinite(n) ? n.toFixed(1) : 'n/a';
  const cols = [
    { key: 'name', label: 'Player' },
    { key: 'position', label: 'Pos' },
    { key: 'fc_offense_rank', label: 'FC Off' },
    { key: 'dhq_offense_rank', label: 'DHQ Off' },
    { key: 'overall_rank_delta', label: 'Delta' },
    { key: 'fc_value', label: 'FC' },
    { key: 'dhq_value', label: 'DHQ' },
  ];

  const md = `# DHQ vs FantasyCalc Offensive Audit

Generated: ${new Date().toISOString()}

Snapshot: \`${path.relative(REPO, args.snapshot)}\` (${meta.exportedAt || 'unknown export time'})

FantasyCalc query: ${fcUrl}

## Executive Read

- Matched ${rows.length} offensive players against current FantasyCalc.
- Overall offensive-rank Spearman: ${fmt(summary.rhoOverall)}.
- Average absolute offensive-rank gap: ${fmt1(summary.avgAbsOverall)} spots.
- Average absolute value gap: ${fmt1(summary.avgValuePct)}%.
- Full player comparison: \`${path.relative(REPO, csvPath)}\`.

## Position Groups

${table(byPos, [
    { key: 'position', label: 'Pos' },
    { key: 'n', label: 'Matched' },
    { key: 'rhoOverall', label: 'Overall Rho', format: fmt },
    { key: 'rhoPos', label: 'Pos Rho', format: fmt },
    { key: 'avgAbsOverall', label: 'Avg Off Gap', format: fmt1 },
    { key: 'avgAbsPos', label: 'Avg Pos Gap', format: fmt1 },
    { key: 'avgValuePct', label: 'Avg Value Gap %', format: fmt1 },
  ])}

## Top FantasyCalc Offensive Board

${table(top50.slice(0, 30), cols)}

## Largest DHQ Undervalues vs FantasyCalc

Positive delta means DHQ ranks the player later than FantasyCalc.

${table(under, cols)}

## Largest DHQ Overvalues vs FantasyCalc

Negative delta means DHQ ranks the player earlier than FantasyCalc.

${table(over, cols)}

## Pick Check

${currentPickRows.length ? table(currentPickRows.slice(0, 24), [
    { key: 'pick', label: 'Pick' },
    { key: 'fc_rank', label: 'FC Rank' },
    { key: 'fc_value', label: 'FC' },
    { key: 'dhq_value', label: 'DHQ' },
    { key: 'delta', label: 'Delta' },
  ]) : 'No current-season pick rows matched the snapshot pick table.'}

## Readout

- QB context is the highest-priority model check. The comparison should treat top-${teams * (numQbs >= 2 ? 2 : 1)} QBs as the league starter pool in this format, not just the elite market tier.
- RB/WR gaps are mostly depth and rookie-neighborhood issues. When a player is ranked much lower by DHQ, inspect whether production gating is suppressing market rookies or young role bets too aggressively.
- TE has the largest tendency to drift because small PPG differences create unstable tiers. Keep TE scarcity tied to actual starter demand, but avoid letting low-volume TE production dominate.
- FantasyCalc does not return kickers in this endpoint. Kicker stress testing needs the DHQ lab script with Sleeper stats plus custom scoring.
`;

  const mdPath = path.join(args.outDir, 'dhq-fantasycalc-offense-audit.md');
  fs.writeFileSync(mdPath, md);
  console.log(`Wrote ${path.relative(process.cwd(), csvPath)}`);
  console.log(`Wrote ${path.relative(process.cwd(), mdPath)}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
