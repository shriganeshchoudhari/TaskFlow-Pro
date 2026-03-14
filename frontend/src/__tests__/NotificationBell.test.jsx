import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import notificationsReducer from '../store/slices/notificationsSlice';
import authReducer from '../store/slices/authSlice';
import uiReducer from '../store/slices/uiSlice';

// ── Module mocks (hoisted before every import) ────────────────────────────────

// 1. Mock the hook itself
vi.mock('../hooks/useWebSocket', () => ({
  default: () => ({ isConnected: false, subscribe: vi.fn() }),
  useWebSocket: () => ({ isConnected: false, subscribe: vi.fn() }),
}));

// 2. Mock underlying socket libraries — prevents the 5 000 ms reconnectDelay
//    hang even if the real hook code somehow runs.
vi.mock('sockjs-client', () => ({
  default: vi.fn(() => ({ close: vi.fn() })),
}));
vi.mock('@stomp/stompjs', () => ({
  Client: vi.fn(() => ({
    activate:          vi.fn(),
    deactivate:        vi.fn().mockResolvedValue(undefined),
    subscribe:         vi.fn(() => ({ unsubscribe: vi.fn() })),
    connected:         false,
    onConnect:         null,
    onStompError:      null,
    onWebSocketClose:  null,
  })),
}));

// 3. Mock the service layer so fetchNotifications thunk never makes a real
//    HTTP call.  The path resolves to src/services/taskService.js from both
//    this file and from notificationsSlice.js (../../services/taskService).
vi.mock('../services/taskService', () => ({
  notificationService: {
    getNotifications: vi.fn().mockResolvedValue({
      notifications: { content: [] },
      unreadCount: 0,
    }),
    markAsRead:    vi.fn().mockResolvedValue({}),
    markAllAsRead: vi.fn().mockResolvedValue({}),
  },
  // Keep other named exports as stubs so nothing else breaks
  projectService:    {},
  taskService:       {},
  commentService:    {},
  attachmentService: {},
}));

// ── Static import (resolved after mocks are hoisted) ─────────────────────────
import NotificationBell from '../components/notifications/NotificationBell';

// ── Helpers ───────────────────────────────────────────────────────────────────

const createStore = (preloadedState = {}) =>
  configureStore({
    reducer: { notifications: notificationsReducer, auth: authReducer, ui: uiReducer },
    preloadedState,
  });

const renderBell = (preloadedState = {}) => {
  const store = createStore(preloadedState);
  return render(
    <Provider store={store}>
      <BrowserRouter>
        <NotificationBell />
      </BrowserRouter>
    </Provider>
  );
};

afterEach(() => cleanup());

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('NotificationBell', () => {
  it('renders the bell icon', async () => {
    renderBell({
      auth:          { user: { id: '123' }, accessToken: 'mock-token', isAuthenticated: true,
                       refreshToken: null, loading: false, error: null },
      notifications: { items: [], unreadCount: 0, loading: false, error: null },
    });

    // The IconButton has aria-label="0 unread notifications".  waitFor handles
    // the async fetchNotifications effect that runs after initial render.
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /unread notifications/i })).toBeInTheDocument();
    });
  });

  it('renders badge with unread count from store', async () => {
    // Seed the mock to return unreadCount=5 for this render's fetch
    const { notificationService } = await import('../services/taskService');
    notificationService.getNotifications.mockResolvedValueOnce({
      notifications: { content: [] },
      unreadCount: 5,
    });

    renderBell({
      auth:          { user: { id: '123' }, accessToken: 'mock-token', isAuthenticated: true,
                       refreshToken: null, loading: false, error: null },
      // Preload unreadCount=5 so the badge shows before the thunk completes
      notifications: { items: [], unreadCount: 5, loading: false, error: null },
    });

    await waitFor(() => {
      const badge = document.querySelector('.MuiBadge-badge');
      expect(badge).not.toBeNull();
      expect(badge.textContent).toBe('5');
    });
  });
});
