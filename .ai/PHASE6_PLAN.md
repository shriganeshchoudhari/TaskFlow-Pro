# Phase 6 — Implementation Plan
## DevOps, Testing & Monitoring · Week 11–12

> **Read this before starting any task.** All work builds on Phases 1–5 which are functionally
> complete. This document is the single source of truth for what to build, in what order, and
> exactly how each piece works.

---

## Executive Summary

Phases 1–5 delivered a fully functional backend + frontend. Phase 6 makes it production-ready:
comprehensive test coverage, a working Docker local stack, GitHub Actions CI/CD pipeline,
production-grade Kubernetes manifests, and an observable Prometheus + Grafana monitoring stack.

**4 critical bugs must be fixed before any Phase 6 work begins** — they will cause test failures
and Docker build failures that block everything else.

---

## Pre-work: Critical Bug Fixes (Day 1, ~2 hours)

Fix these before writing a single test. Each fix is small and isolated.

### BUG-01 — `AuthServiceTest`: wrong exception type asserted

**File:** `backend/src/test/java/com/taskflow/AuthServiceTest.java`

The test `register_DuplicateEmail_ThrowsException` calls `authService.register()` when the email
already exists. `AuthService.register()` throws `ConflictException`, but the test asserts
`UnauthorizedException`. This causes the test to fail immediately.

**Fix:**
```java
// Change line:
.isInstanceOf(UnauthorizedException.class)
// To:
.isInstanceOf(ConflictException.class)
// Also add the import:
import com.taskflow.exception.ConflictException;
```

---

### BUG-02 — `docker-compose.dev.yml`: wrong build context

**File:** `infra/docker/docker-compose.dev.yml`

The compose file is at `infra/docker/`. The `context: ..` resolves to `infra/`. Both Dockerfiles
do `COPY backend/pom.xml` and `COPY frontend/` — these paths only exist at the repo root.

**Fix — change both backend and frontend build blocks:**
```yaml
# Before (wrong — resolves to infra/):
build:
  context: ..
  dockerfile: docker/Dockerfile.backend

# After (correct — resolves to repo root):
build:
  context: ../..
  dockerfile: infra/docker/dockerfiles/Dockerfile.backend
```

Also verify that `infra/docker/nginx.conf` exists. The frontend Dockerfile does:
```dockerfile
COPY docker/nginx.conf /etc/nginx/conf.d/taskflow.conf
```
With the corrected repo-root context, this path must be `infra/docker/nginx.conf`. Create it if
it does not exist with the nginx SPA fallback config shown in Task D6-03.

---

### BUG-03 — `UserController`: architecture violation

**File:** `backend/src/main/java/com/taskflow/controller/UserController.java`

The controller injects `UserRepository` and `PasswordEncoder` directly. Controllers must not
call repositories. `UserService` already implements the correct logic in `updateProfile()` and
`updatePassword()`.

**Fix:** Replace the controller's inner DTOs and direct repo logic with `UserService` calls:
```java
// Replace injected fields:
private final UserService userService;

// Replace PUT /me body:
return ResponseEntity.ok(userService.updateProfile(
    new UpdateProfileRequest() {{ setFullName(req.getFullName()); setAvatarUrl(req.getAvatarUrl()); }},
    currentUser));

// Replace PUT /me/password body:
userService.updatePassword(
    new UpdatePasswordRequest() {{ setCurrentPassword(req.getCurrentPassword()); setNewPassword(req.getNewPassword()); }},
    currentUser);
return ResponseEntity.noContent().build();
```
Or better: remove the inline inner DTOs, use the existing `UpdateProfileRequest` and
`UpdatePasswordRequest` from `dto/request/Requests.java`.

---

### BUG-04 — `AuthService.logout()`: token not revoked

**File:** `backend/src/main/java/com/taskflow/service/AuthService.java`

`logout()` only logs a message. The `RefreshTokenRepository.revokeByToken()` method exists and
is fully implemented but never called.

**Fix:**
```java
// Inject the repository:
private final RefreshTokenRepository refreshTokenRepository;

// Replace logout() body:
@Transactional
public void logout(String refreshToken) {
    if (refreshToken != null && !refreshToken.isBlank()) {
        refreshTokenRepository.revokeByToken(refreshToken);
    }
    log.info("User logged out, refresh token revoked");
}
```

---

## Section 1: Testing (T6-01 through T6-08)

> Goal: ≥ 80% line coverage on backend services; all happy + sad paths covered; frontend
> components render correctly under test.

---

### T6-01 — Auth Integration Tests (Testcontainers)

**File:** `backend/src/test/integration/AuthControllerIT.java`

Use `@SpringBootTest(webEnvironment = RANDOM_PORT)` + Testcontainers PostgreSQL so Flyway runs
real migrations. Use `TestRestTemplate` or `MockMvc` (via `@AutoConfigureMockMvc`).

**Test scenarios to cover:**

| Test | Input | Expected |
|------|-------|----------|
| `register_ValidUser_Returns201` | Valid RegisterRequest | 201 + UserResponse (no password field) |
| `register_DuplicateEmail_Returns409` | Existing email | 409 + `CONFLICT` error code |
| `register_InvalidPassword_Returns400` | Password without uppercase | 400 + validation details |
| `login_ValidCredentials_Returns200WithTokens` | Correct email+password | 200 + accessToken + refreshToken |
| `login_WrongPassword_Returns401` | Wrong password | 401 + `UNAUTHORIZED` |
| `login_InactiveUser_Returns401` | Deactivated account | 401 |
| `refresh_ValidToken_Returns200NewTokens` | Valid refreshToken | 200 + new access + refresh |
| `refresh_InvalidToken_Returns401` | Expired/bad token | 401 |
| `logout_ValidToken_RevokesToken` | Valid refreshToken | 204 + token marked revoked in DB |

**Boilerplate to include:**
```java
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@Testcontainers
@ActiveProfiles("integration-test")
class AuthControllerIT {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine")
        .withDatabaseName("taskflow_test")
        .withUsername("taskflow")
        .withPassword("taskflow_test");

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
        registry.add("spring.flyway.enabled", () -> "true");
        registry.add("spring.jpa.hibernate.ddl-auto", () -> "validate");
    }
    // ...
}
```

Also add a `src/test/resources/application-integration-test.yml` that sets:
```yaml
spring:
  flyway:
    enabled: true
  jpa:
    hibernate:
      ddl-auto: validate
jwt:
  secret: dGVzdC1zZWNyZXQta2V5LW11c3QtYmUtYXQtbGVhc3QtNTEyLWJpdHMtbG9uZy1mb3ItaHM1MTI=
  access-token-expiry-ms: 900000
  refresh-token-expiry-ms: 604800000
```

---

### T6-02 — `TaskService` Unit Tests

**File:** `backend/src/test/java/com/taskflow/TaskServiceTest.java`

Mock all dependencies. Test status transition logic exhaustively — this is the most complex
business rule in the application.

**Test scenarios:**

| Test | Scenario |
|------|----------|
| `createTask_ValidRequest_ReturnsTaskResponse` | Happy path; assert activityService called |
| `createTask_AssigneeNotInProject_ThrowsForbidden` | Assignee not a project member |
| `createTask_WithAssignee_SendsNotification` | notificationService.notifyTaskAssigned called |
| `updateTask_ByAssignee_Succeeds` | Task assignee can update |
| `updateTask_ByStranger_ThrowsForbidden` | Non-member cannot update |
| `updateTaskStatus_TodoToInProgress_Succeeds` | Valid transition |
| `updateTaskStatus_TodoToDone_ThrowsInvalid` | Invalid transition → `InvalidStatusTransitionException` |
| `updateTaskStatus_InProgressToReview_Succeeds` | Valid transition |
| `updateTaskStatus_ReviewToDone_Succeeds` | Valid transition |
| `updateTaskStatus_DoneToInProgress_ThrowsInvalid` | Invalid reverse transition |
| `deleteTask_ByProjectManager_Succeeds` | MANAGER role can delete |
| `deleteTask_ByMember_ThrowsForbidden` | MEMBER role cannot delete |

---

### T6-03 — `CommentService`, `NotificationService`, `ActivityService` Unit Tests

**Files:**
- `backend/src/test/java/com/taskflow/CommentServiceTest.java`
- `backend/src/test/java/com/taskflow/NotificationServiceTest.java`
- `backend/src/test/java/com/taskflow/ActivityServiceTest.java`

**CommentService scenarios:**

| Test | Scenario |
|------|----------|
| `addComment_ValidRequest_CreatesComment` | Happy path; assert notification sent |
| `addComment_UserNotInProject_ThrowsForbidden` | Non-member blocked |
| `editComment_ByAuthor_Succeeds` | Author can edit own comment |
| `editComment_ByOtherUser_ThrowsForbidden` | Non-author cannot edit |
| `deleteComment_ByAuthor_Succeeds` | Author can delete own |
| `deleteComment_ByManager_Succeeds` | MANAGER can delete any |
| `deleteComment_ByStranger_ThrowsForbidden` | Non-author non-manager blocked |

**NotificationService scenarios:**

| Test | Scenario |
|------|----------|
| `notifyTaskAssigned_CreatesNotificationForAssignee` | Correct type + message |
| `notifyCommentAdded_NotifiesAssigneeAndReporter` | Both notified when different users |
| `notifyCommentAdded_DoesNotNotifyCommenter` | Commenter not notified about own comment |
| `markAsRead_OwnNotification_Succeeds` | Sets isRead = true |
| `markAsRead_OtherUsersNotification_ThrowsForbidden` | Cannot mark others' notifications |
| `markAllAsRead_UpdatesAllUnread` | Verify repo method called with userId |
| `sendDueDateReminders_CreatesDueDateNotifications` | Scheduled job creates notifications |

---

### T6-04 — Controller Integration Tests (MockMvc)

**Files:**
- `backend/src/test/integration/ProjectControllerIT.java`
- `backend/src/test/integration/TaskControllerIT.java`
- `backend/src/test/integration/CommentControllerIT.java`

Use `@SpringBootTest` + Testcontainers + `@AutoConfigureMockMvc`. Authenticate by injecting a
real JWT via a helper method that calls `/auth/register` + `/auth/login` first.

**ProjectController scenarios:**

| Test | Expected |
|------|----------|
| `createProject_Authenticated_Returns201` | 201 + ProjectResponse |
| `createProject_Unauthenticated_Returns401` | 401 |
| `getProject_NonMember_Returns403` | 403 for PRIVATE project |
| `addMember_ByManager_Returns201` | 201 + MemberResponse |
| `addMember_ByMember_Returns403` | 403 — member cannot invite |
| `archiveProject_ByManager_Returns204` | 204 + status = ARCHIVED |

**TaskController scenarios:**

| Test | Expected |
|------|----------|
| `createTask_InProject_Returns201` | 201 + TaskResponse |
| `updateTaskStatus_ValidTransition_Returns200` | 200 + new status |
| `updateTaskStatus_InvalidTransition_Returns422` | 422 + `INVALID_STATUS_TRANSITION` |
| `deleteTask_ByMember_Returns403` | 403 |
| `getMyTasks_Returns200PagedResult` | 200 + page of tasks assigned to caller |

---

### T6-05 — Playwright E2E (Full Journey)

**File:** `tests/e2e/playwright/tests/taskflow.spec.ts` (already exists — verify + extend)

The existing spec covers Auth, Projects, Tasks, and Notifications. Verify all tests pass
against the running local stack. Add one full end-to-end journey test:

```typescript
test('TC-E2E-FULL-001: Complete user journey', async ({ page }) => {
  // 1. Register new account
  // 2. Login
  // 3. Create project
  // 4. Create task in project
  // 5. Update task status to IN_PROGRESS
  // 6. Add a comment
  // 7. Check notification bell shows unread
  // 8. Click notification → navigate to task
  // 9. Logout → redirect to /login
});
```

Ensure `playwright.config.ts` points to `http://localhost:80` (container) or
`http://localhost:5173` (Vite dev server) and has a `globalSetup` that waits for the backend
health endpoint before running tests.

---

### T6-06 — k6 Load Test

**File:** `tests/performance/k6-tests/load-test.js` (create from scratch)

Test the two most critical read/write paths under load.

```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const errorRate = new Rate('errors');
const projectLatency = new Trend('project_list_latency');
const taskCreateLatency = new Trend('task_create_latency');

export const options = {
  stages: [
    { duration: '2m', target: 100 },   // Ramp up
    { duration: '5m', target: 500 },   // Sustain 500 VUs
    { duration: '3m', target: 0 },     // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<300'],  // P95 < 300ms — hard gate
    errors: ['rate<0.01'],             // Error rate < 1%
    http_req_failed: ['rate<0.01'],
  },
};

const BASE = __ENV.BASE_URL || 'http://localhost:8080';

// Login once per VU and reuse token
export function setup() {
  const res = http.post(`${BASE}/api/v1/auth/login`, JSON.stringify({
    email: 'loadtest@taskflow.com',
    password: 'LoadTest123!',
  }), { headers: { 'Content-Type': 'application/json' } });
  return { token: res.json('accessToken') };
}

export default function (data) {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${data.token}`,
  };

  // GET /projects — read-heavy path
  const projectRes = http.get(`${BASE}/api/v1/projects`, { headers });
  projectLatency.add(projectRes.timings.duration);
  errorRate.add(!check(projectRes, { 'projects status 200': r => r.status === 200 }));

  sleep(1);

  // POST /tasks — write path (requires a known project ID in setup)
  const taskRes = http.post(`${BASE}/api/v1/projects/${__ENV.PROJECT_ID}/tasks`,
    JSON.stringify({ title: `Load Test Task ${Date.now()}`, priority: 'MEDIUM' }),
    { headers });
  taskCreateLatency.add(taskRes.timings.duration);
  errorRate.add(!check(taskRes, { 'task create status 201': r => r.status === 201 }));

  sleep(1);
}
```

Run command: `k6 run load-test.js --env BASE_URL=http://localhost:8080 --env PROJECT_ID=<uuid>`

---

### T6-07 — JaCoCo Coverage Gate

The gate is already configured in `pom.xml` (minimum 0.80 line coverage ratio). No code change
needed. The gate will only pass once tests in T6-01 through T6-04 are written.

Verify the gate works:
```bash
cd backend && ./mvnw verify jacoco:report
# Should FAIL until T6-01–T6-04 are written
# After writing tests: open target/site/jacoco/index.html to inspect per-class coverage
```

Classes most likely to be below threshold without new tests:
- `AuthService` — BUG-01 means the duplicate email test currently fails
- `TaskService` — complex class, no current unit tests
- `NotificationService` — scheduled method not testable without mocks
- `UserController` — after BUG-03 fix, needs at least smoke coverage from ITs

---

### T6-08 — Frontend Vitest + React Testing Library

**Files to create:**
- `frontend/src/__tests__/LoginPage.test.jsx`
- `frontend/src/__tests__/TaskCard.test.jsx`
- `frontend/src/__tests__/BoardView.test.jsx`
- `frontend/src/__tests__/NotificationBell.test.jsx`

Ensure `vitest` and `@testing-library/react` are in `devDependencies`. Add to `package.json`
if missing:
```json
"vitest": "^1.0.0",
"@testing-library/react": "^14.0.0",
"@testing-library/jest-dom": "^6.0.0",
"@testing-library/user-event": "^14.0.0",
"jsdom": "^24.0.0"
```

**LoginPage tests:**
- Renders email + password fields
- Shows error alert on submit with empty fields
- Calls `authService.login` on valid submit
- Redirects to `/dashboard` on success

**TaskCard tests:**
- Renders title, priority badge, due date
- Shows overdue styling when `dueDate < today`
- Renders tag chips (max 3 + overflow badge)
- Click calls `navigate` to task detail

**BoardView tests:**
- Renders all 4 columns (TODO/IN_PROGRESS/REVIEW/DONE)
- Groups tasks by status correctly
- Shows task count per column header

**NotificationBell tests:**
- Renders badge with `unreadCount` from Redux store
- Opens dropdown on click
- Calls `markAllAsRead` when Mark All Read button clicked

---

## Section 2: Docker & Local Dev (D6-03, D6-05)

### D6-03 — Fix docker-compose.dev.yml + nginx.conf

**1. Fix build context (BUG-02 above).**

**2. Create `infra/docker/nginx.conf`** if it does not exist:
```nginx
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    # Gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript;

    # SPA fallback — all routes serve index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API proxy (for container deployments without CORS)
    location /api/ {
        proxy_pass http://taskflow-backend:8080/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Cache static assets aggressively
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

**3. Verify full stack starts:**
```bash
# From repo root:
docker compose -f infra/docker/docker-compose.dev.yml up --build
curl http://localhost:8080/actuator/health  # → {"status":"UP"}
curl http://localhost:80                    # → React HTML
```

---

### D6-05 — Complete `scripts/setup.sh`

Replace the stub with a real bootstrap script:

```bash
#!/usr/bin/env bash
set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
info()  { echo -e "${GREEN}[INFO]${NC}  $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC}  $*"; }
error() { echo -e "${RED}[ERROR]${NC} $*"; exit 1; }

# 1. Verify prerequisites
command -v docker  &>/dev/null || error "Docker not found. Install Docker Desktop."
command -v java    &>/dev/null || warn  "Java not found (needed for backend dev, not for Docker)."
command -v node    &>/dev/null || warn  "Node not found (needed for frontend dev, not for Docker)."

# 2. Check Docker daemon
docker info &>/dev/null || error "Docker daemon is not running. Start Docker Desktop."

# 3. Create .env if missing
if [[ ! -f .env ]]; then
  info "Creating .env from .env.example ..."
  cp .env.example .env 2>/dev/null || cat > .env <<'EOF'
JWT_SECRET=changeme-replace-with-64-char-base64-string-in-production
DB_PASSWORD=taskflow_dev_password
CORS_ALLOWED_ORIGINS=http://localhost:5173
EOF
fi

# 4. Pull images + build
info "Building and starting full local stack ..."
docker compose -f infra/docker/docker-compose.dev.yml pull --ignore-buildable
docker compose -f infra/docker/docker-compose.dev.yml up --build -d

# 5. Wait for backend health
info "Waiting for backend to become healthy ..."
for i in $(seq 1 30); do
  if curl -sf http://localhost:8080/actuator/health | grep -q '"UP"'; then
    info "Backend is UP."
    break
  fi
  sleep 5
  [[ $i -eq 30 ]] && error "Backend did not become healthy after 150s."
done

# 6. Seed demo data (idempotent)
info "Seeding demo data ..."
curl -sf -X POST http://localhost:8080/api/v1/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"fullName":"Demo User","email":"demo@taskflow.com","password":"DemoPass123!"}' \
  >/dev/null 2>&1 || true  # ignore duplicate-email error

info ""
info "✅ TaskFlow Pro is running!"
info "   Frontend:   http://localhost:80"
info "   Backend:    http://localhost:8080"
info "   Swagger:    http://localhost:8080/swagger-ui.html"
info "   Prometheus: http://localhost:9090  (docker compose --profile monitoring up)"
info "   Grafana:    http://localhost:3000  (docker compose --profile monitoring up)"
info ""
info "Demo credentials: demo@taskflow.com / DemoPass123!"
```

---

## Section 3: CI/CD (CI6-01, CI6-03, CI6-04)

### CI6-01 — Complete `backend-ci.yml`

Replace current minimal workflow with:

```yaml
name: Backend CI

on:
  push:
    branches: [main, develop]
    paths:
      - "backend/**"
      - ".github/workflows/backend-ci.yml"
  pull_request:
    paths:
      - "backend/**"
      - ".github/workflows/backend-ci.yml"

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_DB: taskflow_test
          POSTGRES_USER: taskflow
          POSTGRES_PASSWORD: taskflow_test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Java 21
        uses: actions/setup-java@v4
        with:
          distribution: temurin
          java-version: "21"
          cache: maven

      - name: Run unit tests
        run: mvn -f backend/pom.xml -B test
        env:
          JWT_SECRET: dGVzdC1zZWNyZXQta2V5LW11c3QtYmUtYXQtbGVhc3QtNTEyLWJpdHMtbG9uZw==

      - name: Run integration tests
        run: mvn -f backend/pom.xml -B verify -Pintegration-test
        env:
          SPRING_DATASOURCE_URL: jdbc:postgresql://localhost:5432/taskflow_test
          SPRING_DATASOURCE_USERNAME: taskflow
          SPRING_DATASOURCE_PASSWORD: taskflow_test
          JWT_SECRET: dGVzdC1zZWNyZXQta2V5LW11c3QtYmUtYXQtbGVhc3QtNTEyLWJpdHMtbG9uZw==

      - name: Generate JaCoCo coverage report
        run: mvn -f backend/pom.xml jacoco:report

      - name: Check coverage threshold (≥ 80%)
        run: mvn -f backend/pom.xml jacoco:check

      - name: Upload coverage report
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: jacoco-report
          path: backend/target/site/jacoco/

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v4
        with:
          files: backend/target/site/jacoco/jacoco.xml
          flags: backend
```

---

### CI6-03 — Complete `e2e-tests.yml`

Add a step that spins up the full docker-compose stack before running Playwright:

```yaml
name: E2E Tests

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  playwright:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Start full stack
        run: |
          docker compose -f infra/docker/docker-compose.dev.yml up --build -d
        env:
          JWT_SECRET: ${{ secrets.JWT_SECRET }}

      - name: Wait for backend health
        run: |
          for i in $(seq 1 30); do
            if curl -sf http://localhost:8080/actuator/health | grep -q '"UP"'; then
              echo "Backend healthy"; exit 0
            fi
            sleep 5
          done
          echo "Backend did not become healthy" && exit 1

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: "20"

      - name: Install Playwright
        working-directory: tests/e2e/playwright
        run: npm ci && npx playwright install --with-deps chromium

      - name: Run E2E tests
        working-directory: tests/e2e/playwright
        run: npx playwright test --reporter=html
        env:
          BASE_URL: http://localhost:80

      - name: Upload test report
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: tests/e2e/playwright/playwright-report/

      - name: Upload trace on failure
        uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-traces
          path: tests/e2e/playwright/test-results/

      - name: Teardown stack
        if: always()
        run: docker compose -f infra/docker/docker-compose.dev.yml down -v
```

---

### CI6-04 — Implement `deploy.yml`

```yaml
name: Deploy to EKS

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    needs: []  # Add 'test' job from backend-ci.yml once both are in the same workflow
    environment: production

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1

      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v2

      - name: Build and push backend image
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
          IMAGE_TAG: ${{ github.sha }}
        run: |
          docker build -f infra/docker/dockerfiles/Dockerfile.backend \
            -t $ECR_REGISTRY/taskflow-backend:$IMAGE_TAG \
            -t $ECR_REGISTRY/taskflow-backend:latest .
          docker push $ECR_REGISTRY/taskflow-backend:$IMAGE_TAG
          docker push $ECR_REGISTRY/taskflow-backend:latest

      - name: Build and push frontend image
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
          IMAGE_TAG: ${{ github.sha }}
        run: |
          docker build -f infra/docker/dockerfiles/Dockerfile.frontend \
            --build-arg VITE_API_URL=https://api.taskflowpro.com/api/v1 \
            -t $ECR_REGISTRY/taskflow-frontend:$IMAGE_TAG \
            -t $ECR_REGISTRY/taskflow-frontend:latest .
          docker push $ECR_REGISTRY/taskflow-frontend:$IMAGE_TAG
          docker push $ECR_REGISTRY/taskflow-frontend:latest

      - name: Update kubeconfig for EKS
        run: |
          aws eks update-kubeconfig \
            --region us-east-1 \
            --name ${{ secrets.EKS_CLUSTER_NAME }}

      - name: Deploy backend (rolling update)
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
          IMAGE_TAG: ${{ github.sha }}
        run: |
          kubectl set image deployment/taskflow-backend \
            backend=$ECR_REGISTRY/taskflow-backend:$IMAGE_TAG \
            -n taskflow-pro
          kubectl rollout status deployment/taskflow-backend -n taskflow-pro --timeout=5m

      - name: Deploy frontend (rolling update)
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
          IMAGE_TAG: ${{ github.sha }}
        run: |
          kubectl set image deployment/taskflow-frontend \
            frontend=$ECR_REGISTRY/taskflow-frontend:$IMAGE_TAG \
            -n taskflow-pro
          kubectl rollout status deployment/taskflow-frontend -n taskflow-pro --timeout=3m

      - name: Smoke test production
        run: |
          PROD_URL=https://api.taskflowpro.com
          curl -sf $PROD_URL/actuator/health | grep -q '"UP"' \
            || (echo "Production health check FAILED" && exit 1)
          echo "✅ Production deployment successful"
```

**Required GitHub Secrets:**
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `EKS_CLUSTER_NAME`
- `JWT_SECRET`

---

## Section 4: Kubernetes & Monitoring (K6-01 through K6-06)

### K6-01 — `backend-deployment.yaml`

Replace the minimal stub with production-grade spec:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: taskflow-backend
  namespace: taskflow-pro
  labels:
    app: taskflow-backend
    version: "1.0.0"
spec:
  replicas: 2
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: taskflow-backend
  template:
    metadata:
      labels:
        app: taskflow-backend
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "8080"
        prometheus.io/path: "/actuator/prometheus"
    spec:
      containers:
        - name: backend
          image: <ECR_REGISTRY>/taskflow-backend:latest
          ports:
            - containerPort: 8080
          env:
            - name: DB_HOST
              valueFrom:
                secretKeyRef:
                  name: taskflow-db-secret
                  key: host
            - name: DB_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: taskflow-db-secret
                  key: password
            - name: JWT_SECRET
              valueFrom:
                secretKeyRef:
                  name: taskflow-jwt-secret
                  key: secret
          resources:
            requests:
              cpu: "250m"
              memory: "512Mi"
            limits:
              cpu: "1000m"
              memory: "1024Mi"
          livenessProbe:
            httpGet:
              path: /actuator/health/liveness
              port: 8080
            initialDelaySeconds: 60
            periodSeconds: 30
            failureThreshold: 3
          readinessProbe:
            httpGet:
              path: /actuator/health/readiness
              port: 8080
            initialDelaySeconds: 30
            periodSeconds: 10
            failureThreshold: 3
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: taskflow-backend-hpa
  namespace: taskflow-pro
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: taskflow-backend
  minReplicas: 2
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
```

Also add liveness/readiness endpoint split to `application.yml`:
```yaml
management:
  endpoint:
    health:
      group:
        liveness:
          include: livenessState
        readiness:
          include: readinessState, db, diskSpace
  health:
    livenessstate:
      enabled: true
    readinessstate:
      enabled: true
```

---

### K6-02 — `ingress.yaml` with TLS

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: taskflow-ingress
  namespace: taskflow-pro
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/force-ssl-redirect: "true"
    nginx.ingress.kubernetes.io/proxy-body-size: "10m"
spec:
  tls:
    - hosts:
        - taskflowpro.com
        - api.taskflowpro.com
      secretName: taskflow-tls
  rules:
    - host: taskflowpro.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: taskflow-frontend
                port:
                  number: 80
    - host: api.taskflowpro.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: taskflow-backend
                port:
                  number: 8080
```

---

### K6-04 — Grafana Dashboards + Provisioning

**1. Create `monitoring/grafana/provisioning/datasources/prometheus.yml`:**
```yaml
apiVersion: 1
datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
    editable: false
```

**2. Create `monitoring/grafana/provisioning/dashboards/dashboard.yml`:**
```yaml
apiVersion: 1
providers:
  - name: TaskFlow Dashboards
    orgId: 1
    folder: TaskFlow Pro
    type: file
    disableDeletion: false
    updateIntervalSeconds: 30
    options:
      path: /var/lib/grafana/dashboards
```

**3. Create `monitoring/grafana/dashboards/taskflow-api.json`:**
A Grafana dashboard JSON with panels for:
- **API Latency** — `histogram_quantile(0.95, rate(http_server_requests_seconds_bucket[5m]))` by endpoint
- **Request Rate** — `rate(http_server_requests_seconds_count[1m])`
- **Error Rate** — `rate(http_server_requests_seconds_count{status=~"5.."}[1m])`
- **JVM Heap** — `jvm_memory_used_bytes{area="heap"}`
- **GC Pause** — `rate(jvm_gc_pause_seconds_sum[1m])`
- **HikariCP Active** — `hikaricp_connections_active`
- **DB Response Time** — `histogram_quantile(0.95, rate(spring_data_repository_invocations_seconds_bucket[5m]))`

Generate the JSON by building the dashboard in the Grafana UI against a local stack, then
exporting with "Export for sharing externally" to get a portable JSON file.

---

### K6-05 — MDC TraceId Filter

Create `backend/src/main/java/com/taskflow/config/MdcTraceIdFilter.java`:

```java
package com.taskflow.config;

import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.UUID;

@Component
@Slf4j
public class MdcTraceIdFilter implements Filter {

    private static final String TRACE_ID_HEADER = "X-Trace-Id";
    private static final String TRACE_ID_MDC_KEY = "traceId";

    @Override
    public void doFilter(ServletRequest request, ServletResponse response,
                         FilterChain chain) throws IOException, ServletException {
        HttpServletRequest httpReq = (HttpServletRequest) request;
        String traceId = httpReq.getHeader(TRACE_ID_HEADER);
        if (traceId == null || traceId.isBlank()) {
            traceId = UUID.randomUUID().toString().replace("-", "").substring(0, 16);
        }
        MDC.put(TRACE_ID_MDC_KEY, traceId);
        try {
            chain.doFilter(request, response);
        } finally {
            MDC.remove(TRACE_ID_MDC_KEY);
        }
    }
}
```

The `application.yml` logging pattern already includes `%X{traceId}` — this filter populates it.

---

### K6-06 — Terraform Verification

Review `terraform/environments/prod/main.tf`. Verify:
- EKS cluster with correct node instance type (t3.medium minimum)
- RDS PostgreSQL 16 with `multi_az = true`
- VPC with public + private subnets (backend + DB in private)
- Security groups: backend allows 8080 from within VPC only; DB allows 5432 from backend SG only
- IAM role for EKS node group with minimal permissions

Run:
```bash
cd terraform/environments/prod
terraform init
terraform plan   # Review output before any apply
```

---

## Section 5: Phase 5 Backfill (GAP-01, GAP-02)

### GAP-01 — Rate Limiting (B5-04)

Add Bucket4j dependency to `pom.xml`:
```xml
<dependency>
  <groupId>com.bucket4j</groupId>
  <artifactId>bucket4j-core</artifactId>
  <version>8.7.0</version>
</dependency>
```

Create `backend/src/main/java/com/taskflow/config/RateLimitFilter.java`:
```java
// Two buckets:
// /auth/login    — 10 requests per 15 minutes per IP
// /auth/register — 5 requests per 1 hour per IP
```
Register it in `SecurityConfig` before `JwtAuthFilter`. Return 429 with
`{ "status": 429, "error": "TOO_MANY_REQUESTS", "retryAfter": <seconds> }`.

---

### GAP-02 — `@Operation` Annotations

Add to every controller method. Example for `AuthController`:
```java
@Operation(summary = "Register new user",
           description = "Creates a new account. Returns 409 if email is already registered.")
@ApiResponses({
  @ApiResponse(responseCode = "201", description = "User created"),
  @ApiResponse(responseCode = "400", description = "Validation failed"),
  @ApiResponse(responseCode = "409", description = "Email already registered")
})
@PostMapping("/register")
public ResponseEntity<UserResponse> register(...) { ... }
```

---

## Execution Order

Work through tasks in this exact sequence to avoid blockers:

```
Day 1  BUG-01 → BUG-02 → BUG-03 → BUG-04
       Verify: mvn test passes, docker-compose up builds

Day 2  T6-02 (TaskService tests)
       T6-03 (CommentService, NotificationService, ActivityService tests)

Day 3  T6-01 (AuthControllerIT with Testcontainers)
       T6-04 (ProjectControllerIT, TaskControllerIT, CommentControllerIT)

Day 4  T6-07 (verify JaCoCo gate passes ≥ 80%)
       Fix any coverage gaps uncovered by jacoco report

Day 5  D6-03 (fix docker-compose + nginx.conf)
       D6-05 (complete setup.sh)
       K6-05 (MdcTraceIdFilter)

Day 6  CI6-01 (complete backend-ci.yml)
       CI6-03 (complete e2e-tests.yml)
       CI6-04 (implement deploy.yml)

Day 7  K6-01 (backend-deployment.yaml with HPA + probes)
       K6-02 (frontend-deployment.yaml + ingress.yaml with TLS)

Day 8  K6-04 (Grafana dashboards + provisioning)
       K6-06 (Terraform review)

Day 9  T6-05 (run Playwright E2E against local stack; fix any failures)
       T6-06 (create k6 load-test.js; run against local stack)

Day 10 T6-08 (Frontend Vitest + RTL tests)
       GAP-01 (rate limiting)
       GAP-02 (@Operation annotations)

Final  Run full Phase 6 DoD checklist (see CHECKLISTS.md)
```

---

## Phase 6 Definition of Done

All of the following must be true before Phase 6 is considered complete:

- [ ] `./mvnw verify jacoco:report` → 0 test failures, JaCoCo ≥ 80% line coverage
- [ ] `AuthControllerIT`, `ProjectControllerIT`, `TaskControllerIT`, `CommentControllerIT` all pass with real Postgres (Testcontainers)
- [ ] `npx playwright test` passes headlessly (all Auth + Project + Task + Notification flows)
- [ ] `k6 run load-test.js` → P95 ≤ 300ms, error rate < 1% at 500 VUs
- [ ] `docker compose -f infra/docker/docker-compose.dev.yml up --build` starts full stack with one command
- [ ] `scripts/setup.sh` bootstraps local environment end-to-end
- [ ] GitHub Actions `backend-ci.yml` passes on PR (unit + integration + coverage gate)
- [ ] GitHub Actions `frontend-ci.yml` passes on PR (lint + test + build)
- [ ] GitHub Actions `deploy.yml` successfully pushes to ECR + rolling-updates EKS on main merge
- [ ] No CRITICAL CVEs in Trivy scan of both Docker images
- [ ] Prometheus scraping `/actuator/prometheus`; Grafana dashboard shows live API latency
- [ ] `GET /actuator/health` → `{ "status": "UP" }` in production
