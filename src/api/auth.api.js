import client from './client';

export const authApi = {
  login: (email, password) => client.post('/auth/login', { email, password }),
  refreshToken: (refreshToken) => client.post('/auth/refresh', { refreshToken }),
  logout: () => client.post('/auth/logout'),
  getMe: () => client.get('/auth/me'),
};
