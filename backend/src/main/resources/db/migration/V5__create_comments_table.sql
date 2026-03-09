-- V5: Create comments table
-- Phase 4 — B4-01

CREATE TABLE comments (
    id         UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
    content    TEXT    NOT NULL,
    task_id    UUID    NOT NULL REFERENCES tasks(id)    ON DELETE CASCADE,
    author_id  UUID    NOT NULL REFERENCES users(id)   ON DELETE RESTRICT,
    is_edited  BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE comments IS 'User comments on tasks';

CREATE INDEX idx_comments_task_id   ON comments(task_id, created_at ASC);
CREATE INDEX idx_comments_author_id ON comments(author_id);
