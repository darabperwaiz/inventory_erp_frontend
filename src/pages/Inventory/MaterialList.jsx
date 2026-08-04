import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Package, Edit2, Trash2, Eye, History, X, QrCode, SlidersHorizontal, Printer, Barcode, MoreVertical } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import useAuthStore from '../../store/authStore';
import { userApi } from '../../api/user.api';
import { materialApi } from '../../api/material.api';
import { supplierApi } from '../../api/supplier.api';
import { API_BASE } from '../../api/client';
import { useConfirm } from '../../components/ConfirmModal';
import toast from 'react-hot-toast';

export default function MaterialList() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const { confirm, ConfirmModal } = useConfirm();
  const canManageInventory = ['admin', 'inventory_manager'].includes(user?.role);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [showForm, setShowForm] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState(null);
  const [showReceive, setShowReceive] = useState(false);
  const [selected, setSelected] = useState([]);
  const [qrMaterial, setQrMaterial] = useState(null);
  const [qrImage, setQrImage] = useState(null);
  const [barcodeMaterial, setBarcodeMaterial] = useState(null);
  const [barcodeImage, setBarcodeImage] = useState(null);
  const [adjustMaterial, setAdjustMaterial] = useState(null);
  const [printLabels, setPrintLabels] = useState(null);
  const [openDropdown, setOpenDropdown] = useState(null);
  const dropdownRef = useRef(null);

  const fetchMaterials = async () => {
    try {
      setLoading(true);
      const { data } = await materialApi.getAll({ page, limit: 10, search });
      const seen = new Set();
      setMaterials((data.data || []).filter((m) => {
        if (seen.has(m._id)) return false;
        seen.add(m._id);
        return true;
      }));
      setPagination(data.pagination);
    } catch (err) {
      toast.error(t('inventory.loadError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMaterials();
    const handler = () => fetchMaterials();
    window.addEventListener('app:refresh', handler);
    return () => window.removeEventListener('app:refresh', handler);
  }, [page, search]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setOpenDropdown(null);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDelete = async (id) => {
    const ok = await confirm(t('inventory.confirmDelete'), null, t('app.delete'));
    if (!ok) return;
    try {
      await materialApi.delete(id);
      toast.success(t('inventory.deleteSuccess'));
      fetchMaterials();
    } catch (err) {
      toast.error(err.response?.data?.message || t('inventory.deleteError'));
    }
  };

  const toggleSelect = (id) => {
    setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    if (selected.length === materials.length) {
      setSelected([]);
    } else {
      setSelected(materials.map((m) => m._id));
    }
  };

  const handleBulkDelete = async () => {
    const ok = await confirm(t('inventory.confirmBulkDelete', { count: selected.length }), null, t('app.delete'));
    if (!ok) return;
    try {
      await materialApi.bulkDelete(selected);
      toast.success(t('inventory.bulkDeleteSuccess', { count: selected.length }));
      setSelected([]);
      fetchMaterials();
    } catch (err) {
      toast.error(err.response?.data?.message || t('inventory.deleteError'));
    }
  };

  const handleExportSelected = async (format) => {
    if (selected.length === 0) return toast.error(t('inventory.noItemsSelected'));
    try {
      const { default: client } = await import('../../api/client');
      const ids = selected.join(',');
      const blob = await client.get(`/reports/export/stock/${format}`, { params: { ids }, responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([blob.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `materials.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
      a.click();
      toast.success(t('inventory.exportSuccess', { format: format.toUpperCase() }));
    } catch (err) {
      toast.error(t('inventory.exportError'));
    }
  };

  const showQR = async (m) => {
    try {
      const { data } = await materialApi.getQR(m._id);
      setQrMaterial(data.data.material);
      setQrImage(data.data.qr);
    } catch {
      toast.error(t('inventory.qrError'));
    }
  };

  const showBarcode = async (m) => {
    try {
      const { data } = await materialApi.getBarcode(m._id);
      setBarcodeMaterial(data.data.material);
      setBarcodeImage(data.data.barcode);
    } catch {
      toast.error(t('inventory.barcodeError'));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">{t('inventory.title')}</h2>
          <p className="text-slate-500 text-sm mt-1">{t('inventory.subtitle')}</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          {canManageInventory && (
          <button
            onClick={() => setShowReceive(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm"
          >
            <Package size={16} /> {t('inventory.receive')}
          </button>
          )}
          {canManageInventory && (
          <button
            onClick={() => { setEditingMaterial(null); setShowForm(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
          >
            <Plus size={16} /> {t('inventory.addMaterial')}
          </button>
          )}
        </div>
      </div>

      {selected.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <span className="text-sm text-blue-700 font-medium">{t('app.selected', { count: selected.length })}</span>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => handleExportSelected('xlsx')} className="px-3 py-1.5 bg-white border border-blue-300 text-blue-700 rounded-lg text-xs hover:bg-blue-100">
              {t('inventory.exportExcel')}
            </button>
            <button onClick={() => {
              const selectedMaterials = materials.filter(m => selected.includes(m._id));
              setPrintLabels(selectedMaterials);
            }} className="px-3 py-1.5 bg-white border border-blue-300 text-blue-700 rounded-lg text-xs hover:bg-blue-100 flex items-center gap-1">
              <Printer size={12} /> {t('inventory.printLabels')}
            </button>
            {canManageInventory && (
            <button onClick={handleBulkDelete} className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs hover:bg-red-700">
              {t('inventory.bulkDelete')}
            </button>
            )}
            <button onClick={() => setSelected([])} className="px-3 py-1.5 bg-white border border-slate-300 text-slate-600 rounded-lg text-xs hover:bg-slate-100">
              {t('app.clear')}
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200">
        <div className="p-4 border-b border-slate-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder={t('inventory.searchMaterials')}
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[800px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left px-4 py-3 font-medium text-slate-600 w-10">
                  <input type="checkbox" checked={selected.length === materials.length && materials.length > 0}
                    onChange={toggleSelectAll} className="rounded border-slate-300" />
                </th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">{t('inventory.materialCode')}</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">{t('inventory.materialName')}</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">{t('inventory.category')}</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">{t('inventory.unit')}</th>
                <th className="text-right px-4 py-3 font-medium text-slate-600">{t('inventory.availableQuantity')}</th>
                <th className="text-right px-4 py-3 font-medium text-slate-600">{t('inventory.assignedQuantity')}</th>
                <th className="text-right px-4 py-3 font-medium text-slate-600">{t('inventory.installedQuantity')}</th>
                <th className="text-right px-4 py-3 font-medium text-slate-600">{t('inventory.minimumStock')}</th>
                <th className="text-center px-4 py-3 font-medium text-slate-600">{t('app.status')}</th>
                <th className="text-right px-4 py-3 font-medium text-slate-600">{t('app.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="11" className="text-center py-8 text-slate-400">{t('app.loading')}</td></tr>
              ) : materials.length === 0 ? (
                <tr><td colSpan="11" className="text-center py-8 text-slate-400">{t('app.noData')}</td></tr>
              ) : (
                materials.map((m) => (
                  <tr key={m._id} className={`border-b border-slate-100 hover:bg-slate-50 ${selected.includes(m._id) ? 'bg-blue-50' : ''}`}>
                    <td className="px-4 py-3">
                      <input type="checkbox" checked={selected.includes(m._id)} onChange={() => toggleSelect(m._id)} className="rounded border-slate-300" />
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">{m.materialCode}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-800">{m.name}</div>
                      {m.supplier && (
                        <div className="text-xs text-slate-400 mt-0.5">{m.supplier.name}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{m.category}</td>
                    <td className="px-4 py-3 text-slate-600">{m.unit}</td>
                    <td className="px-4 py-3 text-right font-medium text-slate-800">{m.availableQuantity}</td>
                    <td className="px-4 py-3 text-right text-amber-600">{m.assignedQuantity}</td>
                    <td className="px-4 py-3 text-right text-emerald-600">{m.installedQuantity}</td>
                    <td className="px-4 py-3 text-right text-slate-500">{m.minimumStock}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                        m.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {m.status === 'active' ? t('inventory.active') : t('inventory.discontinued')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="relative inline-block" ref={openDropdown === m._id ? dropdownRef : null}>
                        <button
                          onClick={() => setOpenDropdown(openDropdown === m._id ? null : m._id)}
                          className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded"
                        >
                          <MoreVertical size={16} />
                        </button>
                        {openDropdown === m._id && (
                          <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg border border-slate-200 shadow-lg z-40 py-1">
                            <Link
                              to={`/inventory/${m._id}/history`}
                              className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                              onClick={() => setOpenDropdown(null)}
                            >
                              <History size={14} className="text-purple-500" />
                              {t('inventory.history')}
                            </Link>
                            {canManageInventory && (
                            <button
                              onClick={() => { setEditingMaterial(m); setShowForm(true); setOpenDropdown(null); }}
                              className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 w-full text-left"
                            >
                              <Edit2 size={14} className="text-blue-500" />
                              {t('app.edit')}
                            </button>
                            )}
                            {canManageInventory && (
                            <button
                              onClick={() => { setAdjustMaterial(m); setOpenDropdown(null); }}
                              className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 w-full text-left"
                            >
                              <SlidersHorizontal size={14} className="text-amber-500" />
                              {t('inventory.adjustStock')}
                            </button>
                            )}
                            <button
                              onClick={() => { showQR(m); setOpenDropdown(null); }}
                              className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 w-full text-left"
                            >
                              <QrCode size={14} className="text-slate-500" />
                              {t('inventory.qrCode')}
                            </button>
                            <button
                              onClick={() => { showBarcode(m); setOpenDropdown(null); }}
                              className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 w-full text-left"
                            >
                              <Barcode size={14} className="text-slate-500" />
                              {t('inventory.barcode')}
                            </button>
                            {canManageInventory && (
                            <>
                            <hr className="my-1 border-slate-100" />
                            <button
                              onClick={() => { handleDelete(m._id); setOpenDropdown(null); }}
                              className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left"
                            >
                              <Trash2 size={14} />
                              {t('app.delete')}
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
            </tbody>
          </table>
        </div>

        {pagination.pages > 1 && (
          <div className="p-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2">
            <span className="text-sm text-slate-500">
              {t('app.showing')} {((page - 1) * 10) + 1} {t('app.of')} {Math.min(page * 10, pagination.total)} {t('app.of')} {pagination.total}
            </span>
            <div className="flex gap-1 flex-wrap justify-center">
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
        <MaterialForm
          material={editingMaterial}
          onClose={() => { setShowForm(false); setEditingMaterial(null); }}
          onSuccess={() => { setShowForm(false); setEditingMaterial(null); fetchMaterials(); }}
        />
      )}

      {showReceive && (
        <ReceiveMaterial
          onClose={() => setShowReceive(false)}
          onSuccess={() => { setShowReceive(false); fetchMaterials(); }}
        />
      )}

      {qrImage && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => { setQrImage(null); setQrMaterial(null); }}>
          <div className="bg-white rounded-xl p-4 sm:p-6 max-w-full sm:max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-800">{t('inventory.qrCode')}</h3>
              <button onClick={() => { setQrImage(null); setQrMaterial(null); }} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>
            <div className="text-center">
              <img src={qrImage} alt="QR Code" className="mx-auto mb-3" />
              <div className="text-sm font-medium text-slate-800">{qrMaterial?.name}</div>
              <div className="text-xs text-slate-500">{qrMaterial?.code}</div>
            </div>
            <button onClick={() => {
              const a = document.createElement('a');
              a.href = qrImage;
              a.download = `QR-${qrMaterial?.code}.png`;
              a.click();
            }} className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
              {t('inventory.downloadQR')}
            </button>
          </div>
        </div>
      )}

      {barcodeImage && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => { setBarcodeImage(null); setBarcodeMaterial(null); }}>
          <div className="bg-white rounded-xl p-4 sm:p-6 max-w-full sm:max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-800">{t('inventory.barcode')}</h3>
              <button onClick={() => { setBarcodeImage(null); setBarcodeMaterial(null); }} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>
            <div className="text-center">
              <img src={barcodeImage} alt="Barcode" className="mx-auto mb-3" />
              <div className="text-sm font-medium text-slate-800">{barcodeMaterial?.name}</div>
              <div className="text-xs text-slate-500">{barcodeMaterial?.materialCode}</div>
            </div>
            <button onClick={() => {
              const a = document.createElement('a');
              a.href = barcodeImage;
              a.download = `Barcode-${barcodeMaterial?.materialCode}.png`;
              a.click();
            }} className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
              {t('inventory.downloadBarcode')}
            </button>
          </div>
        </div>
      )}

      {adjustMaterial && (
        <AdjustStockModal
          material={adjustMaterial}
          onClose={() => setAdjustMaterial(null)}
          onSuccess={() => { setAdjustMaterial(null); fetchMaterials(); }}
        />
      )}

      {printLabels && (
        <PrintLabelsModal
          materials={printLabels}
          onClose={() => setPrintLabels(null)}
        />
      )}

      {ConfirmModal}
    </div>
  );
}

function AdjustStockModal({ material, onClose, onSuccess }) {
  const { t } = useTranslation();
  const [form, setForm] = useState({ adjustmentType: 'increase', quantity: '', reason: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.quantity || Number(form.quantity) <= 0) return toast.error(t('inventory.validQuantity'));
    if (!form.reason) return toast.error(t('inventory.enterReason'));
    const finalReason = form.reason === 'Other' ? (form.customReason || 'Other') : form.reason;
    setLoading(true);
    try {
      await materialApi.adjust({ materialId: material._id, quantity: Number(form.quantity), adjustmentType: form.adjustmentType, reason: finalReason });
      toast.success(t(form.adjustmentType === 'increase' ? 'inventory.stockIncreased' : 'inventory.stockDecreased'));
      window.dispatchEvent(new CustomEvent('app:refresh-notifications'));
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || t('inventory.adjustmentError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl w-full max-w-full sm:max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="px-4 sm:px-5 py-3 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold">{t('inventory.adjustStock')}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4">
          <div className="bg-slate-50 rounded-lg p-3">
            <div className="text-sm font-medium text-slate-800">{material.name}</div>
            <div className="text-xs text-slate-500">{material.materialCode} — {t('inventory.availableQuantity')}: <span className="font-bold">{material.availableQuantity}</span> {material.unit}</div>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => setForm({ ...form, adjustmentType: 'increase' })}
              className={`flex-1 py-2 rounded-lg text-sm font-medium border ${form.adjustmentType === 'increase' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-700 border-slate-300 hover:border-emerald-400'}`}>
              + {t('inventory.increase')}
            </button>
            <button type="button" onClick={() => setForm({ ...form, adjustmentType: 'decrease' })}
              className={`flex-1 py-2 rounded-lg text-sm font-medium border ${form.adjustmentType === 'decrease' ? 'bg-red-600 text-white border-red-600' : 'bg-white text-slate-700 border-slate-300 hover:border-red-400'}`}>
              - {t('inventory.decrease')}
            </button>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t('inventory.quantity')} *</label>
            <input type="number" min="1" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t('inventory.reason')} *</label>
            <select value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" required>
              <option value="">{t('inventory.selectReason')}</option>
              <option value="Physical count correction">{t('inventory.physicalCorrection')}</option>
              <option value="Damaged goods">{t('inventory.damagedGoods')}</option>
              <option value="Expired material">{t('inventory.expiredMaterial')}</option>
              <option value="Lost in transit">{t('inventory.lostInTransit')}</option>
              <option value="Quality issue">{t('inventory.qualityIssue')}</option>
              <option value="Other">{t('inventory.other')}</option>
            </select>
          </div>
          {form.reason === 'Other' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t('inventory.customReason')} *</label>
              <input type="text" value={form.customReason || ''} onChange={(e) => setForm({ ...form, customReason: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
            </div>
          )}
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg text-sm">{t('app.cancel')}</button>
            <button type="submit" disabled={loading} className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">
              {loading ? t('app.processing') : t('inventory.confirmAdjustment')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function MaterialForm({ material, onClose, onSuccess }) {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    name: material?.name || '',
    category: material?.category || '',
    subcategory: material?.subcategory || '',
    unit: material?.unit || '',
    description: material?.description || '',
    manufacturer: material?.manufacturer || '',
    brand: material?.brand || '',
    minimumOrderQty: material?.minimumOrderQty || 0,
    status: material?.status || 'active',
    supplier: material?.supplier?._id || material?.supplier || '',
  });
  const [loading, setLoading] = useState(false);
  const [suppliers, setSuppliers] = useState([]);

  useEffect(() => {
    supplierApi.getAllDropdown().then(({ data }) => setSuppliers(data.data || [])).catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let materialId;
      if (material) {
        await materialApi.update(material._id, form);
        materialId = material._id;
        toast.success(t('inventory.materialUpdated'));
      } else {
        const { data } = await materialApi.create(form);
        materialId = data.data._id;
        toast.success(t('inventory.materialCreated'));
      }
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || t('inventory.saveError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-full sm:max-w-2xl">
        <div className="px-4 sm:px-5 py-3 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold">{material ? t('inventory.editMaterial') : t('inventory.addMaterial')}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 sm:p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-0.5">{t('inventory.materialName')} *</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" required />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-0.5">{t('inventory.category')} *</label>
                <input type="text" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" required />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-0.5">{t('inventory.subcategory')}</label>
                <input type="text" value={form.subcategory} onChange={(e) => setForm({ ...form, subcategory: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-0.5">{t('inventory.unit')} *</label>
                <input type="text" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} placeholder="pcs, meters, kg"
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" required />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-0.5">{t('inventory.manufacturer')}</label>
                <input type="text" value={form.manufacturer} onChange={(e) => setForm({ ...form, manufacturer: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-0.5">{t('inventory.brand')}</label>
                <input type="text" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-0.5">{t('suppliers.preferredSupplier')}</label>
                <select value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none">
                  <option value="">{t('suppliers.noSupplier')}</option>
                  {suppliers.map((s) => (
                    <option key={s._id} value={s._id}>{s.supplierCode} - {s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-0.5">{t('suppliers.minOrderQty')}</label>
                <input type="number" value={form.minimumOrderQty} onChange={(e) => setForm({ ...form, minimumOrderQty: Number(e.target.value) })}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-0.5">{t('app.status')}</label>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none">
                  <option value="active">{t('inventory.active')}</option>
                  <option value="discontinued">{t('inventory.discontinued')}</option>
                </select>
              </div>
              <div className="col-span-1 sm:col-span-2 lg:col-span-3">
                <label className="block text-xs font-medium text-slate-600 mb-0.5">{t('inventory.description')}</label>
                <input type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
              </div>
          </div>
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 mt-4 pt-3 border-t border-slate-100">
            <button type="button" onClick={onClose} className="px-4 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg text-sm">{t('app.cancel')}</button>
            <button type="submit" disabled={loading} className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">
              {loading ? t('app.saving') : t('app.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ReceiveMaterial({ onClose, onSuccess }) {
  const { t } = useTranslation();
  const [materials, setMaterials] = useState([]);
  const [inventoryUsers, setInventoryUsers] = useState([]);
  const [form, setForm] = useState({
    materialId: '',
    quantity: '',
    supplier: '',
    purchaseOrder: '',
    invoiceNumber: '',
    receivedDate: new Date().toISOString().split('T')[0],
    receivedBy: '',
    remarks: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    materialApi.getAll({ limit: 100 }).then(({ data }) => {
      setMaterials(data.data || []);
    });
    userApi.getAll({ role: 'admin', limit: 50 }).then(({ data }) => {
      const admins = data.data || [];
      userApi.getAll({ role: 'inventory_manager', limit: 50 }).then(({ data: data2 }) => {
        const ims = data2.data || [];
        setInventoryUsers([...admins, ...ims]);
      });
    });
  }, []);

  const [selectedMaterial, setSelectedMaterial] = useState(null);

  const handleMaterialChange = (e) => {
    const materialId = e.target.value;
    const selected = materials.find((m) => m._id === materialId);
    setSelectedMaterial(selected || null);
    setForm({
      ...form,
      materialId,
      supplier: selected?.supplier?.name || '',
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await materialApi.receive({ ...form, quantity: Number(form.quantity) });
      toast.success(t('inventory.materialReceived'));
      window.dispatchEvent(new CustomEvent('app:refresh-notifications'));
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || t('inventory.receiveError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-full sm:max-w-lg">
        <div className="p-4 sm:p-6 border-b border-slate-200">
          <h3 className="text-lg font-semibold">{t('inventory.receiveMaterial')}</h3>
        </div>
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t('inventory.materialName')} *</label>
            <select
              value={form.materialId}
              onChange={handleMaterialChange}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              required
            >
              <option value="">{t('inventory.selectMaterial')}</option>
              {materials.map((m) => (
                <option key={m._id} value={m._id}>{m.materialCode} - {m.name}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t('inventory.quantity')} *</label>
              <input
                type="number"
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                required
                min={selectedMaterial?.minimumOrderQty || 1}
              />
              {selectedMaterial?.minimumOrderQty > 0 && (
                <p className="text-xs text-slate-400 mt-1">Min order: {selectedMaterial.minimumOrderQty} {selectedMaterial.unit}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t('inventory.receivedDate')}</label>
              <input
                type="date"
                value={form.receivedDate}
                onChange={(e) => setForm({ ...form, receivedDate: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t('inventory.supplier')}</label>
              <input
                type="text"
                value={form.supplier}
                onChange={(e) => setForm({ ...form, supplier: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t('inventory.poNumber')}</label>
              <input
                type="text"
                value={form.purchaseOrder}
                onChange={(e) => setForm({ ...form, purchaseOrder: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t('inventory.invoiceNumber')}</label>
              <input
                type="text"
                value={form.invoiceNumber}
                onChange={(e) => setForm({ ...form, invoiceNumber: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t('projects.receivedBy')}</label>
            <select
              value={form.receivedBy}
              onChange={(e) => setForm({ ...form, receivedBy: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="">{t('projects.selectUser')}</option>
              {inventoryUsers.map((u) => (
                <option key={u._id} value={u._id}>{u.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t('inventory.remarks')}</label>
            <textarea
              value={form.remarks}
              onChange={(e) => setForm({ ...form, remarks: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm">
              {t('app.cancel')}
            </button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700 disabled:opacity-50">
              {loading ? t('app.processing') : t('inventory.receive')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function PrintLabelsModal({ materials, onClose }) {
  const { t } = useTranslation();

  const escapeHtml = (str) => {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    const labels = materials.map(m => `
      <div class="label">
        <div class="qr" id="qr-${m._id}"></div>
        <div class="info">
          <div class="name">${escapeHtml(m.name)}</div>
          <div class="code">${escapeHtml(m.materialCode)}</div>
          <div class="meta">${escapeHtml(m.category)} | ${escapeHtml(m.unit)}</div>
        </div>
      </div>
    `).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>${escapeHtml(t('inventory.printLabels'))}</title>
          <script src="https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js"></script>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: Arial, sans-serif; padding: 20px; }
            .labels { display: flex; flex-wrap: wrap; gap: 12px; }
            .label {
              width: 180px; height: 120px;
              border: 2px solid #333; border-radius: 8px;
              padding: 10px; display: flex; align-items: center; gap: 10px;
              page-break-inside: avoid;
            }
            .qr { flex-shrink: 0; }
            .qr canvas, .qr img { width: 70px !important; height: 70px !important; }
            .info { flex: 1; min-width: 0; }
            .name { font-weight: 700; font-size: 11px; color: #111; word-break: break-word; line-height: 1.2; }
            .code { font-size: 9px; color: #555; margin-top: 2px; font-family: monospace; }
            .meta { font-size: 8px; color: #888; margin-top: 4px; }
            @media print {
              body { padding: 0; }
              .label { border-color: #000; }
            }
          </style>
        </head>
        <body>
          <h2 style="margin-bottom:16px;font-size:16px;color:#333;">${escapeHtml(t('inventory.materialLabels'))}</h2>
          <div class="labels">
            ${labels}
          </div>
          <script>
            ${materials.map(m => `
              new QRCode(document.getElementById("qr-${m._id}"), {
                text: ${JSON.stringify(m.materialCode)},
                width: 70, height: 70,
                correctLevel: QRCode.CorrectLevel.M
              });
            `).join('')}
            setTimeout(function() { window.print(); }, 500);
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl w-full max-w-full sm:max-w-lg" onClick={(e) => e.stopPropagation()}>
        <div className="px-4 sm:px-5 py-3 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center gap-2"><Printer size={18} /> {t('inventory.printLabels')}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
        </div>
        <div className="p-4 sm:p-5">
          <p className="text-sm text-slate-600 mb-4">{t('inventory.labelsReady', { count: materials.length })}</p>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {materials.map(m => (
              <div key={m._id} className="flex items-center gap-3 p-2 bg-slate-50 rounded-lg">
                <div className="w-10 h-10 bg-slate-200 rounded flex items-center justify-center">
                  <QrCode size={16} className="text-slate-500" />
                </div>
                <div>
                  <div className="text-sm font-medium text-slate-800">{m.name}</div>
                  <div className="text-xs text-slate-500 font-mono">{m.materialCode}</div>
                </div>
              </div>
            ))}
          </div>
          <button onClick={handlePrint} className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 flex items-center justify-center gap-2">
            <Printer size={16} /> {t('inventory.printLabels')}
          </button>
        </div>
      </div>
    </div>
  );
}
