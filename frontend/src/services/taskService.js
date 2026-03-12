import api from './api';

// ─── projectService ───────────────────────────────────────────────────────────
export const projectService = {
  async getProjects(params = {}) {
    const response = await api.get('/projects', { params });
    return response.data;
  },

  async getProject(projectId) {
    const response = await api.get(`/projects/${projectId}`);
    return response.data;
  },

  async createProject(data) {
    const response = await api.post('/projects', data);
    return response.data;
  },

  async updateProject(projectId, data) {
    const response = await api.put(`/projects/${projectId}`, data);
    return response.data;
  },

  async deleteProject(projectId) {
    await api.delete(`/projects/${projectId}`);
  },

  async getProjectMembers(projectId) {
    const response = await api.get(`/projects/${projectId}/members`);
    return response.data;
  },

  async addProjectMember(projectId, data) {
    const response = await api.post(`/projects/${projectId}/members`, data);
    return response.data;
  },

  async getProjectActivities(projectId, params = {}) {
    const response = await api.get(`/projects/${projectId}/activities`, { params });
    return response.data;
  },
};

// ─── taskService ──────────────────────────────────────────────────────────────
export const taskService = {
  async getMyTasks(params = {}) {
    const response = await api.get('/tasks/my-tasks', { params });
    return response.data;
  },

  async getProjectTasks(projectId, params = {}) {
    const response = await api.get(`/projects/${projectId}/tasks`, { params });
    return response.data;
  },

  async getTask(taskId) {
    const response = await api.get(`/tasks/${taskId}`);
    return response.data;
  },

  async createTask(projectId, data) {
    const response = await api.post(`/projects/${projectId}/tasks`, data);
    return response.data;
  },

  async updateTask(taskId, data) {
    const response = await api.put(`/tasks/${taskId}`, data);
    return response.data;
  },

  async updateTaskStatus(taskId, status) {
    const response = await api.patch(`/tasks/${taskId}/status`, { status });
    return response.data;
  },

  async deleteTask(taskId) {
    await api.delete(`/tasks/${taskId}`);
  },

  async getTaskActivities(taskId, params = {}) {
    const response = await api.get(`/tasks/${taskId}/activities`, { params });
    return response.data;
  },

  async addSubtask(taskId, title) {
    const response = await api.post(`/tasks/${taskId}/subtasks`, { title });
    return response.data;
  },

  async toggleSubtask(subtaskId) {
    const response = await api.patch(`/subtasks/${subtaskId}/toggle`);
    return response.data;
  },

  async deleteSubtask(subtaskId) {
    await api.delete(`/subtasks/${subtaskId}`);
  },

  async logTime(taskId, hours) {
    const response = await api.post(`/tasks/${taskId}/time`, { hours });
    return response.data;
  },
};

// ─── commentService ───────────────────────────────────────────────────────────
export const commentService = {
  async getComments(taskId) {
    const response = await api.get(`/tasks/${taskId}/comments`);
    return response.data;
  },

  async createComment(taskId, content) {
    const response = await api.post(`/tasks/${taskId}/comments`, { content });
    return response.data;
  },

  async updateComment(commentId, content) {
    const response = await api.put(`/comments/${commentId}`, { content });
    return response.data;
  },

  async deleteComment(commentId) {
    await api.delete(`/comments/${commentId}`);
  },
};

// ─── attachmentService ────────────────────────────────────────────────────────
export const attachmentService = {
  async getAttachments(taskId) {
    const response = await api.get(`/tasks/${taskId}/attachments`);
    return response.data;
  },

  async uploadAttachment(taskId, file) {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post(`/tasks/${taskId}/attachments`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  async downloadAttachment(attachmentId) {
    const response = await api.get(`/attachments/${attachmentId}/download`, {
      responseType: 'blob', // Important for downloading binary files
    });
    return response.data;
  },

  async deleteAttachment(attachmentId) {
    await api.delete(`/attachments/${attachmentId}`);
  },
};

// ─── notificationService ──────────────────────────────────────────────────────
export const notificationService = {
  async getNotifications(params = {}) {
    const response = await api.get('/notifications', { params });
    return response.data;
  },

  async markAsRead(notificationId) {
    const response = await api.patch(`/notifications/${notificationId}/read`);
    return response.data;
  },

  async markAllAsRead() {
    await api.patch('/notifications/read-all');
  },
};
