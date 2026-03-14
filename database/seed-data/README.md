# Seed Data

## Dev Seed — V12 Migration (Flyway, auto-applied)

`backend/src/main/resources/db/migration/V12__seed_test_data.sql`

Applied automatically on every fresh database start. All INSERTs use
`ON CONFLICT DO NOTHING` so re-running (e.g. after `flyway repair`) is safe.

### What it creates

| Table | Rows | Details |
|-------|------|---------|
| users | 10 | admin, manager1/2, worker1–7 |
| projects | 3 | Website Redesign · Mobile App V2 · Q3 Marketing Assets |
| project_members | 10 | Owners as MANAGER + members assigned to each project |
| tasks | 10 | Mixed statuses (TODO/IN_PROGRESS/REVIEW/DONE), priorities, due dates |
| task_tags | 19 | Tags seeded for all tasks |
| subtasks | 10 | Across 4 tasks with mixed completion states |
| comments | 9 | With realistic timestamps (INTERVAL offsets) |

### Dev login credentials

| Email | Password | Role |
|-------|----------|------|
| `admin@taskflow.com` | `Admin@1234` | ADMIN |
| `manager1@taskflow.com` | `Test@1234` | MANAGER |
| `manager2@taskflow.com` | `Test@1234` | MANAGER |
| `worker1–7@taskflow.com` | `Test@1234` | MEMBER |

### Recreating dev seed on an existing database

```bash
# Wipe the database and reapply all migrations including V12
docker compose -f infra/docker/docker-compose.dev.yml down -v
docker compose -f infra/docker/docker-compose.dev.yml up postgres -d
cd backend && ./mvnw spring-boot:run
```

---

## E2E Test Seed — global-setup.ts (Playwright)

`tests/e2e/playwright/global-setup.ts`

Runs automatically before every Playwright test suite. Idempotent — each
step checks for existing data before creating anything.

### What it creates

| Step | Detail |
|------|--------|
| Wait for backend health | Polls `/actuator/health` up to 150s (30×5s) |
| Register E2E user | `e2e-test@taskflow.com` / `TestPass123!` (409 ignored if exists) |
| Login to get token | Obtains access token for subsequent setup calls |
| Ensure E2E project | Creates `E2E Test Project` if user has no projects |
| Ensure E2E tasks | Creates 3 tasks (TODO / IN_PROGRESS / REVIEW) if fewer than 3 exist |

This ensures Dashboard stat cards show non-zero values and the My Tasks
widget has rows to click in E2E tests.

---

## Performance Test Seed — seed-perf-data.sql

`tests/performance/scripts/seed-perf-data.sql`

Truly idempotent: all rows use `md5(stable_key)::uuid` as the PK, so
`ON CONFLICT (id) DO NOTHING` reliably skips already-existing rows on any
re-run. Running the script twice always produces exactly the same 50/5/200/100 rows.

### What it creates

| Table | Rows | Details |
|-------|------|---------|
| users | 50 | `perfuser1–50@perf.test` / `PerfSeed123!` |
| projects | 5 | Alpha–Epsilon Project (owned by perfuser1) |
| project_members | 50 | Owner + 9 members per project |
| tasks | 200 | Mixed statuses/priorities, due dates, estimated + logged hours |
| comments | 100 | Distributed across tasks |

```bash
# Apply seed
psql $DATABASE_URL -f tests/performance/scripts/seed-perf-data.sql

# Expected output:
# perf_users | perf_projects | perf_tasks | perf_comments
#         50 |             5 |        200 |           100
```

### Resetting between test runs

```bash
bash tests/performance/scripts/reset-perf-db.sh
```

The reset script:
- Removes ALL perf data (users, projects, tasks, comments, activities, notifications)
  created by any tool (k6, JMeter, Gatling, Locust, soak scripts)
- Explicitly cleans activity rows by project_id/task_id to prevent orphaned rows
  accumulating over multiple test runs
- Handles all FK constraint ordering to avoid violations
- Re-seeds immediately after truncation

---

## JMeter User Seed — generate-test-users.py

`tests/performance/jmeter/data/generate-test-users.py`

Generates a CSV file and optionally registers 500 JMeter users via the API.

```bash
# Generate CSV only
python3 tests/performance/jmeter/data/generate-test-users.py \
  --count 500 --output tests/performance/jmeter/data/users.csv

# Generate + register via API (idempotent — 409 is ignored)
python3 tests/performance/jmeter/data/generate-test-users.py \
  --count 500 --register --base-url http://localhost:8080
```

Users: `jmeter_0001–0500@perf.test` / `JMeterPass123!`

These users are cleaned up by `reset-perf-db.sh` (email pattern `%@perf.test`).
