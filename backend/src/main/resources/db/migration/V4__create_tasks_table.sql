-- V4: Create tasks table
-- Phase 3 — B3-01

CREATE TABLE tasks (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    title       VARCHAR(500) NOT NULL,
    description TEXT,
    status      VARCHAR(50)  NOT NULL DEFAULT 'TODO',
    priority    VARCHAR(50)  NOT NULL DEFAULT 'MEDIUM',
    due_date    DATE,
    position    INTEGER      NOT NULL DEFAULT 0,
    project_id  UUID         NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    assignee_id UUID         REFERENCES users(id) ON DELETE SET NULL,
    reporter_id UUID         NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  tasks          IS 'Work items belonging to a project';
COMMENT ON COLUMN tasks.status   IS 'TODO, IN_PROGRESS, REVIEW, DONE';
COMMENT ON COLUMN tasks.priority IS 'LOW, MEDIUM, HIGH, CRITICAL';
COMMENT ON COLUMN tasks.position IS 'Display order within a status column';

-- Tags stored in a separate join table (PostgreSQL TEXT[] alternative using ElementCollection)
CREATE TABLE task_tags (
    task_id UUID        NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    tag     VARCHAR(100) NOT NULL
);

CREATE INDEX idx_tasks_project_id     ON tasks(project_id);
CREATE INDEX idx_tasks_assignee_id    ON tasks(assignee_id);
CREATE INDEX idx_tasks_status         ON tasks(status);
CREATE INDEX idx_tasks_priority       ON tasks(priority);
CREATE INDEX idx_tasks_project_status ON tasks(project_id, status);
CREATE INDEX idx_tasks_due_date       ON tasks(due_date) WHERE due_date IS NOT NULL;
CREATE INDEX idx_task_tags_task_id    ON task_tags(task_id);
