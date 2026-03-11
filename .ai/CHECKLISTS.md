# Checklists

---

## Phase Completion Checklists

### ✅ Phase 1 — Foundation & Authentication (Week 1–2) — COMPLETE

**Backend:**
- [x] `B1-01` Flyway V1 migration: `users` table created
- [x] `B1-02` Flyway V8 migration: `refresh_tokens` table created
- [x] `B1-03` `application.yml` configured (datasource, Flyway, JPA, HikariCP, dev + test profiles)
- [x] `B1-04` `User` JPA entity + `UserRepository` (`findByEmail`, `existsByEmail`)
- [x] `B1-05` `RefreshToken` entity + repository (revokeByToken, revokeAllByUserId)
- [x] `B1-06` `JwtTokenProvider` — generates access token (15 min HS512) + refresh token (7 days)
- [x] `B1-07` `JwtAuthFilter` — validates Bearer token, sets `SecurityContext`
- [x] `B1-08` `SecurityConfig` — permits `/auth/**`, protects all others, CORS, CSRF off + `UserDetailsServiceImpl`
- [x] `B1-09` `AuthService` — register (BCrypt), login (validate + tokens), refresh, logout
- [x] `B1-10` `AuthController` — POST `/auth/register`, `/auth/login`, `/auth/refresh`, `/auth/logout`
- [x] `B1-11` `GlobalExceptionHandler` — 400/401/403/404/409/422/500 with standard error JSON
- [x] `B1-12` `AuthServiceTest` — unit tests (Mockito + JUnit 5) ⚠️ BUG-01: one assertion uses wrong exception type

**Frontend:**
- [x] `F1-01` Vite + React 18 init; MUI, Redux Toolkit, React Router, Axios installed
- [x] `F1-02` Redux store + `authSlice` (token, user, loading, error)
- [x] `F1-03` `api.js` Axios instance — auth header interceptor + 401 token refresh
- [x] `F1-04` `authService.js` — register, login, refreshToken, logout, getMe, updateProfile, changePassword
- [x] `F1-05` `LoginPage.jsx` — email/password, error alert, loading spinner, redirect
- [x] `F1-06` `RegisterPage.jsx` — full name, email, password confirm, strength bar
- [x] `F1-07` `ProtectedRoute.jsx` + App.jsx route guards
- [x] `F1-08` `Layout.jsx` + `NavBar.jsx` — logo, nav links, notification bell

---

### ✅ Phase 2 — Project Management (Week 3–4) — COMPLETE

**Backend:**
- [x] `B2-01` Migration V2: `projects` table
- [x] `B2-02` Migration V3: `project_members` table + UNIQUE constraint
- [x] `B2-03` `Project` entity + `ProjectRepository` (findAccessibleByUserId, findByIdAndAccessibleByUser)
- [x] `B2-04` `ProjectMember` entity + repository (existsByProjectIdAndUserId, countActiveProjectsByUserId)
- [x] `B2-05` `ProjectService.createProject` (auto-adds creator as MANAGER), `getProjects` (paginated), `getById`
- [x] `B2-06` `ProjectService.updateProject`, `archiveProject`
- [x] `B2-07` `ProjectService.addMember` (lookup by email), `removeMember`, `updateMemberRole`
- [x] `B2-08` `ProjectController` — GET/POST `/projects`, GET/PUT/DELETE `/projects/{id}`
- [x] `B2-09` `ProjectController` — GET/POST/DELETE `/projects/{id}/members` + PATCH `/{id}/members/{userId}/role`
- [x] `B2-10` Request/Response DTOs with validation annotations

**Frontend:**
- [x] `F2-01` `projectService.js`
- [x] `F2-02` `projectsSlice` in Redux (full CRUD + members)
- [x] `F2-03` `ProjectListPage.jsx` — status filter chips, search, 3-col grid
- [x] `F2-04` `ProjectCard.jsx` — status badge, progress bar, member count, kebab menu
- [x] `F2-05` `CreateProjectModal.jsx`
- [x] `F2-06` `ProjectDetailPage.jsx` — Board/List/Members/Activity tabs
- [x] `F2-07` `ProjectMembersPanel.jsx` — invite by email, role selector, remove

---

### ✅ Phase 3 — Task Management (Week 5–6) — COMPLETE

**Backend:**
- [x] `B3-01` Migration V4: `tasks` table (with `task_tags` join table)
- [x] `B3-02` `Task` JPA entity (`@ElementCollection` for tags, TaskStatus + TaskPriority enums)
- [x] `B3-03` `TaskRepository` (filters + `findTasksDueTomorrow` + `countDueThisWeekByUserId`)
- [x] `B3-04` `TaskService.createTask` (reporter = caller, notify assignee)
- [x] `B3-05` `TaskService.getTasksByProject` (filters, paginated), `getTaskById`
- [x] `B3-06` `TaskService.updateTask` (full PUT, membership check)
- [x] `B3-07` `TaskService.updateTaskStatus` (transition validation, activity log)
- [x] `B3-08` `TaskService.deleteTask` (MANAGER/ADMIN only)
- [x] `B3-09` `TaskController` — full CRUD + PATCH `/status` + GET `/my-tasks`
- [x] `B3-10` Task DTOs (CreateTaskRequest, UpdateTaskRequest, UpdateTaskStatusRequest, TaskResponse)
- [x] `B3-11` `UserController` — GET/PUT `/users/me` + PUT `/users/me/password` ⚠️ BUG-03: uses repo directly

**Frontend:**
- [x] `F3-01` `taskService.js`
- [x] `F3-02` `tasksSlice` (CRUD + optimistic status + byStatus grouping)
- [x] `F3-03` `BoardView.jsx` — 4 columns, task count, horizontal scroll
- [x] `F3-04` `TaskCard.jsx` — priority strip, tags, due date (red if overdue), comment count
- [x] `F3-05` `CreateTaskDialog.jsx` — title, desc, priority, assignee, due date, tags chip input
- [x] `F3-06` `ListView.jsx` — sortable MUI table with pagination
- [x] `F3-07` `TaskDetailPage.jsx` — inline editable title, status dropdown, sidebar
- [x] `F3-08` Optimistic UI for status change (reverts on API error + toast)
- [x] `F3-09` `MyTasksPage.jsx` — Board/List toggle, fetchMyTasks

---

### ✅ Phase 4 — Comments, Notifications & Activity (Week 7–8) — COMPLETE

**Backend:**
- [x] `B4-01` Migration V5: `comments` table
- [x] `B4-02` `Comment` JPA entity + `CommentRepository` (findByTaskIdOrderByCreatedAtAsc)
- [x] `B4-03` `CommentService` — add/edit/delete + notify + log activity
- [x] `B4-04` `CommentController` — GET/POST `/tasks/{id}/comments`, PUT/DELETE `/comments/{id}`
- [x] `B4-05` Comment DTOs (CreateCommentRequest, CommentResponse)
- [x] `B4-06` Migration V6: `notifications` table
- [x] `B4-07` `Notification` JPA entity + `NotificationRepository` (countByUserIdAndIsReadFalse)
- [x] `B4-08` `NotificationService.createNotification()`, `notifyTaskAssigned()`, `notifyCommentAdded()`, `notifyStatusChanged()`
- [x] `B4-09` `NotificationService.markAsRead()`, `markAllAsRead()`
- [x] `B4-10` `NotificationController` — GET `/notifications` (with unreadCount), PATCH `/{id}/read`, PATCH `/read-all`
- [x] `B4-11` `@Scheduled(cron = "0 0 9 * * *")` due-date reminder job
- [x] `B4-12` Migration V7: `activities` table
- [x] `B4-13` `Activity` JPA entity + `ActivityRepository` (project + task feeds)
- [x] `B4-14` `ActivityService.logActivity()` — called from TaskService, CommentService, ProjectService
- [x] `B4-15` `ActivityController` — GET `/projects/{id}/activities`, GET `/tasks/{id}/activities`

**Frontend:**
- [x] `F4-01` `CommentSection.jsx` — 30s polling, edit/delete own, Ctrl+Enter submit
- [x] `F4-02` `commentService.js` + `notificationService.js`
- [x] `F4-03` `NotificationBell` in NavBar — badge, 60s polling
- [x] `F4-04` `NotificationDropdown` inside `NotificationBell.jsx` — scrollable list, mark all read
- [x] `F4-05` `ActivityFeed.jsx` — avatar + action + timestamp, load-more
- [x] `F4-06` Activity tab wired in `ProjectDetailPage`
- [x] `F4-07` `notificationsSlice` — fetchNotifications, markRead, markAllRead

---

### ✅ Phase 5 — Dashboard, Profile & UI Polish (Week 9–10) — COMPLETE

**Backend:**
- [x] `B5-01` `DashboardController` — GET `/dashboard/summary` (myActiveTasks, dueThisWeek, activeProjects, unreadNotifications)
- [x] `B5-02` GET `/tasks/my-tasks` endpoint (in TaskController)
- [x] `B5-03` PUT `/users/me` + PUT `/users/me/password` (in UserController) ⚠️ BUG-03
- [ ] `B5-04` Rate limiting on `/auth/login` and `/auth/register` — **NOT IMPLEMENTED** (GAP-01)
- [x] `B5-05` Springdoc dependency + application.yml config — ⚠️ `@Operation` annotations missing (GAP-02)

**Frontend:**
- [x] `F5-01` `DashboardPage.jsx` — 4 stat cards + widgets
- [x] `F5-02` `StatCard.jsx`
- [x] `F5-03` `MyTasksWidget.jsx` — 5-row DataGrid
- [x] `F5-04` `RecentActivityWidget.jsx`
- [x] `F5-05` `MyProjectsGrid.jsx` — up to 6 project cards
- [x] `F5-06` `ProfilePage.jsx` — personal info + change password
- [x] `F5-07` Sidebar navigation (MUI Drawer + List)
- [x] `F5-08` App.jsx nested routes under Layout
- [x] `F5-09` MUI breakpoint audit (xs/sm/md/lg)
- [x] `F5-10` ARIA labels on icon buttons, chips, bell, dialogs
- [x] `F5-11` Skip-to-content link + visible focus rings
- [x] `F5-12` Loading skeletons on Dashboard, Project List, Task Board
- [x] `F5-13` `ToastProvider.jsx` — MUI Snackbar (3s auto-dismiss)

---

### 🔄 Phase 6 — DevOps, Testing & Monitoring (Week 11–12) — IN PROGRESS

**Pre-work — Critical Bugs (must fix first):**
- [ ] **BUG-01** Fix `AuthServiceTest` — change `UnauthorizedException` to `ConflictException` in duplicate email test
- [ ] **BUG-02** Fix `docker-compose.dev.yml` build context — change `context: ..` to `context: ../..`
- [ ] **BUG-03** Refactor `UserController` — delegate to `UserService` instead of injecting repo directly
- [ ] **BUG-04** Fix `AuthService.logout()` — call `refreshTokenRepository.revokeByToken(token)`

**Testing:**
- [ ] `T6-01` Auth integration tests (Testcontainers + real PostgreSQL) — `AuthControllerIT.java`
- [ ] `T6-02` `TaskServiceTest.java` unit tests (create, update, status transitions, delete, membership)
- [ ] `T6-03` `CommentServiceTest.java`, `NotificationServiceTest.java`, `ActivityServiceTest.java`
- [ ] `T6-04` `ProjectControllerIT.java`, `TaskControllerIT.java`, `CommentControllerIT.java` via MockMvc
- [ ] `T6-05` Playwright E2E — verify full journey spec passes against running stack
- [ ] `T6-06` k6 load test `load-test.js` — P95 < 300ms at 500 VUs
- [ ] `T6-07` JaCoCo ≥ 80% coverage enforcement (already in pom.xml; needs to pass)
- [ ] `T6-08` Frontend Vitest + RTL tests for `LoginPage`, `TaskCard`, `BoardView`, `NotificationBell`

**Docker & Dev:**
- [x] `D6-01` Backend Dockerfile finalized (multi-stage, non-root, HEALTHCHECK) ✅
- [x] `D6-02` Frontend Dockerfile finalized (nginx:alpine, SPA fallback) ✅
- [ ] `D6-03` Fix `docker-compose.dev.yml` build context (BUG-02) + verify `nginx.conf` exists
- [x] `D6-04` All Flyway migrations V1–V9 verified on fresh DB ✅
- [ ] `D6-05` Complete `setup.sh` (currently a stub — just prints TODO)

**CI/CD:**
- [ ] `CI6-01` Complete `backend-ci.yml` — add JaCoCo report step + coverage enforcement (≥ 80%)
- [x] `CI6-02` `frontend-ci.yml` — lint + test + build ✅
- [ ] `CI6-03` Complete `e2e-tests.yml` — add docker-compose stack startup + health wait
- [ ] `CI6-04` Implement `deploy.yml` — ECR push + EKS rolling deploy (currently a stub)
- [ ] `CI6-05` GitHub Secrets — JWT_SECRET, DB_URL, DB_PASSWORD, AWS credentials, ECR URL

**Kubernetes & Monitoring:**
- [ ] `K6-01` Flesh out `backend-deployment.yaml` — 2 replicas, HPA (min 2 max 10, CPU 70%), liveness/readiness probes, resource limits, Prometheus pod annotations
- [ ] `K6-02` Flesh out `frontend-deployment.yaml` + `ingress.yaml` — TLS, HTTPS redirect, host routing
- [x] `K6-03` Prometheus scrape configured for `/actuator/prometheus` ✅ (K8s SD config present)
- [ ] `K6-04` Grafana dashboards — create JSON files for API latency, error rate, JVM, DB pool, active users
- [ ] `K6-05` Structured JSON logging with MDC traceId — add `MdcFilter` to inject traceId per request
- [ ] `K6-06` Verify Terraform prod config — EKS, RDS Multi-AZ, VPC, subnets, SGs, IAM

**Additional gaps discovered during code review:**
- [ ] `GAP-01` Implement rate limiting on auth endpoints (B5-04 — Bucket4j or servlet filter)
- [ ] `GAP-02` Add `@Operation` annotations to all controllers for Swagger descriptions
- [ ] `GAP-04` Complete `scripts/setup.sh` with real bootstrap steps (overlaps D6-05)
- [ ] `GAP-07` Create Grafana provisioning config (datasource + dashboard YAML in `monitoring/grafana/provisioning/`)

**Phase 6 DoD check:**
- [ ] All backend unit + integration tests pass; JaCoCo reports ≥ 80% line coverage
- [ ] E2E Playwright test runs headlessly in CI and passes
- [ ] k6 P95 < 300ms at 500 concurrent users
- [ ] GitHub Actions CI on every PR; deploy workflow pushes to EKS on main merge
- [ ] No CRITICAL CVEs in Trivy image scan
- [ ] Prometheus scraping; Grafana shows live metrics
- [ ] `docker-compose up --build` starts full local stack with one command

---

## Security Checklist (Pre-merge)

- [x] All inputs validated at DTO boundary (`@Valid` + Bean Validation)
- [x] Authorization enforced at every endpoint (service-layer checks)
- [x] No sensitive data in error messages or logs
- [x] Secrets in env vars / Kubernetes Secrets — never committed to git
- [ ] Rate limiting on auth endpoints — NOT IMPLEMENTED (GAP-01)
- [x] CORS restricted to known origins via `${cors.allowed-origins}`
- [ ] Dependencies updated; no known HIGH/CRITICAL CVEs — not yet verified
- [x] HTTP security headers set (HSTS, X-Content-Type, X-Frame-Options in SecurityConfig)

---

## Release Checklist (Pre-deploy)

- [ ] Version bump completed (backend pom.xml version + Docker image tag)
- [ ] `mvn -f backend/pom.xml -B test package` — passes (BUG-01 blocks this)
- [ ] `cd frontend && npm run lint && npm run test:coverage && npm run build` — passes
- [ ] Docker images build successfully (BUG-02 blocks this)
- [ ] Docker images pass Trivy scan (no CRITICAL CVEs)
- [ ] All Flyway migrations run cleanly on fresh DB ✅
- [ ] Staging deployment successful + smoke tests pass
- [ ] Smoke test: `GET /actuator/health` → `{ "status": "UP" }`
- [ ] Core user flows pass: register → login → create project → create task → status update → comment → notification
- [ ] `docs/DEPLOYMENT_OPERATION_MANUAL.md` updated if ops behavior changed
- [ ] `docs/IMPLEMENTATION_STATUS.md` task statuses updated
