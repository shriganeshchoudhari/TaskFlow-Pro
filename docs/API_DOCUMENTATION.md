# TaskFlow Pro — API Documentation

**Version:** 1.0.0  
**Base URL:** `https://api.taskflowpro.com/api/v1`  
**Format:** JSON  
**Auth:** Bearer JWT Token

---

## Table of Contents
1. [Authentication Flow](#1-authentication-flow)
2. [Auth Endpoints](#2-auth-endpoints)
3. [User Endpoints](#3-user-endpoints)
4. [Project Endpoints](#4-project-endpoints)
5. [Task Endpoints](#5-task-endpoints)
6. [Comment Endpoints](#6-comment-endpoints)
7. [Notification Endpoints](#7-notification-endpoints)
8. [Activity Endpoints](#8-activity-endpoints)
9. [Error Handling](#9-error-handling)
10. [Rate Limiting](#10-rate-limiting)

---

## 1. Authentication Flow

```
┌────────┐                      ┌──────────┐
│ Client │                      │   API    │
└───┬────┘                      └────┬─────┘
    │                                │
    │  POST /auth/login              │
    │  { email, password }           │
    │──────────────────────────────► │
    │                                │ validate credentials
    │  200 { accessToken,            │ generate tokens
    │        refreshToken }          │
    │◄────────────────────────────── │
    │                                │
    │  GET /projects                 │
    │  Authorization: Bearer <at>    │
    │──────────────────────────────► │
    │                                │ validate JWT
    │  200 { projects[] }            │ authorize
    │◄────────────────────────────── │
    │                                │
    │  POST /auth/refresh            │
    │  { refreshToken }              │
    │──────────────────────────────► │
    │  200 { accessToken, ... }      │
    │◄────────────────────────────── │
```

**Access Token:** 15-minute expiry, HS512 signed JWT  
**Refresh Token:** 7-day expiry, stored in database

---

## 2. Auth Endpoints

### POST /auth/register

Registers a new user account.

**Request:**
```json
{
  "fullName": "Jane Smith",
  "email": "jane@example.com",
  "password": "SecurePass123!"
}
```

**Validation:**
- `email`: valid email format, unique
- `password`: min 8 chars, 1 uppercase, 1 number, 1 special char
- `fullName`: 2–100 chars

**Response 201:**
```json
{
  "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "fullName": "Jane Smith",
  "email": "jane@example.com",
  "role": "MEMBER",
  "createdAt": "2025-01-15T10:30:00Z"
}
```

**Response 409 (email exists):**
```json
{
  "status": 409,
  "error": "CONFLICT",
  "message": "Email address already registered",
  "timestamp": "2025-01-15T10:30:00Z"
}
```

---

### POST /auth/login

Authenticates a user and returns JWT tokens.

**Request:**
```json
{
  "email": "jane@example.com",
  "password": "SecurePass123!"
}
```

**Response 200:**
```json
{
  "accessToken": "eyJhbGciOiJIUzUxMiJ9...",
  "refreshToken": "eyJhbGciOiJIUzUxMiJ9...",
  "tokenType": "Bearer",
  "expiresIn": 900,
  "user": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "fullName": "Jane Smith",
    "email": "jane@example.com",
    "role": "MEMBER",
    "avatarUrl": null
  }
}
```

**Response 401:**
```json
{
  "status": 401,
  "error": "UNAUTHORIZED",
  "message": "Invalid email or password",
  "timestamp": "2025-01-15T10:30:00Z"
}
```

---

### POST /auth/refresh

Refreshes the access token using a valid refresh token.

**Request:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzUxMiJ9..."
}
```

**Response 200:**
```json
{
  "accessToken": "eyJhbGciOiJIUzUxMiJ9...",
  "refreshToken": "eyJhbGciOiJIUzUxMiJ9...",
  "tokenType": "Bearer",
  "expiresIn": 900
}
```

---

### POST /auth/logout

🔒 *Requires Authentication*

Revokes the refresh token.

**Request:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzUxMiJ9..."
}
```

**Response 204:** No content

---

## 3. User Endpoints

### GET /users/me

🔒 *Requires Authentication*

Returns the currently authenticated user's profile.

**Response 200:**
```json
{
  "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "fullName": "Jane Smith",
  "email": "jane@example.com",
  "role": "MEMBER",
  "avatarUrl": "https://cdn.taskflowpro.com/avatars/jane.jpg",
  "isActive": true,
  "createdAt": "2025-01-01T00:00:00Z"
}
```

---

### PUT /users/me

🔒 *Requires Authentication*

Updates the current user's profile.

**Request:**
```json
{
  "fullName": "Jane A. Smith",
  "avatarUrl": "https://cdn.example.com/avatar.jpg"
}
```

**Response 200:** Updated user object

---

### PUT /users/me/password

🔒 *Requires Authentication*

**Request:**
```json
{
  "currentPassword": "OldPass123!",
  "newPassword": "NewPass456!"
}
```

**Response 204:** No content

---

## 4. Project Endpoints

### GET /projects

🔒 *Requires Authentication*

Returns paginated list of projects the user is a member of.

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| page | int | 0 | Zero-based page number |
| size | int | 20 | Items per page (max 100) |
| status | string | — | Filter: ACTIVE, ARCHIVED, etc. |
| sort | string | createdAt,desc | Sort field and direction |

**Response 200:**
```json
{
  "content": [
    {
      "id": "abc123...",
      "name": "Website Redesign",
      "description": "Q1 website overhaul project",
      "status": "ACTIVE",
      "visibility": "PRIVATE",
      "owner": {
        "id": "user-uuid",
        "fullName": "Jane Smith",
        "email": "jane@example.com"
      },
      "memberCount": 5,
      "taskCount": 24,
      "completedTaskCount": 8,
      "createdAt": "2025-01-01T00:00:00Z",
      "updatedAt": "2025-01-15T10:00:00Z"
    }
  ],
  "page": 0,
  "size": 20,
  "totalElements": 3,
  "totalPages": 1,
  "last": true
}
```

---

### POST /projects

🔒 *Requires Authentication (MANAGER or ADMIN role)*

Creates a new project.

**Request:**
```json
{
  "name": "Website Redesign",
  "description": "Complete redesign of the company website for Q1",
  "visibility": "PRIVATE",
  "status": "ACTIVE"
}
```

**Response 201:**
```json
{
  "id": "abc123-...",
  "name": "Website Redesign",
  "description": "Complete redesign of the company website for Q1",
  "status": "ACTIVE",
  "visibility": "PRIVATE",
  "owner": { "id": "...", "fullName": "Jane Smith" },
  "memberCount": 1,
  "taskCount": 0,
  "createdAt": "2025-01-15T10:30:00Z"
}
```

---

### GET /projects/{projectId}

🔒 *Requires project membership*

**Response 200:** Single project object (same as above)

---

### PUT /projects/{projectId}

🔒 *Requires MANAGER or ADMIN role in this project*

**Request:**
```json
{
  "name": "Website Redesign v2",
  "description": "Updated description",
  "status": "ON_HOLD"
}
```

**Response 200:** Updated project object

---

### DELETE /projects/{projectId}

🔒 *Requires MANAGER or ADMIN role*

Soft-deletes (archives) the project.

**Response 204:** No content

---

### GET /projects/{projectId}/members

🔒 *Requires project membership*

**Response 200:**
```json
[
  {
    "id": "member-uuid",
    "user": {
      "id": "user-uuid",
      "fullName": "Jane Smith",
      "email": "jane@example.com",
      "avatarUrl": null
    },
    "role": "MANAGER",
    "joinedAt": "2025-01-01T00:00:00Z"
  }
]
```

---

### POST /projects/{projectId}/members

🔒 *Requires MANAGER role in this project*

**Request:**
```json
{
  "email": "dev@example.com",
  "role": "MEMBER"
}
```

**Response 201:** New member object

---

## 5. Task Endpoints

### GET /projects/{projectId}/tasks

🔒 *Requires project membership*

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| status | string | TODO, IN_PROGRESS, REVIEW, DONE |
| priority | string | LOW, MEDIUM, HIGH, CRITICAL |
| assigneeId | UUID | Filter by assignee |
| page | int | Page number |
| size | int | Page size |

**Response 200:**
```json
{
  "content": [
    {
      "id": "task-uuid",
      "title": "Implement login page",
      "description": "Create responsive login form with validation",
      "status": "IN_PROGRESS",
      "priority": "HIGH",
      "dueDate": "2025-02-01",
      "tags": ["frontend", "auth"],
      "assignee": {
        "id": "user-uuid",
        "fullName": "Dev User",
        "avatarUrl": null
      },
      "reporter": {
        "id": "manager-uuid",
        "fullName": "Jane Smith"
      },
      "commentCount": 3,
      "projectId": "project-uuid",
      "createdAt": "2025-01-10T09:00:00Z",
      "updatedAt": "2025-01-14T15:30:00Z"
    }
  ],
  "page": 0,
  "size": 20,
  "totalElements": 1,
  "totalPages": 1
}
```

---

### POST /projects/{projectId}/tasks

🔒 *Requires project membership (MEMBER+)*

**Request:**
```json
{
  "title": "Implement login page",
  "description": "Create responsive login form with email/password validation and error states",
  "status": "TODO",
  "priority": "HIGH",
  "dueDate": "2025-02-01",
  "assigneeId": "user-uuid",
  "tags": ["frontend", "auth"]
}
```

**Response 201:** Full task object

---

### GET /tasks/{taskId}

🔒 *Requires project membership*

**Response 200:** Full task object with comments and activities

---

### PUT /tasks/{taskId}

🔒 *Requires task assignee, reporter, or project MANAGER*

**Request:** Partial update — any task fields

**Response 200:** Updated task object

---

### PATCH /tasks/{taskId}/status

🔒 *Requires task assignee or project MANAGER*

**Request:**
```json
{
  "status": "IN_PROGRESS"
}
```

**Response 200:** Updated task object

---

### DELETE /tasks/{taskId}

🔒 *Requires project MANAGER or ADMIN*

**Response 204:** No content

---

### POST /tasks/{taskId}/subtasks

🔒 *Requires project membership*

Adds a new subtask (checklist item) to the task.

**Request:**
```json
{
  "title": "Draft design document"
}
```

**Response 201:**
```json
{
  "id": "subtask-uuid",
  "title": "Draft design document",
  "isCompleted": false,
  "createdAt": "2025-01-14T10:00:00Z"
}
```

---

### PATCH /subtasks/{subtaskId}/toggle

🔒 *Requires project membership*

Toggles the completion status of a subtask.

**Response 200:**
```json
{
  "id": "subtask-uuid",
  "title": "Draft design document",
  "isCompleted": true,
  "createdAt": "2025-01-14T10:00:00Z"
}
```

---

### DELETE /subtasks/{subtaskId}

🔒 *Requires project membership*

Deletes a subtask.

**Response 204:** No content

---

### POST /tasks/{taskId}/time

🔒 *Requires project membership*

Logs time spent on a task.

**Request:**
```json
{
  "hours": 2.5
}
```

**Response 200:** Updated task object with new `loggedHours`.

---

### POST /tasks/{taskId}/attachments

🔒 *Requires project membership*

Uploads a file attachment to the task. (Multipart request)

**Request:** 
`multipart/form-data` with `file` part.

**Response 201:**
```json
{
  "id": "attachment-uuid",
  "fileName": "document.pdf",
  "fileType": "application/pdf",
  "fileSize": 1048576,
  "storageUrl": "/uploads/document.pdf",
  "createdAt": "2025-01-14T10:00:00Z"
}
```

---

### GET /tasks/{taskId}/attachments

🔒 *Requires project membership*

Returns all attachments for a task.

**Response 200:** List of attachment objects.

---

### GET /attachments/{attachmentId}/download

🔒 *Requires project membership*

Downloads the actual file content.

**Response 200:** File stream with appropriate `Content-Type` and `Content-Disposition`.

---

### DELETE /attachments/{attachmentId}

🔒 *Requires attachment uploader, project MANAGER, or ADMIN*

Deletes an attachment from the task.

**Response 204:** No content

---

## 6. Comment Endpoints

### GET /tasks/{taskId}/comments

🔒 *Requires project membership*

**Response 200:**
```json
[
  {
    "id": "comment-uuid",
    "content": "I've started working on this. Mockups attached.",
    "author": {
      "id": "user-uuid",
      "fullName": "Dev User",
      "avatarUrl": null
    },
    "isEdited": false,
    "createdAt": "2025-01-14T10:00:00Z",
    "updatedAt": "2025-01-14T10:00:00Z"
  }
]
```

---

### POST /tasks/{taskId}/comments

🔒 *Requires project membership*

**Request:**
```json
{
  "content": "I've started working on this. Mockups attached."
}
```

**Response 201:** Comment object

---

### PUT /comments/{commentId}

🔒 *Requires comment author*

**Request:**
```json
{
  "content": "Updated comment content"
}
```

**Response 200:** Updated comment object

---

### DELETE /comments/{commentId}

🔒 *Requires comment author or project MANAGER*

**Response 204:** No content

---

## 7. Notification Endpoints

### GET /notifications

🔒 *Requires Authentication*

**Query Parameters:** `page`, `size`, `isRead` (boolean filter)

**Response 200:**
```json
{
  "content": [
    {
      "id": "notif-uuid",
      "type": "TASK_ASSIGNED",
      "message": "You have been assigned to task 'Implement login page'",
      "isRead": false,
      "task": {
        "id": "task-uuid",
        "title": "Implement login page",
        "projectId": "project-uuid"
      },
      "createdAt": "2025-01-14T10:30:00Z"
    }
  ],
  "unreadCount": 5,
  "page": 0,
  "size": 20,
  "totalElements": 12
}
```

---

### PATCH /notifications/{notificationId}/read

🔒 *Requires Authentication*

Mark a single notification as read.

**Response 200:** Updated notification object

---

### PATCH /notifications/read-all

🔒 *Requires Authentication*

Mark all notifications as read.

**Response 204:** No content

---

## 8. Activity Endpoints

### GET /projects/{projectId}/activities

🔒 *Requires project membership*

**Response 200:**
```json
{
  "content": [
    {
      "id": "activity-uuid",
      "action": "TASK_STATUS_CHANGED",
      "entityType": "TASK",
      "entityId": "task-uuid",
      "actor": {
        "id": "user-uuid",
        "fullName": "Dev User"
      },
      "oldValue": "TODO",
      "newValue": "IN_PROGRESS",
      "task": {
        "id": "task-uuid",
        "title": "Implement login page"
      },
      "createdAt": "2025-01-14T11:00:00Z"
    }
  ],
  "page": 0,
  "totalElements": 47
}
```

---

### GET /tasks/{taskId}/activities

🔒 *Requires project membership*

Returns activity history for a specific task.

**Response 200:** Same structure as above, filtered to the task

---

## 9. Error Handling

### Standard Error Response

```json
{
  "status": 400,
  "error": "BAD_REQUEST",
  "message": "Validation failed",
  "details": [
    {
      "field": "email",
      "message": "must be a valid email address"
    },
    {
      "field": "password",
      "message": "must be at least 8 characters"
    }
  ],
  "path": "/api/v1/auth/register",
  "timestamp": "2025-01-15T10:30:00Z",
  "traceId": "abc123xyz"
}
```

### HTTP Status Codes

| Code | Meaning | When Used |
|------|---------|-----------|
| 200 | OK | Successful GET/PUT/PATCH |
| 201 | Created | Successful POST (resource created) |
| 204 | No Content | Successful DELETE or action |
| 400 | Bad Request | Validation errors, malformed JSON |
| 401 | Unauthorized | Missing or invalid JWT token |
| 403 | Forbidden | Valid token but insufficient permissions |
| 404 | Not Found | Resource does not exist |
| 409 | Conflict | Duplicate email, unique constraint |
| 422 | Unprocessable Entity | Business logic validation failure |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Unexpected server error |

### Error Codes Reference

| Error Code | Description |
|------------|-------------|
| `TOKEN_EXPIRED` | JWT access token has expired |
| `TOKEN_INVALID` | JWT signature invalid or malformed |
| `REFRESH_TOKEN_EXPIRED` | Refresh token has expired |
| `RESOURCE_NOT_FOUND` | Requested entity does not exist |
| `ACCESS_DENIED` | User lacks required role/permission |
| `EMAIL_ALREADY_EXISTS` | Duplicate email on registration |
| `INVALID_STATUS_TRANSITION` | Invalid task status change |
| `NOT_PROJECT_MEMBER` | User not a member of the project |

---

## 10. Rate Limiting

| Endpoint Group | Limit | Window |
|----------------|-------|--------|
| POST /auth/login | 10 requests | 15 minutes |
| POST /auth/register | 5 requests | 1 hour |
| All other endpoints | 1000 requests | 1 hour |

**Rate limit headers returned:**
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 997
X-RateLimit-Reset: 1705315800
```

**Response 429:**
```json
{
  "status": 429,
  "error": "TOO_MANY_REQUESTS",
  "message": "Rate limit exceeded. Try again in 847 seconds.",
  "retryAfter": 847
}
```
