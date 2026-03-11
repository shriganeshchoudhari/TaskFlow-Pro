import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import tasksReducer from '../store/slices/tasksSlice';
import uiReducer from '../store/slices/uiSlice';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => vi.fn() };
});

const createStore = (preloadedState = {}) =>
  configureStore({
    reducer: {
      tasks: tasksReducer,
      ui: uiReducer,
    },
    preloadedState,
  });

const renderWithProviders = async (props, preloadedState = {}) => {
  const { default: BoardView } = await import('../components/tasks/BoardView');
  const store = createStore(preloadedState);
  return render(
    <Provider store={store}>
      <BrowserRouter>
        <BoardView {...props} />
      </BrowserRouter>
    </Provider>
  );
};

describe('BoardView', () => {
  const mockTasks = [
    { id: '1', title: 'Todo Task', status: 'TODO', priority: 'LOW', tags: [] },
    { id: '2', title: 'In Progress Task', status: 'IN_PROGRESS', priority: 'MEDIUM', tags: [] },
    { id: '3', title: 'Review Task', status: 'REVIEW', priority: 'HIGH', tags: [] },
    { id: '4', title: 'Done Task', status: 'DONE', priority: 'LOW', tags: [] },
  ];

  it('renders all 4 status columns', async () => {
    await renderWithProviders({ tasks: mockTasks });
    expect(screen.getByText(/todo/i)).toBeInTheDocument();
    expect(screen.getByText(/in.progress/i)).toBeInTheDocument();
    expect(screen.getByText(/review/i)).toBeInTheDocument();
    expect(screen.getByText(/done/i)).toBeInTheDocument();
  });

  it('renders task titles within columns', async () => {
    await renderWithProviders({ tasks: mockTasks });
    expect(screen.getByText('Todo Task')).toBeInTheDocument();
    expect(screen.getByText('Done Task')).toBeInTheDocument();
  });
});
