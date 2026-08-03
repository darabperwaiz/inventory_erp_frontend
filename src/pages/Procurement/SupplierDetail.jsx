import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, Plus, X, Trash2, Mail, Phone, MapPin, StickyNote } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supplierApi } from '../../api/supplier.api';
import { useConfirm } from '../../components/ConfirmModal';
import toast from 'react-hot-toast';

export default function SupplierDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const confirm = useConfirm();
  const [supplier, setSupplier] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAssign, setShowAssign] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [supplierRes, materialsRes] = await Promise.all([
        supplierApi.getById(id),
        supplierApi.getMaterials(id),
      ]);
      setSupplier(supplierRes.data.data);
      setMaterials(materialsRes.data.data);
    } catch (err) {
      toast.error(t('suppliers.loadError'));
      navigate('/procurement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [id]);

  const handleUnassign = async (material) => {
    const confirmed = await confirm({
      title: t('app.confirm'),
      message: `${t('suppliers.removeMaterial')} "${material.name}"?`,
      variant: 'warning',
    });
    if (!confirmed) return;

    try {
      await supplierApi.unassignMaterial(id, material._id);
      toast.success(t('suppliers.materialRemoved'));
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || t('suppliers.saveError'));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!supplier) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/procurement')} className="p-2 hover:bg-slate-100 rounded-lg">
          <ArrowLeft size={20} className="text-slate-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{supplier.name}</h1>
          <p className="text-sm text-slate-500">{supplier.supplierCode}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">{t('suppliers.details')}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {supplier.contactPerson && (
            <div className="flex items-center gap-2 text-sm text-slate-700">
              <span className="font-medium">{supplier.contactPerson}</span>
            </div>
          )}
          {supplier.email && (
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Mail size={14} className="text-slate-400" /> {supplier.email}
            </div>
          )}
          {supplier.phone && (
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Phone size={14} className="text-slate-400" /> {supplier.phone}
            </div>
          )}
          {supplier.address && (
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <MapPin size={14} className="text-slate-400" /> {supplier.address}
            </div>
          )}
          {supplier.notes && (
            <div className="flex items-start gap-2 text-sm text-slate-600 sm:col-span-2 lg:col-span-3">
              <StickyNote size={14} className="text-slate-400 mt-0.5" /> {supplier.notes}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between">
          <h2 className="font-semibold text-slate-800">{t('suppliers.linkedMaterials')} ({materials.length})</h2>
          <button
            onClick={() => setShowAssign(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
          >
            <Plus size={14} /> {t('suppliers.assignMaterial')}
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left px-5 py-3 font-medium text-slate-600">{t('suppliers.code')}</th>
                <th className="text-left px-5 py-3 font-medium text-slate-600">{t('suppliers.materialName')}</th>
                <th className="text-left px-5 py-3 font-medium text-slate-600">{t('suppliers.category')}</th>
                <th className="text-left px-5 py-3 font-medium text-slate-600">{t('suppliers.unit')}</th>
                <th className="text-right px-5 py-3 font-medium text-slate-600">{t('suppliers.availableQty')}</th>
                <th className="text-right px-5 py-3 font-medium text-slate-600 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {materials.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-slate-400">{t('suppliers.noMaterials')}</td>
                </tr>
              ) : (
                materials.map((m) => (
                  <tr key={m._id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-5 py-3 font-mono text-xs text-slate-500">{m.materialCode}</td>
                    <td className="px-5 py-3 font-medium text-slate-800">{m.name}</td>
                    <td className="px-5 py-3 text-slate-600">{m.category}</td>
                    <td className="px-5 py-3 text-slate-600">{m.unit}</td>
                    <td className="px-5 py-3 text-right font-medium text-slate-800">{m.availableQuantity}</td>
                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={() => handleUnassign(m)}
                        className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded"
                        title={t('suppliers.removeMaterial')}
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showAssign && (
        <AssignMaterial
          supplierId={id}
          onClose={() => setShowAssign(false)}
          onSuccess={() => { setShowAssign(false); fetchData(); }}
        />
      )}
    </div>
  );
}

function AssignMaterial({ supplierId, onClose, onSuccess }) {
  const { t } = useTranslation();
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(null);

  useEffect(() => {
    supplierApi.getUnassigned().then(({ data }) => {
      setMaterials(data.data || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleAssign = async (material) => {
    setAssigning(material._id);
    try {
      await supplierApi.assignMaterial(supplierId, material._id);
      toast.success(t('suppliers.materialAssigned'));
      setMaterials((prev) => prev.filter((m) => m._id !== material._id));
    } catch (err) {
      toast.error(err.response?.data?.message || t('suppliers.saveError'));
    } finally {
      setAssigning(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl w-full max-w-full sm:max-w-lg max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold">{t('suppliers.assignMaterial')}</h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded"><X size={18} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="text-center py-8 text-slate-400">{t('app.loading')}</div>
          ) : materials.length === 0 ? (
            <div className="text-center py-8 text-slate-400">{t('suppliers.allAssigned')}</div>
          ) : (
            <div className="space-y-2">
              {materials.map((m) => (
                <div key={m._id} className="flex items-center justify-between p-3 border border-slate-200 rounded-lg hover:bg-slate-50">
                  <div>
                    <div className="font-medium text-slate-800 text-sm">{m.name}</div>
                    <div className="text-xs text-slate-400">{m.materialCode} | {m.category} | {m.unit}</div>
                  </div>
                  <button
                    onClick={() => handleAssign(m)}
                    disabled={assigning === m._id}
                    className="px-3 py-1 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {assigning === m._id ? '...' : t('suppliers.assign')}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
