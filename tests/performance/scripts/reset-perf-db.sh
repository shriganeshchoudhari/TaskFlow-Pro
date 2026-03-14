#!/usr/bin/env bash
# PT-DT-03 — Reset performance database to a clean seeded state.
# Removes ALL perf-test data created by any tool (k6, JMeter, Gatling, Locust, soak),
# then re-seeds from seed-perf-data.sql.
#
# Safe to run between test runs — idempotent.
# Delete order respects FK constraints (children before parents).
#
# Usage:
#   ./scripts/reset-perf-db.sh
#   DATABASE_URL=postgresql://user:pass@host:5432/db ./scripts/reset-perf-db.sh

set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
info()  { echo -e "${GREEN}[reset-db]${NC} $*"; }
warn()  { echo -e "${YELLOW}[reset-db]${NC} $*"; }
error() { echo -e "${RED}[reset-db]${NC} $*"; exit 1; }

DB_URL="${DATABASE_URL:-postgresql://taskflow:taskflow_dev_password@localhost:5432/taskflow_dev}"
SEED_SQL="$(dirname "$0")/seed-perf-data.sql"

[[ ! -f "$SEED_SQL" ]] && error "Seed file not found: $SEED_SQL"
command -v psql &>/dev/null   || error "psql not found — install postgresql-client"

info "Connecting to: $DB_URL"
info "Truncating all perf test data ..."

psql "$DB_URL" <<'SQL'
BEGIN;

-- ── Identify perf project IDs for targeted deletion ──────────────────────────
-- Collect all perf project IDs into a temp table to avoid repeated subqueries.
CREATE TEMP TABLE _perf_proj_ids AS
SELECT id FROM projects
WHERE name = ANY(ARRAY[
  'Alpha Project','Beta Project','Gamma Project','Delta Project','Epsilon Project'
])
OR name LIKE 'Locust Project%'
OR name LIKE 'Soak Project%'
OR name LIKE 'Gatling Project%'
OR name LIKE 'Board Perf%'
OR name LIKE 'Load Test Project%'
OR name LIKE '%Perf Project%'
OR name LIKE 'k6 Project%'
OR name LIKE 'JMeter Project%';

-- Collect perf user IDs
CREATE TEMP TABLE _perf_user_ids AS
SELECT id FROM users WHERE email LIKE '%@perf.test';

-- ── Step 1: subtasks (CASCADE from tasks, but explicit is safer) ──────────────
DELETE FROM subtasks
WHERE task_id IN (
  SELECT id FROM tasks WHERE title LIKE ANY(ARRAY[
    'Perf Task %', 'Locust Task%', 'Soak Task%',
    'Load Task%',  'Gatling Task%', 'k6 Task%', 'JMeter Task%'
  ])
);

-- ── Step 2: task_tags ─────────────────────────────────────────────────────────
DELETE FROM task_tags
WHERE task_id IN (
  SELECT id FROM tasks WHERE title LIKE ANY(ARRAY[
    'Perf Task %', 'Locust Task%', 'Soak Task%',
    'Load Task%',  'Gatling Task%', 'k6 Task%', 'JMeter Task%'
  ])
);

-- ── Step 3: attachments ───────────────────────────────────────────────────────
DELETE FROM attachments
WHERE task_id IN (
  SELECT id FROM tasks WHERE title LIKE ANY(ARRAY[
    'Perf Task %', 'Locust Task%', 'Soak Task%',
    'Load Task%',  'Gatling Task%', 'k6 Task%', 'JMeter Task%'
  ])
)
OR uploader_id IN (SELECT id FROM _perf_user_ids);

-- ── Step 4: comments ──────────────────────────────────────────────────────────
DELETE FROM comments
WHERE content LIKE ANY(ARRAY[
  'Performance test%', 'Locust performance%',
  'k6 comment%',       'Soak comment%'
])
OR author_id IN (SELECT id FROM _perf_user_ids);

-- ── Step 5: activities — delete by actor AND by project/task reference ─────────
-- This prevents orphaned rows (task_id/project_id become NULL on cascade otherwise,
-- accumulating unbounded rows across test runs).
DELETE FROM activities
WHERE actor_id IN (SELECT id FROM _perf_user_ids)
   OR project_id IN (SELECT id FROM _perf_proj_ids)
   OR task_id IN (
     SELECT id FROM tasks WHERE title LIKE ANY(ARRAY[
       'Perf Task %', 'Locust Task%', 'Soak Task%',
       'Load Task%',  'Gatling Task%', 'k6 Task%', 'JMeter Task%'
     ])
   );

-- ── Step 6: notifications ─────────────────────────────────────────────────────
DELETE FROM notifications
WHERE user_id    IN (SELECT id FROM _perf_user_ids)
   OR project_id IN (SELECT id FROM _perf_proj_ids)
   OR task_id    IN (
     SELECT id FROM tasks WHERE title LIKE ANY(ARRAY[
       'Perf Task %', 'Locust Task%', 'Soak Task%',
       'Load Task%',  'Gatling Task%', 'k6 Task%', 'JMeter Task%'
     ])
   );

-- ── Step 7: tasks ─────────────────────────────────────────────────────────────
DELETE FROM tasks
WHERE project_id IN (SELECT id FROM _perf_proj_ids)
   OR title LIKE ANY(ARRAY[
     'Perf Task %', 'Locust Task%', 'Soak Task%',
     'Load Task%',  'Gatling Task%', 'k6 Task%', 'JMeter Task%'
   ]);

-- ── Step 8: project_members ───────────────────────────────────────────────────
DELETE FROM project_members
WHERE user_id    IN (SELECT id FROM _perf_user_ids)
   OR project_id IN (SELECT id FROM _perf_proj_ids);

-- ── Step 9: projects ──────────────────────────────────────────────────────────
-- Now safe: no tasks, no members, no FK references remain
DELETE FROM projects WHERE id IN (SELECT id FROM _perf_proj_ids);

-- ── Step 10: refresh_tokens ───────────────────────────────────────────────────
DELETE FROM refresh_tokens
WHERE user_id IN (SELECT id FROM _perf_user_ids);

-- ── Step 11: users ────────────────────────────────────────────────────────────
-- All FK references to perf users cleared above — this is now safe
DELETE FROM users WHERE id IN (SELECT id FROM _perf_user_ids);

-- Cleanup temp tables
DROP TABLE _perf_proj_ids;
DROP TABLE _perf_user_ids;

COMMIT;

-- Verify everything is clean
SELECT
  (SELECT COUNT(*) FROM users    WHERE email LIKE '%@perf.test')           AS remaining_users,
  (SELECT COUNT(*) FROM projects WHERE name LIKE ANY(ARRAY['Alpha Project','%Perf%','Locust%','Soak%'])) AS remaining_projects,
  (SELECT COUNT(*) FROM tasks    WHERE title LIKE ANY(ARRAY['Perf Task %','Locust%','Soak Task%']))       AS remaining_tasks,
  (SELECT COUNT(*) FROM activities WHERE task_id IS NULL AND project_id IS NULL
                                    AND actor_id NOT IN (SELECT id FROM users WHERE is_active = true))    AS orphaned_activities;
-- All should be 0
SQL

info "Truncation complete. Re-seeding ..."
psql "$DB_URL" -f "$SEED_SQL"

info "Done. Database reset to clean perf-test state."
