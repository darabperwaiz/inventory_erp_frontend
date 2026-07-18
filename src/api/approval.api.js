import client from './client';

export const approvalApi = {
  getPending: () => client.get('/material-requests/pending'),
  approve: (id) => client.put(`/material-requests/${id}/approve`),
  reject: (id, reason) => client.put(`/material-requests/${id}/reject`, { reason }),
  createRequest: (data) => client.post('/material-requests', data),
  getMyRequests: () => client.get('/material-requests/my'),
};
