# Prompt templates (copy/paste)

## Feature implementation prompt

Context:

- Repo: TaskFlow Pro (`backend/` Spring Boot, `frontend/` React/Vite)
- Source-of-truth docs: `docs/PRD.md`, `docs/TTD.md`, `docs/API_DOCUMENTATION.md`

Request:

1) Summarize the feature and acceptance criteria.
2) Propose backend API changes (routes, DTOs, validation, auth).
3) Propose DB migration changes (tables/columns/indexes).
4) Propose frontend changes (pages/components/store/services).
5) List tests to add (unit/integration/e2e).
6) List docs to update.

Constraints:

- Keep changes minimal and consistent with existing code style.
- Update docs only if behavior/contracts change.

## Bugfix prompt

Provide:

- Steps to reproduce
- Expected vs actual
- Logs/stack trace
- Relevant endpoints/UI pages

Ask for:

- A failing test first
- The smallest safe fix
- Regression coverage

## ADR prompt

Create an ADR for:

- Decision: <what>
- Options considered: <A/B/C>
- Tradeoffs: <pros/cons>
- Outcome: <chosen + why>
- Consequences: <what changes next>

Write it using `.ai/adr/0000-template.md`.

