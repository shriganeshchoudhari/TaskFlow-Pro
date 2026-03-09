# Prompt Templates

Copy-paste these prompts when working with AI tools on specific tasks in the implementation plan.

---

## Generic Feature Implementation Prompt

```
Context:
- Repo: TaskFlow Pro (backend/ Spring Boot 3 / Java 21, frontend/ React 18 / Vite / MUI v5)
- Source-of-truth docs: docs/PRD.md, docs/TTD.md, docs/API_DOCUMENTATION.md, docs/DATABASE_SCHEMA.md
- Implementation plan task: {TASK_ID} — {TASK_DESCRIPTION}

Request:
1) Summarize what this task requires based on the implementation plan.
2) Propose backend changes: routes, DTOs, service methods, DB migration (if any).
3) Propose frontend changes: service call, Redux slice update, component/page changes.
4) List tests to add (unit / integration / E2E).
5) List docs to update.

Constraints:
- Follow existing package structure in .ai/REPO_MAP.md
- Keep changes minimal and consistent with existing code style
- Use BCrypt for passwords, JWT HS512 for tokens, UUID PKs, Flyway for migrations
- Enforce authorization at service layer + @PreAuthorize on controllers
- Do not skip input validation (@Valid on all request DTOs)
```

---

## Phase 1 — Auth Implementation Prompt

```
Context: TaskFlow Pro — Phase 1, Foundation & Authentication

Implement the following task: {B1-01 to B1-12 or F1-01 to F1-08}

Stack:
- Backend: Spring Boot 3, Java 21, Spring Security 6, JPA/Hibernate, Flyway, PostgreSQL 16
- JWT: HS512, access token 15 min, refresh token 7 days
- Password: BCrypt strength 12
- Frontend: React 18, Vite, Redux Toolkit, MUI v5, Axios

Key constraints:
- JWT secret stored in environment variable (never hardcoded)
- SecurityConfig: stateless (no session), CSRF disabled for REST, CORS whitelist
- JwtAuthFilter: OncePerRequestFilter, extract Bearer token, validate, populate SecurityContext
- AuthController returns: register → 201, login → 200, refresh → 200, logout → 204
- GlobalExceptionHandler: return standard { status, error, message, timestamp, traceId }
- Redux authSlice: persist token in localStorage, clear on logout
- ProtectedRoute: redirect to /login if accessToken absent from Redux store

Reference: docs/API_DOCUMENTATION.md §2, docs/SECURITY_COMPLIANCE.md §1
```

---

## Phase 2 — Project Management Prompt

```
Context: TaskFlow Pro — Phase 2, Project Management

Implement: {B2-01 to B2-10 or F2-01 to F2-07}

Key constraints:
- Project creator auto-added to project_members as MANAGER
- Visibility enforcement: PRIVATE projects → 403 for non-members
- Paginated responses: { content[], page, size, totalElements, totalPages }
- Role guards: @PreAuthorize("hasRole('MANAGER') or hasRole('ADMIN')")
- Redux projectsSlice: async thunks with createAsyncThunk, normalised state
- ProjectCard: MUI Card with status-coloured left border, kebab menu, progress bar
- CreateProjectModal: MUI Dialog form with react-hook-form validation

Reference: docs/API_DOCUMENTATION.md §4, docs/DATABASE_SCHEMA.md §2.2–2.3
```

---

## Phase 3 — Task Management Prompt

```
Context: TaskFlow Pro — Phase 3, Task Management

Implement: {B3-01 to B3-11 or F3-01 to F3-09}

Key constraints:
- Task status machine: TODO → IN_PROGRESS → REVIEW → DONE (back-transitions allowed)
- Invalid transitions → 422 INVALID_STATUS_TRANSITION
- Tags stored as PostgreSQL TEXT[] array, mapped with @ElementCollection
- Only assignee/reporter/MANAGER can update a task (service-level check)
- Only MANAGER/ADMIN can delete a task
- ActivityService.logActivity() called on every state change
- NotificationService triggered on assignee change
- BoardView: 4 MUI columns with horizontal scroll on xs breakpoint
- Optimistic UI: dispatch status update to Redux immediately, revert on API error

Reference: docs/API_DOCUMENTATION.md §5, docs/UI_UX_SPECIFICATION.md §3.5
```

---

## Phase 4 — Comments, Notifications & Activity Prompt

```
Context: TaskFlow Pro — Phase 4, Collaboration Features

Implement: {B4-01 to B4-15 or F4-01 to F4-07}

Key constraints:
- Comment → notify assignee + reporter (type: COMMENT_ADDED)
- Task assign → notify new assignee (type: TASK_ASSIGNED)
- Status change → notify assignee (type: STATUS_CHANGED)
- DUE_DATE_REMINDER: @Scheduled cron job, runs daily, notifies 24h before due_date
- Partial index on notifications(user_id, is_read) WHERE is_read = false
- Activity log: store old_value + new_value as TEXT for all state changes
- metadata column: JSONB for structured context (e.g., {"projectName":"..."})
- Frontend polls: GET /notifications every 60s for unreadCount badge
- CommentSection polls: GET /tasks/{id}/comments every 30s
- NotificationDropdown: 380px panel desktop, full-screen overlay mobile

Reference: docs/API_DOCUMENTATION.md §6–8, docs/DATABASE_SCHEMA.md §2.5–2.7
```

---

## Phase 5 — Dashboard & Polish Prompt

```
Context: TaskFlow Pro — Phase 5, Dashboard, Profile & UI Polish

Implement: {B5-01 to B5-05 or F5-01 to F5-13}

Key constraints:
- DashboardController: single aggregation query (JOIN users, projects, tasks, notifications)
- Rate limiting: Bucket4j or Redis counter — login 10/15min, register 5/1hr → 429
- Springdoc: @Tag + @Operation on all controllers; auto-generate OpenAPI 3.0 spec
- Dashboard stat cards: MUI Skeleton during load, real data from /dashboard/summary
- Sidebar: icon-only sm, expanded md/lg, MUI Drawer xs
- WCAG 2.1 AA: ARIA labels, aria-live on notification badge, focus traps in dialogs
- Skip-to-content: first focusable element in Layout.jsx
- ToastProvider: global MUI Snackbar context, 3s auto-dismiss, severity (success/error)
- All breakpoints: xs/sm/md/lg per docs/UI_UX_SPECIFICATION.md §5

Reference: docs/UI_UX_SPECIFICATION.md §3.3, §5, §7, docs/API_DOCUMENTATION.md §3
```

---

## Phase 6 — DevOps & Testing Prompt

```
Context: TaskFlow Pro — Phase 6, DevOps, Testing & Monitoring

Implement: {T6-01 to T6-08 or D6-01 to D6-05 or CI6-01 to CI6-05 or K6-01 to K6-06}

Key constraints:
- Testcontainers: use PostgreSQL 16 image, run @SpringBootTest with real DB
- JaCoCo: configured in pom.xml, fail build if LINE coverage < 0.80
- Playwright: headless Chromium, test against http://localhost:5173 (local) or staging URL
- k6: 500 VUs, 10min duration, threshold: p(95) < 300ms
- Backend Dockerfile: multi-stage (maven:3.9-eclipse-temurin-21 → eclipse-temurin:21-jre-alpine)
  - Non-root user (USER 1001), HEALTHCHECK on /actuator/health
- Frontend Dockerfile: node:20-alpine build → nginx:1.25-alpine serve, nginx.conf SPA fallback
- GitHub Actions: use OIDC for AWS auth (no stored keys), cache Maven/npm
- EKS HPA: CPU utilization 70%, min 2 replicas, max 10
- Prometheus: scrape interval 15s, job_name: taskflow-backend, metrics_path: /actuator/prometheus
- Grafana: import dashboards from monitoring/grafana/dashboards/ JSON files

Reference: docs/TEST_PLAN.md, docs/DEPLOYMENT_OPERATION_MANUAL.md
```

---

## Bugfix Prompt

```
Bugfix report for TaskFlow Pro:

Task/Area: {B_or_F_task_id or description}
Steps to reproduce:
  1.
  2.
  3.
Expected: {expected behavior}
Actual: {actual behavior}
Logs/stack trace:
  {paste here}
Relevant endpoint/UI: {e.g. POST /api/v1/auth/login, LoginPage.jsx}

Request:
1. Write a failing test first (unit or integration)
2. Propose the smallest safe fix
3. List any regression risks
4. Identify if docs need updating
```

---

## ADR Prompt

```
Create an Architecture Decision Record for TaskFlow Pro.

Decision: {what we are deciding}
Context: {why this decision is needed now}
Options considered:
  A. {option A}
  B. {option B}
  C. {option C, if applicable}

For each option, describe:
- Pros (performance, DX, maintainability, security)
- Cons (complexity, lock-in, migration cost)

Outcome: {chosen option and primary reason}
Consequences: {what changes, what becomes easier/harder}

Write using the template at .ai/adr/0000-template.md.
File as: .ai/adr/{NNNN}-{short-title}.md
Add entry to .ai/adr/README.md index.
```

---

## Migration Prompt

```
Write a Flyway SQL migration for TaskFlow Pro.

Migration file: V{n}__{description}.sql
Table: {table_name}
Columns:
  - {col_name} {type} {constraints}
  ...
Foreign keys: {references}
Indexes needed: {list}

Constraints:
- Use UUID PRIMARY KEY DEFAULT gen_random_uuid()
- All timestamps: TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
- Add COMMENT ON TABLE and COMMENT ON COLUMN for key columns
- Include all indexes from docs/DATABASE_SCHEMA.md §4 for this table
- Script must be idempotent if re-run (use IF NOT EXISTS where possible)
```
