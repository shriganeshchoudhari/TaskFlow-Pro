# Project context (quick)

## What this is

TaskFlow Pro is a collaborative task management platform:

- Backend: Java 21, Spring Boot 3.x, Spring Security, JWT, JPA/Hibernate, Flyway
- Frontend: React 18, Vite, Redux Toolkit, MUI
- Database: PostgreSQL
- Ops: Docker, Kubernetes, Helm, Terraform
- Monitoring: Prometheus, Grafana

## Source-of-truth docs

- Product: `docs/PRD.md`
- Technical design: `docs/TTD.md`
- API: `docs/API_DOCUMENTATION.md`
- Database: `docs/DATABASE_SCHEMA.md`
- UI/UX: `docs/UI_UX_SPECIFICATION.md`
- Security: `docs/SECURITY_COMPLIANCE.md`
- Tests: `docs/TEST_PLAN.md`, `docs/TEST_CASES_API.md`, `docs/TEST_CASES_E2E.md`
- Ops: `docs/DEPLOYMENT_OPERATION_MANUAL.md`

## Common ports (local)

- Backend: `http://localhost:8080`
- Frontend: `http://localhost:5173` (Vite dev) or `http://localhost:80` (container)
- Swagger UI: `http://localhost:8080/swagger-ui.html`
- Actuator health: `http://localhost:8080/actuator/health`

## Commands

Backend:

- Run: `cd backend && ./mvnw spring-boot:run`
- Unit tests: `cd backend && ./mvnw test`

Frontend:

- Dev: `cd frontend && npm install && npm run dev`
- Tests: `cd frontend && npm test`
- Lint: `cd frontend && npm run lint`

Local stack (existing compose):

- `docker compose -f docker/docker-compose.dev.yml up --build`

## Repo reality note (paths)

This repo currently has **both**:

- `docker/`, `k8s/`, `helm/`, `terraform/` (existing)
- `infra/` (added to match the target structure)

Prefer:

- Local dev: `docker/docker-compose.dev.yml`
- Deployment artifacts (going forward): `infra/*` (unless/until you consolidate)

