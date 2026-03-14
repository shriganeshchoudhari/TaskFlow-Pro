# ADRs (Architecture Decision Records)

Use ADRs to record significant decisions that affect architecture, technology choices, or long-lived constraints.

## Process

1. Copy `0000-template.md` to `{NNNN}-{short-title}.md`
2. Fill in: context, decision, options, tradeoffs, consequences, references
3. Link the ADR from relevant docs if it changes direction (`docs/TTD.md`, etc.)
4. Add entry to this index

## Index

| # | Title | Status | Phase | Affects |
|---|-------|--------|-------|---------|
| [0001](0001-jwt-hs512-authentication.md) | JWT HS512 for Authentication | Accepted | 1 | `security/`, `B1-06–B1-09` |
| [0002](0002-postgresql-flyway-migrations.md) | PostgreSQL + Flyway for DB & Migrations | Accepted | 1 | `db/migration/`, V1–V12, all migration tasks |
| [0003](0003-bucket4j-rate-limiting.md) | Bucket4j for In-Process Rate Limiting | Accepted | 5 | `config/RateLimitFilter.java`, B5-04 |
| [0004](0004-performance-testing-strategy.md) | Four-Tool Performance Testing Strategy | Accepted | 7 | `tests/performance/`, all PT-* tasks |

## When to Write an ADR

Write an ADR when the decision:
- Affects architecture, infrastructure, or technology selection
- Has significant tradeoffs or rejected alternatives
- Would be costly or risky to reverse later
- Other developers would reasonably ask "why did we do it this way?"

Examples: choosing a caching strategy, switching from polling to WebSockets, adopting a new testing framework, changing deployment target, choosing a rate limiting approach.
