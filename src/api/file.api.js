import client from './client';

export const fileApi = {
  upload: (formData) => client.post('/files/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  getFiles: (params) => client.get('/files', { params }),
  download: (id) => `/api/files/${id}/download`,
  delete: (id) => client.delete(`/files/${id}`),
};
