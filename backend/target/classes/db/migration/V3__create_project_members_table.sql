-- V3: Create project_members table
-- Phase 2 — B2-02

CREATE TABLE project_members (
    id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID        NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id    UUID        NOT NULL REFERENCES users(id)    ON DELETE CASCADE,
    role       VARCHAR(50) NOT NULL DEFAULT 'MEMBER',
    joined_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_project_members UNIQUE (project_id, user_id)
);

COMMENT ON TABLE  project_members      IS 'Project membership with per-project role';
COMMENT ON COLUMN project_members.role IS 'MANAGER, MEMBER, or VIEWER within this project';

CREATE INDEX idx_pm_project_id ON project_members(project_id);
CREATE INDEX idx_pm_user_id    ON project_members(user_id);
