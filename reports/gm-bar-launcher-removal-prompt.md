# Claude Code Prompt: Remove GM Bar Launcher Buttons

## What to Do

Remove the Waivers / Trades / Draft quick-launch buttons from the GM bar
expanded panel. The bottom nav (Home, League, Draft, Activity) already
handles primary navigation. The League tab already shows Trades, Waivers,
and All Teams as tappable cards. The launcher buttons are redundant and
create visual noise.

The GM bar has one job: AI chat. Let it do that job cleanly.

---

## Changes Required

### 1. index.html — Remove the launcher button block

Find and delete this entire block (around line 940):

```html
<!-- Quick-launch buttons (Waivers / Trades / Draft) -->
<div class="gm-bar-launcher">
  <button class="gm-launch-btn" onclick="_gmLaunchWaivers()">
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
    <span>Waivers</span>
  </button>
  <button class="gm-launch-btn" onclick="_gmLaunchTrades()">
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>
    <span>Trades</span>
  </button>
  <button class="gm-launch-btn" onclick="_gmLaunchDraft()">
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
    <span>Draft</span>
  </button>
</div>
```

### 2. scout-ui.js — Remove the three launcher functions

Find and delete these three functions (around lines 155-185):

```js
function _gmLaunchWaivers() {
  _gmBarCollapse();
  if (typeof window.mobileTab === 'function') window.mobileTab('league');
  setTimeout(() => {
    if (typeof window._leagueEnterRoom === 'function') window._leagueEnterRoom('waivers');
  }, 180);
}
window._gmLaunchWaivers = _gmLaunchWaivers;

function _gmLaunchTrades() {
  _gmBarCollapse();
  if (typeof window.mobileTab === 'function') window.mobileTab('league');
  setTimeout(() => {
    if (typeof window._leagueEnterRoom === 'function') window._leagueEnterRoom('trades');
  }, 180);
}
window._gmLaunchTrades = _gmLaunchTrades;

function _gmLaunchDraft() {
  _gmBarCollapse();
  if (typeof window.mobileTab === 'function') window.mobileTab('draftroom');
  setTimeout(() => {
    if (typeof window.switchDraftView === 'function') window.switchDraftView('board');
  }, 180);
}
window._gmLaunchDraft = _gmLaunchDraft;
```

### 3. css/styles.css — Remove launcher CSS

Search for and delete any CSS rules targeting `.gm-bar-launcher` and
`.gm-launch-btn`. These are now dead styles.

### 4. scout-ui.js — Fix the placeholder bug while you're here

Replace the `_updateGlobalChatPlaceholder` function body:

Current (broken):
```js
function _updateGlobalChatPlaceholder() {
  const inp = document.getElementById('global-chat-in');
  if (!inp) return;
  const fi = window.GMEngine?.generateFieldIntel?.() || [];
  const top = (fi[0] || '').toString().trim();
  inp.placeholder = top ? `Ask about: ${top.length > 64 ? top.slice(0, 61) + '…' : top}` : 'Click here to ask Scout…';
}
```

Replace with:
```js
function _updateGlobalChatPlaceholder() {
  const inp = document.getElementById('global-chat-in');
  if (!inp) return;
  inp.placeholder = 'Ask Scout anything about your team…';
}
```

---

## What NOT to Change

- Do not touch the context chips (`TAB_CHIPS`, `renderCtxChips`) — those
  are prompt starters, not nav buttons, and should stay.
- Do not touch `_gmBarExpand`, `_gmBarCollapse`, or `_gmBarCollapseSoon`.
- Do not touch `fillGlobalChat` or `sendGlobalChat`.
- Do not touch the GM bar Alex block (`_renderGMBarAlexBlock`).
- Do not touch the League tab cards (Trades, Waivers, All Teams) —
  those are the correct navigation surface and stay as-is.

---

## Testing Checklist

1. Open the GM bar on any tab — no Waivers / Trades / Draft buttons visible.
2. The GM bar expanded state shows: Alex Learning bullets + context chips + chat input. Nothing else.
3. Tapping League tab still shows the three room cards (Trades, Waivers, All Teams).
4. Bottom nav still works: Home, League, Draft, Activity all navigate correctly.
5. Chat input placeholder reads "Ask Scout anything about your team…" not a truncated Field Intel bullet.
6. No JS errors in console from missing `_gmLaunchWaivers` etc. (they should be gone from HTML too).
