/**
 * Mock data layer for TaskFlow Pro frontend-modern.
 * Per react-components skill: all static text, image URLs, and lists
 * must be decoupled into this file rather than hardcoded in components.
 */

// ─── Navigation ───────────────────────────────────────────
export const NAV_ITEMS = [
  { to: '/dashboard', icon: 'dashboard', label: 'Dashboard' },
  { to: '/projects', icon: 'folder_open', label: 'Projects' },
  { to: '/tasks', icon: 'assignment', label: 'My Tasks' },
] as const;

export const BOTTOM_NAV_ITEMS = [
  { to: '/settings', icon: 'settings', label: 'Settings' },
] as const;

// ─── Current User ─────────────────────────────────────────
export const CURRENT_USER = {
  name: 'John Doe',
  email: 'john@company.com',
  initials: 'JD',
  role: 'Product Manager',
};

// ─── Dashboard Stats ──────────────────────────────────────
export const DASHBOARD_STATS = [
  { title: 'My Tasks',      value: '12', icon: 'assignment',          trend: '+3 this week', trendPositive: true },
  { title: 'Due Soon',      value: '4',  icon: 'schedule',            trend: 'Needs attention', trendPositive: false },
  { title: 'Projects',      value: '5',  icon: 'folder_open' },
  { title: 'Notifications', value: '2',  icon: 'notifications_active' },
] as const;

// ─── Active Tasks (Table) ─────────────────────────────────
export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';

export interface ActiveTask {
  readonly title: string;
  readonly project: string;
  readonly status: TaskStatus;
  readonly due: string;
  readonly overdue: boolean;
}

export const ACTIVE_TASKS: readonly ActiveTask[] = [
  { title: 'Review Q3 Marketing Strategy', project: 'Acme Rebrand', status: 'review',      due: 'Oct 12', overdue: true },
  { title: 'Update API Documentation',     project: 'Engineering',  status: 'in_progress', due: 'Oct 14', overdue: false },
  { title: 'Design System V2 Fixes',       project: 'Product',      status: 'todo',        due: 'Oct 18', overdue: false },
];

// ─── Recent Activity ──────────────────────────────────────
export interface ActivityEvent {
  readonly initials: string;
  readonly name: string;
  readonly action: string;
  readonly task: string;
  readonly extra: string;
  readonly time: string;
}

export const RECENT_ACTIVITY: readonly ActivityEvent[] = [
  { initials: 'SJ', name: 'Sarah Jenkins', action: 'moved',          task: 'API Documentation', extra: 'to Done',  time: '2 hours ago' },
  { initials: 'MC', name: 'Mike Chen',     action: 'commented on',   task: 'Q3 Marketing',     extra: '',         time: '5 hours ago' },
  { initials: 'AK', name: 'Amy Kim',       action: 'assigned you to',task: 'Design System V2', extra: '',         time: 'Yesterday' },
];

// ─── Kanban Board ─────────────────────────────────────────
export const KANBAN_COLUMNS = [
  { key: 'todo',        label: 'TO DO',        dot: '#757575', count: 2 },
  { key: 'in_progress', label: 'IN PROGRESS',  dot: '#1565C0', count: 1 },
  { key: 'review',      label: 'REVIEW',       dot: '#F57F17', count: 1 },
  { key: 'done',        label: 'DONE',         dot: '#2E7D32', count: 0 },
] as const;

export interface KanbanTask {
  readonly col: string;
  readonly priority: TaskPriority;
  readonly title: string;
  readonly description: string;
  readonly dueDate: string;
  readonly overdue?: boolean;
  readonly assigneeInitials: string;
}

export const KANBAN_TASKS: readonly KanbanTask[] = [
  {
    col: 'todo', priority: 'high', title: 'Design System V2 Fixes',
    description: 'Resolve accessibility contrast issues on the new primary buttons.',
    dueDate: 'Oct 18', overdue: false, assigneeInitials: 'JD',
  },
  {
    col: 'todo', priority: 'low', title: 'Onboarding Flow Documentation',
    description: 'Write user-facing guide for the new onboarding wizard.',
    dueDate: 'Oct 22', overdue: false, assigneeInitials: 'AK',
  },
  {
    col: 'in_progress', priority: 'critical', title: 'Update API Documentation',
    description: 'Document all v1 REST endpoints before the upcoming release.',
    dueDate: 'Oct 14', overdue: false, assigneeInitials: 'SJ',
  },
  {
    col: 'review', priority: 'medium', title: 'Review Q3 Marketing Strategy',
    description: 'Validate the budget allocations and ad spend model for Q3.',
    dueDate: 'Oct 12', overdue: true, assigneeInitials: 'MC',
  },
];

// ─── Auth ─────────────────────────────────────────────────
export const AUTH_COPY = {
  loginTitle: 'Welcome back',
  loginSubtitle: 'Enter your details to access your dashboard.',
  registerTitle: 'Create an account',
  registerSubtitle: 'Sign up to start managing your enterprise tasks.',
  copyright: '© 2025 TaskFlow Pro. Engineered for Precision.',
} as const;
