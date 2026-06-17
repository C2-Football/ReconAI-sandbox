# Shared Code Contract

**The neutral `C2-Football/dhq-shared` repo is the canonical owner of all shared
engine logic.** Both ReconAI/Scout (`reconai/`) and War Room (`warroom/`) vendor
these 30 modules into their own build — neither app depends on the other's repo.

In this repo the 30 modules live in `shared/` but are **gitignored**: they are
copied in from dhq-shared by `npm run sync:shared` (runs automatically on
`dev`/`build`/`start`). Do not edit them here — edits made in `shared/` are
overwritten on the next sync. The Scout-only modules in `shared/`
(`dev-preview-config.js`, `data-cache.js`, `season-calendar.js`,
`roster-snapshot.js`, `league-memory.js`) are tracked and owned by this repo.

---

## Source of truth

```
C2-Football/dhq-shared   (30 modules + manifest.json)
```

ReconAI bundles these into its Vite build (`main.js` side-effect imports);
War Room vendors them into `reconai-shared/` and loads them as classic scripts.
A change is live in each app after that app's own next deploy — no runtime CDN
dependency between the apps.

---

## Shared Files (owned by dhq-shared, vendored by both apps)

| File | Purpose | Key exports |
|------|---------|-------------|
| `app-config.js` | Public backend/runtime config — must load before provider/auth modules | `App.CONFIG`, `OD.CONFIG`, backend endpoint URLs |
| `constants.js` | Core constants — must load first | `App.POS_COLORS`, `App.ageCurveWindows`, `App.peakWindows`, `App.decayRates`, `App.BASE_PICK_VALUES`, `App.tradeValueTier`, `App.posMap`, `App.posClass`, `App.NFL_TEAMS` |
| `utils.js` | Utility functions | `App.normPos`, `App.posColor` (delegates to `POS_COLORS`), `App.calcRawPts`, `App.isElitePlayer` (7000+ DHQ or top 5 at position), `App.dhqLog` |
| `pick-value-model.js` | Dynamic dynasty pick valuation (3-phase exponential decay, KTC-calibrated) | `App.LI.dhqPickValueFn` |
| `dhq-core.js` | Standalone DHQ calculation helpers and lab engine | `App.DhqCore.*`, `calculateValues()` |
| `dhq-engine.js` | League Intel engine — scores every player using real league data | `App.LI`, `App.loadLeagueIntel()`, `App.calcOptimalPPG()` |
| `nfl-fit.js` | "Alex NFL Fit" — real-situation scouting signals + narrative (loads after `dhq-engine.js`) | `App.computeNFLFit()`, `App.fetchNFLFitNews()` |
| `dhq-providers.js` | Provider scoring logic | `dynastyValue()`, `getPlayerAction()` |
| `dhq-ai.js` | AI integration (Claude/Gemini) | `App.askAlex()` |
| `ai-dispatch.js` | AI message queue and routing | `App.AI.*` |
| `intelligence-context.js` | App-wide context and recommendation contracts | `App.Intelligence.*` |
| `analytics-engine.js` | League-wide analytics | `App.Analytics.*` |
| `assistant-tutorial.js` | Shared first-launch GM briefing tutorial | `App.AssistantTutorial.*` |
| `team-assess.js` | Roster/team strength assessment | `assessTeamFromGlobal()`, `assessAllTeamsFromGlobal()` |
| `player-modal.js` | Reusable player detail modal | `App.showPlayerModal()` |
| `sleeper-api.js` | Sleeper Fantasy API wrapper | `window.Sleeper.*` |
| `espn-api.js` | ESPN Fantasy API wrapper | `window.ESPN.*` |
| `supabase-client.js` | Auth + Owner DNA cloud sync | `window.OD.*` |
| `storage.js` | localStorage/sessionStorage abstraction | `window.Store.*` |
| `event-bus.js` | Cross-module pub/sub events | `window.Bus.*` |
| `tier.js` | Feature-flag / subscription gate (ReconAI app) | `getTier()`, `canAccess()` |

### Load Order (required)

`app-config.js` → `constants.js` → `utils.js` → `dhq-core.js` and `intelligence-context.js` before `dhq-engine.js` → `nfl-fit.js` (after `dhq-engine.js`) → everything else

`app-config.js` must load before `supabase-client.js`, `espn-api.js`,
`mfl-api.js`, `yahoo-api.js`, and AI/provider modules so all backend
function URLs and public Supabase values come from one source.

`constants.js` must come before `utils.js` because `posColor()` reads
`App.POS_COLORS`, which `constants.js` defines.

---

## Canonical Values (single source of truth in `constants.js`)

### Position colors — `App.POS_COLORS`
```js
{ QB:'#E74C3C', RB:'#2ECC71', WR:'#3498DB', TE:'#F0A500',
  K:'#9B59B6',  DL:'#E67E22', LB:'#1ABC9C', DB:'#E91E63' }
```
`posColor(pos)` in `utils.js` delegates to this object. Do not define
position colors anywhere else.

### Age curves — `App.ageCurveWindows`
```js
{
  QB:{build:[23,27],peak:[28,34],decline:[35,38]},
  RB:{build:[21,22],peak:[23,25],decline:[26,28]},
  WR:{build:[22,24],peak:[25,28],decline:[29,31]},
  TE:{build:[23,25],peak:[26,29],decline:[30,32]},
  DL:{build:[22,24],peak:[25,29],decline:[30,32]},
  LB:{build:[22,23],peak:[24,28],decline:[29,31]},
  DB:{build:[21,23],peak:[24,27],decline:[28,30]},
  K:{build:[23,27],peak:[28,35],decline:[36,40]}
}
```

`App.peakWindows` is derived from the elite peak portion of these curves.

### Decay rates — `App.decayRates`
```js
{ QB:0.12, RB:0.22, WR:0.18, TE:0.16, K:0.08, DL:0.15, EDGE:0.15, LB:0.16, DB:0.18 }
```
Annual value decline rate after the valuable decline band. Higher = steeper cliff.

### Elite assets and player value tiers

`App.isElitePlayer(pid)` is the canonical elite-asset rule:

```
DHQ >= 7000 OR top 5 at position → Elite asset
```

`App.tradeValueTier(val)` remains the pure value-band helper:

```
DHQ >= 7000  → Elite
DHQ >= 4000  → Starter
DHQ >= 2000  → Depth
DHQ >  0     → Stash
```
Use `window.App.tradeValueTier(dhq)` everywhere. Do not hardcode these
thresholds inline.

---

## How War Room Consumes Shared Code

War Room loads shared scripts through `js/shared/shared-loader.js`. In
production the loader resolves to `https://jcc100218.github.io/ReconAI/shared/`;
in local/file mode it resolves to `warroom/reconai-shared/` after
`npm run sync:shared`. Scripts run in the browser before War Room's own JS.

**Pattern for constants that could fail to load:**

War Room's `js/core.js` sets fallbacks with `||` guards so the app
degrades gracefully if the CDN is unavailable:

```js
// Good — CDN wins if present, fallback if not
window.App.ageCurveWindows = window.App.ageCurveWindows || AGE_CURVE_WINDOWS_DEFAULT;
window.App.peakWindows   = window.App.peakWindows   || PEAK_WINDOWS_DEFAULT;
window.App.decayRates    = window.App.decayRates    || { QB:0.12, ... };
window.App.tradeValueTier = window.App.tradeValueTier || function(val) { ... };
```

**Pattern for functions that might not exist:**

```js
// Good — optional-chain before calling
const color = window.App?.POS_COLORS?.[pos] || '#999';
const tier  = window.App?.tradeValueTier?.(dhq) || { tier: '—', col: 'var(--text3)' };
```

---

## Tier System Note

The two apps use different tier models intentionally:

| | ReconAI (Scout app) | War Room |
|---|---|---|
| Model | 30-day trial → paid | Subscription tiers |
| Tiers | free / trial / paid | free / scout / warroom |
| Gate fn | `canAccess(feature)` in `tier.js` | `canAccess(feature)` in `core.js` |
| Storage key | `STORAGE_KEYS.TRIAL_START` | `od_profile_v1.tier` |

Both read from the same Supabase profile (`od_profile_v1`) for the
authoritative tier string. The mapping is handled in each app's gate
function.

---

## Making Changes

- **Changing a shared constant** — edit `constants.js` in the `dhq-shared` repo only (NOT `reconai/shared/constants.js`, which is a vendored copy). Verify the fallback value in `warroom/js/core.js` matches, then update it if needed.
- **Changing `posColor()`** — update `POS_COLORS` in `dhq-shared/constants.js`. `posColor()` delegates automatically.
- **Adding a new shared function** — add to the appropriate `dhq-shared` module, then add a fallback in `warroom/js/core.js` with the `|| fallback` pattern.
- **Adding a new constant** — add to `dhq-shared/constants.js` and add a matching fallback in `warroom/js/core.js`.

## Backend Ownership

The production Supabase project is shared, but each Edge Function has one
source repo:

- **ReconAI owns provider proxies:** `espn-proxy`, `mfl-proxy`, `yahoo-proxy`.
- **War Room owns account, billing, admin, and server AI:** `ai-analyze`,
  `get-session-token`, `set-password`, `fw-signup`, `fw-signin`,
  `fw-create-checkout`, `fw-stripe-webhook`, `admin-list-users`.
- `yahoo-auth` is retired; `yahoo-proxy` is the single Yahoo OAuth/API surface.

Deploy functions by explicit name from the owning repo so one app does not
overwrite the other's backend surface.

### DHQ Labs

- `shared/dhq-core.js` is the standalone calculation surface for controlled experiments.
- `App.DhqCore.buildLineupContext()` simulates the configured starting lineup and reports position point share, marginal share, slot share, and lineup importance.
- `tools/dhq-playground.html` can be opened directly in a browser to adjust league size, roster slots, scoring, and mode.
- `npm run dhq:lab -- --data-file tools/dhq-sample-data.json` runs the same core from Node without app state.

After editing any shared module: `git push origin main` in `dhq-shared/`. Each app vendors the change on its next build (`npm run sync:shared`, which runs automatically on dev/build/deploy).
