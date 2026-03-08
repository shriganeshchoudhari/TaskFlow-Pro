# TaskFlow Pro — E2E Test Cases (Playwright)

**Tool:** Playwright 1.40+  
**Framework:** TypeScript  
**Test Location:** `tests/e2e/playwright/tests/`

---

## Table of Contents
1. [Test Setup](#1-test-setup)
2. [Auth Scenarios](#2-auth-scenarios)
3. [Project Scenarios](#3-project-scenarios)
4. [Task Scenarios](#4-task-scenarios)
5. [Comment & Notification Scenarios](#5-comment--notification-scenarios)
6. [Responsive & Accessibility Scenarios](#6-responsive--accessibility-scenarios)
7. [Page Object Models](#7-page-object-models)

---

## 1. Test Setup

### playwright.config.ts
```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html'], ['list']],
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'mobile',
      use: { ...devices['Pixel 5'] },
    },
  ],
});
```

### Global Test Fixtures (fixtures/auth.ts)
```typescript
import { test as base, Page } from '@playwright/test';

type AuthFixtures = {
  authenticatedPage: Page;
  managerPage: Page;
};

export const test = base.extend<AuthFixtures>({
  authenticatedPage: async ({ page }, use) => {
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'member@test.com');
    await page.fill('[data-testid="password-input"]', 'TestPass123!');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('/dashboard');
    await use(page);
  },
  managerPage: async ({ page }, use) => {
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'manager@test.com');
    await page.fill('[data-testid="password-input"]', 'TestPass123!');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('/dashboard');
    await use(page);
  },
});
```

---

## 2. Auth Scenarios

### TC-E2E-AUTH-001: Successful Login

```typescript
test('TC-E2E-AUTH-001: User can log in with valid credentials', async ({ page }) => {
  // Arrange
  await page.goto('/login');

  // Act
  await page.fill('[data-testid="email-input"]', 'jane@example.com');
  await page.fill('[data-testid="password-input"]', 'TestPass123!');
  await page.click('[data-testid="login-button"]');

  // Assert
  await expect(page).toHaveURL('/dashboard');
  await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
  await expect(page.locator('[data-testid="nav-bar"]')).toContainText('Jane Smith');
});
```

---

### TC-E2E-AUTH-002: Failed Login Shows Error

```typescript
test('TC-E2E-AUTH-002: Invalid credentials show error message', async ({ page }) => {
  await page.goto('/login');
  await page.fill('[data-testid="email-input"]', 'jane@example.com');
  await page.fill('[data-testid="password-input"]', 'wrongpassword');
  await page.click('[data-testid="login-button"]');

  await expect(page.locator('[data-testid="error-alert"]')).toBeVisible();
  await expect(page.locator('[data-testid="error-alert"]')).toContainText('Invalid email or password');
  await expect(page).toHaveURL('/login');
});
```

---

### TC-E2E-AUTH-003: Registration Flow

```typescript
test('TC-E2E-AUTH-003: New user can register an account', async ({ page }) => {
  const email = `test_${Date.now()}@example.com`;

  await page.goto('/register');
  await page.fill('[data-testid="fullname-input"]', 'New Test User');
  await page.fill('[data-testid="email-input"]', email);
  await page.fill('[data-testid="password-input"]', 'TestPass123!');
  await page.fill('[data-testid="confirm-password-input"]', 'TestPass123!');
  await page.check('[data-testid="terms-checkbox"]');
  await page.click('[data-testid="register-button"]');

  // After registration, redirected to login with success message
  await expect(page).toHaveURL('/login');
  await expect(page.locator('[data-testid="success-alert"]')).toContainText('Account created');
});
```

---

### TC-E2E-AUTH-004: Protected Route Redirect

```typescript
test('TC-E2E-AUTH-004: Unauthenticated user is redirected to login', async ({ page }) => {
  await page.goto('/dashboard');
  await expect(page).toHaveURL('/login');

  await page.goto('/projects');
  await expect(page).toHaveURL('/login');
});
```

---

### TC-E2E-AUTH-005: Logout Flow

```typescript
test('TC-E2E-AUTH-005: User can log out', async ({ authenticatedPage: page }) => {
  await page.click('[data-testid="user-menu"]');
  await page.click('[data-testid="logout-button"]');

  await expect(page).toHaveURL('/login');

  // Verify can't access protected route
  await page.goto('/dashboard');
  await expect(page).toHaveURL('/login');
});
```

---

## 3. Project Scenarios

### TC-E2E-PROJ-001: Create New Project

```typescript
test('TC-E2E-PROJ-001: Manager can create a new project', async ({ managerPage: page }) => {
  await page.goto('/projects');
  await page.click('[data-testid="new-project-button"]');

  // Fill project form
  await page.fill('[data-testid="project-name-input"]', 'E2E Test Project');
  await page.fill('[data-testid="project-description-input"]', 'Created by E2E test');
  await page.selectOption('[data-testid="visibility-select"]', 'PRIVATE');
  await page.click('[data-testid="submit-project-button"]');

  // Verify redirect to project detail
  await page.waitForURL(/\/projects\/[a-z0-9-]+$/);
  await expect(page.locator('[data-testid="project-title"]')).toContainText('E2E Test Project');
  await expect(page.locator('[data-testid="project-status-badge"]')).toContainText('ACTIVE');
});
```

---

### TC-E2E-PROJ-002: Project List — Filter by Status

```typescript
test('TC-E2E-PROJ-002: User can filter projects by status', async ({ authenticatedPage: page }) => {
  await page.goto('/projects');

  // Click Active filter
  await page.click('[data-testid="filter-chip-active"]');
  const projectCards = page.locator('[data-testid="project-card"]');
  const count = await projectCards.count();

  // All visible cards should have ACTIVE status
  for (let i = 0; i < count; i++) {
    await expect(projectCards.nth(i).locator('[data-testid="status-badge"]'))
      .toContainText('ACTIVE');
  }
});
```

---

### TC-E2E-PROJ-003: Add Member to Project

```typescript
test('TC-E2E-PROJ-003: Manager can add a member to a project', async ({ managerPage: page }) => {
  // Navigate to project
  await page.goto(`/projects/${testProjectId}`);
  await page.click('[data-testid="members-tab"]');
  await page.click('[data-testid="add-member-button"]');

  await page.fill('[data-testid="member-email-input"]', 'newmember@example.com');
  await page.selectOption('[data-testid="member-role-select"]', 'MEMBER');
  await page.click('[data-testid="confirm-add-member-button"]');

  await expect(page.locator('[data-testid="success-toast"]')).toBeVisible();
  await expect(page.locator('[data-testid="members-list"]')).toContainText('newmember@example.com');
});
```

---

### TC-E2E-PROJ-004: Archive Project

```typescript
test('TC-E2E-PROJ-004: Manager can archive a project', async ({ managerPage: page }) => {
  await page.goto(`/projects/${testProjectId}`);
  await page.click('[data-testid="project-menu-button"]');
  await page.click('[data-testid="archive-project-option"]');
  
  // Confirm dialog
  await page.click('[data-testid="confirm-dialog-ok"]');
  
  await expect(page.locator('[data-testid="project-status-badge"]')).toContainText('ARCHIVED');
});
```

---

## 4. Task Scenarios

### TC-E2E-TASK-001: Create Task

```typescript
test('TC-E2E-TASK-001: Member can create a task in a project', async ({ authenticatedPage: page }) => {
  await page.goto(`/projects/${testProjectId}`);
  await page.click('[data-testid="add-task-button"]');

  // Fill task form
  await page.fill('[data-testid="task-title-input"]', 'Build login page');
  await page.fill('[data-testid="task-description-input"]', 'Create the login page UI');
  await page.selectOption('[data-testid="priority-select"]', 'HIGH');
  await page.fill('[data-testid="due-date-input"]', '2025-12-31');

  // Assign to a member
  await page.click('[data-testid="assignee-select"]');
  await page.click('[data-testid="assignee-option-0"]');

  await page.click('[data-testid="submit-task-button"]');

  // Task appears in TODO column
  await expect(page.locator('[data-testid="column-todo"]'))
    .toContainText('Build login page');
});
```

---

### TC-E2E-TASK-002: Update Task Status

```typescript
test('TC-E2E-TASK-002: User can update task status via status dropdown', async ({ authenticatedPage: page }) => {
  await page.goto(`/tasks/${testTaskId}`);
  
  // Find status dropdown
  await page.click('[data-testid="task-status-dropdown"]');
  await page.click('[data-testid="status-option-IN_PROGRESS"]');

  await expect(page.locator('[data-testid="task-status-dropdown"]')).toContainText('IN_PROGRESS');
  
  // Verify activity feed updated
  await expect(page.locator('[data-testid="activity-feed"]'))
    .toContainText('changed status from TODO to IN_PROGRESS');
});
```

---

### TC-E2E-TASK-003: Assign Task to Different User

```typescript
test('TC-E2E-TASK-003: Manager can reassign a task', async ({ managerPage: page }) => {
  await page.goto(`/tasks/${testTaskId}`);
  
  await page.click('[data-testid="assignee-section"]');
  await page.click('[data-testid="change-assignee-button"]');
  await page.click('[data-testid="assignee-option-1"]'); // Select second member

  await expect(page.locator('[data-testid="success-toast"]')).toBeVisible();
  await expect(page.locator('[data-testid="assignee-section"]'))
    .toContainText('Member Two');
});
```

---

### TC-E2E-TASK-004: Filter Tasks on Board

```typescript
test('TC-E2E-TASK-004: User can filter tasks by priority', async ({ authenticatedPage: page }) => {
  await page.goto(`/projects/${testProjectId}`);

  // Open filter
  await page.click('[data-testid="filter-button"]');
  await page.click('[data-testid="priority-filter-HIGH"]');

  // Only HIGH priority tasks visible
  const taskCards = page.locator('[data-testid="task-card"]');
  const count = await taskCards.count();
  for (let i = 0; i < count; i++) {
    await expect(taskCards.nth(i).locator('[data-testid="priority-chip"]'))
      .toContainText('HIGH');
  }
});
```

---

### TC-E2E-TASK-005: Delete Task

```typescript
test('TC-E2E-TASK-005: Manager can delete a task', async ({ managerPage: page }) => {
  await page.goto(`/tasks/${taskToDeleteId}`);
  await page.click('[data-testid="task-menu-button"]');
  await page.click('[data-testid="delete-task-option"]');
  await page.click('[data-testid="confirm-dialog-ok"]');

  await expect(page).toHaveURL(`/projects/${testProjectId}`);
  await expect(page.locator('[data-testid="task-card"]').filter({
    hasText: 'Task To Delete'
  })).not.toBeVisible();
});
```

---

## 5. Comment & Notification Scenarios

### TC-E2E-CMT-001: Add and Edit Comment

```typescript
test('TC-E2E-CMT-001: User can add a comment to a task', async ({ authenticatedPage: page }) => {
  await page.goto(`/tasks/${testTaskId}`);
  
  // Add comment
  await page.fill('[data-testid="comment-input"]', 'This is my comment');
  await page.click('[data-testid="submit-comment-button"]');
  
  await expect(page.locator('[data-testid="comments-list"]'))
    .toContainText('This is my comment');
  
  // Edit own comment
  await page.hover('[data-testid="comment-item-0"]');
  await page.click('[data-testid="edit-comment-button-0"]');
  await page.fill('[data-testid="edit-comment-input"]', 'Updated comment text');
  await page.click('[data-testid="save-comment-button"]');
  
  await expect(page.locator('[data-testid="comment-item-0"]'))
    .toContainText('Updated comment text');
  await expect(page.locator('[data-testid="comment-item-0"]'))
    .toContainText('(edited)');
});
```

---

### TC-E2E-NOTIF-001: Receive Notification on Task Assignment

```typescript
test('TC-E2E-NOTIF-001: User receives notification when assigned to task', async ({ browser }) => {
  // Two user contexts
  const managerContext = await browser.newContext();
  const memberContext = await browser.newContext();
  
  const managerPage = await managerContext.newPage();
  const memberPage = await memberContext.newPage();

  // Login as manager and assign task
  await loginAs(managerPage, 'manager@test.com');
  await managerPage.goto(`/tasks/${testTaskId}`);
  await assignTaskToMember(managerPage, 'member@test.com');

  // Login as member and check notification
  await loginAs(memberPage, 'member@test.com');
  
  const notifBell = memberPage.locator('[data-testid="notification-bell"]');
  await expect(notifBell.locator('[data-testid="unread-badge"]')).toBeVisible();
  
  await notifBell.click();
  await expect(memberPage.locator('[data-testid="notification-dropdown"]'))
    .toContainText('assigned to');

  await managerContext.close();
  await memberContext.close();
});
```

---

### TC-E2E-NOTIF-002: Mark All Notifications as Read

```typescript
test('TC-E2E-NOTIF-002: User can mark all notifications as read', async ({ authenticatedPage: page }) => {
  await page.click('[data-testid="notification-bell"]');
  await page.click('[data-testid="mark-all-read-button"]');
  
  await expect(page.locator('[data-testid="unread-badge"]')).not.toBeVisible();
  await expect(page.locator('[data-testid="notification-item"][data-read="false"]')).toHaveCount(0);
});
```

---

## 6. Responsive & Accessibility Scenarios

### TC-E2E-RESP-001: Mobile Navigation

```typescript
test('TC-E2E-RESP-001: Mobile navigation drawer works correctly', async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 }, // iPhone 14
  });
  const page = await context.newPage();
  
  await loginAs(page, 'member@test.com');
  
  // Sidebar should be hidden on mobile
  await expect(page.locator('[data-testid="sidebar"]')).not.toBeVisible();
  
  // Hamburger menu should be visible
  await page.click('[data-testid="hamburger-menu"]');
  await expect(page.locator('[data-testid="mobile-drawer"]')).toBeVisible();
  await page.click('[data-testid="nav-projects"]');
  
  await expect(page).toHaveURL('/projects');
  await context.close();
});
```

---

### TC-E2E-A11Y-001: Keyboard Navigation on Login

```typescript
test('TC-E2E-A11Y-001: Login form is fully keyboard navigable', async ({ page }) => {
  await page.goto('/login');
  
  // Tab through form
  await page.keyboard.press('Tab'); // Focus email
  await page.keyboard.type('user@example.com');
  await page.keyboard.press('Tab'); // Focus password
  await page.keyboard.type('TestPass123!');
  await page.keyboard.press('Tab'); // Focus login button
  await page.keyboard.press('Enter'); // Submit

  await page.waitForURL('/dashboard');
  await expect(page).toHaveURL('/dashboard');
});
```

---

## 7. Page Object Models

### pages/LoginPage.ts

```typescript
import { Page, Locator } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly errorAlert: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.locator('[data-testid="email-input"]');
    this.passwordInput = page.locator('[data-testid="password-input"]');
    this.loginButton = page.locator('[data-testid="login-button"]');
    this.errorAlert = page.locator('[data-testid="error-alert"]');
  }

  async goto() {
    await this.page.goto('/login');
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }
}
```

### pages/ProjectPage.ts

```typescript
import { Page, Locator } from '@playwright/test';

export class ProjectPage {
  readonly page: Page;
  readonly projectTitle: Locator;
  readonly addTaskButton: Locator;
  readonly todoColumn: Locator;

  constructor(page: Page) {
    this.page = page;
    this.projectTitle = page.locator('[data-testid="project-title"]');
    this.addTaskButton = page.locator('[data-testid="add-task-button"]');
    this.todoColumn = page.locator('[data-testid="column-todo"]');
  }

  async goto(projectId: string) {
    await this.page.goto(`/projects/${projectId}`);
  }

  async createTask(title: string, priority: string = 'MEDIUM') {
    await this.addTaskButton.click();
    await this.page.fill('[data-testid="task-title-input"]', title);
    await this.page.selectOption('[data-testid="priority-select"]', priority);
    await this.page.click('[data-testid="submit-task-button"]');
  }
}
```
