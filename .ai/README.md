# `.ai/` — AI-Assisted Development Kit

This folder contains **compact, operational** project context for:

- Fast onboarding (humans and AI tools)
- Consistent phase-by-phase implementation workflows
- Repeatable quality gates (tests, lint, CI)
- Decision tracking (ADRs)

Source-of-truth product/technical docs live in `docs/`. This folder focuses on **how to work** in the repo.

---

## Start Here

| File | Purpose |
|------|---------|
| `CONTEXT.md` | One-page project context, current phase status, commands |
| `REPO_MAP.md` | What files exist vs. need to be created, per phase task IDs |
| `WORKFLOWS.md` | Step-by-step dev workflows (feature / bugfix / refactor / migration) |
| `QUALITY_GATES.md` | What must pass before merging (backend + frontend + E2E + security) |
| `DEFINITION_OF_DONE.md` | What "done" means — universal + per-phase criteria |
| `CHECKLISTS.md` | Per-phase task checklists + security/release checklists |
| `PROMPT_TEMPLATES.md` | Copy-paste prompts for each phase's implementation tasks |
| `adr/` | Architecture Decision Records |

---

## Implementation Plan at a Glance

| Phase | Focus | Duration | Status |
|-------|-------|----------|--------|
| Phase 1 | Foundation & Authentication | Week 1–2 | 🔄 In Progress |
| Phase 2 | Project Management | Week 3–4 | ⏳ Pending |
| Phase 3 | Task Management | Week 5–6 | ⏳ Pending |
| Phase 4 | Comments, Notifications & Activity | Week 7–8 | ⏳ Pending |
| Phase 5 | Dashboard, Profile & UI Polish | Week 9–10 | ⏳ Pending |
| Phase 6 | DevOps, Testing & Monitoring | Week 11–12 | ⏳ Pending |

**109 total tasks** · 41 backend · 44 frontend · 24 DevOps/QA

---

## Task ID Reference

| Prefix | Meaning | Example |
|--------|---------|---------|
| `B{phase}-{nn}` | Backend task | `B1-06` = JwtTokenProvider |
| `F{phase}-{nn}` | Frontend task | `F3-03` = BoardView component |
| `T6-{nn}` | Testing task (Phase 6) | `T6-05` = Playwright E2E |
| `D6-{nn}` | Docker/local dev (Phase 6) | `D6-01` = Backend Dockerfile |
| `CI6-{nn}` | CI/CD (Phase 6) | `CI6-04` = deploy.yml |
| `K6-{nn}` | Kubernetes/monitoring (Phase 6) | `K6-04` = Grafana dashboards |

---

## ADRs

See `adr/` for architecture decisions. To add a new ADR:

1. Copy `adr/0000-template.md` → `adr/{NNNN}-{short-title}.md`
2. Fill in: context, decision, options, tradeoffs, consequences
3. Add entry to `adr/README.md` index
4. Link from `docs/TTD.md` if it changes architecture

Current ADRs:
- `0001-jwt-hs512-authentication.md` — JWT algorithm and token strategy
- `0002-postgresql-flyway-migrations.md` — Database and migration tooling
