/**
 * Shared SLA thresholds enforced across all k6 test types.
 * Import this in every k6 script to guarantee consistent gates.
 *
 * A threshold breach causes the k6 process to exit with code 99,
 * which fails the GitHub Actions step and blocks the merge.
 */

export const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';

/** Shared pass/fail thresholds for load tests */
export const LOAD_THRESHOLDS = {
  // Global latency gates
  http_req_duration:              ['p(95)<300', 'p(99)<800'],
  http_req_failed:                ['rate<0.01'],   // <1 % error rate

  // Per-endpoint custom metrics (set in each script via Trend)
  login_duration:                 ['p(95)<250'],
  get_projects_duration:          ['p(95)<200'],
  get_tasks_duration:             ['p(95)<300'],
  create_task_duration:           ['p(95)<400'],
  update_status_duration:         ['p(95)<350'],
  get_notifications_duration:     ['p(95)<200'],
  get_dashboard_duration:         ['p(95)<400'],
};

/** Tighter thresholds for smoke runs (must be fast per-PR) */
export const SMOKE_THRESHOLDS = {
  http_req_duration:  ['p(95)<500'],
  http_req_failed:    ['rate<0.01'],
};

/** Stress test thresholds — looser P95, same error gate */
export const STRESS_THRESHOLDS = {
  http_req_duration:  ['p(95)<1000', 'p(99)<2000'],
  http_req_failed:    ['rate<0.05'],  // allow up to 5% at breaking point
};

/** Spike test thresholds — focus on recovery, not absolute latency */
export const SPIKE_THRESHOLDS = {
  http_req_duration:  ['p(95)<2000'],
  http_req_failed:    ['rate<0.10'],   // allow brief spike errors
  spike_recovery_ms:  ['max<30000'],   // full recovery within 30 s
};
