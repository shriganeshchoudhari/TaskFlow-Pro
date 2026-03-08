# TaskFlow Pro — API Test Cases

**Tool:** Postman + Newman  
**Collection:** `tests/api/postman/TaskflowPro.postman_collection.json`  
**Format:** Postman v2.1 Collection

---

## Table of Contents
1. [Auth Tests](#1-auth-tests)
2. [Project Tests](#2-project-tests)
3. [Task Tests](#3-task-tests)
4. [Comment Tests](#4-comment-tests)
5. [Notification Tests](#5-notification-tests)
6. [Error Case Tests](#6-error-case-tests)
7. [REST Client Requests](#7-rest-client-requests)

---

## 1. Auth Tests

### TC-AUTH-001: Register New User

```
Method: POST
URL: {{baseUrl}}/api/v1/auth/register
Headers: Content-Type: application/json
Body:
{
  "fullName": "Test User",
  "email": "testuser_{{$randomInt}}@example.com",
  "password": "TestPass123!"
}

Tests:
  ✓ Status code is 201
  ✓ Response has id (UUID format)
  ✓ Response has email matching request
  ✓ Response does NOT contain password field
  ✓ Response has role = "MEMBER"
  ✓ Response has createdAt (ISO 8601)
```

### TC-AUTH-002: Register — Duplicate Email

```
Method: POST
URL: {{baseUrl}}/api/v1/auth/register
Body: { email: "existing@example.com", ... }

Tests:
  ✓ Status code is 409
  ✓ Error message contains "already registered"
  ✓ Error status field = "CONFLICT"
```

### TC-AUTH-003: Register — Invalid Password

```
Method: POST
URL: {{baseUrl}}/api/v1/auth/register
Body: { password: "weak" }

Tests:
  ✓ Status code is 400
  ✓ Response details array contains password field error
  ✓ Error status field = "BAD_REQUEST"
```

### TC-AUTH-004: Login Success

```
Method: POST
URL: {{baseUrl}}/api/v1/auth/login
Body: { "email": "{{testEmail}}", "password": "{{testPassword}}" }

Pre-request Script:
  pm.collectionVariables.set("testEmail", "jane@example.com");
  pm.collectionVariables.set("testPassword", "TestPass123!");

Tests:
  ✓ Status code is 200
  ✓ Response has accessToken (non-empty string)
  ✓ Response has refreshToken (non-empty string)
  ✓ Response tokenType = "Bearer"
  ✓ Response expiresIn = 900
  ✓ Response user.email matches request email
  ✓ accessToken stored: pm.collectionVariables.set("accessToken", ...)
  ✓ refreshToken stored: pm.collectionVariables.set("refreshToken", ...)
```

### TC-AUTH-005: Login — Wrong Password

```
Method: POST
URL: {{baseUrl}}/api/v1/auth/login
Body: { "email": "jane@example.com", "password": "wrongpassword" }

Tests:
  ✓ Status code is 401
  ✓ Error message = "Invalid email or password"
  ✓ Response does NOT contain accessToken
```

### TC-AUTH-006: Login — Non-existent Email

```
Tests:
  ✓ Status code is 401
  ✓ Error message does NOT reveal whether email exists (same message)
```

### TC-AUTH-007: Refresh Token

```
Method: POST
URL: {{baseUrl}}/api/v1/auth/refresh
Body: { "refreshToken": "{{refreshToken}}" }

Tests:
  ✓ Status code is 200
  ✓ New accessToken returned (different from old)
  ✓ New refreshToken returned (rotation)
  ✓ Update stored tokens in collection variables
```

### TC-AUTH-008: Refresh — Expired Token

```
Tests:
  ✓ Status code is 401
  ✓ Error code = "REFRESH_TOKEN_EXPIRED"
```

### TC-AUTH-009: Access Protected Route — No Token

```
Method: GET
URL: {{baseUrl}}/api/v1/projects
(No Authorization header)

Tests:
  ✓ Status code is 401
  ✓ Response message indicates missing authentication
```

### TC-AUTH-010: Logout

```
Method: POST
URL: {{baseUrl}}/api/v1/auth/logout
Headers: Authorization: Bearer {{accessToken}}
Body: { "refreshToken": "{{refreshToken}}" }

Tests:
  ✓ Status code is 204
  ✓ Subsequent refresh with same token returns 401
```

---

## 2. Project Tests

### TC-PROJ-001: Create Project

```
Method: POST
URL: {{baseUrl}}/api/v1/projects
Headers: Authorization: Bearer {{accessToken}}
Body:
{
  "name": "Test Project {{$randomInt}}",
  "description": "Created by API test",
  "visibility": "PRIVATE"
}

Tests:
  ✓ Status code is 201
  ✓ Response has id (UUID)
  ✓ Response name matches request
  ✓ Response status = "ACTIVE"
  ✓ Response owner.email = authenticated user's email
  ✓ Store: pm.collectionVariables.set("projectId", data.id)
```

### TC-PROJ-002: Get All Projects

```
Method: GET
URL: {{baseUrl}}/api/v1/projects?page=0&size=10

Tests:
  ✓ Status code is 200
  ✓ Response has content array
  ✓ Response has totalElements (integer)
  ✓ Response has page = 0
  ✓ All items have id, name, status, owner
```

### TC-PROJ-003: Get Project by ID

```
Method: GET
URL: {{baseUrl}}/api/v1/projects/{{projectId}}

Tests:
  ✓ Status code is 200
  ✓ Response id = {{projectId}}
  ✓ Response has memberCount >= 1
```

### TC-PROJ-004: Update Project

```
Method: PUT
URL: {{baseUrl}}/api/v1/projects/{{projectId}}
Body: { "name": "Updated Name", "status": "ON_HOLD" }

Tests:
  ✓ Status code is 200
  ✓ Response name = "Updated Name"
  ✓ Response status = "ON_HOLD"
  ✓ Response updatedAt > Response createdAt
```

### TC-PROJ-005: Add Member to Project

```
Method: POST
URL: {{baseUrl}}/api/v1/projects/{{projectId}}/members
Body: { "email": "member@example.com", "role": "MEMBER" }

Tests:
  ✓ Status code is 201
  ✓ Response user.email = "member@example.com"
  ✓ Response role = "MEMBER"
```

### TC-PROJ-006: Get Project Members

```
Method: GET
URL: {{baseUrl}}/api/v1/projects/{{projectId}}/members

Tests:
  ✓ Status code is 200
  ✓ Response is an array
  ✓ Array has at least 2 members (owner + added member)
  ✓ Each member has user.id, user.email, role, joinedAt
```

### TC-PROJ-007: Unauthorized — MEMBER Cannot Create Project

```
Setup: Login as MEMBER role user, get member access token
Method: POST URL: {{baseUrl}}/api/v1/projects

Tests:
  ✓ Status code is 403
  ✓ Error = "FORBIDDEN"
```

### TC-PROJ-008: Delete (Archive) Project

```
Method: DELETE
URL: {{baseUrl}}/api/v1/projects/{{projectId}}

Tests:
  ✓ Status code is 204
  ✓ GET {{projectId}} returns status = "ARCHIVED" (or 404)
```

---

## 3. Task Tests

### TC-TASK-001: Create Task

```
Method: POST
URL: {{baseUrl}}/api/v1/projects/{{projectId}}/tasks
Body:
{
  "title": "Implement feature X",
  "description": "Detailed description",
  "priority": "HIGH",
  "status": "TODO",
  "dueDate": "2025-12-31",
  "assigneeId": "{{memberId}}"
}

Tests:
  ✓ Status code is 201
  ✓ Response id is UUID
  ✓ Response title matches
  ✓ Response status = "TODO"
  ✓ Response priority = "HIGH"
  ✓ Response assignee.id = {{memberId}}
  ✓ Store: pm.collectionVariables.set("taskId", data.id)
```

### TC-TASK-002: Get Tasks in Project

```
Method: GET
URL: {{baseUrl}}/api/v1/projects/{{projectId}}/tasks

Tests:
  ✓ Status code is 200
  ✓ content array contains created task
  ✓ totalElements >= 1
```

### TC-TASK-003: Get Tasks — Filter by Status

```
Method: GET
URL: {{baseUrl}}/api/v1/projects/{{projectId}}/tasks?status=TODO

Tests:
  ✓ Status code is 200
  ✓ All items in content have status = "TODO"
```

### TC-TASK-004: Get Task by ID

```
Method: GET
URL: {{baseUrl}}/api/v1/tasks/{{taskId}}

Tests:
  ✓ Status code is 200
  ✓ Response id = {{taskId}}
  ✓ Response has projectId
  ✓ Response has reporter
```

### TC-TASK-005: Update Task Status

```
Method: PATCH
URL: {{baseUrl}}/api/v1/tasks/{{taskId}}/status
Body: { "status": "IN_PROGRESS" }

Tests:
  ✓ Status code is 200
  ✓ Response status = "IN_PROGRESS"
  ✓ Response updatedAt updated
```

### TC-TASK-006: Update Task Details

```
Method: PUT
URL: {{baseUrl}}/api/v1/tasks/{{taskId}}
Body: { "title": "Updated title", "priority": "CRITICAL" }

Tests:
  ✓ Status code is 200
  ✓ Response title = "Updated title"
  ✓ Response priority = "CRITICAL"
```

### TC-TASK-007: Update Task — Invalid Status Transition

```
Setup: Task in "DONE" status
Method: PATCH body: { "status": "IN_PROGRESS" } (not allowed in v1)

Tests:
  ✓ Status code is 422
  ✓ Error contains "status transition"
```

### TC-TASK-008: Delete Task

```
Method: DELETE
URL: {{baseUrl}}/api/v1/tasks/{{taskId}}

Tests:
  ✓ Status code is 204
  ✓ GET {{taskId}} returns 404
```

---

## 4. Comment Tests

### TC-CMT-001: Add Comment to Task

```
Method: POST
URL: {{baseUrl}}/api/v1/tasks/{{taskId}}/comments
Body: { "content": "This is a test comment" }

Tests:
  ✓ Status code is 201
  ✓ Response content = "This is a test comment"
  ✓ Response author.email = authenticated user's email
  ✓ Store: pm.collectionVariables.set("commentId", data.id)
```

### TC-CMT-002: Get Comments

```
Method: GET
URL: {{baseUrl}}/api/v1/tasks/{{taskId}}/comments

Tests:
  ✓ Status code is 200
  ✓ Response is an array
  ✓ Array contains comment with matching id
  ✓ Comments ordered by createdAt ASC
```

### TC-CMT-003: Edit Own Comment

```
Method: PUT
URL: {{baseUrl}}/api/v1/comments/{{commentId}}
Body: { "content": "Updated comment content" }

Tests:
  ✓ Status code is 200
  ✓ Response content = "Updated comment content"
  ✓ Response isEdited = true
```

### TC-CMT-004: Delete Another User's Comment (Forbidden)

```
Setup: Login as different user
Method: DELETE
URL: {{baseUrl}}/api/v1/comments/{{commentId}}

Tests:
  ✓ Status code is 403
```

---

## 5. Notification Tests

### TC-NOTIF-001: Get Notifications

```
Method: GET
URL: {{baseUrl}}/api/v1/notifications

Tests:
  ✓ Status code is 200
  ✓ Response has content array
  ✓ Response has unreadCount (integer)
  ✓ Each notification has id, type, message, isRead, createdAt
```

### TC-NOTIF-002: Mark Notification as Read

```
Setup: Get first unread notification id
Method: PATCH
URL: {{baseUrl}}/api/v1/notifications/{{notificationId}}/read

Tests:
  ✓ Status code is 200
  ✓ Response isRead = true
```

### TC-NOTIF-003: Mark All Notifications Read

```
Method: PATCH
URL: {{baseUrl}}/api/v1/notifications/read-all

Tests:
  ✓ Status code is 204
  ✓ GET /notifications returns unreadCount = 0
```

---

## 6. Error Case Tests

### TC-ERR-001: Invalid UUID in Path

```
Method: GET
URL: {{baseUrl}}/api/v1/projects/not-a-uuid

Tests:
  ✓ Status code is 400
  ✓ Error message mentions invalid ID format
```

### TC-ERR-002: Resource Not Found

```
Method: GET
URL: {{baseUrl}}/api/v1/projects/00000000-0000-0000-0000-000000000000

Tests:
  ✓ Status code is 404
  ✓ Error = "NOT_FOUND"
```

### TC-ERR-003: Expired JWT Token

```
Method: GET (with expired token in Authorization)
URL: {{baseUrl}}/api/v1/projects

Tests:
  ✓ Status code is 401
  ✓ Error code = "TOKEN_EXPIRED"
```

### TC-ERR-004: Access Non-Member Project

```
Setup: Create project as User A, login as User B (non-member)
Method: GET
URL: {{baseUrl}}/api/v1/projects/{{userAProjectId}}

Tests:
  ✓ Status code is 403 or 404 (consistent)
```

---

## 7. REST Client Requests

File: `tests/api/rest-client/taskflow.http`

```http
### Variables
@baseUrl = http://localhost:8080/api/v1
@contentType = application/json

### 1. Register User
POST {{baseUrl}}/auth/register
Content-Type: {{contentType}}

{
  "fullName": "Test User",
  "email": "test@example.com",
  "password": "TestPass123!"
}

### 2. Login
# @name login
POST {{baseUrl}}/auth/login
Content-Type: {{contentType}}

{
  "email": "test@example.com",
  "password": "TestPass123!"
}

### 3. Extract token from login response
@accessToken = {{login.response.body.accessToken}}

### 4. Get Projects
GET {{baseUrl}}/projects
Authorization: Bearer {{accessToken}}
Accept: {{contentType}}

### 5. Create Project
POST {{baseUrl}}/projects
Authorization: Bearer {{accessToken}}
Content-Type: {{contentType}}

{
  "name": "My First Project",
  "description": "Test project via REST client",
  "visibility": "PRIVATE"
}

### 6. Create Task
# Replace {projectId} with actual UUID
POST {{baseUrl}}/projects/{projectId}/tasks
Authorization: Bearer {{accessToken}}
Content-Type: {{contentType}}

{
  "title": "First Task",
  "description": "Task created via REST client",
  "priority": "MEDIUM",
  "status": "TODO"
}

### 7. Update Task Status
PATCH {{baseUrl}}/tasks/{taskId}/status
Authorization: Bearer {{accessToken}}
Content-Type: {{contentType}}

{
  "status": "IN_PROGRESS"
}

### 8. Add Comment
POST {{baseUrl}}/tasks/{taskId}/comments
Authorization: Bearer {{accessToken}}
Content-Type: {{contentType}}

{
  "content": "Working on this now!"
}

### 9. Get Notifications
GET {{baseUrl}}/notifications?isRead=false&page=0&size=20
Authorization: Bearer {{accessToken}}

### 10. Refresh Token
POST {{baseUrl}}/auth/refresh
Content-Type: {{contentType}}

{
  "refreshToken": "{{refreshToken}}"
}
```
