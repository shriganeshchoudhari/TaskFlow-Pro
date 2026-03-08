import api from './api';

// ─── authService ──────────────────────────────────────────────────────────────
const authService = {
  async login(credentials) {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  async register(userData) {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  async logout(refreshToken) {
    await api.post('/auth/logout', { refreshToken });
  },

  async refreshToken(refreshToken) {
    const response = await api.post('/auth/refresh', { refreshToken });
    return response.data;
  },

  async getMe() {
    const response = await api.get('/users/me');
    return response.data;
  },

  async updateProfile(data) {
    const response = await api.put('/users/me', data);
    return response.data;
  },

  async changePassword(data) {
    await api.put('/users/me/password', data);
  },
};

export default authService;
