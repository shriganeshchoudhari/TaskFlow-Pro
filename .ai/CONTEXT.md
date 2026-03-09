# Project Context

## What this is

TaskFlow Pro is an enterprise-grade collaborative task management platform:

- **Backend:** Java 21 · Spring Boot 3.x · Spring Security · JWT (HS512) · JPA/Hibernate · Flyway
- **Frontend:** React 18 · Vite · Redux Toolkit · MUI v5
- **Database:** PostgreSQL 16 · UUID PKs · Flyway versioned migrations
- **Auth:** JWT — access token 15 min · refresh token 7 days · BCrypt strength 12
- **Ops:** Docker · Kubernetes (EKS) · Helm · Terraform
- **Monitoring:** Prometheus · Grafana · Structured JSON logs · Spring Actuator

---

## Implementation Plan — 6 Phases / 12 Weeks / 109 Tasks

| Phase | Focus | Duration | Status |
|-------|-------|----------|--------|
| **Phase 1** | Foundation & Authentication | Week 1–2 | 🔄 In Progress |
| **Phase 2** | Project Management | Week 3–4 | ⏳ Pending |
| **Phase 3** | Task Management | Week 5–6 | ⏳ Pending |
| **Phase 4** | Comments, Notifications & Activity | Week 7–8 | ⏳ Pending |
| **Phase 5** | Dashboard, Profile & UI Polish | Week 9–10 | ⏳ Pending |
| **Phase 6** | DevOps, Testing & Monitoring | Week 11–12 | ⏳ Pending |

> Full breakdown: `TaskFlowPro_Implementation_Plan.docx` · Task IDs follow pattern: `B{phase}-{nn}` (backend), `F{phase}-{nn}` (frontend), `T6-{nn}` (testing), `D6-{nn}` (Docker), `CI6-{nn}` (CI/CD), `K6-{nn}` (Kubernetes)

---

## ▶ Current Focus — Phase 1: Foundation & Authentication

### Immediate Next Tasks (start here)

**Backend (parallel):**
- `B1-01` — Flyway V1 migration: `users` table
- `B1-02` — Flyway V8 migration: `refresh_tokens` table
- `B1-03` — Configure `application.yml` (datasource, Flyway, HikariCP)
- `B1-04` — `User` JPA entity + `UserRepository`
- `B1-05` — `RefreshToken` entity + repository

**Frontend (parallel):**
- `F1-01` — Init Vite + React 18; install MUI, Redux Toolkit, React Router, Axios
- `F1-02` — Redux store + `authSlice`

### Phase 1 Definition of Done
- [ ] `POST /auth/register` → 201 with user object
- [ ] `POST /auth/login` → access token + refresh token
- [ ] `POST /auth/refresh` → rotates tokens correctly
- [ ] Invalid credentials → 401 with error body
- [ ] Frontend login form stores token, redirects to `/dashboard` placeholder
- [ ] Protected routes redirect to `/login` when unauthenticated
- [ ] `AuthService` unit tests ≥ 80% coverage

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
| Implementation plan | `docs/IMPLEMENTATION_STATUS.md` |

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
./mvnw verify                             # Unit + integration tests
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

### Full Local Stack
```bash
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

### k6 Load Test
```bash
cd tests/performance/k6-tests
k6 run load-test.js                       # Target: P95 < 300ms @ 500 VUs
```

---

## Repo Reality Note

This repo has **both**:
- `docker/`, `k8s/`, `helm/`, `terraform/` (root-level, existing)
- `infra/` (added to match target structure — Dockerfiles, compose, k8s manifests, Helm)

**Prefer going forward:**
- Local dev: `infra/docker/docker-compose.dev.yml`
- Deployment artifacts: `infra/*`
- Terraform: `terraform/` (root)
