# TaskFlow Pro — Technical Design Document (TTD)

**Version:** 1.0.0  
**Date:** 2025-01-01  
**Author:** Architecture Team  
**Status:** Approved

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
| Cache | Redis 7 (AWS ElastiCache) | Token blacklisting, rate limiting |
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
    │── REST API calls ──► Backend API (:8080)
                              │── JPA/JDBC ──► PostgreSQL (:5432)
                              │── Lettuce ──► Redis (:6379)
                              └── Spring Actuator ──► Prometheus (:9090)
                                                          └── Grafana (:3000)
```

---

## 3. Backend Module Design

### 3.1 Package Structure

```
com.taskflow
├── TaskflowApplication.java          # Main Spring Boot entry point
├── config/
│   ├── SecurityConfig.java           # Spring Security + JWT filter chain
│   ├── JwtConfig.java                # JWT properties binding
│   ├── CorsConfig.java               # CORS configuration
│   └── OpenApiConfig.java            # Springdoc/Swagger configuration
├── controller/
│   ├── AuthController.java           # POST /api/v1/auth/**
│   ├── UserController.java           # GET/PUT /api/v1/users/**
│   ├── ProjectController.java        # CRUD /api/v1/projects/**
│   ├── TaskController.java           # CRUD /api/v1/projects/{id}/tasks/**
│   ├── CommentController.java        # CRUD /api/v1/tasks/{id}/comments/**
│   ├── NotificationController.java   # GET /api/v1/notifications/**
│   └── ActivityController.java       # GET /api/v1/activities/**
├── service/
│   ├── AuthService.java              # Registration, login, token refresh
│   ├── UserService.java              # User profile management
│   ├── ProjectService.java           # Project lifecycle
│   ├── TaskService.java              # Task CRUD and workflow
│   ├── CommentService.java           # Comment management
│   ├── NotificationService.java      # Notification creation and delivery
│   └── ActivityService.java          # Activity event recording
├── repository/
│   ├── UserRepository.java           # Spring Data JPA user queries
│   ├── ProjectRepository.java        # Project queries
│   ├── ProjectMemberRepository.java  # Project membership
│   ├── TaskRepository.java           # Task queries
│   ├── CommentRepository.java        # Comment queries
│   ├── NotificationRepository.java   # Notification queries
│   └── ActivityRepository.java       # Activity log queries
├── model/
│   ├── User.java                     # @Entity: users table
│   ├── Project.java                  # @Entity: projects table
│   ├── ProjectMember.java            # @Entity: project_members table
│   ├── Task.java                     # @Entity: tasks table
│   ├── Comment.java                  # @Entity: comments table
│   ├── Notification.java             # @Entity: notifications table
│   ├── Activity.java                 # @Entity: activities table
│   └── enums/
│       ├── Role.java                 # ADMIN, MANAGER, MEMBER, VIEWER
│       ├── TaskStatus.java           # TODO, IN_PROGRESS, REVIEW, DONE
│       ├── TaskPriority.java         # LOW, MEDIUM, HIGH, CRITICAL
│       └── ProjectStatus.java        # ACTIVE, ON_HOLD, COMPLETED, ARCHIVED
├── dto/
│   ├── request/
│   │   ├── LoginRequest.java
│   │   ├── RegisterRequest.java
│   │   ├── CreateProjectRequest.java
│   │   ├── CreateTaskRequest.java
│   │   └── CreateCommentRequest.java
│   └── response/
│       ├── AuthResponse.java
│       ├── UserResponse.java
│       ├── ProjectResponse.java
│       ├── TaskResponse.java
│       ├── CommentResponse.java
│       └── NotificationResponse.java
├── security/
│   ├── JwtTokenProvider.java         # JWT generation and validation
│   ├── JwtAuthFilter.java            # JWT request filter
│   └── UserDetailsServiceImpl.java   # Spring Security UserDetails
└── exception/
    ├── GlobalExceptionHandler.java   # @RestControllerAdvice
    ├── ResourceNotFoundException.java
    ├── UnauthorizedException.java
    └── ValidationException.java
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
| Framework | Spring Boot 3.x | Auto-config, Spring Security, mature ecosystem |
| Build Tool | Maven 3.9 | Dependency management, consistent enterprise standard |
| Frontend | React 18 | Concurrent rendering, large ecosystem |
| Bundler | Vite 5 | Fast HMR, ES modules, better DX |
| State | Redux Toolkit | Predictable state, DevTools, async thunks |
| UI Library | Material UI v5 | Comprehensive component library, theming |
| Database | PostgreSQL 16 | ACID compliance, JSON support, performance |
| ORM | Hibernate (JPA) | Standard, productive, supports complex queries |
| Auth | JWT (HS512) | Stateless, scalable, industry standard |
| IaC | Terraform | Cloud-agnostic, strong AWS provider, GitOps ready |
| Orchestration | Kubernetes | Industry standard, EKS managed service |
| Monitoring | Prometheus+Grafana | Open source, powerful, widely adopted |

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
