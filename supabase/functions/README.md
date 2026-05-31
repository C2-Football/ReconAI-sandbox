# Supabase Function Ownership

The production Supabase project is shared by Scout and War Room. To avoid
deploy drift, each function has one source repo.

## Owned Here

- `espn-proxy` - ESPN private league proxy.
- `mfl-proxy` - MyFantasyLeague CORS/server relay.
- `yahoo-proxy` - Yahoo OAuth callback, token storage, refresh, and API proxy.

## Owned By War Room

- `ai-analyze` - official server AI routing, rate limits, telemetry, and model policy.
- `get-session-token` - legacy Sleeper username JWT session issuer.
- `set-password` - gifted-user password setup.
- `fw-signup`, `fw-signin`, `fw-create-checkout`, `fw-stripe-webhook`, `admin-list-users` - email auth, billing, and admin functions.

## Retired

- `yahoo-auth` is retired. Use `yahoo-proxy` for both OAuth and API proxying.

Deploy individual functions by name from the owning repo. Do not deploy a
same-named function from the other repo.
