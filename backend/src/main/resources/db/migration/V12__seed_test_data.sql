-- V12: Seed demo data for local development and manual testing
-- 10 users · 3 projects · 10 tasks · subtasks · tags · comments
--
-- IDEMPOTENT: all inserts use ON CONFLICT DO NOTHING so this script
-- can be applied multiple times (e.g. after flyway repair) without error.
--
-- Passwords: BCrypt(strength=12) of "Test@1234"  (all users)
--            BCrypt(strength=12) of "Admin@1234" (admin@taskflow.com)
--
-- Dev login credentials:
--   admin@taskflow.com    / Admin@1234  (ADMIN)
--   manager1@taskflow.com / Test@1234   (MANAGER)
--   manager2@taskflow.com / Test@1234   (MANAGER)
--   worker1–7@taskflow.com / Test@1234  (MEMBER)

-- ── 1. Users ──────────────────────────────────────────────────────────────────
INSERT INTO users (id, email, password, full_name, role, is_active) VALUES
('10000000-0000-0000-0000-000000000001', 'admin@taskflow.com',    '$2a$12$xPVIFpFf/d3h4JRovlHt7.T/Pjn59Wy8nKJKUqA0gSZ7Ao0oOA4a', 'System Admin',    'ADMIN',   true),
('10000000-0000-0000-0000-000000000002', 'manager1@taskflow.com', '$2a$12$LPDtM5XmByE22w9Z0X.G4OpZ2a.T3qZ3mD/.9r2C6fN8Q6D1T0W06', 'Sarah Connor',    'MANAGER', true),
('10000000-0000-0000-0000-000000000003', 'manager2@taskflow.com', '$2a$12$LPDtM5XmByE22w9Z0X.G4OpZ2a.T3qZ3mD/.9r2C6fN8Q6D1T0W06', 'Bruce Wayne',     'MANAGER', true),
('10000000-0000-0000-0000-000000000004', 'worker1@taskflow.com',  '$2a$12$LPDtM5XmByE22w9Z0X.G4OpZ2a.T3qZ3mD/.9r2C6fN8Q6D1T0W06', 'John Doe',        'MEMBER',  true),
('10000000-0000-0000-0000-000000000005', 'worker2@taskflow.com',  '$2a$12$LPDtM5XmByE22w9Z0X.G4OpZ2a.T3qZ3mD/.9r2C6fN8Q6D1T0W06', 'Jane Smith',      'MEMBER',  true),
('10000000-0000-0000-0000-000000000006', 'worker3@taskflow.com',  '$2a$12$LPDtM5XmByE22w9Z0X.G4OpZ2a.T3qZ3mD/.9r2C6fN8Q6D1T0W06', 'Alice Wonder',    'MEMBER',  true),
('10000000-0000-0000-0000-000000000007', 'worker4@taskflow.com',  '$2a$12$LPDtM5XmByE22w9Z0X.G4OpZ2a.T3qZ3mD/.9r2C6fN8Q6D1T0W06', 'Bob Builder',     'MEMBER',  true),
('10000000-0000-0000-0000-000000000008', 'worker5@taskflow.com',  '$2a$12$LPDtM5XmByE22w9Z0X.G4OpZ2a.T3qZ3mD/.9r2C6fN8Q6D1T0W06', 'Charlie Chaplin', 'MEMBER',  true),
('10000000-0000-0000-0000-000000000009', 'worker6@taskflow.com',  '$2a$12$LPDtM5XmByE22w9Z0X.G4OpZ2a.T3qZ3mD/.9r2C6fN8Q6D1T0W06', 'Diana Prince',   'MEMBER',  true),
('10000000-0000-0000-0000-000000000010', 'worker7@taskflow.com',  '$2a$12$LPDtM5XmByE22w9Z0X.G4OpZ2a.T3qZ3mD/.9r2C6fN8Q6D1T0W06', 'Eve Polastri',    'MEMBER',  true)
ON CONFLICT (id) DO NOTHING;

-- ── 2. Projects ───────────────────────────────────────────────────────────────
-- visibility defaults to PRIVATE via column default
INSERT INTO projects (id, name, description, owner_id, status, visibility) VALUES
('20000000-0000-0000-0000-000000000001', 'Website Redesign',      'Complete overhaul of the corporate website frontend',          '10000000-0000-0000-0000-000000000002', 'ACTIVE', 'PRIVATE'),
('20000000-0000-0000-0000-000000000002', 'Mobile App V2',          'Development of the new iOS and Android applications',          '10000000-0000-0000-0000-000000000003', 'ACTIVE', 'PRIVATE'),
('20000000-0000-0000-0000-000000000003', 'Q3 Marketing Assets',    'Graphic design and content for Q3 marketing campaigns',        '10000000-0000-0000-0000-000000000001', 'ACTIVE', 'PRIVATE')
ON CONFLICT (id) DO NOTHING;

-- ── 3. Project Members ────────────────────────────────────────────────────────
INSERT INTO project_members (project_id, user_id, role) VALUES
-- Website Redesign
('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 'MANAGER'),
('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000004', 'MEMBER'),
('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000005', 'MEMBER'),
('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000006', 'MEMBER'),
-- Mobile App V2
('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000003', 'MANAGER'),
('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000007', 'MEMBER'),
('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000008', 'MEMBER'),
('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000009', 'MEMBER'),
-- Q3 Marketing Assets
('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', 'MANAGER'),
('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000010', 'MEMBER')
ON CONFLICT ON CONSTRAINT uq_project_members DO NOTHING;

-- ── 4. Tasks ──────────────────────────────────────────────────────────────────
-- estimated_hours: INTEGER (V11 column)
-- logged_hours: DOUBLE PRECISION (V11 column)
-- tags: stored in task_tags join table (seeded below)
INSERT INTO tasks (id, title, description, status, priority, project_id, reporter_id, assignee_id, due_date, estimated_hours, logged_hours, position) VALUES
-- Website Redesign tasks
('30000000-0000-0000-0000-000000000001', 'Design Landing Page',       'Create wireframes and mockups for the new homepage',      'DONE',        'HIGH',     '20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000004', CURRENT_DATE - 5,  8,  9,  1),
('30000000-0000-0000-0000-000000000002', 'Setup Next.js Frontend',     'Initialize repo and configure Tailwind CSS',              'DONE',        'MEDIUM',   '20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000005', CURRENT_DATE - 3,  4,  4,  2),
('30000000-0000-0000-0000-000000000003', 'Build Navigation Component', 'Implement responsive navbar with dropdowns',              'IN_PROGRESS', 'MEDIUM',   '20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000005', CURRENT_DATE + 2,  6,  3,  3),
('30000000-0000-0000-0000-000000000004', 'Write About Us Copy',        'Draft content for the company history page',              'REVIEW',      'LOW',      '20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000006', CURRENT_DATE,      3,  3,  4),
('30000000-0000-0000-0000-000000000005', 'Optimize Logo Assets',       'Compress SVGs and standard images for web',              'TODO',        'LOW',      '20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000004', NULL,                                   CURRENT_DATE + 5,  2,  0,  5),
-- Mobile App V2 tasks
('30000000-0000-0000-0000-000000000006', 'Bootstrap React Native App', 'Initialize cross-platform mobile app skeleton',           'DONE',        'HIGH',     '20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000007', CURRENT_DATE - 4,  5,  7,  1),
('30000000-0000-0000-0000-000000000007', 'Implement Auth Flow (iOS)',   'Apple Sign-In and secure JWT storage in Keychain',        'IN_PROGRESS', 'CRITICAL', '20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000007', CURRENT_DATE + 1,  12, 8,  2),
('30000000-0000-0000-0000-000000000008', 'Design Main Dashboard UI',   'Mobile app dashboard screens in Figma',                   'TODO',        'HIGH',     '20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000008', CURRENT_DATE + 7,  16, 0,  3),
('30000000-0000-0000-0000-000000000009', 'Setup Push Notifications',   'Firebase Cloud Messaging integration for Android & iOS', 'TODO',        'MEDIUM',   '20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000009', CURRENT_DATE + 14, 10, 0,  4),
-- Q3 Marketing Assets task
('30000000-0000-0000-0000-000000000010', 'Social Media Banner Ads',    'Design 5 standard ad sizes for Facebook and Instagram',  'IN_PROGRESS', 'MEDIUM',   '20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000010', CURRENT_DATE + 3,  4,  2,  1)
ON CONFLICT (id) DO NOTHING;

-- ── 5. Task Tags (task_tags join table used by @ElementCollection in Task.java) ─
INSERT INTO task_tags (task_id, tag) VALUES
('30000000-0000-0000-0000-000000000001', 'design'),
('30000000-0000-0000-0000-000000000001', 'frontend'),
('30000000-0000-0000-0000-000000000002', 'frontend'),
('30000000-0000-0000-0000-000000000002', 'setup'),
('30000000-0000-0000-0000-000000000003', 'frontend'),
('30000000-0000-0000-0000-000000000003', 'ui'),
('30000000-0000-0000-0000-000000000004', 'content'),
('30000000-0000-0000-0000-000000000005', 'assets'),
('30000000-0000-0000-0000-000000000006', 'mobile'),
('30000000-0000-0000-0000-000000000006', 'setup'),
('30000000-0000-0000-0000-000000000007', 'mobile'),
('30000000-0000-0000-0000-000000000007', 'auth'),
('30000000-0000-0000-0000-000000000007', 'security'),
('30000000-0000-0000-0000-000000000008', 'mobile'),
('30000000-0000-0000-0000-000000000008', 'design'),
('30000000-0000-0000-0000-000000000009', 'mobile'),
('30000000-0000-0000-0000-000000000009', 'notifications'),
('30000000-0000-0000-0000-000000000010', 'marketing'),
('30000000-0000-0000-0000-000000000010', 'design')
ON CONFLICT DO NOTHING;

-- ── 6. Subtasks ───────────────────────────────────────────────────────────────
-- task_id '...003' = Build Navigation Component
INSERT INTO subtasks (id, title, is_completed, task_id, created_at) VALUES
('40000000-0000-0000-0000-000000000001', 'Desktop layout',            true,  '30000000-0000-0000-0000-000000000003', CURRENT_TIMESTAMP),
('40000000-0000-0000-0000-000000000002', 'Mobile hamburger menu',     false, '30000000-0000-0000-0000-000000000003', CURRENT_TIMESTAMP),
('40000000-0000-0000-0000-000000000003', 'Dropdown animations',       false, '30000000-0000-0000-0000-000000000003', CURRENT_TIMESTAMP),
-- task_id '...007' = Implement Auth Flow (iOS)
('40000000-0000-0000-0000-000000000004', 'Configure Apple Developer Console', true,  '30000000-0000-0000-0000-000000000007', CURRENT_TIMESTAMP),
('40000000-0000-0000-0000-000000000005', 'Write OAuth2 callback handler',     true,  '30000000-0000-0000-0000-000000000007', CURRENT_TIMESTAMP),
('40000000-0000-0000-0000-000000000006', 'Store JWT securely in Keychain',    false, '30000000-0000-0000-0000-000000000007', CURRENT_TIMESTAMP),
-- task_id '...008' = Design Main Dashboard UI
('40000000-0000-0000-0000-000000000007', 'Wireframe Home tab',        false, '30000000-0000-0000-0000-000000000008', CURRENT_TIMESTAMP),
('40000000-0000-0000-0000-000000000008', 'Wireframe Profile tab',     false, '30000000-0000-0000-0000-000000000008', CURRENT_TIMESTAMP),
-- task_id '...010' = Social Media Banner Ads
('40000000-0000-0000-0000-000000000009', 'Instagram square 1080x1080',    true,  '30000000-0000-0000-0000-000000000010', CURRENT_TIMESTAMP),
('40000000-0000-0000-0000-000000000010', 'Facebook landscape 1200x628',   false, '30000000-0000-0000-0000-000000000010', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;

-- ── 7. Comments ───────────────────────────────────────────────────────────────
INSERT INTO comments (id, task_id, author_id, content, is_edited, created_at) VALUES
('50000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 'Great work on the landing page! Approved.',                          false, CURRENT_TIMESTAMP - INTERVAL '2 days'),
('50000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000004', 'Thanks — Figma source file is attached.',                            false, CURRENT_TIMESTAMP - INTERVAL '1 day'),
('50000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000005', 'Struggling with the dropdown z-index on mobile — help needed.',      false, CURRENT_TIMESTAMP - INTERVAL '3 hours'),
('50000000-0000-0000-0000-000000000004', '30000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000004', 'I will take a look at the z-index after my lunch break.',            false, CURRENT_TIMESTAMP - INTERVAL '2 hours'),
('50000000-0000-0000-0000-000000000005', '30000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000007', 'Apple Developer console keeps rejecting the bundle ID.',             false, CURRENT_TIMESTAMP - INTERVAL '5 hours'),
('50000000-0000-0000-0000-000000000006', '30000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000003', 'Check that your provisioning profile has not expired.',              false, CURRENT_TIMESTAMP - INTERVAL '4 hours'),
('50000000-0000-0000-0000-000000000007', '30000000-0000-0000-0000-000000000010', '10000000-0000-0000-0000-000000000010', 'Is there a preferred colour palette for the Q3 campaign?',           false, CURRENT_TIMESTAMP - INTERVAL '1 hour'),
('50000000-0000-0000-0000-000000000008', '30000000-0000-0000-0000-000000000010', '10000000-0000-0000-0000-000000000001', 'Yes — follow the Autumn ''25 corporate guidelines document.',        false, CURRENT_TIMESTAMP - INTERVAL '45 minutes'),
('50000000-0000-0000-0000-000000000009', '30000000-0000-0000-0000-000000000010', '10000000-0000-0000-0000-000000000010', 'Got it. Draft will be uploaded by Friday.',                          false, CURRENT_TIMESTAMP - INTERVAL '10 minutes')
ON CONFLICT (id) DO NOTHING;
