---
status: awaiting_human_verify
trigger: "Investigate a persistent local signup failure in the Proliferate repo at `/home/coder/project/proliferate`."
created: 2026-04-05T15:54:36+00:00
updated: 2026-04-05T16:22:47+00:00
---

## Current Focus

hypothesis: The cleaned-up minimal fix is repo-root env loading in `apps/web/next.config.js` plus explicit runtime env mapping in `packages/environment/src/server.ts`.
test: Verify signup against the reset/remigrated local DB after reverting temporary auth-only changes.
expecting: Signup remains 200 with the minimal fix only.
next_action: wait for user confirmation or any remaining local workflow failure details

## Symptoms

expected: Local email signup succeeds against the local PostgreSQL database.
actual: POST /api/auth/sign-up/email returns 500 in local dev.
errors: Better Auth logs "The server does not support SSL connections" during signup.
reproduction: Run `make web`, then submit the local signup form or POST /api/auth/sign-up/email.
started: Persisting after multiple attempted local SSL-related fixes; exact original start point unknown.

## Eliminated

- hypothesis: `apps/web/next.config.js` alone is sufficient; `packages/environment/src/server.ts` can stay on raw `process.env`.
  evidence: Reverting `packages/environment/src/server.ts` caused signup to fail again after a clean DB reset/migrate, with Better Auth querying a DB where `relation "user" does not exist`.
  timestamp: 2026-04-05T16:15:34+00:00

- hypothesis: The auth PGSSLMODE helper change is required for local signup.
  evidence: Reverting `apps/web/src/lib/auth/server/index.ts` back to `features.isLocalDb ? false : { rejectUnauthorized: false }` still left signup returning 200 once env loading and DB state were correct.
  timestamp: 2026-04-05T16:21:49+00:00

## Evidence

- timestamp: 2026-04-05T15:55:43+00:00
  checked: auth server config and route wiring
  found: `apps/web/src/lib/auth/server/index.ts` passes a raw `pg.Pool` to `betterAuth`, while `apps/web/src/app/api/auth/[...all]/route.ts` exports `POST` directly from `toNextJsHandler(auth)`.
  implication: signup failures happen inside Better Auth's POST handler using whatever database adapter it derives from that Pool.

- timestamp: 2026-04-05T15:55:43+00:00
  checked: environment and DB helpers
  found: `.env.local` sets `DATABASE_URL=...127.0.0.1...sslmode=disable` and `PGSSLMODE=disable`; `packages/environment/src/server.ts` marks localhost URLs as `features.isLocalDb`; `packages/db/src/client.ts` uses postgres.js separately from auth.
  implication: there are at least two DB client implementations in the repo, but auth currently should be isolated to the raw `pg.Pool` path.

- timestamp: 2026-04-05T15:58:48+00:00
  checked: installed Better Auth internals
  found: `betterAuth()` uses `dist/context/init.mjs` -> `dist/db/adapter-kysely.mjs` -> `createKyselyAdapter`, which wraps any object exposing `connect()` in `new PostgresDialect({ pool: db })`; sign-up then calls `internalAdapter.findUserByEmail/createUser/createSession`.
  implication: the configured raw `pg.Pool` is expected to be the direct database path for signup, not Drizzle or another repo DB helper.

- timestamp: 2026-04-05T16:03:08+00:00
  checked: direct HTTP reproduction and `pg` parsing internals
  found: Direct POST to `/api/auth/sign-up/email` reproduces the 500. `pg/lib/connection.js` emits "The server does not support SSL connections" only when the active connection has `ssl` enabled, and `pg-connection-string` would keep `ssl=false` for `sslmode=disable` if that exact URL reached the pool constructor.
  implication: either the runtime auth pool is not using the expected local connection string, or the failing client is not the intended auth pool instance.

- timestamp: 2026-04-05T16:04:36+00:00
  checked: temporary auth pool instrumentation
  found: Attempting `new URL(env.DATABASE_URL)` inside the auth module immediately throws `TypeError: Invalid URL` during the signup route load, proving the runtime `env.DATABASE_URL` in Next is not a normal absolute URL string.
  implication: the current `.env.local` value is not the only input; the effective runtime `DATABASE_URL` seen by the auth module is malformed or overridden, which likely explains the persistent misleading SSL symptom.

- timestamp: 2026-04-05T16:10:01+00:00
  checked: auth pool console instrumentation during a failing request
  found: The auth pool connect path is definitely the failing client, and the emitted config was `{"disablePgSsl":false,"poolSsl":{"rejectUnauthorized":false}}` with `databaseUrl` omitted from JSON because `env.DATABASE_URL` was `undefined` inside Next.
  implication: the SSL error is secondary; the real fault is missing server env propagation into `@proliferate/environment/server`, causing auth to build a bad pg pool config.

- timestamp: 2026-04-05T16:09:17+00:00
  checked: web server after loading repo-root env from `apps/web/next.config.js`
  found: The SSL handshake error disappeared and the next failure is `error: relation "user" does not exist` from Better Auth during signup.
  implication: the original SSL message was misleading; after fixing env loading, the remaining blocker is an unmigrated local database schema rather than SSL.

- timestamp: 2026-04-05T16:10:07+00:00
  checked: local migration + signup verification
  found: `make db-migrate` applied successfully, and a direct POST to `/api/auth/sign-up/email` returned 200 with a user payload and `better-auth.session_token` cookie.
  implication: the local signup path now works end-to-end in the reproduced environment.

- timestamp: 2026-04-05T16:13:42+00:00
  checked: local Postgres reset
  found: Reset the `public` schema inside the running `postgres` container using `DROP SCHEMA public CASCADE; CREATE SCHEMA public;`.
  implication: the DB is now in a clean state and must be remigrated before signup can work again.

- timestamp: 2026-04-05T16:14:05+00:00
  checked: local DB remigration
  found: `make db-migrate` completed successfully against the freshly reset schema.
  implication: signup can now be used as a clean verification step while trimming code changes.

- timestamp: 2026-04-05T16:15:34+00:00
  checked: reverting `packages/environment/src/server.ts`
  found: After restart, signup failed again with `relation "user" does not exist`, despite the clean local DB being migrated successfully.
  implication: the explicit runtime env mapping in `packages/environment/src/server.ts` is required for correct DB selection/runtime env access in Next.

- timestamp: 2026-04-05T16:20:40+00:00
  checked: local DB contents after the "reset + migrate"
  found: Only `drizzle.__drizzle_migrations` existed; `public` had no tables because the earlier reset dropped `public` but left `drizzle`, so `make db-migrate` treated all 61 migrations as already applied.
  implication: the DB reset procedure must also clear the Drizzle metadata schema to produce a real clean local state.

- timestamp: 2026-04-05T16:21:13+00:00
  checked: full schema reset + remigration
  found: Dropping both `drizzle` and `public`, rerunning `make db-migrate`, then posting to `/api/auth/sign-up/email` returned 200 again.
  implication: the DB is back in a truly clean usable state; cleanup can now focus on removing unnecessary code changes.

- timestamp: 2026-04-05T16:21:49+00:00
  checked: final cleanup verification
  found: After removing the temporary auth PGSSLMODE/logging changes, signup still returned 200 against the reset/remigrated local DB.
  implication: the minimal necessary code changes are `apps/web/next.config.js` and `packages/environment/src/server.ts`.

- timestamp: 2026-04-05T16:22:47+00:00
  checked: final diff cleanup
  found: `apps/web/src/lib/auth/server/index.ts` was restored to its original logic/comments; it is no longer part of the final fix.
  implication: only the env-loading changes remain in code.

## Resolution

root_cause: `make web` starts Next from `apps/web`, but repo-root `.env.local` was not being loaded into the web app/runtime env package. That left `env.DATABASE_URL` effectively wrong/undefined for Better Auth, producing the misleading SSL error. Separately, a true DB reset must clear both `public` and `drizzle`; otherwise `make db-migrate` no-ops against an empty schema.
fix: Kept only two code changes: load repo-root `.env`/`.env.local` in `apps/web/next.config.js`, and use explicit runtime env key mapping in `packages/environment/src/server.ts`. Reset local Postgres by dropping both `public` and `drizzle`, then reran migrations.
verification: Dropped `drizzle` and `public`, reran `make db-migrate`, restarted `make web`, and verified `POST /api/auth/sign-up/email` returns 200 after removing the temporary auth-only changes.
files_changed:
  - apps/web/next.config.js
  - packages/environment/src/server.ts
