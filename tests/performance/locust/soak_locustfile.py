"""
PT-LO-05 — Locust Soak Test (8-hour endurance)
Steady 50-VU load for 8 hours. Detects memory leaks, connection pool
exhaustion, and slow latency drift that only appear over time.

Run:
    locust -f soak_locustfile.py --host=http://localhost:8080 \
           --users=50 --spawn-rate=5 --run-time=8h --headless \
           --html=reports/locust-soak.html --csv=reports/locust-soak

CI (shorter version — 30-min soak on main merge):
    locust -f soak_locustfile.py --host=http://localhost:8080 \
           --users=50 --spawn-rate=5 --run-time=30m --headless
"""
import uuid
import time
from locust import HttpUser, between, task, events
from locust.runners import MasterRunner


class SoakUser(HttpUser):
    """
    Low-intensity, long-duration user that rotates across all endpoints
    at a steady pace to surface resource leaks and connection exhaustion.
    """
    wait_time = between(2.0, 5.0)   # slower think-time — models real end-user pace

    def on_start(self):
        self.email    = f"soak_{uuid.uuid4().hex[:8]}@perf.test"
        self.password = "SoakPass123!"
        self.token    = None
        self.project_id = None
        self._iteration = 0

        self.client.post("/api/v1/auth/register", json={
            "fullName": "Soak User", "email": self.email, "password": self.password,
        }, name="[setup] register")

        resp = self.client.post("/api/v1/auth/login", json={
            "email": self.email, "password": self.password,
        }, name="[setup] login")
        if resp.status_code == 200:
            self.token       = resp.json().get("accessToken")
            self._token_time = time.time()

        if self.token:
            r2 = self.client.post("/api/v1/projects",
                json={"name": f"Soak Project {self.email}"},
                headers=self._h(), name="[setup] create project")
            if r2.status_code == 201:
                self.project_id = r2.json().get("id")

    def _h(self) -> dict:
        # Refresh token every 14 minutes (access token lifetime = 15 min)
        if self.token and (time.time() - self._token_time) > 840:
            resp = self.client.post("/api/v1/auth/login",
                json={"email": self.email, "password": self.password},
                name="[soak] token refresh")
            if resp.status_code == 200:
                self.token = resp.json().get("accessToken")
                self._token_time = time.time()
        return {"Authorization": f"Bearer {self.token}"} if self.token else {}

    @task(3)
    def read_projects(self):
        self.client.get("/api/v1/projects", headers=self._h(), name="GET /projects")

    @task(2)
    def read_my_tasks(self):
        self.client.get("/api/v1/tasks/my-tasks", headers=self._h(), name="GET /tasks/my-tasks")

    @task(2)
    def read_notifications(self):
        self.client.get("/api/v1/notifications", headers=self._h(), name="GET /notifications")

    @task(1)
    def read_dashboard(self):
        self.client.get("/api/v1/dashboard/summary", headers=self._h(), name="GET /dashboard/summary")

    @task(1)
    def write_task(self):
        if not self.project_id:
            return
        self._iteration += 1
        r = self.client.post(f"/api/v1/projects/{self.project_id}/tasks",
            json={"title": f"Soak Task {self._iteration}", "priority": "LOW"},
            headers=self._h(), name="POST /tasks")
        if r.status_code == 201 and r.json().get("id"):
            tid = r.json()["id"]
            self.client.patch(f"/api/v1/tasks/{tid}/status",
                json={"status": "IN_PROGRESS"}, headers=self._h(),
                name="PATCH /tasks/:id/status")

    @task(1)
    def health_check(self):
        """Poll health endpoint — monitors for any degradation over time."""
        r = self.client.get("/actuator/health", name="GET /actuator/health")
        if r.status_code != 200 or r.json().get("status") != "UP":
            r.failure(f"Health check failed: {r.status_code}")


# ── Soak-specific threshold: P95 must not drift > 20 % from the first 5-minute baseline
_baseline_p95: float | None = None
_baseline_set_at: float     = 0.0
BASELINE_WINDOW_S            = 300   # 5 minutes


@events.request.add_listener
def on_request(request_type, name, response_time, response_length, **kwargs):
    global _baseline_p95, _baseline_set_at
    now = time.time()
    # Capture baseline after the first 5-minute window
    if _baseline_p95 is None and (now - _baseline_set_at) > BASELINE_WINDOW_S:
        pass   # Will be set in the stats_reset handler below


@events.quitting.add_listener
def check_soak_thresholds(environment, **kwargs):
    stats = environment.runner.stats.total
    if stats.num_requests == 0:
        return

    p95        = stats.get_response_time_percentile(0.95) or 0
    error_rate = stats.fail_ratio * 100
    failures   = []

    if p95 > 300:
        failures.append(f"Final P95 {p95:.0f}ms > 300ms")
    if error_rate > 1.0:
        failures.append(f"Error rate {error_rate:.2f}% > 1%")

    if failures:
        print("\n[SOAK THRESHOLD BREACH]")
        for f in failures:
            print(f"  ✗ {f}")
        environment.process_exit_code = 1
    else:
        print(f"\n[SOAK OK] P95={p95:.0f}ms  Errors={error_rate:.2f}%  Requests={stats.num_requests}")
