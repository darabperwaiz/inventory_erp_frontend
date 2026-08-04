import client from './client';

export const reportApi = {
  getDashboard: () => client.get('/reports/dashboard'),
  getPMDashboard: () => client.get('/reports/dashboard/pm'),
  getInventoryDashboard: () => client.get('/reports/dashboard/inventory'),
  getEngineerDashboard: () => client.get('/reports/dashboard/engineer'),
  getChartData: () => client.get('/reports/charts'),
  getCurrentStock: (params) => client.get('/reports/inventory/current-stock', { params }),
  getLowStock: () => client.get('/reports/inventory/low-stock'),
  getTransactions: (params) => client.get('/reports/inventory/transactions', { params }),
  getProjectUsage: (params) => client.get('/reports/projects/usage', { params }),
  getDailyTransactions: (params) => client.get('/reports/daily', { params }),
  getWeeklyTransactions: (params) => client.get('/reports/weekly', { params }),
  getMonthlyTransactions: (params) => client.get('/reports/monthly', { params }),
  getAdvancedInventory: (params) => client.get('/reports/advanced/inventory', { params }),
  getAdvancedProject: (params) => client.get('/reports/advanced/project', { params }),
  getAdvancedSupplier: (params) => client.get('/reports/advanced/supplier', { params }),
  getAdvancedCombined: (params) => client.get('/reports/advanced/combined', { params }),
};
