# Contributing to TaskFlow Pro

> **Prerequisites:** Java 21, Node.js 20, Maven 3.9, Docker 24, Git

---

## Table of Contents

1. [Getting Started](#1-getting-started)
2. [Development Workflow](#2-development-workflow)
3. [Coding Standards](#3-coding-standards)
4. [Testing Requirements](#4-testing-requirements)
5. [Pull Request Process](#5-pull-request-process)
6. [Commit Message Format](#6-commit-message-format)
7. [Adding New Features](#7-adding-new-features)
8. [Debugging & Troubleshooting](#8-debugging--troubleshooting)

---

## 1. Getting Started

### Clone and bootstrap

```bash
git clone https://github.com/your-org/taskflow-pro.git
cd taskflow-pro

# Automated setup — starts full Docker stack and seeds demo data
bash scripts/setup.sh
```

### Manual setup (for backend/frontend development)

**Backend:**
```bash
cd backend
# Start only PostgreSQL
docker compose -f ../infra/docker/docker-compose.dev.yml up -d postgres
# Run Spring Boot
./mvnw spring-boot:run
# API: http://localhost:8080  |  Swagger: http://localhost:8080/swagger-ui.html
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
# App: http://localhost:5173
```

**Full stack (Docker):**
```bash
docker compose -f infra/docker/docker-compose.dev.yml up --build
```

**Demo accounts (seeded by V12 migration):**

| Email | Password | Role |
|-------|----------|------|
| `admin@taskflow.com` | `Admin@1234` | ADMIN |
| `manager1@taskflow.com` | `Test@1234` | MANAGER |
| `worker1@taskflow.com` | `Test@1234` | MEMBER |

---

## 2. Development Workflow

### Branch naming

```
feature/TASK-ID-short-description    # new features
fix/TASK-ID-short-description        # bug fixes
chore/what-you-are-doing             # tooling, deps, docs
refactor/what-you-are-changing       # code restructuring (no behavior change)
perf/what-you-are-optimizing         # performance improvements
```

Examples: `feature/B3-07-status-transitions`, `fix/BUG-01-duplicate-email-exception`

### Day-to-day cycle

```bash
git checkout -b feature/my-feature main
# ... make changes ...

# Backend: verify tests pass before pushing
cd backend && ./mvnw test

# Frontend: lint and test
cd frontend && npm run lint && npm test

git add -p   # stage changes interactively
git commit -m "feat(tasks): add status transition validation"
git push origin feature/my-feature
# → open PR on GitHub
```

---

## 3. Coding Standards

### Backend (Java / Spring Boot)

**Layering — strictly enforced:**

| Layer | Do | Don't |
|-------|-----|-------|
| `controller/` | Validate input with `@Valid`, map DTOs, call service | Call repositories directly, contain business logic |
| `service/` | Business logic, authorization, transactions | Use `HttpServletRequest`, return entity objects |
| `repository/` | Database queries (`@Query`) | Contain business logic |
| `model/` | JPA entity definitions, enums | Depend on service/controller |
| `dto/` | Request/response shapes, Bean Validation annotations | JPA annotations |

**Code style:**
- Use Lombok `@RequiredArgsConstructor` for constructor injection — never `@Autowired` on fields
- Use `@Slf4j` for logging — never `System.out.println`
- All public service methods must have `@Transactional` or `@Transactional(readOnly = true)`
- Exceptions: throw `ForbiddenException` (403), `ConflictException` (409), `ResourceNotFoundException` (404), `InvalidStatusTransitionException` (422) — never return `null`
- DTOs go in `dto/request/` and `dto/response/` — entities never leave the service layer
- Every new endpoint needs an `@Operation(summary = "...")` annotation for Swagger

**Example service method:**
```java
@Transactional
public TaskResponse updateTaskStatus(UUID taskId, String newStatus, UserDetails caller) {
    Task task = taskRepository.findById(taskId)
        .orElseThrow(() -> new ResourceNotFoundException("Task not found: " + taskId));
    User user = userRepository.findByEmail(caller.getUsername())
        .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    // authorization check
    if (!isMember(task.getProject().getId(), user.getId())) {
        throw new ForbiddenException("Not a project member");
    }
    // business logic
    validateTransition(task.getStatus(), newStatus);
    task.setStatus(Task.TaskStatus.valueOf(newStatus));
    Task saved = taskRepository.save(task);
    activityService.logActivity("STATUS_CHANGED", "TASK", task.getId(), user,
        task.getProject(), saved, task.getStatus().name(), newStatus);
    return TaskResponse.fromEntity(saved);
}
```

### Frontend (React / Redux)

**Component guidelines:**
- Functional components only — no class components
- Use `useSelector`/`useDispatch` for Redux state — avoid prop drilling
- Co-locate component tests next to the component file for small components; use `src/__tests__/` for page-level tests
- Add `data-testid` attributes to interactive elements and key containers (used by Playwright and Vitest)
- Use MUI components — don't introduce custom CSS unless MUI `sx` prop is insufficient

**Redux pattern:**
```javascript
// Always use async thunks for API calls
export const createTask = createAsyncThunk(
  'tasks/create',
  async ({ projectId, data }, { rejectWithValue }) => {
    try {
      return await taskService.createTask(projectId, data);
    } catch (e) {
      return rejectWithValue(e.response?.data?.message || 'Failed to create task');
    }
  }
);
```

**Service layer:**
- All API calls go through `services/api.js` (Axios instance with interceptors)
- Never call `fetch()` or create a new Axios instance in a component
- All services export plain async functions — no classes

---

## 4. Testing Requirements

### Backend

Every PR must maintain or improve test coverage. The JaCoCo gate enforces **≥ 80% line coverage** — the build fails if coverage drops below this threshold.

**Unit tests (Mockito + JUnit 5):**
```bash
cd backend && ./mvnw test
```
- Test file: `src/test/java/com/taskflow/MyServiceTest.java`
- Mock all dependencies with `@Mock` + `@InjectMocks`
- Cover happy path + every error branch (ForbiddenException, NotFoundException, invalid transition)
- Naming: `methodName_scenario_expectedResult()` e.g. `createTask_AssigneeNotInProject_ThrowsForbidden`

**Integration tests (Testcontainers):**
```bash
cd backend && ./mvnw verify -Pintegration-test
```
- Test file: `src/test/integration/com/taskflow/integration/MyControllerIT.java`
- Use `@SpringBootTest + @Testcontainers` with a real PostgreSQL container
- Use `@DynamicPropertySource` to inject the container JDBC URL
- `@ActiveProfiles("integration-test")` — see `application-integration-test.yml`

**Coverage report:**
```bash
./mvnw verify jacoco:report
open target/site/jacoco/index.html
```

### Frontend

```bash
cd frontend && npm test
```
- All tests in `src/__tests__/` and co-located `*.test.jsx` files run with Vitest
- Mock `useWebSocket` in any test that renders `BoardView`, `NotificationBell`, or any component that calls it — otherwise the STOMP client tries to open a real socket and the test times out:
  ```javascript
  vi.mock('../hooks/useWebSocket', () => ({
    default: () => ({ isConnected: false, subscribe: vi.fn() }),
  }));
  ```
- Use `data-testid` selectors in assertions, not text or class names (which can change)

### E2E (Playwright)

```bash
cd tests/e2e/playwright
npx playwright test           # All specs (requires running stack)
npx playwright test --ui      # Interactive mode
```
- `global-setup.ts` polls `/actuator/health` before any test runs — start the stack first
- New E2E tests go in `tests/e2e/playwright/tests/`
- Use `data-testid` selectors in page interactions

### Performance tests

Run smoke locally before pushing to verify no obvious regressions:
```bash
# Requires backend running on :8080
cd tests/performance/k6
k6 run smoke.js --env BASE_URL=http://localhost:8080
```

---

## 5. Pull Request Process

1. **Open a PR** against `main` with a descriptive title following commit format
2. **Fill in the PR template** — link the task ID, describe what changed, how to test
3. **CI must pass** — all 4 checks must be green:
   - `backend-ci` (unit + integration tests + JaCoCo ≥ 80%)
   - `frontend-ci` (lint + Vitest + build)
   - `k6-load / smoke` (≤ 300ms P95, error < 1%)
   - Any workflow relevant to changed files
4. **Request review** from at least one team member
5. **Squash and merge** — keep `main` history clean

**PR size guidance:**
- Prefer small, focused PRs (one feature or one bug fix)
- If a change spans backend + frontend, it's fine in one PR — but keep the scope focused
- Large refactors: open a draft PR early for feedback before completing

---

## 6. Commit Message Format

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <short description>

[optional body]

[optional footer: BREAKING CHANGE: ..., Closes #123]
```

**Types:** `feat` · `fix` · `chore` · `docs` · `refactor` · `test` · `perf` · `ci`

**Scopes:** `auth` · `tasks` · `projects` · `notifications` · `dashboard` · `frontend` · `perf` · `ci` · `k8s` · `docker`

**Examples:**
```
feat(tasks): add subtask checklist with progress bar
fix(auth): revoke refresh token on logout
test(notifications): add unit tests for scheduled DUE_DATE_REMINDER job
perf(k6): add board scenario end-to-end load script
docs(api): add @Operation annotations to all controllers
chore(deps): bump Spring Boot to 3.5.11
```

---

## 7. Adding New Features

### Adding a new backend endpoint

1. **Migration** — if you need a new table or column, add `V{N+1}__describe_change.sql` to `backend/src/main/resources/db/migration/`
2. **Model** — add/update entity in `model/`
3. **Repository** — add Spring Data method or `@Query` in `repository/`
4. **Service** — implement business logic in `service/` (authorization + activity logging)
5. **Controller** — add endpoint, annotate with `@Operation`, use `@Valid` on request body
6. **DTOs** — add request/response DTO in `dto/request/` or `dto/response/`
7. **Tests** — add unit test in `test/java/` and integration test in `test/integration/`
8. **Docs** — update `docs/API_DOCUMENTATION.md`

### Adding a new frontend page

1. Create `src/pages/NewPage.jsx`
2. Add route in `src/App.jsx` (lazy-loaded with `React.lazy`)
3. Add nav item in `src/components/shared/Sidebar.jsx`
4. Add Redux slice in `src/store/slices/` if new state is needed
5. Add service calls in `src/services/` using the existing Axios instance
6. Add `data-testid` to interactive elements
7. Write tests in `src/__tests__/NewPage.test.jsx`

### Adding a new performance test

1. Add script to `tests/performance/k6/` (or `jmeter/`, `locust/`, `gatling/`)
2. Import shared thresholds: `import { LOAD_THRESHOLDS } from './config/thresholds.js'`
3. Update `baselines/perf-baseline.json` after first successful run
4. Add the script to the relevant GitHub Actions workflow (`.github/workflows/k6-load.yml` etc.)

---

## 8. Debugging & Troubleshooting

### Backend won't start

```bash
# Check Flyway migration status
cd backend && ./mvnw spring-boot:run 2>&1 | grep -i flyway

# Common fix: Flyway repair after a failed migration
# Already configured via repair-on-migrate: true in application.yml

# Check if PostgreSQL is running
docker ps | grep postgres
curl -s localhost:5432 || echo "postgres not reachable"
```

### JWT errors (invalid token, signature mismatch)

The default dev secret in `application.yml` is a Base64-encoded 64-byte string. If you see `io.jsonwebtoken.security.SignatureException`, verify:
```bash
# The JWT_SECRET env var (if set) must be valid Base64
echo -n "$JWT_SECRET" | base64 -d | wc -c   # must be ≥ 64 bytes
```

### Frontend 401 loops

The Axios 401 interceptor in `services/api.js` queues failed requests and retries after refresh. If you see an infinite loop:
1. Clear `localStorage` (the refresh token may be expired)
2. Check the backend `/auth/refresh` endpoint is responding correctly

### Tests timeout (5000ms — STOMP/WebSocket)

Any test that renders `BoardView` or `NotificationBell` without mocking `useWebSocket` will hang for 5s waiting for the STOMP reconnect delay. Fix:
```javascript
// At the top of the test file, before any imports
vi.mock('../hooks/useWebSocket', () => ({
  default: () => ({ isConnected: false, subscribe: vi.fn() }),
}));
vi.mock('sockjs-client', () => ({ default: vi.fn(() => ({ close: vi.fn() })) }));
vi.mock('@stomp/stompjs', () => ({
  Client: vi.fn(() => ({ activate: vi.fn(), deactivate: vi.fn(), connected: false })),
}));
```

### Performance tests fail with "TOKEN_NOT_FOUND"

The k6/JMeter scripts register users before the test starts. If the backend isn't running or the registration endpoint returns an error, the auth step fails silently. Run:
```bash
k6 run smoke.js --env BASE_URL=http://localhost:8080 --http-debug
```
Look for the login request to confirm it returns `accessToken`.

### Docker build fails (nginx.conf path)

Both Dockerfiles use `context: ../..` (repo root). The nginx config is at `infra/docker/nginx.conf` — referenced as `COPY infra/docker/nginx.conf /etc/nginx/conf.d/taskflow.conf` in `Dockerfile.frontend`. Always build from repo root:
```bash
# Correct:
docker build -f infra/docker/dockerfiles/Dockerfile.frontend .

# Wrong (missing nginx.conf):
cd infra/docker && docker build -f dockerfiles/Dockerfile.frontend .
```
