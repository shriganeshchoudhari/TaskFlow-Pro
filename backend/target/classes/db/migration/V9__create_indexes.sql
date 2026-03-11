-- V9: Create indexes
-- Phase 1 — B1-01 / B1-02 (users + refresh_tokens indexes)
-- Additional indexes for Phase 2+ tables will be added as those migrations run.

-- users
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email   ON users(email);
CREATE        INDEX IF NOT EXISTS idx_users_role    ON users(role);
CREATE        INDEX IF NOT EXISTS idx_users_active  ON users(is_active);

-- refresh_tokens
CREATE UNIQUE INDEX IF NOT EXISTS idx_refresh_tokens_token   ON refresh_tokens(token);
CREATE        INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
