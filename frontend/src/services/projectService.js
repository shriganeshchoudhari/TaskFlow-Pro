import api from './api';

const projectService = {
  getProjects: (params = {}) =>
    api.get('/projects', { params }).then((r) => r.data),

  getProject: (projectId) =>
    api.get(`/projects/${projectId}`).then((r) => r.data),

  createProject: (data) =>
    api.post('/projects', data).then((r) => r.data),

  updateProject: (projectId, data) =>
    api.put(`/projects/${projectId}`, data).then((r) => r.data),

  archiveProject: (projectId) =>
    api.delete(`/projects/${projectId}`).then((r) => r.data),

  getMembers: (projectId) =>
    api.get(`/projects/${projectId}/members`).then((r) => r.data),

  addMember: (projectId, data) =>
    api.post(`/projects/${projectId}/members`, data).then((r) => r.data),

  removeMember: (projectId, userId) =>
    api.delete(`/projects/${projectId}/members/${userId}`).then((r) => r.data),
};

export default projectService;
