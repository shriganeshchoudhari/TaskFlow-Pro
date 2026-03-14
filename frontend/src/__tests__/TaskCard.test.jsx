import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import tasksReducer from '../store/slices/tasksSlice';
import uiReducer from '../store/slices/uiSlice';
import TaskCard from '../components/tasks/TaskCard';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => vi.fn() };
});

const createStore = (preloadedState = {}) =>
  configureStore({
    reducer: { tasks: tasksReducer, ui: uiReducer },
    preloadedState,
  });

const renderWithProviders = (props, preloadedState = {}) => {
  const store = createStore(preloadedState);
  return render(
    <Provider store={store}>
      <BrowserRouter>
        <TaskCard {...props} />
      </BrowserRouter>
    </Provider>
  );
};

describe('TaskCard', () => {
  const mockTask = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    title: 'Test Task',
    priority: 'HIGH',
    status: 'TODO',
    dueDate: '2026-12-31',
    tags: ['frontend', 'urgent', 'bug'],
    assignee: { fullName: 'John Doe', avatarUrl: null },
  };

  it('renders the task title', () => {
    renderWithProviders({ task: mockTask });
    expect(screen.getByText('Test Task')).toBeInTheDocument();
  });

  it('renders the priority indicator', () => {
    renderWithProviders({ task: mockTask });
    // Priority is shown via a colored left border (data-priority attribute), not visible text
    const card = screen.getByTestId(`task-card-${mockTask.id}`);
    expect(card).toHaveAttribute('data-priority', 'HIGH');
  });

  it('renders tag chips', () => {
    renderWithProviders({ task: mockTask });
    expect(screen.getByText('frontend')).toBeInTheDocument();
    expect(screen.getByText('urgent')).toBeInTheDocument();
  });
});
