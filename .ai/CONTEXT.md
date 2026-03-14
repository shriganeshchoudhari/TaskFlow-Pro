# Project Context

## What this is

TaskFlow Pro is an enterprise-grade collaborative task management platform — **all 7 phases complete, 156 tasks delivered**.

- **Backend:** Java 21 · Spring Boot 3.5 · Spring Security · JWT (HS512) · JPA/Hibernate · Flyway
- **Frontend:** React 18 · Vite · Redux Toolkit · MUI v5 · WebSocket (STOMP)
- **Database:** PostgreSQL 16 · UUID PKs · Flyway migrations V1–V12
- **Auth:** JWT access token 15 min · refresh token 7 days · BCrypt strength 12 · rate-limited auth endpoints
- **Ops:** Docker · Kubernetes (EKS) · Helm · Terraform
- **Monitoring:** Prometheus · Grafana (auto-provisioned) · Structured JSON logs · MDC traceId · Spring Actuator
- **Perf Testing:** k6 · Apache JMeter · Gatling · Locust · InfluxDB

---

## Implementation Plan — 7 Phases / 14 Weeks / 156 Tasks

| Phase | Focus | Duration | Status |
|-------|-------|----------|--------|
| **Phase 1** | Foundation & Authentication | Week 1–2 | ✅ Complete |
| **Phase 2** | Project Management | Week 3–4 | ✅ Complete |
| **Phase 3** | Task Management | Week 5–6 | ✅ Complete |
| **Phase 4** | Comments, Notifications & Activity | Week 7–8 | ✅ Complete |
| **Phase 5** | Dashboard, Profile & UI Polish | Week 9–10 | ✅ Complete |
| **Phase 6** | DevOps, Testing & Monitoring | Week 11–12 | ✅ Complete |
| **Phase 7** | Performance & Load Testing | Week 13–14 | ✅ Complete |

> Full task breakdown with IDs: `docs/TaskFlowPro_Implementation_Plan_v2.docx`  
> Task ID prefixes: `B{n}` backend · `F{n}` frontend · `T6` testing · `D6` Docker · `CI6` workflows · `K6` Kubernetes · `PT-K6/JM/GA/LO/DT/RP` performance

---

## Source-of-Truth Docs

| Doc | Path |
|-----|------|
| Product requirements | `docs/PRD.md` |
| Technical design | `docs/TTD.md` |
| API documentation | `docs/API_DOCUMENTATION.md` |
| Database schema | `docs/DATABASE_SCHEMA.md` |
| UI/UX specification | `docs/UI_UX_SPECIFICATION.md` |
| Security & compliance | `docs/SECURITY_COMPLIANCE.md` |
| Test plan | `docs/TEST_PLAN.md` |
| API test cases | `docs/TEST_CASES_API.md` |
| E2E test cases | `docs/TEST_CASES_E2E.md` |
| Deployment & ops | `docs/DEPLOYMENT_OPERATION_MANUAL.md` |
| Implementation status | `docs/IMPLEMENTATION_STATUS.md` |
| AI dev-kit | `.ai/` (repo map, checklists, ADRs, workflows) |

---

## Common Ports (local)

| Service | URL |
|---------|-----|
| Backend API | `http://localhost:8080` |
| Frontend (Vite dev) | `http://localhost:5173` |
| Frontend (Docker) | `http://localhost:80` |
| Swagger UI | `http://localhost:8080/swagger-ui.html` |
| Actuator health | `http://localhost:8080/actuator/health` |
| Grafana | `http://localhost:3000` |
| Grafana (perf stack) | `http://localhost:3001` |
| Prometheus | `http://localhost:9090` |
| InfluxDB (perf) | `http://localhost:8086` |

---

## Quick Commands

### Bootstrap (one command)
```bash
bash scripts/setup.sh
```

### Backend
```bash
cd backend
./mvnw spring-boot:run                        # Dev server on :8080
./mvnw spring-boot:run -Dspring.profiles.active=perf  # Perf profile (pool=50, slow-query logging)
./mvnw test                                   # Unit tests
./mvnw verify -Pintegration-test              # Unit + Testcontainers integration tests
./mvnw verify jacoco:report                   # JaCoCo HTML report → target/site/jacoco/
./mvnw verify -Pcoverage                      # Enforce ≥ 80% line coverage
```

### Frontend
```bash
cd frontend
npm install && npm run dev                    # Dev server on :5173
npm test                                      # Vitest unit tests
npm run test:coverage                         # V8 coverage report
npm run lint                                  # ESLint
npm run build                                 # Production build → dist/
```

### Full Local Stack
```bash
# From repo root:
docker compose -f infra/docker/docker-compose.dev.yml up --build
# With monitoring:
docker compose -f infra/docker/docker-compose.dev.yml --profile monitoring up --build
# With perf stack (InfluxDB + Grafana-perf):
docker compose -f infra/docker/docker-compose.dev.yml \
               -f infra/docker/docker-compose.perf.yml up --build
```

### E2E Tests
```bash
cd tests/e2e/playwright
npx playwright install --with-deps chromium
npx playwright test                            # All 8 spec files, headless Chromium
npx playwright test --ui                       # Interactive mode
npx playwright test tests/taskflow.spec.ts     # Single spec
BACKEND_URL=http://localhost:8080 npx playwright test  # Custom backend URL
```

### Performance Tests
```bash
# k6
cd tests/performance/k6
k6 run smoke.js --env BASE_URL=http://localhost:8080
k6 run load_test.js --env BASE_URL=http://localhost:8080 --summary-export=k6-summary.json
k6 run stress_test.js --env BASE_URL=http://localhost:8080
k6 run spike_test.js --env BASE_URL=http://localhost:8080

# JMeter
cd tests/performance/jmeter
python3 data/generate-test-users.py --count 300 --register --base-url http://localhost:8080
jmeter -n -t TaskFlowPro.jmx -l results/load.jtl -JBASE_URL=http://localhost:8080

# Gatling
cd tests/performance/gatling
mvn gatling:test -Dgatling.simulationClass=taskflow.LoadSimulation -DBASE_URL=http://localhost:8080

# Locust
cd tests/performance/locust
locust -f locustfile.py --host=http://localhost:8080 --users=200 --spawn-rate=20 --run-time=10m --headless

# Unified report
python3 tests/performance/reports/generate-perf-report.py --k6 k6-summary.json --output perf-report.html

# Regression check
python3 tests/performance/scripts/regression_check.py k6-summary.json --threshold 20
```

### Reset Perf Database
```bash
DATABASE_URL=postgresql://taskflow:taskflow_dev_password@localhost:5432/taskflow_dev \
  bash tests/performance/scripts/reset-perf-db.sh
```

---

## Known Open Items

| ID | Description | Blocking? |
|----|-------------|-----------|
| OI-01 | Configure GitHub Secrets (JWT_SECRET, AWS_ACCESS_KEY_ID, etc.) | CI deploy only |
| OI-02 | Run `mvn verify -Pcoverage` to confirm JaCoCo 80% threshold passes | Verify only |
| OI-03 | `terraform apply` for prod EKS/RDS | When going to production |

No blocking bugs or open code gaps.
