import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../store/slices/authSlice';
import uiReducer from '../store/slices/uiSlice';

// Mock the auth service
vi.mock('../services/authService', () => ({
  default: {
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
  },
}));

// Lazy-import the page (it may have been defined as default export or named)
const createStore = (preloadedState = {}) =>
  configureStore({
    reducer: {
      auth: authReducer,
      ui: uiReducer,
    },
    preloadedState,
  });

// Helper to render with providers
const renderWithProviders = async (preloadedState = {}) => {
  // Dynamic import because LoginPage may use lazy loading
  const { default: LoginPage } = await import('../pages/LoginPage');
  const store = createStore(preloadedState);
  return render(
    <Provider store={store}>
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    </Provider>
  );
};

describe('LoginPage', () => {
  it('renders email and password fields', async () => {
    await renderWithProviders();
    // Use data-testid to target the specific inputs set in LoginPage.jsx
    expect(screen.getByTestId('email-input')).toBeInTheDocument();
    // getByLabelText(/password/i) matches both the input label AND the
    // 'toggle password visibility' aria-label — use testId instead
    expect(screen.getByTestId('password-input')).toBeInTheDocument();
  });

  it('renders a login button', async () => {
    await renderWithProviders();
    expect(screen.getByRole('button', { name: /sign in|log in|login/i })).toBeInTheDocument();
  });

  it('renders a link to registration page', async () => {
    await renderWithProviders();
    expect(screen.getByText(/sign up|register|create account/i)).toBeInTheDocument();
  });
});
