import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Truck, MoreVertical, Pencil, Trash2, X, Package, ChevronDown, ChevronUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import useAuthStore from '../../store/authStore';
import { supplierApi } from '../../api/supplier.api';
import { useConfirm } from '../../components/ConfirmModal';
import toast from 'react-hot-toast';

export default function SupplierList() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const confirm = useConfirm();
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ pages: 1, total: 0 });
  const [showForm, setShowForm] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [selected, setSelected] = useState([]);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
  const dropdownRef = useRef(null);
  const [expandedSupplier, setExpandedSupplier] = useState(null);
  const [supplierMaterials, setSupplierMaterials] = useState([]);
  const [loadingMaterials, setLoadingMaterials] = useState(false);

  const canManage = ['admin', 'inventory_manager'].includes(user?.role);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const { data } = await supplierApi.getAll({ page, limit: 10, search });
      const seen = new Set();
      setSuppliers((data.data || []).filter((s) => {
        if (seen.has(s._id)) return false;
        seen.add(s._id);
        return true;
      }));
      setPagination(data.pagination);
    } catch (err) {
      toast.error(t('suppliers.loadError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
    const handler = () => fetchSuppliers();
    window.addEventListener('app:refresh', handler);
    return () => window.removeEventListener('app:refresh', handler);
  }, [page, search]);

  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleDelete = async (supplier) => {
    const confirmed = await confirm({
      title: t('app.confirm'),
      message: `${t('app.delete')} "${supplier.name}"?`,
      variant: 'danger',
    });
    if (!confirmed) return;

    try {
      await supplierApi.delete(supplier._id);
      toast.success(t('suppliers.deleted'));
      setSelected(selected.filter((id) => id !== supplier._id));
      fetchSuppliers();
    } catch (err) {
      toast.error(err.response?.data?.message || t('suppliers.deleteError'));
    }
  };

  const handleBulkDelete = async () => {
    const confirmed = await confirm({
      title: t('app.confirm'),
      message: `${t('app.delete')} ${selected.length} ${t('suppliers.supplier')}?`,
      variant: 'danger',
    });
    if (!confirmed) return;

    try {
      for (const id of selected) {
        await supplierApi.delete(id);
      }
      toast.success(`${selected.length} ${t('suppliers.deleted')}`);
      setSelected([]);
      fetchSuppliers();
    } catch (err) {
      toast.error(err.response?.data?.message || t('suppliers.deleteError'));
    }
  };

  const toggleSelect = (id) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const toggleSelectAll = () => {
    if (selected.length === suppliers.length) {
      setSelected([]);
    } else {
      setSelected(suppliers.map((s) => s._id));
    }
  };

  const handleExpandMaterials = async (supplier) => {
    if (expandedSupplier === supplier._id) {
      setExpandedSupplier(null);
      setSupplierMaterials([]);
      return;
    }
    try {
      setLoadingMaterials(true);
      setExpandedSupplier(supplier._id);
      const { data } = await supplierApi.getMaterials(supplier._id);
      setSupplierMaterials(data.data);
    } catch (err) {
      toast.error(t('suppliers.loadMaterialsError'));
    } finally {
      setLoadingMaterials(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-slate-800">{t('suppliers.title')}</h1>
        {canManage && (
          <button
            onClick={() => { setEditingSupplier(null); setShowForm(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
          >
            <Plus size={16} /> {t('suppliers.addSupplier')}
          </button>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input
          type="text"
          placeholder={t('app.search')}
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {selected.length > 0 && canManage && (
        <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <span className="text-sm text-blue-700">{selected.length} {t('app.selected')}</span>
          <button
            onClick={handleBulkDelete}
            className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
          >
            {t('app.delete')}
          </button>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                {canManage && (
                  <th className="text-left px-4 py-3 w-10">
                    <input
                      type="checkbox"
                      checked={selected.length === suppliers.length && suppliers.length > 0}
                      onChange={toggleSelectAll}
                      className="rounded"
                    />
                  </th>
                )}
                <th className="text-left px-4 py-3 font-medium text-slate-600">{t('suppliers.code')}</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">{t('suppliers.name')}</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600 hidden md:table-cell">{t('suppliers.contactPerson')}</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600 hidden lg:table-cell">{t('suppliers.email')}</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600 hidden lg:table-cell">{t('suppliers.phone')}</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={canManage ? 7 : 6} className="text-center py-8 text-slate-400">{t('app.loading')}</td>
                </tr>
              ) : suppliers.length === 0 ? (
                <tr>
                  <td colSpan={canManage ? 7 : 6} className="text-center py-8 text-slate-400">{t('suppliers.noSuppliers')}</td>
                </tr>
              ) : (
                suppliers.map((s) => (
                  <tr
                    key={s._id}
                    onClick={() => navigate(`/procurement/${s._id}`)}
                    className={`border-b border-slate-100 hover:bg-slate-50 cursor-pointer ${selected.includes(s._id) ? 'bg-blue-50' : ''}`}
                  >
                    {canManage && (
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selected.includes(s._id)}
                          onChange={() => toggleSelect(s._id)}
                          onClick={(e) => e.stopPropagation()}
                          className="rounded"
                        />
                      </td>
                    )}
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">{s.supplierCode}</td>
                    <td className="px-4 py-3 font-medium text-slate-800">{s.name}</td>
                    <td className="px-4 py-3 text-slate-600 hidden md:table-cell">{s.contactPerson || '-'}</td>
                    <td className="px-4 py-3 text-slate-600 hidden lg:table-cell">{s.email || '-'}</td>
                    <td className="px-4 py-3 text-slate-600 hidden lg:table-cell">{s.phone || '-'}</td>
                    <td className="px-4 py-3">
                      <div className="relative" ref={dropdownRef}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const rect = e.currentTarget.getBoundingClientRect();
                            setDropdownPos({ top: rect.bottom + 4, left: rect.right - 192 });
                            setOpenDropdown(openDropdown === s._id ? null : s._id);
                          }}
                          className="p-1 hover:bg-slate-100 rounded"
                        >
                          <MoreVertical size={16} className="text-slate-400" />
                        </button>
                        {openDropdown === s._id && (
                          <div
                            className="fixed w-48 bg-white border border-slate-200 rounded-lg shadow-lg z-50"
                            style={{ top: dropdownPos.top, left: dropdownPos.left }}
                          >
                            <button
                              onClick={() => handleExpandMaterials(s)}
                              className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 flex items-center gap-2"
                            >
                              {expandedSupplier === s._id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                              {t('suppliers.viewMaterials')}
                            </button>
                            {canManage && (
                              <>
                                <button
                                  onClick={() => { setEditingSupplier(s); setShowForm(true); setOpenDropdown(null); }}
                                  className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 flex items-center gap-2"
                                >
                                  <Pencil size={14} /> {t('app.edit')}
                                </button>
                                <button
                                  onClick={() => { handleDelete(s); setOpenDropdown(null); }}
                                  className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 text-red-600 flex items-center gap-2"
                                >
                                  <Trash2 size={14} /> {t('app.delete')}
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
              {!loading && expandedSupplier && (
                <tr>
                  <td colSpan={canManage ? 7 : 6} className="px-4 py-3 bg-slate-50">
                    {loadingMaterials ? (
                      <p className="text-sm text-slate-400 text-center py-2">{t('app.loading')}</p>
                    ) : supplierMaterials.length === 0 ? (
                      <p className="text-sm text-slate-400 text-center py-2">{t('suppliers.noMaterials')}</p>
                    ) : (
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-slate-500 mb-2">{t('suppliers.linkedMaterials')}</p>
                        {supplierMaterials.map((m) => (
                          <div key={m._id} className="flex items-center gap-3 text-sm text-slate-700 px-2 py-1 bg-white rounded border border-slate-100">
                            <Package size={14} className="text-blue-500" />
                            <span className="font-mono text-xs text-slate-400">{m.materialCode}</span>
                            <span>{m.name}</span>
                            <span className="text-slate-400">|</span>
                            <span className="text-slate-500">{m.availableQuantity} {m.unit}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {pagination.pages > 1 && (
          <div className="p-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2">
            <span className="text-sm text-slate-500">
              {t('app.showing')} {suppliers.length} {t('app.of')} {pagination.total}
            </span>
            <div className="flex gap-1">
              {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((p) => (
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

      {showForm && (
        <SupplierForm
          supplier={editingSupplier}
          onClose={() => { setShowForm(false); setEditingSupplier(null); }}
          onSuccess={() => { setShowForm(false); setEditingSupplier(null); fetchSuppliers(); }}
        />
      )}
    </div>
  );
}

function SupplierForm({ supplier, onClose, onSuccess }) {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    name: supplier?.name || '',
    companyName: supplier?.companyName || '',
    contactPerson: supplier?.contactPerson || '',
    phone: supplier?.phone || '',
    email: supplier?.email || '',
    address: supplier?.address || '',
    city: supplier?.city || '',
    country: supplier?.country || '',
    gstVatNumber: supplier?.gstVatNumber || '',
    taxRegistrationNo: supplier?.taxRegistrationNo || '',
    paymentTerms: supplier?.paymentTerms || '',
    currency: supplier?.currency || 'USD',
    status: supplier?.status || 'active',
    notes: supplier?.notes || '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim()) {
      toast.error(t('suppliers.nameAndPhoneRequired'));
      return;
    }
    setLoading(true);
    try {
      if (supplier) {
        await supplierApi.update(supplier._id, form);
        toast.success(t('suppliers.updated'));
      } else {
        await supplierApi.create(form);
        toast.success(t('suppliers.created'));
      }
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || t('suppliers.saveError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl w-full max-w-full sm:max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="px-4 sm:px-5 py-3 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10">
          <h3 className="text-lg font-semibold">{supplier ? t('app.edit') : t('app.create')} {t('suppliers.supplier')}</h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">{t('suppliers.basicInfo')}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('suppliers.name')} *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('suppliers.companyName')}</label>
                <input
                  type="text"
                  value={form.companyName}
                  onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('suppliers.contactPerson')}</label>
                <input
                  type="text"
                  value={form.contactPerson}
                  onChange={(e) => setForm({ ...form, contactPerson: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('suppliers.phone')} *</label>
                <input
                  type="text"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('suppliers.email')}</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('suppliers.address')}</label>
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('suppliers.city')}</label>
                <input
                  type="text"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('suppliers.country')}</label>
                <input
                  type="text"
                  value={form.country}
                  onChange={(e) => setForm({ ...form, country: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">{t('suppliers.businessInfo')}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('suppliers.gstVatNumber')}</label>
                <input
                  type="text"
                  value={form.gstVatNumber}
                  onChange={(e) => setForm({ ...form, gstVatNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('suppliers.taxRegistrationNo')}</label>
                <input
                  type="text"
                  value={form.taxRegistrationNo}
                  onChange={(e) => setForm({ ...form, taxRegistrationNo: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('suppliers.paymentTerms')}</label>
                <input
                  type="text"
                  value={form.paymentTerms}
                  onChange={(e) => setForm({ ...form, paymentTerms: e.target.value })}
                  placeholder="Net 30, Net 60..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('suppliers.currency')}</label>
                <select
                  value={form.currency}
                  onChange={(e) => setForm({ ...form, currency: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                  <option value="AED">AED</option>
                  <option value="SAR">SAR</option>
                  <option value="INR">INR</option>
                  <option value="PKR">PKR</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('suppliers.status')}</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="active">{t('suppliers.active')}</option>
                  <option value="inactive">{t('suppliers.inactive')}</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t('suppliers.notes')}</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 mt-4 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              {t('app.cancel')}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? t('app.loading') : supplier ? t('app.save') : t('app.create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
