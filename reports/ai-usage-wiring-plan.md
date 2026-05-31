# AI Usage Wiring Plan

Goal: every AI surface in Scout and War Room should work in local preview and production without exposing production provider secrets in browser code.

## Key Contract

Production keys live as Supabase Edge Function secrets on the shared project `sxshiqyxhhifvtfqawbq`:

- `GOOGLE_AI_KEY`: low-cost default for fast and standard work.
- `OPENAI_API_KEY`: strong standard fallback and BYO-compatible provider path.
- `ANTHROPIC_API_KEY`: premium and deep reasoning path.
- `AI_ENABLED`: default `true`; set `false` to pause server AI.
- `AI_KILL_SWITCH`: emergency hard stop.
- `AI_FAST_PROVIDER`, `AI_STANDARD_PROVIDER`, `AI_PREMIUM_PROVIDER`, `AI_DEEP_PROVIDER`: optional provider overrides.
- `AI_GLOBAL_DAILY_COST_LIMIT_USD`, `AI_GLOBAL_MONTHLY_COST_LIMIT_USD`: global spend caps.
- `AI_MAX_INPUT_CHARS`, `AI_MAX_OUTPUT_TOKENS`: prompt and output safety caps.

Local preview keys live in `.env.local` in the app repo you are running:

- Preferred: `OPENAI_API_KEY=...`
- Optional model override: `OPENAI_MODEL=gpt-5.4-mini`
- Alternative: `GOOGLE_AI_KEY=...` or `GEMINI_API_KEY=...`
- Alternative: `ANTHROPIC_API_KEY=...`

Do not commit `.env.local`.

## Runtime Flow

1. Browser calls shared `callClaude(...)` / `dhqAI(...)`.
2. Shared `ai-dispatch.js` checks for server AI first.
3. Production uses Supabase `/functions/v1/ai-analyze`.
4. Local preview uses same-origin `/api/dev-ai-analyze`.
5. If the user has a BYO key in session storage, direct provider calls remain available and are tagged as BYO.
6. War Room server-side AI usage is reserved and recorded through `reserve_ai_usage` and `record_ai_usage_result`.

## Local Preview Behavior

War Room already exposes `/api/dev-ai-analyze` through `scripts/serve-static.cjs`.

Scout now exposes `/api/dev-ai-analyze` through Vite middleware in `vite.config.js`, and `shared/dev-preview-config.js` points local/sandbox AI calls there before `shared/app-config.js` loads.

If no local key is present, the app should fail with a setup message instead of looking broken:

`Local AI preview bridge is not configured. Add OPENAI_API_KEY, GOOGLE_AI_KEY, GEMINI_API_KEY, or ANTHROPIC_API_KEY to reconai/.env.local and restart the preview.`

## Recommended Startup Setup

For development, add the same provider key to both repos while testing both apps:

```bash
# /Users/jacobc/Projects/reconai/.env.local
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-5.4-mini

# /Users/jacobc/Projects/warroom/.env.local
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-5.4-mini
```

For production, set all three provider secrets in Supabase so routing and fallback work:

```bash
supabase secrets set GOOGLE_AI_KEY=...
supabase secrets set OPENAI_API_KEY=...
supabase secrets set ANTHROPIC_API_KEY=...
supabase secrets set AI_ENABLED=true
supabase secrets set AI_GLOBAL_DAILY_COST_LIMIT_USD=50
supabase secrets set AI_GLOBAL_MONTHLY_COST_LIMIT_USD=1000
```

## Validation

- ReconAI: `npm run test:ai`
- War Room: `npm run test:ai`
- Local smoke: POST to `http://127.0.0.1:<port>/api/dev-ai-analyze`
- Production smoke: authenticated call through Supabase `ai-analyze`
