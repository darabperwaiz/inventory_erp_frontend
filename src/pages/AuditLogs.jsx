import { useState, useEffect } from 'react';
import { ScrollText } from 'lucide-react';
import { auditApi } from '../api/audit.api';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

export default function AuditLogs() {
  const { t } = useTranslation();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [actionFilter, setActionFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('');

  useEffect(() => {
    let cancelled = false;
    const fetchLogs = async () => {
      try {
        setLoading(true);
        const params = { page, limit: 20 };
        if (actionFilter) params.action = actionFilter;
        if (entityFilter) params.entity = entityFilter;
        const { data } = await auditApi.getAll(params);
        if (!cancelled) {
          setLogs(data.data);
          setPagination(data.pagination);
        }
      } catch {
        if (!cancelled) toast.error('Failed to load audit logs');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchLogs();
    return () => { cancelled = true; };
  }, [page, actionFilter, entityFilter]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">{t('audit.title')}</h2>
        <p className="text-slate-500 text-sm mt-1">{t('audit.subtitle')}</p>
      </div>

      <div className="flex gap-3">
        <input
          type="text"
          placeholder={t('audit.searchLogs')}
          value={actionFilter}
          onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />
        <select
          value={entityFilter}
          onChange={(e) => { setEntityFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
        >
          <option value="">All Entities</option>
          <option value="User">{t('audit.user')}</option>
          <option value="Material">Material</option>
          <option value="Project">Project</option>
        </select>
      </div>

      <div className="bg-white rounded-xl border border-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left px-4 py-3 font-medium text-slate-600">Date</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">{t('audit.user')}</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">{t('audit.action')}</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">{t('audit.entity')}</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">{t('audit.details')}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5" className="text-center py-8 text-slate-400">Loading...</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan="5" className="text-center py-8 text-slate-400">No audit logs</td></tr>
              ) : (
                logs.map((log) => (
                  <tr key={log._id} className="border-b border-slate-100">
                    <td className="px-4 py-3 text-xs">{new Date(log.createdAt).toLocaleString()}</td>
                    <td className="px-4 py-3">{log.user?.name || 'System'}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{log.entity}</td>
                    <td className="px-4 py-3 text-xs text-slate-500 max-w-xs truncate">
                      {log.previousValue && 'Previous data available'}
                      {log.newValue && !log.previousValue && 'Created'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {pagination.pages > 1 && (
          <div className="p-4 border-t border-slate-200 flex items-center justify-between">
            <span className="text-sm text-slate-500">
              Page {pagination.page} of {pagination.pages} ({pagination.total} total)
            </span>
            <div className="flex gap-1">
              {Array.from({ length: Math.min(pagination.pages, 5) }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`px-3 py-1 rounded text-sm ${
                    p === page ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
