# Postman Collections

## Files

| File | Contents |
|------|---------|
| `TaskflowPro.postman_collection.json` | Main collection — ~98 test cases across all API endpoints |

## Collection Structure

The collection is organized into folders matching the API:

```
TaskFlow Pro API
├── Auth
│   ├── Register (valid · duplicate email · invalid password)
│   ├── Login (valid · wrong password · inactive user)
│   ├── Refresh Token (valid · expired · revoked)
│   └── Logout (valid · already logged out)
├── Users
│   ├── GET /users/me
│   ├── PUT /users/me (update profile)
│   └── PUT /users/me/password (change password)
├── Projects
│   ├── Create · List · Get · Update · Archive
│   └── Members: Add · List · Update Role · Remove
├── Tasks
│   ├── Create · List · Get · Update · Delete
│   ├── PATCH /tasks/:id/status (valid transitions · invalid transitions)
│   ├── GET /tasks/my-tasks
│   ├── Subtasks: Add · Toggle · Delete
│   ├── Time: POST /tasks/:id/time
│   └── Attachments: Upload · List · Download · Delete
├── Comments
│   ├── Create · List · Edit · Delete
│   └── Authorization: author vs non-author vs manager
├── Notifications
│   ├── GET /notifications (all · unread only)
│   ├── PATCH /notifications/:id/read
│   └── PATCH /notifications/read-all
├── Activities
│   ├── GET /projects/:id/activities
│   └── GET /tasks/:id/activities
├── Dashboard
│   └── GET /dashboard/summary
└── Error Cases
    ├── 400 Validation errors
    ├── 401 Missing/expired token
    ├── 403 Insufficient permissions
    ├── 404 Not found
    ├── 409 Conflict (duplicate email)
    ├── 422 Invalid status transition
    └── 429 Rate limit exceeded
```

## Running with Newman (CLI)

```bash
# Install Newman
npm install -g newman

# Run against local dev stack
newman run TaskflowPro.postman_collection.json \
  -e environments/local.json \
  --reporters cli,html \
  --reporter-html-export results/newman-report.html

# Run against staging
newman run TaskflowPro.postman_collection.json \
  -e environments/staging.json
```

## Environment Variables Used

The collection uses `{{baseUrl}}`, `{{accessToken}}`, and `{{refreshToken}}` variables.
These are auto-populated by the pre-request scripts in the Auth folder.

See `environments/` for environment-specific variable files.

## Importing into Postman

1. Open Postman → Import
2. Select `TaskflowPro.postman_collection.json`
3. Import the matching environment from `environments/`
4. Set `baseUrl` to `http://localhost:8080/api/v1`
