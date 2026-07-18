import { useState, useEffect } from 'react';
import {
  FolderKanban,
  Package,
  AlertTriangle,
  Clock,
  ArrowRight,
  ClipboardCheck,
  Wrench,
  RotateCcw,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';
import { reportApi } from '../api/report.api';
import { materialApi } from '../api/material.api';
import { approvalApi } from '../api/approval.api';
import useAuthStore from '../store/authStore';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const COLORS = ['#10b981', '#f59e0b', '#3b82f6', '#8b5cf6', '#06b6d4', '#ef4444', '#ec4899'];

export default function Dashboard() {
  const { user } = useAuthStore();

  if (user?.role === 'project_manager') return <PMDashboard />;
  if (user?.role === 'inventory_manager') return <InventoryDashboard />;
  if (user?.role === 'site_engineer') return <EngineerDashboard />;
  if (user?.role === 'viewer') return <ViewerDashboard />;
  return <AdminDashboard />;
}

function AdminDashboard() {
  const { t } = useTranslation();
  const [stats, setStats] = useState(null);
  const [lowStock, setLowStock] = useState([]);
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      reportApi.getDashboard(),
      materialApi.getLowStock(),
      reportApi.getChartData(),
    ])
      .then(([dashRes, lowRes, chartRes]) => {
        setStats(dashRes.data.data);
        setLowStock(lowRes.data.data);
        setChartData(chartRes.data.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
    const handler = () => fetchData();
    window.addEventListener('app:refresh', handler);
    return () => window.removeEventListener('app:refresh', handler);
  }, []);

  if (loading) return <div className="text-center py-8 text-slate-400">{t('app.loading')}</div>;

  const cards = [
    { label: t('dashboard.totalProjects'), value: stats?.totalProjects || 0, icon: FolderKanban, color: 'bg-blue-600' },
    { label: t('dashboard.activeProjects'), value: stats?.activeProjects || 0, icon: Clock, color: 'bg-amber-500' },
    { label: t('dashboard.totalMaterials'), value: stats?.totalMaterials || 0, icon: Package, color: 'bg-emerald-600' },
    { label: t('dashboard.lowStockAlerts'), value: lowStock.length, icon: AlertTriangle, color: 'bg-red-500' },
  ];

  const typeColors = { receive: 'bg-emerald-100 text-emerald-700', assign: 'bg-amber-100 text-amber-700', install: 'bg-blue-100 text-blue-700', return: 'bg-purple-100 text-purple-700', transfer: 'bg-cyan-100 text-cyan-700' };

  return (
    <div className="space-y-6">
      <div><h2 className="text-2xl font-bold text-slate-800">{t('dashboard.adminTitle')}</h2><p className="text-slate-500 text-sm mt-1">{t('dashboard.adminOverview')}</p></div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <div key={card.label} className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between">
              <div><p className="text-sm text-slate-500">{card.label}</p><p className="text-3xl font-bold text-slate-800 mt-1">{card.value}</p></div>
              <div className={`w-12 h-12 ${card.color} rounded-xl flex items-center justify-center`}><card.icon className="text-white" size={22} /></div>
            </div>
          </div>
        ))}
      </div>
      {stats?.stockSummary && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4"><div className="text-xs text-slate-500">{t('dashboard.available')}</div><div className="text-2xl font-bold text-emerald-600 mt-1">{stats.stockSummary.totalAvailable}</div></div>
          <div className="bg-white rounded-xl border border-slate-200 p-4"><div className="text-xs text-slate-500">{t('dashboard.assigned')}</div><div className="text-2xl font-bold text-amber-600 mt-1">{stats.stockSummary.totalAssigned}</div></div>
          <div className="bg-white rounded-xl border border-slate-200 p-4"><div className="text-xs text-slate-500">{t('dashboard.installed')}</div><div className="text-2xl font-bold text-blue-600 mt-1">{stats.stockSummary.totalInstalled}</div></div>
          <div className="bg-white rounded-xl border border-slate-200 p-4"><div className="text-xs text-slate-500">{t('dashboard.returned')}</div><div className="text-2xl font-bold text-purple-600 mt-1">{stats.stockSummary.totalReturned}</div></div>
        </div>
      )}
      {chartData && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-800 mb-4">{t('dashboard.stockByCategory')}</h3>
            {chartData.stockByCategory?.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart><Pie data={chartData.stockByCategory.map(c => ({ name: c._id, value: c.totalAvailable }))} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>{chartData.stockByCategory.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip /></PieChart>
              </ResponsiveContainer>
            ) : <div className="text-center py-8 text-slate-400 text-sm">{t('app.noData')}</div>}
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-800 mb-4">{t('dashboard.projectStatus')}</h3>
            {chartData.projectStatus?.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={chartData.projectStatus.map(p => ({ name: p._id, count: p.count }))}><CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" /><XAxis dataKey="name" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} /><Tooltip /><Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} /></BarChart>
              </ResponsiveContainer>
            ) : <div className="text-center py-8 text-slate-400 text-sm">{t('app.noData')}</div>}
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-800 mb-4">{t('dashboard.monthlyTransactions')}</h3>
            {chartData.monthlyTransactions?.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={chartData.monthlyTransactions.map(t => ({ date: t._id.slice(5), count: t.count }))}><CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" /><XAxis dataKey="date" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 11 }} /><Tooltip /><Legend /><Line type="monotone" dataKey="count" stroke="#10b981" strokeWidth={2} name="Transactions" /></LineChart>
              </ResponsiveContainer>
            ) : <div className="text-center py-8 text-slate-400 text-sm">{t('app.noData')}</div>}
          </div>
        </div>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4"><h3 className="font-semibold text-slate-800">{t('dashboard.recentTransactions')}</h3><a href="/reports" className="text-blue-600 text-sm hover:underline flex items-center gap-1">{t('dashboard.viewAll')} <ArrowRight size={14} /></a></div>
          {stats?.recentTransactions?.length === 0 || !stats?.recentTransactions ? <div className="text-center py-8 text-slate-400 text-sm">{t('app.noData')}</div> : (
            <div className="space-y-3">{stats.recentTransactions.slice(0, 5).map((t) => (<div key={t._id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"><div className="flex items-center gap-3"><span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${typeColors[t.type]}`}>{t.type}</span><div><div className="text-sm font-medium text-slate-800">{t.material?.name}</div><div className="text-xs text-slate-500">{t.user?.name} — {new Date(t.createdAt).toLocaleDateString()}</div></div></div><div className="text-sm font-bold text-slate-800">{t.quantity}</div></div>))}</div>
          )}
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4"><h3 className="font-semibold text-slate-800">{t('dashboard.lowStockAlerts')}</h3><a href="/reports" className="text-blue-600 text-sm hover:underline flex items-center gap-1">{t('dashboard.viewAll')} <ArrowRight size={14} /></a></div>
          {lowStock.length === 0 ? <div className="text-center py-8 text-slate-400 text-sm">{t('app.noData')}</div> : (
            <div className="space-y-2">{lowStock.slice(0, 5).map((m) => (<div key={m._id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100"><div><div className="text-sm font-medium text-slate-800">{m.name}</div><div className="text-xs text-slate-500">{m.materialCode}</div></div><div className="text-right"><div className="text-sm font-bold text-red-600">{m.availableQuantity} left</div><div className="text-xs text-slate-500">Min: {m.minimumStock}</div></div></div>))}</div>
          )}
        </div>
      </div>
    </div>
  );
}

function PMDashboard() {
  const { t } = useTranslation();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = () => {
    setLoading(true);
    reportApi.getPMDashboard().then(({ data }) => setData(data.data)).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
    const handler = () => fetchData();
    window.addEventListener('app:refresh', handler);
    return () => window.removeEventListener('app:refresh', handler);
  }, []);

  if (loading) return <div className="text-center py-8 text-slate-400">{t('app.loading')}</div>;

  return (
    <div className="space-y-6">
      <div><h2 className="text-2xl font-bold text-slate-800">{t('dashboard.pmTitle')}</h2><p className="text-slate-500 text-sm mt-1">{t('dashboard.pmOverview')}</p></div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5"><p className="text-sm text-slate-500">{t('dashboard.myProjects')}</p><p className="text-3xl font-bold text-blue-600 mt-1">{data?.myProjects?.length || 0}</p></div>
        <div className="bg-white rounded-xl border border-slate-200 p-5"><p className="text-sm text-slate-500">{t('dashboard.pendingApprovals')}</p><p className="text-3xl font-bold text-amber-600 mt-1">{data?.pendingApprovals || 0}</p></div>
        <div className="bg-white rounded-xl border border-slate-200 p-5"><p className="text-sm text-slate-500">{t('dashboard.recentAssignments')}</p><p className="text-3xl font-bold text-emerald-600 mt-1">{data?.recentMaterials?.length || 0}</p></div>
      </div>
      {data?.pendingApprovals > 0 && (
        <Link to="/approvals" className="block bg-amber-50 border border-amber-200 rounded-xl p-4 hover:bg-amber-100 transition-colors">
          <div className="flex items-center gap-3"><ClipboardCheck size={20} className="text-amber-600" /><div><div className="font-medium text-amber-800">{data.pendingApprovals} {t('dashboard.pendingApprovalCount')}</div><div className="text-sm text-amber-600">{t('dashboard.clickToReview')}</div></div><ArrowRight size={16} className="text-amber-400 ml-auto" /></div>
        </Link>
      )}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="font-semibold text-slate-800 mb-4">{t('dashboard.myProjects')}</h3>
        {data?.myProjects?.length === 0 ? <div className="text-center py-6 text-slate-400 text-sm">{t('dashboard.noProjects')}</div> : (
          <div className="space-y-3">{data?.myProjects?.map((p) => (<div key={p._id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"><div><div className="font-medium text-slate-800">{p.name}</div><div className="text-xs text-slate-500">{p.projectId} — {p.clientName}</div></div><span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${p.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{p.status}</span></div>))}</div>
        )}
      </div>
    </div>
  );
}

function InventoryDashboard() {
  const { t } = useTranslation();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = () => {
    setLoading(true);
    reportApi.getInventoryDashboard().then(({ data }) => setData(data.data)).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
    const handler = () => fetchData();
    window.addEventListener('app:refresh', handler);
    return () => window.removeEventListener('app:refresh', handler);
  }, []);

  if (loading) return <div className="text-center py-8 text-slate-400">{t('app.loading')}</div>;

  return (
    <div className="space-y-6">
      <div><h2 className="text-2xl font-bold text-slate-800">{t('dashboard.inventoryTitle')}</h2><p className="text-slate-500 text-sm mt-1">{t('dashboard.inventoryOverview')}</p></div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5"><p className="text-sm text-slate-500">{t('dashboard.totalMaterials')}</p><p className="text-3xl font-bold text-blue-600 mt-1">{data?.totalMaterials || 0}</p></div>
        <div className="bg-white rounded-xl border border-slate-200 p-5"><p className="text-sm text-slate-500">{t('dashboard.totalStock')}</p><p className="text-3xl font-bold text-emerald-600 mt-1">{data?.totalStock || 0}</p></div>
        <div className="bg-white rounded-xl border border-slate-200 p-5"><p className="text-sm text-slate-500">{t('dashboard.lowStockItems')}</p><p className="text-3xl font-bold text-red-600 mt-1">{data?.lowStock?.length || 0}</p></div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-800 mb-4">{t('dashboard.lowStockAlerts')}</h3>
          {data?.lowStock?.length === 0 ? <div className="text-center py-6 text-slate-400 text-sm">{t('dashboard.allStockLevelsOK')}</div> : (
            <div className="space-y-2">{data?.lowStock?.map((m) => (<div key={m._id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100"><div><div className="font-medium text-slate-800">{m.name}</div><div className="text-xs text-slate-500">{m.materialCode}</div></div><div className="text-right"><div className="font-bold text-red-600">{m.availableQuantity} / {m.minimumStock}</div></div></div>))}</div>
          )}
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-800 mb-4">{t('dashboard.recentReceipts')}</h3>
          {data?.recentReceipts?.length === 0 ? <div className="text-center py-6 text-slate-400 text-sm">{t('dashboard.noRecentReceipts')}</div> : (
            <div className="space-y-2">{data?.recentReceipts?.map((t) => (<div key={t._id} className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg"><div><div className="font-medium text-slate-800">{t.material?.name}</div><div className="text-xs text-slate-500">{t.user?.name} — {new Date(t.createdAt).toLocaleDateString()}</div></div><div className="font-bold text-emerald-600">+{t.quantity}</div></div>))}</div>
          )}
        </div>
      </div>
    </div>
  );
}

function EngineerDashboard() {
  const { t } = useTranslation();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = () => {
    setLoading(true);
    reportApi.getEngineerDashboard().then(({ data }) => setData(data.data)).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
    const handler = () => fetchData();
    window.addEventListener('app:refresh', handler);
    return () => window.removeEventListener('app:refresh', handler);
  }, []);

  if (loading) return <div className="text-center py-8 text-slate-400">{t('app.loading')}</div>;

  const statusColors = { pending: 'bg-amber-100 text-amber-700', approved: 'bg-emerald-100 text-emerald-700', rejected: 'bg-red-100 text-red-700', assigned: 'bg-blue-100 text-blue-700' };

  return (
    <div className="space-y-6">
      <div><h2 className="text-2xl font-bold text-slate-800">{t('dashboard.engineerTitle')}</h2><p className="text-slate-500 text-sm mt-1">{t('dashboard.engineerOverview')}</p></div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5"><p className="text-sm text-slate-500">{t('dashboard.myAssignments')}</p><p className="text-3xl font-bold text-blue-600 mt-1">{data?.myAssignments?.length || 0}</p></div>
        <div className="bg-white rounded-xl border border-slate-200 p-5"><p className="text-sm text-slate-500">{t('dashboard.myRequests')}</p><p className="text-3xl font-bold text-amber-600 mt-1">{data?.myRequests?.length || 0}</p></div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-800 mb-4">{t('dashboard.myAssignments')}</h3>
          {data?.myAssignments?.length === 0 ? <div className="text-center py-6 text-slate-400 text-sm">{t('dashboard.noAssignments')}</div> : (
            <div className="space-y-3">{data?.myAssignments?.map((a) => (<div key={a._id} className="p-3 bg-slate-50 rounded-lg"><div className="font-medium text-slate-800">{a.material?.name}</div><div className="text-xs text-slate-500">{a.project?.name} — {a.assignedQuantity} {a.material?.unit}</div></div>))}</div>
          )}
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-800 mb-4">{t('dashboard.myRequests')}</h3>
          {data?.myRequests?.length === 0 ? <div className="text-center py-6 text-slate-400 text-sm">{t('dashboard.noRequests')}</div> : (
            <div className="space-y-3">{data?.myRequests?.map((r) => (<div key={r._id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"><div><div className="font-medium text-slate-800">{r.material?.name}</div><div className="text-xs text-slate-500">{r.project?.name} — {r.quantity} {r.material?.unit}</div></div><span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[r.status]}`}>{r.status}</span></div>))}</div>
          )}
        </div>
      </div>
    </div>
  );
}

function ViewerDashboard() {
  const { t } = useTranslation();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = () => {
    setLoading(true);
    reportApi.getDashboard().then(({ data }) => setStats(data.data)).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
    const handler = () => fetchData();
    window.addEventListener('app:refresh', handler);
    return () => window.removeEventListener('app:refresh', handler);
  }, []);

  if (loading) return <div className="text-center py-8 text-slate-400">{t('app.loading')}</div>;

  return (
    <div className="space-y-6">
      <div><h2 className="text-2xl font-bold text-slate-800">{t('dashboard.overview')}</h2><p className="text-slate-500 text-sm mt-1">{t('dashboard.viewerOverview')}</p></div>
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5"><p className="text-sm text-slate-500">{t('dashboard.projects')}</p><p className="text-3xl font-bold text-blue-600 mt-1">{stats?.totalProjects || 0}</p></div>
        <div className="bg-white rounded-xl border border-slate-200 p-5"><p className="text-sm text-slate-500">{t('dashboard.materials')}</p><p className="text-3xl font-bold text-emerald-600 mt-1">{stats?.totalMaterials || 0}</p></div>
        <div className="bg-white rounded-xl border border-slate-200 p-5"><p className="text-sm text-slate-500">{t('dashboard.availableStock')}</p><p className="text-3xl font-bold text-amber-600 mt-1">{stats?.stockSummary?.totalAvailable || 0}</p></div>
        <div className="bg-white rounded-xl border border-slate-200 p-5"><p className="text-sm text-slate-500">{t('dashboard.assignedStock')}</p><p className="text-3xl font-bold text-purple-600 mt-1">{stats?.stockSummary?.totalAssigned || 0}</p></div>
      </div>
    </div>
  );
}
