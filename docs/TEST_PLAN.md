# TaskFlow Pro — Test Plan

**Version:** 1.0.0  
**Testing Lead:** QA Team  
**Coverage Target:** ≥ 80% line coverage (backend)

---

## Table of Contents
1. [Testing Strategy](#1-testing-strategy)
2. [Test Environments](#2-test-environments)
3. [Test Types & Coverage](#3-test-types--coverage)
4. [CI/CD Integration](#4-cicd-integration)
5. [Entry & Exit Criteria](#5-entry--exit-criteria)
6. [Defect Management](#6-defect-management)
7. [Tools Summary](#7-tools-summary)

---

## 1. Testing Strategy

TaskFlow Pro employs a **shift-left, multi-layer testing strategy** following the Testing Pyramid:

```
         ┌──────────────┐
         │   E2E Tests  │  ← Playwright (~30 scenarios)
         │  (Slowest)   │
        ┌┴──────────────┴┐
        │  API / Integ.  │  ← Postman / REST Client (~80 tests)
        │    Tests       │
       ┌┴────────────────┴┐
       │   Unit Tests     │  ← JUnit 5 / Mockito (~200 tests)
       │   (Fastest)      │
       └──────────────────┘
```

**Principles:**
- Tests are written alongside feature code (TDD where applicable)
- No merge to `main` without passing CI test suite
- Test data is isolated — no shared state between test runs
- Sensitive data (passwords, tokens) use test-specific values only

---

## 2. Test Environments

| Environment | Purpose | Data | Deployment |
|-------------|---------|------|-----------|
| **local** | Developer unit testing | H2 in-memory DB | `mvn test` |
| **test** | API integration testing | Dedicated PostgreSQL test DB | Docker Compose |
| **staging** | E2E + pre-release validation | Anonymized production clone | Kubernetes (namespace: staging) |
| **production** | Smoke tests post-deploy | Production DB (read-only checks) | EKS prod cluster |

### 2.1 Local Test Setup

```bash
# Backend unit tests (no DB required — mocked)
cd backend && mvn test

# Backend integration tests (requires Docker)
cd backend && mvn verify -P integration-test

# Frontend unit tests
cd frontend && npm run test

# API tests (Postman)
newman run tests/api/postman/TaskflowPro.postman_collection.json \
  -e tests/api/postman/environments/local.json

# E2E tests
cd tests/e2e/playwright && npx playwright test
```

---

## 3. Test Types & Coverage

### 3.1 Unit Tests (JUnit 5 + Mockito)

**Scope:** Service layer business logic, utility classes, JWT token operations

**Coverage Target:** ≥ 85% line coverage on service classes

| Test Class | Tests | Focus Area |
|-----------|-------|-----------|
| `AuthServiceTest` | 12 | Registration, login, token refresh, password validation |
| `ProjectServiceTest` | 15 | CRUD, authorization, membership |
| `TaskServiceTest` | 20 | CRUD, status transitions, assignment |
| `CommentServiceTest` | 10 | CRUD, authorization |
| `NotificationServiceTest` | 8 | Notification creation, delivery |
| `ActivityServiceTest` | 6 | Event logging |
| `JwtTokenProviderTest` | 10 | Token generation, validation, expiry |
| `UserServiceTest` | 12 | Profile update, password change |

**Total: ~93 unit test methods**

---

### 3.2 Integration Tests (Spring Boot Test + Testcontainers)

**Scope:** Full Spring context with real PostgreSQL (Testcontainers)

| Test Class | Tests | Focus Area |
|-----------|-------|-----------|
| `AuthControllerIT` | 10 | Register, login, refresh, logout flows |
| `ProjectControllerIT` | 12 | Project CRUD with DB persistence |
| `TaskControllerIT` | 15 | Task lifecycle end-to-end |
| `CommentControllerIT` | 8 | Comment flows with notifications |
| `SecurityIT` | 10 | Auth enforcement, RBAC rules |
| `NotificationControllerIT` | 6 | Notification read/unread flows |

**Total: ~61 integration test methods**

---

### 3.3 API Tests (Postman + Newman)

**Scope:** Black-box HTTP API testing against running service

Organized into folders:
- **Auth:** Register, login, refresh, logout (12 tests)
- **Projects:** Full CRUD, filters, pagination (18 tests)
- **Tasks:** CRUD, status transitions, priority (22 tests)
- **Comments:** CRUD, authorization (12 tests)
- **Notifications:** List, mark read, mark all (8 tests)
- **Activities:** Project + task activity feed (6 tests)
- **Error Cases:** 400, 401, 403, 404, 409 scenarios (20 tests)

**Total: ~98 Postman test cases**

See `TEST_CASES_API.md` for full test case specifications.

---

### 3.4 E2E Tests (Playwright)

**Scope:** Full user journey simulation through the browser

| Test Suite | Scenarios | Browser |
|-----------|-----------|---------|
| Authentication | 5 | Chromium, Firefox |
| Project Management | 7 | Chromium |
| Task Management | 8 | Chromium, Firefox |
| Comments & Notifications | 5 | Chromium |
| Responsive / Mobile | 5 | Mobile Chrome viewport |

**Total: ~30 Playwright scenarios**

See `TEST_CASES_E2E.md` for full scenario specifications.

---

### 3.5 Performance Tests (k6 — v1.1)

- Target: P95 API response ≤ 300ms at 500 concurrent users
- Load test: Ramp from 0 to 500 VUs over 5 minutes, hold 10 minutes
- Stress test: Ramp to 1000 VUs to find breaking point
- Endpoints tested: Login, GET projects, GET tasks, POST tasks

---

### 3.6 Security Tests

| Test Type | Tool | Frequency |
|-----------|------|-----------|
| Dependency vulnerability scan | OWASP Dependency-Check | Every CI run |
| Static analysis (SAST) | SpotBugs + Find Security Bugs | Every CI run |
| DAST (dynamic scanning) | OWASP ZAP | Weekly on staging |
| Container image scanning | Trivy | Every Docker build |

---

## 4. CI/CD Integration

### 4.1 GitHub Actions Pipeline

```yaml
# Pipeline stages and test execution:

on: [push, pull_request]

stages:
  1. build-and-unit-test:
     - mvn test (unit tests)
     - npm run test (frontend)
     - Publish coverage report (Jacoco)
     - Fail if coverage < 80%

  2. integration-test:
     - mvn verify -P integration-test (Testcontainers)
     - OWASP dependency-check
     - SpotBugs SAST scan

  3. build-docker:
     - docker build + push to ECR
     - Trivy image vulnerability scan
     - Fail on CRITICAL CVEs

  4. api-test:
     - Deploy to test environment
     - newman run Postman collection
     - Publish HTML report as artifact

  5. e2e-test:
     - Deploy to staging
     - npx playwright test
     - Publish HTML report + screenshots
     - Fail on any scenario failure

  6. deploy-production:
     - Requires manual approval
     - helm upgrade --atomic
     - Post-deploy smoke tests
```

### 4.2 Coverage Enforcement

```xml
<!-- pom.xml Jacoco configuration -->
<rule>
  <element>BUNDLE</element>
  <limits>
    <limit>
      <counter>LINE</counter>
      <value>COVEREDRATIO</value>
      <minimum>0.80</minimum>
    </limit>
  </limits>
</rule>
```

---

## 5. Entry & Exit Criteria

### 5.1 Entry Criteria (to start testing)

- [ ] Feature code merged to feature branch
- [ ] Unit tests written alongside code
- [ ] API contract updated in API_DOCUMENTATION.md
- [ ] Test environment accessible and healthy

### 5.2 Exit Criteria (to approve release)

- [ ] All unit tests pass (0 failures)
- [ ] All integration tests pass (0 failures)
- [ ] Code coverage ≥ 80%
- [ ] All Postman API tests pass (0 failures)
- [ ] All Playwright E2E scenarios pass (0 failures)
- [ ] No CRITICAL or HIGH CVEs in dependency scan
- [ ] Performance baseline met (P95 ≤ 300ms)
- [ ] Smoke tests pass on staging

---

## 6. Defect Management

### Severity Classification

| Severity | Description | Resolution SLA |
|----------|-------------|----------------|
| S1 — Blocker | System crash, data loss, auth bypass | Same day |
| S2 — Critical | Core feature unusable, security vulnerability | 2 days |
| S3 — Major | Feature partially broken, workaround exists | 1 sprint |
| S4 — Minor | UI glitch, cosmetic, edge case | Next sprint |

### Bug Tracking
- GitHub Issues with labels: `bug`, `severity:S1`, `severity:S2`, etc.
- S1/S2 bugs block release pipeline
- Regression test added for every S1/S2 bug fix

---

## 7. Tools Summary

| Layer | Tool | Version | Purpose |
|-------|------|---------|---------|
| Unit Testing | JUnit 5 | 5.10 | Backend unit tests |
| Mocking | Mockito | 5.x | Mock dependencies in unit tests |
| Integration | Testcontainers | 1.19 | Real PostgreSQL in tests |
| Coverage | JaCoCo | 0.8.11 | Coverage measurement + enforcement |
| API Testing | Postman + Newman | Latest | REST API collection tests |
| API Debugging | REST Client (VS Code) | — | Manual API exploration |
| E2E Testing | Playwright | 1.40 | Browser automation |
| Performance | k6 | 0.48 (v1.1) | Load testing |
| SAST | SpotBugs + FSB | 4.8 | Static security analysis |
| DAST | OWASP ZAP | 2.14 | Dynamic security scanning |
| Dependency CVE | OWASP Dep-Check | 9.0 | Known vulnerability detection |
| Image Security | Trivy | 0.48 | Container image scanning |
