// ══════════════════════════════════════════════════════════════════
// js/today-cards.js — Adaptive "Today" instrument panel.
// Holds the full KPI card catalog; a rules-based relevance selector reads
// the user's situation (ctx) and surfaces only the top 2-3 cards that
// matter right now. No user config. Each card = { key, title, tieClass,
// relevance(ctx)->score (0=hide), render(ctx)->html }. Built once per
// renderWarRoomBrief via window.TodayCards.{buildCtx,renderPanel}.
// Phase 1: rules-based selection + 6 cards. AI nudge + chat-summon = Phase 2.
// Loaded as a module (main.js) — communicates only via window.* globals.
// ══════════════════════════════════════════════════════════════════

function _tcSafe(fn) { try { return fn(); } catch { return null; } }
function _tcEsc(s) {
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
function _tcHealthCol(h) { h = Number(h) || 0; return h >= 80 ? 'var(--green)' : h >= 65 ? 'var(--accent)' : h >= 50 ? 'var(--amber)' : 'var(--red)'; }
function _tcGradeRank(g) { return ({ A: 0, B: 1, C: 2, D: 3, F: 4 })[g] != null ? ({ A: 0, B: 1, C: 2, D: 3, F: 4 })[g] : 2; }
function _tcOwnerName(ctx, rid) {
  const S = ctx.S || {};
  const r = (S.rosters || []).find(x => x.roster_id === rid);
  const u = (S.leagueUsers || S.users || []).find(x => x.user_id === r?.owner_id);
  return u?.metadata?.team_name || u?.display_name || u?.username || ('Team ' + rid);
}
function _tcCard(opts) {
  const rows = (opts.rows || []).map(r => `<div class="sac-row"><span>${_tcEsc(r.label)}</span><strong${r.color ? ` style="color:${r.color}"` : ''}>${_tcEsc(r.value)}</strong></div>`).join('');
  return `<div class="scout-adaptive-card"><span class="scout-kicker">${_tcEsc(opts.kicker)}</span><h3${opts.titleColor ? ` style="color:${opts.titleColor}"` : ''}>${_tcEsc(opts.title)}</h3>${rows}</div>`;
}

// ── Shared situation context — built once, every engine call guarded ──
function _tcBuildCtx(S, roster, league, phase, assessment) {
  const myRid = roster ? roster.roster_id : null;
  const all = _tcSafe(() => window.assessAllTeamsFromGlobal()) || [];
  const ranked = [...all].sort((a, b) => (b.healthScore || 0) - (a.healthScore || 0));
  const rank = (myRid != null) ? (ranked.findIndex(a => a.rosterId === myRid) + 1) : 0;
  const phaseStr = phase?.phase || '';
  const tagCounts = {
    trade: _tcSafe(() => window.getPlayersByTag('trade').length) || 0,
    cut: _tcSafe(() => window.getPlayersByTag('cut').length) || 0,
    watch: _tcSafe(() => window.getPlayersByTag('watch').length) || 0,
    untouchable: _tcSafe(() => window.getPlayersByTag('untouchable').length) || 0,
  };
  return {
    S, roster, league, myRid, me: assessment, all, ranked, rank,
    elite: (window.App?.countElitePlayers || window.countElitePlayers || (() => 0))(roster?.players || []),
    phase: phaseStr, phaseLabel: phase?.label || '',
    inSeason: phaseStr === 'regular_season' || phaseStr === 'playoffs',
    season: parseInt(S.season || league?.season, 10) || new Date().getFullYear(),
    panic: assessment?.panic || 0,
    window: assessment?.window || '',
    needs: (assessment?.needs || []).map(n => typeof n === 'string' ? n : n.pos).filter(Boolean),
    windowForecast: _tcSafe(() => window.computeWindowForecast ? window.computeWindowForecast(myRid, S.rosters, S.players, league) : null),
    posGrades: _tcSafe(() => window._anCalcPosGrades ? window._anCalcPosGrades(myRid, S.rosters, S.players) : null),
    picksByOwner: _tcSafe(() => window.buildPicksByOwner ? window.buildPicksByOwner(S.rosters, league, S.tradedPicks) : null) || {},
    tagCounts, tagTotal: tagCounts.trade + tagCounts.cut + tagCounts.watch + tagCounts.untouchable,
  };
}

// ── Card catalog ────────────────────────────────────────────────────
const _TC_CATALOG = [
  {
    key: 'roster-pulse', title: 'Roster Pulse', tieClass: 1,
    relevance(ctx) { return ctx.me ? 35 + (ctx.panic || 0) * 4 : 0; },
    render(ctx) {
      const m = ctx.me;
      return _tcCard({ kicker: 'Roster Pulse', title: (m.healthScore != null ? Math.round(m.healthScore) : '—') + ' Health', titleColor: _tcHealthCol(m.healthScore), rows: [
        { label: 'Tier', value: m.tier || '—', color: m.tierColor || 'var(--accent)' },
        { label: 'League rank', value: ctx.rank ? ('#' + ctx.rank + ' / ' + ctx.all.length) : '—' },
        { label: 'Elite assets', value: String(ctx.elite) },
      ] });
    },
  },
  {
    key: 'power-rankings', title: 'Power Rank', tieClass: 3,
    relevance(ctx) {
      if (!ctx.rank || !ctx.all.length) return 0;
      let s = 22 + (ctx.panic || 0) * 3;
      const above = ctx.ranked[ctx.rank - 2];
      if (above && ctx.me && (above.healthScore - ctx.me.healthScore) > 0 && (above.healthScore - ctx.me.healthScore) <= 8) s += 15;
      return s;
    },
    render(ctx) {
      const above = ctx.ranked[ctx.rank - 2], below = ctx.ranked[ctx.rank], rival = above || below;
      return _tcCard({ kicker: 'Power Rank', title: '#' + ctx.rank + ' of ' + ctx.all.length, rows: [
        { label: above ? 'Team to catch' : 'Closest below', value: rival ? (_tcOwnerName(ctx, rival.rosterId) + ' · ' + Math.round(rival.healthScore || 0)) : '—' },
        { label: 'Your health', value: ctx.me ? String(Math.round(ctx.me.healthScore || 0)) : '—', color: _tcHealthCol(ctx.me?.healthScore) },
      ] });
    },
  },
  {
    key: 'coverage-grades', title: 'Coverage', tieClass: 2,
    relevance(ctx) {
      const g = ctx.posGrades;
      if (!g || !g.some(x => x.mySum > 0)) return 0;
      const weak = g.filter(x => x.grade === 'D' || x.grade === 'F');
      const pa = ctx.me?.posAssessment || {};
      const deficits = Object.values(pa).filter(v => v && (v.status === 'deficit' || v.status === 'thin')).length;
      if (!weak.length && deficits < 2) return 0;
      return 20 + (ctx.panic || 0) * 8 + (deficits >= 2 ? 15 : 0) + ((ctx.phase === 'pre_draft' || ctx.phase === 'draft_week') ? 20 : 0);
    },
    render(ctx) {
      const g = ctx.posGrades || [];
      const weak = g.filter(x => x.grade === 'D' || x.grade === 'F').sort((a, b) => b.rank - a.rank);
      const worst = [...g].filter(x => x.mySum > 0).sort((a, b) => _tcGradeRank(b.grade) - _tcGradeRank(a.grade))[0];
      const rows = weak.slice(0, 2).map(x => ({ label: x.pos + ' room', value: 'Grade ' + x.grade + ' · #' + x.rank + '/' + x.totalTeams, color: x.col }));
      return _tcCard({ kicker: 'Coverage', title: worst ? ('Weakest: ' + worst.pos + ' (' + worst.grade + ')') : 'Coverage', titleColor: worst?.col, rows: rows.length ? rows : [{ label: 'Status', value: 'Rooms graded league-relative' }] });
    },
  },
  {
    key: 'window-cliff', title: 'Age Window', tieClass: 2,
    relevance(ctx) {
      const wf = ctx.windowForecast;
      if (!wf || !wf.groups || !wf.groups.length) return 0;
      const nearest = wf.groups.find(g => g.cliffT >= 0);
      if (!nearest || nearest.cliffT > 3) return 0;
      let s = 25;
      if (nearest.cliffT === 0) s += 30; else if (nearest.cliffT === 1) s += 20;
      if (ctx.phase === 'pre_draft' || ctx.phase === 'early_offseason' || ctx.phase === 'post_draft') s += 20;
      return s;
    },
    render(ctx) {
      const wf = ctx.windowForecast;
      const nearest = wf.groups.find(g => g.cliffT >= 0) || wf.groups[0];
      const cliffLabel = nearest.cliffT === 0 ? 'NOW' : String(wf.season + nearest.cliffT);
      const col = nearest.cliffT === 0 ? 'var(--red)' : nearest.cliffT === 1 ? 'var(--amber)' : 'var(--accent)';
      const sellBy = wf.groups.reduce((n, g) => n + ((g.sellBy && g.sellBy.length) || 0), 0);
      return _tcCard({ kicker: 'Age Window', title: nearest.pos + ' cliff · ' + cliffLabel, titleColor: col, rows: [
        { label: 'Prime value now', value: Math.round((nearest.primeShares?.[0] || 0) * 100) + '%' },
        { label: 'Sell-by candidates', value: String(sellBy), color: sellBy ? 'var(--amber)' : 'var(--text2)' },
      ] });
    },
  },
  {
    key: 'draft-capital', title: 'Draft Capital', tieClass: 4,
    relevance(ctx) {
      const pbo = ctx.picksByOwner;
      if (!pbo || !pbo[ctx.myRid]) return 0;
      let s = 15;
      if (ctx.phase === 'pre_draft' || ctx.phase === 'draft_week') s += 40;
      const counts = (ctx.S.rosters || []).map(r => (pbo[r.roster_id] || []).length).sort((a, b) => a - b);
      const median = counts[Math.floor(counts.length / 2)] || 0;
      if ((pbo[ctx.myRid] || []).length < median) s += 15;
      return s;
    },
    render(ctx) {
      const pbo = ctx.picksByOwner, teams = (ctx.S.rosters || []).length || 12, PV = window.App?.PlayerValue;
      const pv = (y, r) => (PV && PV.getPickValue) ? (PV.getPickValue(y, r, teams) || 0) : 0;
      const mine = pbo[ctx.myRid] || [];
      const myVal = mine.reduce((s, p) => s + pv(p.year || p.season, p.round), 0);
      const rank = (ctx.S.rosters || []).filter(r => (pbo[r.roster_id] || []).reduce((s, p) => s + pv(p.year || p.season, p.round), 0) > myVal).length + 1;
      return _tcCard({ kicker: 'Draft Capital', title: Math.round(myVal).toLocaleString() + ' DHQ', rows: [
        { label: 'Future picks', value: String(mine.length) },
        { label: 'Capital rank', value: '#' + rank + ' / ' + teams },
      ] });
    },
  },
  {
    key: 'tagged-players', title: 'Your Tags', tieClass: 4,
    relevance(ctx) {
      if (!ctx.tagTotal) return 0;
      let s = 12 + Math.min(18, ctx.tagTotal * 3);
      if (ctx.tagCounts.trade && ctx.window === 'CONTENDING') s += 10;
      return s;
    },
    render(ctx) {
      const t = ctx.tagCounts, rows = [];
      if (t.trade) rows.push({ label: 'Trade Block', value: String(t.trade), color: 'var(--amber)' });
      if (t.cut) rows.push({ label: 'Cut Candidates', value: String(t.cut), color: 'var(--red)' });
      if (t.watch) rows.push({ label: 'Watch', value: String(t.watch), color: 'var(--blue)' });
      if (t.untouchable) rows.push({ label: 'Untouchables', value: String(t.untouchable), color: 'var(--green)' });
      return _tcCard({ kicker: 'Your Tags', title: ctx.tagTotal + ' tagged', rows: rows.slice(0, 3) });
    },
  },
];

// ── Selector ────────────────────────────────────────────────────────
function _tcSelect(ctx, n) {
  return _TC_CATALOG
    .map((c, i) => ({ c, i, score: _tcSafe(() => c.relevance(ctx)) || 0 }))
    .filter(x => x.score >= 20)
    .sort((a, b) => (b.score - a.score) || ((a.c.tieClass || 5) - (b.c.tieClass || 5)) || (a.i - b.i))
    .slice(0, n)
    .map(x => x.c);
}

function _tcRenderPanel(ctx) {
  if (!ctx || !ctx.me) return '';
  const n = (window.innerWidth >= 900) ? 3 : 2;
  const cards = _tcSafe(() => _tcSelect(ctx, n)) || [];
  if (!cards.length) return '';
  const body = cards.map(c => _tcSafe(() => c.render(ctx)) || '').filter(Boolean).join('');
  return body ? `<section class="scout-adaptive-rail">${body}</section>` : '';
}

window.TodayCards = {
  buildCtx: (S, roster, league, phase, assessment) => _tcSafe(() => _tcBuildCtx(S, roster, league, phase, assessment)),
  renderPanel: ctx => _tcSafe(() => _tcRenderPanel(ctx)) || '',
  _catalog: _TC_CATALOG,
};
