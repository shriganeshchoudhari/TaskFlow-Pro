# ADR 0002: PostgreSQL + Flyway for Database and Migrations

## Status

Accepted

## Context

TaskFlow Pro requires a relational database to store users, projects, tasks, comments, notifications, and activity logs. The data model has clear relational structure (projects contain tasks, tasks belong to projects/users, etc.), requires ACID transactions, and needs efficient filtering and pagination queries. Schema evolution must be traceable and reproducible across dev/staging/production environments.

## Decision

Use **PostgreSQL 16** as the primary database and **Flyway** for versioned schema migrations.

- **PostgreSQL 16** deployed on AWS RDS (Multi-AZ in production)
- **UUID primary keys** (`gen_random_uuid()`) on all tables — avoids sequential ID exposure, supports distributed generation
- **Flyway** versioned migrations (`V1__` through `V9__`) under `backend/src/main/resources/db/migration/`
- **HikariCP** connection pool (max 20 connections per pod, configured in `application.yml`)
- **JPA / Hibernate** (`ddl-auto=validate`) — schema owned by Flyway, not Hibernate

## Options Considered

### A. PostgreSQL + Flyway (chosen)
- **Pros:** ACID, mature, excellent JSON/JSONB support (used for `activities.metadata`), native array type (used for `tasks.tags`), full-text search available, strong AWS RDS support, Flyway is simple, immutable, and widely adopted; `validate` mode prevents Hibernate from altering schema silently
- **Cons:** Requires running PostgreSQL locally (Docker); Flyway undo requires Flyway Teams license (workaround: compensating migrations)

### B. PostgreSQL + Liquibase
- **Pros:** More features (rollback support, diff generation), XML/YAML/JSON/SQL formats
- **Cons:** More complex configuration, overkill for this project size; Flyway's simpler model is sufficient and already integrated with Spring Boot auto-config

### C. MySQL + Flyway
- **Pros:** Familiar to many developers, good AWS RDS support
- **Cons:** UUID handling less ergonomic (no native `gen_random_uuid()`), no native array type (`tasks.tags` would require separate table or JSON), weaker partial index support, weaker JSONB for `activities.metadata`

### D. MongoDB (document store)
- **Pros:** Schema-less, flexible for activity/notification documents
- **Cons:** No ACID transactions across collections, poor fit for relational task/project/user data, adds operational complexity; relational model is clearly the right fit here

## Tradeoffs

| Concern | How this choice addresses it |
|---------|------------------------------|
| Schema reproducibility | Flyway version-numbered scripts, immutable once applied |
| Data integrity | Foreign keys, UNIQUE constraints, NOT NULL enforced at DB level |
| Performance | Composite indexes (project_id, status), partial indexes (unread notifications) |
| Flexibility | JSONB column for activity metadata; TEXT[] for task tags |
| Local dev | Docker Compose starts PostgreSQL in one command |
| Production | AWS RDS Multi-AZ, automated backups every 6h, 30-day retention |

## Consequences

- All schema changes go through a new Flyway migration (`V{n}__...sql`) — never via `ddl-auto=create/update`
- Migration scripts are **immutable** once merged to any environment
- Breaking changes must use a transitional migration approach (add → deploy → drop in next migration)
- `database/schema.sql` kept as a reference full-schema dump (not used by Flyway directly)
- `docs/DATABASE_SCHEMA.md` must be updated whenever a migration is added
- Flyway migration test: `mvnw spring-boot:run` against fresh DB must show all migrations `SUCCEEDED`
- Production RDS uses `application-prod.yml` profile with separate credentials from Kubernetes Secrets

## Migration File Index

| File | Task | Description |
|------|------|-------------|
| `V1__create_users_table.sql` | B1-01 | users table + email index |
| `V2__create_projects_table.sql` | B2-01 | projects table |
| `V3__create_project_members_table.sql` | B2-02 | project_members + unique constraint |
| `V4__create_tasks_table.sql` | B3-01 | tasks table + composite index |
| `V5__create_comments_table.sql` | B4-01 | comments table |
| `V6__create_notifications_table.sql` | B4-06 | notifications + partial unread index |
| `V7__create_activities_table.sql` | B4-12 | activities table + JSONB metadata |
| `V8__create_refresh_tokens_table.sql` | B1-02 | refresh_tokens + revocation flag |
| `V9__create_indexes.sql` | D6-04 | all remaining indexes |

## References

- `backend/src/main/resources/db/migration/`
- `database/schema.sql`
- `docs/DATABASE_SCHEMA.md`
- Implementation tasks: B1-01, B1-02, B2-01, B2-02, B3-01, B4-01, B4-06, B4-12, D6-04
