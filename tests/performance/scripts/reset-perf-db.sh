#!/usr/bin/env bash
# PT-DT-03 — Reset performance database to a clean seeded state.
# Truncates all perf-test data and re-seeds from seed-perf-data.sql.
# Safe to run between test runs — idempotent.
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
command -v psql &>/dev/null || error "psql not found — install postgresql-client"

info "Connecting to: $DB_URL"
info "Truncating perf test data ..."

psql "$DB_URL" <<'SQL'
BEGIN;

-- Remove perf test data only — leave real data untouched
DELETE FROM comments  WHERE content LIKE 'Performance test%';
DELETE FROM activities WHERE actor_id IN (
    SELECT id FROM users WHERE email LIKE 'perfuser%@perf.test'
        OR email LIKE '%@perf.test'
);
DELETE FROM notifications WHERE user_id IN (
    SELECT id FROM users WHERE email LIKE '%@perf.test'
);
DELETE FROM tasks   WHERE title LIKE 'Perf Task %'
   OR title LIKE 'Locust Task%'
   OR title LIKE 'Load Task%'
   OR title LIKE 'Gatling Task%'
   OR title LIKE 'Soak Task%';
DELETE FROM project_members WHERE user_id IN (
    SELECT id FROM users WHERE email LIKE '%@perf.test'
);
DELETE FROM projects WHERE name IN
    ('Alpha Project','Beta Project','Gamma Project','Delta Project','Epsilon Project')
    OR name LIKE '%Perf Project%'
    OR name LIKE 'Locust Project%'
    OR name LIKE 'Gatling Project%'
    OR name LIKE 'Board Perf%'
    OR name LIKE 'Load Test Project%';
DELETE FROM refresh_tokens WHERE user_id IN (
    SELECT id FROM users WHERE email LIKE '%@perf.test'
);
DELETE FROM users WHERE email LIKE '%@perf.test';

COMMIT;
SQL

info "Truncation complete. Re-seeding ..."
psql "$DB_URL" -f "$SEED_SQL"

info "Done. Database reset to clean perf-test state."
