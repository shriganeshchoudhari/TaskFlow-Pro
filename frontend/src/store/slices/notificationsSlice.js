// notificationsSlice — Phase 4 placeholder
// Full implementation (polling, mark-read, dropdown) in Phase 4 (Week 7–8).
import { createSlice } from '@reduxjs/toolkit';

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState: {
    items: [],
    unreadCount: 0,
    loading: false,
    error: null,
  },
  reducers: {
    setUnreadCount: (state, action) => {
      state.unreadCount = action.payload;
    },
    // Phase 4 will add: fetchNotifications, markAsRead, markAllAsRead thunks
  },
});

export const { setUnreadCount } = notificationsSlice.actions;

export const selectNotifications = (state) => state.notifications.items;
export const selectUnreadCount   = (state) => state.notifications.unreadCount;

export default notificationsSlice.reducer;
