# Development Workflows

> **All 7 phases complete.** Use these workflows for ongoing maintenance and new features.

---

## Phase Implementation Workflow

Follow this order for every phase. Backend and frontend can run in parallel once API contracts (DTOs) are agreed.

```
1. Review phase tasks in docs/IMPLEMENTATION_STATUS.md
2. Pick the next unchecked backend task (B{phase}-{nn})
3. Agree on request/response DTOs before frontend starts
4. Implement backend task (migration → entity → repo → service → controller → DTO)
5. Implement frontend task in parallel (service → slice → component → page)
6. Write tests alongside code (unit first, then integration)
7. Run quality gates (see .ai/QUALITY_GATES.md)
8. Update docs if any contract changed
9. Mark task done in docs/IMPLEMENTATION_STATUS.md
10. Open PR; reference task ID (e.g. "feat: implement B2-05 ProjectService CRUD")
```

---

## Feature Workflow (end-to-end)

1. **Clarify scope** — acceptance criteria in `docs/PRD.md` or PR description
2. **Technical approach** — update `docs/TTD.md` if architecture changes
3. **Database**
   - Add Flyway migration SQL under `backend/src/main/resources/db/migration/`
   - Follow naming: `V{n}__{description}.sql` (**next number after V12**)
   - Update `docs/DATABASE_SCHEMA.md`
4. **Backend**
   - `model/` → `repository/` → `service/` → `controller/` → `dto/`
   - Add `@PreAuthorize` or service-level authorization
   - Update `docs/API_DOCUMENTATION.md`
5. **Frontend**
   - `services/` → `store/slices/` → `components/` → `pages/`
   - Update `docs/UI_UX_SPECIFICATION.md` if screens/flows change
6. **Tests**
   - Backend unit tests in `src/test/java/com/taskflow/`
   - Backend integration tests (Testcontainers) in `src/test/integration/`
   - Update Postman collection in `tests/api/postman/`
   - Add/adjust Playwright E2E if user-visible behavior changed
7. **Quality gates** — run everything in `.ai/QUALITY_GATES.md`
8. **Docs** — update ops manual if runtime/deploy behavior changed

---

## Bugfix Workflow

1. **Reproduce** — write minimal steps to reproduce
2. **Failing test first** — add a unit/integration/e2e test that fails
3. **Fix** — smallest safe change in the correct layer (controller/service/repo)
4. **Run quality gates** — all gates must pass
5. **Update docs** — note behavior change in relevant doc if applicable
6. **PR** — title: `fix: {description} (closes #issue)`
7. **Update** `docs/IMPLEMENTATION_STATUS.md` if related to an implementation task

---

## Refactor Workflow (safe)

1. **Identify invariants** — API contracts, DB schema, UI behavior must not change
2. **Strengthen tests** — add/tighten tests around invariants before touching code
3. **Refactor in small commits** — one concept per commit, no API/schema changes
4. **Run quality gates** after each commit slice

---

## Database Migration Workflow

```bash
# 1. Create new migration file
# File: backend/src/main/resources/db/migration/V{n}__{description}.sql
# Example: V10__add_task_attachments.sql

# 2. Write additive SQL (prefer add-column over drop-column)
ALTER TABLE tasks ADD COLUMN attachment_url VARCHAR(500);
CREATE INDEX idx_tasks_attachment ON tasks(id) WHERE attachment_url IS NOT NULL;

# 3. Test against fresh DB
docker compose -f infra/docker/docker-compose.dev.yml down -v
docker compose -f infra/docker/docker-compose.dev.yml up postgres -d
cd backend && ./mvnw spring-boot:run
# Check: GET /actuator/flyway → all migrations SUCCEEDED

# 4. Update docs/DATABASE_SCHEMA.md with new table/column
```

**Migration rules:**
- Scripts are **immutable** once merged to main
- Prefer **additive** changes (add columns/tables); never drop in same migration
- Breaking schema changes need a transitional migration (add → deploy → remove)
- Always test migrations on a fresh DB before merging

---

## JWT / Auth Workflow

When making auth-related changes:

```bash
# Test all auth flows end-to-end
# 1. Register
POST /api/v1/auth/register {"fullName":"Test","email":"test@x.com","password":"Test@1234"}
# Expect: 201

# 2. Login
POST /api/v1/auth/login {"email":"test@x.com","password":"Test@1234"}
# Expect: 200 with accessToken + refreshToken

# 3. Use access token
GET /api/v1/users/me  Authorization: Bearer {accessToken}
# Expect: 200 with user object

# 4. Refresh
POST /api/v1/auth/refresh {"refreshToken":"{refreshToken}"}
# Expect: 200 with new tokens

# 5. Logout
POST /api/v1/auth/logout {"refreshToken":"{newRefreshToken}"}
# Expect: 204

# 6. Try to use revoked refresh token
POST /api/v1/auth/refresh {"refreshToken":"{oldRefreshToken}"}
# Expect: 401 REFRESH_TOKEN_EXPIRED or TOKEN_INVALID
```

---

## Frontend State Workflow

Pattern for every new feature slice:

```
1. Create service:  services/{feature}Service.js   ← pure Axios calls
2. Create slice:    store/slices/{feature}Slice.js  ← state + async thunks
3. Register slice:  store/index.js                  ← add to combineReducers
4. Create hook:     hooks/use{Feature}.js            ← selector + dispatch wrappers
5. Build component: components/{feature}/            ← consume hook
6. Build page:      pages/{Feature}Page.jsx          ← compose components
7. Add route:       App.jsx                          ← nested under <Layout>
```

**Error handling pattern:**
- API errors → caught in async thunk → stored in `slice.error`
- UI shows MUI Snackbar (via `ToastProvider`) on error state change
- Loading state → MUI Skeleton while `slice.loading = true`
- Optimistic updates: update Redux state immediately, revert on API failure

---

## Performance Test Workflow

When adding or modifying a performance test:

```
1. Seed test data (idempotent)
   psql $DATABASE_URL -f tests/performance/scripts/seed-perf-data.sql

2. Run smoke first to verify basic connectivity
   cd tests/performance/k6 && k6 run smoke.js --env BASE_URL=http://localhost:8080

3. Run the new/modified test
   k6 run my_test.js --env BASE_URL=http://localhost:8080 \
                     --summary-export=results/k6-summary.json

4. Compare against baseline
   python3 scripts/regression_check.py results/k6-summary.json

5. If thresholds pass and this is a new baseline:
   - Update tests/performance/baselines/perf-baseline.json with new P95 values

6. Wire the script into the appropriate GitHub Actions workflow:
   - Smoke/load → .github/workflows/k6-load.yml
   - JMeter → .github/workflows/jmeter-ci.yml
   - Locust → .github/workflows/locust-ci.yml

7. Update tests/performance/README.md with run instructions
```

**Performance test naming (k6):**
- `smoke.js` — 5 VU · 30s · verify API up (runs on every PR)
- `load_test.js` — ramp to 500 VU, hold (runs on every main merge)
- `stress_test.js` — ramp until failure (weekly)
- `spike_test.js` — sudden burst + recovery (weekly)
- `{feature}_scenario.js` — realistic multi-step user journey

---

## PR Naming Conventions

```
feat:  B1-06 JwtTokenProvider — access + refresh token generation
feat:  F2-03 ProjectListPage with status filter and search
fix:   B3-07 TaskService — allow REVIEW → TODO back-transition
test:  T6-02 TaskService unit tests — status transition coverage
perf:  PT-K6-06 board scenario — end-to-end load test
docs:  update API_DOCUMENTATION with dashboard/summary endpoint
chore: D6-01 finalize backend Dockerfile with non-root user + HEALTHCHECK
ci:    CI6-01 backend-ci.yml — add JaCoCo coverage gate
```
