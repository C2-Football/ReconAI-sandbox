# Intelligence Product Roadmap

## Product Goal

Every recommendation in ReconAI and War Room should be grounded in the same reality layer: league format, scoring, roster state, market movement, owner behavior, historical league patterns, and source freshness. Alex Ingram should explain the intelligence, not be the only place where intelligence exists.

## Operating Principles

- Shared context before smart copy. Cards, widgets, calculators, and Alex should consume the same structured context objects.
- Deterministic ranking before LLM explanation. Engines decide the recommendation; AI explains it and adapts tone.
- Every recommendation needs evidence. A card should know which league facts, market signals, and behavioral signals caused it to appear.
- Confidence is a product feature. Low-confidence signals should be labeled or downweighted instead of hidden behind strong wording.
- Source licensing is part of the architecture. Clean APIs/imports are product-ready; scraped or personal-subscription data stays optional/manual until licensing is clear.

## Roadmap

### Phase 0: Context Contract

Status: complete.

Goal: create a shared, versioned contract for league profile and recommendation evidence so all app surfaces can converge.

Deliverables:
- `App.Intelligence.buildLeagueProfile()` for canonical league context.
- `App.Intelligence.createRecommendation()` for scored recommendation objects with reasons, evidence, and confidence.
- Shared loader coverage in War Room and ReconAI.
- Contract tests that prevent silent drift.

Acceptance criteria:
- Any feature can ask for league format tags like `superflex`, `full-ppr`, `idp`, `custom-scoring`.
- Any recommendation can carry reason codes, evidence sources, and a confidence label.
- War Room local preview sync copies the shared intelligence module.

### Phase 1: League Reality Layer

Status: complete.

Goal: make every major feature aware of the real league shape.

Deliverables:
- Canonical scoring normalization for Sleeper, ESPN, MFL, Yahoo.
- League Profile block generated from `App.Intelligence`, not custom string building.
- Format compatibility score for FantasyCalc and other market values.
- UI-safe badges for format-driven differences: SF premium, TE premium, IDP, first-down bonuses, deep lineup, custom scoring.

First surfaces:
- Player cards.
- Trade calculator.
- Waiver recommendations.
- Alex context builder.

Acceptance criteria:
- A player card can explain why a value is higher or lower in this league.
- A trade recommendation can state which scoring/roster facts changed the math.
- Alex and non-Alex UI show consistent format facts.

### Phase 2: Recommendation Engine Unification

Status: complete.

Goal: stop each surface from inventing its own recommendation logic.

Deliverables:
- Shared recommendation factories for waiver, trade, roster, draft, and market alerts.
- Reason-code library covering roster need, surplus, age window, market movement, production signal, schedule signal, owner behavior, and evidence gaps.
- Deterministic ranking with confidence penalties for stale or missing data.
- Structured recommendation payloads rendered by UI cards and summarized by Alex.

First surfaces:
- `free-agency.js`
- `trade-engine.js`
- `trade-calc.js`
- `player-card.js`
- `alex-insights.js`

Acceptance criteria:
- Waiver and trade cards render from recommendation objects, not bespoke copy.
- Alex receives the same top recommendation objects the cards use.
- Each displayed recommendation can expose a "why this" detail with 2-4 evidence points.

### Phase 3: Behavioral And Historical Intelligence

Status: complete.

Goal: make War Room feel like it knows the league, not just football.

Deliverables:
- Owner DNA facts sourced from actual league behavior.
- Trade tendency profiles: pick hoarder, veteran buyer, youth buyer, depth consolidator, panic seller, positional-need responder.
- Historical league baselines: draft hit rates, waiver activity, trade frequency, positional over/underpayment.
- Behavior-aware trade offers and outreach copy.

Acceptance criteria:
- Trade suggestions identify why the other manager is likely to consider the offer.
- Owner cards separate observed behavior from inference.
- Recommendations change when manager behavior conflicts with generic market value.

### Phase 4: External Intelligence Spine

Status: in progress. Source registry and freshness/evidence contracts are wired into shared recommendation objects. FantasyCalc is the first shared live-feed adapter; Sleeper trending/transactions are next.

Goal: add clean source feeds without making the app legally or operationally fragile.

Production-safe feeds:
- Sleeper API.
- FantasyCalc values.
- nflverse / nflreadpy / nfl_data_py.
- DynastyProcess data.
- CollegeFootballData API.
- FantasyPros API if access is approved.
- The Odds API paid tier if NFL odds are needed.

Optional/manual or licensing-review feeds:
- PFF CSV import.
- Reception Perception notes.
- RAS import.
- Stathead exports.

Reference-only sources:
- KeepTradeCut full rankings/values.
- Any paid site without API/export or explicit commercial permission.

Acceptance criteria:
- Source registry tracks owner, access method, refresh cadence, license posture, and surfaces fed.
- No recommendation depends on a source that cannot be refreshed or legally used in the intended product tier.

Current implementation:
- `buildFantasyCalcRequest()` builds league-specific market requests from the canonical league profile.
- `fetchFantasyCalcSnapshot()` fetches and caches FantasyCalc rows, then returns normalized player/pick indexes plus source evidence.
- DHQ LeagueIntel consumes the shared FantasyCalc adapter instead of a one-off hardcoded request.

### Phase 5: Eval Harness And Product QA

Goal: prove the app is getting smarter instead of just more verbose.

Deliverables:
- Offline fixtures for league profiles, cards, waivers, trades, and Alex prompts.
- Golden recommendation tests for SF, 1QB, TEP, IDP, keeper, redraft, and bonus-heavy leagues.
- UI QA for "why this" details on cards and widgets.
- Deep click-through path validation for every smart surface: player rows open player detail/context, team rows open team context, trade rows open deal detail, pick rows open draft/pick context.
- Cost-aware AI evals that check context quality, not just model routing.

Acceptance criteria:
- Tests catch missing league context before release.
- Every smart surface has at least one eval fixture.
- Regression tests include "AI explanation matches deterministic recommendation."
- Browser QA proves every card/table/report row that references a player, team, pick, or trade has a working click path to the relevant detail view.

## First Two Sprints

### Sprint 1: Intelligence Spine

- Finish `App.Intelligence` contract.
- Wire league profile into Alex context builders.
- Add first UI readout on player cards: format tags and top reason.
- Convert one waiver recommendation path to emit structured recommendations.
- Add tests for SF/TEP/IDP/custom scoring.

### Sprint 2: Smart Cards And Trade Proof

- Convert player cards to consume recommendation/evidence snippets.
- Convert trade recommendations to emit reason-coded payloads.
- Add Owner DNA evidence fields to trade recommendation objects.
- Add "why this trade works for them" as structured output.
- Add eval fixtures for contender, rebuilder, and stuck-middle teams.

## Definition Of Done For Smart Recommendations

A recommendation is not done until it has:

- Subject: player, team, pick, trade, waiver target, or roster action.
- Action: add, sell, hold, target, avoid, start, bench, shop, counter.
- Score: 0-100 product ranking score.
- Reasons: stable reason codes plus concise details.
- Evidence: source, signal, value, and freshness.
- Confidence: high, medium, or low.
- UI copy: short enough for cards.
- Alex copy: generated from the same payload, not separate logic.
- Click path: if the recommendation references a player, team, pick, trade, or report row, the user can click through to the relevant detail/context view.
