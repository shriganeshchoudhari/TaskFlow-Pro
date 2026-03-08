# TaskFlow Pro — Security & Compliance

**Version:** 1.0.0  
**Framework:** OWASP Top 10 (2021), GDPR  
**Reviewed:** 2025-01-01

---

## Table of Contents
1. [Authentication Model](#1-authentication-model)
2. [Authorization Rules (RBAC)](#2-authorization-rules-rbac)
3. [OWASP Top 10 Mitigations](#3-owasp-top-10-mitigations)
4. [Data Protection Policies](#4-data-protection-policies)
5. [Network Security](#5-network-security)
6. [Secret Management](#6-secret-management)
7. [Audit & Monitoring](#7-audit--monitoring)
8. [Incident Response](#8-incident-response)

---

## 1. Authentication Model

### 1.1 JWT Authentication

TaskFlow Pro uses stateless JWT authentication with a short-lived access token and a longer-lived refresh token.

```
Access Token:
  - Algorithm: HS512 (HMAC with SHA-512)
  - Expiry: 15 minutes
  - Claims: { sub: userId, email, role, iat, exp }
  - Stored: Memory only (never localStorage)

Refresh Token:
  - Algorithm: HS512
  - Expiry: 7 days
  - Stored: HttpOnly cookie OR secure storage
  - Server-side: stored in refresh_tokens table with revocation support
  - Rotation: New refresh token issued on every refresh
```

### 1.2 Password Policy

```
Minimum length: 8 characters
Requirements:
  ✓ At least 1 uppercase letter (A-Z)
  ✓ At least 1 lowercase letter (a-z)
  ✓ At least 1 digit (0-9)
  ✓ At least 1 special character (!@#$%^&*)
Hashing: BCrypt with strength factor 12
Storage: Hashed value only — plaintext NEVER stored or logged
```

### 1.3 Token Lifecycle

```
Login ──────────────────────────► Issue (accessToken + refreshToken)
                                           │
Access Token expires (15 min)              │
        │                                  │
        ▼                                  ▼
POST /auth/refresh ◄─────── refreshToken still valid?
        │                         Yes              No
        ▼                          │               │
New accessToken issued         Continue       Force re-login
New refreshToken issued (rotation)

Logout ──────────────────────────► Revoke refreshToken in DB
                                   Clear tokens from client
```

### 1.4 Brute Force Protection

- Login endpoint: max **10 attempts per 15 minutes** per IP
- Account lockout: after 5 consecutive failed logins, account locked for 30 minutes
- CAPTCHA integration point available (v1.1)
- Rate limiting via Spring Boot + Redis counter

---

## 2. Authorization Rules (RBAC)

### 2.1 Global Roles

| Role | Description |
|------|-------------|
| `ADMIN` | Full platform access, user management, all projects |
| `MANAGER` | Can create projects, manage members in owned projects |
| `MEMBER` | Default role, can create/update tasks, add comments |
| `VIEWER` | Read-only access to assigned projects |

### 2.2 Permission Matrix

| Action | ADMIN | MANAGER | MEMBER | VIEWER |
|--------|-------|---------|--------|--------|
| Create project | ✅ | ✅ | ❌ | ❌ |
| Delete/archive project | ✅ | ✅ (own) | ❌ | ❌ |
| Add project members | ✅ | ✅ (own) | ❌ | ❌ |
| Create task | ✅ | ✅ | ✅ | ❌ |
| Update task (any) | ✅ | ✅ (own project) | ❌ | ❌ |
| Update own assigned task | ✅ | ✅ | ✅ | ❌ |
| Delete task | ✅ | ✅ (own project) | ❌ | ❌ |
| Add comment | ✅ | ✅ | ✅ | ❌ |
| Edit own comment | ✅ | ✅ | ✅ | ❌ |
| Delete any comment | ✅ | ✅ (own project) | ❌ | ❌ |
| View activity logs | ✅ | ✅ | ✅ | ✅ |
| Manage global users | ✅ | ❌ | ❌ | ❌ |

### 2.3 Object-Level Authorization

Beyond role checks, every data access request validates:
1. The requesting user is authenticated (JWT valid)
2. The user is a member of the project containing the resource
3. For mutations: the user has the required role within that project
4. Implemented as Spring Security `@PreAuthorize` + service-layer validation

```java
// Example: Only task assignee, reporter, or project MANAGER can update a task
@PreAuthorize("@taskSecurityService.canUpdateTask(authentication, #taskId)")
public TaskResponse updateTask(UUID taskId, UpdateTaskRequest request) { ... }
```

---

## 3. OWASP Top 10 Mitigations

### A01 — Broken Access Control ✅
- RBAC enforced at every API endpoint
- `@PreAuthorize` annotations on all controller methods
- Object-level authorization checked in service layer
- Project visibility (PRIVATE) enforced before returning any resource
- Users cannot access projects they are not members of

### A02 — Cryptographic Failures ✅
- All data in transit: TLS 1.2+ (enforced at ALB, Nginx)
- Passwords: BCrypt (strength 12), never logged or transmitted plaintext
- JWT: HS512 algorithm, 256-bit secret stored in Kubernetes Secret
- Database: AES-256 encryption at rest (AWS RDS default encryption)
- PII fields (email) not included in application logs

### A03 — Injection ✅
- All database queries use JPA/Hibernate parameterized queries — no raw string concatenation
- `@Valid` on all controller request bodies (Bean Validation)
- Spring Security CSRF protection enabled for state-changing requests
- Input sanitized to prevent stored XSS in text fields (using Jsoup for HTML content)

### A04 — Insecure Design ✅
- Threat modeling conducted during design phase (see TTD.md)
- Principle of least privilege applied to all roles
- Sensitive operations (delete project, change password) require re-authentication (v1.1)
- No sensitive data in URL parameters (UUIDs only, no PII)

### A05 — Security Misconfiguration ✅
- Spring Boot Actuator endpoints secured (only `health`, `prometheus` public)
- Custom error pages — stack traces NOT exposed in production
- HTTP security headers set:
  ```
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  X-XSS-Protection: 1; mode=block
  Content-Security-Policy: default-src 'self'
  Strict-Transport-Security: max-age=31536000; includeSubDomains
  ```
- CORS: Whitelist only (configured domains, not `*`)
- Default Spring Boot error `/error` endpoint overridden

### A06 — Vulnerable and Outdated Components ✅
- Dependabot GitHub integration for automated vulnerability alerts
- Weekly Maven/npm dependency review in CI pipeline
- OWASP Dependency-Check Maven plugin runs in CI (`mvn verify`)
- Base Docker images: `eclipse-temurin:21-jre-alpine` (minimal attack surface)

### A07 — Identification and Authentication Failures ✅
- Multi-factor authentication integration point available (v1.1)
- Account lockout after 5 failed logins
- Refresh token rotation on every use
- Secure token storage guidance in frontend documentation
- Password strength enforced server-side (not just client-side)

### A08 — Software and Data Integrity Failures ✅
- Docker images signed with Docker Content Trust
- GitHub Actions OIDC used for AWS access (no stored AWS credentials)
- Terraform state in S3 with versioning + DynamoDB locking
- Helm chart values validated with JSON Schema

### A09 — Security Logging and Monitoring Failures ✅
- All authentication events logged (login success/failure, logout, token refresh)
- Authorization failures logged with user ID and resource
- Structured JSON logs shipped to CloudWatch / ELK
- Grafana alerts on: spike in 401/403 responses, unusual login patterns
- Log retention: 90 days

### A10 — Server-Side Request Forgery (SSRF) ✅
- No user-controlled URLs fetched server-side in v1.0
- Avatar URL validated (whitelist of allowed CDN domains)
- Webhook URLs (v1.1) will use allowlist validation

---

## 4. Data Protection Policies

### 4.1 GDPR Compliance

| Requirement | Implementation |
|-------------|---------------|
| Lawful basis | Legitimate interest (account management), consent (marketing) |
| Data minimization | Only email, name, and password collected at registration |
| Right to access | `GET /users/me` returns all stored PII |
| Right to erasure | Account deletion removes user data (soft delete + anonymize) |
| Data portability | User data export endpoint (v1.1): JSON/CSV |
| Consent | Privacy policy checkbox at registration, timestamp stored |
| Breach notification | Incident response plan includes 72-hour GDPR notification |

### 4.2 PII Fields

| Field | Table | Protection |
|-------|-------|-----------|
| email | users | Unique index, never logged |
| full_name | users | Not in logs |
| password | users | BCrypt hash only |
| avatar_url | users | CDN hosted, no PII |
| IP address | — | Not stored (rate-limiting only, in-memory) |

### 4.3 Data Retention

| Data Type | Retention Period |
|-----------|-----------------|
| User accounts | Until deletion request |
| Completed tasks | 2 years from project archive |
| Activity logs | 1 year |
| Notifications | 90 days |
| Application logs | 90 days |
| Database backups | 30 days |
| Refresh tokens | 7 days (automatic expiry) |

---

## 5. Network Security

### 5.1 Infrastructure Controls

```
Internet ──► Route 53 ──► ALB (HTTPS only, HTTP redirected)
                              │
                         ──► VPC (private subnets)
                              │
                         ──► EKS Worker Nodes (Security Groups)
                              │
                         ──► RDS (isolated subnet, no public access)
```

### 5.2 Security Groups

| SG Name | Inbound | Outbound |
|---------|---------|----------|
| alb-sg | 443 from 0.0.0.0/0, 80 from 0.0.0.0/0 | 8080 to eks-nodes-sg |
| eks-nodes-sg | 8080 from alb-sg, all from same SG | All |
| rds-sg | 5432 from eks-nodes-sg ONLY | None |

---

## 6. Secret Management

### 6.1 Kubernetes Secrets

All sensitive configuration is stored as Kubernetes Secrets (base64 encoded, access via RBAC):

```yaml
# Secrets managed by - never committed to Git
Secrets:
  - db-credentials:
      DB_USERNAME, DB_PASSWORD
  - jwt-secret:
      JWT_SECRET_KEY (256-bit minimum)
  - redis-credentials:
      REDIS_PASSWORD
```

### 6.2 Secret Rotation Policy

| Secret | Rotation Frequency | Method |
|--------|-------------------|--------|
| JWT signing key | Quarterly | Kubernetes rolling update |
| DB password | Quarterly | AWS Secrets Manager rotation |
| TLS certificates | Annual (auto via cert-manager) | Automatic |
| Service account tokens | 90 days | Kubernetes automatic |

---

## 7. Audit & Monitoring

### 7.1 Security Events Logged

```
✓ User login (success + failure with reason)
✓ User logout
✓ Token refresh
✓ Authorization denial (403) with resource details
✓ Password change
✓ Account lockout trigger
✓ Admin privilege escalation
✓ Project member added/removed
✓ Task deletion
```

### 7.2 Security Alerts (Grafana)

| Alert | Threshold | Severity |
|-------|-----------|---------|
| Login failure spike | >50 failures/5min | HIGH |
| 403 spike (potential scan) | >100/5min | MEDIUM |
| 401 token failures | >200/5min | MEDIUM |
| New ADMIN user created | Any | INFO |

---

## 8. Incident Response

### 8.1 Severity Levels

| Level | Description | Response Time |
|-------|-------------|--------------|
| P1 CRITICAL | Data breach, service down | 15 minutes |
| P2 HIGH | Auth bypass, injection | 1 hour |
| P3 MEDIUM | Privilege escalation | 4 hours |
| P4 LOW | Misconfiguration | Next business day |

### 8.2 Breach Response Steps

1. **Detect** — Alert fires via Grafana / CloudWatch
2. **Contain** — Revoke all active JWT tokens (secret rotation), isolate affected pods
3. **Assess** — Determine scope using audit logs and CloudTrail
4. **Notify** — GDPR: notify supervisory authority within 72 hours if PII affected
5. **Remediate** — Patch vulnerability, rotate secrets, re-deploy
6. **Review** — Post-incident review, TTD update, runbook update

---

*This document must be reviewed quarterly or after any significant infrastructure change.*
