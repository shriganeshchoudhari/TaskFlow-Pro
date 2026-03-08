# Checklists

## Security checklist (minimum)

- Validate all inputs at the boundary (DTO + validation)
- Enforce authorization at endpoints (role/ownership checks)
- Avoid leaking sensitive info in errors/logs
- Never commit secrets; use env vars / secret managers
- Add rate limiting/throttling if endpoints are abuse-prone (when applicable)
- Ensure CORS is restricted to known origins in non-dev
- Keep dependencies updated (backend + frontend)

## Release checklist (minimum)

- Version bump strategy decided (backend jar, frontend build, chart)
- Backend: `mvn -f backend/pom.xml -B test package`
- Frontend: `cd frontend && npm run lint test build`
- Docker images build successfully (if used)
- Migrations verified against a clean database
- Smoke test:
  - `GET /actuator/health` is `UP`
  - Core user flows pass (login + basic CRUD)
- Update `docs/DEPLOYMENT_OPERATION_MANUAL.md` if anything operational changed

