# Quality Gates

All gates must pass before merging a PR or tagging a release.

---

## Backend Gates

### 1. Unit Tests
```bash
cd backend && ./mvnw test
# Must: 0 failures, 0 errors
# Target: ≥ 80% line coverage on service classes
```

### 2. Integration Tests (requires Docker)
```bash
cd backend && ./mvnw verify -Pintegration-test
# Spins up real PostgreSQL via Testcontainers
# Must: all @SpringBootTest + MockMvc tests pass
```

### 3. Coverage Enforcement
```bash
cd backend && ./mvnw verify jacoco:report
# JaCoCo configured in pom.xml to FAIL below 80% line coverage
# Report: backend/target/site/jacoco/index.html
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
# Start clean PostgreSQL, run backend — Flyway must apply V1–V9 cleanly
docker compose -f infra/docker/docker-compose.dev.yml up postgres -d
cd backend && ./mvnw spring-boot:run
# Verify: GET http://localhost:8080/actuator/health → { "status": "UP" }
# Verify: GET http://localhost:8080/actuator/flyway → all migrations SUCCEEDED
```

---

## Frontend Gates

### 1. Install Dependencies
```bash
cd frontend && npm ci
# Must complete without errors (use lockfile)
```

### 2. Lint
```bash
cd frontend && npm run lint
# ESLint must report 0 errors (warnings acceptable)
```

### 3. Unit Tests
```bash
cd frontend && npm run test
# Vitest + React Testing Library — must: 0 failures
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
# Wait for health
curl --retry 10 --retry-delay 5 http://localhost:8080/actuator/health

# Run Playwright
cd tests/e2e/playwright
npx playwright install --with-deps
npx playwright test --reporter=html
# Must: 0 failed scenarios
# Report: tests/e2e/playwright/playwright-report/index.html
```

---

## Performance Gate (Phase 6 milestone)

```bash
cd tests/performance/k6-tests
k6 run load-test.js --vus 500 --duration 10m
# Must: P95 API response time ≤ 300ms
# Must: Error rate < 1%
# Report: summary printed to stdout + JSON output
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

When any of the following change, the corresponding doc **must** be updated in the same PR:

| Change | Doc to Update |
|--------|--------------|
| New/changed API endpoint | `docs/API_DOCUMENTATION.md` |
| New/changed DB table or column | `docs/DATABASE_SCHEMA.md` |
| New/changed UI screen or flow | `docs/UI_UX_SPECIFICATION.md` |
| New deployment step or config | `docs/DEPLOYMENT_OPERATION_MANUAL.md` |
| New security control or policy | `docs/SECURITY_COMPLIANCE.md` |
| Task status change | `docs/IMPLEMENTATION_STATUS.md` |

---

## CI/CD Gate Summary

| Workflow | Trigger | Must Pass |
|----------|---------|-----------|
| `backend-ci.yml` | Every PR + push to main | Unit tests + JaCoCo + coverage ≥ 80% |
| `frontend-ci.yml` | Every PR + push to main | Lint + tests + build |
| `e2e-tests.yml` | Merge to main | Playwright full suite |
| `deploy.yml` | Merge to main + all CI pass | ECR push + EKS rolling deploy |
