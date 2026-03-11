import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { taskService } from '../../services/taskService';

// ── Async Thunks ──────────────────────────────────────────────────────────────

export const fetchProjectTasks = createAsyncThunk(
  'tasks/fetchByProject',
  async ({ projectId, params }, { rejectWithValue }) => {
    try {
      return await taskService.getProjectTasks(projectId, params);
    } catch (e) {
      return rejectWithValue(e.response?.data?.message || 'Failed to load tasks');
    }
  }
);

export const fetchMyTasks = createAsyncThunk(
  'tasks/fetchMine',
  async (params, { rejectWithValue }) => {
    try {
      const res = await taskService.getMyTasks(params);
      return res;
    } catch (e) {
      return rejectWithValue(e.response?.data?.message || 'Failed to load my tasks');
    }
  }
);

export const fetchTask = createAsyncThunk(
  'tasks/fetchOne',
  async (taskId, { rejectWithValue }) => {
    try {
      return await taskService.getTask(taskId);
    } catch (e) {
      return rejectWithValue(e.response?.data?.message || 'Task not found');
    }
  }
);

export const createTask = createAsyncThunk(
  'tasks/create',
  async ({ projectId, data }, { rejectWithValue }) => {
    try {
      return await taskService.createTask(projectId, data);
    } catch (e) {
      return rejectWithValue(e.response?.data?.message || 'Failed to create task');
    }
  }
);

export const updateTask = createAsyncThunk(
  'tasks/update',
  async ({ taskId, data }, { rejectWithValue }) => {
    try {
      return await taskService.updateTask(taskId, data);
    } catch (e) {
      return rejectWithValue(e.response?.data?.message || 'Failed to update task');
    }
  }
);

export const updateTaskStatus = createAsyncThunk(
  'tasks/updateStatus',
  async ({ taskId, status, optimisticTask }, { rejectWithValue }) => {
    try {
      return await taskService.updateTaskStatus(taskId, status);
    } catch (e) {
      return rejectWithValue({ message: e.response?.data?.message || 'Invalid status transition', optimisticTask });
    }
  }
);

export const deleteTask = createAsyncThunk(
  'tasks/delete',
  async (taskId, { rejectWithValue }) => {
    try {
      await taskService.deleteTask(taskId);
      return taskId;
    } catch (e) {
      return rejectWithValue(e.response?.data?.message || 'Failed to delete task');
    }
  }
);

// ── Helpers ───────────────────────────────────────────────────────────────────

const STATUSES = ['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE'];

function groupByStatus(tasks) {
  const groups = { TODO: [], IN_PROGRESS: [], REVIEW: [], DONE: [] };
  tasks.forEach((t) => {
    if (groups[t.status]) groups[t.status].push(t);
  });
  return groups;
}

function upsertTask(state, task) {
  state.byId[task.id] = task;
  STATUSES.forEach((s) => {
    state.byStatus[s] = state.byStatus[s].filter((t) => t.id !== task.id);
  });
  if (state.byStatus[task.status]) state.byStatus[task.status].push(task);
}

function removeTask(state, taskId) {
  const existing = state.byId[taskId];
  delete state.byId[taskId];
  if (existing) {
    state.byStatus[existing.status] = state.byStatus[existing.status].filter(
      (t) => t.id !== taskId
    );
  }
}

// ── Slice ─────────────────────────────────────────────────────────────────────

const tasksSlice = createSlice({
  name: 'tasks',
  initialState: {
    byId: {},
    byStatus: { TODO: [], IN_PROGRESS: [], REVIEW: [], DONE: [] },
    selectedTask: null,
    myTasks: [],
    totalElements: 0,
    loading: false,
    error: null,
  },
  reducers: {
    clearTasksError: (state) => { state.error = null; },
    clearSelectedTask: (state) => { state.selectedTask = null; },
    // Optimistic update for status drag-and-drop
    optimisticStatusUpdate: (state, action) => {
      const { taskId, newStatus } = action.payload;
      const task = state.byId[taskId];
      if (task) {
        const oldStatus = task.status;
        task.status = newStatus;
        state.byStatus[oldStatus] = state.byStatus[oldStatus].filter((t) => t.id !== taskId);
        state.byStatus[newStatus].push(task);
      }
    },
    // Revert optimistic update on API failure
    revertStatusUpdate: (state, action) => {
      const task = action.payload;
      upsertTask(state, task);
    },
  },
  extraReducers: (builder) => {
    // fetchProjectTasks
    builder
      .addCase(fetchProjectTasks.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchProjectTasks.fulfilled, (state, action) => {
        state.loading = false;
        const tasks = action.payload.content ?? action.payload;
        tasks.forEach((t) => { state.byId[t.id] = t; });
        const groups = groupByStatus(tasks);
        STATUSES.forEach((s) => { state.byStatus[s] = groups[s]; });
        state.totalElements = action.payload.totalElements ?? tasks.length;
      })
      .addCase(fetchProjectTasks.rejected, (state, action) => {
        state.loading = false; state.error = action.payload;
      });

    // fetchMyTasks
    builder
      .addCase(fetchMyTasks.fulfilled, (state, action) => {
        state.myTasks = action.payload.content ?? action.payload;
      });

    // fetchTask
    builder
      .addCase(fetchTask.pending, (state) => { state.loading = true; })
      .addCase(fetchTask.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedTask = action.payload;
        state.byId[action.payload.id] = action.payload;
      })
      .addCase(fetchTask.rejected, (state, action) => {
        state.loading = false; state.error = action.payload;
      });

    // createTask
    builder.addCase(createTask.fulfilled, (state, action) => {
      upsertTask(state, action.payload);
      state.totalElements += 1;
    });

    // updateTask
    builder.addCase(updateTask.fulfilled, (state, action) => {
      upsertTask(state, action.payload);
      if (state.selectedTask?.id === action.payload.id)
        state.selectedTask = action.payload;
    });

    // updateTaskStatus
    builder
      .addCase(updateTaskStatus.fulfilled, (state, action) => {
        upsertTask(state, action.payload);
        if (state.selectedTask?.id === action.payload.id)
          state.selectedTask = action.payload;
      })
      .addCase(updateTaskStatus.rejected, (state, action) => {
        // Revert optimistic update
        if (action.payload?.optimisticTask) {
          upsertTask(state, action.payload.optimisticTask);
        }
        state.error = action.payload?.message || 'Status update failed';
      });

    // deleteTask
    builder.addCase(deleteTask.fulfilled, (state, action) => {
      removeTask(state, action.payload);
      if (state.selectedTask?.id === action.payload) state.selectedTask = null;
    });
  },
});

export const { clearTasksError, clearSelectedTask, optimisticStatusUpdate, revertStatusUpdate } =
  tasksSlice.actions;

// ── Selectors ─────────────────────────────────────────────────────────────────
export const selectAllTasks      = (state) => Object.values(state.tasks.byId);
export const selectTaskById      = (id) => (state) => state.tasks.byId[id];
export const selectTasksByStatus = (status) => (state) => state.tasks.byStatus[status] || [];
export const selectSelectedTask  = (state) => state.tasks.selectedTask;
export const selectMyTasks       = (state) => state.tasks.myTasks;
export const selectTasksLoading  = (state) => state.tasks.loading;
export const selectTasksError    = (state) => state.tasks.error;

export default tasksSlice.reducer;
