import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, X, Trash2, Mail, Phone, MapPin, StickyNote } from 'lucide-react';
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
  const [showAdd, setShowAdd] = useState(false);

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

  const handleRemove = async (material) => {
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
          {supplier.companyName && (
            <div className="text-sm text-slate-700">
              <span className="text-slate-400 text-xs">{t('suppliers.companyName')}</span>
              <div className="font-medium">{supplier.companyName}</div>
            </div>
          )}
          {supplier.contactPerson && (
            <div className="text-sm text-slate-700">
              <span className="text-slate-400 text-xs">{t('suppliers.contactPerson')}</span>
              <div className="font-medium">{supplier.contactPerson}</div>
            </div>
          )}
          {supplier.phone && (
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Phone size={14} className="text-slate-400" /> {supplier.phone}
            </div>
          )}
          {supplier.email && (
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Mail size={14} className="text-slate-400" /> {supplier.email}
            </div>
          )}
          {supplier.address && (
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <MapPin size={14} className="text-slate-400" /> {supplier.address}{supplier.city ? `, ${supplier.city}` : ''}{supplier.country ? `, ${supplier.country}` : ''}
            </div>
          )}
          {supplier.gstVatNumber && (
            <div className="text-sm text-slate-700">
              <span className="text-slate-400 text-xs">{t('suppliers.gstVatNumber')}</span>
              <div className="font-medium">{supplier.gstVatNumber}</div>
            </div>
          )}
          {supplier.taxRegistrationNo && (
            <div className="text-sm text-slate-700">
              <span className="text-slate-400 text-xs">{t('suppliers.taxRegistrationNo')}</span>
              <div className="font-medium">{supplier.taxRegistrationNo}</div>
            </div>
          )}
          {supplier.paymentTerms && (
            <div className="text-sm text-slate-700">
              <span className="text-slate-400 text-xs">{t('suppliers.paymentTerms')}</span>
              <div className="font-medium">{supplier.paymentTerms}</div>
            </div>
          )}
          <div className="text-sm text-slate-700">
            <span className="text-slate-400 text-xs">{t('suppliers.currency')}</span>
            <div className="font-medium">{supplier.currency}</div>
          </div>
          <div className="text-sm text-slate-700">
            <span className="text-slate-400 text-xs">{t('suppliers.status')}</span>
            <div>
              <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                supplier.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
              }`}>
                {supplier.status === 'active' ? t('suppliers.active') : t('suppliers.inactive')}
              </span>
            </div>
          </div>
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
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
          >
            <Plus size={14} /> {t('suppliers.addMaterial')}
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
                        onClick={() => handleRemove(m)}
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

      {showAdd && (
        <AddMaterial
          supplierId={id}
          onClose={() => setShowAdd(false)}
          onSuccess={() => { setShowAdd(false); fetchData(); }}
        />
      )}
    </div>
  );
}

function AddMaterial({ supplierId, onClose, onSuccess }) {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    name: '',
    category: '',
    unit: '',
    brand: '',
    price: 0,
    tax: 0,
    minimumOrderQty: 1,
    description: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.category.trim() || !form.unit.trim()) {
      toast.error(t('suppliers.materialFieldsRequired'));
      return;
    }
    setLoading(true);
    try {
      await supplierApi.addMaterial(supplierId, {
        ...form,
        price: Number(form.price) || 0,
        tax: Number(form.tax) || 0,
        minimumOrderQty: Number(form.minimumOrderQty) || 1,
      });
      toast.success(t('suppliers.materialCreated'));
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || t('suppliers.saveError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl w-full max-w-full sm:max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10">
          <h3 className="text-lg font-semibold">{t('suppliers.addMaterial')}</h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t('suppliers.materialName')} *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t('suppliers.category')} *</label>
              <input
                type="text"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t('suppliers.unit')} *</label>
              <input
                type="text"
                value={form.unit}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
                placeholder="pcs, meters, kg"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t('suppliers.brand')}</label>
            <input
              type="text"
              value={form.brand}
              onChange={(e) => setForm({ ...form, brand: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t('suppliers.price')}</label>
              <input
                type="number"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t('suppliers.tax')} (%)</label>
              <input
                type="number"
                value={form.tax}
                onChange={(e) => setForm({ ...form, tax: e.target.value })}
                min="0"
                max="100"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t('suppliers.minOrderQty')}</label>
              <input
                type="number"
                value={form.minimumOrderQty}
                onChange={(e) => setForm({ ...form, minimumOrderQty: e.target.value })}
                min="1"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t('suppliers.description')}</label>
            <input
              type="text"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 mt-4 pt-3 border-t border-slate-100">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">
              {t('app.cancel')}
            </button>
            <button type="submit" disabled={loading} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {loading ? t('app.loading') : t('suppliers.addMaterial')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
