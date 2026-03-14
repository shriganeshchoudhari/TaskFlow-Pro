-- PT-DT-01 — Seed performance test data
-- Creates 50 users, 5 projects, 200 tasks, 100 comments for realistic load testing.
--
-- TRULY IDEMPOTENT: every row uses a deterministic UUID derived from md5(stable_key)
-- so ON CONFLICT (id) DO NOTHING skips existing rows on any re-run.
--
-- Usage:
--   psql $DATABASE_URL -f seed-perf-data.sql
--
-- Reset before a clean run:
--   bash scripts/reset-perf-db.sh
--
-- Credentials:
--   Users 1–50:  perfuser{N}@perf.test / PerfSeed123!
--   Password hash = bcrypt("PerfSeed123!", strength=12)

BEGIN;

-- ── 50 perf test users (idempotent: conflicts on email UNIQUE) ────────────────
-- BCrypt(strength=12) hash for "PerfSeed123!"
DO $$
DECLARE
  i        INT;
  pw_hash  TEXT := '$2a$12$LixP.PwXhQyQgL9D2a1hD.Xr9k1mZKqPwXbWKqe3gVXcPj7kT1mRy';
BEGIN
  FOR i IN 1..50 LOOP
    INSERT INTO users (id, email, full_name, password, role, is_active)
    VALUES (
      md5(format('perf-user:%s', i))::uuid,
      format('perfuser%s@perf.test', i),
      format('Perf User %s', i),
      pw_hash,
      'MEMBER',
      true
    )
    ON CONFLICT (id) DO NOTHING;
    -- email unique constraint also protects against duplication
    -- so double-run is safe even if only email index fires
  END LOOP;
END $$;

-- ── 5 perf test projects (deterministic IDs, truly idempotent) ───────────────
DO $$
DECLARE
  owner_id   UUID;
  proj_id    UUID;
  proj_names TEXT[] := ARRAY[
    'Alpha Project', 'Beta Project', 'Gamma Project',
    'Delta Project', 'Epsilon Project'
  ];
  pname TEXT;
BEGIN
  SELECT id INTO owner_id
  FROM users WHERE email = 'perfuser1@perf.test' LIMIT 1;

  IF owner_id IS NULL THEN
    RAISE EXCEPTION 'perfuser1@perf.test not found — run user seed first';
  END IF;

  FOREACH pname IN ARRAY proj_names LOOP
    -- Deterministic UUID: same key → same UUID every run
    proj_id := md5(format('perf-project:%s', pname))::uuid;

    INSERT INTO projects (id, name, description, status, visibility, owner_id)
    VALUES (proj_id, pname, 'Performance test project', 'ACTIVE', 'PRIVATE', owner_id)
    ON CONFLICT (id) DO NOTHING;

    -- Owner as MANAGER
    INSERT INTO project_members (project_id, user_id, role, joined_at)
    VALUES (proj_id, owner_id, 'MANAGER', NOW())
    ON CONFLICT ON CONSTRAINT uq_project_members DO NOTHING;

    -- Add 9 more members from perfuser2–10
    INSERT INTO project_members (project_id, user_id, role, joined_at)
    SELECT proj_id, u.id, 'MEMBER', NOW()
    FROM users u
    WHERE u.email LIKE 'perfuser%@perf.test'
      AND u.email != 'perfuser1@perf.test'
    ORDER BY u.email
    LIMIT 9
    ON CONFLICT ON CONSTRAINT uq_project_members DO NOTHING;
  END LOOP;
END $$;

-- ── 200 tasks (deterministic IDs, distributed evenly across 5 projects) ───────
DO $$
DECLARE
  proj_ids    UUID[];
  user_ids    UUID[];
  statuses    TEXT[]    := ARRAY['TODO', 'TODO', 'IN_PROGRESS', 'REVIEW', 'DONE'];
  priorities  TEXT[]    := ARRAY['LOW', 'MEDIUM', 'MEDIUM', 'HIGH', 'CRITICAL'];
  n_proj      INT;
  n_users     INT;
  i           INT;
  proj_id     UUID;
  reporter_id UUID;
  assignee_id UUID;
BEGIN
  SELECT ARRAY_AGG(id ORDER BY name)
    INTO proj_ids
    FROM projects
   WHERE name = ANY(ARRAY['Alpha Project','Beta Project','Gamma Project','Delta Project','Epsilon Project']);

  SELECT ARRAY_AGG(id ORDER BY email)
    INTO user_ids
    FROM users
   WHERE email LIKE 'perfuser%@perf.test';

  IF proj_ids IS NULL OR user_ids IS NULL THEN
    RAISE EXCEPTION 'Perf projects or users not found — ensure prior steps completed';
  END IF;

  n_proj  := ARRAY_LENGTH(proj_ids, 1);
  n_users := ARRAY_LENGTH(user_ids, 1);

  FOR i IN 1..200 LOOP
    proj_id     := proj_ids[1 + ((i - 1) % n_proj)];
    reporter_id := user_ids[1 + ((i - 1)       % n_users)];
    assignee_id := user_ids[1 + ((i - 1 + 3)   % n_users)];

    INSERT INTO tasks (
      id, title, description, status, priority,
      due_date, project_id, reporter_id, assignee_id,
      estimated_hours, logged_hours, position
    ) VALUES (
      md5(format('perf-task:%s', i))::uuid,
      format('Perf Task %s', i),
      'Auto-generated performance test task',
      statuses   [1 + ((i - 1) % ARRAY_LENGTH(statuses,   1))],
      priorities [1 + ((i - 1) % ARRAY_LENGTH(priorities, 1))],
      NOW() + ((i % 30) || ' days')::INTERVAL,
      proj_id,
      reporter_id,
      assignee_id,
      4 + (i % 8),     -- estimated_hours: 4–11 (INTEGER)
      (i % 5)::float,  -- logged_hours: 0–4 (DOUBLE PRECISION)
      i
    )
    ON CONFLICT (id) DO NOTHING;
  END LOOP;
END $$;

-- ── 100 comments on tasks (deterministic IDs) ─────────────────────────────────
DO $$
DECLARE
  task_ids UUID[];
  user_ids UUID[];
  n_tasks  INT;
  n_users  INT;
  i        INT;
BEGIN
  SELECT ARRAY_AGG(id ORDER BY title)
    INTO task_ids
    FROM tasks
   WHERE title LIKE 'Perf Task %';

  SELECT ARRAY_AGG(id ORDER BY email)
    INTO user_ids
    FROM users
   WHERE email LIKE 'perfuser%@perf.test';

  IF task_ids IS NULL OR user_ids IS NULL THEN
    RAISE EXCEPTION 'Perf tasks or users not found — ensure prior steps completed';
  END IF;

  n_tasks := ARRAY_LENGTH(task_ids, 1);
  n_users := ARRAY_LENGTH(user_ids, 1);

  FOR i IN 1..100 LOOP
    INSERT INTO comments (id, content, task_id, author_id, is_edited)
    VALUES (
      md5(format('perf-comment:%s', i))::uuid,
      format('Performance test comment number %s', i),
      task_ids[1 + ((i - 1) % n_tasks)],
      user_ids[1 + ((i - 1) % n_users)],
      false
    )
    ON CONFLICT (id) DO NOTHING;
  END LOOP;
END $$;

COMMIT;

-- ── Verify counts ─────────────────────────────────────────────────────────────
SELECT
  (SELECT COUNT(*) FROM users    WHERE email LIKE 'perfuser%@perf.test') AS perf_users,
  (SELECT COUNT(*) FROM projects WHERE name = ANY(ARRAY['Alpha Project','Beta Project','Gamma Project','Delta Project','Epsilon Project'])) AS perf_projects,
  (SELECT COUNT(*) FROM tasks    WHERE title LIKE 'Perf Task %')         AS perf_tasks,
  (SELECT COUNT(*) FROM comments WHERE content LIKE 'Performance test comment%') AS perf_comments;
-- Expected: 50 | 5 | 200 | 100
