import { createSlice } from '@reduxjs/toolkit';

interface UiState {
  theme: 'dark' | 'light';
  isSidebarOpen: boolean;
}

const initialState: UiState = {
  theme: 'dark',
  isSidebarOpen: true,
};

export const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleTheme: (state) => {
      state.theme = state.theme === 'dark' ? 'light' : 'dark';
    },
    toggleSidebar: (state) => {
      state.isSidebarOpen = !state.isSidebarOpen;
    },
  },
});

export const { toggleTheme, toggleSidebar } = uiSlice.actions;
export default uiSlice.reducer;
