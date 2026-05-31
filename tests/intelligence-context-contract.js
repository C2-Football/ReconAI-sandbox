#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const source = fs.readFileSync(path.join(ROOT, 'shared', 'intelligence-context.js'), 'utf8');

const ctx = {
  console,
  globalThis: {},
  URLSearchParams,
};
ctx.window = ctx;
ctx.globalThis = ctx;
ctx.App = {};
vm.createContext(ctx);
vm.runInContext(source, ctx);

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

function ok(value, label) {
  if (!value) throw new Error(label || 'expected truthy value');
}

function eq(actual, expected, label) {
  if (actual !== expected) throw new Error(`${label || 'value'}: expected ${expected}, got ${actual}`);
}

const Intelligence = ctx.App.Intelligence;

console.log('\nIntelligence context contract');

test('exports versioned App.Intelligence namespace', () => {
  ok(Intelligence, 'App.Intelligence missing');
  eq(Intelligence.VERSION, 'intelligence-context-v1', 'version');
  [
    'buildLeagueProfile',
    'buildFormatBadges',
    'buildPlayerFormatReasons',
    'buildPlayerContext',
    'buildTeamContext',
    'getSourceRegistry',
    'getSourceDefinition',
    'sourceFreshness',
    'buildSourceEvidence',
    'sourceSummaryForEvidence',
    'buildFantasyCalcRequest',
    'normalizeFantasyCalcRow',
    'buildFantasyCalcSnapshot',
    'fetchFantasyCalcSnapshot',
    'buildLeagueBehaviorBaselines',
    'buildOwnerBehaviorProfile',
    'evaluateBehaviorTradeFit',
    'createRecommendation',
    'buildWaiverRecommendation',
    'buildTradeRecommendation',
    'buildRosterRecommendation',
    'buildBehavioralRecommendation',
    'recommendationWhyLines',
    'buildWhyView',
    'buildRecommendationContract',
    'publishRecommendations',
    'buildContextBlock',
  ].forEach(fn => {
    eq(typeof Intelligence[fn], 'function', `${fn} export`);
  });
});

test('source registry normalizes feed evidence and freshness', () => {
  const registry = Intelligence.getSourceRegistry();
  ok(registry.sleeper, 'missing Sleeper source');
  ok(registry.fantasycalc, 'missing FantasyCalc source');
  ok(registry.pff_csv, 'missing PFF CSV source');

  const marketEvidence = Intelligence.buildSourceEvidence({
    source: 'FantasyCalc',
    signal: 'market_value',
    value: 4200,
    updatedAt: '2026-05-15T00:00:00Z',
    now: '2026-05-15T12:00:00Z',
  });
  eq(marketEvidence.sourceKey, 'fantasycalc', 'FantasyCalc key');
  eq(marketEvidence.stale, false, 'FantasyCalc freshness');
  eq(marketEvidence.licensePosture, 'public_endpoint_cache_with_attribution', 'FantasyCalc license posture');

  const staleLine = Intelligence.buildSourceEvidence({
    sourceKey: 'odds_api',
    signal: 'spread',
    value: -3.5,
    updatedAt: '2026-05-15T00:00:00Z',
    now: '2026-05-16T12:00:00Z',
  });
  eq(staleLine.stale, true, 'Odds API stale flag');
  ok(Intelligence.sourceSummaryForEvidence([marketEvidence, staleLine]).includes('FantasyCalc'), 'source summary');
});

test('FantasyCalc adapter builds league-specific snapshots', () => {
  const profile = Intelligence.buildLeagueProfile({
    type: 'dynasty',
    league: {
      league_id: 'fc',
      scoring_settings: { rec: 1 },
      roster_positions: ['QB', 'RB', 'WR', 'TE', 'SUPER_FLEX', 'BN'],
    },
    rosters: Array.from({ length: 12 }, (_, i) => ({ roster_id: i + 1 })),
  });
  const request = Intelligence.buildFantasyCalcRequest({ profile });
  ok(request.url.includes('isDynasty=true'), 'dynasty param');
  ok(request.url.includes('numQbs=2'), 'numQbs param');
  ok(request.url.includes('numTeams=12'), 'team count param');
  ok(request.url.includes('ppr=1'), 'ppr param');

  const row = Intelligence.normalizeFantasyCalcRow({
    player: { id: 1, name: 'Market QB', sleeperId: '4984', position: 'QB', maybeTeam: 'BUF', maybeAge: 30 },
    value: 10389,
    overallRank: 1,
    positionRank: 1,
    trend30Day: 89,
  }, { fetchedAt: '2026-05-15T00:00:00Z' });
  eq(row.sleeperId, '4984', 'normalized Sleeper id');
  eq(row.evidence[0].sourceKey, 'fantasycalc', 'normalized source key');

  const snapshot = Intelligence.buildFantasyCalcSnapshot({
    request,
    fetchedAt: '2026-05-15T00:00:00Z',
    rows: [
      { player: { id: 1, name: 'Market QB', sleeperId: '4984', position: 'QB' }, value: 10389, overallRank: 1, positionRank: 1 },
      { player: { id: 2, name: '2026 Pick 1.01', position: 'PICK' }, value: 7000, overallRank: 12, positionRank: 1 },
    ],
  });
  eq(snapshot.count, 2, 'snapshot count');
  eq(snapshot.playerCount, 1, 'snapshot player count');
  eq(snapshot.pickCount, 1, 'snapshot pick count');
  ok(snapshot.valuesBySleeperId['4984'], 'snapshot index');
  eq(snapshot.evidence[0].sourceKey, 'fantasycalc', 'snapshot evidence source');
});

test('buildLeagueProfile captures SF, TEP, IDP, and scoring confidence', () => {
  const profile = Intelligence.buildLeagueProfile({
    platform: 'sleeper',
    type: 'dynasty',
    league: {
      league_id: '123',
      name: 'Psycho League',
      scoring_settings: {
        rec: 1,
        pass_td: 6,
        bonus_rec_te: 0.5,
        rush_fd: 0.25,
        idp_sack: 4,
      },
      roster_positions: ['QB', 'RB', 'RB', 'WR', 'WR', 'TE', 'FLEX', 'SUPER_FLEX', 'DL', 'LB', 'DB', 'BN', 'IR'],
    },
    rosters: [{ roster_id: 1 }, { roster_id: 2 }],
  });

  eq(profile.schemaVersion, 'intelligence-context-v1', 'schema');
  eq(profile.platform, 'sleeper', 'platform');
  eq(profile.teams, 2, 'team count');
  eq(profile.scoring.label, 'full-ppr', 'ppr label');
  eq(profile.scoring.passTd, 6, 'pass td');
  eq(profile.scoring.tePremium, 1.5, 'te premium');
  eq(profile.scoring.idp, true, 'idp');
  eq(profile.scoring.firstDownBonus, true, 'first down');
  eq(profile.roster.superflexSlots, 1, 'superflex slots');
  eq(profile.roster.idpSlots, 3, 'idp slots');
  ok(profile.formatTags.includes('superflex'), 'missing superflex tag');
  ok(profile.formatTags.includes('custom-scoring'), 'missing custom-scoring tag');
  ok(profile.market.fantasyCalcCompatibility, 'missing market compatibility');
  eq(profile.confidence.score, 1, 'confidence');
});

test('buildLeagueProfile maps Sleeper numeric league types', () => {
  const redraft = Intelligence.buildLeagueProfile({
    platform: 'sleeper',
    league: {
      league_id: '1356311207652360192',
      name: 'CTB The One - Year XIV',
      settings: { type: 0 },
      scoring_settings: { rec: 0.5, def_td: 6 },
      roster_positions: ['QB', 'RB', 'RB', 'WR', 'WR', 'TE', 'FLEX', 'FLEX', 'K', 'DEF', 'BN', 'BN'],
      total_rosters: 12,
    },
    rosters: [{ roster_id: 1 }, { roster_id: 2 }],
  });

  eq(redraft.type, 'redraft', 'type 0');
  ok(redraft.formatTags.includes('redraft'), 'missing redraft tag');
  ok(redraft.formatTags.includes('dst'), 'missing dst tag');
  ok(redraft.formatTags.includes('1qb'), 'missing 1qb tag');
  eq(redraft.scoring.label, 'half-ppr', 'half ppr');
  eq(redraft.scoring.dst, true, 'D/ST scoring');

  const keeper = Intelligence.buildLeagueProfile({
    platform: 'sleeper',
    league: {
      league_id: 'keeper',
      settings: { type: 1 },
      scoring_settings: { rec: 1 },
      roster_positions: ['QB', 'RB', 'WR', 'TE', 'BN'],
      total_rosters: 10,
    },
    rosters: [{ roster_id: 1 }],
  });
  eq(keeper.type, 'keeper', 'type 1');

  const dynasty = Intelligence.buildLeagueProfile({
    platform: 'sleeper',
    league: {
      league_id: 'dynasty',
      settings: { type: 2 },
      scoring_settings: { rec: 1 },
      roster_positions: ['QB', 'RB', 'WR', 'TE', 'BN'],
      total_rosters: 12,
    },
    rosters: [{ roster_id: 1 }],
  });
  eq(dynasty.type, 'dynasty', 'type 2');
});

test('buildFormatBadges and player reasons explain format-driven value changes', () => {
  const profile = Intelligence.buildLeagueProfile({
    type: 'dynasty',
    teams: 12,
    league: {
      league_id: 'sf-tep',
      scoring_settings: { rec: 1, bonus_rec_te: 0.5 },
      roster_positions: ['QB', 'RB', 'WR', 'TE', 'FLEX', 'SUPER_FLEX', 'BN'],
    },
    rosters: [{ roster_id: 1 }],
  });
  const badges = Intelligence.buildFormatBadges(profile);
  ok(badges.some(b => b.code === 'format_qb_premium'), 'missing QB premium badge');
  ok(badges.some(b => b.code === 'format_te_premium'), 'missing TE premium badge');
  const qbReasons = Intelligence.buildPlayerFormatReasons({ pos: 'QB', profile });
  const teReasons = Intelligence.buildPlayerFormatReasons({ pos: 'TE', profile });
  ok(qbReasons.some(r => r.code === 'format_qb_premium'), 'missing QB reason');
  ok(teReasons.some(r => r.code === 'format_te_premium'), 'missing TE reason');
});

test('buildLeagueProfile lowers confidence when league facts are missing', () => {
  const profile = Intelligence.buildLeagueProfile({ league: {} });
  ok(profile.confidence.score < 1, 'confidence should be reduced');
  ok(profile.confidence.reasons.includes('missing_roster_positions'), 'missing roster reason');
  ok(profile.confidence.reasons.includes('missing_scoring_settings'), 'missing scoring reason');
});

test('createRecommendation preserves reason codes, evidence, and confidence', () => {
  const rec = Intelligence.createRecommendation({
    type: 'waiver',
    subject: { id: '9509', name: 'Bijan Robinson', pos: 'RB' },
    action: 'add',
    score: 91,
    reasons: [
      { code: 'roster_need', detail: 'Would become your RB2 in this league context.' },
      'market_rising',
    ],
    evidence: [
      { source: 'league.roster', signal: 'rb_gap', value: true, freshness: 'live' },
      { source: 'FantasyCalc', signal: 'trend30Day', value: 250, freshness: 'daily' },
    ],
  });

  eq(rec.schemaVersion, 'intelligence-context-v1', 'schema');
  eq(rec.confidence, 'high', 'confidence');
  eq(rec.reasonCodes[0], 'roster_need', 'first reason');
  eq(rec.reasons[1].label, 'Market rising', 'reason label');
  eq(rec.evidence.length, 2, 'evidence count');
  ok(rec.evidence.some(ev => ev.sourceKey === 'fantasycalc'), 'FantasyCalc evidence source key');
});

test('rankRecommendations orders by score then confidence', () => {
  const recs = [
    Intelligence.createRecommendation({ subject: { name: 'A' }, score: 60, confidence: 'medium', evidence: [{ source: 'x' }] }),
    Intelligence.createRecommendation({ subject: { name: 'B' }, score: 90, confidence: 'low', evidence: [{ source: 'x' }] }),
    Intelligence.createRecommendation({ subject: { name: 'C' }, score: 60, confidence: 'high', evidence: [{ source: 'x' }] }),
  ];
  const ranked = Intelligence.rankRecommendations(recs);
  eq(ranked[0].subject.name, 'B', 'top score first');
  eq(ranked[1].subject.name, 'C', 'confidence tiebreak');
});

test('shared factories emit recommendation payloads with evidence and why lines', () => {
  const profile = Intelligence.buildLeagueProfile({
    type: 'dynasty',
    league: {
      league_id: 'factory',
      scoring_settings: { rec: 0.5 },
      roster_positions: ['QB', 'RB', 'WR', 'TE', 'SUPER_FLEX', 'BN'],
    },
    rosters: [{ roster_id: 1 }, { roster_id: 2 }],
  });
  const waiver = Intelligence.buildWaiverRecommendation({
    pid: '1',
    player: { full_name: 'Test Runner', position: 'RB' },
    pos: 'RB',
    profile,
    dhq: 2400,
    ppg: 9.2,
    fit: { short: 'Thin', need: { urgency: 'thin' }, score: 3 },
    faab: { lo: 8, hi: 15 },
    clickTarget: { type: 'waiver', tab: 'waivers', id: '1' },
  });
  eq(waiver.type, 'waiver', 'waiver type');
  ok(waiver.reasonCodes.includes('roster_need'), 'waiver need reason');
  ok(waiver.reasonCodes.includes('faab_efficiency'), 'waiver faab reason');
  ok(waiver.context?.player?.type === 'player_context', 'waiver player context');
  ok(Intelligence.recommendationWhyLines(waiver, 3).length >= 2, 'waiver why lines');
  const waiverWhy = Intelligence.buildWhyView(waiver, { limit: 3 });
  ok(waiverWhy.lines.length >= 2, 'waiver why view lines');
  ok(waiverWhy.reasonCodes.includes('roster_need'), 'waiver why view reasons');
  const waiverContract = Intelligence.buildRecommendationContract(waiver, { limit: 3, evidenceLimit: 3 });
  eq(waiverContract.type, 'recommendation_contract', 'waiver recommendation contract type');
  eq(waiverContract.clickTarget.tab, 'waivers', 'waiver click target');
  ok(waiverContract.truth.grounded, 'waiver contract must be grounded');
  ok(waiverContract.truth.hasLeagueContext, 'waiver contract must keep league profile');
  ok(waiverContract.truth.hasEvidence, 'waiver contract must expose evidence');
  ok(waiverContract.truth.hasClickTarget, 'waiver contract must expose click target');
  ok(waiverContract.contextChips.some(chip => /Dynasty|Superflex|Half Ppr/i.test(chip)), 'waiver contract format chips');
  ok(waiverContract.sources.length >= 2, 'waiver contract source summary');

  const trade = Intelligence.buildTradeRecommendation({
    partnerName: 'Market Manager',
    userGain: 550,
    likelihood: 64,
    fit: 72,
    confidenceScore: 76,
    profile,
    totals: { give: { total: 3200 }, receive: { total: 3750 } },
    posture: { label: 'Active Buyer' },
    whyAccept: 'They need RB help and this gives them usable production.',
  });
  eq(trade.type, 'trade', 'trade type');
  ok(trade.reasonCodes.includes('owner_behavior'), 'trade behavior reason');
  ok(trade.evidence.some(ev => ev.source === 'Owner DNA'), 'trade owner evidence');

  const behavior = Intelligence.buildBehavioralRecommendation({
    focus: 'trades',
    severity: 'edge',
    confidence: 82,
    title: 'You profit from active trade markets',
    body: 'Trade decision history shows repeatable value capture.',
    profile,
    kpis: { tradeCount: 8, tradeNetDhq: 3200 },
  });
  eq(behavior.type, 'behavioral', 'behavioral type');
  ok(behavior.reasonCodes.includes('behavioral_pattern'), 'behavior pattern reason');
  ok(behavior.evidence.some(ev => ev.source === 'decision-history'), 'behavior evidence');
});

test('player and team contexts produce evidence-backed explain lines', () => {
  const profile = Intelligence.buildLeagueProfile({
    type: 'dynasty',
    league: {
      league_id: 'ctx',
      scoring_settings: { rec: 1, bonus_rec_te: 0.5 },
      roster_positions: ['QB', 'RB', 'WR', 'TE', 'SUPER_FLEX', 'BN'],
    },
    rosters: [{ roster_id: 1 }],
  });
  const playerContext = Intelligence.buildPlayerContext({
    pid: '10',
    player: { full_name: 'Context QB', position: 'QB', team: 'KC', age: 25 },
    profile,
    dhq: 6100,
    ppg: 19.4,
    trend: 22,
    peakYrs: 4,
    valueYrs: 8,
    meta: { source: 'DHQ_FC_BLEND', fcValue: 5600, fcWeight: 30 },
  });
  eq(playerContext.type, 'player_context', 'player context type');
  ok(playerContext.reasonCodes.includes('format_qb_premium'), 'player format reason');
  ok(playerContext.explain.lines.length >= 2, 'player explain lines');
  ok(playerContext.evidence.some(ev => ev.sourceKey === 'fantasycalc'), 'player FantasyCalc evidence');

  const teamContext = Intelligence.buildTeamContext({
    profile,
    roster: { roster_id: 1, owner_id: 'u1', players: ['10', '11'] },
    teamName: 'Context Team',
    playersData: {
      10: { full_name: 'Context QB', position: 'QB' },
      11: { full_name: 'Depth RB', position: 'RB' },
    },
    playerScores: { 10: 6100, 11: 1200 },
    assessment: {
      tier: 'CONTENDER',
      needs: [{ pos: 'RB', urgency: 'thin' }],
      strengths: ['QB'],
      posAssessment: { RB: { grade: 'C', actual: 1, startingReq: 2 } },
    },
  });
  eq(teamContext.type, 'team_context', 'team context type');
  ok(teamContext.reasonCodes.includes('roster_need'), 'team need reason');
  ok(teamContext.reasonCodes.includes('roster_surplus'), 'team surplus reason');
  ok(teamContext.evidence.some(ev => ev.source === 'DHQ'), 'team DHQ evidence');
});

test('behavior helpers derive owner facts, baselines, and trade fit deltas', () => {
  const tradeHistory = [
    {
      season: 2025,
      week: 11,
      roster_ids: [1, 2],
      sides: {
        1: { players: ['a'], picks: [], totalValue: 5200 },
        2: { players: ['b'], picks: [{ season: 2026, round: 1 }], totalValue: 4100 },
      },
      valueDiffPct: 21,
      fairness: 79,
      winner: 1,
    },
    {
      season: 2025,
      week: 13,
      roster_ids: [1, 3],
      sides: {
        1: { players: [], picks: [{ season: 2026, round: 2 }], totalValue: 2800 },
        3: { players: ['c'], picks: [], totalValue: 3300 },
      },
      valueDiffPct: 15,
      fairness: 85,
      winner: 3,
    },
  ];
  const ownerProfiles = {
    1: {
      trades: 2,
      tradesWon: 1,
      tradesLost: 0,
      tradesFair: 1,
      avgValueDiff: 300,
      picksAcquired: 1,
      picksSold: 0,
      weekTiming: { early: 0, mid: 0, late: 2 },
      partners: { 2: 1, 3: 1 },
    },
  };
  const baselines = Intelligence.buildLeagueBehaviorBaselines({
    rosters: [{ roster_id: 1 }, { roster_id: 2 }, { roster_id: 3 }],
    tradeHistory,
    ownerProfiles,
    draftOutcomes: [
      { roster_id: 1, round: 1, isHit: true },
      { roster_id: 1, round: 2, isHit: false },
      { roster_id: 1, round: 3, isStarter: true },
    ],
  });
  ok(baselines.trade.avgTradesPerOwner > 0, 'avg trades baseline');
  const owner = Intelligence.buildOwnerBehaviorProfile({
    rosterId: 1,
    ownerName: 'Behavior Manager',
    ownerProfile: ownerProfiles[1],
    tradeHistory,
    baselines,
    draftOutcomes: [
      { roster_id: 1, round: 1, isHit: true },
      { roster_id: 1, round: 2, isHit: false },
      { roster_id: 1, round: 3, isStarter: true },
    ],
  });
  ok(owner.observedFacts.some(f => f.code === 'trade_volume'), 'trade volume fact');
  ok(owner.inferences.includes('pick-collector'), 'pick collector inference');
  const fit = Intelligence.evaluateBehaviorTradeFit({
    behaviorProfile: owner,
    givePicks: [{ round: 1 }],
    receivePicks: [],
    givePlayers: [],
    receivePlayers: [{ pid: 'a' }],
    userGain: -200,
  });
  ok(fit.acceptanceDelta > 0, 'pick collector offer should increase acceptance');
  ok(fit.reasons.some(r => r.code === 'pick_behavior'), 'pick behavior reason');
});

console.log('\n');
if (failures.length) {
  console.log(failures.join('\n'));
  console.log('');
}
const status = failed > 0 ? 'FAIL' : 'PASS';
console.log(`${status} ${passed + failed} tests - ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
