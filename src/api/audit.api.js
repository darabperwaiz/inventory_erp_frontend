import client from './client';

export const auditApi = {
  getAll: (params) => client.get('/audit-logs', { params }),
};
