# Repo Map

> **Last updated:** 2026-03-14 — All 7 phases complete (156 tasks)  
> Use this as the authoritative navigation guide for the repository.

---

## Top-Level Structure

```
TaskFlow Pro/
├── .ai/                    ← AI dev-kit: context, REPO_MAP, checklists, ADRs, phase plans
├── .github/workflows/      ← 8 CI/CD workflows (backend · frontend · e2e · deploy · k6 · jmeter · locust · perf-report)
├── backend/                ← Spring Boot 3.5 REST API (Java 21, Maven)
├── database/               ← Schema SQL + migration reference docs
├── docs/                   ← All source-of-truth documentation
├── frontend/               ← React 18 SPA (Vite + MUI v5 + Redux Toolkit)
├── infra/                  ← Docker · Kubernetes · Helm · Terraform (preferred infra home)
├── k8s/                    ← Kustomize base + overlays (alternative deployment)
├── monitoring/             ← Prometheus config + Grafana dashboards (auto-provisioned)
├── scripts/                ← Developer automation: setup.sh · build.sh · deploy.sh
├── terraform/              ← Terraform environments: dev/ and prod/
└── tests/                  ← API (Postman + REST) · E2E (Playwright) · Perf (k6 · JMeter · Gatling · Locust)
```

---

## Backend — File Map

```
backend/src/main/java/com/taskflow/
├── TaskflowApplication.java              ✅ @SpringBootApplication + @EnableScheduling
│
├── config/
│   ├── SecurityConfig.java               ✅ [B1-08] JWT stateless, CORS, CSRF off, public routes
│   ├── WebSocketConfig.java              ✅ STOMP over SockJS, /ws endpoint
│   ├── MdcTraceIdFilter.java             ✅ [K6-05] X-Trace-Id → MDC.traceId, echoed in response
│   └── RateLimitFilter.java              ✅ [B5-04/GAP-01] Bucket4j: 10/15min login · 5/hr register
│
├── controller/
│   ├── AuthController.java               ✅ [B1-10] POST /auth/register|login|refresh|logout
│   ├── UserController.java               ✅ [B3-11,B5-03] GET/PUT /users/me, PUT /users/me/password
│   ├── ProjectController.java            ✅ [B2-08,B2-09] CRUD + /members sub-resource
│   ├── TaskController.java               ✅ [B3-09] CRUD + GET /my-tasks + PATCH /:id/status
│   ├── CommentController.java            ✅ [B4-04] GET/POST tasks/{id}/comments, PUT/DELETE /comments/{id}
│   ├── NotificationController.java       ✅ [B4-10] GET /notifications, PATCH read/read-all
│   ├── ActivityController.java           ✅ [B4-15] GET /projects/{id}/activities, GET /tasks/{id}/activities
│   ├── DashboardController.java          ✅ [B5-01] GET /dashboard/summary (aggregation)
│   └── AttachmentController.java         ✅ POST/GET/DELETE /tasks/{id}/attachments
│
├── service/
│   ├── AuthService.java                  ✅ [B1-09] register · login · refreshToken · logout (revokes token)
│   ├── UserService.java                  ✅ [B3-11,B5-03] getCurrentUser · updateProfile · updatePassword
│   ├── ProjectService.java               ✅ [B2-05,B2-06,B2-07] CRUD · archive · member management
│   ├── TaskService.java                  ✅ [B3-04→B3-08] CRUD · status transitions · subtasks · time tracking
│   ├── CommentService.java               ✅ [B4-03] add/edit/delete · notify assignee+reporter
│   ├── NotificationService.java          ✅ [B4-08,B4-09,B4-11] notify · markRead · @Scheduled DUE_DATE_REMINDER
│   ├── ActivityService.java              ✅ [B4-14] logActivity · getProjectActivities · getTaskActivities
│   ├── AttachmentService.java            ✅ interface
│   ├── AttachmentServiceImpl.java        ✅ store/retrieve file attachments
│   ├── StorageService.java               ✅ storage abstraction interface
│   └── LocalStorageServiceImpl.java      ✅ local filesystem storage (dev profile)
│
├── repository/
│   ├── UserRepository.java               ✅ findByEmail · existsByEmail
│   ├── ProjectRepository.java            ✅ findAccessibleByUserId (owner OR member)
│   ├── ProjectMemberRepository.java      ✅ existsByProjectIdAndUserId · findByProjectIdAndUserId
│   ├── TaskRepository.java               ✅ filters · findDueTomorrow · countByProjectIdAndStatus
│   ├── CommentRepository.java            ✅ findByTaskIdOrderByCreatedAtAsc
│   ├── NotificationRepository.java       ✅ markAllReadByUserId · countUnreadByUserId
│   ├── RefreshTokenRepository.java       ✅ revokeByToken · revokeAllByUserId
│   ├── ActivityRepository.java           ✅ findByProjectIdOrderByCreatedAtDesc (paginated)
│   ├── SubtaskRepository.java            ✅ findByTaskId
│   └── AttachmentRepository.java         ✅ findByTaskId
│
├── model/
│   ├── User.java                         ✅ Role: ADMIN | MANAGER | MEMBER | VIEWER
│   ├── Project.java                      ✅ ProjectStatus: ACTIVE | ARCHIVED · ProjectVisibility: PUBLIC | PRIVATE
│   ├── Task.java                         ✅ TaskStatus: TODO→IN_PROGRESS→REVIEW→DONE · TaskPriority: LOW|MEDIUM|HIGH|CRITICAL
│   ├── ProjectMember.java                ✅ composite PK (project_id, user_id) · role
│   ├── RefreshToken.java                 ✅ token · expiresAt · isRevoked
│   ├── Comment.java                      ✅ content · author · task · isEdited
│   ├── Notification.java                 ✅ NotificationType enum · isRead · task/project refs
│   ├── Activity.java                     ✅ action · entityType · oldValue · newValue · metadata JSONB
│   ├── Subtask.java                      ✅ title · isCompleted · task
│   └── Attachment.java                   ✅ filename · contentType · size · storagePath
│
├── dto/
│   ├── request/                          ✅ 15 request DTOs (Bean Validation annotations)
│   │   LoginRequest · RegisterRequest · RefreshTokenRequest
│   │   CreateProjectRequest · UpdateProjectRequest · AddProjectMemberRequest · UpdateMemberRoleRequest
│   │   CreateTaskRequest · UpdateTaskRequest · UpdateTaskStatusRequest · CreateSubtaskRequest · LogTimeRequest
│   │   CreateCommentRequest · UpdateProfileRequest · UpdatePasswordRequest
│   └── response/                         ✅ 13 response DTOs
│       AuthResponse · UserResponse · ProjectResponse · MemberResponse
│       TaskResponse · SubtaskResponse · CommentResponse · NotificationResponse
│       ActivityResponse · DashboardSummaryResponse · AttachmentResponse · PagedResponse · Responses
│
├── security/
│   ├── JwtTokenProvider.java             ✅ [B1-06] HS512 · access token 15min · refresh 7 days
│   ├── JwtAuthFilter.java                ✅ [B1-07] OncePerRequestFilter · stateless Bearer extraction
│   └── UserDetailsServiceImpl.java       ✅ [B1-08] loadByEmail · checks isActive flag
│
└── exception/
    ├── GlobalExceptionHandler.java       ✅ [B1-11] 400/401/403/404/409/422/500 → standard JSON
    ├── ResourceNotFoundException.java    ✅ 404
    ├── UnauthorizedException.java        ✅ 401
    ├── ConflictException.java            ✅ 409
    ├── ForbiddenException.java           ✅ 403
    └── InvalidStatusTransitionException.java  ✅ 422
```

```
backend/src/main/resources/
├── application.yml                       ✅ dev + prod profiles · Flyway repair-on-migrate
│                                            Base64 JWT secret · HikariCP pool · Actuator groups
│                                            liveness/readiness health endpoint split
├── application-perf.yml                  ✅ [PT-DT-04] HikariCP pool=50 · slow-query 200ms logging
└── db/migration/
    ├── V1__create_users_table.sql        ✅ UUID PK · email UNIQUE · role · is_active
    ├── V2__create_projects_table.sql     ✅ status · visibility · owner_id FK
    ├── V3__create_project_members_table.sql  ✅ composite unique (project_id, user_id)
    ├── V4__create_tasks_table.sql        ✅ status · priority · tags[] · assignee/reporter FK
    ├── V5__create_comments_table.sql     ✅ task_id FK · author_id FK · is_edited
    ├── V6__create_notifications_table.sql ✅ type · is_read · partial index on unread
    ├── V7__create_activities_table.sql   ✅ action · old_value · new_value · metadata JSONB
    ├── V8__create_refresh_tokens_table.sql ✅ token · expires_at · is_revoked
    ├── V9__create_indexes.sql            ✅ composite + partial indexes
    ├── V10__create_attachments_table.sql ✅ filename · content_type · size · storage_path
    ├── V11__create_subtasks_time_tracking.sql  ✅ subtasks table + estimated/logged hours on tasks
    └── V12__seed_test_data.sql           ✅ 10 users · 3 projects · 10 tasks · comments
```

```
backend/src/test/
├── java/com/taskflow/
│   ├── AuthServiceTest.java              ✅ [B1-12,T6] 6 tests: register · login · refresh · inactive · bad-creds
│   ├── TaskServiceTest.java              ✅ [T6-02] 15 tests: CRUD · status transitions · role guards · subtasks
│   ├── CommentServiceTest.java           ✅ [T6-03] 7 tests: add/edit/delete · author/manager authorization
│   ├── NotificationServiceTest.java      ✅ [T6-03] 8 tests: notify · markRead · markAll · scheduled job
│   ├── ActivityServiceTest.java          ✅ [T6-03] 9 tests: logActivity · project/task feeds · pagination
│   └── AttachmentServiceTest.java        ✅ attachment CRUD unit tests
├── integration/com/taskflow/integration/
│   ├── AuthControllerIT.java             ✅ [T6-01] 10 Testcontainers tests: full auth lifecycle with real PostgreSQL
│   └── ProjectTaskControllerIT.java      ✅ [T6-04] 14 Testcontainers tests: project CRUD · task lifecycle · comments
└── resources/
    └── application-integration-test.yml  ✅ Testcontainers datasource override · flyway repair-on-migrate
```

---

## Frontend — File Map

```
frontend/src/
├── main.jsx                             ✅ Redux Provider · BrowserRouter · MUI ThemeProvider · SnackbarProvider
├── App.jsx                              ✅ [F1-07,F5-08] Lazy-loaded routes · Suspense fallback
│
├── pages/
│   ├── LoginPage.jsx                    ✅ data-testid: email-input · password-input · login-button
│   ├── RegisterPage.jsx                 ✅ Password strength bar · confirm password · terms checkbox
│   ├── DashboardPage.jsx                ✅ 4 stat cards · MyTasksWidget · RecentActivityWidget · MyProjectsGrid
│   ├── ProjectListPage.jsx              ✅ 3-col grid · status filter chips · search · + New Project
│   ├── ProjectDetailPage.jsx            ✅ Board / List / Members / Activity tabs
│   ├── TaskDetailPage.jsx               ✅ Inline edit · 70/30 layout · sidebar metadata · CommentSection
│   ├── MyTasksPage.jsx                  ✅ Board/List toggle · filtered to me
│   ├── ProfilePage.jsx                  ✅ Personal info · change password
│   └── NotFoundPage.jsx                 ✅ 404 page
│
├── components/
│   ├── auth/ProtectedRoute.jsx          ✅ Redirect to /login if !isAuthenticated
│   ├── shared/
│   │   ├── Layout.jsx                   ✅ NavBar + Sidebar + Outlet
│   │   ├── NavBar.jsx                   ✅ Logo · nav links · NotificationBell · user avatar menu
│   │   ├── Sidebar.jsx                  ✅ Icon-only tablet · expanded desktop · drawer mobile
│   │   └── ActivityFeed.jsx             ✅ Reusable · avatar + action + timestamp · load-more
│   ├── dashboard/StatCard.jsx           ✅ Icon · label · value · optional trend indicator
│   ├── projects/
│   │   ├── ProjectCard.jsx              ✅ Status badge · progress bar · member avatars · kebab menu
│   │   ├── CreateProjectModal.jsx       ✅ MUI Dialog · name · description · visibility toggle
│   │   └── ProjectMembersPanel.jsx      ✅ Invite by email · role selector · remove member (MANAGER only)
│   ├── tasks/
│   │   ├── BoardView.jsx                ✅ 4 columns · WebSocket subscription · horizontal scroll
│   │   ├── TaskCard.jsx                 ✅ Priority color strip · data-priority attr · tags · due date · avatar
│   │   ├── CreateTaskDialog.jsx         ✅ Title · description · priority · assignee · due date · tags
│   │   ├── ListView.jsx                 ✅ MUI DataGrid · sortable columns
│   │   ├── CommentSection.jsx           ✅ 30s poll · edit/delete own · author avatar
│   │   ├── SubtaskList.jsx              ✅ Checklist · toggle · delete · progress bar
│   │   ├── TimeTracker.jsx              ✅ Log hours · estimated vs logged · overtime indicator
│   │   └── FileUploadZone.jsx           ✅ react-dropzone · upload state
│   └── notifications/
│       └── NotificationBell.jsx         ✅ Badge unreadCount · Popover dropdown · 60s poll · WebSocket
│
├── store/
│   ├── index.js                         ✅ configureStore: auth · projects · tasks · notifications · ui
│   └── slices/
│       ├── authSlice.js                 ✅ loginUser · registerUser · logoutUser · refreshAccessToken thunks
│       ├── projectsSlice.js             ✅ fetchProjects · createProject · updateProject · deleteProject
│       ├── tasksSlice.js                ✅ byStatus groups · optimisticStatusUpdate · revertStatusUpdate
│       ├── notificationsSlice.js        ✅ fetchNotifications · markNotificationRead · markAllNotificationsRead
│       └── uiSlice.js                   ✅ sidebarOpen · globalLoading
│
├── services/
│   ├── api.js                           ✅ Axios instance · Bearer interceptor · 401 refresh queue
│   ├── authService.js                   ✅ login · register · logout · refreshToken · getMe
│   ├── projectService.js                ✅ CRUD · members · activities
│   ├── taskService.js                   ✅ CRUD · status · subtasks · time · comments · notifications · attachments
│   ├── commentService.js                ✅ getComments · createComment · updateComment · deleteComment
│   └── notificationService.js           ✅ getNotifications · markAsRead · markAllAsRead
│
├── hooks/
│   └── useWebSocket.js                  ✅ STOMP/SockJS client · auto-connect on auth · subscribe/unsubscribe
│
└── __tests__/  (Vitest + React Testing Library)
    ├── LoginPage.test.jsx               ✅ [T6-08] 3 tests: fields · button · register link
    ├── TaskCard.test.jsx                ✅ [T6-08] 3 tests: title · data-priority attr · tag chips
    ├── BoardView.test.jsx               ✅ [T6-08] 2 tests: 4 columns · tasks in columns
    │                                       (useWebSocket + sockjs + @stomp/stompjs mocked)
    └── NotificationBell.test.jsx        ✅ [T6-08] 2 tests: bell icon · badge unread count

Component tests (co-located with source):
    components/tasks/FileUploadZone.test.jsx    ✅ 2 tests
    components/tasks/SubtaskList.test.jsx       ✅ 4 tests
    components/tasks/TimeTracker.test.jsx       ✅ 3 tests
```

---

## Tests — File Map

```
tests/
├── api/
│   ├── postman/
│   │   └── TaskflowPro.postman_collection.json  ✅ ~98 test cases (Auth · Projects · Tasks · Comments · Notifs)
│   └── rest-client/
│       ├── api-tests.http                        ✅ VS Code REST Client requests
│       └── taskflow.http                         ✅ Convenience .http file
│
├── e2e/playwright/
│   ├── playwright.config.ts             ✅ globalSetup · retries · HTML reporter · 30s timeout
│   ├── global-setup.ts                  ✅ Polls /actuator/health · seeds e2e-test@taskflow.com
│   ├── full-journey.spec.js             ✅ Complete journey: register→project→task→comment→notification
│   └── tests/
│       ├── taskflow.spec.ts             ✅ Auth (5) · Projects (2) · Tasks (2) · Notifications (3)
│       ├── tasks.spec.ts                ✅ Task CRUD · status transitions
│       ├── projects.spec.ts             ✅ Project CRUD · members
│       ├── dashboard.spec.ts            ✅ Dashboard widgets
│       ├── notifications.spec.ts        ✅ Bell · dropdown · mark-all-read
│       ├── profile.spec.ts              ✅ Profile edit · change password
│       ├── responsive.spec.ts           ✅ Mobile viewport · drawer · board scroll
│       └── advanced-features.spec.ts   ✅ Subtasks · time tracking · file uploads
│
└── performance/
    ├── k6/                              ✅ [PT-K6] PRIMARY — runs in CI on every PR and main merge
    │   ├── config/thresholds.js         ✅ [PT-K6-08] Shared SLA: P95<300ms · P99<800ms · error<1%
    │   ├── smoke.js                     ✅ [PT-K6-01] 5 VU · 30s · every PR gate
    │   ├── load_test.js                 ✅ [PT-K6-02] 0→500 VU · 15min · mixed 60/30/10 workload
    │   ├── stress_test.js               ✅ [PT-K6-03] 0→1500 VU · find ceiling (weekly)
    │   ├── spike_test.js                ✅ [PT-K6-04] 0→1000 in 10s · recovery ≤30s (weekly)
    │   ├── auth_flow.js                 ✅ [PT-K6-05] JWT lifecycle: register→login→refresh→logout
    │   ├── board_scenario.js            ✅ [PT-K6-06] Full board: load→create→comment→status moves
    │   ├── notification_spike.js        ✅ [PT-K6-07] Fan-out: 500 users polling simultaneously
    │   └── rps_test.js                  ✅ [PT-K6-10] Constant-arrival-rate · 300 rps · throughput validation
    │
    ├── jmeter/                          ✅ [PT-JM] Load + Soak
    │   ├── TaskFlowPro.jmx              ✅ [PT-JM-01–05] 300 threads · CSV auth · full task lifecycle
    │   ├── Soak_24h.jmx                 ✅ [PT-JM-06] 100 threads · 24 hours · health assertion
    │   ├── generate-report.sh           ✅ [PT-JM-08] jmeter -g → HTML dashboard + Python summary
    │   └── data/generate-test-users.py  ✅ [PT-JM-10] 500 users CSV + API registration
    │
    ├── gatling/                         ✅ [PT-GA] High-concurrency stress (Scala DSL)
    │   ├── src/test/scala/taskflow/
    │   │   ├── LoadSimulation.scala     ✅ [PT-GA-01/02] 300 VU · 3 weighted scenarios · 10min
    │   │   └── StressSimulation.scala   ✅ [PT-GA-03/04] Step-ramp to 1000 VU · recovery watch
    │   ├── build.sbt                    ✅ [PT-GA-05] sbt + GatlingPlugin
    │   └── pom.xml                      ✅ [PT-GA-06] Maven + Gatling plugin (alternative build)
    │
    ├── locust/                          ✅ [PT-LO] Python — Stress · Spike · Soak
    │   ├── locustfile.py                ✅ [PT-LO-01/02] Weighted tasks · threshold hook on quitting
    │   ├── soak_locustfile.py           ✅ [PT-LO-05] 8h soak · auto token-refresh · health polling
    │   ├── locust.conf                  ✅ [PT-LO-09] Default config (override with CLI)
    │   └── tasks/__init__.py            ✅ Task module stub
    │
    ├── scripts/                         ✅ Shared perf infrastructure
    │   ├── seed-perf-data.sql           ✅ [PT-DT-01] 50 users · 5 projects · 200 tasks · 100 comments (idempotent)
    │   ├── reset-perf-db.sh             ✅ [PT-DT-03] Truncate + re-seed all @perf.test data
    │   └── regression_check.py          ✅ [PT-RP-05] P95 vs baseline · fail if >20% drift · PR comment
    │
    ├── reports/
    │   └── generate-perf-report.py      ✅ [PT-RP-03] k6 JSON + JMeter JTL + Gatling log + Locust CSV → HTML
    │
    └── baselines/
        └── perf-baseline.json           ✅ [PT-DT-05] P95 per endpoint at 500 VUs (regression gate)
```

---

## Infra — File Map

```
infra/
├── docker/
│   ├── docker-compose.dev.yml           ✅ [D6-03] backend · frontend · postgres · redis
│   │                                       context: ../.. (repo root) · Base64 JWT secret
│   ├── docker-compose.perf.yml          ✅ [PT-DT-02] InfluxDB 2.7 + Grafana-perf (port 3001)
│   │                                       Extends dev stack · unified metrics sink for all 4 perf tools
│   ├── docker-compose.yml               ✅ Minimal production reference
│   ├── nginx.conf                        ✅ SPA fallback · API proxy · gzip · security headers · cache
│   └── dockerfiles/
│       ├── Dockerfile.backend           ✅ [D6-01] Maven builder → Eclipse Temurin 21 JRE · non-root user
│       └── Dockerfile.frontend          ✅ [D6-02] Node build → nginx:alpine · infra/docker/nginx.conf path
│
├── helm/taskflow-chart/
│   ├── Chart.yaml                       ✅ chart version · app version
│   └── values.yaml                      ✅ image tags · replicas · resource limits · ingress
│
├── kubernetes/
│   ├── backend-deployment.yaml          ✅ [K6-01] 2 replicas · HPA min2/max10/CPU70% · startup/liveness/readiness probes
│   │                                       Prometheus annotations · JAVA_OPTS G1GC · resource limits
│   ├── frontend-deployment.yaml         ✅ [K6-02] 2 replicas · readiness/liveness probes · resource limits
│   ├── ingress.yaml                     ✅ [K6-02] TLS cert-manager · HTTPS redirect · rate-limit annotations
│   └── services.yaml                    ✅ ClusterIP services for backend and frontend
│
└── terraform/aws/                       ✅ EKS · RDS PostgreSQL · VPC config
```

---

## Monitoring — File Map

```
monitoring/
├── prometheus/
│   └── prometheus.yml                   ✅ [K6-03] 15s scrape · Kubernetes SD · /actuator/prometheus
└── grafana/
    ├── dashboards/
    │   └── taskflow-api.json            ✅ [K6-04] 12 panels: request rate · P50/P95/P99 · 4xx/5xx
    │                                       JVM heap/non-heap · GC pause · HikariCP pool · threads · CPU
    └── provisioning/
        ├── datasources/prometheus.yml   ✅ Auto-provision Prometheus at http://prometheus:9090 (isDefault)
        └── dashboards/dashboard.yml     ✅ Auto-load from /var/lib/grafana/dashboards (updateInterval 30s)
```

---

## GitHub Actions Workflows

```
.github/workflows/
├── backend-ci.yml       ✅ [CI6-01] PR + main push · Java 21 · mvn test → integration test → JaCoCo ≥80% → Codecov
├── frontend-ci.yml      ✅ [CI6-02] PR + main push · Node 20 · npm ci → lint → test → build
├── e2e-tests.yml        ✅ [CI6-03] main merge · docker-compose up → health wait → Playwright → trace artifact
├── deploy.yml           ✅ [CI6-04] main merge · ECR push (backend + frontend) → EKS rolling update → smoke test
├── k6-load.yml          ✅ [PT-K6-09] PR→smoke(2min) · main merge→load(15min) · dispatch→stress+spike
├── jmeter-ci.yml        ✅ [PT-JM-09] main merge · JMeter 5.6.3 · 300 threads · error gate → HTML artifact
├── locust-ci.yml        ✅ load on main merge (10min) · 8h soak on weekly Sunday 02:00 UTC cron
└── perf-report.yml      ✅ [PT-RP-04] After all perf jobs · unified HTML report · regression check → PR comment
```

---

## Scripts

```
scripts/
├── setup.sh             ✅ [D6-05] Check Docker · pull images · compose up · health wait · seed demo user
│                           Outputs: frontend http://localhost:80 · Swagger http://localhost:8080/swagger-ui.html
├── build.sh             ✅ Build backend (mvn package) + frontend (npm run build)
└── deploy.sh            ✅ kubectl apply + rollout status watch
```

---

## Backend Architecture Rules

| Layer | Responsibility | Invariants |
|-------|---------------|------------|
| `controller/` | HTTP I/O · input validation · DTO mapping | No business logic · no direct repo calls |
| `service/` | Business logic · transactions · authorization checks | No HttpRequest/Response types |
| `repository/` | Persistence · JPQL/native queries | No business logic |
| `model/` | JPA entities · enums | No service/controller dependencies |
| `dto/` | Request/response shapes · Bean Validation | No JPA annotations |
| `security/` | JWT filter · UserDetailsService | No business logic |
| `config/` | Spring `@Configuration` · filters | Minimal logic |
| `exception/` | Custom exceptions · GlobalExceptionHandler | |

---

## Key Configuration Facts

| Setting | Value | Location |
|---------|-------|----------|
| JWT algorithm | HS512 | `JwtTokenProvider.java` |
| Access token lifetime | 15 minutes | `application.yml: app.jwt.access-token-expiry-ms` |
| Refresh token lifetime | 7 days | `application.yml: app.jwt.refresh-token-expiry-ms` |
| JWT secret (default dev) | Base64 of 64-char string | `application.yml` (override via `JWT_SECRET` env var) |
| BCrypt strength | 12 | `SecurityConfig.java` |
| Rate limit — login | 10 req / 15 min per IP | `RateLimitFilter.java` |
| Rate limit — register | 5 req / hr per IP | `RateLimitFilter.java` |
| HikariCP pool (dev/prod) | max 20 | `application.yml` |
| HikariCP pool (perf) | max 50 | `application-perf.yml` |
| Flyway | repair-on-migrate + baseline-on-migrate | `application.yml` |
| API base path | `/api/v1` | `SecurityConfig.java` |
| WebSocket endpoint | `/ws` (SockJS) | `WebSocketConfig.java` |
| CORS allowed origin | `http://localhost:5173` (dev) | `application.yml: app.cors.allowed-origins` |
| Swagger UI | `http://localhost:8080/swagger-ui.html` | Springdoc auto-config |
| Actuator liveness | `/actuator/health/liveness` | `application.yml` |
| Actuator readiness | `/actuator/health/readiness` | `application.yml` |
| Prometheus metrics | `/actuator/prometheus` | `application.yml` |
| Trace ID header | `X-Trace-Id` | `MdcTraceIdFilter.java` |

---

## Performance Test Quick Reference

| Tool | Script | Test Type | Run Command |
|------|--------|-----------|-------------|
| k6 | `k6/smoke.js` | Smoke | `k6 run smoke.js --env BASE_URL=http://localhost:8080` |
| k6 | `k6/load_test.js` | Load | `k6 run load_test.js --env BASE_URL=...` |
| k6 | `k6/stress_test.js` | Stress | `k6 run stress_test.js --env BASE_URL=...` |
| k6 | `k6/spike_test.js` | Spike | `k6 run spike_test.js --env BASE_URL=...` |
| JMeter | `jmeter/TaskFlowPro.jmx` | Load | `jmeter -n -t TaskFlowPro.jmx -JBASE_URL=...` |
| JMeter | `jmeter/Soak_24h.jmx` | Soak | `jmeter -n -t Soak_24h.jmx -JDURATION=86400` |
| Gatling | `LoadSimulation.scala` | Load | `mvn gatling:test -Dgatling.simulationClass=taskflow.LoadSimulation` |
| Gatling | `StressSimulation.scala` | Stress | `mvn gatling:test -Dgatling.simulationClass=taskflow.StressSimulation` |
| Locust | `locustfile.py` | Load/Stress/Spike | `locust -f locustfile.py --host=... --users=500 --headless` |
| Locust | `soak_locustfile.py` | Soak | `locust -f soak_locustfile.py --users=50 --run-time=8h --headless` |
