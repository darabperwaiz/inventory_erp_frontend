import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, Package, AlertTriangle } from 'lucide-react';
import { approvalApi } from '../api/approval.api';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

export default function Approvals() {
  const { t } = useTranslation();
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rejectModal, setRejectModal] = useState(null);

  const fetchPending = async () => {
    try {
      const { data } = await approvalApi.getPending();
      setPending(data.data);
    } catch {
      toast.error('Failed to load approvals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPending(); }, []);

  const handleApprove = async (id) => {
    try {
      await approvalApi.approve(id);
      toast.success('Approved & material assigned');
      fetchPending();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const handleReject = async (id, reason) => {
    try {
      await approvalApi.reject(id, reason);
      toast.success('Rejected');
      setRejectModal(null);
      fetchPending();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const urgencyKeys = { low: 'approvals.low', medium: 'approvals.medium', high: 'approvals.high' };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">{t('approvals.title')}</h2>
        <p className="text-slate-500 text-sm mt-1">{t('approvals.pendingApprovals')}</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left px-4 py-3 font-medium text-slate-600">Date</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">{t('approvals.project')}</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">{t('approvals.material')}</th>
                <th className="text-right px-4 py-3 font-medium text-slate-600">Qty</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">{t('approvals.requestedBy')}</th>
                <th className="text-center px-4 py-3 font-medium text-slate-600">{t('approvals.urgency')}</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">{t('approvals.purpose')}</th>
                <th className="text-center px-4 py-3 font-medium text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="8" className="text-center py-8 text-slate-400">Loading...</td></tr>
              ) : pending.length === 0 ? (
                <tr><td colSpan="8" className="text-center py-8 text-slate-400">
                  <Clock size={32} className="mx-auto mb-2 text-slate-300" />
                  {t('approvals.noPending')}
                </td></tr>
              ) : (
                pending.map((r) => (
                  <tr key={r._id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3 text-xs">{new Date(r.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3 font-medium text-slate-800">{r.project?.name}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Package size={14} className="text-slate-400" />
                        <span>{r.material?.name}</span>
                        <span className="text-xs text-slate-400">({r.material?.materialCode})</span>
                      </div>
                      {r.material?.availableQuantity < r.quantity && (
                        <div className="flex items-center gap-1 text-xs text-red-500 mt-0.5">
                          <AlertTriangle size={10} /> {t('approvals.stockWarning')} {r.material?.availableQuantity}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-medium">{r.quantity} {r.material?.unit}</td>
                    <td className="px-4 py-3 text-slate-600">{r.requestedBy?.name}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${urgencyColors[r.urgency]}`}>
                        {t(urgencyKeys[r.urgency] || r.urgency)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500 max-w-[150px] truncate">{r.purpose || '-'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => handleApprove(r._id)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-medium hover:bg-emerald-200">
                          <CheckCircle size={14} /> {t('approvals.approve')}
                        </button>
                        <button onClick={() => setRejectModal(r)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-xs font-medium hover:bg-red-200">
                          <XCircle size={14} /> {t('approvals.reject')}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {rejectModal && (
        <RejectModal
          request={rejectModal}
          onClose={() => setRejectModal(null)}
          onReject={handleReject}
        />
      )}
    </div>
  );
}

const urgencyColors = { low: 'bg-slate-100 text-slate-600', medium: 'bg-amber-100 text-amber-700', high: 'bg-red-100 text-red-700' };

function RejectModal({ request, onClose, onReject }) {
  const { t } = useTranslation();
  const [reason, setReason] = useState('');

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="px-5 py-3 border-b border-slate-200">
          <h3 className="text-lg font-semibold">{t('approvals.rejectRequest')}</h3>
        </div>
        <div className="p-5 space-y-4">
          <div className="bg-slate-50 rounded-lg p-3 text-sm">
            <div className="font-medium">{request.material?.name} — {request.quantity} {request.material?.unit}</div>
            <div className="text-slate-500 text-xs">For {request.project?.name} by {request.requestedBy?.name}</div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t('approvals.rejectionReason')} *</label>
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="Enter reason..." />
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={onClose} className="px-4 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg text-sm">Cancel</button>
            <button onClick={() => onReject(request._id, reason)} disabled={!reason}
              className="px-4 py-1.5 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 disabled:opacity-50">
              {t('approvals.reject')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
