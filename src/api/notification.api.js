import client from './client';

export const notificationApi = {
  getAll: (params) => client.get('/notifications', { params }),
  markAllRead: () => client.put('/notifications/read-all'),
  markRead: (id) => client.put(`/notifications/${id}/read`),
  delete: (id) => client.delete(`/notifications/${id}`),
};
