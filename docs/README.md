# TaskFlow Pro — Documentation

> **All 7 phases complete** · 156 tasks · 14 weeks

This directory contains the source-of-truth documentation for the TaskFlow Pro product and engineering team.

---

## Product Documentation

| Document | Description | Last Updated |
|----------|-------------|-------------|
| [PRD.md](PRD.md) | Product requirements, user personas, feature roadmap | Phase 5 |
| [UI_UX_SPECIFICATION.md](UI_UX_SPECIFICATION.md) | UI specs, user flows, component library, responsive breakpoints | Phase 5 |

---

## Engineering & Architecture

| Document | Description | Last Updated |
|----------|-------------|-------------|
| [TTD.md](TTD.md) | Technical design, system architecture, key decisions | Phase 6 |
| [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md) | ER diagram, all 10 table definitions, indexes, Flyway migrations V1–V12 | Phase 7 |
| [API_DOCUMENTATION.md](API_DOCUMENTATION.md) | Full REST API reference — all endpoints, request/response shapes, error codes | Phase 7 |
| [SECURITY_COMPLIANCE.md](SECURITY_COMPLIANCE.md) | Auth architecture (JWT HS512), RBAC, rate limiting, GDPR, security controls | Phase 6 |

---

## Testing

| Document | Description | Last Updated |
|----------|-------------|-------------|
| [TEST_PLAN.md](TEST_PLAN.md) | Testing strategy, all test types, CI integration, Phase 7 perf testing | Phase 7 |
| [TEST_CASES_API.md](TEST_CASES_API.md) | Postman test case specifications (~98 cases) | Phase 4 |
| [TEST_CASES_E2E.md](TEST_CASES_E2E.md) | Playwright E2E scenario specifications | Phase 6 |

---

## Operations

| Document | Description | Last Updated |
|----------|-------------|-------------|
| [DEPLOYMENT_OPERATION_MANUAL.md](DEPLOYMENT_OPERATION_MANUAL.md) | Local setup, Docker, Kubernetes, CI/CD pipeline, monitoring, runbooks | Phase 7 |
| [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md) | Phase-by-phase task completion tracking (all 156 tasks) | Phase 7 |

---

## Implementation Plan

The full phase-by-phase implementation plan with all 156 task IDs, files, and notes:

📄 **[TaskFlowPro_Implementation_Plan_v2.docx](TaskFlowPro_Implementation_Plan_v2.docx)**

Covers Phases 1–7 including the Phase 7 Performance & Load Testing section (47 tasks, 4 tools, 4 test types).

---

## How to Update Documentation

**Rule: documentation is part of the code change, not an afterthought.**

| When you change... | Update this doc |
|-------------------|----------------|
| Any API endpoint (add/change/remove) | `API_DOCUMENTATION.md` |
| Any DB table or column | `DATABASE_SCHEMA.md` |
| Any UI screen or user flow | `UI_UX_SPECIFICATION.md` |
| Any deployment step, config, or monitoring | `DEPLOYMENT_OPERATION_MANUAL.md` |
| Any security control or policy | `SECURITY_COMPLIANCE.md` |
| Any task status | `IMPLEMENTATION_STATUS.md` |
| Any architectural decision | Create ADR in `.ai/adr/` |

Documentation PRs are reviewed alongside code PRs. An API change without a doc update is **not done** (see `.ai/DEFINITION_OF_DONE.md`).
