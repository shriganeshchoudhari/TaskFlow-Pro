# ADR 0001: JWT HS512 for Authentication

## Status

Accepted

## Context

TaskFlow Pro requires a stateless authentication mechanism for a REST API served by Spring Boot and consumed by a React SPA. The system must support short-lived sessions (to limit token theft exposure) and long-lived "remember me" sessions (refresh tokens). The backend is deployed horizontally across multiple Kubernetes pods, ruling out server-side session storage without a shared cache.

## Decision

Use **JWT (JSON Web Token)** with the **HS512** (HMAC-SHA-512) signing algorithm for both access tokens and refresh tokens.

- **Access token:** 15-minute expiry, carries `{ sub: userId, email, role, iat, exp }` claims
- **Refresh token:** 7-day expiry, stored in the `refresh_tokens` database table with revocation support (`is_revoked` flag)
- **Rotation:** New refresh token issued on every `/auth/refresh` call (prevents replay attacks)
- **Secret:** Stored in a Kubernetes Secret / environment variable (never in code)

## Options Considered

### A. JWT HS512 (chosen)
- **Pros:** Stateless, horizontally scalable, no shared cache needed, industry-standard, Spring Security native support, single secret to manage
- **Cons:** Cannot invalidate individual access tokens before expiry (mitigated by 15-min window), symmetric algorithm (same key to sign and verify)

### B. JWT RS256 (asymmetric)
- **Pros:** Public key can be shared with third parties for token verification without exposing signing key
- **Cons:** More complex key management (key pairs, rotation), no immediate need for public verification in MVP; adds operational overhead with no benefit for v1.0

### C. Opaque tokens + Redis session store
- **Pros:** Full revocation control at any moment, no token size overhead
- **Cons:** Every request hits Redis (latency + single point of failure), adds Redis dependency to the critical authentication path, breaks stateless architecture goal

### D. Spring Session + cookie-based sessions
- **Pros:** Simple, built-in Spring support
- **Cons:** Requires sticky sessions or shared session store (Redis), not SPA-friendly, CSRF complexity increases

## Tradeoffs

| Concern | How HS512 JWT addresses it |
|---------|---------------------------|
| Horizontal scaling | Stateless — any pod validates any token with shared secret |
| Token theft | Short 15-min access token window limits exposure |
| Long session | 7-day refresh token, rotated on use |
| Logout / revocation | Refresh token revoked in DB; access token expires naturally |
| Secret compromise | Kubernetes Secret rotation + rolling pod restart |

## Consequences

- `JwtTokenProvider.java` owns all token generation and validation logic
- `JwtAuthFilter.java` (OncePerRequestFilter) validates Bearer token on every request
- `refresh_tokens` table required in DB (V8 Flyway migration)
- Access token must **not** be stored in `localStorage` in the frontend (XSS risk) — store in memory (Redux state); refresh token may use `HttpOnly` cookie in v1.1
- Rate limiting on `/auth/login` and `/auth/register` required (implemented in Phase 5)
- Secret rotation procedure documented in `docs/SECURITY_COMPLIANCE.md §6.2`

## References

- `backend/src/main/java/com/taskflow/security/JwtTokenProvider.java`
- `backend/src/main/java/com/taskflow/security/JwtAuthFilter.java`
- `docs/SECURITY_COMPLIANCE.md §1`
- `docs/API_DOCUMENTATION.md §1–2`
- Implementation tasks: B1-06, B1-07, B1-08, B1-09
