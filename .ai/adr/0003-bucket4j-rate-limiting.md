# ADR 0003: Bucket4j for In-Process Rate Limiting

## Status

Accepted (Phase 5 — implemented in `RateLimitFilter.java`)

## Context

TaskFlow Pro requires rate limiting on auth endpoints to mitigate brute-force login attacks and
registration spam. The solution must be operational in all environments including local development
without additional infrastructure dependencies.

## Decision

Use **Bucket4j** (token-bucket algorithm) as an in-process servlet filter for rate limiting
`/auth/login` and `/auth/register`.

Limits enforced per remote IP address:
- `POST /auth/login` — 10 requests per 15 minutes
- `POST /auth/register` — 5 requests per 1 hour

Returns HTTP 429 with `Retry-After` header and JSON body:
```json
{"status":429,"error":"TOO_MANY_REQUESTS","message":"Rate limit exceeded. Please try again later.","retryAfter":900}
```

## Options Considered

### A. Bucket4j in-process (chosen)
- **Pros:** Zero additional infrastructure, zero latency overhead, works in all environments (local + K8s), no Redis deployment complexity, easy to tune limits per-endpoint
- **Cons:** Bucket state is per-pod (not shared across HPA replicas) — each pod maintains its own IP bucket map; an attacker hitting different pods can exceed limits if load balancer distributes requests

### B. Redis + Spring rate limiting (rejected)
- **Pros:** Shared state across all K8s pods; absolute enforcement regardless of pod count
- **Cons:** Adds Redis to the critical auth path (extra infra, extra latency, extra failure point); Redis was already removed from the component inventory in Phase 5 as unnecessary for v1.0

### C. Nginx rate limiting at ingress
- **Pros:** Shared state, no application code, very fast
- **Cons:** Not configurable per-endpoint without nginx config changes; harder to test; not available in local dev without nginx running

## Tradeoffs

For v1.0 with 2–10 pods behind an ALB that routes per-connection (not per-request), the per-pod
limit is an acceptable tradeoff. An attacker making 10 requests/pod across 10 pods would hit
100 requests — which is still a meaningful deterrent and adds observable 429 signals in logs
and Grafana alerts.

If the application scales to significantly more pods or if stricter enforcement is required,
the Bucket4j `ConcurrentHashMap` can be replaced with a Bucket4j Redis backend using the same
`RateLimitFilter` interface, requiring no other code changes.

## Consequences

- `config/RateLimitFilter.java` — servlet filter, `@Order(2)`, runs after `MdcTraceIdFilter`
- `pom.xml` dependency: `com.bucket4j:bucket4j-core:8.10.1`
- Returns `X-Forwarded-For`-aware client IP (supports load balancer deployments)
- Logs every rate limit violation at WARN level with IP address for Grafana alerting
- `SECURITY_COMPLIANCE.md §1.4` documents the policy

## References

- `backend/src/main/java/com/taskflow/config/RateLimitFilter.java`
- `docs/SECURITY_COMPLIANCE.md §1.4`
- `docs/API_DOCUMENTATION.md §11 Rate Limiting`
- Implementation task: B5-04
