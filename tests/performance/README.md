# Performance Testing

**Phase 7 — 4 tools · 4 test types · 47 tasks**

All performance tests enforce the same SLA thresholds:

| Metric | Target |
|--------|--------|
| P95 latency | < 300 ms |
| P99 latency | < 800 ms |
| Error rate | < 1 % |

---

## Quick Start

### 1. Seed test data

```bash
# Requires running PostgreSQL (start the dev stack first)
psql $DATABASE_URL -f scripts/seed-perf-data.sql

# Reset between test runs (truncates and re-seeds)
bash scripts/reset-perf-db.sh
```

### 2. Run k6 smoke (30 seconds, validates the API is up)

```bash
cd k6
k6 run smoke.js --env BASE_URL=http://localhost:8080
```

### 3. Run the full load test

```bash
cd k6
k6 run load_test.js --env BASE_URL=http://localhost:8080 \
                    --summary-export=results/k6-summary.json
```

### 4. Run the regression check

```bash
python3 scripts/regression_check.py results/k6-summary.json
```

---

## Directory Structure

```
performance/
├── k6/                     Primary CI tool (JavaScript) — runs on every PR and main merge
│   ├── config/             Shared SLA thresholds
│   ├── smoke.js            5 VU · 30s · every PR gate
│   ├── load_test.js        0→500 VU · 15min · mixed workload
│   ├── stress_test.js      0→1500 VU · find ceiling
│   ├── spike_test.js       0→1000 VU in 10s · recovery SLA ≤30s
│   ├── auth_flow.js        JWT lifecycle scenario
│   ├── board_scenario.js   Full board user journey
│   ├── notification_spike.js  Fan-out notification spike
│   └── rps_test.js         Constant arrival-rate (300 rps)
│
├── jmeter/                 Realistic browser-like load + 24-hour soak
│   ├── TaskFlowPro.jmx     Load: 300 threads · full task lifecycle
│   ├── Soak_24h.jmx        Soak: 100 threads · 24 hours
│   ├── generate-report.sh  Generate HTML report from JTL
│   └── data/
│       └── generate-test-users.py   Seed 500 CSV users + register via API
│
├── gatling/                High-concurrency Scala DSL (sbt or Maven)
│   └── src/test/scala/taskflow/
│       ├── LoadSimulation.scala    300 VU · 3 weighted scenarios
│       └── StressSimulation.scala  Step-ramp to 1000 VU · recovery
│
├── locust/                 Python — exploratory stress · spike · 8-hour soak
│   ├── locustfile.py       Load/stress/spike with threshold hook
│   ├── soak_locustfile.py  8-hour endurance with auto token-refresh
│   └── locust.conf         Default config
│
├── scripts/
│   ├── seed-perf-data.sql        50 users · 5 projects · 200 tasks (idempotent)
│   ├── reset-perf-db.sh          Truncate + re-seed all @perf.test data
│   └── regression_check.py       Compare P95 vs baseline · fail CI if >20% drift
│
├── reports/
│   └── generate-perf-report.py   Unified HTML from k6+JMeter+Gatling+Locust outputs
│
└── baselines/
    └── perf-baseline.json        P95 per endpoint at 500 VUs (regression gate)
```

---

## Tool Reference

### k6 (JavaScript)

```bash
# Install: https://grafana.com/docs/k6/latest/set-up/install-k6/
brew install k6

# All scripts live in k6/
cd k6

k6 run smoke.js           --env BASE_URL=http://localhost:8080
k6 run load_test.js       --env BASE_URL=http://localhost:8080
k6 run stress_test.js     --env BASE_URL=http://localhost:8080
k6 run spike_test.js      --env BASE_URL=http://localhost:8080
k6 run auth_flow.js       --env BASE_URL=http://localhost:8080
k6 run board_scenario.js  --env BASE_URL=http://localhost:8080 --env PROJECT_ID=<uuid>
k6 run rps_test.js        --env BASE_URL=http://localhost:8080 --env TARGET_RPS=300

# With InfluxDB output (start docker-compose.perf.yml first)
K6_OUT=influxdb=http://localhost:8086/k6 k6 run load_test.js
```

### JMeter

```bash
# Install: https://jmeter.apache.org/download_jmeter.cgi (requires Java 21)

# Seed users first
python3 jmeter/data/generate-test-users.py \
    --count 300 --register --base-url http://localhost:8080

# Load test
jmeter -n \
    -t jmeter/TaskFlowPro.jmx \
    -l results/jmeter/load.jtl \
    -e -o results/jmeter/html \
    -JBASE_URL=http://localhost:8080 \
    -JTHREAD_COUNT=300 \
    -JRAMP_UP=120 \
    -JDURATION=600

# Generate HTML report from any JTL
bash jmeter/generate-report.sh results/jmeter/load.jtl --open

# 24-hour soak
jmeter -n -t jmeter/Soak_24h.jmx -l results/jmeter/soak.jtl -JDURATION=86400
```

### Gatling (Scala DSL)

```bash
# Maven
cd gatling
mvn gatling:test \
    -Dgatling.simulationClass=taskflow.LoadSimulation \
    -DBASE_URL=http://localhost:8080

mvn gatling:test \
    -Dgatling.simulationClass=taskflow.StressSimulation \
    -DBASE_URL=http://localhost:8080

# sbt (alternative)
sbt "gatling:testOnly taskflow.LoadSimulation"
```

### Locust (Python)

```bash
# Install
pip install locust==2.28.0

# Load/Stress/Spike
cd locust
locust -f locustfile.py \
    --host=http://localhost:8080 \
    --users=200 --spawn-rate=20 \
    --run-time=10m --headless \
    --html=reports/locust-load.html \
    --csv=reports/locust-load

# Spike
locust -f locustfile.py \
    --host=http://localhost:8080 \
    --users=1000 --spawn-rate=500 \
    --run-time=5m --headless

# 8-hour soak
locust -f soak_locustfile.py \
    --host=http://localhost:8080 \
    --users=50 --spawn-rate=5 \
    --run-time=8h --headless
```

---

## Unified Report

After running any combination of tools, generate a single HTML report:

```bash
python3 reports/generate-perf-report.py \
    --k6      results/k6-summary.json \
    --jmeter  results/jmeter/load.jtl \
    --gatling results/gatling-simulation.log \
    --locust  reports/locust-load_stats.csv \
    --output  reports/perf-report.html

open reports/perf-report.html
```

---

## CI/CD Integration

| Workflow | Tool | Trigger | Duration | Gate |
|----------|------|---------|----------|------|
| `k6-load.yml` — smoke | k6 | Every PR | ~2 min | Any threshold breach |
| `k6-load.yml` — load | k6 | main merge | ~15 min | P95 > 300ms or error > 1% |
| `k6-load.yml` — stress/spike | k6 | Weekly / dispatch | ~30 min | Info only |
| `jmeter-ci.yml` | JMeter | main merge | ~20 min | Avg > 400ms or error > 1% |
| `locust-ci.yml` — load | Locust | main merge | ~10 min | Threshold hook |
| `locust-ci.yml` — soak | Locust | Weekly Sun 02:00 | 8h | P95 drift |
| `perf-report.yml` | Python | After all tools | ~3 min | Regression > 20% vs baseline |
