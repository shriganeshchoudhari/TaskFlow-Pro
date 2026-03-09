# ADRs (Architecture Decision Records)

Use ADRs to record significant decisions that affect architecture, technology choices, or long-lived constraints.

## Process

1. Copy `0000-template.md` to `{NNNN}-{short-title}.md`
2. Fill in: context, decision, options, tradeoffs, consequences, references
3. Link the ADR from relevant docs if it changes direction (`docs/TTD.md`, etc.)
4. Add entry to this index

## Index

| # | Title | Status | Affects |
|---|-------|--------|---------|
| [0001](0001-jwt-hs512-authentication.md) | JWT HS512 for Authentication | Accepted | `security/`, `B1-06–B1-09` |
| [0002](0002-postgresql-flyway-migrations.md) | PostgreSQL + Flyway for DB & Migrations | Accepted | `db/migration/`, `B1-01–B1-02`, `B2-01–B2-02`, `B3-01`, `B4-01`, `B4-06`, `B4-12` |

## When to Write an ADR

Write an ADR when the decision:
- Affects architecture, infrastructure, or technology selection
- Has significant tradeoffs or rejected alternatives
- Would be costly or risky to reverse later
- Other developers would reasonably ask "why did we do it this way?"

Examples: choosing a caching strategy, switching from polling to WebSockets, adopting a new testing framework, changing deployment target.
