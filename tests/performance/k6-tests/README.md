# Performance Tests — k6

> **Note:** The primary k6 scripts now live in `../k6/` (sibling directory).  
> This `k6-tests/` directory contains the original single `load-test.js` from Phase 6.  
> For Phase 7 scripts, see [`../k6/`](../k6/).

---

## Directory Contents

| File | Description |
|------|-------------|
| `load-test.js` | Original Phase 6 load test (superseded by `../k6/load_test.js`) |

---

## Phase 7 k6 Scripts (use these)

All production-ready k6 scripts are in `tests/performance/k6/`:

```
tests/performance/k6/
├── config/thresholds.js      # Shared SLA constants (P95 < 300ms, error < 1%)
├── smoke.js                  # 5 VU · 30s · runs on every PR
├── load_test.js              # 0→500 VU · 15min · mixed workload · runs on every main merge
├── stress_test.js            # 0→1500 VU · find the system ceiling (weekly)
├── spike_test.js             # 0→1000 VU in 10s · recovery SLA ≤ 30s (weekly)
├── auth_flow.js              # JWT lifecycle: register→login→refresh→logout
├── board_scenario.js         # Full board user journey with task state transitions
├── notification_spike.js     # Fan-out spike: 500 users polling notifications simultaneously
└── rps_test.js               # Constant arrival-rate · target 300 rps
```

## Quick Start

```bash
cd tests/performance/k6

# Smoke (quick sanity check)
k6 run smoke.js --env BASE_URL=http://localhost:8080

# Load (full test)
k6 run load_test.js --env BASE_URL=http://localhost:8080 \
                    --summary-export=results/k6-summary.json

# With InfluxDB output (requires docker-compose.perf.yml running)
K6_OUT=influxdb=http://localhost:8086/k6 k6 run load_test.js
```

## CI Integration

k6 runs automatically via `.github/workflows/k6-load.yml`:
- **smoke** — every PR (passes/fails the PR gate)
- **load** — every merge to main
- **stress + spike** — weekly scheduled + manual dispatch
