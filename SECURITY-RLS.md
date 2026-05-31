# Supabase RLS Contract

ReconAI owns the shared Supabase data contract used by ReconAI Scout and War Room. Browser clients use the public anon key plus an app-issued JWT. Edge Functions use the service-role key and bypass RLS for server-owned workflows.

## Two identity principals

The browser carries one of two JWT types, and most client-writable tables now authorize against **either**:

- **Account (Dynasty HQ email/password)** — minted by `fw-signup` / `fw-signin`. Carries `app_metadata.user_id = public.app_users(id)` (a UUID); **no** Sleeper username claim. This is the primary security principal and matches billing RLS. Surfaced in SQL via `public.current_app_user_id()`.
- **Legacy Sleeper (password-backed)** — minted by `get-session-token`. Carries `app_metadata.sleeper_username`. Surfaced via `public.current_dhq_username()`. Self-serve Sleeper usernames are **not** identity proof, so only password-backed sessions ever mint this.

Each single-owner table has a `user_id uuid references app_users(id)` column alongside its legacy username column, and **two parallel permissive policies**:

- `<table>_account_own` — `using (user_id = current_app_user_id())`, `with check (user_id = current_app_user_id() AND <owner_col> IS NULL)`. The `IS NULL` guard stops an account from stamping a victim's username on a row it owns.
- the original legacy policy — `using/with check (<owner_col> = current_dhq_username())`, left untouched.

Token type self-selects which policy fires (the other identity helper returns NULL), so the policies never overlap. A row is owned by **exactly one** principal: account rows have `user_id` set + username NULL; legacy rows have username set + `user_id` NULL. There is no automatic mapping between a Sleeper username and an app_user, so the two datasets are not merged.

The client (`shared/supabase-client.js`) resolves the principal via `getOwnerIdentity()` (account wins, forces username NULL), stamps `ownerCols()`, scopes reads with `applyOwnerFilter()`, and picks the upsert arbiter with `ownerConflict()`.

## Client-Writable Tables

These tables may be written directly by the browser, but only for the current principal:

| Table | Client access | Owner columns |
| --- | --- | --- |
| `users` | read/insert/update own profile row (**legacy Sleeper only**; accounts use `app_users` via `fw-profile`) | `sleeper_username` |
| `calendar_events` | manage own rows | `user_id` / `username` |
| `earnings` | manage own rows | `user_id` / `username` |
| `fa_targets` | manage own rows | `user_id` / `username` |
| `owner_dna` | manage own rows | `user_id` / `username` |
| `draft_boards` | manage own rows | `user_id` / `sleeper_username` |
| `messages` | send as self, read sender/recipient rows, mark received rows read (**legacy Sleeper only**; account DM deferred) | `from_username` / `to_username` |
| `ai_analysis` | manage own saved AI history | `user_id` / `username` |
| `field_log` | manage own field log entries | `user_id` / `username` |
| `ai_chat_memory` | manage own memory summaries | `user_id` / `username` |
| `gm_strategy` | manage own strategy row (surrogate `id` PK; one row per principal) | `user_id` / `username` |
| `league_docs` | manage own league document chunks | `user_id` / `username` |
| `player_tags` | manage own league tags | `user_id` / `username` |
| `analytics_events` | insert own events only; no client read/update/delete | `user_id` / `username` |

## Server-Only Tables

These tables are written only by Edge Functions with the service-role key:

| Table | Browser access |
| --- | --- |
| `ai_rate_limits` | read own daily usage only |
| `yahoo_tokens` | none |
| `app_users` | read own account row only |
| `subscriptions` | read own subscription rows only |

`products` is read-only to signed-in clients. Billing writes, checkout lifecycle updates, and token storage stay behind Edge Functions.
