-- V8: Create refresh_tokens table
-- Phase 1 — B1-02

CREATE TABLE refresh_tokens (
    id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    token       VARCHAR(512) NOT NULL UNIQUE,
    user_id     UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at  TIMESTAMP WITH TIME ZONE NOT NULL,
    is_revoked  BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  refresh_tokens            IS 'Persisted refresh tokens for JWT rotation';
COMMENT ON COLUMN refresh_tokens.token      IS 'Opaque refresh token string (hashed or raw JWT)';
COMMENT ON COLUMN refresh_tokens.is_revoked IS 'Set to TRUE on logout or rotation';
