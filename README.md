# TaskFlow Pro 🚀

> Enterprise-grade Collaborative Task Management Platform — **All 7 phases complete**

[![Backend CI](https://github.com/your-org/taskflow-pro/actions/workflows/backend-ci.yml/badge.svg)](https://github.com/your-org/taskflow-pro/actions/workflows/backend-ci.yml)
[![Frontend CI](https://github.com/your-org/taskflow-pro/actions/workflows/frontend-ci.yml/badge.svg)](https://github.com/your-org/taskflow-pro/actions/workflows/frontend-ci.yml)
[![Coverage](https://codecov.io/gh/your-org/taskflow-pro/branch/main/graph/badge.svg)](https://codecov.io/gh/your-org/taskflow-pro)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## Overview

TaskFlow Pro is an enterprise-ready collaborative task management platform. It provides real-time project boards, task lifecycle management (TODO → IN_PROGRESS → REVIEW → DONE), team collaboration via comments and notifications, and a live dashboard — all backed by a production-grade DevOps pipeline with comprehensive performance testing.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Backend** | Java 21, Spring Boot 3.5, Spring Security, JWT (HS512) |
| **Database** | PostgreSQL 16, JPA/Hibernate, Flyway migrations (V1–V12) |
| **Frontend** | React 18, Vite, Redux Toolkit, Material UI v5 |
| **Real-time** | WebSocket (STOMP over SockJS) |
| **Rate Limiting** | Bucket4j (10 req/15min login · 5 req/hr register) |
| **DevOps** | Docker, Kubernetes (AWS EKS), Helm, Terraform |
| **CI/CD** | GitHub Actions (backend-ci · frontend-ci · e2e · deploy) |
| **Monitoring** | Prometheus, Grafana (auto-provisioned dashboards), Spring Actuator |
| **Performance Testing** | k6 · Apache JMeter · Gatling · Locust |

---

## Quick Start

### Option 1 — Automated bootstrap (recommended)

```bash
git clone https://github.com/your-org/taskflow-pro.git
cd taskflow-pro
bash scripts/setup.sh
```

`setup.sh` checks prerequisites, starts the full Docker stack, waits for the backend health endpoint, and seeds a demo user.

### Option 2 — Manual Docker Compose

```bash
# From repo root:
docker compose -f infra/docker/docker-compose.dev.yml up --build

# With monitoring (Prometheus + Grafana):
docker compose -f infra/docker/docker-compose.dev.yml \
               --profile monitoring up --build
```

### Option 3 — Individual services (development)

```bash
# Terminal 1 — Backend (requires PostgreSQL on :5432)
cd backend && ./mvnw spring-boot:run

# Terminal 2 — Frontend
cd frontend && npm install && npm run dev
```

### Access Points

| Service | URL | Notes |
|---------|-----|-------|
| Frontend | http://localhost:5173 (dev) / http://localhost:80 (Docker) | React SPA |
| Backend API | http://localhost:8080 | Spring Boot REST |
| Swagger UI | http://localhost:8080/swagger-ui.html | Interactive API docs |
| Actuator health | http://localhost:8080/actuator/health | Liveness + readiness |
| Grafana | http://localhost:3000 | API & JVM dashboards |
| Prometheus | http://localhost:9090 | Metrics scraping |
| InfluxDB (perf) | http://localhost:8086 | k6/JMeter/Locust sink |

**Demo credentials (seeded by setup.sh and V12 migration):**

| Email | Password | Role |
|-------|----------|------|
| `admin@taskflow.com` | `Admin@1234` | ADMIN |
| `manager1@taskflow.com` | `Test@1234` | MANAGER |
| `worker1@taskflow.com` | `Test@1234` | MEMBER |

---

## Project Structure

```
taskflow-pro/
├── .ai/                        # AI dev-kit: context, repo map, checklists, ADRs
├── .github/workflows/          # CI/CD: backend-ci · frontend-ci · e2e · deploy
│                               #         k6-load · jmeter-ci · locust-ci · perf-report
├── backend/                    # Spring Boot 3.5 REST API (Java 21, Maven)
│   ├── src/main/java/          # Controllers · Services · Repositories · Models · Security
│   ├── src/main/resources/     # application.yml · application-perf.yml · Flyway migrations V1–V12
│   └── src/test/               # Unit tests (JUnit 5 + Mockito) · Integration tests (Testcontainers)
├── frontend/                   # React 18 SPA (Vite + Redux Toolkit + MUI v5)
│   ├── src/components/         # tasks · projects · notifications · shared · dashboard
│   ├── src/pages/              # Dashboard · Projects · Tasks · Profile · Auth
│   ├── src/store/              # Redux slices: auth · projects · tasks · notifications · ui
│   ├── src/services/           # Axios wrappers: auth · project · task · comment · notification
│   └── src/__tests__/          # Vitest + React Testing Library tests
├── infra/
│   ├── docker/                 # docker-compose.dev.yml · docker-compose.perf.yml · Dockerfiles · nginx.conf
│   ├── kubernetes/             # backend-deployment.yaml (HPA) · frontend-deployment.yaml · ingress.yaml
│   ├── helm/taskflow-chart/    # Helm chart for EKS deployment
│   └── terraform/              # AWS EKS · RDS · VPC infrastructure
├── monitoring/
│   ├── prometheus/             # prometheus.yml (15s scrape, K8s SD)
│   └── grafana/
│       ├── dashboards/         # taskflow-api.json (12 panels: latency · errors · JVM · HikariCP)
│       └── provisioning/       # Auto-provision Prometheus datasource + dashboard directory
├── scripts/
│   ├── setup.sh                # One-command local bootstrap
│   ├── build.sh                # Build backend + frontend
│   └── deploy.sh               # Deploy to Kubernetes
├── tests/
│   ├── api/postman/            # Postman collection (~98 test cases)
│   ├── api/rest-client/        # .http files for VS Code REST Client
│   ├── e2e/playwright/         # E2E tests (8 spec files · global-setup.ts · playwright.config.ts)
│   └── performance/
│       ├── k6/                 # smoke · load · stress · spike · auth_flow · board_scenario · rps_test
│       ├── jmeter/             # TaskFlowPro.jmx · Soak_24h.jmx · generate-report.sh
│       ├── gatling/            # LoadSimulation.scala · StressSimulation.scala · pom.xml · build.sbt
│       ├── locust/             # locustfile.py · soak_locustfile.py · locust.conf
│       ├── scripts/            # seed-perf-data.sql · reset-perf-db.sh · regression_check.py
│       ├── reports/            # generate-perf-report.py (unified HTML from all 4 tools)
│       └── baselines/          # perf-baseline.json (P95 targets per endpoint)
└── docs/                       # All source-of-truth documentation
```

---

## Development

### Backend

```bash
cd backend

# Run (dev profile)
./mvnw spring-boot:run

# Run (perf profile — HikariCP pool=50, slow-query logging)
SPRING_PROFILES_ACTIVE=perf ./mvnw spring-boot:run

# Tests
./mvnw test                        # Unit tests only (no DB required)
./mvnw verify -Pintegration-test   # Unit + Testcontainers integration tests
./mvnw verify jacoco:report        # With JaCoCo HTML report (target/site/jacoco/)
./mvnw verify -Pcoverage           # Enforce ≥ 80% line coverage (fails build if below)
```

### Frontend

```bash
cd frontend
npm install

npm run dev            # Dev server → http://localhost:5173
npm test               # Vitest unit tests
npm run test:coverage  # With V8 coverage report
npm run lint           # ESLint
npm run build          # Production build → dist/
```

### E2E Tests (Playwright)

```bash
cd tests/e2e/playwright
npm install
npx playwright install --with-deps chromium

# Requires running stack on localhost
npx playwright test                   # All 8 spec files, headless
npx playwright test --ui              # Interactive Playwright UI
npx playwright test tests/taskflow.spec.ts   # Single spec
PLAYWRIGHT_BASE_URL=http://localhost:80 npx playwright test  # Against Docker stack
```

---

## Performance Testing

Four tools cover all four test types. See `tests/performance/` for full scripts.

### Global SLA Thresholds

| Metric | Target |
|--------|--------|
| P95 latency | < 300 ms |
| P99 latency | < 800 ms |
| Error rate | < 1% |

### k6 (primary — runs in CI on every PR/merge)

```bash
cd tests/performance/k6

# Smoke — 5 VUs · 30s (every PR)
k6 run smoke.js --env BASE_URL=http://localhost:8080

# Load — 0→500 VUs over 15 min (every main merge)
k6 run load_test.js --env BASE_URL=http://localhost:8080 \
                    --summary-export=k6-summary.json

# Stress — ramp to 1 500 VUs, find ceiling (weekly)
k6 run stress_test.js --env BASE_URL=http://localhost:8080

# Spike — 0→1 000 VUs in 10s, recovery SLA ≤ 30s (weekly)
k6 run spike_test.js --env BASE_URL=http://localhost:8080

# Constant arrival rate — validate throughput targets
k6 run rps_test.js --env BASE_URL=http://localhost:8080 --env TARGET_RPS=300
```

### JMeter (load + soak)

```bash
cd tests/performance/jmeter

# Seed test users first
python3 data/generate-test-users.py --count 300 --register --base-url http://localhost:8080

# Load test (300 threads · 10 min)
jmeter -n -t TaskFlowPro.jmx -l results/load.jtl -e -o reports/html \
       -JBASE_URL=http://localhost:8080 -JTHREAD_COUNT=300 -JDURATION=600

# 24-hour soak test
jmeter -n -t Soak_24h.jmx -l results/soak.jtl -JDURATION=86400

# Generate HTML report from any JTL
./generate-report.sh results/load.jtl --open
```

### Gatling (high-concurrency stress)

```bash
cd tests/performance/gatling

# Maven
mvn gatling:test -Dgatling.simulationClass=taskflow.LoadSimulation \
                 -DBASE_URL=http://localhost:8080

# sbt
sbt "gatling:testOnly taskflow.StressSimulation"
```

### Locust (Python — stress, spike, soak)

```bash
cd tests/performance/locust

# Load (200 VUs · 10 min)
locust -f locustfile.py --host=http://localhost:8080 \
       --users=200 --spawn-rate=20 --run-time=10m --headless \
       --html=reports/locust-load.html

# 8-hour soak
locust -f soak_locustfile.py --host=http://localhost:8080 \
       --users=50 --spawn-rate=5 --run-time=8h --headless
```

### Unified report

```bash
python3 tests/performance/reports/generate-perf-report.py \
  --k6      results/k6-summary.json \
  --jmeter  results/jmeter/load-results.jtl \
  --gatling results/gatling-simulation.log \
  --locust  results/locust-load_stats.csv \
  --output  reports/perf-report.html

# Regression check vs baseline (used in CI)
python3 tests/performance/scripts/regression_check.py k6-summary.json --threshold 20
```

---

## CI/CD Pipelines

| Workflow | Trigger | Duration | Gate |
|----------|---------|----------|------|
| `backend-ci.yml` | PR + main push | ~8 min | Unit + integration tests, JaCoCo ≥ 80% |
| `frontend-ci.yml` | PR + main push | ~3 min | ESLint + Vitest + build |
| `e2e-tests.yml` | main merge | ~15 min | All Playwright specs pass |
| `deploy.yml` | main merge | ~10 min | ECR push + EKS rolling update |
| `k6-load.yml` | PR (smoke) / main merge (load) | ~2/15 min | P95 < 300ms, error < 1% |
| `jmeter-ci.yml` | main merge | ~20 min | Avg < 400ms, error < 1% |
| `locust-ci.yml` | main merge + weekly soak | ~10m / 8h | Avg < 400ms |
| `perf-report.yml` | After all perf jobs | ~3 min | Regression < 20% vs baseline |

---

## Kubernetes Deployment

```bash
# Deploy with Helm
helm upgrade --install taskflow-pro ./infra/helm/taskflow-chart \
  --namespace taskflow-pro --create-namespace \
  --set backend.image.tag=$(git rev-parse --short HEAD) \
  --set frontend.image.tag=$(git rev-parse --short HEAD) \
  --atomic --timeout=5m

# Infrastructure with Terraform
cd terraform/environments/prod
terraform init && terraform plan && terraform apply
```

**Key K8s features:**
- Backend: 2 replicas, HPA (min 2 · max 10 · CPU 70%), liveness/readiness/startup probes
- Ingress: TLS termination via cert-manager, HTTPS redirect, rate-limit annotations
- Prometheus auto-scrape via pod annotations (`prometheus.io/scrape: "true"`)

---

## Monitoring

Grafana auto-provisions on startup (no manual import needed):

- **API & JVM Dashboard** (`taskflow-api.json`): request rate, P50/P95/P99 latency, 4xx/5xx error rate, JVM heap, GC pause time, HikariCP connection pool, CPU usage
- Datasource: Prometheus at `http://prometheus:9090`

All logs are structured JSON with `traceId` injected by `MdcTraceIdFilter` for end-to-end request correlation.

---

## Security

- JWT HS512 · access token 15 min · refresh token 7 days · BCrypt strength 12
- Rate limiting: 10 req/15 min on `/auth/login`, 5 req/hr on `/auth/register` (per IP)
- All secrets via environment variables — never committed to source
- TLS termination at ingress (cert-manager + Let's Encrypt)
- `X-Trace-Id` header echoed in every response for log correlation

---

## Documentation

| Document | Description |
|----------|-------------|
| [PRD.md](docs/PRD.md) | Product Requirements |
| [TTD.md](docs/TTD.md) | Technical Design |
| [DATABASE_SCHEMA.md](docs/DATABASE_SCHEMA.md) | Schema · ER diagram · migrations V1–V12 |
| [API_DOCUMENTATION.md](docs/API_DOCUMENTATION.md) | REST API reference (all endpoints) |
| [UI_UX_SPECIFICATION.md](docs/UI_UX_SPECIFICATION.md) | UI specs · user flows · components |
| [SECURITY_COMPLIANCE.md](docs/SECURITY_COMPLIANCE.md) | Security architecture · GDPR |
| [TEST_PLAN.md](docs/TEST_PLAN.md) | Testing strategy (unit · integration · E2E · perf) |
| [TEST_CASES_API.md](docs/TEST_CASES_API.md) | API test cases (Postman) |
| [TEST_CASES_E2E.md](docs/TEST_CASES_E2E.md) | E2E test cases (Playwright) |
| [DEPLOYMENT_OPERATION_MANUAL.md](docs/DEPLOYMENT_OPERATION_MANUAL.md) | Deployment · ops · runbooks |
| [IMPLEMENTATION_STATUS.md](docs/IMPLEMENTATION_STATUS.md) | Phase-by-phase completion tracking |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Contribution guide · dev workflow · standards |

Implementation plan with task IDs: `docs/TaskFlowPro_Implementation_Plan_v2.docx`

---

## License

MIT License — see [LICENSE](LICENSE) for details.
