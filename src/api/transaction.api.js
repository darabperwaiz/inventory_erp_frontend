import client from './client';

export const transactionApi = {
  getAll: (params) => client.get('/transactions', { params }),
  getInstallations: (params) => client.get('/transactions/installations', { params }),
  recordInstallation: (data) => client.post('/transactions/installations', data),
  getReturns: (params) => client.get('/transactions/returns', { params }),
  recordReturn: (data) => client.post('/transactions/returns', data),
  getTransfers: (params) => client.get('/transactions/transfers', { params }),
  recordTransfer: (data) => client.post('/transactions/transfers', data),
};
