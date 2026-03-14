# TaskFlow Pro — Test Cases: E2E

**Version:** 2.0.0 *(updated 2026-03-14 — spec files updated, global-setup, 8 spec files)*  
**Tool:** Playwright 1.40+  
**Config:** `tests/e2e/playwright/playwright.config.ts`  
**Browser:** Chromium (headless in CI, configurable locally)  
**Implementation Task:** T6-05

---

## Test Files

| Spec File | Suites | Description |
|-----------|--------|-------------|
| `tests/taskflow.spec.ts` | Auth (5) · Projects (2) · Tasks (2) · Notifications (3) | Core flows |
| `tests/tasks.spec.ts` | Tasks | Task CRUD + status transitions |
| `tests/projects.spec.ts` | Projects | Project CRUD + member management |
| `tests/dashboard.spec.ts` | Dashboard | Stat cards + widget links |
| `tests/notifications.spec.ts` | Notifications | Bell · dropdown · mark-all-read |
| `tests/profile.spec.ts` | Profile | Edit name + change password |
| `tests/responsive.spec.ts` | Responsive | Mobile viewport · drawer · board scroll |
| `tests/advanced-features.spec.ts` | Advanced | Subtasks · time tracking · file uploads |
| `full-journey.spec.js` | Journey | Complete user journey (CI gate) |

---

## Setup

```bash
cd tests/e2e/playwright
npm install
npx playwright install --with-deps chromium

# Requires running backend + frontend stack first:
docker compose -f infra/docker/docker-compose.dev.yml up -d
# OR: ./mvnw spring-boot:run + npm run dev in separate terminals

# global-setup.ts polls /actuator/health before any test runs
# and seeds the e2e-test@taskflow.com user automatically

# Run all specs (headless)
npx playwright test

# Run with UI mode (interactive)
npx playwright test --ui

# Run specific spec file
npx playwright test tests/taskflow.spec.ts

# Run against Docker stack (production-like)
PLAYWRIGHT_BASE_URL=http://localhost:80 npx playwright test

# Run against custom backend
BACKEND_URL=http://localhost:8080 npx playwright test

# Debug a single test
npx playwright test --debug tests/tasks.spec.ts

# HTML report
npx playwright test --reporter=html && npx playwright show-report
```

**Environment variables:**
```
PLAYWRIGHT_BASE_URL=http://localhost:5173   # frontend URL (default)
BACKEND_URL=http://localhost:8080            # backend URL (used by global-setup)
```

**Pre-seeded test user** (created by `global-setup.ts` before every run):
```
email:    e2e-test@taskflow.com
password: TestPass123!
```

---

## Suite 1: Authentication (Phase 1)

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| E2E-AUTH-01 | Successful user registration | 1. Go to /register · 2. Fill fullName, email, password, confirm · 3. Check terms · 4. Click Create Account | Redirect to /login; success toast shown |
| E2E-AUTH-02 | Login with valid credentials | 1. Go to /login · 2. Enter email + password · 3. Click Sign In | Redirect to /dashboard; NavBar shows user avatar |
| E2E-AUTH-03 | Login with invalid password | 1. Go to /login · 2. Enter correct email + wrong password · 3. Click Sign In | Error alert shown; still on /login |
| E2E-AUTH-04 | Protected route redirect | 1. Open /dashboard without logging in | Redirect to /login automatically |
| E2E-AUTH-05 | Logout | 1. Login · 2. Click avatar menu · 3. Click Sign Out | Redirect to /login; navbar cleared |

---

## Suite 2: Project Management (Phase 2)

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| E2E-PROJ-01 | Create a project | 1. Login · 2. Click "+ New Project" · 3. Fill name + description · 4. Submit | Project card appears in list; detail page accessible |
| E2E-PROJ-02 | View project list | 1. Login with projects already created | Project grid renders; each card shows name, status, progress |
| E2E-PROJ-03 | Filter projects by status | 1. Login · 2. Click "Active" status chip | Only ACTIVE projects shown |
| E2E-PROJ-04 | Search projects by name | 1. Login · 2. Type partial name in search field | Matching projects shown; others hidden |
| E2E-PROJ-05 | Invite member by email | 1. Open project detail · 2. Go to Members tab · 3. Enter email · 4. Click Invite | New member appears in list with MEMBER role |
| E2E-PROJ-06 | Archive project | 1. Open project · 2. Open kebab menu · 3. Click Archive | Project disappears from ACTIVE filter; visible in ARCHIVED |
| E2E-PROJ-07 | Non-member cannot access private project | 1. Login as user B · 2. Navigate to project URL owned by user A | 403 / redirect shown; project detail not visible |

---

## Suite 3: Task Management (Phase 3)

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| E2E-TASK-01 | Create a task | 1. Open project board · 2. Click "+ Add Task" in TODO column · 3. Fill title + priority + due date · 4. Assign to self · 5. Submit | Task card appears in TODO column |
| E2E-TASK-02 | Drag task to IN PROGRESS (v1.1) / Click status chip | 1. Click status chip on task card · 2. Select IN_PROGRESS | Task moves to IN_PROGRESS column; activity logged |
| E2E-TASK-03 | View task detail | 1. Click task card | Task detail page opens; breadcrumb shows Project > Task |
| E2E-TASK-04 | Edit task inline | 1. Open task detail · 2. Click title to edit · 3. Change + blur | Title updates without page reload |
| E2E-TASK-05 | Change task priority | 1. Open task detail · 2. Click priority chip · 3. Select HIGH | Priority updates; left border colour changes |
| E2E-TASK-06 | Invalid status transition (UI guard) | 1. Open TODO task detail · 2. Try to select DONE from status dropdown | DONE disabled or error toast shown; status stays TODO |
| E2E-TASK-07 | My Tasks page | 1. Login as assigned user · 2. Navigate to /my-tasks | Only tasks assigned to current user shown |
| E2E-TASK-08 | List view — sort by priority | 1. Open project · 2. Click "List" tab · 3. Click Priority column header | Tasks sorted by priority descending |

---

## Suite 4: Comments & Notifications (Phase 4)

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| E2E-NOTIF-01 | Comment creates notification | 1. User A opens task · 2. Posts comment · 3. User B (assignee) checks bell | Bell badge increments for user B |
| E2E-NOTIF-02 | Click notification navigates | 1. User B clicks notification | Dropdown closes; navigates to task detail |
| E2E-NOTIF-03 | Mark all notifications read | 1. User B has unread notifs · 2. Opens dropdown · 3. Clicks "Mark all read" | Badge disappears; all notifs show as read |
| E2E-NOTIF-04 | Task assignment notification | 1. MANAGER assigns task to User C | User C's bell badge shows TASK_ASSIGNED notification |
| E2E-NOTIF-05 | Edit own comment | 1. User posts comment · 2. Clicks edit icon · 3. Changes text · 4. Saves | Comment shows updated text + "(edited)" indicator |

---

## Suite 5: Dashboard (Phase 5)

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| E2E-DASH-01 | Dashboard loads correctly | 1. Login · 2. Navigate to /dashboard | 4 stat cards visible with numeric values; no loading skeletons remaining |
| E2E-DASH-02 | My Tasks widget links | 1. Dashboard loaded · 2. Click a task row in My Tasks widget | Navigates to task detail page |
| E2E-DASH-03 | My Projects "See all" link | 1. Dashboard loaded · 2. Click "See all" link | Navigates to /projects |

---

## Suite 6: Profile (Phase 5)

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| E2E-PROF-01 | Update display name | 1. Navigate to /profile · 2. Edit full name · 3. Save | NavBar shows updated name immediately |
| E2E-PROF-02 | Change password | 1. Navigate to /profile · 2. Fill current + new + confirm password · 3. Save | Success toast; old password no longer works |
| E2E-PROF-03 | Wrong current password | 1. /profile · 2. Enter incorrect current password | Error message shown below field |

---

## Suite 7: Responsive / Mobile (Phase 5)

*Run on Mobile Chrome viewport (375×812)*

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| E2E-RESP-01 | Sidebar collapses to hamburger | 1. Open app on mobile viewport | Sidebar hidden; hamburger icon in NavBar |
| E2E-RESP-02 | Board view — horizontal scroll | 1. Open project board on mobile | Single column visible; other columns reachable by horizontal swipe/scroll |
| E2E-RESP-03 | Notification dropdown — full screen | 1. Click bell on mobile | Dropdown opens as full-screen overlay |
| E2E-RESP-04 | Task form — bottom sheet | 1. Click "+ Add Task" on mobile | Form opens as bottom sheet (not center dialog) |
| E2E-RESP-05 | Touch targets ≥ 44px | 1. Inspect all buttons and icon buttons | All interactive elements ≥ 44×44px |

---

## Suite 8: Full User Journey (Phase 6 — CI gate)

*Single comprehensive scenario that covers the core product flow end-to-end.*

| # | Step | Action | Verification |
|---|------|--------|-------------|
| 1 | Register | Fill and submit register form | 201; redirect to login |
| 2 | Login | Enter credentials | Redirect to dashboard |
| 3 | Create project | Fill project form | Project appears in list |
| 4 | Create task | Fill task form (title, HIGH priority, due in 2 days, assign to self) | Task in TODO column |
| 5 | Update status | Change TODO → IN_PROGRESS | Card moves to IN_PROGRESS column |
| 6 | Add comment | Type comment and submit | Comment appears in task detail |
| 7 | Verify notification | Check bell icon | unreadCount > 0 (COMMENT_ADDED for reporter) |
| 8 | Mark notification read | Click notification | Bell badge clears; navigates to task |
| 9 | Check activity feed | Open Activity tab on project | TASK_CREATED, STATUS_CHANGED, COMMENT_ADDED all present |
| 10 | Check dashboard | Navigate to /dashboard | My Tasks count reflects the task; project in grid |

> This is the **CI smoke test** — must pass headlessly on every merge to `main` (see `CI6-03`).
