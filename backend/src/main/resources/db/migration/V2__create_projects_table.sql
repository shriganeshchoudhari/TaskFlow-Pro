-- V2: Create projects table
-- Phase 2 — B2-01

CREATE TABLE projects (
    id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(255) NOT NULL,
    description TEXT,
    status      VARCHAR(50)  NOT NULL DEFAULT 'ACTIVE',
    visibility  VARCHAR(50)  NOT NULL DEFAULT 'PRIVATE',
    owner_id    UUID         NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  projects            IS 'Top-level containers for tasks and members';
COMMENT ON COLUMN projects.status     IS 'ACTIVE, ON_HOLD, COMPLETED, ARCHIVED';
COMMENT ON COLUMN projects.visibility IS 'PUBLIC (any auth user) or PRIVATE (members only)';
COMMENT ON COLUMN projects.owner_id   IS 'User who created the project; always a MANAGER member';

CREATE INDEX idx_projects_owner_id ON projects(owner_id);
CREATE INDEX idx_projects_status   ON projects(status);
CREATE INDEX idx_projects_created  ON projects(created_at DESC);
