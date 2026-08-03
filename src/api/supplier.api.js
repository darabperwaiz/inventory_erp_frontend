import client from './client';

export const supplierApi = {
  getAll: (params) => client.get('/suppliers', { params }),
  getById: (id) => client.get(`/suppliers/${id}`),
  create: (data) => client.post('/suppliers', data),
  update: (id, data) => client.put(`/suppliers/${id}`, data),
  delete: (id) => client.delete(`/suppliers/${id}`),
  getMaterials: (id) => client.get(`/suppliers/${id}/materials`),
  getAllDropdown: () => client.get('/suppliers/all'),
  assignMaterial: (id, materialId) => client.post(`/suppliers/${id}/materials`, { materialId }),
  unassignMaterial: (id, materialId) => client.delete(`/suppliers/${id}/materials/${materialId}`),
  getUnassigned: () => client.get('/suppliers/unassigned'),
};
