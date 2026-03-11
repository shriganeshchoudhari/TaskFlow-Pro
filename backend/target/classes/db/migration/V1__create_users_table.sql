-- V1: Create users table
-- Phase 1 — B1-01

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE users (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email       VARCHAR(255) NOT NULL UNIQUE,
    full_name   VARCHAR(255) NOT NULL,
    password    VARCHAR(255) NOT NULL,
    role        VARCHAR(50)  NOT NULL DEFAULT 'MEMBER',
    avatar_url  VARCHAR(500),
    is_active   BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  users              IS 'Platform users with global role';
COMMENT ON COLUMN users.role         IS 'Global role: ADMIN, MANAGER, MEMBER, VIEWER';
COMMENT ON COLUMN users.password     IS 'BCrypt-hashed password — never plain text';
COMMENT ON COLUMN users.is_active    IS 'Soft-delete / account suspension flag';
