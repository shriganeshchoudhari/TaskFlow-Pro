# Quality Gates

> **Last updated:** 2026-03-14 — Phase 7 performance gates updated  
> All gates must pass before merging a PR or tagging a release.

---

## Backend Gates

### 1. Unit Tests
```bash
cd backend && ./mvnw test
# Must: 0 failures, 0 errors
# Covers: AuthService, TaskService, CommentService, NotificationService, ActivityService
```

### 2. Integration Tests (requires Docker)
```bash
cd backend && ./mvnw verify -Pintegration-test
# Spins up real PostgreSQL via Testcontainers
# Must: all @SpringBootTest + MockMvc tests pass
# Files: AuthControllerIT, ProjectTaskControllerIT
```

### 3. Coverage Enforcement
```bash
cd backend && ./mvnw verify jacoco:report
# JaCoCo gate in pom.xml: FAIL if line coverage < 80%
# Report: backend/target/site/jacoco/index.html
# Enforce only: ./mvnw verify -Pcoverage
```

### 4. Package (no test skipping)
```bash
cd backend && ./mvnw -B package
# Must produce: backend/target/taskflow-backend-*.jar without errors
```

### 5. Dependency CVE Check
```bash
cd backend && ./mvnw org.owasp:dependency-check-maven:check
# Must: no CRITICAL or HIGH CVEs in runtime dependencies
# Report: backend/target/dependency-check-report.html
```

### 6. Flyway Migration Validation
```bash
# Test all 12 migrations against fresh PostgreSQL
docker compose -f infra/docker/docker-compose.dev.yml down -v
docker compose -f infra/docker/docker-compose.dev.yml up postgres -d
cd backend && ./mvnw spring-boot:run
# Verify: GET http://localhost:8080/actuator/health → { "status": "UP" }
# Verify: GET http://localhost:8080/actuator/flyway → all V1–V12 SUCCEEDED
```

---

## Frontend Gates

### 1. Install Dependencies
```bash
cd frontend && npm ci
# Must complete without errors (uses package-lock.json)
```

### 2. Lint
```bash
cd frontend && npm run lint
# ESLint must report 0 errors (warnings acceptable)
```

### 3. Unit Tests
```bash
cd frontend && npm test
# Vitest + React Testing Library — must: 0 failures
# Test files: src/__tests__/ + co-located *.test.jsx files
# IMPORTANT: BoardView and NotificationBell tests must mock useWebSocket
#   vi.mock('../hooks/useWebSocket', () => ({ default: () => ({ isConnected: false, subscribe: vi.fn() }) }))
#   Without this mock, tests time out after 5000ms (STOMP reconnect delay)
```

### 4. Coverage Check
```bash
cd frontend && npm run test:coverage
# Target: ≥ 70% coverage on components and services
```

### 5. Production Build
```bash
cd frontend && npm run build
# Must produce: frontend/dist/ without TypeScript/build errors
```

---

## E2E Gate (runs on every merge to main)

```bash
# Ensure full stack is up
docker compose -f infra/docker/docker-compose.dev.yml up --build -d

# Wait for health (global-setup.ts does this automatically)
curl --retry 30 --retry-delay 5 http://localhost:8080/actuator/health

# Run all 8 Playwright spec files
cd tests/e2e/playwright
npm install && npx playwright install --with-deps chromium
npx playwright test --reporter=html

# Must: 0 failed scenarios
# Report: tests/e2e/playwright/playwright-report/index.html
# Traces on failure: tests/e2e/playwright/test-results/
```

---

## Performance Gates (Phase 7)

### Smoke Gate — every PR (~2 min)
```bash
cd tests/performance/k6
k6 run smoke.js --env BASE_URL=http://localhost:8080
# Must: 0 threshold violations (P95 < 500ms, error < 1%)
```

### Load Gate — every main merge (~15 min)
```bash
k6 run load_test.js \
  --env BASE_URL=http://localhost:8080 \
  --summary-export=k6-summary.json

# Hard gates (fail CI if breached):
# - http_req_duration p(95) < 300ms
# - http_req_duration p(99) < 800ms
# - http_req_failed rate < 0.01 (1%)

# Regression check vs baseline (fail if any endpoint degrades > 20%):
python3 scripts/regression_check.py k6-summary.json \
  --baseline baselines/perf-baseline.json \
  --threshold 20
```

### Stress & Spike Gate — weekly (manual dispatch)
```bash
# Stress — find the ceiling
k6 run stress_test.js --env BASE_URL=http://localhost:8080
# Informational: records breaking point VU count

# Spike — validate recovery
k6 run spike_test.js --env BASE_URL=http://localhost:8080
# Must: spike_recovery_ms max < 30000 (recover within 30s)
```

### Soak Gate — weekly Sunday 02:00 UTC
```bash
# Locust 8-hour endurance
cd tests/performance/locust
locust -f soak_locustfile.py \
  --host=http://localhost:8080 \
  --users=50 --spawn-rate=5 --run-time=8h --headless
# Must: P95 stays flat (no creep), error rate < 1% throughout
```

---

## Security Gates

### Container Image Scan (every Docker build)
```bash
trivy image taskflow-backend:latest --exit-code 1 --severity CRITICAL
trivy image taskflow-frontend:latest --exit-code 1 --severity CRITICAL
# Must: 0 CRITICAL CVEs
```

### SAST (every CI run)
```bash
cd backend && ./mvnw spotbugs:check -Pspotbugs
# Must: 0 HIGH or CRITICAL SpotBugs findings
```

---

## Docs Gate

When any of the following change, the corresponding doc **must** be updated in the **same PR**:

| Change | Doc to Update |
|--------|--------------|
| New/changed API endpoint | `docs/API_DOCUMENTATION.md` |
| New/changed DB table or column | `docs/DATABASE_SCHEMA.md` |
| New/changed UI screen or flow | `docs/UI_UX_SPECIFICATION.md` |
| New deployment step or config | `docs/DEPLOYMENT_OPERATION_MANUAL.md` |
| New security control or policy | `docs/SECURITY_COMPLIANCE.md` |
| Task status change | `docs/IMPLEMENTATION_STATUS.md` |
| New perf test or threshold change | `tests/performance/README.md` |

---

## CI/CD Gate Summary

| Workflow | Trigger | Must Pass |
|----------|---------|-----------|
| `backend-ci.yml` | Every PR + push to main | Unit tests + integration tests + JaCoCo ≥ 80% + Codecov |
| `frontend-ci.yml` | Every PR + push to main | Lint + Vitest + production build |
| `e2e-tests.yml` | Merge to main | Full Playwright suite (8 spec files) |
| `deploy.yml` | Merge to main + all CI pass | ECR push + EKS rolling deploy + smoke test |
| `k6-load.yml` | PR → smoke; main merge → load | Smoke: no threshold breach; Load: P95<300ms, error<1% |
| `jmeter-ci.yml` | Merge to main | 300 threads, avg<400ms, error<1% |
| `locust-ci.yml` | Merge to main + weekly cron | Load gate + weekly 8h soak |
| `perf-report.yml` | After all perf jobs complete | Unified HTML report + regression check |
