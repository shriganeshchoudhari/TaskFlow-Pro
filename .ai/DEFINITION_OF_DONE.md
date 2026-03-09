# Definition of Done (DoD)

A change is "done" when **all** of the following apply:

---

## Universal DoD (every task)

- [ ] Requirements clear — acceptance criteria in `docs/PRD.md` or PR description
- [ ] API/DB/UI changes documented — relevant `docs/` files updated
- [ ] Security addressed — authz, validation, no secrets in code (see `docs/SECURITY_COMPLIANCE.md`)
- [ ] Tests exist — unit/integration/E2E as appropriate (see `docs/TEST_PLAN.md`)
- [ ] Quality gates pass — see `.ai/QUALITY_GATES.md`
- [ ] No new HIGH/CRITICAL issues — build warnings, failing CI, broken local run

---

## Phase-Specific DoD

### Phase 1 — Foundation & Authentication
- `POST /auth/register` returns 201 with user object (no password in response)
- `POST /auth/login` returns `{ accessToken, refreshToken, expiresIn, user }`
- `POST /auth/refresh` rotates both access and refresh token
- `POST /auth/logout` revokes refresh token in DB (is_revoked = true)
- Invalid credentials → 401 with standard error JSON (no stack trace)
- Duplicate email → 409 with `EMAIL_ALREADY_EXISTS` error code
- Protected routes redirect unauthenticated user to `/login`
- `AuthService` unit tests: ≥ 80% line coverage, all happy + sad paths covered
- Flyway V1 and V8 migrations run cleanly on fresh PostgreSQL

### Phase 2 — Project Management
- Authenticated user can create, read, update, and archive a project
- Project creator is auto-assigned `MANAGER` role in `project_members`
- Only `MANAGER` or `ADMIN` can invite/remove members and update project
- Archived project (`status = ARCHIVED`) excluded from Active filter results
- Private project not visible to non-members (403 returned)
- GET `/projects` response is paginated with `{ content, page, totalElements }`
- Frontend Project List + Project Detail pages render real API data

### Phase 3 — Task Management
- Task created → appears in `TODO` column of the Kanban board
- Status transitions: `TODO → IN_PROGRESS → REVIEW → DONE` (and back) work
- Invalid status transitions return 422 with `INVALID_STATUS_TRANSITION` error code
- Only `assignee`, `reporter`, or project `MANAGER` can update a task
- Only project `MANAGER` or `ADMIN` can delete a task
- Deleting a project cascades and deletes all its tasks + comments
- Task tags stored as PostgreSQL `TEXT[]` array
- `ActivityService.logActivity()` called on every task state change
- `NotificationService` notified when a task is created with an assignee
- My Tasks page (`/my-tasks`) shows only tasks where `assigneeId = currentUser.id`
- Optimistic UI for status change: reverts on API error with error toast

### Phase 4 — Comments, Notifications & Activity
- Posting a comment notifies `assignee` and `reporter` (type: `COMMENT_ADDED`)
- Assigning a task notifies the new assignee (type: `TASK_ASSIGNED`)
- `unreadCount` badge in NavBar updates without page reload (polling every 60s)
- Clicking a notification navigates to the related task and marks it read
- "Mark all read" clears badge and marks all `is_read = true`
- Activity feed shows: actor avatar, action text, old→new values, timestamp
- `@Scheduled` cron job creates `DUE_DATE_REMINDER` notifications 24h before `due_date`
- Comment ordering: chronological ascending (oldest first)

### Phase 5 — Dashboard, Profile & UI Polish
- Dashboard stat cards load from `GET /dashboard/summary` (single aggregation query)
- Profile updates (`fullName`, `avatarUrl`) persist via `PUT /users/me`
- Password change verifies `currentPassword` before accepting `newPassword`
- Rate limiting active: login (10/15min), register (5/1hr) → 429 with `retryAfter`
- Swagger UI accessible at `/swagger-ui.html` with all endpoints documented
- App is fully keyboard-navigable (Tab, Enter, Esc, arrow keys)
- No focus traps outside dialog components
- Board view: horizontal scroll on `xs` breakpoint
- Sidebar: icon-only on `sm`, expanded on `md/lg`, MUI Drawer on `xs`
- All mutations (create/update/delete) show MUI Snackbar toast (3s auto-dismiss)
- All ARIA labels set on icon buttons, status chips, notification bell, dialogs
- MUI Skeleton loading on Dashboard, Project List, Task Board

### Phase 6 — DevOps, Testing & Monitoring
- `mvn verify jacoco:report` reports ≥ 80% line coverage; build fails below threshold
- `AuthControllerIT`, `ProjectControllerIT`, `TaskControllerIT` pass with Testcontainers
- Playwright E2E suite passes headlessly in CI (Chromium)
- k6 load test: P95 API response ≤ 300ms at 500 concurrent virtual users
- All GitHub Actions workflows succeed on PR to main
- `deploy.yml` pushes to ECR and performs zero-downtime rolling deploy to EKS
- No CRITICAL CVEs in Trivy image scan (CI gate)
- Prometheus scraping `/actuator/prometheus`; Grafana dashboards show live data
- `docker-compose -f infra/docker/docker-compose.dev.yml up --build` starts full stack
- `scripts/setup.sh` bootstraps local dev environment in one command

---

## What "done" is NOT

- Code merged but tests written later → **not done**
- Feature works locally but CI is broken → **not done**
- API changed but `docs/API_DOCUMENTATION.md` not updated → **not done**
- New endpoint with no authorization check → **not done**
- New migration not tested on fresh DB → **not done**
