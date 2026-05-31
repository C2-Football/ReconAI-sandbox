# Supabase RLS Contract

ReconAI owns the shared Supabase data contract used by ReconAI Scout and War Room. Browser clients use the public anon key plus an app-issued JWT. Edge Functions use the service-role key and bypass RLS for server-owned workflows.

## Client-Writable Tables

These tables may be written directly by the browser, but only for the current user:

| Table | Client access | Owner column |
| --- | --- | --- |
| `users` | read/insert/update own profile row | `sleeper_username` |
| `calendar_events` | manage own rows | `username` |
| `earnings` | manage own rows | `username` |
| `fa_targets` | manage own rows | `username` |
| `owner_dna` | manage own rows | `username` |
| `draft_boards` | manage own rows | `sleeper_username` |
| `messages` | send as self, read sender/recipient rows, mark received rows read | `from_username` / `to_username` |
| `ai_analysis` | manage own saved AI history | `username` |
| `field_log` | manage own field log entries | `username` |
| `ai_chat_memory` | manage own memory summaries | `username` |
| `gm_strategy` | manage own strategy row | `username` |
| `league_docs` | manage own league document chunks | `username` |
| `player_tags` | manage own league tags | `username` |
| `analytics_events` | insert own events only; no client read/update/delete | `username` / `user_id` |

## Server-Only Tables

These tables are written only by Edge Functions with the service-role key:

| Table | Browser access |
| --- | --- |
| `ai_rate_limits` | read own daily usage only |
| `yahoo_tokens` | none |
| `app_users` | read own account row only |
| `subscriptions` | read own subscription rows only |

`products` is read-only to signed-in clients. Billing writes, checkout lifecycle updates, and token storage stay behind Edge Functions.
