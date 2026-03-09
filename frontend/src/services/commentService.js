import api from './api';

const commentService = {
  getComments: (taskId, params = {}) =>
    api.get(`/tasks/${taskId}/comments`, { params }).then((r) => r.data),

  addComment: (taskId, data) =>
    api.post(`/tasks/${taskId}/comments`, data).then((r) => r.data),

  editComment: (commentId, data) =>
    api.put(`/comments/${commentId}`, data).then((r) => r.data),

  deleteComment: (commentId) =>
    api.delete(`/comments/${commentId}`).then((r) => r.data),
};

export default commentService;
