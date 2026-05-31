# Claude Code Prompt: Remove GM Bar Launcher Buttons

## What To Do

Remove the WAIVERS / TRADES / DRAFT launcher buttons from the GM bar
expanded overlay. The bottom nav (Home, League, Draft, Activity) already
handles primary navigation. The League tab already has dedicated room
cards (Trades, Waivers, All Teams). These buttons are redundant and
create visual noise.

This is a focused cleanup — three changes, no logic rewrites.

---

## Change 1: Remove the launcher buttons from index.html

Find this block in index.html (inside `<div class="global-chat-overlay">`):

```html
<!-- Quick-launch buttons (Waivers / Trades / Draft) -->
<div class="gm-bar-launcher">
  <button class="gm-launch-btn" onclick="_gmLaunchWaivers()">
    ...
  </button>
  <button class="gm-launch-btn" onclick="_gmLaunchTrades()">
    ...
  </button>
  <button class="gm-launch-btn" onclick="_gmLaunchDraft()">
    ...
  </button>
</div>
```

Delete the entire `<div class="gm-bar-launcher">...</div>` block.
Do not touch anything else in index.html.

---

## Change 2: Remove the three launcher functions from scout-ui.js

Find and delete these three functions in js/scout-ui.js:

- `_gmLaunchWaivers()` and its `window._gmLaunchWaivers = _gmLaunchWaivers;` export
- `_gmLaunchTrades()` and its `window._gmLaunchTrades = _gmLaunchTrades;` export
- `_gmLaunchDraft()` and its `window._gmLaunchDraft = _gmLaunchDraft;` export

Also delete the comment block above them:
```
// Launcher button handlers — switch tab, then nudge the sub-view,
// then collapse the GM bar. Each call is chained so the user lands in
// the exact destination they asked for.
```

Keep `_gmBarExpand`, `_gmBarCollapse`, `_gmBarCollapseSoon`,
`fillGlobalChat`, and all other functions intact.

---

## Change 3: Fix the chat placeholder

While in scout-ui.js, find `_updateGlobalChatPlaceholder` and replace
the entire function body with a static placeholder:

```js
function _updateGlobalChatPlaceholder() {
  const inp = document.getElementById('global-chat-in');
  if (!inp) return;
  inp.placeholder = 'Ask Scout anything about your team…';
}
```

This removes the broken behavior where the first Field Intel bullet was
being jammed into the input placeholder on every tab change.

---

## What NOT to Change

- Do not touch the bottom mobile nav (Home, League, Draft, Activity)
- Do not touch the League tab room cards (Trades, Waivers, All Teams)
- Do not touch `renderCtxChips()` or the TAB_CHIPS object
- Do not touch `_gmBarExpand()` or `_gmBarCollapse()`
- Do not touch `_renderGMBarAlexBlock()` — the Alex Learning bullets
  in the expanded panel are correct and should remain
- Do not touch any CSS — the `.gm-bar-launcher` class can stay in
  styles.css as dead CSS, no need to clean it up now

---

## Testing Checklist

1. Open the app and tap the chat bar — the expanded overlay should show
   Alex Learning bullets and context chips, but NO Waivers/Trades/Draft
   buttons.
2. The chat input placeholder should read "Ask Scout anything about your
   team…" on all tabs — not a truncated Field Intel bullet.
3. Tapping League in the bottom nav still navigates to the League tab.
4. The League tab still shows the Trades / Waivers / All Teams room cards.
5. No console errors about `_gmLaunchWaivers`, `_gmLaunchTrades`, or
   `_gmLaunchDraft` being undefined — confirm the HTML block was fully
   removed so no orphaned onclick handlers remain.
