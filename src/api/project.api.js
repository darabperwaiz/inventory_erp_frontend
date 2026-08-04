import client from './client';

export const projectApi = {
  getAll: (params) => client.get('/projects', { params }),
  getById: (id) => client.get(`/projects/${id}`),
  create: (data) => client.post('/projects', data),
  update: (id, data) => client.put(`/projects/${id}`, data),
  delete: (id) => client.delete(`/projects/${id}`),
  getDashboard: (id) => client.get(`/projects/${id}/dashboard`),
  getMaterials: (id) => client.get(`/projects/${id}/materials`),
  getTimeline: (id) => client.get(`/projects/${id}/timeline`),
  getTransfers: (id) => client.get(`/projects/${id}/transfers`),
  assignMaterial: (data) => client.post('/projects/assign', data),
};
