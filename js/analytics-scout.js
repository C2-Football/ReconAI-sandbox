// ══════════════════════════════════════════════════════════════════
// js/analytics-scout.js — Scout Analytics TERMINAL (premium)
// Faithful port of War Room's analytics tab (warroom/js/tabs/analytics.js):
// a sub-tab terminal (Roster / Draft / Market Moves) where each view stacks
// a Command Panel (research question + suggested mode + evidence stats),
// Proof Grids, champion-gap delta bars, coverage matrices, and data stacks.
// Built from engines already vendored in Scout (runLeagueAnalytics,
// assessTeamFromGlobal/assessAllTeamsFromGlobal, PlayerValue, GMStrategy,
// SeasonCalendar). Gated FEATURES.ANALYTICS_DEPTH. iPad-landscape friendly.
// ══════════════════════════════════════════════════════════════════

function _anEsc(s) {
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
function _anS() { return window.S || window.App?.S || {}; }
function _anLeague() { const S = _anS(); return (S.leagues || []).find(l => l.league_id === S.currentLeagueId) || (S.leagues || [])[0] || null; }
function _anRoster(rid) { return (_anS().rosters || []).find(r => r.roster_id === rid) || null; }
function _anVal(pid) {
  const PV = window.App?.PlayerValue;
  if (PV && PV.getValue) { const v = PV.getValue(pid); if (v) return v; }
  const ls = (window.App?.LI || window.LI || {}).playerScores;
  if (ls && ls[pid]) return ls[pid];
  return (window.dynastyValue ? window.dynastyValue(pid) : 0) || 0;
}
function _anTeamDhq(roster) { return (roster?.players || []).reduce((s, pid) => s + (_anVal(pid) || 0), 0); }
function _anSigned(v, suffix) {
  if (v == null || !Number.isFinite(Number(v))) return '—';
  const n = Number(v);
  return (n > 0 ? '+' : '') + Math.round(n).toLocaleString() + (suffix || '');
}
function _anPct(v) { return Math.round((v || 0) * 100) + '%'; }

// ── Sub-tab state ───────────────────────────────────────────────────
let _anTab = 'roster';
function _anSetTab(k) { _anTab = k; renderAnalyticsPanel(); }
window._anSetTab = _anSetTab;

// ── Reusable terminal components (vanilla HTML, ported from WR) ──────
function _anCommandPanel({ title, thesis, mode, stats, note }) {
  const hasStats = Array.isArray(stats) && stats.length > 0;
  const statsHtml = (stats || []).map(s =>
    `<div${s.tip ? ` title="${_anEsc(s.tip)}"` : ''}><span>${_anEsc(s.label)}</span><strong style="color:${s.color || 'var(--text)'}">${_anEsc(s.value)}</strong>${s.sub ? `<em>${_anEsc(s.sub)}</em>` : ''}</div>`).join('');
  return `<div class="analytics-command-panel${hasStats ? '' : ' is-bare'}">
    <div><span>Research Question</span><h2>${_anEsc(title)}</h2><p>${_anEsc(thesis)}</p>
      ${mode ? `<div class="analytics-mode-callout" style="border-left-color:${mode.color || 'var(--accent)'}"><span>Suggested Mode</span><strong style="color:${mode.color || 'var(--accent)'}">${_anEsc(mode.label)}</strong><p>${_anEsc(mode.directive)}</p></div>` : ''}
    </div>
    ${hasStats ? `<aside>${statsHtml}</aside>` : ''}
    ${note ? `<div class="analytics-command-note">${_anEsc(note)}</div>` : ''}
  </div>`;
}
function _anProofGrid(items) {
  return `<div class="analytics-proof-grid">${(items || []).map(it =>
    `<div class="analytics-proof-card is-${it.tone || 'neutral'}"><span>${_anEsc(it.label)}</span><strong${it.color ? ` style="color:${it.color}"` : ''}>${_anEsc(it.value)}</strong>${it.detail ? `<em>${_anEsc(it.detail)}</em>` : ''}</div>`).join('')}</div>`;
}
function _anDeltaRows({ rows, youLabel = 'You', benchmarkLabel = 'Elite' }) {
  const max = Math.max(1, ...rows.map(r => Math.max(Math.abs(r.yours || 0), Math.abs(r.benchmark || 0))));
  const body = rows.map(r => {
    const yours = Number(r.yours || 0), bench = Number(r.benchmark || 0), delta = yours - bench;
    const yPct = Math.max(2, Math.min(100, Math.abs(yours) / max * 100));
    const bPct = Math.max(0, Math.min(100, Math.abs(bench) / max * 100));
    const fmt = r.format || (v => v.toFixed(0));
    return `<div class="analytics-delta-row"><strong>${_anEsc(r.label)}</strong><div class="analytics-delta-track"><div class="analytics-delta-fill" style="width:${yPct}%;background:${r.color || 'var(--accent)'}"></div><div class="analytics-delta-benchmark" style="left:${bPct}%"></div></div><b>${_anEsc(fmt(yours))}</b><b>${_anEsc(fmt(bench))}</b><em class="${delta >= 0 ? 'is-good' : 'is-bad'}">${_anEsc(_anSigned(delta, r.suffix || ''))}</em></div>`;
  }).join('');
  return `<div class="analytics-delta-list"><div class="analytics-delta-head"><span>Room</span><span>Share</span><span>${_anEsc(youLabel)}</span><span>${_anEsc(benchmarkLabel)}</span><span>Gap</span></div>${body}</div>`;
}
function _anDataStack(rows, compact) {
  return `<div class="analytics-data-stack">${(rows || []).map(r =>
    `<div class="analytics-data-row${compact ? ' is-compact' : ''}"${compact && r.detail ? ` title="${_anEsc(r.detail)}"` : ''}><div>${compact ? '' : `<span>${_anEsc(r.kicker || r.label)}</span>`}<strong>${_anEsc(r.label)}</strong></div>${compact ? '' : `<em>${_anEsc(r.detail || '')}</em>`}<b${r.color ? ` style="color:${r.color}"` : ''}>${_anEsc(r.value)}</b></div>`).join('')}</div>`;
}
function _anSection(title, meta, body) {
  return `<div class="analytics-panel"><div class="analytics-panel-head"><span>${_anEsc(title)}</span>${meta ? `<em>${_anEsc(meta)}</em>` : ''}</div>${body}</div>`;
}

// ── Sub-tab renderers ───────────────────────────────────────────────
function _anModeFromGm() {
  const md = (window.GMStrategy?.getStrategy ? (window.GMStrategy.getStrategy().mode || '') : '').toLowerCase();
  if (!md) return null;
  return { label: md.replace(/_/g, ' ').toUpperCase(), directive: 'Driven by your saved GM Strategy.', color: 'var(--accent)' };
}

function _anRosterTab(d, ctx) {
  const r = d && d.roster;
  if (!r) return _anSection('Roster Construction', '', '<p class="an-sub" style="padding:6px 2px">League intelligence is still assembling — champion benchmarks need the full league history.</p>');
  const w = r.winnerProfile || {}, m = r.myProfile || {}, me = ctx.me;
  const benchHigh = ctx.winnerSource === 'brackets' && ctx.winnerN >= 3;
  const benchConf = benchHigh ? 'High' : (ctx.winnerN < 2 ? 'Very Low' : 'Low');
  const benchColor = benchHigh ? 'var(--green)' : (ctx.winnerN < 2 ? 'var(--red)' : 'var(--amber)');
  const panic = me.panic || 0;
  const winNow = panic >= 4 ? { t: 'CRITICAL', c: 'var(--red)' } : panic >= 2 ? { t: 'ELEVATED', c: 'var(--amber)' } : { t: 'LOW', c: 'var(--green)' };
  const mode = _anModeFromGm();

  const cmd = _anCommandPanel({
    title: "What separates this roster from the league's winning build?",
    thesis: "Where your DHQ is invested versus the teams that actually win — room coverage, elite assets, age window, and the gaps to close first.",
    mode,
    note: 'Elite player = 7000+ DHQ or top 5 at position. Benchmarks compare against this league’s proven top teams.',
    stats: [
      { label: 'Strategy Lens', value: mode ? mode.label : 'Auto' },
      { label: 'Evidence Set', value: ctx.all.length + ' teams' },
      { label: 'Champion Sample', value: ctx.winnerN + ' · ' + (ctx.winnerSource || 'standings') },
      { label: 'Benchmark Confidence', value: benchConf, color: benchColor, tip: benchHigh ? 'Winners taken from real playoff brackets.' : 'Winners inferred from current standings — lower trust.' },
      { label: 'Current Tier', value: (me.tier || '—') + ' · #' + ctx.rank, color: me.tierColor },
      { label: 'Win-Now Pressure', value: winNow.t, color: winNow.c },
    ],
  });

  const valGap = ctx.myDhq - (w.avgTotalDHQ || 0);
  const eliteGap = ctx.myElite - (w.avgEliteCount || 0);
  const ageDelta = (m.avgAge || 0) - (w.avgAge || 0);
  const proof = _anProofGrid([
    { label: 'Champion Value Gap', value: _anSigned(valGap, ' DHQ'), tone: valGap >= 0 ? 'good' : 'bad', detail: `vs ${ctx.winnerN} winners’ avg ${Math.round(w.avgTotalDHQ || 0).toLocaleString()}` },
    { label: 'Elite Asset Gap', value: _anSigned(eliteGap), tone: eliteGap >= 0 ? 'good' : 'bad', detail: `you ${ctx.myElite} · champ ${(w.avgEliteCount || 0).toFixed(1)}` },
    { label: 'Age Window Delta', value: ageDelta ? _anSigned(ageDelta, ' yr') : '—', tone: ageDelta <= 0 ? 'good' : 'bad', detail: `core age vs champ ${(w.avgAge || 0).toFixed(1)}` },
    { label: 'Top-5 Concentration', value: m.topPlayerConcentration ? _anPct(m.topPlayerConcentration) : '—', tone: 'neutral', detail: `champ ${w.topPlayerConcentration ? _anPct(w.topPlayerConcentration) : '—'}` },
    { label: 'Compete Window', value: (d.window && d.window.years != null) ? d.window.years + ' yr' : '—', tone: 'neutral', detail: 'years competitive' },
  ]);

  // Champion Blueprint — position investment share, you vs winners
  let blueprint = '';
  const posKeys = [...new Set([...Object.keys(m.posInvestment || {}), ...Object.keys(w.posInvestment || {})])].filter(p => p && p !== 'UNK');
  if (posKeys.length) {
    const mSum = Object.values(m.posInvestment || {}).reduce((s, v) => s + (v || 0), 0) || 1;
    const wSum = Object.values(w.posInvestment || {}).reduce((s, v) => s + (v || 0), 0) || 1;
    const needsSet = new Set((me.needs || []).map(n => typeof n === 'string' ? n : n.pos));
    const order = ['QB', 'RB', 'WR', 'TE', 'K', 'DEF', 'DL', 'LB', 'DB'];
    posKeys.sort((a, b) => (order.indexOf(a) < 0 ? 99 : order.indexOf(a)) - (order.indexOf(b) < 0 ? 99 : order.indexOf(b)));
    const rows = posKeys.map(p => ({ label: p, yours: (m.posInvestment[p] || 0) / mSum * 100, benchmark: (w.posInvestment[p] || 0) / wSum * 100, format: v => v.toFixed(0) + '%', suffix: '%', color: needsSet.has(p) ? 'var(--red)' : 'var(--accent)' }));
    blueprint = _anSection('Champion Blueprint', 'DHQ share by room — you vs winners', _anDeltaRows({ rows, youLabel: 'You', benchmarkLabel: 'Champ' }));
  }

  // Priority Evidence — champion gap actions
  const gaps = r.gaps || d.gaps || [];
  const gapColor = p => p === 'critical' ? 'var(--red)' : p === 'high' ? 'var(--amber)' : 'var(--text2)';
  const gapStack = gaps.length
    ? _anSection('Priority Evidence', 'Rooms to fix first', _anDataStack(gaps.slice(0, 6).map(g => ({ label: g.action, value: (g.priority || '').toUpperCase(), color: gapColor(g.priority) })), true))
    : '';

  // Coverage Matrix
  const pa = me.posAssessment || {};
  const tone = s => s === 'surplus' ? 'var(--green)' : s === 'ok' ? 'var(--text2)' : s === 'thin' ? 'var(--amber)' : 'var(--red)';
  const chips = Object.entries(pa).map(([pos, v]) => `<span class="an-chip" style="border-color:${tone(v.status)};color:${tone(v.status)}">${_anEsc(pos)} · ${_anEsc(v.status || '—')}</span>`).join('');
  const coverage = chips ? _anSection('Coverage Matrix', 'Starter quality by room', `<div class="an-chips">${chips}</div>`) : '';

  // 5-Year Outlook
  const proj = (d.projection || []).slice(0, 5);
  const outlook = proj.length
    ? _anSection('5-Year Outlook', 'Projected roster trajectory', _anDataStack(proj.map(p => ({ label: String(p.year), kicker: 'Season', detail: p.tier || '', value: Math.round(p.projectedDHQ || 0).toLocaleString() + ' DHQ' }))))
    : '';

  return cmd + proof + blueprint + gapStack + coverage + outlook;
}

function _anDraftTab(d, ctx) {
  const mode = _anModeFromGm();
  const cmd = _anCommandPanel({
    title: 'What does this league reward in the draft?',
    thesis: 'Your pick capital, where it ranks, and the build it can fund — the foundation for draft-day strategy.',
    mode,
    stats: [
      { label: 'Owned Picks', value: String(ctx.myPickCount) },
      { label: 'Pick Capital', value: Math.round(ctx.myPickVal).toLocaleString() + ' DHQ' },
      { label: 'Capital Rank', value: '#' + ctx.pickRank + ' / ' + ctx.all.length },
    ],
  });
  const avgPickVal = ctx.all.length ? ctx.leaguePickVal / ctx.all.length : 0;
  const capEdge = ctx.myPickVal - avgPickVal;
  const proof = _anProofGrid([
    { label: 'Pick Capital', value: Math.round(ctx.myPickVal).toLocaleString(), tone: 'neutral', detail: `${ctx.myPickCount} future picks` },
    { label: 'Capital vs League', value: _anSigned(capEdge, ' DHQ'), tone: capEdge >= 0 ? 'good' : 'bad', detail: `league avg ${Math.round(avgPickVal).toLocaleString()}` },
    { label: 'Capital Rank', value: '#' + ctx.pickRank, tone: ctx.pickRank <= Math.ceil(ctx.all.length / 3) ? 'good' : ctx.pickRank <= Math.ceil(ctx.all.length * 2 / 3) ? 'warn' : 'bad', detail: `of ${ctx.all.length} teams` },
  ]);
  const picks = ctx.myPicks || [];
  const byYear = {};
  picks.forEach(pk => { const y = pk.season || pk.year || '?'; (byYear[y] = byYear[y] || []).push(pk); });
  const rows = Object.keys(byYear).sort().map(y => ({ label: y + ' picks', kicker: 'Draft year', detail: byYear[y].map(p => 'R' + p.round).join(', '), value: String(byYear[y].length) }));
  const capital = rows.length ? _anSection('Pick Capital', 'Your future draft inventory', _anDataStack(rows)) : '';
  return cmd + proof + capital;
}

function _anTradesTab(d, ctx) {
  const t = (d && d.trades) || {};
  const mp = t.myTradeProfile || {}, wp = t.winnerTradeProfile || {};
  const mode = _anModeFromGm();
  const cmd = _anCommandPanel({
    title: 'Where is the league market mispricing value?',
    thesis: 'Your trade behavior, win rate, and net buy/sell posture measured against the teams that win.',
    mode,
    stats: [
      { label: 'Trade Win Rate', value: mp.tradeWinRate != null ? _anPct(mp.tradeWinRate) : '—' },
      { label: 'Avg Value / Deal', value: mp.avgValueGained != null ? _anSigned(mp.avgValueGained, ' DHQ') : '—', color: (mp.avgValueGained || 0) >= 0 ? 'var(--green)' : 'var(--red)' },
      { label: 'Trades / Season', value: mp.avgTradesPerSeason != null ? (+mp.avgTradesPerSeason).toFixed(1) : '—' },
    ],
  });
  const freqEdge = (mp.avgTradesPerSeason || 0) - (wp.avgTradesPerSeason || 0);
  const proof = _anProofGrid([
    { label: 'Trade Frequency Edge', value: _anSigned(freqEdge), tone: freqEdge >= 0 ? 'good' : 'bad', detail: `winners ${(wp.avgTradesPerSeason || 0).toFixed(1)}/yr` },
    { label: 'Value Per Deal', value: mp.avgValueGained != null ? _anSigned(mp.avgValueGained, ' DHQ') : '—', tone: (mp.avgValueGained || 0) >= 0 ? 'good' : 'bad', detail: 'avg DHQ gained' },
    { label: 'Trade Win Rate', value: mp.tradeWinRate != null ? _anPct(mp.tradeWinRate) : '—', tone: (mp.tradeWinRate || 0) >= 0.5 ? 'good' : (mp.tradeWinRate || 0) >= 0.4 ? 'warn' : 'bad', detail: `${mp.tradesWon || 0}W · ${mp.tradesFair || 0}F · ${mp.tradesLost || 0}L` },
  ]);
  let flow = '';
  const net = prof => {
    const b = prof.positionsBought || {}, s = prof.positionsSold || {};
    const keys = [...new Set([...Object.keys(b), ...Object.keys(s)])];
    const o = {}; keys.forEach(k => { o[k] = (b[k] || 0) - (s[k] || 0); }); return o;
  };
  const myNet = net(mp), wNet = net(wp);
  const fk = [...new Set([...Object.keys(myNet), ...Object.keys(wNet)])].filter(p => p && p !== 'UNK');
  if (fk.length) {
    const rows = fk.map(p => ({ label: p, yours: myNet[p] || 0, benchmark: wNet[p] || 0, format: v => (v > 0 ? '+' : '') + Math.round(v), color: (myNet[p] || 0) >= 0 ? 'var(--green)' : 'var(--red)' }));
    flow = _anSection('Trade Flow', 'Net buy/sell by room — you vs champ', _anDeltaRows({ rows, youLabel: 'You', benchmarkLabel: 'Champ' }));
  }
  return cmd + proof + flow;
}

const _AN_SUBTABS = [
  { key: 'roster', label: 'Roster', render: _anRosterTab },
  { key: 'draft', label: 'Draft', render: _anDraftTab },
  { key: 'trades', label: 'Market Moves', render: _anTradesTab },
];

function renderAnalyticsPanel() {
  const host = document.getElementById('panel-analytics-content');
  if (!host) return;

  if (typeof canAccess === 'function' && !canAccess(window.FEATURES?.ANALYTICS_DEPTH || 'analytics_depth')) {
    host.innerHTML = `<div class="scout-command-shell">
      <section class="scout-hero"><div class="scout-kicker">Analytics</div>
        <h1>War Room depth, on the field.</h1>
        <p>A league analytics terminal: champion blueprint gaps, roster coverage, draft capital, and market posture — the evidence behind every move.</p>
      </section>
      ${typeof _tierGatePlaceholder === 'function' ? _tierGatePlaceholder('Analytics', window.FEATURES?.ANALYTICS_DEPTH || 'analytics_depth') : ''}
    </div>`;
    return;
  }

  const S = _anS();
  const league = _anLeague();
  if (!league || !S.user || !(S.rosters || []).length) {
    host.innerHTML = `<div class="scout-command-shell"><div class="scout-empty-card">
      <div class="scout-empty-title">Connect a league to open Analytics</div>
      <div class="scout-empty-body">The terminal builds from your league's rosters, values, and history.</div>
      <button class="scout-primary-btn" onclick="mobileTab('digest')">Back to Today</button>
    </div></div>`;
    return;
  }

  const all = (typeof window.assessAllTeamsFromGlobal === 'function') ? (window.assessAllTeamsFromGlobal() || []) : [];
  const myRid = S.myRosterId;
  const me = all.find(a => a.rosterId === myRid) || { rosterId: myRid, tier: '—', needs: [], posAssessment: {} };

  let la = null;
  try { if (typeof window.runLeagueAnalytics === 'function') la = window.runLeagueAnalytics(); } catch (e) { la = null; }

  // Shared context
  const byHealth = [...all].sort((a, b) => (b.healthScore || 0) - (a.healthScore || 0));
  const rank = Math.max(1, byHealth.findIndex(a => a.rosterId === myRid) + 1);
  const myRosterObj = _anRoster(myRid);
  const myDhq = _anTeamDhq(myRosterObj);
  const myElite = (window.App?.countElitePlayers || window.countElitePlayers || (() => 0))(myRosterObj?.players || []);
  const teams = (S.rosters || []).length;
  const PV = window.App?.PlayerValue;
  const picksByOwner = (typeof window.buildPicksByOwner === 'function') ? window.buildPicksByOwner(S.rosters, league, S.tradedPicks) : {};
  const pickVal = rid => (picksByOwner[rid] || []).reduce((s, pk) => s + ((PV && PV.getPickValue) ? (PV.getPickValue(pk.season || pk.year, pk.round, teams) || 0) : 0), 0);
  const myPicks = picksByOwner[myRid] || [];
  const myPickVal = pickVal(myRid);
  const myPickCount = myPicks.length;
  const pickRank = Math.max(1, (S.rosters || []).filter(r => pickVal(r.roster_id) > myPickVal).length + 1);
  const leaguePickVal = (S.rosters || []).reduce((s, r) => s + pickVal(r.roster_id), 0);
  const winnerN = (la && Array.isArray(la.winners)) ? la.winners.length : 0;
  const winnerSource = (la && (la.winnerSource || la.source)) || 'standings';

  const ctx = { all, me, myRid, rank, myDhq, myElite, myPicks, myPickVal, myPickCount, pickRank, leaguePickVal, winnerN, winnerSource };

  const active = _AN_SUBTABS.find(t => t.key === _anTab) || _AN_SUBTABS[0];
  const nav = _AN_SUBTABS.map(t => `<button class="${t.key === active.key ? 'is-active' : ''}" onclick="_anSetTab('${t.key}')">${_anEsc(t.label)}</button>`).join('');
  const updated = la && la.computedAt ? 'Updated ' + new Date(la.computedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : (la ? 'Live' : 'Loading');

  let body = '';
  try { body = active.render(la, ctx) || ''; } catch (e) { body = _anSection('Analytics', '', '<p class="an-sub" style="padding:6px 2px">Could not render this view. Refresh league data and try again.</p>'); }

  host.innerHTML = `<div class="analytics-shell">
    <div class="wr-module-strip">
      <div class="wr-module-nav">${nav}</div>
      <span class="wr-module-pill">${_anEsc(updated)}</span>
    </div>
    ${body}
  </div>`;
}
window.renderAnalyticsPanel = renderAnalyticsPanel;
