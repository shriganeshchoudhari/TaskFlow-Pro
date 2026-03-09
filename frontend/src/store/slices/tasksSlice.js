// tasksSlice — Phase 3 placeholder
// Full implementation (board view, task CRUD, status transitions) in Phase 3 (Week 5–6).
import { createSlice } from '@reduxjs/toolkit';

const tasksSlice = createSlice({
  name: 'tasks',
  initialState: {
    byId: {},
    byStatus: { TODO: [], IN_PROGRESS: [], REVIEW: [], DONE: [] },
    selectedTask: null,
    loading: false,
    error: null,
  },
  reducers: {
    // Phase 3 will add async thunks for getTasks, createTask, updateTaskStatus, etc.
  },
});

export const selectTaskById     = (id)   => (state) => state.tasks.byId[id];
export const selectTasksByStatus = (status) => (state) => state.tasks.byStatus[status] || [];
export const selectTasksLoading  = (state) => state.tasks.loading;

export default tasksSlice.reducer;
