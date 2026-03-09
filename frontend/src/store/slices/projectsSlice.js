import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import projectService from '../../services/projectService';

// ── Async Thunks ──────────────────────────────────────────────────────────────

export const fetchProjects = createAsyncThunk(
  'projects/fetchAll',
  async (params, { rejectWithValue }) => {
    try {
      return await projectService.getProjects(params);
    } catch (e) {
      return rejectWithValue(e.response?.data?.message || 'Failed to load projects');
    }
  }
);

export const fetchProject = createAsyncThunk(
  'projects/fetchOne',
  async (projectId, { rejectWithValue }) => {
    try {
      return await projectService.getProject(projectId);
    } catch (e) {
      return rejectWithValue(e.response?.data?.message || 'Failed to load project');
    }
  }
);

export const createProject = createAsyncThunk(
  'projects/create',
  async (data, { rejectWithValue }) => {
    try {
      return await projectService.createProject(data);
    } catch (e) {
      return rejectWithValue(e.response?.data?.message || 'Failed to create project');
    }
  }
);

export const updateProject = createAsyncThunk(
  'projects/update',
  async ({ projectId, data }, { rejectWithValue }) => {
    try {
      return await projectService.updateProject(projectId, data);
    } catch (e) {
      return rejectWithValue(e.response?.data?.message || 'Failed to update project');
    }
  }
);

export const archiveProject = createAsyncThunk(
  'projects/archive',
  async (projectId, { rejectWithValue }) => {
    try {
      await projectService.archiveProject(projectId);
      return projectId;
    } catch (e) {
      return rejectWithValue(e.response?.data?.message || 'Failed to archive project');
    }
  }
);

export const fetchMembers = createAsyncThunk(
  'projects/fetchMembers',
  async (projectId, { rejectWithValue }) => {
    try {
      const members = await projectService.getMembers(projectId);
      return { projectId, members };
    } catch (e) {
      return rejectWithValue(e.response?.data?.message || 'Failed to load members');
    }
  }
);

export const addMember = createAsyncThunk(
  'projects/addMember',
  async ({ projectId, data }, { rejectWithValue }) => {
    try {
      const member = await projectService.addMember(projectId, data);
      return { projectId, member };
    } catch (e) {
      return rejectWithValue(e.response?.data?.message || 'Failed to add member');
    }
  }
);

export const removeMember = createAsyncThunk(
  'projects/removeMember',
  async ({ projectId, userId }, { rejectWithValue }) => {
    try {
      await projectService.removeMember(projectId, userId);
      return { projectId, userId };
    } catch (e) {
      return rejectWithValue(e.response?.data?.message || 'Failed to remove member');
    }
  }
);

// ── Slice ─────────────────────────────────────────────────────────────────────

const projectsSlice = createSlice({
  name: 'projects',
  initialState: {
    items: [],
    selectedProject: null,
    members: {},        // { [projectId]: MemberResponse[] }
    totalElements: 0,
    loading: false,
    membersLoading: false,
    error: null,
  },
  reducers: {
    clearProjectError: (state) => { state.error = null; },
    clearSelectedProject: (state) => { state.selectedProject = null; },
  },
  extraReducers: (builder) => {
    // fetchProjects
    builder
      .addCase(fetchProjects.pending, (state) => {
        state.loading = true; state.error = null;
      })
      .addCase(fetchProjects.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.content ?? action.payload;
        state.totalElements = action.payload.totalElements ?? state.items.length;
      })
      .addCase(fetchProjects.rejected, (state, action) => {
        state.loading = false; state.error = action.payload;
      });

    // fetchProject
    builder
      .addCase(fetchProject.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchProject.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedProject = action.payload;
        const idx = state.items.findIndex((p) => p.id === action.payload.id);
        if (idx >= 0) state.items[idx] = action.payload;
        else state.items.unshift(action.payload);
      })
      .addCase(fetchProject.rejected, (state, action) => {
        state.loading = false; state.error = action.payload;
      });

    // createProject
    builder
      .addCase(createProject.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
        state.totalElements += 1;
      });

    // updateProject
    builder
      .addCase(updateProject.fulfilled, (state, action) => {
        const idx = state.items.findIndex((p) => p.id === action.payload.id);
        if (idx >= 0) state.items[idx] = action.payload;
        if (state.selectedProject?.id === action.payload.id)
          state.selectedProject = action.payload;
      });

    // archiveProject
    builder
      .addCase(archiveProject.fulfilled, (state, action) => {
        state.items = state.items.filter((p) => p.id !== action.payload);
        if (state.selectedProject?.id === action.payload)
          state.selectedProject = null;
      });

    // fetchMembers
    builder
      .addCase(fetchMembers.pending, (state) => { state.membersLoading = true; })
      .addCase(fetchMembers.fulfilled, (state, action) => {
        state.membersLoading = false;
        state.members[action.payload.projectId] = action.payload.members;
      })
      .addCase(fetchMembers.rejected, (state) => { state.membersLoading = false; });

    // addMember
    builder.addCase(addMember.fulfilled, (state, action) => {
      const { projectId, member } = action.payload;
      if (!state.members[projectId]) state.members[projectId] = [];
      state.members[projectId].push(member);
    });

    // removeMember
    builder.addCase(removeMember.fulfilled, (state, action) => {
      const { projectId, userId } = action.payload;
      if (state.members[projectId]) {
        state.members[projectId] = state.members[projectId].filter(
          (m) => m.userId !== userId
        );
      }
    });
  },
});

export const { clearProjectError, clearSelectedProject } = projectsSlice.actions;

// ── Selectors ─────────────────────────────────────────────────────────────────
export const selectProjects        = (state) => state.projects.items;
export const selectSelectedProject = (state) => state.projects.selectedProject;
export const selectProjectsLoading = (state) => state.projects.loading;
export const selectProjectsError   = (state) => state.projects.error;
export const selectProjectMembers  = (projectId) => (state) =>
  state.projects.members[projectId] || [];

export default projectsSlice.reducer;
