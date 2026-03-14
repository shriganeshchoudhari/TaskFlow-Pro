import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import tasksReducer from '../store/slices/tasksSlice';
import authReducer from '../store/slices/authSlice';
import uiReducer from '../store/slices/uiSlice';

// ── Module mocks (all hoisted before every import) ───────────────────────────

// 1. Mock the hook itself — primary guard
vi.mock('../hooks/useWebSocket', () => ({
  default: () => ({ isConnected: false, subscribe: vi.fn() }),
  useWebSocket: () => ({ isConnected: false, subscribe: vi.fn() }),
}));

// 2. Mock the underlying libraries — fallback guard so that even if the real
//    hook code somehow executes, it cannot open a live socket or block for
//    the 5 000 ms reconnectDelay.
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

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => vi.fn() };
});

// ── Static import (resolved after mocks are hoisted) ─────────────────────────
import BoardView from '../components/tasks/BoardView';

// ── Helpers ──────────────────────────────────────────────────────────────────

const mockTasks = [
  { id: '1', title: 'Todo Task',        status: 'TODO',        priority: 'LOW',    tags: [] },
  { id: '2', title: 'In Progress Task', status: 'IN_PROGRESS', priority: 'MEDIUM', tags: [] },
  { id: '3', title: 'Review Task',      status: 'REVIEW',      priority: 'HIGH',   tags: [] },
  { id: '4', title: 'Done Task',        status: 'DONE',        priority: 'LOW',    tags: [] },
];

const tasksPreloadedState = {
  byId: Object.fromEntries(mockTasks.map((t) => [t.id, t])),
  byStatus: {
    TODO:        [mockTasks[0]],
    IN_PROGRESS: [mockTasks[1]],
    REVIEW:      [mockTasks[2]],
    DONE:        [mockTasks[3]],
  },
  selectedTask:  null,
  myTasks:       [],
  totalElements: 4,
  loading:       false,
  error:         null,
};

const createStore = (preloadedState = {}) =>
  configureStore({
    reducer: { tasks: tasksReducer, auth: authReducer, ui: uiReducer },
    preloadedState,
  });

const renderBoard = (preloadedState = {}) => {
  const store = createStore(preloadedState);
  return render(
    <Provider store={store}>
      <BrowserRouter>
        <BoardView />
      </BrowserRouter>
    </Provider>
  );
};

// Explicit cleanup after each test so a failure/timeout can't leak DOM into
// the next test (which would cause "Found multiple elements" errors).
afterEach(() => cleanup());

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('BoardView', () => {
  it('renders all 4 status columns', () => {
    renderBoard({ tasks: tasksPreloadedState });
    expect(screen.getByText('To Do')).toBeInTheDocument();
    expect(screen.getByText('In Progress')).toBeInTheDocument();
    expect(screen.getByText('In Review')).toBeInTheDocument();
    expect(screen.getByText('Done')).toBeInTheDocument();
  });

  it('renders task titles within columns', () => {
    renderBoard({ tasks: tasksPreloadedState });
    expect(screen.getByText('Todo Task')).toBeInTheDocument();
    expect(screen.getByText('Done Task')).toBeInTheDocument();
  });
});
