import axios from 'axios';
import type { InternalAxiosRequestConfig } from 'axios';

// Base API Configuration mapped to the Spring Boot backend
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor for attaching auth tokens to secure requests
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem('luminous_auth_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Generic service functions
export const authService = {
  login: (credentials: any) => api.post('/auth/login', credentials),
  register: (userData: any) => api.post('/auth/register', userData),
};

export const dashboardService = {
  getMetrics: () => api.get('/dashboard/metrics'),
};

export const taskService = {
  getTasks: () => api.get('/tasks'),
  createTask: (task: any) => api.post('/tasks', task),
  updateTaskState: (id: string, partial: any) => api.patch(`/tasks/${id}`, partial),
};
