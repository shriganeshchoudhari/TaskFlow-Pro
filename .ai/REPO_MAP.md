# Repo map

## Top-level

- `.github/workflows/` — CI/CD workflows
- `backend/` — Spring Boot API (Maven)
- `frontend/` — React SPA (Vite)
- `database/` — schema/migrations/seed data (repo-level organization)
- `tests/` — API, E2E, performance tests
- `monitoring/` — Prometheus/Grafana configs
- `scripts/` — developer automation scripts
- `configs/` — environment-specific config placeholders
- `docs/` — product + technical documentation (source-of-truth)

## Back-end layering (guideline)

Keep responsibilities separated:

- `controller/` — HTTP layer (request/response mapping, validation)
- `service/` — business logic
- `repository/` — persistence access
- `model/` — domain entities
- `dto/` — API request/response DTOs
- `security/` — JWT/auth filters/providers
- `config/` — Spring configuration
- `util/` — shared helpers (avoid business logic here)

## Tests layout (guideline)

- `backend/src/test/java` — JUnit tests (current default)
- `backend/src/test/unit` — place fast unit tests (if you adopt this split)
- `backend/src/test/integration` — integration tests (Testcontainers/Flyway/DB)
- `tests/api/postman` — Postman collection(s) + environments
- `tests/api/rest-client` — `.http` smoke tests
- `tests/e2e/playwright` — Playwright tests/config
- `tests/performance/k6-tests` — k6 scripts

