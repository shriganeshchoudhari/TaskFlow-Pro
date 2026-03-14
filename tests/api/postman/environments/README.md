# Postman Environments

Environment files configure the `{{baseUrl}}`, auth tokens, and test data variables for
the Postman collection.

## Environment Files

| File | Target | Base URL |
|------|--------|----------|
| `local.json` | Local dev (Vite or Docker) | `http://localhost:8080/api/v1` |
| `staging.json` | AWS EKS staging namespace | `https://staging.api.taskflowpro.com/api/v1` |
| `production.json` | AWS EKS production | `https://api.taskflowpro.com/api/v1` |

> **Note:** If these files don't exist yet, create them from the template below.

## Environment Template

```json
{
  "name": "TaskFlow Pro - Local",
  "values": [
    { "key": "baseUrl",      "value": "http://localhost:8080/api/v1", "enabled": true },
    { "key": "accessToken",  "value": "",                             "enabled": true },
    { "key": "refreshToken", "value": "",                             "enabled": true },
    { "key": "userId",       "value": "",                             "enabled": true },
    { "key": "projectId",    "value": "",                             "enabled": true },
    { "key": "taskId",       "value": "",                             "enabled": true }
  ]
}
```

## Token Auto-Population

The Auth → Login request has a post-response script that automatically saves tokens:

```javascript
const res = pm.response.json();
pm.environment.set("accessToken",  res.accessToken);
pm.environment.set("refreshToken", res.refreshToken);
pm.environment.set("userId",       res.user?.id);
```

Run **Auth → Login** first to populate tokens before running other requests.

## Dev Credentials (seeded by V12 migration)

| Role | Email | Password |
|------|-------|----------|
| ADMIN | `admin@taskflow.com` | `Admin@1234` |
| MANAGER | `manager1@taskflow.com` | `Test@1234` |
| MEMBER | `worker1@taskflow.com` | `Test@1234` |
