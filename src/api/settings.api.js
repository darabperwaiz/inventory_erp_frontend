import client from './client';

export const settingsApi = {
  getGeneral: () => client.get('/settings/general'),
  updateGeneral: (data) => client.put('/settings/general', data),
  getNotifications: () => client.get('/settings/notifications'),
  updateNotifications: (data) => client.put('/settings/notifications', data),
  getEmail: () => client.get('/settings/email'),
  updateEmail: (data) => client.put('/settings/email', data),
  testEmail: (email) => client.post('/settings/email/test', { email }),
};
