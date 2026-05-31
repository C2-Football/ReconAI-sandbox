# Claude Code Prompt: Draft Tab Redesign

## Vision
The Draft tab has two equal, distinct experiences: **Big Board** (DHQ-powered prospect ranking and browsing) and **Mock Draft** (DNA-powered simulation of how your actual leaguemates draft). Both are differentiators. The current tab toggle at the top treats them as equal views of the same thing — the redesign makes them feel like two distinct entry points, like the League tab's room cards.

---

## What You're Building

### New Draft Tab Layout (Board view, default)

Replace the current BOARD / MOCK DRAFT toggle at the top with two entry cards — styled exactly like the League tab's TRADES / WAIVERS / ALL TEAMS cards — at the top of the draft panel:

```
┌─────────────────────────────────────────┐
│ 🎯 BIG BOARD                        →  │
│ DHQ-ranked prospects · your roster fit  │
└─────────────────────────────────────────┘
┌─────────────────────────────────────────┐
│ 🎲 MOCK DRAFT                       →  │
│ Simulate with owner DNA · 16 teams      │
└─────────────────────────────────────────┘
```

Tapping BIG BOARD navigates into the board view (full screen, replaces the entry cards).
Tapping MOCK DRAFT launches the mock draft experience (full screen, feels like entering a room).

Both views should have a back/exit button in the header area to return to the entry cards.

---

## Part 1: Entry Cards

In `index.html`, find `<div class="panel" id="panel-draftroom">`. Replace everything inside it with:

```html
<!-- Draft entry view — shown by default -->
<div id="draft-entry-view">
  <div style="font-size:18px;font-weight:800;letter-spacing:-.03em;margin-bottom:4px">Draft Room</div>
  <div style="font-size:13px;color:var(--text3);margin-bottom:16px">Rookie prospects · mock drafts · pick strategy</div>

  <!-- Big Board entry card -->
  <div class="draft-entry-card" onclick="enterDraftRoom('board')" style="margin-bottom:10px">
    <div class="draft-entry-icon" style="background:rgba(212,175,55,.12)">
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="var(--accent)" stroke-width="1.8">
        <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/>
        <line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/>
        <line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
      </svg>
    </div>
    <div class="draft-entry-body">
      <div class="draft-entry-title">Big Board</div>
      <div class="draft-entry-sub" id="draft-entry-board-sub">DHQ-ranked prospects · tap to rank</div>
    </div>
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="var(--text3)" stroke-width="2">
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  </div>

  <!-- Mock Draft entry card -->
  <div class="draft-entry-card" onclick="enterDraftRoom('mock')" style="margin-bottom:16px">
    <div class="draft-entry-icon" style="background:rgba(52,211,153,.08)">
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="var(--green)" stroke-width="1.8">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
      </svg>
    </div>
    <div class="draft-entry-body">
      <div class="draft-entry-title">Mock Draft</div>
      <div class="draft-entry-sub" id="draft-entry-mock-sub">Owner DNA simulation · 16 teams</div>
    </div>
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="var(--text3)" stroke-width="2">
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  </div>

  <!-- Your picks summary (compact, always visible on entry) -->
  <div id="draft-entry-picks"></div>
</div>

<!-- Big Board full-screen view -->
<div id="draft-board-fullview" style="display:none">
  <!-- Back header -->
  <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px">
    <button onclick="exitDraftRoom()" style="background:var(--bg2);border:1px solid var(--border);border-radius:8px;padding:6px 12px;font-size:13px;color:var(--text2);cursor:pointer;font-family:inherit;display:flex;align-items:center;gap:6px">
      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
      Draft Room
    </button>
    <div style="font-size:16px;font-weight:800;letter-spacing:-.02em">Big Board</div>
  </div>

  <!-- Your picks card (compact) -->
  <div id="draft-my-picks" style="margin-bottom:14px"></div>

  <!-- Alex's top pick hero -->
  <div id="draft-alex-hero" style="margin-bottom:14px"></div>

  <!-- Position filter + rookie list -->
  <div id="draft-top-prospects"></div>

  <!-- Draft Intel (bar chart + hit rates) -->
  <div id="draft-summary" style="margin-bottom:14px">
    <div id="draft-summary-content"></div>
  </div>

  <!-- Data quality note -->
  <div style="font-size:12px;color:var(--text3);padding:8px 12px;background:var(--bg2);border-radius:var(--r);margin-top:14px;line-height:1.5">
    Rookie rankings improve as the NFL draft approaches. Pre-draft data is speculative.
  </div>
</div>

<!-- Mock Draft full-screen view -->
<div id="draft-mock-fullview" style="display:none">
  <!-- Back header -->
  <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px">
    <button onclick="exitDraftRoom()" style="background:var(--bg2);border:1px solid var(--border);border-radius:8px;padding:6px 12px;font-size:13px;color:var(--text2);cursor:pointer;font-family:inherit;display:flex;align-items:center;gap:6px">
      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
      Draft Room
    </button>
    <div style="font-size:16px;font-weight:800;letter-spacing:-.02em">Mock Draft</div>
  </div>

  <!-- Mock draft content (existing mock UI goes here) -->
  <div id="draft-mock" style="margin-bottom:14px"></div>
</div>

<!-- Keep these hidden stubs for JS compat -->
<div id="draft-needs" style="display:none"></div>
<div id="rookie-profiles" style="display:none"></div>
<div id="draft-scout-content" style="display:none"></div>
<div id="draft-chat-collapse" style="display:none"></div>
<div id="draft-msgs" style="display:none"></div>
<input type="text" id="draft-chat-in" style="display:none" onkeydown="if(event.key==='Enter')sendDraftChat()"/>
<div id="draft-history-section" style="display:none"></div>
<div id="draft-best-bet" style="display:none"></div>
```

---

## Part 2: CSS for Entry Cards

Add these classes to `css/styles.css`:

```css
/* ── Draft Entry Cards ───────────────────────────────── */
.draft-entry-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px;
  background: var(--bg2);
  border: 1px solid var(--border);
  border-radius: var(--rl);
  cursor: pointer;
  transition: border-color .2s, transform .15s;
  -webkit-tap-highlight-color: transparent;
}
.draft-entry-card:hover { border-color: var(--border2); }
.draft-entry-card:active { transform: scale(.985); background: var(--bg3); }
.draft-entry-icon {
  width: 44px; height: 44px;
  border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.draft-entry-body { flex: 1; min-width: 0; }
.draft-entry-title { font-size: 15px; font-weight: 700; color: var(--text); }
.draft-entry-sub { font-size: 13px; color: var(--text3); margin-top: 2px; }
```

---

## Part 3: Navigation Functions in draft-ui.js

Add these three functions near the top of `js/draft-ui.js`, after the existing `switchDraftView` function:

```js
// ── Draft Room navigation (Phase 8 redesign) ──────────────────
// Entry cards → full-screen board or mock, with back button

function enterDraftRoom(mode) {
  const entry = document.getElementById('draft-entry-view');
  const board = document.getElementById('draft-board-fullview');
  const mock  = document.getElementById('draft-mock-fullview');
  if (!entry || !board || !mock) return;

  entry.style.display = 'none';

  if (mode === 'board') {
    board.style.display = '';
    mock.style.display  = 'none';
    // Trigger existing board render functions
    if (typeof renderDraftNeeds === 'function') renderDraftNeeds();
    if (typeof renderTopProspects === 'function') renderTopProspects();
  } else {
    mock.style.display  = '';
    board.style.display = 'none';
    // Trigger existing mock render
    if (typeof onDraftTabOpen === 'function') onDraftTabOpen();
  }
}
window.enterDraftRoom = enterDraftRoom;

function exitDraftRoom() {
  const entry = document.getElementById('draft-entry-view');
  const board = document.getElementById('draft-board-fullview');
  const mock  = document.getElementById('draft-mock-fullview');
  if (entry) entry.style.display = '';
  if (board) board.style.display = 'none';
  if (mock)  mock.style.display  = 'none';
  // Refresh entry card subtitles with live data
  _refreshDraftEntrySubtitles();
}
window.exitDraftRoom = exitDraftRoom;

function _refreshDraftEntrySubtitles() {
  // Board subtitle: show pick count and top prospect
  const boardSub = document.getElementById('draft-entry-board-sub');
  if (boardSub) {
    const S = window.S || {};
    const year = S.season || new Date().getFullYear();
    const allTP = S.tradedPicks || [];
    const myId = S.myRosterId;
    const myPicks = myId ? allTP.filter(p => p.owner_id === myId && parseInt(p.season) >= parseInt(year)).length : 0;
    const totalRookies = Object.values(S.players || {}).filter(p => p.years_exp === 0).length;
    boardSub.textContent = myPicks > 0
      ? `${myPicks} picks · ${totalRookies} prospects ranked by DHQ`
      : `${totalRookies} prospects ranked by DHQ`;
  }

  // Mock subtitle: show DNA status
  const mockSub = document.getElementById('draft-entry-mock-sub');
  if (mockSub) {
    const LI = window.LI || {};
    const ownerCount = Object.keys(LI.ownerProfiles || {}).length;
    mockSub.textContent = ownerCount > 0
      ? `${ownerCount} owner DNA profiles loaded · simulate your draft`
      : 'Simulate your draft with AI opponents';
  }
}
window._refreshDraftEntrySubtitles = _refreshDraftEntrySubtitles;
```

---

## Part 4: Entry Picks Summary Card

Add this function to `draft-ui.js` — it renders a compact picks card on the entry screen so users see their capital without going into the board:

```js
function renderDraftEntryPicks() {
  const el = document.getElementById('draft-entry-picks');
  if (!el || !window.S?.myRosterId) return;

  const S = window.S;
  const year = S.season || new Date().getFullYear();
  const allTP = S.tradedPicks || [];
  const myId = S.myRosterId;
  const teams = S.rosters?.length || 16;

  // Get owned picks this year
  const league = S.leagues?.find(l => l.league_id === S.currentLeagueId);
  const draftRounds = league?.settings?.draft_rounds || 7;
  const ownedPicks = [];
  for (let rd = 1; rd <= draftRounds; rd++) {
    const tradedAway = allTP.find(p =>
      String(p.season) === String(year) && p.round === rd &&
      p.roster_id === myId && p.owner_id !== myId
    );
    if (!tradedAway) ownedPicks.push({ round: rd, own: true });
    const acquired = allTP.filter(p =>
      String(p.season) === String(year) && p.round === rd &&
      p.owner_id === myId && p.roster_id !== myId
    );
    acquired.forEach(() => ownedPicks.push({ round: rd, own: false }));
  }

  if (!ownedPicks.length) { el.innerHTML = ''; return; }

  const totalVal = ownedPicks.reduce((s, p) => {
    return s + (typeof pickValue === 'function' ? pickValue(year, p.round, teams, Math.ceil(teams / 2)) : 0);
  }, 0);

  const roundBadges = ownedPicks.slice(0, 6).map(p =>
    `<span style="font-size:12px;font-weight:700;padding:3px 8px;border-radius:6px;background:${p.own ? 'var(--accentL)' : 'rgba(52,211,153,.08)'};color:${p.own ? 'var(--accent)' : 'var(--green)'};border:1px solid ${p.own ? 'rgba(212,175,55,.2)' : 'rgba(52,211,153,.2)'}">R${p.round}</span>`
  ).join('');
  const extra = ownedPicks.length > 6 ? `<span style="font-size:12px;color:var(--text3)">+${ownedPicks.length - 6} more</span>` : '';

  el.innerHTML = `
    <div style="background:var(--bg2);border:1px solid var(--border);border-radius:var(--rl);padding:12px 14px">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
        <span style="font-size:11px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.08em">Your ${year} Picks</span>
        <span style="font-size:12px;font-weight:700;color:var(--accent);font-family:'JetBrains Mono',monospace">~${totalVal.toLocaleString()} DHQ</span>
      </div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center">
        ${roundBadges}${extra}
      </div>
    </div>`;
}
window.renderDraftEntryPicks = renderDraftEntryPicks;
```

---

## Part 5: Hook into Tab Load

In `js/app.js` or wherever `mobileTab('draftroom')` triggers a render, find the draft tab load handler and update it to call:

```js
// When draft tab becomes active:
if (typeof _refreshDraftEntrySubtitles === 'function') _refreshDraftEntrySubtitles();
if (typeof renderDraftEntryPicks === 'function') renderDraftEntryPicks();
```

Also ensure `exitDraftRoom()` is called whenever the user navigates away from the draft tab (so that returning to the tab shows the entry cards, not a half-rendered board or mid-mock state). Find the `mobileTab` function in `app.js` and add:

```js
// When switching AWAY from draftroom:
if (prevTab === 'draftroom') {
  if (typeof exitDraftRoom === 'function') exitDraftRoom();
}
```

---

## Part 6: Remove the Old Toggle

In `index.html`, find and delete the old subtabs div:
```html
<div id="draft-subtabs" style="display:flex;gap:8px;margin:8px 0 14px">
  <button onclick="switchDraftView('board')" ...>Board</button>
  <button onclick="switchDraftView('mock')" ...>Mock Draft</button>
</div>
```

In `js/draft-ui.js`, keep `switchDraftView` as a no-op stub for any remaining references but it no longer needs to do anything meaningful:
```js
function switchDraftView(view) {
  // Replaced by enterDraftRoom() — kept for backward compat
  if (typeof enterDraftRoom === 'function') enterDraftRoom(view === 'mock' ? 'mock' : 'board');
}
```

---

## Part 7: Mock Draft — Surface DNA More Prominently

This is the key differentiator. In the mock draft "on the clock" experience, the current UI shows Alex's recommendation and available players. Add a DNA intel strip between them.

In `js/draft-ui.js`, find the function that renders the "on the clock" card during a mock draft (look for where `Alex says: take` gets rendered, likely in `renderMockDraftUI` or similar). After Alex's recommendation card and before the available players list, inject:

```js
// DNA intel strip — what your actual opponents tend to do here
function _renderDNAIntelStrip(round, pickNum, teams) {
  const LI = window.LI || {};
  const ownerProfiles = LI.ownerProfiles || {};
  const hitRates = LI.hitRateByRound?.[round] || {};

  // Who's picking next (before user's next pick)?
  const upcomingOwners = []; // populate from mock draft state's pick order
  const dnaWarnings = [];

  // Position run risk: if last 3 picks were same position, flag it
  // Best position at this round from league history
  const bestPos = (hitRates.bestPos || []).slice(0, 2).map(p => p.pos).join('/');
  const roundHitRate = hitRates.rate || null;

  if (!bestPos && !roundHitRate) return '';

  return `<div style="background:rgba(52,211,153,.04);border:1px solid rgba(52,211,153,.12);border-radius:var(--r);padding:10px 12px;margin-bottom:10px">
    <div style="font-size:10px;font-weight:700;color:var(--green);text-transform:uppercase;letter-spacing:.08em;margin-bottom:6px">Owner DNA · Round ${round}</div>
    <div style="display:flex;gap:12px;flex-wrap:wrap">
      ${bestPos ? `<div style="font-size:13px;color:var(--text2)">
        <span style="color:var(--text3)">Historically hits at:</span>
        <span style="font-weight:700;color:var(--text);margin-left:4px">${bestPos}</span>
      </div>` : ''}
      ${roundHitRate !== null ? `<div style="font-size:13px;color:var(--text2)">
        <span style="color:var(--text3)">League hit rate:</span>
        <span style="font-weight:700;color:${roundHitRate >= 50 ? 'var(--green)' : roundHitRate >= 25 ? 'var(--amber)' : 'var(--red)'};margin-left:4px">${roundHitRate}%</span>
      </div>` : ''}
    </div>
  </div>`;
}
window._renderDNAIntelStrip = _renderDNAIntelStrip;
```

Call `_renderDNAIntelStrip(currentRound, currentPick, teams)` in the on-the-clock render function, inserting its output between Alex's card and the available players list.

---

## What NOT to Change

- Do not touch `renderDraftNeeds()`, `renderRookieBoard()`, `renderTopProspects()`, or `runDraftScouting()` — these are out of scope and work correctly
- Do not touch the mock draft simulation logic (`startMockDraft`, `_mockState`, `_doAIPick`, etc.)
- Do not touch `css/styles.css` except to add the `.draft-entry-card` block specified above
- Do not touch any other tab panels

---

## Testing Checklist

1. **Entry view**: Draft tab shows two cards (Big Board, Mock Draft) with live subtitles showing pick count and DNA status
2. **Big Board**: Tapping enters full-screen board — back button returns to entry cards
3. **Mock Draft**: Tapping enters mock — back button returns to entry cards
4. **Entry picks**: Compact pick summary shows below entry cards when user has picks
5. **DNA strip**: During mock draft on-the-clock, a DNA intel strip shows round hit rate and best historical position
6. **No regression**: All existing board/mock functionality works exactly as before — just accessed differently
7. **Tab switch**: Switching away from Draft tab and back shows entry cards (not mid-board or mid-mock)
