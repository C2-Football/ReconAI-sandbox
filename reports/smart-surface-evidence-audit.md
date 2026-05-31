# Smart Surface Evidence Audit

Date: 2026-05-15

## Rule

Every smart UI surface should answer: "Why am I showing this?" from structured league evidence. External feeds added in Phase 4 must enter through `App.Intelligence` context, evidence, or recommendation objects before they appear in UI copy.

## Shared Contracts

- `buildLeagueProfile()` normalizes league format, scoring, roster slots, and market-value compatibility.
- `buildPlayerContext()` normalizes player identity, value, format impact, roster fit, and evidence.
- `buildTeamContext()` normalizes team window, needs, surplus, position rooms, value, and evidence.
- `buildOwnerBehaviorProfile()` and `buildLeagueBehaviorBaselines()` normalize observed manager behavior.
- Recommendation factories emit reason-coded payloads for waiver, trade, roster, draft, market, and behavioral surfaces.
- `buildWhyView()` converts a recommendation into UI-ready explanation lines, chips, confidence, and evidence.
- `getSourceRegistry()` tracks source owner, access method, refresh cadence, license posture, and intended surfaces.
- `buildSourceEvidence()` normalizes feed outputs into source-keyed evidence with freshness and stale-data flags.

## Wired Surfaces

| Surface | Status | Evidence Path |
|---|---|---|
| Player card | Wired | `buildPlayerContext()` -> `buildRosterRecommendation()` -> `buildWhyView()` |
| Free Agency Action HQ | Wired | `buildPlayerContext()` -> `buildWaiverRecommendation()` -> `buildWhyView()` |
| Trade Center Deal HQ | Wired | `buildTeamContext()` + owner behavior -> `buildTradeRecommendation()` -> `buildWhyView()` |
| Owner Profiles | Wired | observed owner behavior facts separated from inference tags |
| Alex Insights / GM Office | Wired | `buildBehavioralRecommendation()` -> `buildWhyView()` -> Alex digest |
| Alex prompt context | Wired | league profile, recommendation digest, and behavioral context built from shared objects |

## Partial Surfaces To Convert Before Or During Phase 4

| Surface | Current Gap | Phase 4 Setup Requirement |
|---|---|---|
| Home dashboard widgets | Widgets show metrics, rankings, and badges but do not all emit shared recommendation/context objects. | Wrap each widget's primary signal in a `buildWhyView()` compatible recommendation or context summary. |
| Roster Pulse widget | Uses roster/team math directly. | Feed the widget from `buildTeamContext()` and show top explanation lines for the selected metric. |
| Market Radar widget | Market movement is local widget logic. | Convert rising/falling rows to `buildMarketAlertRecommendation()`. |
| League Landscape widget | League activity and transaction signals are bespoke. | Convert activity alerts to behavioral or market recommendation objects with source/freshness. |
| Draft Capital widget | Pick value and capital badges are not formal recommendation objects. | Emit draft/pick context with evidence for pick count, early capital, and league draft settings. |
| Competitive Tiers / Power Rankings widgets | Rankings are useful but not self-explaining from shared context. | Attach `buildTeamContext()` to each ranked team and surface rank drivers. |
| Player tag widgets | Tags are user state, not intelligence. | Keep tags as user-authored unless the app suggests a tag, then emit a recommendation object. |
| Draft room / mock draft | DNA and pick recommendations are not fully on the shared context contract. | Draft recommendations should use `buildDraftRecommendation()` with board rank, team need, owner DNA, and pick value evidence. |
| My Team drop alerts | Alerts are useful but still path-specific. | Convert add/drop advice to paired roster or waiver recommendations with explicit replacement evidence. |
| Custom Reports | Report rows can surface players and assets without a reliable click-through path. | Player rows must open player detail/context; team, pick, and trade rows need matching detail paths before the report is considered smart. |

## Deep Click-Through Validation

Every smart surface needs a verified interaction path, not just visible evidence. A card, table row, report row, badge, or alert that names a player, team, pick, or trade must let the user click through to the relevant detail/context view. Custom Reports are the known gap: player rows currently identify assets but do not reliably open the player detail view.

Validation should cover:

- Player references -> player modal or player context panel.
- Team/owner references -> team context or owner behavior profile.
- Pick references -> draft capital or pick context detail.
- Trade references -> deal detail or trade analyzer context.
- Report rows -> the same destination as the equivalent card/table row elsewhere in the app.

## Feed Integration Gate

Phase 4 feeds should be added only when each feed has:

- Source owner and license posture.
- Refresh cadence and freshness label.
- Normalized entity IDs.
- Evidence fields: `source`, `signal`, `value`, `freshness`, `present`.
- The app surfaces that consume it.
- Confidence behavior when the feed is missing, stale, or format-incompatible.

## Next Feed Targets

1. Source registry and freshness model.
2. FantasyCalc value snapshots into market evidence. Status: wired through shared request/snapshot helpers and DHQ LeagueIntel.
3. Sleeper transaction/trending feeds into behavioral and waiver evidence.
4. DynastyProcess or FantasyPros consensus into market confidence bands.
5. Manual/admin CSV path for premium feeds such as PFF.
