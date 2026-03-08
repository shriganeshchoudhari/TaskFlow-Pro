# TaskFlow Pro — Deployment & Operations Manual

**Version:** 1.0.0  
**Platform:** AWS EKS | Docker | Kubernetes

---

## Table of Contents
1. [Local Development Setup](#1-local-development-setup)
2. [Docker Deployment](#2-docker-deployment)
3. [Kubernetes Deployment](#3-kubernetes-deployment)
4. [CI/CD Pipeline](#4-cicd-pipeline)
5. [Monitoring Setup](#5-monitoring-setup)
6. [Operations Runbook](#6-operations-runbook)
7. [Rollback Procedures](#7-rollback-procedures)

---

## 1. Local Development Setup

### 1.1 Prerequisites

```bash
# Required software versions
Java 21+        → https://adoptium.net
Node.js 20+     → https://nodejs.org
Maven 3.9+      → brew install maven
Docker 24+      → https://docker.com
kubectl 1.28+   → brew install kubectl
Helm 3.12+      → brew install helm
```

### 1.2 Clone & Configure

```bash
git clone https://github.com/your-org/taskflow-pro.git
cd taskflow-pro

# Copy env templates
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

### 1.3 Backend Setup

```bash
cd backend

# Start only PostgreSQL for local dev
docker-compose -f docker/docker-compose.dev.yml up -d postgres

# Configure backend/.env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=taskflow_dev
DB_USERNAME=taskflow
DB_PASSWORD=taskflow_dev_password
JWT_SECRET=your-super-secret-key-at-least-256-bits-long-for-hs512
JWT_EXPIRY_MS=900000
JWT_REFRESH_EXPIRY_MS=604800000
SERVER_PORT=8080
CORS_ALLOWED_ORIGINS=http://localhost:5173

# Run backend
./mvnw spring-boot:run

# Run tests
./mvnw test                    # unit tests only
./mvnw verify                  # unit + integration tests
./mvnw verify jacoco:report    # with coverage report
```

### 1.4 Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Configure frontend/.env
VITE_API_URL=http://localhost:8080/api/v1
VITE_APP_NAME=TaskFlow Pro

# Start dev server
npm run dev           # http://localhost:5173

# Build for production
npm run build         # output: dist/

# Run tests
npm run test
npm run test:coverage
```

### 1.5 Full Stack Local (Docker Compose)

```bash
# Start entire stack locally
docker-compose -f docker/docker-compose.dev.yml up --build

# Services started:
# - PostgreSQL     → localhost:5432
# - Redis          → localhost:6379
# - Backend API    → localhost:8080
# - Frontend       → localhost:5173
# - Swagger UI     → localhost:8080/swagger-ui.html

# Stop services
docker-compose -f docker/docker-compose.dev.yml down

# Stop + remove volumes (fresh start)
docker-compose -f docker/docker-compose.dev.yml down -v
```

---

## 2. Docker Deployment

### 2.1 Build Images

```bash
# Backend
docker build -t taskflow-backend:latest \
  --build-arg JAR_FILE=target/taskflow-backend-1.0.0.jar \
  -f docker/Dockerfile.backend .

# Frontend
docker build -t taskflow-frontend:latest \
  --build-arg VITE_API_URL=https://api.taskflowpro.com/api/v1 \
  -f docker/Dockerfile.frontend .

# Tag for registry
docker tag taskflow-backend:latest \
  123456789.dkr.ecr.us-east-1.amazonaws.com/taskflow-backend:1.0.0

docker tag taskflow-frontend:latest \
  123456789.dkr.ecr.us-east-1.amazonaws.com/taskflow-frontend:1.0.0

# Push to ECR
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin \
  123456789.dkr.ecr.us-east-1.amazonaws.com

docker push 123456789.dkr.ecr.us-east-1.amazonaws.com/taskflow-backend:1.0.0
docker push 123456789.dkr.ecr.us-east-1.amazonaws.com/taskflow-frontend:1.0.0
```

### 2.2 Production Docker Compose

```bash
# Deploy with production compose
docker-compose -f docker/docker-compose.prod.yml up -d

# Check running containers
docker-compose -f docker/docker-compose.prod.yml ps

# View logs
docker-compose -f docker/docker-compose.prod.yml logs -f backend

# Scale backend
docker-compose -f docker/docker-compose.prod.yml up -d --scale backend=3
```

---

## 3. Kubernetes Deployment

### 3.1 Prerequisites

```bash
# Configure kubectl for EKS
aws eks update-kubeconfig --region us-east-1 --name taskflow-cluster

# Verify cluster access
kubectl get nodes
kubectl get namespaces
```

### 3.2 Namespace & Secrets Setup

```bash
# Create namespace
kubectl create namespace taskflow-pro

# Create secrets (NEVER commit these values)
kubectl create secret generic db-credentials \
  --namespace taskflow-pro \
  --from-literal=DB_USERNAME=taskflow \
  --from-literal=DB_PASSWORD="$(openssl rand -base64 32)"

kubectl create secret generic jwt-secret \
  --namespace taskflow-pro \
  --from-literal=JWT_SECRET="$(openssl rand -base64 64)"

kubectl create secret generic redis-credentials \
  --namespace taskflow-pro \
  --from-literal=REDIS_PASSWORD="$(openssl rand -base64 32)"

# Create ECR pull secret
kubectl create secret docker-registry ecr-credentials \
  --namespace taskflow-pro \
  --docker-server=123456789.dkr.ecr.us-east-1.amazonaws.com \
  --docker-username=AWS \
  --docker-password="$(aws ecr get-login-password)"
```

### 3.3 Deploy with Kubectl (Base)

```bash
# Apply base manifests
kubectl apply -k k8s/base/

# Apply environment overlay (dev or prod)
kubectl apply -k k8s/overlays/prod/

# Watch rollout
kubectl rollout status deployment/taskflow-backend -n taskflow-pro
kubectl rollout status deployment/taskflow-frontend -n taskflow-pro

# Verify pods
kubectl get pods -n taskflow-pro
kubectl get services -n taskflow-pro
kubectl get ingress -n taskflow-pro
```

### 3.4 Deploy with Helm (Recommended for Production)

```bash
# Add/update chart dependencies
cd helm/taskflow-pro
helm dependency update

# Deploy to production
helm upgrade --install taskflow-pro ./helm/taskflow-pro \
  --namespace taskflow-pro \
  --create-namespace \
  --values helm/taskflow-pro/values.yaml \
  --values helm/taskflow-pro/values.prod.yaml \
  --set backend.image.tag=1.0.0 \
  --set frontend.image.tag=1.0.0 \
  --atomic \
  --timeout 5m

# Verify Helm release
helm list -n taskflow-pro
helm status taskflow-pro -n taskflow-pro

# Upgrade only backend
helm upgrade taskflow-pro ./helm/taskflow-pro \
  --namespace taskflow-pro \
  --reuse-values \
  --set backend.image.tag=1.0.1 \
  --atomic
```

### 3.5 Verify Deployment

```bash
# Check pod health
kubectl get pods -n taskflow-pro -w

# Check pod logs
kubectl logs -f deployment/taskflow-backend -n taskflow-pro
kubectl logs -f deployment/taskflow-frontend -n taskflow-pro

# Check resource usage
kubectl top pods -n taskflow-pro
kubectl top nodes

# Test service endpoints
kubectl port-forward svc/taskflow-backend-svc 8080:8080 -n taskflow-pro
curl http://localhost:8080/actuator/health

# Check HPA
kubectl get hpa -n taskflow-pro
```

---

## 4. CI/CD Pipeline

### 4.1 GitHub Actions Workflow

**File:** `.github/workflows/ci-cd.yml`

```yaml
name: TaskFlow Pro CI/CD

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  AWS_REGION: us-east-1
  ECR_REGISTRY: 123456789.dkr.ecr.us-east-1.amazonaws.com
  EKS_CLUSTER: taskflow-cluster

jobs:
  test-backend:
    name: Backend Tests
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_DB: taskflow_test
          POSTGRES_USER: taskflow
          POSTGRES_PASSWORD: test_password
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with: { java-version: '21', distribution: 'temurin' }
      - name: Run Tests
        working-directory: backend
        run: ./mvnw verify jacoco:report
        env:
          SPRING_DATASOURCE_URL: jdbc:postgresql://localhost:5432/taskflow_test
          SPRING_DATASOURCE_USERNAME: taskflow
          SPRING_DATASOURCE_PASSWORD: test_password
      - name: Upload Coverage
        uses: codecov/codecov-action@v3
        with:
          file: backend/target/site/jacoco/jacoco.xml

  test-frontend:
    name: Frontend Tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
        working-directory: frontend
      - run: npm run lint && npm run test:coverage
        working-directory: frontend

  build-and-push:
    name: Build & Push Docker Images
    needs: [test-backend, test-frontend]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: arn:aws:iam::123456789:role/github-actions-role
          aws-region: ${{ env.AWS_REGION }}
      - name: Login to ECR
        uses: aws-actions/amazon-ecr-login@v2
      - name: Build Backend Image
        run: |
          cd backend && ./mvnw package -DskipTests
          docker build -t $ECR_REGISTRY/taskflow-backend:$GITHUB_SHA \
            -f docker/Dockerfile.backend .
          docker push $ECR_REGISTRY/taskflow-backend:$GITHUB_SHA
      - name: Build Frontend Image
        run: |
          docker build -t $ECR_REGISTRY/taskflow-frontend:$GITHUB_SHA \
            -f docker/Dockerfile.frontend .
          docker push $ECR_REGISTRY/taskflow-frontend:$GITHUB_SHA
      - name: Trivy Security Scan
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: ${{ env.ECR_REGISTRY }}/taskflow-backend:${{ github.sha }}
          exit-code: '1'
          severity: 'CRITICAL'

  deploy-staging:
    name: Deploy to Staging
    needs: build-and-push
    runs-on: ubuntu-latest
    environment: staging
    steps:
      - uses: actions/checkout@v4
      - name: Configure AWS + kubectl
        run: aws eks update-kubeconfig --region $AWS_REGION --name $EKS_CLUSTER
      - name: Helm Deploy Staging
        run: |
          helm upgrade --install taskflow-pro ./helm/taskflow-pro \
            --namespace taskflow-staging \
            --set backend.image.tag=$GITHUB_SHA \
            --set frontend.image.tag=$GITHUB_SHA \
            --atomic --timeout 5m

  e2e-tests:
    name: E2E Tests
    needs: deploy-staging
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci && npx playwright install --with-deps
        working-directory: tests/e2e/playwright
      - run: npx playwright test
        working-directory: tests/e2e/playwright
        env:
          E2E_BASE_URL: https://staging.taskflowpro.com
      - uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: playwright-report
          path: tests/e2e/playwright/playwright-report/

  deploy-production:
    name: Deploy to Production
    needs: e2e-tests
    runs-on: ubuntu-latest
    environment: production   # Requires manual approval
    steps:
      - uses: actions/checkout@v4
      - name: Configure AWS + kubectl
        run: aws eks update-kubeconfig --region $AWS_REGION --name $EKS_CLUSTER
      - name: Helm Deploy Production
        run: |
          helm upgrade --install taskflow-pro ./helm/taskflow-pro \
            --namespace taskflow-pro \
            --values helm/taskflow-pro/values.prod.yaml \
            --set backend.image.tag=$GITHUB_SHA \
            --set frontend.image.tag=$GITHUB_SHA \
            --atomic --timeout 10m
      - name: Smoke Tests
        run: |
          sleep 30
          curl -f https://api.taskflowpro.com/actuator/health || exit 1
          curl -f https://taskflowpro.com || exit 1
```

---

## 5. Monitoring Setup

### 5.1 Prometheus Configuration

```bash
# Deploy Prometheus (via Helm)
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm upgrade --install prometheus prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --create-namespace \
  --values monitoring/prometheus/values.yaml
```

### 5.2 Application Metrics

The backend exposes metrics at `/actuator/prometheus`. Key metrics:

| Metric | Description |
|--------|-------------|
| `http_server_requests_seconds` | API request latency histogram |
| `jvm_memory_used_bytes` | JVM heap/non-heap usage |
| `hikaricp_connections_active` | Active DB connections |
| `taskflow_tasks_created_total` | Custom: tasks created counter |
| `taskflow_users_active` | Custom: active users gauge |

### 5.3 Grafana Dashboards

```bash
# Access Grafana (port-forward)
kubectl port-forward svc/prometheus-grafana 3000:80 -n monitoring

# Default: admin / prom-operator
# Import dashboards from monitoring/grafana/dashboards/
```

**Available Dashboards:**
- `taskflow-api-metrics.json` — API latency, error rates, request volume
- `taskflow-jvm-metrics.json` — JVM memory, GC, threads
- `taskflow-business-metrics.json` — Tasks created, users active, projects
- `kubernetes-cluster.json` — Pod health, node resources, HPA status

### 5.4 Alerting Rules

```yaml
# monitoring/prometheus/rules.yml (key alerts)
- alert: HighAPIErrorRate
  expr: rate(http_server_requests_seconds_count{status=~"5.."}[5m]) > 0.1
  for: 5m
  labels: { severity: critical }

- alert: PodCrashLooping
  expr: rate(kube_pod_container_status_restarts_total[15m]) > 0
  for: 5m
  labels: { severity: warning }

- alert: HighMemoryUsage
  expr: jvm_memory_used_bytes / jvm_memory_max_bytes > 0.85
  for: 10m
  labels: { severity: warning }
```

---

## 6. Operations Runbook

### 6.1 Check Application Health

```bash
# API health check
curl https://api.taskflowpro.com/actuator/health

# Pod status
kubectl get pods -n taskflow-pro

# Recent events
kubectl get events -n taskflow-pro --sort-by='.lastTimestamp' | tail -20

# Application logs (last 100 lines)
kubectl logs deployment/taskflow-backend -n taskflow-pro --tail=100

# Follow logs
kubectl logs -f deployment/taskflow-backend -n taskflow-pro
```

### 6.2 Scale Application

```bash
# Manual scale (emergency)
kubectl scale deployment taskflow-backend --replicas=5 -n taskflow-pro

# Check HPA status
kubectl describe hpa taskflow-backend-hpa -n taskflow-pro

# Temporarily disable HPA (emergency)
kubectl patch hpa taskflow-backend-hpa -n taskflow-pro \
  -p '{"spec":{"minReplicas": 3, "maxReplicas": 3}}'
```

### 6.3 Database Operations

```bash
# Connect to RDS via bastion
ssh bastion-host
psql -h taskflow-db.xxx.rds.amazonaws.com -U taskflow -d taskflow_prod

# Run manual migration
flyway -url=jdbc:postgresql://... -user=... -password=... migrate

# Check DB connections
SELECT count(*), state FROM pg_stat_activity GROUP BY state;

# Slow query analysis
SELECT query, mean_exec_time, calls FROM pg_stat_statements
ORDER BY mean_exec_time DESC LIMIT 10;
```

---

## 7. Rollback Procedures

### 7.1 Helm Rollback

```bash
# List Helm revisions
helm history taskflow-pro -n taskflow-pro

# Rollback to previous revision
helm rollback taskflow-pro -n taskflow-pro

# Rollback to specific revision
helm rollback taskflow-pro 3 -n taskflow-pro

# Verify rollback
kubectl rollout status deployment/taskflow-backend -n taskflow-pro
```

### 7.2 Kubectl Rollback

```bash
# View rollout history
kubectl rollout history deployment/taskflow-backend -n taskflow-pro

# Rollback to previous revision
kubectl rollout undo deployment/taskflow-backend -n taskflow-pro

# Rollback to specific revision
kubectl rollout undo deployment/taskflow-backend --to-revision=2 -n taskflow-pro
```

### 7.3 Database Rollback (Flyway)

```bash
# Flyway undo (requires Flyway Teams)
flyway undo -target=V8

# Manual: Run compensating migration
# Create V10__rollback_v9_changes.sql with reverse SQL
```

### 7.4 Emergency Procedures

**If backend is down:**
1. Check pod logs: `kubectl logs -f deployment/taskflow-backend -n taskflow-pro`
2. Check events: `kubectl describe pod <pod-name> -n taskflow-pro`
3. If image issue: `helm rollback taskflow-pro -n taskflow-pro`
4. If DB issue: Check RDS status in AWS Console
5. Page on-call via PagerDuty (P1 response: 15 minutes)

**If DB is unreachable:**
1. Check RDS instance status in AWS Console
2. Check security group rules (EKS nodes → RDS SG)
3. Try failover to read replica (for read traffic)
4. Activate maintenance page (503)
