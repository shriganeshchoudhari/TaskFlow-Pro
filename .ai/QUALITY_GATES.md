# Quality gates (must pass before merge)

## Backend

- Unit tests: `mvn -f backend/pom.xml -B test`
- Packaging: `mvn -f backend/pom.xml -B -DskipTests package`

Integration tests (if/when you add them):

- Use Maven Failsafe + `integration-test` profile from `backend/pom.xml`
- Command: `mvn -f backend/pom.xml -B -Pintegration-test verify`

## Frontend

- Install: `cd frontend && npm install` (or `npm ci` if lockfile exists)
- Lint: `cd frontend && npm run lint`
- Unit tests: `cd frontend && npm test`
- Build: `cd frontend && npm run build`

## E2E (optional, when Playwright project is configured)

- `cd tests/e2e/playwright && npx playwright test`

## Docs (when behavior changes)

- Update: `docs/API_DOCUMENTATION.md`, `docs/DATABASE_SCHEMA.md`, `docs/UI_UX_SPECIFICATION.md`

