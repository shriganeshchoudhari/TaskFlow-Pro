"""
PT-LO-01/02 — Locust Load & Stress Test
Weighted task set covering all major API groups.

Run (load):
    locust -f locustfile.py --host=http://localhost:8080 \
           --users=500 --spawn-rate=10 --run-time=10m --headless \
           --html=reports/locust-load.html --csv=reports/locust-load

Run (stress — push to breaking point):
    locust -f locustfile.py --host=http://localhost:8080 \
           --users=1500 --spawn-rate=50 --run-time=15m --headless \
           --html=reports/locust-stress.html

Run (spike — fast burst):
    locust -f locustfile.py --host=http://localhost:8080 \
           --users=1000 --spawn-rate=500 --run-time=5m --headless \
           --html=reports/locust-spike.html
"""
import random
import uuid
from locust import HttpUser, between, task, events
from tasks.auth_tasks    import AuthTaskSet
from tasks.project_tasks import ProjectTaskSet
from tasks.task_tasks    import TaskTaskSet
from tasks.notif_tasks   import NotifTaskSet


class TaskFlowUser(HttpUser):
    """
    Simulates a realistic authenticated TaskFlow Pro user.
    Weights mirror production traffic: reads dominate, writes are ~30%.
    """
    wait_time = between(0.5, 2.0)   # think-time between requests

    def on_start(self):
        """Register + login once per VU before tasks begin."""
        self.email    = f"locust_{uuid.uuid4().hex[:8]}@perf.test"
        self.password = "LocustPass123!"
        self.token    = None
        self.project_id = None

        # Register (ignore 409 — user may already exist from a prior run)
        self.client.post("/api/v1/auth/register", json={
            "fullName": "Locust User",
            "email":    self.email,
            "password": self.password,
        }, name="[setup] register")

        # Login
        resp = self.client.post("/api/v1/auth/login", json={
            "email":    self.email,
            "password": self.password,
        }, name="[setup] login")

        if resp.status_code == 200:
            self.token = resp.json().get("accessToken")

        # Create one project per VU
        if self.token:
            resp2 = self.client.post("/api/v1/projects",
                json={"name": f"Locust Project {self.email}", "description": "perf"},
                headers=self._auth_headers(),
                name="[setup] create project")
            if resp2.status_code == 201:
                self.project_id = resp2.json().get("id")

    def _auth_headers(self) -> dict:
        return {"Authorization": f"Bearer {self.token}"} if self.token else {}

    # ── Read tasks (weight=6: ~60 % of all requests) ─────────────────────────

    @task(3)
    def list_projects(self):
        self.client.get("/api/v1/projects",
            headers=self._auth_headers(), name="GET /projects")

    @task(2)
    def list_my_tasks(self):
        self.client.get("/api/v1/tasks/my-tasks",
            headers=self._auth_headers(), name="GET /tasks/my-tasks")

    @task(1)
    def get_dashboard(self):
        self.client.get("/api/v1/dashboard/summary",
            headers=self._auth_headers(), name="GET /dashboard/summary")

    @task(1)
    def get_notifications(self):
        self.client.get("/api/v1/notifications",
            headers=self._auth_headers(), name="GET /notifications")

    # ── Write tasks (weight=3: ~30 % of all requests) ─────────────────────────

    @task(2)
    def create_and_move_task(self):
        if not self.project_id:
            return
        resp = self.client.post(
            f"/api/v1/projects/{self.project_id}/tasks",
            json={"title": f"Locust Task {uuid.uuid4().hex[:6]}", "priority": "MEDIUM"},
            headers=self._auth_headers(),
            name="POST /tasks",
        )
        if resp.status_code == 201:
            task_id = resp.json().get("id")
            if task_id:
                self.client.patch(
                    f"/api/v1/tasks/{task_id}/status",
                    json={"status": "IN_PROGRESS"},
                    headers=self._auth_headers(),
                    name="PATCH /tasks/:id/status",
                )

    @task(1)
    def add_comment(self):
        if not self.project_id:
            return
        # Re-fetch a task to comment on
        resp = self.client.get(
            f"/api/v1/projects/{self.project_id}/tasks",
            headers=self._auth_headers(),
            name="GET /projects/:id/tasks",
        )
        if resp.status_code == 200:
            tasks = resp.json().get("content", [])
            if tasks:
                tid = random.choice(tasks)["id"]
                self.client.post(
                    f"/api/v1/tasks/{tid}/comments",
                    json={"content": "Locust performance comment"},
                    headers=self._auth_headers(),
                    name="POST /comments",
                )

    # ── Auth task (weight=1: ~10 % of all requests) ──────────────────────────

    @task(1)
    def mark_notifications_read(self):
        self.client.patch("/api/v1/notifications/read-all",
            headers=self._auth_headers(), name="PATCH /notifications/read-all")


# ── Event hooks for custom failure thresholds ─────────────────────────────────

@events.quitting.add_listener
def on_locust_quitting(environment, **kwargs):
    """Fail the run if P95 > 300ms or error rate > 1%."""
    stats = environment.runner.stats.total
    if stats.num_requests == 0:
        return

    error_rate = stats.fail_ratio * 100
    p95 = stats.get_response_time_percentile(0.95) or 0

    failures = []
    if p95 > 300:
        failures.append(f"P95 latency {p95:.0f}ms > 300ms threshold")
    if error_rate > 1.0:
        failures.append(f"Error rate {error_rate:.2f}% > 1% threshold")

    if failures:
        print("\n[THRESHOLD BREACH]")
        for f in failures:
            print(f"  ✗ {f}")
        environment.process_exit_code = 1
    else:
        print(f"\n[THRESHOLDS OK] P95={p95:.0f}ms  Errors={error_rate:.2f}%")
