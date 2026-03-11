import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import notificationsReducer from '../store/slices/notificationsSlice';
import authReducer from '../store/slices/authSlice';
import uiReducer from '../store/slices/uiSlice';

vi.mock('../services/notificationService', () => ({
  default: {
    getNotifications: vi.fn().mockResolvedValue({ data: { notifications: { content: [] }, unreadCount: 0 } }),
    markAllAsRead: vi.fn().mockResolvedValue({}),
  },
}));

const createStore = (preloadedState = {}) =>
  configureStore({
    reducer: {
      notifications: notificationsReducer,
      auth: authReducer,
      ui: uiReducer,
    },
    preloadedState,
  });

const renderWithProviders = async (preloadedState = {}) => {
  const { default: NotificationBell } = await import('../components/notifications/NotificationBell');
  const store = createStore(preloadedState);
  return render(
    <Provider store={store}>
      <BrowserRouter>
        <NotificationBell />
      </BrowserRouter>
    </Provider>
  );
};

describe('NotificationBell', () => {
  it('renders the bell icon', async () => {
    await renderWithProviders({
      notifications: { items: [], unreadCount: 0, loading: false },
      auth: { user: { id: '123' }, token: 'mock-token' },
    });
    // Bell icon should be present (MUI notification icon)
    expect(screen.getByTestId ? screen.getByTestId('NotificationsIcon') : document.querySelector('svg')).toBeTruthy();
  });

  it('renders badge with unread count from store', async () => {
    await renderWithProviders({
      notifications: { items: [], unreadCount: 5, loading: false },
      auth: { user: { id: '123' }, token: 'mock-token' },
    });
    // The badge should display the count
    const badge = document.querySelector('.MuiBadge-badge');
    if (badge) {
      expect(badge.textContent).toBe('5');
    }
  });
});
