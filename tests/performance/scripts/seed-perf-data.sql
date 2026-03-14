-- PT-DT-01 — Seed performance test data
-- Creates 50 users, 5 projects, 200 tasks, 100 comments for realistic load.
-- Apply via: psql $DATABASE_URL -f seed-perf-data.sql
-- Idempotent: wrapped in a transaction with conflict-safe inserts.

BEGIN;

-- ── 50 perf test users ──────────────────────────────────────────────────────
-- Password hash = bcrypt("PerfSeed123!") strength 12
DO $$
DECLARE
  i INT;
  uid UUID;
  pw_hash TEXT := '$2a$12$LixP.PwXhQyQgL9D2a1hD.Xr9k1mZKqPwXbWKqe3gVXcPj7kT1mRy';
BEGIN
  FOR i IN 1..50 LOOP
    uid := gen_random_uuid();
    INSERT INTO users (id, email, full_name, password, role, is_active)
    VALUES (
      uid,
      format('perfuser%s@perf.test', i),
      format('Perf User %s', i),
      pw_hash,
      'MEMBER',
      true
    )
    ON CONFLICT (email) DO NOTHING;
  END LOOP;
END $$;

-- ── 5 perf test projects (owned by perfuser1) ────────────────────────────────
DO $$
DECLARE
  owner_id UUID;
  proj_id  UUID;
  proj_names TEXT[] := ARRAY['Alpha Project','Beta Project','Gamma Project','Delta Project','Epsilon Project'];
  pname TEXT;
BEGIN
  SELECT id INTO owner_id FROM users WHERE email = 'perfuser1@perf.test' LIMIT 1;
  IF owner_id IS NULL THEN RETURN; END IF;

  FOREACH pname IN ARRAY proj_names LOOP
    proj_id := gen_random_uuid();
    INSERT INTO projects (id, name, description, status, visibility, owner_id)
    VALUES (proj_id, pname, 'Performance test project', 'ACTIVE', 'PRIVATE', owner_id)
    ON CONFLICT DO NOTHING;

    -- Add owner as MANAGER member
    INSERT INTO project_members (project_id, user_id, role, joined_at)
    VALUES (proj_id, owner_id, 'MANAGER', NOW())
    ON CONFLICT DO NOTHING;

    -- Add 9 more members (perfuser2–10)
    INSERT INTO project_members (project_id, user_id, role, joined_at)
    SELECT proj_id, u.id, 'MEMBER', NOW()
    FROM users u
    WHERE u.email LIKE 'perfuser%@perf.test'
      AND u.email != 'perfuser1@perf.test'
    LIMIT 9
    ON CONFLICT DO NOTHING;
  END LOOP;
END $$;

-- ── 200 tasks distributed across the 5 projects ─────────────────────────────
DO $$
DECLARE
  proj_ids   UUID[];
  user_ids   UUID[];
  statuses   TEXT[] := ARRAY['TODO','TODO','IN_PROGRESS','REVIEW','DONE'];
  priorities TEXT[] := ARRAY['LOW','MEDIUM','MEDIUM','HIGH','CRITICAL'];
  i          INT;
  proj_id    UUID;
  reporter_id UUID;
  assignee_id UUID;
BEGIN
  SELECT ARRAY_AGG(id) INTO proj_ids  FROM projects WHERE name LIKE '%Project' AND status = 'ACTIVE';
  SELECT ARRAY_AGG(id) INTO user_ids  FROM users   WHERE email LIKE 'perfuser%@perf.test';

  IF proj_ids IS NULL OR user_ids IS NULL THEN RETURN; END IF;

  FOR i IN 1..200 LOOP
    proj_id     := proj_ids[1 + (i % ARRAY_LENGTH(proj_ids, 1))];
    reporter_id := user_ids[1 + (i % ARRAY_LENGTH(user_ids, 1))];
    assignee_id := user_ids[1 + ((i + 3) % ARRAY_LENGTH(user_ids, 1))];

    INSERT INTO tasks (
      id, title, description, status, priority,
      due_date, project_id, reporter_id, assignee_id, position
    ) VALUES (
      gen_random_uuid(),
      format('Perf Task %s', i),
      'Auto-generated performance test task',
      statuses[1 + (i % ARRAY_LENGTH(statuses, 1))],
      priorities[1 + (i % ARRAY_LENGTH(priorities, 1))],
      NOW() + ((i % 30) || ' days')::INTERVAL,
      proj_id,
      reporter_id,
      assignee_id,
      i
    )
    ON CONFLICT DO NOTHING;
  END LOOP;
END $$;

-- ── 100 comments on tasks ────────────────────────────────────────────────────
DO $$
DECLARE
  task_ids UUID[];
  user_ids UUID[];
  i        INT;
BEGIN
  SELECT ARRAY_AGG(id) INTO task_ids FROM tasks WHERE title LIKE 'Perf Task %';
  SELECT ARRAY_AGG(id) INTO user_ids FROM users WHERE email LIKE 'perfuser%@perf.test';

  IF task_ids IS NULL OR user_ids IS NULL THEN RETURN; END IF;

  FOR i IN 1..100 LOOP
    INSERT INTO comments (id, content, task_id, author_id, is_edited)
    VALUES (
      gen_random_uuid(),
      format('Performance test comment number %s', i),
      task_ids[1 + (i % ARRAY_LENGTH(task_ids, 1))],
      user_ids[1 + (i % ARRAY_LENGTH(user_ids, 1))],
      false
    )
    ON CONFLICT DO NOTHING;
  END LOOP;
END $$;

COMMIT;

-- Verify
SELECT
  (SELECT COUNT(*) FROM users   WHERE email LIKE 'perfuser%@perf.test') AS perf_users,
  (SELECT COUNT(*) FROM projects WHERE name LIKE '%Project' AND status='ACTIVE') AS perf_projects,
  (SELECT COUNT(*) FROM tasks   WHERE title LIKE 'Perf Task %')         AS perf_tasks,
  (SELECT COUNT(*) FROM comments WHERE content LIKE 'Performance test%') AS perf_comments;
