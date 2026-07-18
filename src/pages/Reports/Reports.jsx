import { useState, useEffect } from 'react';
import { Download, FileText, FileSpreadsheet } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';
import { reportApi } from '../../api/report.api';
import { exportApi, downloadBlob } from '../../api/export.api';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export default function Reports() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('inventory');

  const tabs = [
    { id: 'inventory', label: t('reports.inventoryReports') },
    { id: 'projects', label: t('reports.projectReports') },
    { id: 'transactions', label: t('reports.transactions') },
    { id: 'charts', label: t('reports.charts') },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">{t('reports.title')}</h2>
        <p className="text-slate-500 text-sm mt-1">View inventory and project reports</p>
      </div>

      <div className="flex gap-2 border-b border-slate-200">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
              activeTab === tab.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'inventory' && <InventoryReports />}
      {activeTab === 'projects' && <ProjectReports />}
      {activeTab === 'transactions' && <TransactionReports />}
      {activeTab === 'charts' && <ChartsReport />}
    </div>
  );
}

function ExportButtons({ onExportPDF, onExportExcel }) {
  const { t } = useTranslation();
  return (
    <div className="flex gap-2">
      <button onClick={onExportPDF} className="flex items-center gap-1 px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-xs hover:bg-red-200">
        <FileText size={14} /> {t('reports.exportPDF')}
      </button>
      <button onClick={onExportExcel} className="flex items-center gap-1 px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg text-xs hover:bg-emerald-200">
        <FileSpreadsheet size={14} /> {t('reports.exportExcel')}
      </button>
    </div>
  );
}

function InventoryReports() {
  const { t } = useTranslation();
  const [stock, setStock] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = () => {
      setLoading(true);
      Promise.all([reportApi.getCurrentStock(), reportApi.getLowStock()])
        .then(([stockRes, lowRes]) => { setStock(stockRes.data.data); setLowStock(lowRes.data.data); })
        .catch(() => toast.error('Failed to load reports'))
        .finally(() => setLoading(false));
    };
    fetchData();
    const handler = () => fetchData();
    window.addEventListener('app:refresh', handler);
    return () => window.removeEventListener('app:refresh', handler);
  }, []);

  const handleExport = async (format) => {
    try {
      const res = await exportApi.stock(format);
      downloadBlob(res, `current_stock.${format}`);
      toast.success(`Exported as ${format.toUpperCase()}`);
    } catch { toast.error('Export failed'); }
  };

  if (loading) return <div className="text-center py-8 text-slate-400">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-800">{t('reports.currentStock')}</h3>
          <ExportButtons onExportPDF={() => handleExport('pdf')} onExportExcel={() => handleExport('xlsx')} />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left px-4 py-3 font-medium text-slate-600">Code</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Name</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Category</th>
                <th className="text-right px-4 py-3 font-medium text-slate-600">Available</th>
                <th className="text-right px-4 py-3 font-medium text-slate-600">Assigned</th>
                <th className="text-right px-4 py-3 font-medium text-slate-600">Installed</th>
                <th className="text-right px-4 py-3 font-medium text-slate-600">Min Stock</th>
              </tr>
            </thead>
            <tbody>
              {stock.map((m) => (
                <tr key={m._id} className="border-b border-slate-100">
                  <td className="px-4 py-3 font-mono text-xs">{m.materialCode}</td>
                  <td className="px-4 py-3 font-medium">{m.name}</td>
                  <td className="px-4 py-3 text-slate-600">{m.category}</td>
                  <td className="px-4 py-3 text-right">{m.availableQuantity}</td>
                  <td className="px-4 py-3 text-right text-amber-600">{m.assignedQuantity}</td>
                  <td className="px-4 py-3 text-right text-emerald-600">{m.installedQuantity}</td>
                  <td className="px-4 py-3 text-right text-slate-500">{m.minimumStock}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {lowStock.length > 0 && (
        <div className="bg-white rounded-xl border border-red-200 p-6">
          <h3 className="font-semibold text-red-700 mb-4">{t('reports.lowStock')}</h3>
          <div className="space-y-2">
            {lowStock.map((m) => (
              <div key={m._id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <div>
                  <div className="font-medium text-sm">{m.name}</div>
                  <div className="text-xs text-slate-500">{m.materialCode}</div>
                </div>
                <div className="text-right">
                  <div className="text-red-600 font-bold">{m.availableQuantity}</div>
                  <div className="text-xs text-slate-500">Min: {m.minimumStock}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ProjectReports() {
  const { t } = useTranslation();
  const [usage, setUsage] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = () => {
      setLoading(true);
      reportApi.getProjectUsage().then(({ data }) => setUsage(data.data))
        .catch(() => toast.error('Failed'))
        .finally(() => setLoading(false));
    };
    fetchData();
    const handler = () => fetchData();
    window.addEventListener('app:refresh', handler);
    return () => window.removeEventListener('app:refresh', handler);
  }, []);

  const handleExport = async (format) => {
    try {
      const res = await exportApi.usage(format);
      downloadBlob(res, `project_usage.${format}`);
      toast.success(`Exported as ${format.toUpperCase()}`);
    } catch { toast.error('Export failed'); }
  };

  if (loading) return <div className="text-center py-8 text-slate-400">Loading...</div>;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-slate-800">{t('reports.projectUsage')}</h3>
        <ExportButtons onExportPDF={() => handleExport('pdf')} onExportExcel={() => handleExport('xlsx')} />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="text-left px-4 py-3 font-medium text-slate-600">Project</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Material</th>
              <th className="text-right px-4 py-3 font-medium text-slate-600">Assigned</th>
              <th className="text-right px-4 py-3 font-medium text-slate-600">Installed</th>
              <th className="text-right px-4 py-3 font-medium text-slate-600">Returned</th>
            </tr>
          </thead>
          <tbody>
            {usage.length === 0 ? (
              <tr><td colSpan="5" className="text-center py-8 text-slate-400">No data</td></tr>
            ) : (
              usage.map((u) => (
                <tr key={u._id} className="border-b border-slate-100">
                  <td className="px-4 py-3">{u.project?.name}</td>
                  <td className="px-4 py-3">{u.material?.name}</td>
                  <td className="px-4 py-3 text-right">{u.assignedQuantity}</td>
                  <td className="px-4 py-3 text-right text-emerald-600">{u.installedQuantity}</td>
                  <td className="px-4 py-3 text-right text-purple-600">{u.returnedQuantity}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TransactionReports() {
  const { t } = useTranslation();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ type: '', startDate: '', endDate: '' });

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const { data } = await reportApi.getTransactions(filters);
      setTransactions(data.data);
    } catch { toast.error('Failed'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchTransactions(); }, [filters]);

  useEffect(() => {
    const handler = () => fetchTransactions();
    window.addEventListener('app:refresh', handler);
    return () => window.removeEventListener('app:refresh', handler);
  }, [filters]);

  const handleExport = async (format) => {
    try {
      const res = await exportApi.transactions(format, filters);
      downloadBlob(res, `transactions.${format}`);
      toast.success(`Exported as ${format.toUpperCase()}`);
    } catch { toast.error('Export failed'); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-3">
          <select value={filters.type} onChange={(e) => setFilters({ ...filters, type: e.target.value })}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none">
            <option value="">All Types</option>
            <option value="receive">Receive</option>
            <option value="assign">Assign</option>
            <option value="install">Install</option>
            <option value="return">Return</option>
            <option value="transfer">Transfer</option>
          </select>
          <input type="date" value={filters.startDate} onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
          <input type="date" value={filters.endDate} onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
        </div>
        <ExportButtons onExportPDF={() => handleExport('pdf')} onExportExcel={() => handleExport('xlsx')} />
      </div>

      <div className="bg-white rounded-xl border border-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left px-4 py-3 font-medium text-slate-600">Date</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Type</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Material</th>
                <th className="text-right px-4 py-3 font-medium text-slate-600">Qty</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">User</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Remarks</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" className="text-center py-8 text-slate-400">Loading...</td></tr>
              ) : transactions.length === 0 ? (
                <tr><td colSpan="6" className="text-center py-8 text-slate-400">No transactions</td></tr>
              ) : (
                transactions.map((tr) => (
                  <tr key={tr._id} className="border-b border-slate-100">
                    <td className="px-4 py-3 text-xs">{new Date(tr.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                        tr.type === 'receive' ? 'bg-emerald-100 text-emerald-700' :
                        tr.type === 'assign' ? 'bg-amber-100 text-amber-700' :
                        tr.type === 'install' ? 'bg-blue-100 text-blue-700' :
                        tr.type === 'return' ? 'bg-purple-100 text-purple-700' :
                        'bg-cyan-100 text-cyan-700'
                      }`}>{tr.type}</span>
                    </td>
                    <td className="px-4 py-3">{tr.material?.name}</td>
                    <td className="px-4 py-3 text-right font-medium">{tr.quantity}</td>
                    <td className="px-4 py-3 text-slate-600">{tr.user?.name}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{tr.remarks}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ChartsReport() {
  const { t } = useTranslation();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    exportApi.charts()
      .then(({ data }) => setData(data.data))
      .catch(() => toast.error('Failed to load chart data'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-8 text-slate-400">Loading charts...</div>;
  if (!data) return <div className="text-center py-8 text-slate-400">No data available</div>;

  const typeData = data.transactionByType?.map(d => ({ name: d._id, count: d.count, quantity: d.totalQuantity })) || [];
  const categoryData = data.stockByCategory?.map(d => ({ name: d._id, available: d.totalAvailable, count: d.count })) || [];
  const statusData = data.projectStatus?.map(d => ({ name: d._id?.replace('_', ' '), value: d.count })) || [];
  const timeData = data.monthlyTransactions?.map(d => ({ date: d._id, transactions: d.count, quantity: d.totalQuantity })) || [];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-800 mb-4">Transactions by Type</h3>
          {typeData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={typeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="text-center py-8 text-slate-400 text-sm">No data</div>}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-800 mb-4">Stock by Category</h3>
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="available" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="text-center py-8 text-slate-400 text-sm">No data</div>}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-800 mb-4">Project Status</h3>
          {statusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : <div className="text-center py-8 text-slate-400 text-sm">No data</div>}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-800 mb-4">Daily Transactions (Last 30 Days)</h3>
          {timeData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={timeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="transactions" stroke="#2563eb" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : <div className="text-center py-8 text-slate-400 text-sm">No data</div>}
        </div>
      </div>
    </div>
  );
}
