# Repo Map

## Top-Level Structure

```
TaskFlow Pro/
├── .ai/                    ← AI-assisted dev kit (context, workflows, checklists, plans)
├── .github/workflows/      ← CI/CD GitHub Actions (4 workflows)
├── backend/                ← Spring Boot API (Maven, Java 21)
├── database/               ← Schema SQL + migration reference + seed data
├── docs/                   ← Product + technical source-of-truth docs
├── frontend/               ← React 18 SPA (Vite + MUI + Redux Toolkit)
├── infra/                  ← Docker · Kubernetes · Helm · Terraform (preferred)
├── k8s/                    ← Kustomize base + overlays (alternative to infra/k8s)
├── monitoring/             ← Prometheus config + Grafana dashboards
├── scripts/                ← Developer automation (setup.sh, build.sh, deploy.sh)
├── terraform/              ← Terraform environments: dev/ and prod/
└── tests/                  ← API (Postman + REST client) · E2E (Playwright) · Perf (k6)
```

---

## Backend — File Map

```
backend/src/main/java/com/taskflow/
├── TaskflowApplication.java              ✅ EXISTS  (@SpringBootApplication + @EnableScheduling)
│
├── config/
│   ├── SecurityConfig.java               ✅ EXISTS  [B1-08] — JWT stateless, CORS, CSRF off
│   ├── JwtConfig.java                    🔲 NOT NEEDED  (JWT props read directly via @Value)
│   ├── CorsConfig.java                   🔲 NOT NEEDED  (CORS handled inside SecurityConfig)
│   └── OpenApiConfig.java                🔲 NOT NEEDED  (Springdoc auto-config via application.yml)
│
├── controller/
│   ├── AuthController.java               ✅ EXISTS  [B1-10] — register/login/refresh/logout
│   ├── UserController.java               ⚠️  EXISTS  [B3-11, B5-03] — BUG-03: injects repo directly
│   ├── ProjectController.java            ✅ EXISTS  [B2-08, B2-09] — full CRUD + members
│   ├── TaskController.java               ✅ EXISTS  [B3-09] — CRUD + /my-tasks + PATCH /status
│   ├── CommentController.java            ✅ EXISTS  [B4-04] — GET/POST tasks/{id}/comments
│   ├── NotificationController.java       ✅ EXISTS  [B4-10] — GET + PATCH read/read-all
│   ├── ActivityController.java           ✅ EXISTS  [B4-15] — project + task activity feeds
│   └── DashboardController.java          ✅ EXISTS  [B5-01] — GET /dashboard/summary
│
├── service/
│   ├── AuthService.java                  ⚠️  EXISTS  [B1-09] — BUG-04: logout() is a no-op
│   ├── UserService.java                  ✅ EXISTS  [B3-11, B5-03] — updateProfile + password
│   ├── ProjectService.java               ✅ EXISTS  [B2-05, B2-06, B2-07] — full CRUD + members
│   ├── TaskService.java                  ✅ EXISTS  [B3-04 → B3-08] — CRUD + status transitions
│   ├── CommentService.java               ✅ EXISTS  [B4-03] — add/edit/delete + notifications
│   ├── NotificationService.java          ✅ EXISTS  [B4-08, B4-09, B4-11] — @Scheduled job
│   └── ActivityService.java              ✅ EXISTS  [B4-14] — logActivity + getProject/TaskActivities
│
├── repository/
│   ├── UserRepository.java               ✅ EXISTS  [B1-04] — findByEmail, existsByEmail
│   ├── ProjectRepository.java            ✅ EXISTS  [B2-03] — findAccessibleByUserId
│   ├── ProjectMemberRepository.java      ✅ EXISTS  [B2-04] — countActiveProjectsByUserId
│   ├── TaskRepository.java               ✅ EXISTS  [B3-03] — filters, findDueTomorrow, counts
│   ├── CommentRepository.java            ✅ EXISTS  [B4-02] — findByTaskIdOrderByCreatedAtAsc
│   ├── NotificationRepository.java       ✅ EXISTS  [B4-07] — markAllRead, countUnread
│   ├── RefreshTokenRepository.java       ✅ EXISTS  [B1-05] — revokeByToken, revokeAllByUserId
│   └── ActivityRepository.java           ✅ EXISTS  [B4-13] — project + task feeds (paginated)
│
├── model/
│   ├── User.java                         ✅ EXISTS  [B1-04] — Role enum: ADMIN/MANAGER/MEMBER/VIEWER
│   ├── Project.java                      ✅ EXISTS  [B2-03] — ProjectStatus + ProjectVisibility enums
│   ├── Task.java                         ✅ EXISTS  [B3-02] — TaskStatus + TaskPriority enums, tags[]
│   └── DomainModels.java                 ✅ EXISTS  [B1-05, B2-04, B4-02, B4-07, B4-13]
│                                                    RefreshToken · Comment · ProjectMember
│                                                    Notification · Activity
│
├── dto/
│   ├── request/
│   │   └── Requests.java                 ✅ EXISTS  — all request DTOs in one file
│   └── response/
│       ├── AuthResponse.java             ✅ EXISTS
│       ├── UserResponse.java             ✅ EXISTS
│       ├── ProjectResponse.java          ✅ EXISTS
│       ├── MemberResponse.java           ✅ EXISTS
│       ├── TaskResponse.java             ✅ EXISTS
│       ├── CommentResponse.java          ✅ EXISTS
│       ├── NotificationResponse.java     ✅ EXISTS
│       └── ActivityResponse.java         ✅ EXISTS
│
├── security/
│   ├── JwtTokenProvider.java             ✅ EXISTS  [B1-06] — HS512 access + refresh tokens
│   ├── JwtAuthFilter.java                ✅ EXISTS  [B1-07] — OncePerRequestFilter
│   └── UserDetailsServiceImpl.java       ✅ EXISTS  [B1-08] — loads by email, checks isActive
│
└── exception/
    ├── GlobalExceptionHandler.java       ✅ EXISTS  [B1-11] — 400/401/403/404/409/422/500
    ├── ResourceNotFoundException.java    ✅ EXISTS
    ├── UnauthorizedException.java        ✅ EXISTS
    ├── ConflictException.java            ✅ EXISTS
    ├── ForbiddenException.java           ✅ EXISTS
    └── InvalidStatusTransitionException.java  ✅ EXISTS
```

```
backend/src/main/resources/
├── application.yml                       ✅ EXISTS  [B1-03] — dev + test profiles
└── db/migration/
    ├── V1__create_users_table.sql        ✅ EXISTS  [B1-01]
    ├── V2__create_projects_table.sql     ✅ EXISTS  [B2-01]
    ├── V3__create_project_members_table.sql  ✅ EXISTS  [B2-02]
    ├── V4__create_tasks_table.sql        ✅ EXISTS  [B3-01]
    ├── V5__create_comments_table.sql     ✅ EXISTS  [B4-01]
    ├── V6__create_notifications_table.sql ✅ EXISTS  [B4-06]
    ├── V7__create_activities_table.sql   ✅ EXISTS  [B4-12]
    ├── V8__create_refresh_tokens_table.sql ✅ EXISTS  [B1-02]
    └── V9__create_indexes.sql            ✅ EXISTS  [D6-04]
```

```
backend/src/test/
├── java/com/taskflow/
│   └── AuthServiceTest.java             ⚠️  EXISTS  [B1-12] — BUG-01: wrong exception type asserted
├── unit/README.md                        ✅ EXISTS  (placeholder)
└── integration/README.md                 ✅ EXISTS  (placeholder)

MISSING — CREATE THESE FOR PHASE 6:
├── java/com/taskflow/
│   ├── TaskServiceTest.java             🔲 CREATE  [T6-02]
│   ├── CommentServiceTest.java          🔲 CREATE  [T6-03]
│   ├── NotificationServiceTest.java     🔲 CREATE  [T6-03]
│   └── ActivityServiceTest.java         🔲 CREATE  [T6-03]
└── integration/
    ├── AuthControllerIT.java            🔲 CREATE  [T6-01]
    ├── ProjectControllerIT.java         🔲 CREATE  [T6-04]
    ├── TaskControllerIT.java            🔲 CREATE  [T6-04]
    └── CommentControllerIT.java         🔲 CREATE  [T6-04]
```

---

## Frontend — File Map

```
frontend/src/
├── main.jsx                             ✅ EXISTS  [F1-01]
├── App.jsx                              ✅ EXISTS  [F1-07, F5-08] — lazy-loaded routes
│
├── pages/
│   ├── LoginPage.jsx                    ✅ EXISTS  [F1-05]
│   ├── RegisterPage.jsx                 ✅ EXISTS  [F1-06] — password strength bar
│   ├── DashboardPage.jsx                ✅ EXISTS  [F5-01] — 4 stat cards + widgets
│   ├── ProjectListPage.jsx              ✅ EXISTS  [F2-03] — filter chips, search, grid
│   ├── ProjectDetailPage.jsx            ✅ EXISTS  [F2-06, F4-06] — Board/List/Members/Activity tabs
│   ├── TaskDetailPage.jsx               ✅ EXISTS  [F3-07] — inline edit, sidebar, comments
│   ├── MyTasksPage.jsx                  ✅ EXISTS  [F3-09] — Board/List toggle
│   ├── ProfilePage.jsx                  ✅ EXISTS  [F5-06] — personal info + change password
│   └── NotFoundPage.jsx                 ✅ EXISTS
│
├── components/
│   ├── auth/
│   │   └── ProtectedRoute.jsx           ✅ EXISTS  [F1-07]
│   ├── shared/
│   │   ├── Layout.jsx                   ✅ EXISTS  [F1-08, F5-07]
│   │   ├── NavBar.jsx                   ✅ EXISTS  [F1-08, F4-03]
│   │   ├── Sidebar.jsx                  ✅ EXISTS  [F5-07]
│   │   ├── ActivityFeed.jsx             ✅ EXISTS  [F4-05] — load-more pagination
│   │   └── ToastProvider.jsx            ✅ EXISTS  [F5-13]
│   ├── projects/
│   │   ├── ProjectCard.jsx              ✅ EXISTS  [F2-04] — status badge, progress bar, kebab
│   │   ├── CreateProjectModal.jsx       ✅ EXISTS  [F2-05]
│   │   └── ProjectMembersPanel.jsx      ✅ EXISTS  [F2-07] — invite by email, role selector
│   ├── tasks/
│   │   ├── BoardView.jsx                ✅ EXISTS  [F3-03] — 4 columns, horizontal scroll
│   │   ├── TaskCard.jsx                 ✅ EXISTS  [F3-04, F3-08] — priority strip, tags, optimistic
│   │   ├── CreateTaskDialog.jsx         ✅ EXISTS  [F3-05]
│   │   ├── ListView.jsx                 ✅ EXISTS  [F3-06] — sortable table
│   │   └── CommentSection.jsx           ✅ EXISTS  [F4-01] — 30s poll, edit/delete
│   ├── notifications/
│   │   └── NotificationBell.jsx         ✅ EXISTS  [F4-03, F4-04] — badge, dropdown, 60s poll
│   └── dashboard/
│       └── StatCard.jsx                 ✅ EXISTS  [F5-02]
│
├── store/
│   ├── index.js                         ✅ EXISTS  [F1-02]
│   └── slices/
│       ├── authSlice.js                 ✅ EXISTS  [F1-02] — login/register/logout/refresh
│       ├── projectsSlice.js             ✅ EXISTS  [F2-02] — full CRUD + members
│       ├── tasksSlice.js                ✅ EXISTS  [F3-02] — CRUD + optimistic status + byStatus
│       ├── notificationsSlice.js        ✅ EXISTS  [F4-07] — fetchNotifications + markRead
│       └── uiSlice.js                   ✅ EXISTS  [F5-01]
│
├── services/
│   ├── api.js                           ✅ EXISTS  [F1-03] — Axios + 401 interceptor + refresh
│   ├── authService.js                   ✅ EXISTS  [F1-04]
│   ├── projectService.js                ✅ EXISTS  [F2-01]
│   ├── taskService.js                   ✅ EXISTS  [F3-01] — taskService + commentService + notifService
│   ├── commentService.js                ✅ EXISTS  [F4-02]
│   └── notificationService.js           ✅ EXISTS  [F4-02]
│
MISSING — CREATE FOR PHASE 6 (VITEST):
└── __tests__/
    ├── LoginPage.test.jsx               🔲 CREATE  [T6-08]
    ├── TaskCard.test.jsx                🔲 CREATE  [T6-08]
    ├── BoardView.test.jsx               🔲 CREATE  [T6-08]
    └── NotificationBell.test.jsx        🔲 CREATE  [T6-08]
```

---

## Tests — File Map

```
tests/
├── api/
│   ├── postman/
│   │   └── TaskflowPro.postman_collection.json  ✅ EXISTS
│   └── rest-client/
│       ├── api-tests.http               ✅ EXISTS
│       └── taskflow.http                ✅ EXISTS
├── e2e/
│   └── playwright/
│       ├── playwright.config.ts         ✅ EXISTS
│       └── tests/
│           └── taskflow.spec.ts         ✅ EXISTS  [T6-05] — Auth + Project + Task + Notif flows
└── performance/
    └── k6-tests/
        └── load-test.js                 🔲 CREATE  [T6-06] — P95 < 300ms @ 500 VUs
```

---

## Infra — File Map

```
infra/
├── docker/
│   ├── docker-compose.dev.yml           ⚠️  EXISTS  [D6-03] — BUG-02: wrong build context
│   ├── docker-compose.yml               ✅ EXISTS
│   ├── nginx.conf                       🔲 VERIFY/CREATE  (referenced by Dockerfile.frontend)
│   └── dockerfiles/
│       ├── Dockerfile.backend           ✅ EXISTS  [D6-01] — multi-stage, non-root, HEALTHCHECK
│       └── Dockerfile.frontend          ✅ EXISTS  [D6-02] — node build + nginx:alpine, SPA fallback
├── helm/
│   └── taskflow-chart/
│       ├── Chart.yaml                   ✅ EXISTS
│       └── values.yaml                  ✅ EXISTS
└── kubernetes/
    ├── backend-deployment.yaml          ⚠️  EXISTS  [K6-01] — stub (no HPA, no probes, no limits)
    ├── frontend-deployment.yaml         ⚠️  EXISTS  [K6-02] — stub (no limits, no probes)
    ├── ingress.yaml                     ⚠️  EXISTS  [K6-02] — stub (no TLS, no HTTPS redirect)
    └── services.yaml                    ✅ EXISTS
```

---

## Monitoring — File Map

```
monitoring/
├── prometheus/
│   └── prometheus.yml                   ✅ EXISTS  [K6-03] — K8s SD + Actuator scrape config
└── grafana/
    ├── dashboards/                       🔲 EMPTY   [K6-04] — needs dashboard JSON files
    └── provisioning/                     🔲 EMPTY   [K6-04] — needs datasource + dashboard provisioning YAML
```

---

## Scripts — File Map

```
scripts/
├── build.sh                             ✅ EXISTS
├── deploy.sh                            ✅ EXISTS
└── setup.sh                             ⚠️  EXISTS  [D6-05] — stub (only prints TODO)
```

---

## GitHub Actions — Workflows

```
.github/workflows/
├── backend-ci.yml                       ⚠️  EXISTS  [CI6-01] — runs tests but missing JaCoCo upload
├── frontend-ci.yml                      ✅ EXISTS  [CI6-02] — lint + test + build
├── e2e-tests.yml                        ⚠️  EXISTS  [CI6-03] — doesn't spin up docker-compose stack
└── deploy.yml                           ⚠️  EXISTS  [CI6-04] — stub (prints placeholder only)
```

---

## Backend Layering (Rules)

| Layer | Responsibility | No-Nos |
|-------|---------------|--------|
| `controller/` | HTTP request/response, input validation, DTO mapping | No business logic, no direct repo calls |
| `service/` | Business logic, transactions, authorization checks | No HTTP types (HttpRequest/Response) |
| `repository/` | Persistence access, JPQL/native queries | No business logic |
| `model/` | JPA entities, enums | No service/controller dependencies |
| `dto/` | API request/response shapes, Bean Validation annotations | No JPA annotations |
| `security/` | JWT filter, UserDetailsService | No business logic |
| `config/` | Spring configuration beans | Minimal logic |
| `util/` | Shared pure helpers | No business logic, no Spring context |
| `exception/` | Custom exceptions, global error handler | |
