import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { materialApi } from '../../api/material.api';
import toast from 'react-hot-toast';

const typeColors = {
  receive: 'bg-emerald-100 text-emerald-700',
  assign: 'bg-amber-100 text-amber-700',
  install: 'bg-blue-100 text-blue-700',
  return: 'bg-purple-100 text-purple-700',
  transfer: 'bg-cyan-100 text-cyan-700',
  adjustment: 'bg-slate-100 text-slate-700',
};

export default function MaterialHistory() {
  const { id } = useParams();
  const [material, setMaterial] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [matRes, histRes] = await Promise.all([
          materialApi.getById(id),
          materialApi.getHistory(id),
        ]);
        setMaterial(matRes.data.data);
        setHistory(histRes.data.data);
      } catch (err) {
        toast.error('Failed to load material history');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) return <div className="text-center py-8 text-slate-400">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/inventory" className="p-2 hover:bg-slate-100 rounded-lg">
          <ArrowLeft size={20} className="text-slate-600" />
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Material History</h2>
          {material && (
            <p className="text-slate-500 text-sm mt-1">
              {material.materialCode} — {material.name}
            </p>
          )}
        </div>
      </div>

      {material && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="text-xs text-slate-500">Available</div>
            <div className="text-2xl font-bold text-slate-800">{material.availableQuantity}</div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="text-xs text-slate-500">Assigned</div>
            <div className="text-2xl font-bold text-amber-600">{material.assignedQuantity}</div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="text-xs text-slate-500">Installed</div>
            <div className="text-2xl font-bold text-emerald-600">{material.installedQuantity}</div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="text-xs text-slate-500">Returned</div>
            <div className="text-2xl font-bold text-purple-600">{material.returnedQuantity}</div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="font-semibold text-slate-800 mb-4">Transaction Timeline</h3>
        {history.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-sm">No transactions yet</div>
        ) : (
          <div className="space-y-4">
            {history.map((txn) => (
              <div key={txn._id} className="flex gap-4 items-start">
                <div className="flex flex-col items-center">
                  <div className={`w-3 h-3 rounded-full ${
                    txn.type === 'receive' ? 'bg-emerald-500' :
                    txn.type === 'assign' ? 'bg-amber-500' :
                    txn.type === 'install' ? 'bg-blue-500' :
                    txn.type === 'return' ? 'bg-purple-500' :
                    'bg-cyan-500'
                  }`} />
                  <div className="w-px h-full bg-slate-200" />
                </div>
                <div className="flex-1 pb-4">
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${typeColors[txn.type]}`}>
                      {txn.type.toUpperCase()}
                    </span>
                    <span className="text-sm font-medium text-slate-800">{txn.quantity} units</span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    {new Date(txn.date || txn.createdAt).toLocaleString()}
                    {txn.user && ` — by ${txn.user.name}`}
                  </div>
                  {txn.remarks && <div className="text-xs text-slate-600 mt-1">{txn.remarks}</div>}
                  {txn.transactionId && (
                    <div className="text-xs text-slate-400 mt-0.5">Ref: {txn.transactionId}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
