import { create } from 'zustand';
import { authApi } from '../api/auth.api';
import { setAccessToken } from '../api/client';

const useAuthStore = create((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  initialize: async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      set({ isLoading: false });
      return;
    }
    try {
      const { data } = await authApi.refreshToken(refreshToken);
      setAccessToken(data.data.accessToken);
      localStorage.setItem('refreshToken', data.data.refreshToken);
      const me = await authApi.getMe();
      set({ user: me.data.data, isAuthenticated: true, isLoading: false });
    } catch {
      localStorage.removeItem('refreshToken');
      setAccessToken(null);
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  login: async (email, password) => {
    const { data } = await authApi.login(email, password);
    setAccessToken(data.data.accessToken);
    localStorage.setItem('refreshToken', data.data.refreshToken);
    set({ user: data.data.user, isAuthenticated: true });
    return data.data.user;
  },

  logout: async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignore error on logout
    }
    localStorage.removeItem('refreshToken');
    setAccessToken(null);
    set({ user: null, isAuthenticated: false });
  },
}));

export default useAuthStore;
