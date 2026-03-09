import api from './api';

const notificationService = {
  getNotifications: (params = {}) =>
    api.get('/notifications', { params }).then((r) => r.data),

  markAsRead: (notificationId) =>
    api.patch(`/notifications/${notificationId}/read`).then((r) => r.data),

  markAllAsRead: () =>
    api.patch('/notifications/read-all').then((r) => r.data),
};

export default notificationService;
