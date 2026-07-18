import { useState, useEffect } from 'react';
import { AlertTriangle, RefreshCw, Package, ArrowRight, CheckCircle, XCircle } from 'lucide-react';
import { materialApi } from '../api/material.api';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

export default function ReorderAlerts() {
  const { t } = useTranslation();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const { data } = await materialApi.getReorderAlerts();
      setAlerts(data.data);
    } catch {
      toast.error('Failed to load alerts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAlerts(); }, []);

  const handleGenerate = async () => {
    try {
      setGenerating(true);
      const { data } = await materialApi.generateReorderRequests();
      toast.success(data.message);
      fetchAlerts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate');
    } finally {
      setGenerating(false);
    }
  };

  const totalShortage = alerts.reduce((s, a) => s + a.shortage, 0);
  const pendingCount = alerts.filter(a => a.hasPendingRequest).length;

  return (
    <div className="space-y-6 p-4 sm:p-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <AlertTriangle className="text-amber-500" size={24} /> {t('reorder.title')}
          </h2>
          <p className="text-slate-500 text-sm mt-1">{t('reorder.subtitle')}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={fetchAlerts} disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 text-sm disabled:opacity-50">
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          <button onClick={handleGenerate} disabled={generating || alerts.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm disabled:opacity-50">
            {generating ? 'Generating...' : t('reorder.generateRequests')}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="text-sm text-amber-600">{t('reorder.lowStockMaterials')}</div>
          <div className="text-2xl font-bold text-amber-700">{alerts.length}</div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="text-sm text-red-600">{t('reorder.totalShortage')}</div>
          <div className="text-2xl font-bold text-red-700">{totalShortage}</div>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 col-span-2 sm:col-span-1">
          <div className="text-sm text-blue-600">{t('reorder.pendingRequests')}</div>
          <div className="text-2xl font-bold text-blue-700">{pendingCount}</div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[500px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left px-4 py-3 font-medium text-slate-600">Material</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Category</th>
                <th className="text-right px-4 py-3 font-medium text-slate-600">Available</th>
                <th className="text-right px-4 py-3 font-medium text-slate-600">Minimum</th>
                <th className="text-right px-4 py-3 font-medium text-slate-600">{t('reorder.shortage')}</th>
                <th className="text-right px-4 py-3 font-medium text-slate-600">{t('reorder.reorderQty')}</th>
                <th className="text-center px-4 py-3 font-medium text-slate-600">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7" className="text-center py-8 text-slate-400">Loading...</td></tr>
              ) : alerts.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-12">
                    <CheckCircle size={32} className="mx-auto text-emerald-400 mb-2" />
                    <div className="text-slate-500">{t('reorder.allAboveMinimum')}</div>
                  </td>
                </tr>
              ) : (
                alerts.map((a) => (
                  <tr key={a.material._id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${a.available === 0 ? 'bg-red-500' : 'bg-amber-500'}`}></div>
                        <div>
                          <div className="font-medium text-slate-800">{a.material.name}</div>
                          <div className="text-xs text-slate-500 font-mono">{a.material.materialCode}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{a.material.category}</td>
                    <td className="px-4 py-3 text-right font-bold text-red-600">{a.available}</td>
                    <td className="px-4 py-3 text-right text-slate-600">{a.minimum}</td>
                    <td className="px-4 py-3 text-right font-bold text-red-600">{a.shortage}</td>
                    <td className="px-4 py-3 text-right font-medium text-blue-600">{a.reorderQuantity}</td>
                    <td className="px-4 py-3 text-center">
                      {a.hasPendingRequest ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                          <ArrowRight size={10} /> Pending
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
                          <XCircle size={10} /> {t('reorder.noRequest')}
                        </span>
                      )}
                    </td>
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
