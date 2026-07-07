# Local Development & Debugging

Distinct from `deployment-runbook.md` (getting a real environment live) and
`CONTRIBUTING.md` (commit/release conventions). This covers inspecting and
resetting local Worker state during day-to-day development.

## 1. Local Explorer

Press `e` in the terminal while `wrangler dev --env development` is running,
or navigate directly to `http://localhost:8787/cdn-cgi/explorer`. Supports
KV, R2, D1, Durable Objects (SQLite storage only), and Workflows — visual
table browser, inline editing, and a raw SQL query editor.

## 2. Running SQL from the terminal (D1)

```bash
npx wrangler d1 execute plates-db-staging --env development --local --command "SELECT * FROM player_period_stats"
```

## 3. Inspecting Durable Object data

Only visible in Local Explorer for DOs using `ctx.storage.sql` (real tables) —
the KV-style API (`ctx.storage.get/put`) persists to a hidden `__cf_kv` table
that Cloudflare deliberately excludes from SQL access, so it never becomes
inspectable regardless of tooling. There is no CLI command to seed a DO with
data directly (Cloudflare's own limitation, unlike KV/D1/R2) — populate it by
exercising the real app flow (log in, play a round).

## 4. Resetting all local state

Delete the `.wrangler/state` directory (holds every local binding: KV, D1,
DO, R2). Recreated automatically on the next `wrangler dev`.