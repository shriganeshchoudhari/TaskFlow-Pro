# Flyway Migrations Reference

The actual migration SQL files live in the backend:

```
backend/src/main/resources/db/migration/
├── V1__create_users_table.sql
├── V2__create_projects_table.sql
├── V3__create_project_members_table.sql
├── V4__create_tasks_table.sql
├── V5__create_comments_table.sql
├── V6__create_notifications_table.sql
├── V7__create_activities_table.sql
├── V8__create_refresh_tokens_table.sql
├── V9__create_indexes.sql
├── V10__create_attachments_table.sql
├── V11__create_subtasks_time_tracking.sql
└── V12__seed_test_data.sql
```

This `database/migrations/` directory is a reference folder. The authoritative migration files
are in `backend/src/main/resources/db/migration/` and are applied automatically by Flyway on startup.

## Full Schema Documentation

See [`docs/DATABASE_SCHEMA.md`](../../docs/DATABASE_SCHEMA.md) for:
- ER diagram
- All 10 table definitions with column types and constraints
- Indexing strategy and rationale
- Migration workflow and rules

## Running Migrations

Flyway runs automatically on Spring Boot startup. To test against a fresh database:

```bash
# Wipe and restart
docker compose -f infra/docker/docker-compose.dev.yml down -v
docker compose -f infra/docker/docker-compose.dev.yml up postgres -d

# Apply all migrations
cd backend && ./mvnw spring-boot:run

# Verify all succeeded
curl http://localhost:8080/actuator/flyway
```

## Adding a New Migration

1. Create `V13__your_description.sql` in `backend/src/main/resources/db/migration/`
2. Write additive SQL (add columns/tables, avoid drops in the same migration)
3. Test on fresh DB (see above)
4. Update `docs/DATABASE_SCHEMA.md`
5. The `repair-on-migrate: true` setting handles checksum repairs automatically
