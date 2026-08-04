import client from './client';

export const exportApi = {
  stock: (format) => client.get(`/reports/export/stock/${format}`, { responseType: 'blob' }),
  transactions: (format, params) => client.get(`/reports/export/transactions/${format}`, { params, responseType: 'blob' }),
  usage: (format) => client.get(`/reports/export/usage/${format}`, { responseType: 'blob' }),
  charts: () => client.get('/reports/charts'),
  advancedReport: (format, type, params) => client.get(`/reports/export/advanced/${format}/${type}`, { params, responseType: 'blob' }),
};

export const downloadBlob = (response, filename) => {
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};
