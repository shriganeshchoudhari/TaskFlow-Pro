# Development workflows

## Feature workflow (end-to-end)

1. Clarify scope + acceptance criteria in `docs/PRD.md`
2. Update technical approach in `docs/TTD.md` (API, data model, UI flow)
3. Database
   - Add/adjust migrations (prefer Flyway-style under backend resources, and/or mirror under `database/migrations/`)
   - Update `docs/DATABASE_SCHEMA.md`
4. Backend
   - Add controller route(s) → service → repository
   - Add DTOs and validation
   - Update `docs/API_DOCUMENTATION.md`
5. Frontend
   - Add page(s)/component(s), hooks/services/store updates
   - Update `docs/UI_UX_SPECIFICATION.md` if flows/components change
6. Tests
   - Backend unit tests (and integration tests if DB behavior changes)
   - Update Postman/rest-client smoke tests
   - Add/adjust Playwright E2E scenarios if user-visible behavior changed
7. Quality gates
   - Run the checks in `./QUALITY_GATES.md`
8. Update ops docs if runtime/deploy behavior changed: `docs/DEPLOYMENT_OPERATION_MANUAL.md`

## Bugfix workflow

1. Reproduce (minimal steps)
2. Add a failing test first (unit/integration/e2e)
3. Fix in the smallest correct layer (controller/service/repo)
4. Run quality gates
5. Add a short note to relevant docs if behavior changed

## Refactor workflow (safe)

1. Identify invariants (API contracts, DB schema, UI behavior)
2. Add/strengthen tests around invariants
3. Refactor in small commits (no API/schema changes unless planned)
4. Run quality gates after each slice

