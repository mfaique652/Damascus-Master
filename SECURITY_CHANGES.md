Security & stability changes applied

Summary

- Centralized JWT secret handling into a single `JWT_SECRET` constant. In production the server will abort if `JWT_SECRET` is not provided. In development a random fallback is used (not for production).
- Removed hard-coded secret fallbacks and replaced many in-memory ephemeral stores with persisted lowdb-backed helpers.
  - Verification codes now stored under `db.data.verificationCodes` via `setVerificationCode`, `getVerificationCode`, `deleteVerificationCode`.
  - Rate limiting counters now stored under `db.data.rateLimits` and handled by an async `checkRateLimit()`.
- Email transporter is only created when credentials are provided via env or saved in DB; `sendEmail()` will attempt to use DB-stored creds.
- Added `.env.example` with recommended env variables.
- Added startup validation: warns when recommended vars are missing; aborts in production for critical missing items (JWT_SECRET).
- Added `run_local_server.ps1` to reliably start the Node server via the workspace task.

Notes & next recommended steps

1) Redis-backed rate limiting (recommended for multi-process or horizontally scaled deployments):
   - Replace lowdb rateLimits with a Redis implementation (requires `REDIS_URL` and a Redis client dependency e.g., `ioredis`).

2) Secrets management:
   - Do not store production secrets in `db.json`. Use environment secrets or a secrets manager. If email creds must be stored, ensure DB encryption at rest and restricted access.

3) Logging & monitoring:
   - Add structured logging and health checks for critical subsystems (SMTP, PayPal). Consider adding process supervision (PM2) in production.

4) Tests & CI:
   - Add unit/regression tests for auth flows, rate limiting, and email sending.

5) Rotate JWT secret and email credentials after deployment.

Files changed/added

- `server/server.js` - multiple security and stability updates
- `.env.example` - new
- `run_local_server.ps1` - new
- `SECURITY_CHANGES.md` - new

If you'd like, I can now:
- Replace the lowdb rate limiter with Redis (I'll add the dependency and a toggle to use Redis when `REDIS_URL` is set).
- Add a small test script that calls `/api/health` and a few auth endpoints as smoke tests.
- Create a minimal `README.md` with start instructions.

Which should I do next?
