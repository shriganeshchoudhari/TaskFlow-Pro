# TaskFlow Pro — Test Cases: API

**Version:** 2.0.0 *(updated 2026-03-14 — Subtasks, Time Tracking, Attachments, traceId tests added)*  
**Tool:** Postman + Newman  
**Collection:** `tests/api/postman/TaskflowPro.postman_collection.json`

> All test cases map to implementation tasks from `docs/IMPLEMENTATION_STATUS.md`.  
> Run order must follow dependency chain: Auth → Users → Projects → Tasks → Comments → Notifications → Activities.

---

## Setup

```bash
# Run full API test suite
newman run tests/api/postman/TaskflowPro.postman_collection.json \
  -e tests/api/postman/environments/local.json \
  --reporters cli,html \
  --reporter-html-export tests/api/postman/report.html

# Environment variables (local.json)
baseUrl: http://localhost:8080/api/v1
accessToken: (set by Auth/Login test)
refreshToken: (set by Auth/Login test)
projectId: (set by Projects/Create test)
taskId: (set by Tasks/Create test)
commentId: (set by Comments/Create test)
```

---

## Auth Endpoint Tests (Phase 1)

| # | Test | Method + Path | Input | Expected | Task |
|---|------|--------------|-------|----------|------|
| A-01 | Register new user | POST /auth/register | valid fullName, email, password | 201 + user object (no password field) | B1-10 |
| A-02 | Register — duplicate email | POST /auth/register | same email again | 409 EMAIL_ALREADY_EXISTS | B1-11 |
| A-03 | Register — invalid email | POST /auth/register | "not-an-email" | 400 validation error on email field | B1-11 |
| A-04 | Register — weak password | POST /auth/register | "password" | 400 validation error on password field | B1-11 |
| A-05 | Login — valid credentials | POST /auth/login | correct email + password | 200 + accessToken + refreshToken + user | B1-10 |
| A-06 | Login — wrong password | POST /auth/login | correct email, wrong password | 401 UNAUTHORIZED | B1-11 |
| A-07 | Login — unknown email | POST /auth/login | unknown@email.com | 401 UNAUTHORIZED | B1-11 |
| A-08 | Login — rate limit | POST /auth/login | 11 requests in 15 min | 429 TOO_MANY_REQUESTS with retryAfter | B5-04 |
| A-09 | Refresh — valid token | POST /auth/refresh | valid refreshToken | 200 + new accessToken + new refreshToken | B1-10 |
| A-10 | Refresh — invalid token | POST /auth/refresh | "garbage-token" | 401 TOKEN_INVALID | B1-11 |
| A-11 | Refresh — reuse after rotation | POST /auth/refresh | old (rotated) refreshToken | 401 TOKEN_INVALID | B1-06 |
| A-12 | Logout | POST /auth/logout | valid refreshToken | 204 No Content | B1-10 |
| A-13 | Refresh — after logout | POST /auth/refresh | revoked refreshToken | 401 REFRESH_TOKEN_EXPIRED | B1-10 |

---

## User Endpoint Tests (Phase 3 + 5)

| # | Test | Method + Path | Input | Expected | Task |
|---|------|--------------|-------|----------|------|
| U-01 | Get current user | GET /users/me | Bearer token | 200 + user object | B3-11 |
| U-02 | Get current user — no auth | GET /users/me | no token | 401 UNAUTHORIZED | B1-08 |
| U-03 | Update profile | PUT /users/me | { fullName, avatarUrl } | 200 + updated user | B5-03 |
| U-04 | Update profile — invalid name | PUT /users/me | { fullName: "" } | 400 validation error | B5-03 |
| U-05 | Change password — valid | PUT /users/me/password | correct currentPassword + new | 204 No Content | B5-03 |
| U-06 | Change password — wrong current | PUT /users/me/password | wrong currentPassword | 401 UNAUTHORIZED | B5-03 |

---

## Project Endpoint Tests (Phase 2)

| # | Test | Method + Path | Input | Expected | Task |
|---|------|--------------|-------|----------|------|
| P-01 | Create project | POST /projects | valid name + description | 201 + project with id | B2-08 |
| P-02 | Create project — no auth | POST /projects | no token | 401 UNAUTHORIZED | B1-08 |
| P-03 | Create project — missing name | POST /projects | { description: "test" } | 400 validation error | B2-10 |
| P-04 | List projects | GET /projects | Bearer token | 200 + paginated list | B2-08 |
| P-05 | List projects — filter by status | GET /projects?status=ACTIVE | Bearer token | 200 + only ACTIVE projects | B2-05 |
| P-06 | List projects — pagination | GET /projects?page=0&size=2 | Bearer token | 200 + max 2 items | B2-05 |
| P-07 | Get project by ID | GET /projects/{id} | Bearer token (member) | 200 + project object | B2-08 |
| P-08 | Get project — non-member private | GET /projects/{id} | non-member token | 403 NOT_PROJECT_MEMBER | B2-05 |
| P-09 | Get project — not found | GET /projects/unknown-uuid | Bearer token | 404 RESOURCE_NOT_FOUND | B1-11 |
| P-10 | Update project | PUT /projects/{id} | new name + status | 200 + updated project | B2-08 |
| P-11 | Update project — non-manager | PUT /projects/{id} | MEMBER role token | 403 ACCESS_DENIED | B2-06 |
| P-12 | Archive project | DELETE /projects/{id} | MANAGER token | 204 No Content | B2-08 |
| P-13 | Archived project hidden | GET /projects?status=ACTIVE | Bearer token | 200 + archived not in list | B2-06 |
| P-14 | Add member | POST /projects/{id}/members | { email, role: "MEMBER" } | 201 + member object | B2-09 |
| P-15 | Add member — already member | POST /projects/{id}/members | existing member email | 409 CONFLICT | B2-07 |
| P-16 | Add member — non-manager | POST /projects/{id}/members | MEMBER role token | 403 ACCESS_DENIED | B2-09 |
| P-17 | Get members | GET /projects/{id}/members | Bearer token (member) | 200 + member list with roles | B2-09 |
| P-18 | Remove member | DELETE /projects/{id}/members/{userId} | MANAGER token | 204 No Content | B2-09 |

---

## Task Endpoint Tests (Phase 3)

| # | Test | Method + Path | Input | Expected | Task |
|---|------|--------------|-------|----------|------|
| T-01 | Create task | POST /projects/{id}/tasks | title + priority + assigneeId | 201 + task object | B3-09 |
| T-02 | Create task — non-member | POST /projects/{id}/tasks | non-member token | 403 NOT_PROJECT_MEMBER | B3-04 |
| T-03 | Create task — missing title | POST /projects/{id}/tasks | { priority: "HIGH" } | 400 validation error | B3-10 |
| T-04 | List tasks | GET /projects/{id}/tasks | Bearer token | 200 + paginated tasks | B3-09 |
| T-05 | Filter tasks by status | GET /projects/{id}/tasks?status=TODO | Bearer token | 200 + only TODO tasks | B3-05 |
| T-06 | Filter tasks by assignee | GET /projects/{id}/tasks?assigneeId={id} | Bearer token | 200 + assigned tasks | B3-05 |
| T-07 | Get task by ID | GET /tasks/{id} | Bearer token (member) | 200 + full task object | B3-09 |
| T-08 | Update task | PUT /tasks/{id} | new title + description | 200 + updated task | B3-09 |
| T-09 | Update task — unauthorized | PUT /tasks/{id} | unrelated member token | 403 ACCESS_DENIED | B3-06 |
| T-10 | Status update — valid transition | PATCH /tasks/{id}/status | { status: "IN_PROGRESS" } | 200 + updated task | B3-09 |
| T-11 | Status update — invalid transition | PATCH /tasks/{id}/status | TODO → DONE (skip) | 422 INVALID_STATUS_TRANSITION | B3-07 |
| T-12 | Delete task — MANAGER | DELETE /tasks/{id} | MANAGER token | 204 No Content | B3-09 |
| T-13 | Delete task — MEMBER | DELETE /tasks/{id} | MEMBER token | 403 ACCESS_DENIED | B3-08 |
| T-14 | Get my tasks | GET /tasks/my-tasks | Bearer token | 200 + only assignee=me tasks | B5-02 |

---

## Comment Endpoint Tests (Phase 4)

| # | Test | Method + Path | Input | Expected | Task |
|---|------|--------------|-------|----------|------|
| C-01 | Add comment | POST /tasks/{id}/comments | { content: "..." } | 201 + comment with author | B4-04 |
| C-02 | Add comment — non-member | POST /tasks/{id}/comments | non-member token | 403 NOT_PROJECT_MEMBER | B4-03 |
| C-03 | Add comment — empty content | POST /tasks/{id}/comments | { content: "" } | 400 validation error | B4-05 |
| C-04 | Get comments | GET /tasks/{id}/comments | Bearer token | 200 + chronological list | B4-04 |
| C-05 | Edit own comment | PUT /comments/{id} | { content: "updated" } | 200 + updated comment (is_edited=true) | B4-04 |
| C-06 | Edit another's comment | PUT /comments/{id} | different user token | 403 ACCESS_DENIED | B4-03 |
| C-07 | Delete own comment | DELETE /comments/{id} | comment author token | 204 No Content | B4-04 |
| C-08 | Delete comment — MANAGER | DELETE /comments/{id} | project MANAGER token | 204 No Content | B4-03 |

---

## Notification Endpoint Tests (Phase 4)

| # | Test | Method + Path | Input | Expected | Task |
|---|------|--------------|-------|----------|------|
| N-01 | Get notifications | GET /notifications | Bearer token | 200 + paginated + unreadCount | B4-10 |
| N-02 | Filter unread only | GET /notifications?isRead=false | Bearer token | 200 + only unread notifications | B4-10 |
| N-03 | Task assign creates notification | POST /projects/{id}/tasks (with assigneeId) | MANAGER token | Assignee receives TASK_ASSIGNED notification | B4-08 |
| N-04 | Comment creates notification | POST /tasks/{id}/comments | member token | Assignee + reporter get COMMENT_ADDED | B4-08 |
| N-05 | Mark single as read | PATCH /notifications/{id}/read | Bearer token | 200 + notification.isRead = true | B4-10 |
| N-06 | Mark all as read | PATCH /notifications/read-all | Bearer token | 204 + all notifications.isRead = true | B4-10 |
| N-07 | unreadCount decreases after read | GET /notifications (after N-05) | Bearer token | 200 + unreadCount decremented | B4-10 |

---

## Activity Endpoint Tests (Phase 4)

| # | Test | Method + Path | Input | Expected | Task |
|---|------|--------------|-------|----------|------|
| AC-01 | Get project activities | GET /projects/{id}/activities | Bearer token (member) | 200 + paginated activity feed | B4-15 |
| AC-02 | Get task activities | GET /tasks/{id}/activities | Bearer token (member) | 200 + task-specific events | B4-15 |
| AC-03 | Task creation logged | Create task then GET /tasks/{id}/activities | — | TASK_CREATED entry present | B4-14 |
| AC-04 | Status change logged | PATCH status then GET activities | — | TASK_STATUS_CHANGED with old+new value | B4-14 |
| AC-05 | Comment logged | POST comment then GET activities | — | COMMENT_ADDED entry present | B4-14 |

---

## Subtask Endpoint Tests (Phase 3 — V11 migration)

| # | Test | Method + Path | Input | Expected | Task |
|---|------|--------------|-------|----------|------|
| ST-01 | Add subtask | POST /tasks/{id}/subtasks | { title: "Write tests" } | 201 + subtask (isCompleted=false) | B3-09 |
| ST-02 | Add subtask — empty title | POST /tasks/{id}/subtasks | { title: "" } | 400 validation error | B3-09 |
| ST-03 | Add subtask — non-member | POST /tasks/{id}/subtasks | non-member token | 403 NOT_PROJECT_MEMBER | B3-04 |
| ST-04 | Toggle subtask (complete) | PATCH /subtasks/{id}/toggle | valid member token | 200 + isCompleted=true | B3-09 |
| ST-05 | Toggle subtask again (uncomplete) | PATCH /subtasks/{id}/toggle | valid member token | 200 + isCompleted=false | B3-09 |
| ST-06 | Delete subtask | DELETE /subtasks/{id} | member token | 204 No Content | B3-09 |

---

## Time Tracking Endpoint Tests (Phase 3 — V11 migration)

| # | Test | Method + Path | Input | Expected | Task |
|---|------|--------------|-------|----------|------|
| TT-01 | Log time | POST /tasks/{id}/time | { hours: 2.5 } | 200 + task with loggedHours=2.5 | B3-09 |
| TT-02 | Log more time | POST /tasks/{id}/time | { hours: 1.0 } (second call) | 200 + loggedHours=3.5 (cumulative) | B3-09 |
| TT-03 | Log time — invalid hours | POST /tasks/{id}/time | { hours: -1 } | 400 validation error | B3-09 |
| TT-04 | Log time — non-member | POST /tasks/{id}/time | non-member token | 403 NOT_PROJECT_MEMBER | B3-04 |

---

## Attachment Endpoint Tests (Phase 3 — V10 migration)

| # | Test | Method + Path | Input | Expected | Task |
|---|------|--------------|-------|----------|------|
| AT-01 | Upload attachment | POST /tasks/{id}/attachments | multipart/form-data file part | 201 + attachment (id, fileName, fileSize, storageUrl) | B3-09 |
| AT-02 | Upload — non-member | POST /tasks/{id}/attachments | non-member token | 403 NOT_PROJECT_MEMBER | B3-04 |
| AT-03 | List attachments | GET /tasks/{id}/attachments | valid member token | 200 + list of attachment objects | B3-09 |
| AT-04 | Download attachment | GET /attachments/{id}/download | valid member token | 200 + file stream with Content-Type header | B3-09 |
| AT-05 | Delete attachment | DELETE /attachments/{id} | uploader token | 204 No Content | B3-09 |
| AT-06 | Delete attachment — non-uploader | DELETE /attachments/{id} | different member token | 403 ACCESS_DENIED | B3-09 |
| AT-07 | Delete attachment — MANAGER can | DELETE /attachments/{id} | project MANAGER token | 204 No Content | B3-09 |

---

## Dashboard Endpoint Tests (Phase 5)

| # | Test | Method + Path | Input | Expected | Task |
|---|------|--------------|-------|----------|------|
| D-01 | Get dashboard summary | GET /dashboard/summary | Bearer token | 200 + { myTaskCounts, dueThisWeek, activeProjects, unreadNotifCount } | B5-01 |
| D-02 | Dashboard — no auth | GET /dashboard/summary | no token | 401 UNAUTHORIZED | B1-08 |

---

## Error Case Tests (Cross-phase)

| # | Test | Scenario | Expected |
|---|------|----------|----------|
| E-01 | Malformed JSON | Any POST with invalid JSON body | 400 BAD_REQUEST |
| E-02 | Wrong Content-Type | POST without Content-Type: application/json | 415 UNSUPPORTED_MEDIA_TYPE |
| E-03 | Expired access token | Request with expired JWT | 401 TOKEN_EXPIRED |
| E-04 | Malformed JWT | Request with garbled token | 401 TOKEN_INVALID |
| E-05 | Non-existent resource | GET /tasks/00000000-0000-0000-0000-000000000000 | 404 RESOURCE_NOT_FOUND |
| E-06 | UUID format violation | GET /tasks/not-a-uuid | 400 BAD_REQUEST |
| E-07 | Forbidden role | MEMBER attempts MANAGER action | 403 ACCESS_DENIED |
| E-08 | traceId in error | Any 4xx/5xx response | error body includes traceId field |
