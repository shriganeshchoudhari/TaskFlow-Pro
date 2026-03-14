# TaskFlow Pro — Technical Design Document (TTD)

**Version:** 2.0.0 *(updated 2026-03-14 — Phase 6/7 additions: rate limiting, MDC tracing, perf testing stack)*  
**Date:** 2026-03-14  
**Author:** Architecture Team  
**Status:** Approved — All 7 phases implemented

---

## Table of Contents
1. [Architecture Overview](#1-architecture-overview)
2. [System Components](#2-system-components)
3. [Backend Module Design](#3-backend-module-design)
4. [Frontend Module Design](#4-frontend-module-design)
5. [DevOps Architecture](#5-devops-architecture)
6. [Data Flow Diagrams](#6-data-flow-diagrams)
7. [Technology Decisions](#7-technology-decisions)
8. [Security Architecture](#8-security-architecture)

---

## 1. Architecture Overview

TaskFlow Pro follows a **Clean Architecture** approach with clear separation of concerns across all layers. The system is composed of three primary tiers: a React SPA frontend, a Spring Boot REST API backend, and a PostgreSQL relational database.

### 1.1 High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                           CLIENT TIER                                │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │              React SPA (Vite + Redux Toolkit + MUI)          │   │
│  │   ┌─────────┐  ┌──────────┐  ┌──────────┐  ┌───────────┐   │   │
│  │   │  Pages  │  │Components│  │  Store   │  │ Services  │   │   │
│  │   └─────────┘  └──────────┘  └──────────┘  └───────────┘   │   │
│  └──────────────────────────────────────────────────────────────┘   │
└────────────────────────────┬────────────────────────────────────────┘
                             │ HTTPS / REST API
┌────────────────────────────▼────────────────────────────────────────┐
│                          API GATEWAY / INGRESS                       │
│              (Nginx Ingress Controller on Kubernetes)                │
└────────────────────────────┬────────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────────┐
│                         APPLICATION TIER                             │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │              Spring Boot REST API (Java 21)                  │    │
│  │  ┌───────────┐  ┌───────────┐  ┌──────────────────────┐    │    │
│  │  │Controllers│  │ Services  │  │ Repositories (JPA)   │    │    │
│  │  └───────────┘  └───────────┘  └──────────────────────┘    │    │
│  │  ┌───────────┐  ┌───────────┐  ┌──────────────────────┐    │    │
│  │  │  Security │  │    DTOs   │  │  Domain Models       │    │    │
│  │  └───────────┘  └───────────┘  └──────────────────────┘    │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                   Kubernetes Pods (HPA: 2–10)                │   │
│  └──────────────────────────────────────────────────────────────┘   │
└────────────────────────────┬────────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────────┐
│                           DATA TIER                                  │
│  ┌────────────────────────┐    ┌────────────────────────────────┐   │
│  │  PostgreSQL (AWS RDS)  │    │   Redis Cache (ElastiCache)    │   │
│  │  Primary + Read Replica│    │   (Refresh tokens, sessions)   │   │
│  └────────────────────────┘    └────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                       OBSERVABILITY                                  │
│   Prometheus ──► Grafana    │    AWS CloudWatch    │    ELK Stack   │
└─────────────────────────────────────────────────────────────────────┘
```

### 1.2 Deployment Architecture

```
                          ┌──────────────────────┐
                          │     Route 53 (DNS)   │
                          └──────────┬───────────┘
                                     │
                          ┌──────────▼───────────┐
                          │  AWS ALB (HTTPS/443)  │
                          └──────────┬───────────┘
                                     │
                    ┌────────────────▼────────────────────┐
                    │       EKS Cluster (us-east-1)        │
                    │  ┌─────────────┐  ┌──────────────┐  │
                    │  │  Node Group │  │  Node Group  │  │
                    │  │  (app-tier) │  │ (monitoring) │  │
                    │  └──────┬──────┘  └──────┬───────┘  │
                    │         │                │           │
                    │  ┌──────▼──────┐  ┌──────▼───────┐  │
                    │  │ App Pods    │  │ Prometheus   │  │
                    │  │ (2-10 rep.) │  │ Grafana      │  │
                    │  └─────────────┘  └──────────────┘  │
                    └────────────────┬────────────────────┘
                                     │
                          ┌──────────▼───────────┐
                          │    AWS RDS PostgreSQL │
                          │  (Multi-AZ, Encrypted)│
                          └──────────────────────┘
```

---

## 2. System Components

### 2.1 Component Inventory

| Component | Technology | Responsibility |
|-----------|-----------|----------------|
| Frontend SPA | React 18, Vite 5, Redux Toolkit | User interface, state management |
| REST API | Spring Boot 3.x, Java 21 | Business logic, data access, security |
| Database | PostgreSQL 16 (AWS RDS) | Persistent data storage |
| Rate Limiting | Bucket4j (in-process) | Token-bucket rate limiting on auth endpoints (no Redis needed) |
| Container Runtime | Docker 24 | Application containerization |
| Orchestration | Kubernetes 1.28 (EKS) | Deployment, scaling, service discovery |
| Package Manager | Helm 3 | Kubernetes manifest templating |
| IaC | Terraform 1.6 | Cloud infrastructure provisioning |
| CI/CD | GitHub Actions | Automated build, test, deploy pipeline |
| Monitoring | Prometheus + Grafana | Metrics collection and visualization |
| Ingress | Nginx Ingress Controller | TLS termination, routing |

### 2.2 Inter-Service Communication

```
Frontend (80/443)
    │── REST API / WebSocket (STOMP) ──► Backend API (:8080)
                                          │── JPA/JDBC ──► PostgreSQL (:5432)
                                          │── Spring Actuator ──► Prometheus (:9090)
                                          │                          └── Grafana (:3000)
                                          └── MdcTraceIdFilter injects traceId into all log lines

Per-request middleware chain (Spring filter order):
  MdcTraceIdFilter (order 1) → RateLimitFilter (order 2) → JwtAuthFilter → SecurityConfig
```

---

## 3. Backend Module Design

### 3.1 Package Structure

```
com.taskflow
├── TaskflowApplication.java            # @SpringBootApplication + @EnableScheduling
├── config/
│   ├── SecurityConfig.java             # Spring Security + JWT filter chain, CORS, CSRF
│   ├── WebSocketConfig.java            # STOMP over SockJS at /ws
│   ├── MdcTraceIdFilter.java           # [Phase 6] Injects X-Trace-Id into MDC + response header
│   └── RateLimitFilter.java            # [Phase 5] Bucket4j: 10/15min login, 5/hr register
├── controller/
│   ├── AuthController.java             # POST /api/v1/auth/register|login|refresh|logout
│   ├── UserController.java             # GET/PUT /api/v1/users/me, PUT /users/me/password
│   ├── ProjectController.java          # CRUD /api/v1/projects/** + /members sub-resource
│   ├── TaskController.java             # CRUD /api/v1/projects/{id}/tasks + PATCH /status + /my-tasks
│   ├── CommentController.java          # CRUD /api/v1/tasks/{id}/comments, /comments/{id}
│   ├── NotificationController.java     # GET /notifications, PATCH read/read-all
│   ├── ActivityController.java         # GET /projects/{id}/activities, /tasks/{id}/activities
│   ├── DashboardController.java        # GET /dashboard/summary
│   └── AttachmentController.java       # POST/GET /tasks/{id}/attachments, GET/DELETE /attachments/{id}
├── service/
│   ├── AuthService.java                # register, login, refreshToken, logout (revokes token)
│   ├── UserService.java                # getCurrentUser, updateProfile, updatePassword
│   ├── ProjectService.java             # CRUD, archive, addMember, removeMember, updateRole
│   ├── TaskService.java                # CRUD, status transitions, subtasks, time tracking
│   ├── CommentService.java             # add/edit/delete, notifies assignee+reporter
│   ├── NotificationService.java        # notify*, markAsRead, markAllAsRead, @Scheduled
│   ├── ActivityService.java            # logActivity, getProjectActivities, getTaskActivities
│   ├── AttachmentService.java          # interface for file operations
│   ├── AttachmentServiceImpl.java      # store/retrieve file attachments
│   ├── StorageService.java             # storage abstraction interface
│   └── LocalStorageServiceImpl.java    # local filesystem storage (dev)
├── repository/
│   ├── UserRepository.java             # findByEmail, existsByEmail
│   ├── ProjectRepository.java          # findAccessibleByUserId (owner OR member)
│   ├── ProjectMemberRepository.java    # existsByProjectIdAndUserId, findByProjectIdAndUserId
│   ├── TaskRepository.java             # filters, findDueTomorrow, countByProjectIdAndStatus
│   ├── CommentRepository.java          # findByTaskIdOrderByCreatedAtAsc
│   ├── NotificationRepository.java     # markAllReadByUserId, countUnreadByUserId
│   ├── RefreshTokenRepository.java     # revokeByToken, revokeAllByUserId
│   ├── ActivityRepository.java         # findByProjectId/TaskId paginated
│   ├── SubtaskRepository.java          # findByTaskId
│   └── AttachmentRepository.java       # findByTaskId
├── model/
│   ├── User.java                       # Role enum: ADMIN|MANAGER|MEMBER|VIEWER
│   ├── Project.java                    # ProjectStatus + ProjectVisibility enums
│   ├── ProjectMember.java              # composite PK (project_id, user_id), role
│   ├── Task.java                       # TaskStatus + TaskPriority enums, tags TEXT[]
│   ├── Comment.java                    # content, author, task, isEdited
│   ├── Notification.java               # NotificationType enum, isRead, task/project refs
│   ├── Activity.java                   # action, entityType, oldValue, newValue, metadata JSONB
│   ├── RefreshToken.java               # token, expiresAt, isRevoked
│   ├── Subtask.java                    # title, isCompleted, task FK
│   └── Attachment.java                 # fileName, contentType, size, storagePath
├── dto/
│   ├── request/   (15 DTOs with Bean Validation)
│   │   LoginRequest, RegisterRequest, RefreshTokenRequest
│   │   CreateProject/UpdateProject/AddProjectMember/UpdateMemberRole
│   │   CreateTask/UpdateTask/UpdateTaskStatus/CreateSubtask/LogTime
│   │   CreateComment, UpdateProfile, UpdatePassword
│   └── response/  (13 DTOs)
│       AuthResponse, UserResponse, ProjectResponse, MemberResponse
│       TaskResponse, SubtaskResponse, CommentResponse, NotificationResponse
│       ActivityResponse, DashboardSummaryResponse, AttachmentResponse
│       PagedResponse, Responses
├── security/
│   ├── JwtTokenProvider.java           # HS512 token generation + validation
│   ├── JwtAuthFilter.java              # OncePerRequestFilter, stateless Bearer
│   └── UserDetailsServiceImpl.java     # loadByEmail, checks isActive flag
└── exception/
    ├── GlobalExceptionHandler.java     # @RestControllerAdvice, 400/401/403/404/409/422/429/500
    ├── ResourceNotFoundException.java  # 404
    ├── UnauthorizedException.java      # 401
    ├── ConflictException.java          # 409
    ├── ForbiddenException.java         # 403
    └── InvalidStatusTransitionException.java  # 422
```

### 3.2 Layered Architecture

```
HTTP Request
     │
     ▼
┌──────────────────────────────┐
│  @RestController Layer       │  ← Input validation, HTTP mapping
│  DTO mapping, HTTP responses │
└──────────────┬───────────────┘
               │ calls
               ▼
┌──────────────────────────────┐
│  @Service Layer              │  ← Business logic, transactions,
│  Transaction boundaries      │    security rules
└──────────────┬───────────────┘
               │ calls
               ▼
┌──────────────────────────────┐
│  @Repository Layer           │  ← Data access, JPQL/native queries
│  Spring Data JPA interfaces  │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│  @Entity / Domain Model      │  ← JPA-managed entities
└──────────────────────────────┘
```

### 3.3 JWT Security Flow

```
1. Client → POST /api/v1/auth/login {email, password}
2. AuthService validates credentials via UserDetailsService
3. BCrypt password match verified
4. JwtTokenProvider generates:
   - accessToken (HS512, 15min, claims: userId, email, role)
   - refreshToken (HS512, 7days, stored in DB)
5. Response: {accessToken, refreshToken, expiresIn}

6. Client → Any protected endpoint
   Authorization: Bearer <accessToken>
7. JwtAuthFilter extracts and validates token
8. SecurityContextHolder populated with Authentication object
9. @PreAuthorize annotations evaluate role/permission
10. Controller method executes
```

---

## 4. Frontend Module Design

### 4.1 Directory Structure

```
frontend/src/
├── main.jsx                          # React app entry point
├── App.jsx                           # Root component, router setup
├── pages/
│   ├── LoginPage.jsx
│   ├── RegisterPage.jsx
│   ├── DashboardPage.jsx
│   ├── ProjectListPage.jsx
│   ├── ProjectDetailPage.jsx
│   ├── TaskDetailPage.jsx
│   ├── ProfilePage.jsx
│   └── NotFoundPage.jsx
├── components/
│   ├── auth/
│   │   ├── LoginForm.jsx
│   │   ├── RegisterForm.jsx
│   │   └── ProtectedRoute.jsx
│   ├── dashboard/
│   │   ├── StatsCard.jsx
│   │   ├── RecentActivity.jsx
│   │   └── MyTasksWidget.jsx
│   ├── projects/
│   │   ├── ProjectCard.jsx
│   │   ├── ProjectForm.jsx
│   │   ├── ProjectMemberList.jsx
│   │   └── ProjectStatusBadge.jsx
│   ├── tasks/
│   │   ├── TaskList.jsx
│   │   ├── TaskCard.jsx
│   │   ├── TaskForm.jsx
│   │   ├── TaskStatusSelect.jsx
│   │   ├── TaskPriorityChip.jsx
│   │   └── TaskActivityFeed.jsx
│   ├── notifications/
│   │   ├── NotificationBell.jsx
│   │   └── NotificationDropdown.jsx
│   └── shared/
│       ├── Layout.jsx
│       ├── NavBar.jsx
│       ├── Sidebar.jsx
│       ├── LoadingSpinner.jsx
│       ├── ErrorBoundary.jsx
│       ├── ConfirmDialog.jsx
│       └── EmptyState.jsx
├── store/
│   ├── index.js                      # Redux store configuration
│   └── slices/
│       ├── authSlice.js              # Auth state: user, token, isAuthenticated
│       ├── projectsSlice.js          # Projects list, selected project
│       ├── tasksSlice.js             # Tasks list, selected task
│       ├── notificationsSlice.js     # Notifications list, unread count
│       └── uiSlice.js               # Loading, error, modals state
├── services/
│   ├── api.js                        # Axios instance with interceptors
│   ├── authService.js
│   ├── projectService.js
│   ├── taskService.js
│   ├── commentService.js
│   └── notificationService.js
├── hooks/
│   ├── useAuth.js
│   ├── useProjects.js
│   ├── useTasks.js
│   └── useNotifications.js
└── utils/
    ├── constants.js
    ├── dateUtils.js
    ├── validators.js
    └── tokenUtils.js
```

### 4.2 Redux Store Design

```
Redux Store
├── auth: {
│     user: { id, email, name, role },
│     accessToken: string,
│     isAuthenticated: boolean,
│     loading: boolean,
│     error: string | null
│   }
├── projects: {
│     items: Project[],
│     selectedProject: Project | null,
│     loading: boolean,
│     error: string | null,
│     pagination: { page, size, totalElements }
│   }
├── tasks: {
│     items: Task[],
│     selectedTask: Task | null,
│     loading: boolean,
│     error: string | null
│   }
├── notifications: {
│     items: Notification[],
│     unreadCount: number,
│     loading: boolean
│   }
└── ui: {
      isLoading: boolean,
      globalError: string | null,
      successMessage: string | null
    }
```

### 4.3 API Service Layer

All API calls are centralized in `services/api.js` using Axios:
- Base URL from environment variable `VITE_API_URL`
- Request interceptor: attaches `Authorization: Bearer <token>`
- Response interceptor: handles 401 (token refresh), 403 (redirect), network errors

---

## 5. DevOps Architecture

### 5.1 CI/CD Pipeline (GitHub Actions)

```
Trigger: Push to main / PR to main
        │
        ▼
┌───────────────────┐
│   CI: Test        │
│ - Backend: Maven  │
│   JUnit tests     │
│   Code coverage   │
│ - Frontend: Vitest│
│   Lint: ESLint    │
└────────┬──────────┘
         │ (on main)
         ▼
┌───────────────────┐
│  Build Docker     │
│  images:          │
│  - backend:tag    │
│  - frontend:tag   │
│  Push to ECR      │
└────────┬──────────┘
         │
         ▼
┌───────────────────┐
│  Deploy to EKS    │
│  - helm upgrade   │
│  - Rolling update │
│  - Health check   │
│  - Smoke tests    │
└───────────────────┘
```

### 5.2 Kubernetes Resource Map

```
Namespace: taskflow-pro
├── Deployments
│   ├── taskflow-backend (2–10 replicas, HPA)
│   └── taskflow-frontend (2–4 replicas)
├── Services
│   ├── taskflow-backend-svc (ClusterIP :8080)
│   └── taskflow-frontend-svc (ClusterIP :80)
├── Ingress
│   └── taskflow-ingress (Nginx, TLS via cert-manager)
├── ConfigMaps
│   ├── backend-config (app settings)
│   └── frontend-config (runtime env)
├── Secrets
│   ├── db-credentials
│   ├── jwt-secret
│   └── redis-credentials
├── HorizontalPodAutoscaler
│   └── backend-hpa (CPU 70%, Memory 80%)
└── PodDisruptionBudget
    └── backend-pdb (minAvailable: 1)
```

### 5.3 Terraform Infrastructure Map

```
terraform/
├── modules/vpc/       → VPC, subnets (public/private), NAT Gateway, IGW
├── modules/eks/       → EKS cluster, node groups, IAM roles, OIDC
├── modules/rds/       → RDS PostgreSQL instance, parameter group, subnet group
└── environments/
    ├── dev/           → dev.tfvars, small instance types
    └── prod/          → prod.tfvars, multi-AZ, enhanced monitoring
```

---

## 6. Data Flow Diagrams

### 6.1 Task Creation Flow

```
User fills TaskForm
       │
       ▼
Redux dispatch(createTask(formData))
       │
       ▼
taskService.createTask(projectId, data)
       │ POST /api/v1/projects/{id}/tasks
       ▼
TaskController.createTask()
       │
       ▼
TaskService.createTask()
  ├── validateProjectMembership()
  ├── taskRepository.save(task)
  ├── activityService.log(TASK_CREATED)
  └── notificationService.notify(assignee, TASK_ASSIGNED)
       │
       ▼
HTTP 201 Created { taskResponse }
       │
       ▼
Redux: tasksSlice updated
       │
       ▼
UI re-renders with new task
```

---

## 7. Technology Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Language | Java 21 | LTS, virtual threads (Project Loom), strong typing |
| Framework | Spring Boot 3.5 | Auto-config, Spring Security, mature ecosystem |
| Build Tool | Maven 3.9 | Dependency management, consistent enterprise standard |
| Frontend | React 18 | Concurrent rendering, large ecosystem |
| Bundler | Vite 5 | Fast HMR, ES modules, better DX |
| State | Redux Toolkit | Predictable state, DevTools, async thunks |
| UI Library | Material UI v5 | Comprehensive component library, theming |
| Real-time | WebSocket (STOMP/SockJS) | Task board live updates without polling |
| Database | PostgreSQL 16 | ACID compliance, TEXT[] for tags, JSONB for metadata |
| ORM | Hibernate (JPA) | Standard, productive, supports complex queries |
| Auth | JWT (HS512) | Stateless, scalable — see ADR 0001 |
| Rate Limiting | Bucket4j (in-process) | No Redis dep, token-bucket per-IP, 429+Retry-After |
| Tracing | MDC + X-Trace-Id header | End-to-end request correlation across logs |
| Migration | Flyway | Versioned SQL, repair-on-migrate, V1–V12 applied |
| IaC | Terraform | Cloud-agnostic, strong AWS provider, GitOps ready |
| Orchestration | Kubernetes (EKS) | Industry standard, HPA min2/max10 |
| Monitoring | Prometheus + Grafana | Auto-provisioned dashboards, 12 panels |
| Perf Testing | k6 + JMeter + Gatling + Locust | 4 tools × 4 test types, InfluxDB sink — see Phase 7 |

---

## 8. Security Architecture

```
┌─────────────────────────────────────────────┐
│               Security Layers               │
│                                             │
│  L1: Network  ─── TLS 1.2+, VPC, SGs       │
│  L2: Ingress  ─── WAF, rate limiting        │
│  L3: App      ─── JWT auth, RBAC            │
│  L4: Service  ─── Spring Security filter    │
│  L5: Data     ─── BCrypt, encryption at rest│
└─────────────────────────────────────────────┘
```

See `SECURITY_COMPLIANCE.md` for full security specification.

---

*Document maintained by the TaskFlow Pro Architecture Team.*
