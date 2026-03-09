# Repo Map

## Top-Level Structure

```
TaskFlow Pro/
├── .ai/                    ← AI-assisted dev kit (context, workflows, checklists)
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
├── TaskflowApplication.java              ✅ EXISTS
│
├── config/
│   ├── SecurityConfig.java               ✅ EXISTS  [B1-08]
│   ├── JwtConfig.java                    🔲 CREATE  [B1-06]
│   ├── CorsConfig.java                   🔲 CREATE  [B1-08]
│   └── OpenApiConfig.java                🔲 CREATE  [B5-05]
│
├── controller/
│   ├── AuthController.java               ✅ EXISTS  [B1-10]
│   ├── UserController.java               🔲 CREATE  [B3-11, B5-03]
│   ├── ProjectController.java            🔲 CREATE  [B2-08, B2-09]
│   ├── TaskController.java               ✅ EXISTS  [B3-09]
│   ├── CommentController.java            🔲 CREATE  [B4-04]
│   ├── NotificationController.java       🔲 CREATE  [B4-10]
│   ├── ActivityController.java           🔲 CREATE  [B4-15]
│   └── DashboardController.java          🔲 CREATE  [B5-01]
│
├── service/
│   ├── AuthService.java                  ✅ EXISTS  [B1-09]
│   ├── UserService.java                  🔲 CREATE  [B3-11, B5-03]
│   ├── ProjectService.java               🔲 CREATE  [B2-05, B2-06, B2-07]
│   ├── TaskService.java                  ✅ EXISTS  [B3-04 → B3-08]
│   ├── CommentService.java               🔲 CREATE  [B4-03]
│   ├── NotificationService.java          🔲 CREATE  [B4-08, B4-09, B4-11]
│   └── ActivityService.java              🔲 CREATE  [B4-14]
│
├── repository/
│   ├── UserRepository.java               ✅ EXISTS  [B1-04]
│   ├── ProjectRepository.java            🔲 CREATE  [B2-03]
│   ├── ProjectMemberRepository.java      🔲 CREATE  [B2-04]
│   ├── TaskRepository.java               ✅ EXISTS  [B3-03]
│   ├── CommentRepository.java            🔲 CREATE  [B4-02]
│   ├── NotificationRepository.java       🔲 CREATE  [B4-07]
│   ├── RefreshTokenRepository.java       🔲 CREATE  [B1-05]
│   └── ActivityRepository.java           🔲 CREATE  [B4-13]
│
├── model/
│   ├── User.java                         ✅ EXISTS  [B1-04]
│   ├── Project.java                      ✅ EXISTS  [B2-03]
│   ├── Task.java                         ✅ EXISTS  [B3-02]
│   ├── DomainModels.java                 ✅ EXISTS  [B1-05, B2-04, B4-02, B4-07, B4-13]
│   └── enums/
│       ├── Role.java                     🔲 CREATE  (ADMIN, MANAGER, MEMBER, VIEWER)
│       ├── TaskStatus.java               🔲 CREATE  (TODO, IN_PROGRESS, REVIEW, DONE)
│       ├── TaskPriority.java             🔲 CREATE  (LOW, MEDIUM, HIGH, CRITICAL)
│       └── ProjectStatus.java            🔲 CREATE  (ACTIVE, ON_HOLD, COMPLETED, ARCHIVED)
│
├── dto/
│   ├── request/
│   │   └── Requests.java                 ✅ EXISTS  [B1-10, B2-10, B3-10, B4-05]
│   └── response/
│       └── Responses.java                ✅ EXISTS  [B2-10, B3-10, B4-05]
│
├── security/
│   ├── JwtTokenProvider.java             ✅ EXISTS  [B1-06]
│   ├── JwtAuthFilter.java                ✅ EXISTS  [B1-07]
│   └── UserDetailsServiceImpl.java       🔲 CREATE  [B1-08]
│
└── exception/
    ├── GlobalExceptionHandler.java       ✅ EXISTS  [B1-11]
    ├── ResourceNotFoundException.java    ✅ EXISTS
    ├── UnauthorizedException.java        ✅ EXISTS
    └── ValidationException.java          🔲 CREATE
```

```
backend/src/main/resources/
├── application.yml                       ✅ EXISTS  [B1-03]
└── db/migration/
    ├── V1__create_users_table.sql        🔲 CREATE  [B1-01]
    ├── V2__create_projects_table.sql     🔲 CREATE  [B2-01]
    ├── V3__create_project_members_table.sql  🔲 CREATE  [B2-02]
    ├── V4__create_tasks_table.sql        🔲 CREATE  [B3-01]
    ├── V5__create_comments_table.sql     🔲 CREATE  [B4-01]
    ├── V6__create_notifications_table.sql 🔲 CREATE  [B4-06]
    ├── V7__create_activities_table.sql   🔲 CREATE  [B4-12]
    ├── V8__create_refresh_tokens_table.sql 🔲 CREATE  [B1-02]
    └── V9__create_indexes.sql            🔲 CREATE  [D6-04]
```

```
backend/src/test/
├── java/com/taskflow/
│   └── AuthServiceTest.java             ✅ EXISTS  [B1-12]
│   ProjectServiceTest.java              🔲 CREATE  [T6-02]
│   TaskServiceTest.java                 🔲 CREATE  [T6-02]
│   CommentServiceTest.java              🔲 CREATE  [T6-03]
│   NotificationServiceTest.java         🔲 CREATE  [T6-03]
│   ActivityServiceTest.java             🔲 CREATE  [T6-03]
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
├── main.jsx                             🔲 CREATE  [F1-01]
├── App.jsx                              ✅ EXISTS  [F1-07, F5-08]
│
├── pages/
│   ├── LoginPage.jsx                    ✅ EXISTS  [F1-05]
│   ├── RegisterPage.jsx                 🔲 CREATE  [F1-06]
│   ├── DashboardPage.jsx                🔲 CREATE  [F5-01]
│   ├── ProjectListPage.jsx              🔲 CREATE  [F2-03]
│   ├── ProjectDetailPage.jsx            🔲 CREATE  [F2-06, F4-06]
│   ├── TaskDetailPage.jsx               🔲 CREATE  [F3-07]
│   ├── MyTasksPage.jsx                  🔲 CREATE  [F3-09]
│   └── ProfilePage.jsx                  🔲 CREATE  [F5-06]
│
├── components/
│   ├── auth/
│   │   └── ProtectedRoute.jsx           ✅ EXISTS  [F1-07]
│   ├── shared/
│   │   ├── Layout.jsx                   ✅ EXISTS  [F1-08, F5-07, F5-11]
│   │   ├── NavBar.jsx                   ✅ EXISTS  [F1-08, F4-03]
│   │   ├── ActivityFeed.jsx             🔲 CREATE  [F4-05]
│   │   └── ToastProvider.jsx            🔲 CREATE  [F5-13]
│   ├── projects/
│   │   ├── ProjectCard.jsx              🔲 CREATE  [F2-04]
│   │   ├── CreateProjectModal.jsx       🔲 CREATE  [F2-05]
│   │   └── ProjectMembersPanel.jsx      🔲 CREATE  [F2-07]
│   ├── tasks/
│   │   ├── BoardView.jsx                🔲 CREATE  [F3-03]
│   │   ├── TaskCard.jsx                 🔲 CREATE  [F3-04, F3-08]
│   │   ├── CreateTaskDialog.jsx         🔲 CREATE  [F3-05]
│   │   ├── ListView.jsx                 🔲 CREATE  [F3-06]
│   │   └── CommentSection.jsx           🔲 CREATE  [F4-01]
│   ├── notifications/
│   │   └── NotificationDropdown.jsx     🔲 CREATE  [F4-04]
│   └── dashboard/
│       ├── StatCard.jsx                 🔲 CREATE  [F5-02]
│       ├── MyTasksWidget.jsx            🔲 CREATE  [F5-03]
│       ├── RecentActivityWidget.jsx     🔲 CREATE  [F5-04]
│       └── MyProjectsGrid.jsx           🔲 CREATE  [F5-05]
│
├── store/
│   ├── index.js                         ✅ EXISTS  [F1-02]
│   └── slices/
│       ├── authSlice.js                 ✅ EXISTS  [F1-02]
│       ├── projectsSlice.js             🔲 CREATE  [F2-02]
│       ├── tasksSlice.js                🔲 CREATE  [F3-02]
│       ├── notificationsSlice.js        🔲 CREATE  [F4-07]
│       └── uiSlice.js                   🔲 CREATE  [F5-01]
│
├── services/
│   ├── api.js                           ✅ EXISTS  [F1-03]
│   ├── authService.js                   ✅ EXISTS  [F1-04]
│   ├── projectService.js                🔲 CREATE  [F2-01]
│   ├── taskService.js                   ✅ EXISTS  [F3-01]
│   ├── commentService.js                🔲 CREATE  [F4-02]
│   └── notificationService.js           🔲 CREATE  [F4-02]
│
├── hooks/
│   ├── useAuth.js                       🔲 CREATE
│   ├── useProjects.js                   🔲 CREATE
│   ├── useTasks.js                      🔲 CREATE
│   └── useNotifications.js              🔲 CREATE
│
└── utils/
    ├── constants.js                     🔲 CREATE  (API routes, status enums)
    ├── dateUtils.js                     🔲 CREATE
    └── validators.js                    🔲 CREATE
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
│           └── taskflow.spec.ts         ✅ EXISTS  [T6-05]
└── performance/
    └── k6-tests/
        └── load-test.js                 🔲 CREATE  [T6-06]
```

---

## Infra — File Map

```
infra/
├── docker/
│   ├── docker-compose.dev.yml           ✅ EXISTS  [D6-03]
│   ├── docker-compose.yml               ✅ EXISTS
│   └── dockerfiles/
│       ├── Dockerfile.backend           ✅ EXISTS  [D6-01]
│       └── Dockerfile.frontend          ✅ EXISTS  [D6-02]
├── helm/
│   └── taskflow-chart/
│       ├── Chart.yaml                   ✅ EXISTS
│       └── values.yaml                  ✅ EXISTS
└── kubernetes/
    ├── backend-deployment.yaml          ✅ EXISTS  [K6-01]
    ├── frontend-deployment.yaml         ✅ EXISTS  [K6-02]
    ├── ingress.yaml                     ✅ EXISTS  [K6-02]
    └── services.yaml                    ✅ EXISTS
```

---

## GitHub Actions — Workflows

```
.github/workflows/
├── backend-ci.yml                       ✅ EXISTS  [CI6-01]
├── frontend-ci.yml                      ✅ EXISTS  [CI6-02]
├── e2e-tests.yml                        ✅ EXISTS  [CI6-03]
└── deploy.yml                           ✅ EXISTS  [CI6-04]
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
