# `.ai/` — AI-Assisted Development Kit

This folder contains **compact, operational** project context for fast onboarding of both humans and AI tools.

Source-of-truth product/technical docs live in `docs/`. This folder focuses on **how to work** in the repo.

---

## Start Here

| File | Purpose |
|------|---------|
| `CONTEXT.md` | One-page project context, all phases, current status, commands |
| `REPO_MAP.md` | Annotated file map — what exists, what each file does |
| `WORKFLOWS.md` | Step-by-step dev workflows (feature / bugfix / refactor / migration) |
| `QUALITY_GATES.md` | What must pass before merging (backend + frontend + E2E + perf) |
| `DEFINITION_OF_DONE.md` | What "done" means — universal + per-phase criteria |
| `CHECKLISTS.md` | Per-phase task checklists + security/release checklists |
| `PROMPT_TEMPLATES.md` | Copy-paste prompts for each phase's implementation tasks |
| `adr/` | Architecture Decision Records |

---

## Implementation Plan — All Phases Complete

| Phase | Focus | Duration | Tasks | Status |
|-------|-------|----------|-------|--------|
| Phase 1 | Foundation & Authentication | Week 1–2 | 15 | ✅ Complete |
| Phase 2 | Project Management | Week 3–4 | 15 | ✅ Complete |
| Phase 3 | Task Management | Week 5–6 | 20 | ✅ Complete |
| Phase 4 | Comments, Notifications & Activity | Week 7–8 | 17 | ✅ Complete |
| Phase 5 | Dashboard, Profile & UI Polish | Week 9–10 | 18 | ✅ Complete |
| Phase 6 | DevOps, Testing & Monitoring | Week 11–12 | 24 | ✅ Complete |
| Phase 7 | Performance & Load Testing | Week 13–14 | 47 | ✅ Complete |

**156 total tasks** · 41 backend · 44 frontend · 71 DevOps/QA/Perf

---

## Task ID Reference

| Prefix | Meaning | Example |
|--------|---------|---------|
| `B{phase}-{nn}` | Backend task | `B1-06` = JwtTokenProvider |
| `F{phase}-{nn}` | Frontend task | `F3-03` = BoardView component |
| `T6-{nn}` | Testing task (Phase 6) | `T6-05` = Playwright E2E |
| `D6-{nn}` | Docker / local dev (Phase 6) | `D6-01` = Backend Dockerfile |
| `CI6-{nn}` | CI/CD workflow (Phase 6) | `CI6-04` = deploy.yml |
| `K6-{nn}` | Kubernetes / monitoring (Phase 6) | `K6-04` = Grafana dashboards |
| `PT-K6-{nn}` | k6 performance task (Phase 7) | `PT-K6-01` = smoke test |
| `PT-JM-{nn}` | JMeter performance task (Phase 7) | `PT-JM-06` = soak test |
| `PT-GA-{nn}` | Gatling performance task (Phase 7) | `PT-GA-03` = stress simulation |
| `PT-LO-{nn}` | Locust performance task (Phase 7) | `PT-LO-05` = soak locustfile |
| `PT-DT-{nn}` | Test data / environment (Phase 7) | `PT-DT-01` = seed SQL |
| `PT-RP-{nn}` | Reporting / observability (Phase 7) | `PT-RP-05` = regression check |

---

## Phase 7 SLA Thresholds

All performance tools enforce these thresholds — breach fails CI:

| Metric | Target | CI behaviour |
|--------|--------|-------------|
| P95 latency | < 300 ms | k6 hard threshold; Locust `quitting` event |
| P99 latency | < 800 ms | k6 threshold |
| Error rate | < 1% | All tools |
| Spike recovery | ≤ 30 s | k6 `spike_recovery_ms` trend |
| Regression | < 20% vs baseline | `regression_check.py` |

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
