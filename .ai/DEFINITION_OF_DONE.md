# Definition of Done (DoD)

> **Last updated:** 2026-03-14 — Phase 7 added  
> A change is "done" when **all** of the following apply.

---

## Universal DoD (every task)

- [ ] Requirements clear — acceptance criteria in `docs/PRD.md` or PR description
- [ ] API/DB/UI changes documented — relevant `docs/` files updated in the **same PR**
- [ ] Security addressed — authz checked, input validated, no secrets in code
- [ ] Tests exist — unit/integration/E2E as appropriate (see `docs/TEST_PLAN.md`)
- [ ] Quality gates pass — all gates in `.ai/QUALITY_GATES.md` green
- [ ] No new HIGH/CRITICAL issues — CI passes, no broken local run

---

## Phase-Specific DoD

### Phase 1 — Foundation & Authentication ✅
- `POST /auth/register` returns 201 with user object (no password in response)
- `POST /auth/login` returns `{ accessToken, refreshToken, expiresIn, user }`
- `POST /auth/refresh` rotates both access and refresh token
- `POST /auth/logout` revokes refresh token in DB (`is_revoked = true`)
- Invalid credentials → 401 with standard error JSON
- Duplicate email → 409 with `EMAIL_ALREADY_EXISTS` error code
- Protected routes redirect unauthenticated user to `/login`
- `AuthService` unit tests pass; `AuthControllerIT` Testcontainers tests pass
- Flyway V1 and V8 migrations run cleanly on fresh PostgreSQL

### Phase 2 — Project Management ✅
- Authenticated user can create, read, update, and archive a project
- Project creator auto-assigned `MANAGER` role in `project_members`
- Only `MANAGER` or `ADMIN` can invite/remove members and update project
- Archived project (`status = ARCHIVED`) excluded from Active filter
- Private project returns 403 to non-members
- GET `/projects` returns paginated `{ content, page, totalElements }`
- Frontend Project List + Project Detail pages render real API data

### Phase 3 — Task Management ✅
- Task created → appears in `TODO` column of the Kanban board
- Status transitions: `TODO → IN_PROGRESS → REVIEW → DONE` work; invalid transitions return 422
- Only `assignee`, `reporter`, or project `MANAGER` can update a task
- Only project `MANAGER` or `ADMIN` can delete a task
- Deleting a project cascades and deletes all its tasks + comments
- Task tags stored as PostgreSQL `TEXT[]` array
- `ActivityService.logActivity()` called on every task state change
- `NotificationService` notified when a task is created with an assignee
- My Tasks page (`/my-tasks`) shows only tasks where `assigneeId = currentUser.id`
- Optimistic UI for status change: reverts on API error with error toast

### Phase 4 — Comments, Notifications & Activity ✅
- Posting a comment notifies `assignee` and `reporter` (type: `COMMENT_ADDED`)
- Assigning a task notifies new assignee (type: `TASK_ASSIGNED`)
- `unreadCount` badge updates without page reload (polling every 60s)
- Clicking a notification navigates to the task and marks it read
- "Mark all read" clears badge and marks all `is_read = true`
- Activity feed: actor avatar, action text, old→new values, timestamp
- `@Scheduled` cron creates `DUE_DATE_REMINDER` notifications 24h before `due_date`

### Phase 5 — Dashboard, Profile & UI Polish ✅
- Dashboard stat cards load from `GET /dashboard/summary`
- Profile updates persist via `PUT /users/me`
- Password change verifies `currentPassword` before accepting `newPassword`
- Rate limiting active: login (10/15min), register (5/hr) → 429 with `retryAfter`
- Swagger UI at `/swagger-ui.html` with all 9 controllers documented
- App is fully keyboard-navigable; no focus traps outside dialogs
- Board view horizontal scroll on `xs` breakpoint; sidebar drawer on `xs`
- All mutations show MUI Snackbar toast (3s auto-dismiss)

### Phase 6 — DevOps, Testing & Monitoring ✅
- `mvn verify jacoco:report` ≥ 80% line coverage; build fails below threshold
- `AuthControllerIT` + `ProjectTaskControllerIT` pass with Testcontainers
- Playwright E2E suite passes headlessly in CI (Chromium)
- k6 load test: P95 ≤ 300ms at 500 concurrent VUs, error rate < 1%
- All GitHub Actions workflows green on PR to main
- `deploy.yml` ECR push + zero-downtime rolling deploy to EKS
- Prometheus scraping `/actuator/prometheus`; Grafana auto-provisions dashboards
- `docker compose -f infra/docker/docker-compose.dev.yml up --build` starts full stack
- `scripts/setup.sh` bootstraps local dev in one command
- `MdcTraceIdFilter` injects `X-Trace-Id` into every request/response/log line
- `RateLimitFilter` enforces Bucket4j limits on `/auth/login` and `/auth/register`

### Phase 7 — Performance & Load Testing ✅
- k6 smoke test passes on every PR (5 VU · 30s · P95 < 500ms)
- k6 load test passes on every main merge (0→500 VU · 15min · P95 < 300ms · error < 1%)
- k6 stress test identifies VU ceiling (run weekly)
- k6 spike test validates recovery ≤ 30s after 0→1000 VU spike (run weekly)
- JMeter `.jmx` plan runs headlessly and generates HTML dashboard report
- JMeter 24h soak plan available and documented
- Gatling `LoadSimulation.scala` and `StressSimulation.scala` compile and run
- Locust `locustfile.py` + `soak_locustfile.py` run with threshold hook
- `scripts/seed-perf-data.sql` seeds 50 users/5 projects/200 tasks idempotently
- `baselines/perf-baseline.json` captured; `regression_check.py` fails CI on >20% drift
- `reports/generate-perf-report.py` produces unified HTML from all 4 tools
- `tests/performance/README.md` documents all tools with complete run commands

---

## What "done" is NOT

- Code merged but tests written later → **not done**
- Feature works locally but CI is broken → **not done**
- API changed but `docs/API_DOCUMENTATION.md` not updated → **not done**
- New endpoint with no authorization check → **not done**
- New migration not tested on fresh DB → **not done**
- Performance test added but not wired into CI → **not done**
