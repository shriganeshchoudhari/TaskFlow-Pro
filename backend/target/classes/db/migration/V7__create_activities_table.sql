-- V7: Create activities table
-- Phase 4 — B4-12

CREATE TABLE activities (
    id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    action      VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id   UUID         NOT NULL,
    actor_id    UUID         NOT NULL REFERENCES users(id)    ON DELETE RESTRICT,
    project_id  UUID         REFERENCES projects(id)          ON DELETE SET NULL,
    task_id     UUID         REFERENCES tasks(id)             ON DELETE SET NULL,
    old_value   TEXT,
    new_value   TEXT,
    metadata    JSONB,
    created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  activities            IS 'Immutable audit log of all state changes';
COMMENT ON COLUMN activities.action     IS 'TASK_CREATED, STATUS_CHANGED, ASSIGNED, COMMENT_ADDED, etc.';
COMMENT ON COLUMN activities.metadata   IS 'Additional context as JSON (e.g. project name, member email)';

CREATE INDEX idx_activities_project_id ON activities(project_id, created_at DESC);
CREATE INDEX idx_activities_task_id    ON activities(task_id,    created_at DESC);
CREATE INDEX idx_activities_actor_id   ON activities(actor_id);
CREATE INDEX idx_activities_created_at ON activities(created_at DESC);
