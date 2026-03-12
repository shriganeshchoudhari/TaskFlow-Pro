# TaskFlow Pro — Database Schema

**Version:** 1.0.0  
**Database:** PostgreSQL 16  
**ORM:** Hibernate / JPA

---

## Table of Contents
1. [ER Diagram](#1-er-diagram)
2. [Table Definitions](#2-table-definitions)
3. [Relationships](#3-relationships)
4. [Indexing Strategy](#4-indexing-strategy)
5. [Migration Strategy](#5-migration-strategy)

---

## 1. ER Diagram

```
┌─────────────┐       ┌──────────────────┐       ┌─────────────┐
│    users    │       │  project_members │       │  projects   │
│─────────────│       │──────────────────│       │─────────────│
│ id (PK)     │◄──────│ user_id (FK)     │       │ id (PK)     │
│ email       │       │ project_id (FK)  │──────►│ name        │
│ full_name   │       │ role             │       │ description │
│ password    │       │ joined_at        │       │ status      │
│ role        │       └──────────────────┘       │ owner_id FK │
│ is_active   │                                  │ created_at  │
│ created_at  │◄─────────────────────────────────│             │
│ updated_at  │                                  └──────┬──────┘
└─────┬───────┘                                         │
      │                                                 │
      │                                                 │
      │ reporter_id / assignee_id                       │ project_id
      │                                          ┌──────▼──────┐
      └─────────────────────────────────────────►│    tasks    │
                                                 │─────────────│
                                                 │ id (PK)     │
                                                 │ title       │
                                                 │ description │
                                                 │ status      │
                                                 │ priority    │
                                                 │ due_date    │
                                                 │ assignee_id │
                                                 │ reporter_id │
                                                 │ project_id  │
                                                 │ created_at  │
                                                 │ updated_at  │
                                                 └──────┬──────┘
                                                        │
                        ┌───────────────────────────────┤
                        │                               │
               ┌────────▼──────┐              ┌─────────▼──────┐
               │   comments    │              │   activities   │
               │───────────────│              │────────────────│
               │ id (PK)       │              │ id (PK)        │
               │ content       │              │ action         │
               │ task_id (FK)  │              │ entity_type    │
               │ author_id (FK)│              │ entity_id      │
               │ created_at    │              │ actor_id (FK)  │
               │ updated_at    │              │ old_value      │
               └───────────────┘              │ new_value      │
                                              │ project_id     │
               ┌───────────────┐              │ created_at     │
               │ notifications │              └────────────────┘
               │───────────────│
               │ id (PK)       │
               │ type          │
               │ message       │
               │ is_read       │
               │ user_id (FK)  │
               │ task_id (FK)  │
               │ created_at    │
               └───────────────┘
```

---

## 2. Table Definitions

### 2.1 users

```sql
CREATE TABLE users (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email       VARCHAR(255) NOT NULL UNIQUE,
    full_name   VARCHAR(255) NOT NULL,
    password    VARCHAR(255) NOT NULL,         -- BCrypt hash
    role        VARCHAR(50)  NOT NULL DEFAULT 'MEMBER',
    avatar_url  VARCHAR(500),
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE users IS 'Platform users with global role';
COMMENT ON COLUMN users.role IS 'Global role: ADMIN, MANAGER, MEMBER, VIEWER';
COMMENT ON COLUMN users.password IS 'BCrypt hashed password, never stored in plain text';
```

### 2.2 projects

```sql
CREATE TABLE projects (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(255) NOT NULL,
    description TEXT,
    status      VARCHAR(50)  NOT NULL DEFAULT 'ACTIVE',
    visibility  VARCHAR(50)  NOT NULL DEFAULT 'PRIVATE',
    owner_id    UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

COMMENT ON COLUMN projects.status IS 'ACTIVE, ON_HOLD, COMPLETED, ARCHIVED';
COMMENT ON COLUMN projects.visibility IS 'PUBLIC, PRIVATE';
```

### 2.3 project_members

```sql
CREATE TABLE project_members (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id  UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role        VARCHAR(50) NOT NULL DEFAULT 'MEMBER',
    joined_at   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE (project_id, user_id)
);

COMMENT ON COLUMN project_members.role IS 'Project-level role: MANAGER, MEMBER, VIEWER';
```

### 2.4 tasks

```sql
CREATE TABLE tasks (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title         VARCHAR(500) NOT NULL,
    description   TEXT,
    status        VARCHAR(50)  NOT NULL DEFAULT 'TODO',
    priority      VARCHAR(50)  NOT NULL DEFAULT 'MEDIUM',
    due_date      DATE,
    project_id    UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    assignee_id   UUID REFERENCES users(id) ON DELETE SET NULL,
    reporter_id   UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    position      INTEGER NOT NULL DEFAULT 0,    -- For ordering within status column
    tags          TEXT[],                        -- PostgreSQL array for simple tags
    estimated_hours NUMERIC(5,2),
    logged_hours    NUMERIC(5,2) DEFAULT 0.0,
    created_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

COMMENT ON COLUMN tasks.status IS 'TODO, IN_PROGRESS, REVIEW, DONE';
COMMENT ON COLUMN tasks.priority IS 'LOW, MEDIUM, HIGH, CRITICAL';
```

### 2.5 comments

```sql
CREATE TABLE comments (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content     TEXT NOT NULL,
    task_id     UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    author_id   UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    is_edited   BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
```

### 2.6 notifications

```sql
CREATE TABLE notifications (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type        VARCHAR(100) NOT NULL,
    message     TEXT NOT NULL,
    is_read     BOOLEAN NOT NULL DEFAULT FALSE,
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    task_id     UUID REFERENCES tasks(id) ON DELETE SET NULL,
    project_id  UUID REFERENCES projects(id) ON DELETE SET NULL,
    created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

COMMENT ON COLUMN notifications.type IS 
  'TASK_ASSIGNED, COMMENT_ADDED, STATUS_CHANGED, DUE_DATE_REMINDER';
```

### 2.7 activities

```sql
CREATE TABLE activities (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action      VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id   UUID NOT NULL,
    actor_id    UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    project_id  UUID REFERENCES projects(id) ON DELETE CASCADE,
    task_id     UUID REFERENCES tasks(id) ON DELETE CASCADE,
    old_value   TEXT,
    new_value   TEXT,
    metadata    JSONB,
    created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

COMMENT ON COLUMN activities.action IS 
  'TASK_CREATED, TASK_STATUS_CHANGED, TASK_ASSIGNED, COMMENT_ADDED, etc.';
COMMENT ON COLUMN activities.entity_type IS 'TASK, PROJECT, COMMENT';
```

### 2.8 subtasks

```sql
CREATE TABLE subtasks (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id       UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    title         VARCHAR(500) NOT NULL,
    is_completed  BOOLEAN NOT NULL DEFAULT FALSE,
    created_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
```

### 2.9 attachments

```sql
CREATE TABLE attachments (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id       UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    uploader_id   UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    file_name     VARCHAR(500) NOT NULL,
    file_type     VARCHAR(100) NOT NULL,
    storage_path  TEXT NOT NULL,
    file_size     BIGINT NOT NULL,
    created_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
```

### 2.10 refresh_tokens

```sql
CREATE TABLE refresh_tokens (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token       VARCHAR(512) NOT NULL UNIQUE,
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at  TIMESTAMP WITH TIME ZONE NOT NULL,
    is_revoked  BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
```

---

## 3. Relationships

| From Table | Relationship | To Table | FK Column | On Delete |
|-----------|-------------|----------|-----------|-----------|
| projects | many-to-one | users | owner_id | RESTRICT |
| project_members | many-to-one | projects | project_id | CASCADE |
| project_members | many-to-one | users | user_id | CASCADE |
| tasks | many-to-one | projects | project_id | CASCADE |
| tasks | many-to-one | users (assignee) | assignee_id | SET NULL |
| tasks | many-to-one | users (reporter) | reporter_id | RESTRICT |
| comments | many-to-one | tasks | task_id | CASCADE |
| comments | many-to-one | users | author_id | RESTRICT |
| notifications | many-to-one | users | user_id | CASCADE |
| notifications | many-to-one | tasks | task_id | SET NULL |
| activities | many-to-one | users | actor_id | RESTRICT |
| activities | many-to-one | projects | project_id | CASCADE |
| refresh_tokens | many-to-one | users | user_id | CASCADE |

---

## 4. Indexing Strategy

```sql
-- users
CREATE UNIQUE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- projects
CREATE INDEX idx_projects_owner_id ON projects(owner_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_created_at ON projects(created_at DESC);

-- project_members
CREATE UNIQUE INDEX idx_project_members_unique ON project_members(project_id, user_id);
CREATE INDEX idx_project_members_user_id ON project_members(user_id);
CREATE INDEX idx_project_members_project_id ON project_members(project_id);

-- tasks
CREATE INDEX idx_tasks_project_id ON tasks(project_id);
CREATE INDEX idx_tasks_assignee_id ON tasks(assignee_id);
CREATE INDEX idx_tasks_reporter_id ON tasks(reporter_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_priority ON tasks(priority);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_project_status ON tasks(project_id, status);  -- composite

-- comments
CREATE INDEX idx_comments_task_id ON comments(task_id);
CREATE INDEX idx_comments_author_id ON comments(author_id);
CREATE INDEX idx_comments_created_at ON comments(task_id, created_at ASC);

-- notifications
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read)
    WHERE is_read = FALSE;  -- partial index for unread
CREATE INDEX idx_notifications_created_at ON notifications(user_id, created_at DESC);

-- activities
CREATE INDEX idx_activities_project_id ON activities(project_id);
CREATE INDEX idx_activities_task_id ON activities(task_id);
CREATE INDEX idx_activities_actor_id ON activities(actor_id);
CREATE INDEX idx_activities_created_at ON activities(created_at DESC);

-- refresh_tokens
CREATE UNIQUE INDEX idx_refresh_tokens_token ON refresh_tokens(token);
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
```

### Index Rationale

| Index | Type | Rationale |
|-------|------|-----------|
| users.email | UNIQUE | Login lookup by email, enforces uniqueness |
| tasks(project_id, status) | COMPOSITE | Frequent filter: tasks in project by status |
| notifications(user_id, is_read) WHERE FALSE | PARTIAL | Fast unread count query |
| activities.created_at | DESC | Activity feed ordered by newest first |

---

## 5. Migration Strategy

Migrations are managed using **Flyway** with versioned SQL scripts:

```
backend/src/main/resources/db/migration/
├── V1__create_users_table.sql
├── V2__create_projects_table.sql
├── V3__create_project_members_table.sql
├── V4__create_tasks_table.sql
├── V5__create_comments_table.sql
├── V6__create_notifications_table.sql
├── V7__create_activities_table.sql
├── V8__create_refresh_tokens_table.sql
└── V9__create_indexes.sql
```

Migration principles:
- Scripts are **immutable** once applied to any environment
- Backward-compatible changes preferred (additive: add columns, not drop)
- Breaking changes handled with transitional migration steps
- Flyway baseline applied to existing production databases
