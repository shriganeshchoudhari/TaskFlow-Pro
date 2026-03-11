# Project Context

## What this is

TaskFlow Pro is an enterprise-grade collaborative task management platform:

- **Backend:** Java 21 · Spring Boot 3.2.1 · Spring Security · JWT (HS512) · JPA/Hibernate · Flyway
- **Frontend:** React 18 · Vite · Redux Toolkit · MUI v5
- **Database:** PostgreSQL 16 · UUID PKs · Flyway versioned migrations
- **Auth:** JWT — access token 15 min · refresh token 7 days · BCrypt strength 12
- **Ops:** Docker · Kubernetes (EKS) · Helm · Terraform
- **Monitoring:** Prometheus · Grafana · Structured JSON logs · Spring Actuator

---

## Implementation Plan — 6 Phases / 12 Weeks / 109 Tasks

| Phase | Focus | Duration | Status |
|-------|-------|----------|--------|
| **Phase 1** | Foundation & Authentication | Week 1–2 | ✅ Complete |
| **Phase 2** | Project Management | Week 3–4 | ✅ Complete |
| **Phase 3** | Task Management | Week 5–6 | ✅ Complete |
| **Phase 4** | Comments, Notifications & Activity | Week 7–8 | ✅ Complete |
| **Phase 5** | Dashboard, Profile & UI Polish | Week 9–10 | ✅ Complete |
| **Phase 6** | DevOps, Testing & Monitoring | Week 11–12 | 🔄 In Progress |

> Full breakdown: `TaskFlowPro_Implementation_Plan.docx` · Task IDs: `B{phase}-{nn}` (backend), `F{phase}-{nn}` (frontend), `T6-{nn}` (testing), `D6-{nn}` (Docker), `CI6-{nn}` (CI/CD), `K6-{nn}` (Kubernetes)

---

## ▶ Current Focus — Phase 6: DevOps, Testing & Monitoring

See `.ai/PHASE6_PLAN.md` for the full ordered execution plan with all known gaps.

### Critical Bugs to Fix First (block everything else)

1. **`AuthServiceTest` fails** — `register_DuplicateEmail_ThrowsException` asserts `UnauthorizedException`
   but `AuthService.register()` throws `ConflictException`. Fix the assertion before adding more tests.

2. **Docker build context bug** — `docker-compose.dev.yml` sets `context: ..` (= `infra/`), but both
   Dockerfiles `COPY backend/` and `COPY frontend/` expect repo root as context. Change to `context: ../..`.

3. **`UserController` architecture violation** — controller directly injects `UserRepository` and
   `PasswordEncoder` instead of delegating to `UserService`. Refactor to use `UserService.updateProfile()`
   and `UserService.updatePassword()`.

### Phase 6 Immediate Next Tasks

**Testing (start here — highest risk area):**
- `T6-01` — `AuthControllerIT.java` integration tests (Testcontainers)
- `T6-02` — `TaskServiceTest.java` unit tests
- `T6-03` — `CommentServiceTest.java`, `NotificationServiceTest.java` unit tests
- `T6-07` — JaCoCo coverage check (pom.xml already configured; need to verify threshold passes)

**Infrastructure:**
- `D6-05` — Complete `scripts/setup.sh` (currently a stub)
- `K6-01` — Flesh out `backend-deployment.yaml` (HPA, probes, resource limits, Prometheus annotations)
- `K6-02` — Flesh out `frontend-deployment.yaml` + `ingress.yaml` (TLS, HTTPS redirect)

**CI/CD:**
- `CI6-01` — Complete `backend-ci.yml` (add JaCoCo report step, coverage enforcement)
- `CI6-04` — Implement `deploy.yml` (currently a stub)

### Phase 6 Definition of Done
- All backend unit + integration tests pass; JaCoCo ≥ 80% line coverage
- Playwright E2E suite passes headlessly in CI
- k6 load test: P95 ≤ 300ms at 500 VUs
- GitHub Actions CI on every PR; deploy workflow pushes to EKS on main merge
- No CRITICAL CVEs in Trivy image scan
- Prometheus scraping; Grafana dashboards show live API metrics
- `docker-compose up --build` starts full local stack with one command

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
| Phase 6 execution plan | `.ai/PHASE6_PLAN.md` |

---

## Common Ports (local)

| Service | URL |
|---------|-----|
| Backend API | `http://localhost:8080` |
| Frontend (Vite dev) | `http://localhost:5173` |
| Frontend (container) | `http://localhost:80` |
| Swagger UI | `http://localhost:8080/swagger-ui.html` |
| Actuator health | `http://localhost:8080/actuator/health` |
| Grafana | `http://localhost:3000` |
| Prometheus | `http://localhost:9090` |

---

## Quick Commands

### Backend
```bash
cd backend
./mvnw spring-boot:run                    # Run API server
./mvnw test                               # Unit tests only
./mvnw verify -Pintegration-test          # Unit + integration tests
./mvnw verify jacoco:report               # With coverage report
./mvnw verify -Pcoverage                  # Enforce ≥ 80% coverage threshold
```

### Frontend
```bash
cd frontend
npm install && npm run dev                # Install + start dev server
npm run test                              # Unit tests (Vitest)
npm run test:coverage                     # With coverage report
npm run lint                              # ESLint
npm run build                             # Production build → dist/
```

### Full Local Stack (once D6-03 context bug is fixed)
```bash
# Run from repo root:
docker compose -f infra/docker/docker-compose.dev.yml up --build
# Starts: PostgreSQL · Redis · Backend · Frontend · Prometheus · Grafana
```

### E2E Tests
```bash
cd tests/e2e/playwright
npx playwright install --with-deps
npx playwright test                       # All scenarios (headless Chromium)
npx playwright test --ui                  # Interactive mode
```

### k6 Load Test (after T6-06 is created)
```bash
cd tests/performance/k6-tests
k6 run load-test.js                       # Target: P95 < 300ms @ 500 VUs
```

---

## Known Bugs & Tech Debt

| ID | Severity | Location | Description |
|----|----------|----------|-------------|
| BUG-01 | 🔴 High | `AuthServiceTest.java:42` | Test asserts `UnauthorizedException` but service throws `ConflictException` — test FAILS |
| BUG-02 | 🔴 High | `docker-compose.dev.yml:build.context` | Context is `..` (=`infra/`); both Dockerfiles expect repo root — Docker build FAILS |
| BUG-03 | 🟡 Med | `UserController.java` | Controller directly injects `UserRepository` + `PasswordEncoder` instead of using `UserService` — architecture violation |
| BUG-04 | 🟡 Med | `AuthService.logout()` | Method is a no-op; `RefreshTokenRepository.revokeByToken()` exists but is never called |
| GAP-01 | 🟡 Med | `SecurityConfig.java` | Rate limiting (B5-04) not implemented — no Bucket4j or RateLimitFilter |
| GAP-02 | 🟠 Low | All controllers | `@Operation` annotations missing — Swagger shows endpoints but no descriptions |
| GAP-03 | 🟠 Low | `application.yml` | MDC traceId pattern defined but no `MdcFilter` injects the traceId into MDC |
| GAP-04 | 🟠 Low | `scripts/setup.sh` | Script is a stub — only prints TODO message |
| GAP-05 | 🟠 Low | `backend-deployment.yaml` | Minimal stub — no HPA, probes, resource limits, or Prometheus annotations |
| GAP-06 | 🟠 Low | `ingress.yaml` | Missing TLS config, cert-manager annotations, HTTPS redirect |
| GAP-07 | 🟠 Low | `monitoring/grafana/dashboards/` | Directory is empty — no Grafana dashboard JSON files |
| GAP-08 | 🟠 Low | `.github/workflows/deploy.yml` | Stub — only prints a placeholder message |
| GAP-09 | 🟠 Low | `.github/workflows/backend-ci.yml` | Missing JaCoCo report upload and coverage enforcement step |
| GAP-10 | 🟠 Low | `tests/performance/k6-tests/` | `load-test.js` does not exist |
