# Scout Draft Follow-Up Scope

Date: 2026-05-16
Scope: ReconAI / Scout follow-up to the War Room draft module roadmap
Product frame: Scout should mirror War Room draft truth, but package it as the mobile companion, prep coach, saved-artifact library, and quick action surface.

## Executive Read

Scout is already draft-aware. It has a Draft Room, Rookie Big Board, Dynamic Mock Draft, GM Strategy editor, Today briefing, Portfolio artifacts, League Intel owner cards, shared Owner DNA inputs, shared MockEngine logic, and the beginning of a shared intelligence context contract.

The follow-up project should not make Scout a second War Room Draft Command Center. War Room should remain the dense operating room for boards, mocks, live draft execution, trade construction, and full league analysis. Scout should make those same draft systems usable on the go:

- Tell the user what draft prep matters today.
- Show the three board lanes in a compact mobile UI.
- Let the user edit their own board, ranks, tiers, flags, and notes.
- Save and summarize analyst-style projected mocks.
- Surface Owner DNA draft and trade tendencies at the right moment.
- Carry live draft, mock draft, and recap intelligence into Today, Portfolio, League Intel, and Scout AI.

The highest-leverage move is to share the draft brain with War Room and make Scout the clean, fast follow-through layer.

## Current Scout State

### Draft Room

Files: `index.html`, `js/draft-ui.js`

Scout already has a two-card Draft Room entry:

- Big Board
- Dynamic Mock Draft

The Big Board view currently includes:

- User picks summary.
- Alex / Rookie HQ hero card.
- Top prospects.
- Draft summary.
- Rookie board table with search, position filter, tag filter, and group-by-position mode.
- Player expansion with summary, draft capital chips, tags, Scout Report, and Player Card path.

The Mock Draft view currently includes:

- Rookie and startup mock modes.
- Sleeper draft order and traded-pick awareness when available.
- Team profile inputs from league data and owner profiles.
- CPU picks routed through shared `MockEngine.personaPick()`.
- Draft DNA preload when available.
- User pick flow for the user's roster.
- AI insight moments.
- Lightweight CPU-generated trade offers.
- Save template path for user picks.

Current gap: this is strong for a rookie draft, but it is not yet first-class for startup, redraft, and best ball. It also does not expose the three-board model or analyst-style league mock reports yet.

### Big Board And User Prep

Files: `js/draft-ui.js`, `shared/rookie-data.js`, `shared/supabase-client.js`

Scout currently supports player tags:

- Target
- Watch
- Priority
- Fade

Tags can sync through the existing player tags path. This is useful, but it is not enough for real GM/front-office prep.

Needed upgrade:

- Manual custom rank.
- Manual tier.
- Board notes.
- Position-specific queue.
- Lock / do-not-draft / trade-up target flags.
- "My Board" history and versioning.
- Sync with War Room so board work in Scout is not isolated.

The user-controlled board should start as the AI Recommended Board, then become fully editable. That keeps Scout helpful by default without taking control away from the user.

### GM Strategy

Files: `shared/strategy.js`, `js/scout-ui.js`, `shared/gm-engine.js`

Scout already has a GM Strategy surface with:

- Mode.
- Timeline.
- Alex personality.
- Aggression.
- Target positions.
- Sell positions.
- Draft style.
- Market posture.

The existing `checkAlignment()` path already knows about draft actions. `gm-engine.js` also emits draft-aware next moves during pre-draft and draft-week phases.

Needed upgrade:

- Strategy needs richer draft controls: board basis, risk posture, position locks, value-vs-need blend, target archetypes, fade archetypes, and mock-trade aggression.
- Strategy should generate the AI Recommended Board and projected mock settings.
- Scout Today should explain the recommendation in operational language, then deep-link into the relevant board or mock.

### Owner DNA And League Intel

Files: `js/scout-ui.js`, `shared/mock-engine.js`, `shared/intelligence-context.js`

Scout already has League Intel owner cards and shared owner behavior inputs. The shared MockEngine also accepts owner draft DNA, trade DNA, posture, roster assessment, draft outcomes, and league hit-rate context.

This matters. Full historical league intel should be a first-order input, not decoration:

- Which owners reach by position.
- Which owners draft by need.
- Which owners chase rookies, youth, production, or name value.
- Which owners trade up or down.
- Which owners accept uneven pick packages.
- Which owners historically snipe the user's target archetypes.
- Which owners react to scarcity runs.
- Which owners ignore positional value.

Needed upgrade:

- League Intel owner cards should expose "draft tendencies" and "likely on-clock behavior."
- Mock picks should show Owner DNA rationale.
- Trade suggestions should explain owner-specific acceptance odds separately from raw DHQ value.
- Scout should use the same Owner DNA output as War Room, not a separate heuristic.

### Shared Intelligence Context

Files: `shared/intelligence-context.js`, `reports/intelligence-product-roadmap.md`, `reports/smart-surface-evidence-audit.md`

Scout already has the shared intelligence context foundation. The current audit notes that Draft Room and Mock Draft are only partially on the shared recommendation contract.

Needed upgrade:

- Draft recommendations should be emitted through `buildDraftRecommendation()` or its expanded successor.
- Evidence should include board rank, DHQ value, roster need, GM Strategy, Owner DNA, draft capital, league behavior, and pick value.
- Scout surfaces should show recommendation confidence and evidence without becoming dense.
- Click-through paths should work from Today, Portfolio, League Intel, boards, mock picks, and player rows.

### Portfolio And Saved Artifacts

Files: `js/scout-ui.js`, `js/draft-ui.js`

Scout Portfolio already reads:

- Saved mock templates.
- Rookie tags.
- Trade artifacts.
- Waiver artifacts.
- Field log data.

Needed upgrade:

- Saved AI Recommended Boards.
- Saved My Board versions.
- Saved analyst-style projected mocks.
- Draft recap artifacts.
- Live draft follow-up artifacts.
- "What changed since last mock" deltas.

Portfolio is the natural Scout home for front-office draft prep artifacts.

## Where War Room Improvements Apply To Scout

### 1. Three-Board Model

Scout should adopt the same three board lanes as War Room:

| Board | Scout Role | Notes |
| --- | --- | --- |
| DHQ Board | Neutral value baseline | Default board sorted by DHQ value. Useful for market/value discipline. |
| AI Recommended Board | Strategy-aware assistant board | Generated from GM Strategy, roster build, league format, pick capital, Owner DNA, and draft context. |
| My Board | User-owned front-office board | Starts as AI Recommended, then supports manual rank, tiers, notes, flags, and overrides. |

Scout UX should use a segmented control in the Big Board view:

- `DHQ`
- `AI`
- `My Board`

The mobile board should stay compact. Heavy table comparison belongs in War Room.

### 2. AI Recommended Board

The AI Recommended Board should be generated from:

- GM Strategy.
- Draft type: rookie, startup, redraft, best ball.
- League format and scoring.
- Roster construction.
- Current picks and traded picks.
- Owner DNA and league draft history.
- DHQ value and position scarcity.
- User risk posture.
- Target and fade preferences.

Scout application points:

- Draft Room hero: "Your board is currently tilted toward WR upside because your roster has RB age risk but WR scarcity is forming before pick 2.03."
- Today card: "Review AI Board changes before the next mock."
- Scout AI: answers board questions from the same board object.
- Portfolio: stores the latest generated board and deltas.

### 3. My Board And Notes

Scout must preserve user control. The user should be able to prepare like a real GM:

- Drag or adjust rank.
- Assign tiers.
- Add notes.
- Mark targets, fades, watches, and trade-up candidates.
- Pin player-specific concerns.
- Filter by position, tag, tier, and availability.
- Compare "My Board vs AI Board" without overwriting the user's work.

This should sync both ways with War Room. Scout is a natural place for quick edits and notes. War Room is the natural place for heavy board work.

### 4. Analyst-Style Projected Mock Drafts

The user asked for mocks that the app rolls out like pre-NFL draft analyst projections, not only mocks the user plays through.

Scout should add a "Projected Mock" artifact flow:

- Generate full league projection.
- Save it as a dated report.
- Show every team's projected pick, with confidence and Owner DNA rationale.
- Highlight the user's likely options by pick.
- Identify likely snipes and tier cliffs.
- Show trade-up and trade-down windows.
- Compare mock versions over time.
- Let the user open the full projection in War Room.

Scout should show this as a readable report, not a massive spreadsheet. The best Scout summary is:

- Your projected picks.
- Biggest risk before your pick.
- Best value likely to fall.
- Owners most likely to move.
- Positions likely to run.
- Recommended prep change.

### 5. Trade Simulation Carryover

Scout currently has lightweight mock trade advice and CPU-generated trade offers. It should consume War Room's heavier trade realism work:

- User-initiated trade offers from mock context.
- Owner-specific acceptance likelihood from Owner DNA.
- Raw DHQ value shown separately from psych/acceptance modifiers.
- Pick-package suggestions by owner.
- "Why this owner might accept" rationale.
- Trade-up/down windows inside analyst projected mocks.

Scout's role should be quick judgment and follow-up. Full construction and negotiation should deep-link to War Room.

### 6. Live Draft Companion

Scout should not try to become the full live draft board on mobile. It should become the live companion:

- "You are 4 picks away."
- "Your top tier has 3 players left."
- "Owner before you historically takes WR in this range."
- "Trade-down market is strong because two owners need QB."
- "Your My Board and AI Board disagree on the next pick."
- "Open War Room live draft."

This makes Scout valuable during a live draft without forcing dense workflows into a small screen.

### 7. Redraft And Best Ball

Scout currently has rookie/startup-oriented draft UX. The follow-up should broaden it after shared draft contracts exist:

- Redraft board mode.
- Best ball board mode.
- Format-specific roster construction guidance.
- Exposure and stacking notes for best ball.
- Round-by-round build targets.
- Format-specific analyst mocks.

The important correction is that this is fantasy football only. The format expansion is best ball, not baseball.

## Strategic P List

### P0 - Shared Draft Context And Artifact Contract

Goal: Make Scout consume the same draft truth as War Room.

Deliverables:

- Define shared `DraftContext` for draft type, scoring, picks, traded picks, roster needs, board source, strategy, owner profiles, and league history.
- Define shared `DraftBoardState` for DHQ Board, AI Recommended Board, and My Board.
- Define shared `DraftArtifact` for projected mocks, interactive mocks, recaps, and board snapshots.
- Expand `buildDraftRecommendation()` to support board lane, pick number, owner rationale, confidence, evidence, and click-through metadata.
- Add persistence for board state and draft artifacts beyond current player tags.
- Confirm whether `draft_boards` exists in live schema. If not, add a real migration instead of relying on RLS policy references.

Scout files likely touched:

- `shared/intelligence-context.js`
- `shared/mock-engine.js`
- `shared/strategy.js`
- `shared/supabase-client.js`
- `tests/intelligence-context-contract.js`
- `tests/rls-contract.js`

War Room dependency:

- War Room should remain the source-of-truth implementation for dense draft logic and board semantics.

### P1 - Scout Three-Board Draft Room

Goal: Upgrade Scout Big Board into a first-class mobile board system.

Deliverables:

- Add DHQ / AI / My Board segmented control.
- Generate AI Recommended Board from shared context.
- Initialize My Board from AI Recommended Board.
- Add manual rank, tier, note, target, watch, priority, fade, and trade-up flags.
- Add "AI vs My Board" deltas.
- Keep existing player modal and Scout Report paths.
- Sync board changes to shared persistence.

Scout files likely touched:

- `index.html`
- `js/draft-ui.js`
- `js/scout-ui.js`
- `shared/supabase-client.js`

Acceptance bar:

- A user can prepare a personal board on mobile, leave Scout, reopen it, and see the same board in War Room.

### P2 - Analyst-Style Projected Mock Reports

Goal: Add mocks the app publishes as league projections, separate from interactive mock drafts.

Deliverables:

- Add "Projected Mock" entry point in Draft Room and Tools.
- Generate full league projection from shared MockEngine.
- Let user set tuning: Owner DNA weight, class/value weight, roster need, variance, trade aggression, no-trade mode.
- Save projected mock artifacts.
- Show pick-by-pick rationale with Owner DNA evidence.
- Highlight user's likely options, likely snipes, tier cliffs, and trade windows.
- Add compare-to-previous projection.

Scout files likely touched:

- `js/draft-ui.js`
- `js/scout-ui.js`
- `shared/mock-engine.js`
- `shared/intelligence-context.js`

Acceptance bar:

- Scout can generate a readable "analyst mock" without the user playing through every pick.

### P3 - Scout Today, Portfolio, And League Intel Integration

Goal: Make draft intelligence show up where Scout users already work.

Deliverables:

- Today briefing cards for board prep, projected mock changes, tier cliffs, and live draft readiness.
- GM Engine next moves grounded in the new draft artifacts.
- Portfolio cards for board snapshots, projected mocks, mock recaps, and draft notes.
- League Intel owner cards with draft tendencies, likely pick behavior, and trade appetite.
- Scout AI answers board and mock questions from shared artifacts.

Scout files likely touched:

- `js/scout-ui.js`
- `js/ai-chat.js`
- `shared/gm-engine.js`
- `shared/intelligence-context.js`

Acceptance bar:

- Scout tells the user what changed and what to do next without requiring them to open the full Draft Room.

### P4 - Live Draft Companion And War Room Handoff

Goal: Follow along during the draft with mobile alerts and fast recommendations.

Deliverables:

- Live on-clock companion state.
- Alerts for upcoming picks, tier cliffs, target snipes, and trade windows.
- "My Board vs AI Board" pick conflict alert.
- Owner-on-clock tendency summary.
- War Room deep links for full board, trade construction, and live draft execution.
- Draft recap artifact after completion.

Scout files likely touched:

- `js/draft-ui.js`
- `js/scout-ui.js`
- `shared/gm-engine.js`
- `shared/intelligence-context.js`

Acceptance bar:

- Scout is useful during a live draft even if the user is only checking their phone.

### P5 - QA, Contracts, And Evaluation

Goal: Prevent draft intelligence from drifting across Scout and War Room.

Deliverables:

- Contract tests for DraftContext, DraftBoardState, and DraftArtifact.
- MockEngine tests for owner-DNA weighting, class-value weighting, need weighting, variance, and no-trade mode.
- Intelligence-context tests for draft recommendation evidence.
- Browser QA for Draft Room board modes, projected mock reports, Portfolio artifacts, and click-through paths.
- Mobile viewport checks for dense board rows and modal states.
- Regression checks for rookie, startup, redraft, and best ball modes.

Acceptance bar:

- Scout and War Room show the same draft truth, and every recommendation can explain its evidence.

## Implementation Notes

### Keep Canonical Logic Shared

Shared ownership should look like this:

| Layer | Owner |
| --- | --- |
| Mock pick logic | `shared/mock-engine.js` |
| Recommendation evidence | `shared/intelligence-context.js` |
| GM Strategy | `shared/strategy.js` |
| Owner DNA | Shared league intel / owner profile sources |
| Dense draft command center | War Room |
| Mobile draft companion | Scout |

Scout should not fork owner-DNA, board-ranking, or mock-pick logic.

### Data Model Needed

Current player tags are useful but too narrow. The follow-up likely needs shared persistence for:

- Board lane: `dhq`, `ai`, `user`.
- Draft type: `rookie`, `startup`, `redraft`, `best_ball`.
- Board version.
- Player ranks.
- Tiers.
- Tags.
- Notes.
- Source board id.
- Strategy snapshot.
- Context hash.
- Updated at.

Projected mocks need separate artifact storage:

- Draft type.
- Settings / tuning.
- Generated pick list.
- Owner rationale.
- Trade assumptions.
- User-pick summary.
- Confidence.
- Created at.

### Product Risks

- If Scout builds its own draft brain, it will drift from War Room.
- If AI overwrites the user's board, it will violate the front-office prep model.
- If projected mocks hide Owner DNA evidence, they will feel generic.
- If Scout tries to show full War Room density on mobile, it will become hard to use.
- If saved artifacts stay in local storage only, cross-device and War Room carryover will break.
- If draft recommendations are not on the shared intelligence contract, Scout AI and Today will disagree with Draft Room.

## Recommended First Sprint

1. Add the shared draft context and board artifact contracts.
2. Confirm and, if needed, create real persistence for `draft_boards` and draft artifacts.
3. Add the three-board segmented control to Scout Big Board.
4. Make My Board clone from AI Recommended Board, then support manual edits and notes.
5. Add a projected mock report wrapper around shared MockEngine.
6. Add Scout Today and Portfolio cards that read the new draft artifacts.
7. Add contract tests and mobile browser QA before calling the surface ready.

## Bottom Line

Scout can become the best follow-up layer for the War Room draft module because most of the pieces already exist. The key is to connect them through shared contracts, preserve user-owned board prep, use full Owner DNA and league history, and give Scout mobile-native draft intelligence instead of a smaller copy of War Room.
