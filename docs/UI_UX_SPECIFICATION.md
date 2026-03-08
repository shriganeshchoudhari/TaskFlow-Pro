# TaskFlow Pro — UI/UX Specification

**Version:** 1.0.0  
**Design System:** Material UI v5  
**Breakpoints:** xs (0px), sm (600px), md (900px), lg (1200px), xl (1536px)

---

## Table of Contents
1. [Design Principles](#1-design-principles)
2. [User Flows](#2-user-flows)
3. [Screen Descriptions](#3-screen-descriptions)
4. [Component Hierarchy](#4-component-hierarchy)
5. [Responsive Behavior](#5-responsive-behavior)
6. [Color & Typography](#6-color--typography)
7. [Accessibility](#7-accessibility)

---

## 1. Design Principles

| Principle | Application |
|-----------|-------------|
| **Clarity** | Minimal cognitive load; one primary action per screen |
| **Efficiency** | Keyboard shortcuts, bulk actions, quick status updates |
| **Feedback** | Every action provides immediate visual confirmation |
| **Consistency** | Shared components, standardized iconography, predictable patterns |
| **Accessibility** | WCAG 2.1 AA minimum compliance |

---

## 2. User Flows

### 2.1 Authentication Flow

```
[Landing Page]
      │
      ├──► [Register Page]
      │         │
      │    Fill form ──► Submit ──► Success toast ──► [Login Page]
      │
      └──► [Login Page]
                │
           Fill email/password ──► Submit
                │
                ├── Success ──► [Dashboard]
                └── Error   ──► Show inline error, clear password
```

### 2.2 Create Project Flow

```
[Dashboard] ──► Click "New Project" button
      │
      ▼
[Create Project Modal/Page]
  - Enter name (required)
  - Enter description (optional)
  - Set visibility (PUBLIC/PRIVATE)
  ──► Submit
      │
      ├── Success ──► Redirect to [Project Detail Page]
      └── Error   ──► Show validation errors inline
```

### 2.3 Create & Assign Task Flow

```
[Project Detail Page]
      │
      ▼
Click "Add Task" (+ button in column or toolbar)
      │
      ▼
[Task Form Dialog]
  - Title (required)
  - Description (markdown editor)
  - Priority (LOW/MEDIUM/HIGH/CRITICAL)
  - Assignee (member dropdown with avatar)
  - Due Date (date picker)
  - Tags (chip input)
      │
      ▼
Submit ──► Task appears in TODO column
         ──► Assignee receives notification (bell icon updates)
```

### 2.4 Update Task Status Flow

```
[Task Card in Project Board]
      │
      ▼
Click status chip → Select new status
      │
      ├── Inline update (optimistic UI)
      ├── PATCH /tasks/{id}/status
      ├── Success ──► Task card remains updated
      └── Error   ──► Revert to previous status + error toast
```

### 2.5 Notification Interaction Flow

```
[Any Page] ── Bell icon in NavBar shows unread count badge
      │
      ▼
Click bell ──► Notification Dropdown opens
      │
      ├── Click notification ──► Mark as read + Navigate to task
      └── Click "Mark all read" ──► All cleared, badge disappears
```

---

## 3. Screen Descriptions

### 3.1 Login Page (`/login`)

**Purpose:** Authenticate existing users.

**Layout:** Centered card (max-width 440px), vertical flex

**Components:**
- App logo + "TaskFlow Pro" wordmark (top)
- "Welcome back" heading (H4)
- Email TextField (full width, outlined)
- Password TextField (full width, with show/hide toggle)
- "Forgot password?" link (right-aligned)
- "Sign In" Button (full width, contained, primary)
- Divider + "Don't have an account? Register" link
- Error Alert (shows on failed login)

**States:**
- Default, Loading (button spinner), Error (alert + field border)

---

### 3.2 Register Page (`/register`)

**Purpose:** Create a new user account.

**Layout:** Centered card (max-width 480px)

**Components:**
- Full Name TextField
- Email TextField
- Password TextField (with strength indicator)
- Confirm Password TextField
- Terms checkbox
- "Create Account" Button
- "Already have an account? Sign in" link

---

### 3.3 Dashboard Page (`/dashboard`)

**Purpose:** Overview of user's work and projects.

**Layout:** Two-column (sidebar + content, collapsible on mobile)

**Top Section — Stats Row (4 cards):**
| Card | Icon | Content |
|------|------|---------|
| My Tasks | Assignment | Count: In Progress / Total |
| Due Soon | Schedule | Tasks due in 3 days |
| Projects | FolderOpen | Active project count |
| Notifications | NotificationsActive | Unread count |

**Middle Section:**
- "My Active Tasks" DataGrid (5 rows): title, project, status chip, priority chip, due date
- "Recent Activity" feed: avatar + action text + timestamp (last 10 events)

**Bottom Section:**
- "My Projects" cards grid (up to 6, "See all" link): project name, status, progress bar, member avatars

---

### 3.4 Project List Page (`/projects`)

**Purpose:** Browse and manage all accessible projects.

**Layout:** Full-width content area

**Header:**
- Title "Projects"
- Search field (filter by name)
- Status filter chips: All | Active | On Hold | Completed | Archived
- "+ New Project" Button (MANAGER/ADMIN only)

**Content:** Responsive grid (3 cols lg, 2 cols md, 1 col sm)

**Project Card:**
- Status indicator (colored left border)
- Project name (H6)
- Description (2-line truncated)
- Progress bar (`completed / total` tasks)
- Footer: owner avatar, member count, created date, kebab menu

---

### 3.5 Project Detail Page (`/projects/:id`)

**Purpose:** View and manage all tasks within a project.

**Layout:** Full-width with sticky header

**Header:**
- Project name + status badge
- Member avatars (up to 5 + overflow)
- "+ Add Task" button
- Tabs: Board | List | Activity

**Board Tab (default):**
- 4 columns: TODO | IN PROGRESS | IN REVIEW | DONE
- Each column: header with count, scrollable task card list
- Drag-and-drop to change status (v1.1)
- "+ Add task" inline in each column

**Task Card:**
- Priority color strip (left border)
- Task title
- Tag chips (up to 3, +N more)
- Due date (red if overdue)
- Assignee avatar (right-aligned)
- Comment count icon

**List Tab:**
- Sortable DataGrid with columns: Priority, Title, Assignee, Status, Due Date, Created

**Activity Tab:**
- Chronological event feed for all project tasks

---

### 3.6 Task Detail Page (`/tasks/:id`)

**Purpose:** View and edit all details of a specific task.

**Layout:** Two-column (70% main content, 30% sidebar)

**Main Column:**
- Breadcrumb: Project Name > Task Title
- Editable title (click to edit)
- Priority chip + Status dropdown (inline)
- Description (rich text, markdown preview/edit toggle)
- **Comments section:**
  - Comment list (avatar, name, time, content, edit/delete for own)
  - Comment input box (textarea + submit button)

**Sidebar:**
- Assignee (avatar + name, click to reassign)
- Reporter (avatar + name, read-only)
- Due Date (date picker)
- Tags (chip editor)
- Created / Updated timestamps
- **Activity Feed** (mini version, last 10 events for this task)

---

### 3.7 Profile Page (`/profile`)

**Purpose:** View and update user account settings.

**Sections:**
1. **Personal Info:** Full name, email (read-only), avatar upload
2. **Change Password:** Current password, new password, confirm
3. **Notification Preferences:** Toggles for each notification type (v1.1)
4. **Danger Zone:** Delete account (ADMIN only in v1)

---

## 4. Component Hierarchy

```
App (Router)
├── ProtectedRoute (auth guard)
│   └── Layout
│       ├── NavBar
│       │   ├── Logo
│       │   ├── GlobalSearch (v1.1)
│       │   ├── NotificationBell
│       │   │   └── NotificationDropdown
│       │   └── UserMenu (avatar dropdown)
│       ├── Sidebar
│       │   ├── NavItem (Dashboard)
│       │   ├── NavItem (Projects)
│       │   ├── NavItem (My Tasks)
│       │   └── NavItem (Settings)
│       └── MainContent
│           ├── DashboardPage
│           │   ├── StatsRow
│           │   │   └── StatCard × 4
│           │   ├── MyTasksWidget
│           │   └── RecentActivity
│           ├── ProjectListPage
│           │   ├── ProjectFilters
│           │   └── ProjectGrid
│           │       └── ProjectCard × N
│           ├── ProjectDetailPage
│           │   ├── ProjectHeader
│           │   ├── ProjectTabs
│           │   ├── BoardView
│           │   │   ├── StatusColumn × 4
│           │   │   │   └── TaskCard × N
│           │   ├── ListView
│           │   │   └── TaskDataGrid
│           │   └── ActivityFeed
│           └── TaskDetailPage
│               ├── TaskHeader
│               ├── TaskDescription
│               ├── CommentSection
│               │   ├── CommentList
│               │   │   └── CommentItem × N
│               │   └── CommentForm
│               └── TaskSidebar
└── PublicRoute
    ├── LoginPage
    └── RegisterPage
```

---

## 5. Responsive Behavior

### Breakpoint Behavior Matrix

| Component | xs (mobile) | sm (tablet) | md/lg (desktop) |
|-----------|-------------|-------------|-----------------|
| Sidebar | Hidden, drawer on demand | Collapsible icon-only | Always visible, expanded |
| NavBar | Logo + hamburger + bell | Logo + icons | Full with labels |
| Dashboard stats | 2×2 grid | 2×2 grid | 4×1 row |
| Project Grid | 1 column | 2 columns | 3 columns |
| Board View | Horizontal scroll, 1 visible column | 2 columns | 4 columns |
| Task Detail | Single column | Single column | 70/30 split |
| Notification dropdown | Full-screen overlay | 380px panel | 380px panel |

### Mobile-Specific Behaviors
- NavBar collapses to hamburger menu (MUI Drawer component)
- Board view: horizontal scroll snap, swipe to change column
- Task forms open as bottom sheets (not center dialogs)
- Touch targets minimum 44×44px (WCAG 2.5.5)
- FAB (Floating Action Button) for primary CTA on mobile

---

## 6. Color & Typography

### Primary Color Palette
```
Primary:    #1976D2  (MUI Blue 700) — buttons, links, active states
Secondary:  #9C27B0  (MUI Purple 700) — tags, accents
Success:    #2E7D32  (MUI Green 800) — done status, success alerts
Warning:    #E65100  (MUI Orange 900) — high priority, warnings
Error:      #C62828  (MUI Red 800) — critical priority, errors
Info:       #0277BD  (MUI LightBlue 800) — info alerts
```

### Status Colors
```
TODO:       #757575 (Grey 600)
IN_PROGRESS:#1565C0 (Blue 800)
REVIEW:     #F57F17 (Amber 900)
DONE:       #2E7D32 (Green 800)
```

### Priority Colors
```
LOW:        #388E3C (Green 700)
MEDIUM:     #F57C00 (Orange 700)
HIGH:       #E53935 (Red 600)
CRITICAL:   #880E4F (Pink 900)
```

### Typography (Roboto)
```
H1: 2.5rem / 700 — Page titles
H4: 1.75rem / 600 — Card/section headers
H6: 1.25rem / 600 — Card titles
Body1: 1rem / 400 — Primary content
Body2: 0.875rem / 400 — Secondary content
Caption: 0.75rem / 400 — Timestamps, metadata
```

---

## 7. Accessibility

| Requirement | Implementation |
|-------------|---------------|
| Color contrast | AA minimum (4.5:1 text, 3:1 UI) |
| Keyboard navigation | Full keyboard support, visible focus rings |
| Screen readers | Proper ARIA labels on icons, status chips, live regions for notifications |
| Form errors | `aria-describedby` linking fields to error messages |
| Loading states | `aria-busy` + `aria-live` for dynamic content |
| Dialogs | Focus trap, ESC to close, `role="dialog"` |
| Images | Alt text on all decorative and informative images |
| Skip link | "Skip to main content" first focusable element |
