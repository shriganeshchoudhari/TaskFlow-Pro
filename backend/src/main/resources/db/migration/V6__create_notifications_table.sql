-- V6: Create notifications table
-- Phase 4 — B4-06

CREATE TABLE notifications (
    id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    type       VARCHAR(100) NOT NULL,
    message    TEXT         NOT NULL,
    is_read    BOOLEAN      NOT NULL DEFAULT FALSE,
    user_id    UUID         NOT NULL REFERENCES users(id)    ON DELETE CASCADE,
    task_id    UUID         REFERENCES tasks(id)             ON DELETE SET NULL,
    project_id UUID         REFERENCES projects(id)          ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  notifications      IS 'In-app notifications for users';
COMMENT ON COLUMN notifications.type IS 'TASK_ASSIGNED, COMMENT_ADDED, STATUS_CHANGED, DUE_DATE_REMINDER';

CREATE INDEX idx_notif_user_id    ON notifications(user_id, created_at DESC);
-- Partial index for fast unread count queries
CREATE INDEX idx_notif_user_unread ON notifications(user_id) WHERE is_read = FALSE;
