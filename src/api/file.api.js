import client, { API_BASE } from './client';

export const fileApi = {
  upload: (formData) => client.post('/files/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  getFiles: (params) => client.get('/files', { params }),
  download: (id) => `${API_BASE}/api/files/${id}/download`,
  preview: (id) => `${API_BASE}/api/files/${id}/preview`,
  delete: (id) => client.delete(`/files/${id}`),
};
