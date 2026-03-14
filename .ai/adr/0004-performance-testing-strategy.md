# ADR 0004: Four-Tool Performance Testing Strategy (k6 + JMeter + Gatling + Locust)

## Status

Accepted (Phase 7 — implemented in `tests/performance/`)

## Context

TaskFlow Pro requires comprehensive performance validation before production release. The team
needed a strategy that covers multiple test types (load, stress, spike, soak), integrates into
CI/CD, and accommodates different developer preferences and tooling backgrounds.

## Decision

Use **four performance testing tools** in complementary roles, unified by a shared InfluxDB
time-series backend and a Python report aggregator:

| Tool | Primary Role | Test Types | CI Integration |
|------|-------------|------------|----------------|
| **k6** | Primary CI gate (JavaScript) | Load · Stress · Spike | Every PR (smoke) + every main merge (load) |
| **JMeter** | Realistic browser-like scenarios | Load · Soak | Every main merge |
| **Gatling** | High-concurrency Scala DSL | Stress · Load | On demand / CI optional |
| **Locust** | Python exploration + soak | Stress · Spike · Soak | Load on main merge + weekly 8h soak |

Global SLA thresholds enforced by all tools:
- P95 latency < 300ms
- P99 latency < 800ms
- Error rate < 1%

## Options Considered

### A. k6 only
- **Pros:** Simple, fast, excellent CI integration, JavaScript familiar to frontend devs
- **Cons:** Single tool means a single point of failure in test coverage; no JVM-level protocol testing; limited soak tooling

### B. k6 + JMeter only
- **Pros:** Industry standard combination; JMeter handles GUI test recording and complex CSV-driven scenarios
- **Cons:** Misses Gatling's Scala DSL (preferred by some backend devs) and Locust's Python flexibility for data scientists / QA automators

### C. Four-tool strategy (chosen)
- **Pros:** Different tools exercise the API from different network layers and runtime models (V8 JS / JVM / JVM Scala / CPython); catches tool-specific blind spots; gives team flexibility; each tool covers what it's best at; InfluxDB unifies all outputs for one-screen comparison
- **Cons:** More maintenance surface (4 tool configs vs 1); higher CI time budget; steeper onboarding curve

## Tradeoffs

The primary cost is maintenance — 4 test suites need to be kept in sync when endpoints change.
This is mitigated by:
1. Shared `baselines/perf-baseline.json` as the single regression gate
2. Shared `scripts/seed-perf-data.sql` and `reset-perf-db.sh` for consistent test data
3. Single `reports/generate-perf-report.py` aggregating all 4 tool outputs
4. The `tests/performance/README.md` documents all run commands in one place

The secondary cost is CI time. The workflow pipeline runs tools in parallel where possible:
k6 smoke (~2min) on every PR; k6 load + JMeter + Locust (~20min total) on main merge;
stress/spike/soak on weekly schedules.

## Consequences

- `tests/performance/k6/` — 9 scripts + shared config
- `tests/performance/jmeter/` — JMX plans + CSV data generator
- `tests/performance/gatling/` — Scala simulations + Maven/sbt build
- `tests/performance/locust/` — Python locustfiles + conf
- `tests/performance/scripts/` — shared data management and regression check
- `infra/docker/docker-compose.perf.yml` — InfluxDB 2.7 + Grafana-perf
- `.github/workflows/` — k6-load.yml, jmeter-ci.yml, locust-ci.yml, perf-report.yml
- `docs/TaskFlowPro_Implementation_Plan_v2.docx` §7 documents all 47 tasks

## References

- `tests/performance/README.md` — comprehensive run instructions
- `tests/performance/baselines/perf-baseline.json` — regression gate thresholds
- `docs/TEST_PLAN.md §3.5` — performance test strategy
- `.github/workflows/k6-load.yml`, `jmeter-ci.yml`, `locust-ci.yml`, `perf-report.yml`
- Implementation tasks: PT-K6-01 through PT-RP-05 (47 tasks total)
