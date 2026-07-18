import axios from 'axios';

const isElectron = window?.electron?.isElectron;
const baseURL = import.meta.env.VITE_API_URL || '/api';
const API_BASE = import.meta.env.VITE_API_URL || '';

const client = axios.create({
  baseURL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

let accessToken = null;

export const setAccessToken = (token) => {
  accessToken = token;
};

export { API_BASE };

client.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && error.response?.data?.tokenExpired && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshBaseURL = import.meta.env.VITE_API_URL || '/api';
        const { data } = await axios.post(`${refreshBaseURL}/auth/refresh`, {
          refreshToken: localStorage.getItem('refreshToken'),
        });
        setAccessToken(data.data.accessToken);
        localStorage.setItem('refreshToken', data.data.refreshToken);
        originalRequest.headers.Authorization = `Bearer ${data.data.accessToken}`;
        return client(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('refreshToken');
        setAccessToken(null);
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default client;
