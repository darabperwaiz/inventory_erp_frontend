import client, { API_BASE, getAccessToken } from './client';

export const fileApi = {
  upload: (formData, onProgress) => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${API_BASE}/api/files/upload`);
      xhr.withCredentials = true;
      const token = getAccessToken();
      if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable && onProgress) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      };
      xhr.onload = () => {
        try {
          const data = JSON.parse(xhr.responseText);
          if (xhr.status >= 200 && xhr.status < 300) resolve({ data });
          else reject({ response: { data, status: xhr.status } });
        } catch { reject({ response: { data: { message: 'Upload failed' } } }); }
      };
      xhr.onerror = () => reject({ response: { data: { message: 'Network error' } } });
      xhr.send(formData);
    });
  },
  getFiles: (params) => client.get('/files', { params }),
  download: (id) => `${API_BASE}/api/files/${id}/download`,
  preview: async (id) => {
    const token = getAccessToken();
    const res = await fetch(`${API_BASE}/api/files/${id}/preview`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    const blob = await res.blob();
    return URL.createObjectURL(blob);
  },
  delete: (id) => client.delete(`/files/${id}`),
};
