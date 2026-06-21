// ══════════════════════════════════════════════════════════════════
// js/analytics-scout.js — Scout Analytics (premium command-center)
// Phase 0: renders War Room dashboard KPIs from engines ALREADY vendored
// in Scout (assessAllTeamsFromGlobal, dynastyValue, PlayerValue,
// runLeagueAnalytics, computeWeightedDNA, SeasonCalendar) — no engine
// porting. Two preset dashboards (Contender / Rebuild), auto-selected from
// GM Strategy mode with a manual toggle. Gated FEATURES.ANALYTICS_DEPTH.
// Weekly-points KPIs use ROS/season fallbacks (labeled) until the
// projections backend lands.
// ══════════════════════════════════════════════════════════════════

function _anEsc(s) {
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
function _anS() { return window.S || window.App?.S || {}; }
function _anLeague() { const S = _anS(); return (S.leagues || []).find(l => l.league_id === S.currentLeagueId) || (S.leagues || [])[0] || null; }
function _anRoster(rid) { return (_anS().rosters || []).find(r => r.roster_id === rid) || null; }
function _anVal(pid) {
  // Prefer the canonical PlayerValue (league-scoring aware, ROS for redraft);
  // fall back to LI.playerScores, then the DHQ engine.
  const PV = window.App?.PlayerValue;
  if (PV && PV.getValue) { const v = PV.getValue(pid); if (v) return v; }
  const ls = (window.App?.LI || window.LI || {}).playerScores;
  if (ls && ls[pid]) return ls[pid];
  return (window.dynastyValue ? window.dynastyValue(pid) : 0) || 0;
}
function _anTeamDhq(roster) {
  return (roster?.players || []).reduce((s, pid) => s + (_anVal(pid) || 0), 0);
}
function _anTierMeta(tier) {
  const m = {
    ELITE: { c: 'var(--accent)' }, CONTENDER: { c: 'var(--green)' },
    CROSSROADS: { c: 'var(--amber)' }, REBUILDING: { c: 'var(--red)' },
  };
  return m[tier] || { c: 'var(--text3)' };
}
function _anOrdinal(n) { return '#' + n; }

// Active preset: null = auto from GM mode. Set by the segmented toggle.
let _anPreset = null;
function _anAutoPreset() {
  const mode = (window.GMStrategy?.getStrategy ? (window.GMStrategy.getStrategy().mode || '') : '').toLowerCase();
  if (['win_now', 'contend', 'run_it_back', 'retool'].includes(mode)) return 'contender';
  return 'rebuild';
}
function _anSetPreset(key) { _anPreset = key; renderAnalyticsPanel(); }
window._anSetPreset = _anSetPreset;

// ── Tile renderers (each returns a card HTML string) ────────────────
function _anTileRosterPulse(ctx) {
  const me = ctx.me; const t = _anTierMeta(me.tier);
  const elite = (window.App?.countElitePlayers || window.countElitePlayers || (() => 0))(_anRoster(me.rosterId)?.players || []);
  return `<section class="scout-section-card an-tile an-span">
    <div class="scout-section-head"><div><span class="scout-kicker">Roster Pulse</span><h2>${_anEsc(me.teamName || 'Your team')}</h2></div>
      <span class="pill" style="border-color:${t.c};color:${t.c};background:transparent">${_anEsc(me.tier || '—')}</span></div>
    <div class="scout-metric-grid">
      <div class="scout-metric-card"><span>Health</span><strong style="color:${t.c}">${me.healthScore != null ? me.healthScore : '—'}</strong><small>0–100 roster vitals</small></div>
      <div class="scout-metric-card"><span>Elite assets</span><strong>${elite}</strong><small>7000+ DHQ / top-5 at pos</small></div>
      <div class="scout-metric-card"><span>Record</span><strong>${me.wins || 0}-${me.losses || 0}${me.ties ? '-' + me.ties : ''}</strong><small>${Math.round(me.pf || 0).toLocaleString()} PF</small></div>
      <div class="scout-metric-card"><span>Panic</span><strong>${me.panic != null ? me.panic + '/5' : '—'}</strong><small>rebuild pressure</small></div>
    </div>
  </section>`;
}
function _anTilePowerRank(ctx) {
  const r = ctx.powerRank, n = ctx.all.length;
  return `<section class="scout-section-card an-tile">
    <span class="scout-kicker">Power Rank</span>
    <div class="an-big" style="color:var(--accent)">${_anOrdinal(r)}<small>/ ${n}</small></div>
    <p class="an-sub">by roster strength (health score)</p>
  </section>`;
}
function _anTileDynastyRank(ctx) {
  return `<section class="scout-section-card an-tile">
    <span class="scout-kicker">Dynasty Rank</span>
    <div class="an-big" style="color:var(--accent)">${_anOrdinal(ctx.dhqRank)}<small>/ ${ctx.all.length}</small></div>
    <p class="an-sub">${Math.round(ctx.myDhq).toLocaleString()} total roster DHQ</p>
  </section>`;
}
function _anTileDraftCapital(ctx) {
  return `<section class="scout-section-card an-tile">
    <span class="scout-kicker">Draft Capital</span>
    <div class="an-big">${Math.round(ctx.myPickVal).toLocaleString()}</div>
    <p class="an-sub">${ctx.myPickCount} pick${ctx.myPickCount === 1 ? '' : 's'} · ${_anOrdinal(ctx.pickRank)}/${ctx.all.length} in the league</p>
  </section>`;
}
function _anTileTiers(ctx) {
  const order = ['ELITE', 'CONTENDER', 'CROSSROADS', 'REBUILDING'];
  const counts = {}; ctx.all.forEach(a => { counts[a.tier] = (counts[a.tier] || 0) + 1; });
  const rows = order.filter(t => counts[t]).map(t => {
    const mine = ctx.me.tier === t;
    return `<div class="an-row"><span style="color:${_anTierMeta(t).c}">${t}${mine ? ' · you' : ''}</span><em class="mono">${counts[t]}</em></div>`;
  }).join('');
  return `<section class="scout-section-card an-tile">
    <span class="scout-kicker">Competitive Tiers</span>
    <div class="an-list">${rows || '<p class="an-sub">No tier data yet.</p>'}</div>
  </section>`;
}
function _anTileCoverage(ctx) {
  const pa = ctx.me.posAssessment || {};
  const tone = s => s === 'surplus' ? 'var(--green)' : s === 'ok' ? 'var(--text2)' : s === 'thin' ? 'var(--amber)' : 'var(--red)';
  const chips = Object.entries(pa).map(([pos, v]) => `<span class="an-chip" style="border-color:${tone(v.status)};color:${tone(v.status)}">${_anEsc(pos)} · ${_anEsc(v.status || '—')}</span>`).join('');
  return `<section class="scout-section-card an-tile an-span">
    <div class="scout-section-head"><div><span class="scout-kicker">Position Coverage</span><h2>Where you're built or exposed</h2></div></div>
    <div class="an-chips">${chips || '<p class="an-sub">Coverage loads with roster data.</p>'}</div>
  </section>`;
}
function _anTileNeeds(ctx) {
  const needs = (ctx.me.needs || []).map(nd => typeof nd === 'string' ? nd : nd.pos).filter(Boolean).slice(0, 4);
  const str = (ctx.me.strengths || []).slice(0, 4);
  return `<section class="scout-section-card an-tile">
    <span class="scout-kicker">Needs &amp; Surplus</span>
    <div class="an-row" style="margin-top:8px"><span style="color:var(--red)">Needs</span><em>${needs.length ? needs.map(_anEsc).join(', ') : 'Stable'}</em></div>
    <div class="an-row"><span style="color:var(--green)">Surplus</span><em>${str.length ? str.map(_anEsc).join(', ') : 'None'}</em></div>
  </section>`;
}
function _anTileChampGap(ctx) {
  const gaps = (ctx.la && Array.isArray(ctx.la.gaps)) ? ctx.la.gaps.slice(0, 3) : [];
  if (!gaps.length) return '';
  const tone = p => p === 'critical' ? 'var(--red)' : p === 'high' ? 'var(--amber)' : 'var(--text2)';
  const rows = gaps.map(g => `<div class="an-row"><span style="color:${tone(g.priority)}">${_anEsc((g.priority || '').toUpperCase())}</span><em>${_anEsc(g.action || '')}</em></div>`).join('');
  return `<section class="scout-section-card an-tile an-span">
    <div class="scout-section-head"><div><span class="scout-kicker">Champion Blueprint</span><h2>Gaps vs the league's winners</h2></div></div>
    <div class="an-list">${rows}</div>
  </section>`;
}
function _anTileOutlook(ctx) {
  const proj = (ctx.la && Array.isArray(ctx.la.projection)) ? ctx.la.projection.slice(0, 5) : [];
  if (!proj.length) return '';
  const rows = proj.map(p => `<div class="an-row"><span>${_anEsc(p.year)}</span><em class="mono">${Math.round(p.projectedDHQ || 0).toLocaleString()} DHQ</em><span style="color:var(--text3);min-width:84px;text-align:right">${_anEsc(p.tier || '')}</span></div>`).join('');
  return `<section class="scout-section-card an-tile an-span">
    <div class="scout-section-head"><div><span class="scout-kicker">5-Year Outlook</span><h2>Projected roster trajectory</h2></div></div>
    <div class="an-list">${rows}</div>
  </section>`;
}
function _anTileLineupNote(ctx) {
  return `<section class="scout-section-card an-tile">
    <span class="scout-kicker">Lineup &amp; Weekly</span>
    <p class="an-sub" style="margin-top:8px">Optimal PPG and points-left-on-bench light up once live weekly projections ship. Until then, lineup calls use rest-of-season value.</p>
    <button class="scout-secondary-btn" style="margin-top:10px" onclick="mobileTab('startsit')">Open Start/Sit</button>
  </section>`;
}

const _AN_PRESETS = {
  contender: { label: 'Contender', tiles: [_anTileRosterPulse, _anTilePowerRank, _anTileTiers, _anTileChampGap, _anTileCoverage, _anTileLineupNote] },
  rebuild: { label: 'Rebuild', tiles: [_anTileRosterPulse, _anTileDynastyRank, _anTileDraftCapital, _anTileTiers, _anTileOutlook, _anTileNeeds, _anTileCoverage] },
};

function renderAnalyticsPanel() {
  const host = document.getElementById('panel-analytics-content');
  if (!host) return;

  // Premium gate
  if (typeof canAccess === 'function' && !canAccess(window.FEATURES?.ANALYTICS_DEPTH || 'analytics_depth')) {
    host.innerHTML = `<div class="scout-command-shell">
      <section class="scout-hero"><div class="scout-kicker">Analytics</div>
        <h1>War Room depth, on the field.</h1>
        <p>Preset command-center dashboards: power rankings, competitive tiers, champion blueprint gaps, draft capital, dynasty trajectory, and owner intel.</p>
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
      <div class="scout-empty-body">Scout builds the command-center from your league's rosters, values, and history.</div>
      <button class="scout-primary-btn" onclick="mobileTab('digest')">Back to Today</button>
    </div></div>`;
    return;
  }

  const all = (typeof window.assessAllTeamsFromGlobal === 'function') ? (window.assessAllTeamsFromGlobal() || []) : [];
  const myRid = S.myRosterId;
  const me = all.find(a => a.rosterId === myRid);
  if (!me) {
    host.innerHTML = `<div class="scout-command-shell"><div class="scout-empty-card">
      <div class="scout-empty-title">Assembling analytics…</div>
      <div class="scout-empty-body">Scout has the league but is still resolving your team. Try again in a moment.</div>
    </div></div>`;
    return;
  }

  // League analytics (champion blueprint + 5-yr projection) — guarded; needs LI.
  let la = null;
  try { if (typeof window.runLeagueAnalytics === 'function') la = window.runLeagueAnalytics(); } catch (e) { la = null; }

  // Derived ranks
  const byHealth = [...all].sort((a, b) => (b.healthScore || 0) - (a.healthScore || 0));
  const powerRank = byHealth.findIndex(a => a.rosterId === myRid) + 1;
  const teamDhq = (S.rosters || []).map(r => ({ rid: r.roster_id, dhq: _anTeamDhq(r) }));
  const myDhq = teamDhq.find(t => t.rid === myRid)?.dhq || 0;
  const dhqRank = teamDhq.filter(t => t.dhq > myDhq).length + 1;
  const teams = (S.rosters || []).length;
  const PV = window.App?.PlayerValue;
  const picksByOwner = (typeof window.buildPicksByOwner === 'function') ? window.buildPicksByOwner(S.rosters, league, S.tradedPicks) : {};
  const pickVal = rid => (picksByOwner[rid] || []).reduce((s, pk) => s + ((PV && PV.getPickValue) ? (PV.getPickValue(pk.season || pk.year, pk.round, teams) || 0) : 0), 0);
  const myPickVal = pickVal(myRid);
  const myPickCount = (picksByOwner[myRid] || []).length;
  const pickRank = (S.rosters || []).filter(r => pickVal(r.roster_id) > myPickVal).length + 1;

  const ctx = { all, me, la, powerRank, myDhq, dhqRank, myPickVal, myPickCount, pickRank };

  const presetKey = _anPreset || _anAutoPreset();
  const preset = _AN_PRESETS[presetKey] || _AN_PRESETS.contender;
  const phase = window.SeasonCalendar?.describe ? window.SeasonCalendar.describe(league) : null;

  const seg = Object.entries(_AN_PRESETS).map(([k, p]) =>
    `<button class="an-seg${k === presetKey ? ' active' : ''}" onclick="_anSetPreset('${k}')">${_anEsc(p.label)}</button>`).join('');

  const tiles = preset.tiles.map(fn => { try { return fn(ctx) || ''; } catch (e) { return ''; } }).join('');

  host.innerHTML = `<div class="scout-command-shell">
    <section class="scout-hero">
      <div class="scout-hero-row" style="display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap">
        <div class="scout-kicker">Analytics · ${_anEsc(league.name || 'League')}</div>
        ${phase ? `<span class="scout-ai-allowance" style="font-size:11px;font-weight:700;padding:3px 9px;border-radius:999px;border:1px solid var(--border2);color:var(--text3)">${_anEsc(phase.label || '')}</span>` : ''}
      </div>
      <h1>Command center</h1>
      <div class="an-segctl">${seg}<span class="an-auto">${_anPreset ? 'manual' : 'auto · GM mode'}</span></div>
    </section>
    <div class="an-grid">${tiles}</div>
  </div>`;
}
window.renderAnalyticsPanel = renderAnalyticsPanel;
