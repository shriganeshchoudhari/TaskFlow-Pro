# Checklists

---

## Phase Completion Checklists

### ✅ Phase 1 — Foundation & Authentication (Week 1–2)

**Backend:**
- [ ] `B1-01` Flyway V1 migration: `users` table created
- [ ] `B1-02` Flyway V8 migration: `refresh_tokens` table created
- [ ] `B1-03` `application.yml` configured (datasource, Flyway, JPA, HikariCP)
- [ ] `B1-04` `User` JPA entity + `UserRepository` (`findByEmail`)
- [ ] `B1-05` `RefreshToken` entity + repository
- [ ] `B1-06` `JwtTokenProvider` — generates access token (15 min) + refresh token (7 days)
- [ ] `B1-07` `JwtAuthFilter` — validates Bearer token, sets `SecurityContext`
- [ ] `B1-08` `SecurityConfig` — permits `/auth/**`, protects all others, CORS, CSRF off
- [ ] `B1-09` `AuthService` — register (BCrypt), login (validate + tokens), refresh, logout
- [ ] `B1-10` `AuthController` — POST `/auth/register`, `/auth/login`, `/auth/refresh`, `/auth/logout`
- [ ] `B1-11` `GlobalExceptionHandler` — 400 / 401 / 409 / 500 with standard error JSON
- [ ] `B1-12` `AuthServiceTest` — unit tests ≥ 80% coverage (Mockito + JUnit 5)

**Frontend:**
- [ ] `F1-01` Vite + React 18 init; MUI, Redux Toolkit, React Router, Axios installed
- [ ] `F1-02` Redux store + `authSlice` (token, user, loading, error)
- [ ] `F1-03` `api.js` Axios instance — auth header interceptor + 401 token refresh
- [ ] `F1-04` `authService.js` — register, login, refreshToken, logout
- [ ] `F1-05` `LoginPage.jsx` — email/password, error alert, loading spinner, redirect
- [ ] `F1-06` `RegisterPage.jsx` — full name, email, password confirm, strength bar
- [ ] `F1-07` `ProtectedRoute.jsx` + App.jsx route guards
- [ ] `F1-08` `Layout.jsx` + `NavBar.jsx` — logo, nav links, notification bell placeholder

**Phase 1 DoD check:**
- [ ] POST /auth/register → 201
- [ ] POST /auth/login → tokens
- [ ] POST /auth/refresh → rotated tokens
- [ ] Invalid credentials → 401
- [ ] Protected routes redirect unauthenticated users
- [ ] AuthService unit tests pass ≥ 80%

---

### ⏳ Phase 2 — Project Management (Week 3–4)

**Backend:**
- [ ] `B2-01` Migration V2: `projects` table
- [ ] `B2-02` Migration V3: `project_members` table + UNIQUE constraint
- [ ] `B2-03` `Project` entity + `ProjectRepository`
- [ ] `B2-04` `ProjectMember` entity + repository
- [ ] `B2-05` `ProjectService.createProject`, `getProjects` (paginated), `getById`
- [ ] `B2-06` `ProjectService.updateProject`, `archiveProject`
- [ ] `B2-07` `ProjectService.addMember`, `removeMember`, `updateMemberRole`
- [ ] `B2-08` `ProjectController` — GET/POST `/projects`, GET/PUT/DELETE `/projects/{id}`
- [ ] `B2-09` `ProjectController` — GET/POST/DELETE `/projects/{id}/members`
- [ ] `B2-10` Request/Response DTOs with validation annotations

**Frontend:**
- [ ] `F2-01` `projectService.js`
- [ ] `F2-02` `projectsSlice` in Redux
- [ ] `F2-03` `ProjectListPage.jsx`
- [ ] `F2-04` `ProjectCard.jsx`
- [ ] `F2-05` `CreateProjectModal.jsx`
- [ ] `F2-06` `ProjectDetailPage.jsx`
- [ ] `F2-07` `ProjectMembersPanel.jsx`

**Phase 2 DoD check:**
- [ ] User can create project and see it in list
- [ ] Owner auto-assigned as MANAGER
- [ ] Members invited by email with role enforcement
- [ ] Archived project hidden from Active filter
- [ ] Project List + Detail pages render correctly

---

### ⏳ Phase 3 — Task Management (Week 5–6)

**Backend:**
- [ ] `B3-01` Migration V4: `tasks` table
- [ ] `B3-02` `Task` JPA entity (`@ElementCollection` for tags, enums)
- [ ] `B3-03` `TaskRepository` (filters + `findDueSoon`)
- [ ] `B3-04` `TaskService.createTask`
- [ ] `B3-05` `TaskService.getTasksByProject`, `getTaskById`
- [ ] `B3-06` `TaskService.updateTask`
- [ ] `B3-07` `TaskService.updateTaskStatus` (transition validation)
- [ ] `B3-08` `TaskService.reassignTask`, `deleteTask`
- [ ] `B3-09` `TaskController` — full CRUD + PATCH `/status`
- [ ] `B3-10` Task DTOs
- [ ] `B3-11` `UserController` — GET/PUT `/users/me`

**Frontend:**
- [ ] `F3-01` `taskService.js`
- [ ] `F3-02` `tasksSlice`
- [ ] `F3-03` `BoardView.jsx` (4 columns)
- [ ] `F3-04` `TaskCard.jsx`
- [ ] `F3-05` `CreateTaskDialog.jsx`
- [ ] `F3-06` `ListView.jsx` (DataGrid sortable)
- [ ] `F3-07` `TaskDetailPage.jsx`
- [ ] `F3-08` Optimistic UI for status change
- [ ] `F3-09` `MyTasksPage.jsx`

**Phase 3 DoD check:**
- [ ] Tasks appear in TODO column after creation
- [ ] Status transitions work; invalid transitions → 422
- [ ] All task fields editable from detail page
- [ ] List view sortable; board columns correct
- [ ] Project delete cascades to tasks
- [ ] My Tasks shows only current user's tasks

---

### ⏳ Phase 4 — Comments, Notifications & Activity (Week 7–8)

**Backend:**
- [ ] `B4-01–B4-05` Comments: migration, entity, service, controller, DTOs
- [ ] `B4-06–B4-11` Notifications: migration, entity, service, controller, scheduled job
- [ ] `B4-12–B4-15` Activity: migration, entity, service, controller

**Frontend:**
- [ ] `F4-01` `CommentSection.jsx`
- [ ] `F4-02` `commentService.js` + `notificationService.js`
- [ ] `F4-03` `NotificationBell` in NavBar (poll every 60s)
- [ ] `F4-04` `NotificationDropdown.jsx`
- [ ] `F4-05` `ActivityFeed.jsx` (reusable)
- [ ] `F4-06` Activity tab wired in `ProjectDetailPage`
- [ ] `F4-07` `notificationsSlice`

**Phase 4 DoD check:**
- [ ] Comment → notification for assignee + reporter
- [ ] Task assignment → TASK_ASSIGNED notification
- [ ] Bell badge shows unread count; click navigates to task
- [ ] Mark all read clears badge
- [ ] Activity feed shows actor, action, old/new values
- [ ] Due-date reminder job fires 24h before deadline

---

### ⏳ Phase 5 — Dashboard, Profile & UI Polish (Week 9–10)

**Backend:**
- [ ] `B5-01` `DashboardController` — GET `/dashboard/summary`
- [ ] `B5-02` GET `/tasks/my-tasks` convenience endpoint
- [ ] `B5-03` PUT `/users/me` + PUT `/users/me/password`
- [ ] `B5-04` Rate limiting (Bucket4j) — login: 10/15min, register: 5/1hr
- [ ] `B5-05` OpenAPI/Springdoc — Swagger UI at `/swagger-ui.html`

**Frontend:**
- [ ] `F5-01` `DashboardPage.jsx` (4 stat cards)
- [ ] `F5-02` `StatCard.jsx`
- [ ] `F5-03` `MyTasksWidget.jsx`
- [ ] `F5-04` `RecentActivityWidget.jsx`
- [ ] `F5-05` `MyProjectsGrid.jsx`
- [ ] `F5-06` `ProfilePage.jsx`
- [ ] `F5-07` Sidebar navigation (MUI Drawer)
- [ ] `F5-08` App.jsx nested routes under Layout
- [ ] `F5-09` MUI breakpoint audit (xs/sm/md/lg)
- [ ] `F5-10` ARIA labels on all icon buttons, chips, bell, dialogs
- [ ] `F5-11` Skip-to-content link + visible focus rings
- [ ] `F5-12` Loading skeletons on all data-fetching pages
- [ ] `F5-13` `ToastProvider.jsx` — MUI Snackbar for all mutations

**Phase 5 DoD check:**
- [ ] Dashboard loads with real data; counts are accurate
- [ ] Profile updates name and password
- [ ] App fully keyboard-navigable
- [ ] Board scrolls horizontally on mobile; sidebar becomes drawer
- [ ] All mutations show success/error toast

---

### ⏳ Phase 6 — DevOps, Testing & Monitoring (Week 11–12)

**Testing:**
- [ ] `T6-01` Auth integration tests (Testcontainers + real PostgreSQL)
- [ ] `T6-02` TaskService unit tests
- [ ] `T6-03` CommentService, NotificationService, ActivityService unit tests
- [ ] `T6-04` ProjectController, TaskController, CommentController MockMvc integration tests
- [ ] `T6-05` Playwright E2E — full user journey
- [ ] `T6-06` k6 load test — P95 < 300ms at 500 VUs
- [ ] `T6-07` JaCoCo ≥ 80% enforced in `pom.xml`
- [ ] `T6-08` Frontend: Vitest + RTL tests for LoginPage, TaskCard, BoardView, NotificationBell

**Docker & Dev:**
- [ ] `D6-01` Backend Dockerfile finalized (multi-stage, non-root, HEALTHCHECK)
- [ ] `D6-02` Frontend Dockerfile finalized (nginx:alpine, SPA fallback)
- [ ] `D6-03` `docker-compose.dev.yml` — full stack (backend, frontend, postgres, prometheus, grafana)
- [ ] `D6-04` All Flyway migrations V1–V9 verified on fresh DB
- [ ] `D6-05` `setup.sh` — one-command local stack bootstrap

**CI/CD:**
- [ ] `CI6-01` `backend-ci.yml` — tests + JaCoCo + coverage gate
- [ ] `CI6-02` `frontend-ci.yml` — lint + test + build
- [ ] `CI6-03` `e2e-tests.yml` — docker-compose up + Playwright
- [ ] `CI6-04` `deploy.yml` — ECR push + EKS rolling deploy
- [ ] `CI6-05` GitHub Secrets configured (JWT_SECRET, DB_URL, DB_PASSWORD, AWS creds, ECR URL)

**Kubernetes & Monitoring:**
- [ ] `K6-01` `backend-deployment.yaml` — 2 replicas, HPA, liveness/readiness probes
- [ ] `K6-02` `frontend-deployment.yaml` + `ingress.yaml` — TLS, HTTPS redirect
- [ ] `K6-03` Prometheus scrape configured for `/actuator/prometheus`
- [ ] `K6-04` Grafana dashboards — API latency, error rate, JVM, DB pool, active users
- [ ] `K6-05` Structured JSON logging + MDC traceId on all controllers + services
- [ ] `K6-06` Terraform prod config verified — EKS, RDS Multi-AZ, VPC, SGs, IAM

**Phase 6 DoD check:**
- [ ] All backend unit + integration tests pass; JaCoCo ≥ 80%
- [ ] Playwright E2E passes headlessly in CI
- [ ] k6 P95 < 300ms at 500 concurrent users
- [ ] GitHub Actions CI on every PR; deploy on main merge
- [ ] Prometheus scraping; Grafana shows live metrics
- [ ] `docker-compose up --build` starts full stack

---

## Security Checklist (Pre-merge)

- [ ] All inputs validated at DTO boundary (`@Valid` + Bean Validation)
- [ ] Authorization enforced at every endpoint (`@PreAuthorize` / service check)
- [ ] No sensitive data in error messages or logs (no passwords, tokens)
- [ ] Secrets in env vars / Kubernetes Secrets — never committed to git
- [ ] Rate limiting on auth endpoints (`/auth/login`, `/auth/register`)
- [ ] CORS restricted to known origins in non-dev environments
- [ ] Dependencies updated; no known HIGH/CRITICAL CVEs
- [ ] HTTP security headers set (HSTS, X-Content-Type, CSP, X-Frame-Options)

---

## Release Checklist (Pre-deploy)

- [ ] Version bump completed (backend pom.xml version + Docker image tag)
- [ ] `mvn -f backend/pom.xml -B test package` — passes
- [ ] `cd frontend && npm run lint && npm run test:coverage && npm run build` — passes
- [ ] Docker images build successfully and pass Trivy scan (no CRITICAL CVEs)
- [ ] All Flyway migrations run cleanly on fresh DB
- [ ] Staging deployment successful + smoke tests pass
- [ ] Smoke test: `GET /actuator/health` → `{ "status": "UP" }`
- [ ] Core user flows pass: register → login → create project → create task → status update → comment → notification
- [ ] `docs/DEPLOYMENT_OPERATION_MANUAL.md` updated if ops behavior changed
- [ ] `docs/IMPLEMENTATION_STATUS.md` task statuses updated
