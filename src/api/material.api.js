import client from './client';

export const materialApi = {
  getAll: (params) => client.get('/materials', { params }),
  getById: (id) => client.get(`/materials/${id}`),
  create: (data) => client.post('/materials', data),
  update: (id, data) => client.put(`/materials/${id}`, data),
  delete: (id) => client.delete(`/materials/${id}`),
  bulkDelete: (ids) => client.post('/materials/bulk-delete', { ids }),
  receive: (data) => client.post('/materials/receive', data),
  getHistory: (id) => client.get(`/materials/${id}/history`),
  getLowStock: () => client.get('/materials/low-stock'),
  getCategories: () => client.get('/materials/categories'),
  uploadImage: (id, formData) => client.post(`/materials/${id}/image`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  removeImage: (id) => client.delete(`/materials/${id}/image`),
  getQR: (id) => client.get(`/materials/${id}/qr`),
  getBarcode: (id) => client.get(`/materials/${id}/barcode`),
  adjust: (data) => client.post('/materials/adjust', data),
  getReorderAlerts: () => client.get('/materials/reorder-alerts'),
  generateReorderRequests: () => client.post('/materials/reorder-alerts/generate'),
};
