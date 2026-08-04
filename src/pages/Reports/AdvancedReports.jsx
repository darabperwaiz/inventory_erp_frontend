import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import {
  Download, FileText, FileSpreadsheet, Package, Users, Truck,
  Layers, ChevronDown, ChevronUp, Filter, BarChart3, Calendar,
  AlertTriangle, ArrowRight
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { reportApi } from '../../api/report.api';
import { exportApi, downloadBlob } from '../../api/export.api';
import { supplierApi } from '../../api/supplier.api';
import { projectApi } from '../../api/project.api';

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

const formatCurrency = (val) => Number(val || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const typeBadge = (type) => {
  const map = {
    receive: 'bg-blue-100 text-blue-700',
    assign: 'bg-amber-100 text-amber-700',
    install: 'bg-green-100 text-green-700',
    return: 'bg-purple-100 text-purple-700',
    transfer: 'bg-cyan-100 text-cyan-700',
    adjustment: 'bg-red-100 text-red-700'
  };
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${map[type] || 'bg-gray-100 text-gray-600'}`}>{type}</span>;
};

const ExportButtons = ({ onExport, label }) => (
  <div className="flex gap-2">
    <button onClick={() => onExport('pdf')} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 text-sm font-medium transition-colors">
      <FileText size={15} /> {label ? `${label} PDF` : 'PDF'}
    </button>
    <button onClick={() => onExport('xlsx')} className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 text-sm font-medium transition-colors">
      <FileSpreadsheet size={15} /> {label ? `${label} Excel` : 'Excel'}
    </button>
  </div>
);

const FilterInput = ({ label, children }) => (
  <div className="flex flex-col gap-1">
    <label className="text-xs font-medium text-gray-500">{label}</label>
    {children}
  </div>
);

const SummaryCard = ({ icon: Icon, label, value, color = 'blue' }) => {
  const colorMap = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    amber: 'bg-amber-50 text-amber-600',
    red: 'bg-red-50 text-red-600',
    purple: 'bg-purple-50 text-purple-600',
    cyan: 'bg-cyan-50 text-cyan-600'
  };
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
      <div className={`p-2.5 rounded-lg ${colorMap[color]}`}><Icon size={20} /></div>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-lg font-bold text-gray-800">{typeof value === 'number' ? value.toLocaleString() : value}</p>
      </div>
    </div>
  );
};

export default function AdvancedReports() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('inventory');
  const [loading, setLoading] = useState(false);

  const [inventoryData, setInventoryData] = useState(null);
  const [projectData, setProjectData] = useState(null);
  const [supplierData, setSupplierData] = useState(null);
  const [combinedData, setCombinedData] = useState(null);

  const [expandedRows, setExpandedRows] = useState({});

  const [inventoryFilters, setInventoryFilters] = useState({ category: '', supplier: '', startDate: '', endDate: '' });
  const [projectFilters, setProjectFilters] = useState({ projectId: '', startDate: '', endDate: '' });
  const [supplierFilters, setSupplierFilters] = useState({ supplierId: '', startDate: '', endDate: '' });
  const [combinedFilters, setCombinedFilters] = useState({ projectId: '', supplierId: '', materialId: '', type: '', startDate: '', endDate: '' });

  const [suppliersList, setSuppliersList] = useState([]);
  const [projectsList, setProjectsList] = useState([]);
  const [categoriesList, setCategoriesList] = useState([]);

  useEffect(() => {
    const loadDropdowns = async () => {
      try {
        const [sRes, pRes] = await Promise.all([
          supplierApi.getAllDropdown(),
          projectApi.getAll()
        ]);
        setSuppliersList(sRes.data?.data || []);
        setProjectsList(pRes.data?.data || []);
      } catch {
        toast.error('Failed to load dropdowns');
      }
    };
    loadDropdowns();
  }, []);

  useEffect(() => {
    if (activeTab === 'inventory') fetchInventory();
    else if (activeTab === 'projects') fetchProjects();
    else if (activeTab === 'suppliers') fetchSuppliers();
    else if (activeTab === 'combined') fetchCombined();
  }, [activeTab]);

  const toggleExpand = (key) => setExpandedRows((prev) => ({ ...prev, [key]: !prev[key] }));

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const res = await reportApi.getAdvancedInventory(inventoryFilters);
      setInventoryData(res.data?.data);
      const cats = res.data?.data?.materials?.map((m) => m.category).filter(Boolean);
      setCategoriesList([...new Set(cats || [])]);
    } catch { toast.error('Failed to load inventory report'); }
    setLoading(false);
  };

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const res = await reportApi.getAdvancedProject(projectFilters);
      setProjectData(res.data?.data);
    } catch { toast.error('Failed to load project report'); }
    setLoading(false);
  };

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const res = await reportApi.getAdvancedSupplier(supplierFilters);
      setSupplierData(res.data?.data);
    } catch { toast.error('Failed to load supplier report'); }
    setLoading(false);
  };

  const fetchCombined = async () => {
    setLoading(true);
    try {
      const res = await reportApi.getAdvancedCombined(combinedFilters);
      setCombinedData(res.data?.data);
    } catch { toast.error('Failed to load combined report'); }
    setLoading(false);
  };

  const handleExport = async (format, reportType, filters) => {
    try {
      const res = await exportApi.advancedReport(format, reportType, filters);
      const ext = format === 'pdf' ? 'pdf' : 'xlsx';
      downloadBlob(res.data, `${reportType}_report.${ext}`);
      toast.success('Report exported successfully');
    } catch { toast.error('Export failed'); }
  };

  const tabs = [
    { key: 'inventory', label: 'Inventory / المخزون', icon: Package },
    { key: 'projects', label: 'Projects / المشاريع', icon: Layers },
    { key: 'suppliers', label: 'Suppliers / الموردين', icon: Truck },
    { key: 'combined', label: 'Combined / مجمّع', icon: BarChart3 }
  ];

  const fetchMap = { inventory: fetchInventory, projects: fetchProjects, suppliers: fetchSuppliers, combined: fetchCombined };
  const filtersMap = { inventory: inventoryFilters, projects: projectFilters, suppliers: supplierFilters, combined: combinedFilters };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-[1600px] mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <BarChart3 size={28} /> {t('Advanced Reports')} / التقارير المتقدمة
            </h1>
            <p className="text-sm text-gray-500 mt-1">{t('Detailed analytics and export')} / تحليلات مفصلة وتصدير</p>
          </div>
        </div>

        <div className="flex overflow-x-auto gap-1 bg-white rounded-xl border border-gray-200 p-1 mb-6">
          {tabs.map((tab) => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                activeTab === tab.key
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}>
              <tab.icon size={16} /> {tab.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-end gap-3 mb-4">
          <div className="flex-1" />
          <ExportButtons onExport={(fmt) => handleExport(fmt, activeTab, filtersMap[activeTab])} />
        </div>

        {activeTab === 'inventory' && (
          <InventoryTab filters={inventoryFilters} setFilters={setInventoryFilters}
            data={inventoryData} loading={loading} expandedRows={expandedRows} toggleExpand={toggleExpand}
            categories={categoriesList} suppliers={suppliersList} onExport={handleExport} t={t} />
        )}
        {activeTab === 'projects' && (
          <ProjectsTab filters={projectFilters} setFilters={setProjectFilters}
            data={projectData} loading={loading} expandedRows={expandedRows} toggleExpand={toggleExpand}
            projects={projectsList} onExport={handleExport} t={t} />
        )}
        {activeTab === 'suppliers' && (
          <SuppliersTab filters={supplierFilters} setFilters={setSupplierFilters}
            data={supplierData} loading={loading} expandedRows={expandedRows} toggleExpand={toggleExpand}
            suppliers={suppliersList} onExport={handleExport} t={t} />
        )}
        {activeTab === 'combined' && (
          <CombinedTab filters={combinedFilters} setFilters={setCombinedFilters}
            data={combinedData} loading={loading} expandedRows={expandedRows} toggleExpand={toggleExpand}
            projects={projectsList} suppliers={suppliersList} onExport={handleExport} t={t} />
        )}
      </div>
    </div>
  );
}

function InventoryTab({ filters, setFilters, data, loading, expandedRows, toggleExpand, categories, suppliers, onExport, t }) {
  return (
    <>
      <div className="flex flex-wrap items-end gap-3 mb-6 bg-white rounded-xl border border-gray-200 p-4">
        <FilterInput label={`${t('Category')} / الفئة`}>
          <select value={filters.category} onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value }))}
            className="px-3 py-1.5 border rounded-lg text-sm">
            <option value="">All / الكل</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </FilterInput>
        <FilterInput label={`${t('Supplier')} / المورد`}>
          <select value={filters.supplier} onChange={(e) => setFilters((f) => ({ ...f, supplier: e.target.value }))}
            className="px-3 py-1.5 border rounded-lg text-sm">
            <option value="">All / الكل</option>
            {suppliers.map((s) => <option key={s._id || s.id} value={s._id || s.id}>{s.name}</option>)}
          </select>
        </FilterInput>
        <FilterInput label={`${t('Start Date')} / تاريخ البداية`}>
          <input type="date" value={filters.startDate} onChange={(e) => setFilters((f) => ({ ...f, startDate: e.target.value }))}
            className="px-3 py-1.5 border rounded-lg text-sm" />
        </FilterInput>
        <FilterInput label={`${t('End Date')} / تاريخ النهاية`}>
          <input type="date" value={filters.endDate} onChange={(e) => setFilters((f) => ({ ...f, endDate: e.target.value }))}
            className="px-3 py-1.5 border rounded-lg text-sm" />
        </FilterInput>
      </div>

      {loading && <div className="text-center py-12 text-gray-400">{t('Loading...')} / جارٍ التحميل...</div>}

      {!loading && data && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
            <SummaryCard icon={Package} label={`${t('Total Materials')} / إجمالي المواد`} value={data.summary?.totalMaterials || 0} color="blue" />
            <SummaryCard icon={Package} label={`${t('Available')} / المتاح`} value={data.summary?.totalAvailable || 0} color="green" />
            <SummaryCard icon={Package} label={`${t('Assigned')} / المعين`} value={data.summary?.totalAssigned || 0} color="amber" />
            <SummaryCard icon={Package} label={`${t('Installed')} / المركّب`} value={data.summary?.totalInstalled || 0} color="purple" />
            <SummaryCard icon={Package} label={`${t('Total Value')} / إجمالي القيمة`} value={formatCurrency(data.summary?.totalValue)} color="cyan" />
            <SummaryCard icon={AlertTriangle} label={`${t('Low Stock')} / مخزون منخفض`} value={data.summary?.lowStockCount || 0} color="red" />
          </div>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50/50 text-left">
                    <th className="px-4 py-3 font-medium text-gray-600 w-8"></th>
                    <th className="px-4 py-3 font-medium text-gray-600">Code / الكود</th>
                    <th className="px-4 py-3 font-medium text-gray-600">Name / الاسم</th>
                    <th className="px-4 py-3 font-medium text-gray-600">Category / الفئة</th>
                    <th className="px-4 py-3 font-medium text-gray-600">Unit / الوحدة</th>
                    <th className="px-4 py-3 font-medium text-gray-600">Supplier / المورد</th>
                    <th className="px-4 py-3 font-medium text-gray-600 text-right">Price / السعر</th>
                    <th className="px-4 py-3 font-medium text-gray-600 text-right">Received / المستلم</th>
                    <th className="px-4 py-3 font-medium text-gray-600 text-right">Available / المتاح</th>
                    <th className="px-4 py-3 font-medium text-gray-600 text-right">Assigned / المعين</th>
                    <th className="px-4 py-3 font-medium text-gray-600 text-right">Installed / المركّب</th>
                    <th className="px-4 py-3 font-medium text-gray-600 text-right">Returned / المُعاد</th>
                    <th className="px-4 py-3 font-medium text-gray-600 text-right">Damaged / التالف</th>
                    <th className="px-4 py-3 font-medium text-gray-600 text-right">Lost / المفقود</th>
                    <th className="px-4 py-3 font-medium text-gray-600 text-right">Min Stock / الحد الأدنى</th>
                    <th className="px-4 py-3 font-medium text-gray-600 text-right">Value / القيمة</th>
                    <th className="px-4 py-3 font-medium text-gray-600 text-center">Status / الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {(data.materials || []).map((m, i) => (
                    <MaterialRow key={m._id || i} material={m} index={i}
                      expanded={expandedRows[`inv-${i}`]} toggleExpand={() => toggleExpand(`inv-${i}`)} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {!loading && !data && (
        <div className="text-center py-20 text-gray-400">
          <BarChart3 size={48} className="mx-auto mb-3 opacity-30" />
          <p>{t('Click "Load Report" to generate report')} / انقر "تحميل التقرير" لإنشاء التقرير</p>
        </div>
      )}
    </>
  );
}

function MaterialRow({ material: m, index, expanded, toggleExpand }) {
  const { t } = useTranslation();
  return (
    <>
      <tr className="hover:bg-gray-50/30 cursor-pointer transition-colors" onClick={toggleExpand}>
        <td className="px-4 py-3">
          {expanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
        </td>
        <td className="px-4 py-3 font-medium text-gray-800">{m.code}</td>
        <td className="px-4 py-3 text-gray-700">{m.name}</td>
        <td className="px-4 py-3 text-gray-600">{m.category}</td>
        <td className="px-4 py-3 text-gray-600">{m.unit}</td>
        <td className="px-4 py-3 text-gray-600">{m.supplierName}</td>
        <td className="px-4 py-3 text-right text-gray-700">{formatCurrency(m.price)}</td>
        <td className="px-4 py-3 text-right text-gray-700">{m.receivedQuantity || 0}</td>
        <td className="px-4 py-3 text-right font-medium text-green-600">{m.availableQuantity || 0}</td>
        <td className="px-4 py-3 text-right text-amber-600">{m.assignedQuantity || 0}</td>
        <td className="px-4 py-3 text-right text-blue-600">{m.installedQuantity || 0}</td>
        <td className="px-4 py-3 text-right text-purple-600">{m.returnedQuantity || 0}</td>
        <td className="px-4 py-3 text-right text-red-600">{m.damagedQuantity || 0}</td>
        <td className="px-4 py-3 text-right text-red-600">{m.lostQuantity || 0}</td>
        <td className="px-4 py-3 text-right text-gray-600">{m.minStock || 0}</td>
        <td className="px-4 py-3 text-right font-medium text-gray-800">{formatCurrency(m.totalValue)}</td>
        <td className="px-4 py-3 text-center">
          {m.isLowStock
            ? <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700">LOW</span>
            : <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-700">OK</span>
          }
        </td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={17} className="px-4 py-3 bg-gray-50/50">
            <div className="ml-8">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">
                {t('Transactions')} / المعاملات - {m.name}
              </h4>
              {m.transactions?.length > 0 ? (
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-left text-gray-500">
                      <th className="py-1.5 px-2">Type / النوع</th>
                      <th className="py-1.5 px-2">Qty / الكمية</th>
                      <th className="py-1.5 px-2">Date / التاريخ</th>
                      <th className="py-1.5 px-2">By / بواسطة</th>
                      <th className="py-1.5 px-2">Notes / ملاحظات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {m.transactions.map((tx, j) => (
                      <tr key={j}>
                        <td className="py-1.5 px-2">{typeBadge(tx.type)}</td>
                        <td className="py-1.5 px-2">{tx.quantity}</td>
                        <td className="py-1.5 px-2">{tx.date ? new Date(tx.date).toLocaleDateString() : '-'}</td>
                        <td className="py-1.5 px-2">{tx.performedBy || '-'}</td>
                        <td className="py-1.5 px-2 text-gray-500">{tx.notes || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : <p className="text-xs text-gray-400 italic">No transactions / لا توجد معاملات</p>}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function ProjectsTab({ filters, setFilters, data, loading, expandedRows, toggleExpand, projects, onExport, t }) {
  return (
    <>
      <div className="flex flex-wrap items-end gap-3 mb-6 bg-white rounded-xl border border-gray-200 p-4">
        <FilterInput label={`${t('Project')} / المشروع`}>
          <select value={filters.projectId} onChange={(e) => setFilters((f) => ({ ...f, projectId: e.target.value }))}
            className="px-3 py-1.5 border rounded-lg text-sm">
            <option value="">All / الكل</option>
            {projects.map((p) => <option key={p._id || p.id} value={p._id || p.id}>{p.name}</option>)}
          </select>
        </FilterInput>
        <FilterInput label={`${t('Start Date')} / تاريخ البداية`}>
          <input type="date" value={filters.startDate} onChange={(e) => setFilters((f) => ({ ...f, startDate: e.target.value }))}
            className="px-3 py-1.5 border rounded-lg text-sm" />
        </FilterInput>
        <FilterInput label={`${t('End Date')} / تاريخ النهاية`}>
          <input type="date" value={filters.endDate} onChange={(e) => setFilters((f) => ({ ...f, endDate: e.target.value }))}
            className="px-3 py-1.5 border rounded-lg text-sm" />
        </FilterInput>
      </div>

      {loading && <div className="text-center py-12 text-gray-400">{t('Loading...')} / جارٍ التحميل...</div>}

      {!loading && data && (
        <>
          <div className="flex flex-wrap gap-2 mb-6">
            <ExportButtons onExport={(fmt) => onExport(fmt, 'project', filters)} label="Projects" />
          </div>

          <div className="space-y-4">
            {(Array.isArray(data) ? data : data?.projects || []).map((proj, i) => {
              const key = `proj-${i}`;
              const isOpen = expandedRows[key];
              return (
                <div key={key} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="flex items-center gap-4 p-4 cursor-pointer hover:bg-gray-50/30 transition-colors"
                    onClick={() => toggleExpand(key)}>
                    <button className="text-gray-400">
                      {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-gray-800">{proj.name}</h3>
                        <span className="text-xs text-gray-400">{proj.projectId || proj.code}</span>
                        {proj.status && (
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            proj.status === 'active' ? 'bg-green-100 text-green-700' :
                            proj.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                            'bg-gray-100 text-gray-600'
                          }`}>{proj.status}</span>
                        )}
                        {proj.priority && (
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            proj.priority === 'high' ? 'bg-red-100 text-red-700' :
                            proj.priority === 'medium' ? 'bg-amber-100 text-amber-700' :
                            'bg-gray-100 text-gray-600'
                          }`}>{proj.priority}</span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-4 mt-2 text-xs text-gray-500">
                        <span>{t('Materials Used')} / المواد المستخدمة: <strong className="text-gray-800">{proj.stats?.totalMaterials || 0}</strong></span>
                        <span>{t('Assigned')} / المعين: <strong className="text-amber-600">{proj.stats?.totalAssigned || 0}</strong></span>
                        <span>{t('Installed')} / المركّب: <strong className="text-blue-600">{proj.stats?.totalInstalled || 0}</strong></span>
                        <span>{t('Returned')} / المُعاد: <strong className="text-purple-600">{proj.stats?.totalReturned || 0}</strong></span>
                        <span>{t('Value')} / القيمة: <strong className="text-gray-800">{formatCurrency(proj.stats?.totalValue)}</strong></span>
                      </div>
                    </div>
                    <ArrowRight size={16} className={`text-gray-400 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
                  </div>

                  {isOpen && (
                    <div className="border-t border-gray-200 p-4 space-y-4">
                      {proj.materials?.length > 0 && (
                        <SubTable title={`${t('Materials')} / المواد`} cols={['Material / المادة', 'Assigned / المعين', 'Installed / المركّب', 'Returned / المُعاد', 'Transferred / المنقول', 'Remaining / المتبقي', 'Assigned By / المعين بواسطة', 'Status / الحالة']}
                          rows={proj.materials.map((mt) => [
                            mt.material?.name || '-', mt.assignedQuantity, mt.installedQuantity, mt.returnedQuantity, mt.transferredOutQuantity, mt.remaining, mt.assignedBy?.name || '-', typeBadge(mt.status || 'active')
                          ])} />
                      )}
                      {proj.installations?.length > 0 && (
                        <SubTable title={`${t('Installations')} / التركيبات`} cols={['Material / المادة', 'Qty / الكمية', 'Date / التاريخ', 'Installed By / بواسطة', 'Checklist / القائمة']}
                          rows={proj.installations.map((ins) => [
                            ins.material?.name || '-', ins.installedQuantity, ins.installationDate ? new Date(ins.installationDate).toLocaleDateString() : '-', ins.installedBy?.name || '-', ins.checklistNumber ? '✓' : '-'
                          ])} />
                      )}
                      {proj.returns?.length > 0 && (
                        <SubTable title={`${t('Returns')} / الإرجاعات`} cols={['Material / المادة', 'Qty / الكمية', 'Date / التاريخ', 'Returned By / أعاده', 'Received By / تسلّمه', 'Reason / السبب']}
                          rows={proj.returns.map((r) => [
                            r.material?.name || '-', r.quantity, r.returnDate ? new Date(r.returnDate).toLocaleDateString() : '-', r.returnedBy?.name || '-', r.receivedBy?.name || '-', r.returnReason || '-'
                          ])} />
                      )}
                      {proj.transfers?.length > 0 && (
                        <SubTable title={`${t('Transfers')} / النقل`} cols={['Material / المادة', 'Qty / الكمية', 'Direction / الاتجاه', 'Other Project / المشروع الآخر', 'Date / التاريخ', 'Transferred By / بواسطة', 'Received By / استلمه']}
                          rows={proj.transfers.map((tr) => [
                            tr.material?.name || '-', tr.quantity, tr.direction === 'in' ? '← In / وارد' : '→ Out / صادر', tr.otherProject?.name || '-', tr.transferDate ? new Date(tr.transferDate).toLocaleDateString() : '-', tr.transferredBy?.name || '-', tr.receivedBy?.name || '-'
                          ])} />
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {!loading && !data && (
        <div className="text-center py-20 text-gray-400">
          <Layers size={48} className="mx-auto mb-3 opacity-30" />
          <p>{t('Click "Load Report" to generate report')} / انقر "تحميل التقرير" لإنشاء التقرير</p>
        </div>
      )}
    </>
  );
}

function SuppliersTab({ filters, setFilters, data, loading, expandedRows, toggleExpand, suppliers, onExport, t }) {
  return (
    <>
      <div className="flex flex-wrap items-end gap-3 mb-6 bg-white rounded-xl border border-gray-200 p-4">
        <FilterInput label={`${t('Supplier')} / المورد`}>
          <select value={filters.supplierId} onChange={(e) => setFilters((f) => ({ ...f, supplierId: e.target.value }))}
            className="px-3 py-1.5 border rounded-lg text-sm">
            <option value="">All / الكل</option>
            {suppliers.map((s) => <option key={s._id || s.id} value={s._id || s.id}>{s.name}</option>)}
          </select>
        </FilterInput>
        <FilterInput label={`${t('Start Date')} / تاريخ البداية`}>
          <input type="date" value={filters.startDate} onChange={(e) => setFilters((f) => ({ ...f, startDate: e.target.value }))}
            className="px-3 py-1.5 border rounded-lg text-sm" />
        </FilterInput>
        <FilterInput label={`${t('End Date')} / تاريخ النهاية`}>
          <input type="date" value={filters.endDate} onChange={(e) => setFilters((f) => ({ ...f, endDate: e.target.value }))}
            className="px-3 py-1.5 border rounded-lg text-sm" />
        </FilterInput>
      </div>

      {loading && <div className="text-center py-12 text-gray-400">{t('Loading...')} / جارٍ التحميل...</div>}

      {!loading && data && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            <SummaryCard icon={Truck} label={`${t('Total Suppliers')} / إجمالي الموردين`} value={data.summary?.totalSuppliers || 0} color="blue" />
            <SummaryCard icon={Package} label={`${t('Total Materials')} / إجمالي المواد`} value={data.summary?.totalMaterials || 0} color="green" />
            <SummaryCard icon={Package} label={`${t('Total Received')} / إجمالي المستلم`} value={data.summary?.totalReceived || 0} color="amber" />
            <SummaryCard icon={Package} label={`${t('Purchase Value')} / قيمة الشراء`} value={formatCurrency(data.summary?.totalPurchaseValue)} color="cyan" />
          </div>

          <div className="flex flex-wrap gap-2 mb-6">
            <ExportButtons onExport={(fmt) => onExport(fmt, 'supplier', filters)} label="Suppliers" />
          </div>

          <div className="space-y-4">
            {(data.suppliers || []).map((sup, i) => {
              const key = `sup-${i}`;
              const isOpen = expandedRows[key];
              return (
                <div key={key} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="flex items-center gap-4 p-4 cursor-pointer hover:bg-gray-50/30 transition-colors"
                    onClick={() => toggleExpand(key)}>
                    <button className="text-gray-400">
                      {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-gray-800">{sup.name}</h3>
                        <span className="text-xs text-gray-400">{sup.supplierCode}</span>
                        {sup.companyName && <span className="text-xs text-gray-500">{sup.companyName}</span>}
                        {sup.status && (
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            sup.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                          }`}>{sup.status}</span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-4 mt-2 text-xs text-gray-500">
                        <span>{t('Materials')} / المواد: <strong className="text-gray-800">{sup.stats?.totalMaterials || 0}</strong></span>
                        <span>{t('Available')} / المتاح: <strong className="text-green-600">{sup.stats?.totalAvailable || 0}</strong></span>
                        <span>{t('Value')} / القيمة: <strong className="text-gray-800">{formatCurrency(sup.stats?.totalValue)}</strong></span>
                        <span>{t('Purchase Value')} / قيمة الشراء: <strong className="text-cyan-600">{formatCurrency(sup.stats?.totalPurchaseValue)}</strong></span>
                        {sup.lowStockCount > 0 && (
                          <span className="flex items-center gap-1"><AlertTriangle size={12} className="text-red-500" />
                            <strong className="text-red-600">{sup.lowStockCount}</strong> {t('Low Stock')} / مخزون منخفض
                          </span>
                        )}
                      </div>
                    </div>
                    <ArrowRight size={16} className={`text-gray-400 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
                  </div>

                  {isOpen && (
                    <div className="border-t border-gray-200 p-4 space-y-4">
                      {sup.materials?.length > 0 && (
                        <SubTable title={`${t('Materials')} / المواد`} cols={['Code / الكود', 'Name / الاسم', 'Category / الفئة', 'Available / المتاح', 'Assigned / المعين', 'Value / القيمة']}
                          rows={sup.materials.map((mt) => [
                            mt.code, mt.name, mt.category, mt.availableQuantity, mt.assignedQuantity, formatCurrency(mt.totalValue)
                          ])} />
                      )}
                      {sup.transactions?.length > 0 && (
                        <SubTable title={`${t('Transactions')} / المعاملات`} cols={['Material / المادة', 'Type / النوع', 'Qty / الكمية', 'Date / التاريخ', 'By / بواسطة']}
                          rows={sup.transactions.map((tx) => [
                            tx.materialName || tx.name, typeBadge(tx.type), tx.quantity, tx.date ? new Date(tx.date).toLocaleDateString() : '-', tx.performedBy || '-'
                          ])} />
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {!loading && !data && (
        <div className="text-center py-20 text-gray-400">
          <Truck size={48} className="mx-auto mb-3 opacity-30" />
          <p>{t('Click "Load Report" to generate report')} / انقر "تحميل التقرير" لإنشاء التقرير</p>
        </div>
      )}
    </>
  );
}

function CombinedTab({ filters, setFilters, data, loading, expandedRows, toggleExpand, projects, suppliers, onExport, t }) {
  const transactionsByType = data?.summary?.transactionsByType || [];
  const chartData = transactionsByType.filter(d => d.count > 0).map(d => ({ name: d.type, count: d.count, totalQty: d.totalQty }));

  return (
    <>
      <div className="flex flex-wrap items-end gap-3 mb-6 bg-white rounded-xl border border-gray-200 p-4">
        <FilterInput label={`${t('Project')} / المشروع`}>
          <select value={filters.projectId} onChange={(e) => setFilters((f) => ({ ...f, projectId: e.target.value }))}
            className="px-3 py-1.5 border rounded-lg text-sm">
            <option value="">All / الكل</option>
            {projects.map((p) => <option key={p._id || p.id} value={p._id || p.id}>{p.name}</option>)}
          </select>
        </FilterInput>
        <FilterInput label={`${t('Supplier')} / المورد`}>
          <select value={filters.supplierId} onChange={(e) => setFilters((f) => ({ ...f, supplierId: e.target.value }))}
            className="px-3 py-1.5 border rounded-lg text-sm">
            <option value="">All / الكل</option>
            {suppliers.map((s) => <option key={s._id || s.id} value={s._id || s.id}>{s.name}</option>)}
          </select>
        </FilterInput>
        <FilterInput label={`${t('Type')} / النوع`}>
          <select value={filters.type} onChange={(e) => setFilters((f) => ({ ...f, type: e.target.value }))}
            className="px-3 py-1.5 border rounded-lg text-sm">
            <option value="">All / الكل</option>
            <option value="receive">Receive / استلام</option>
            <option value="assign">Assign / تعيين</option>
            <option value="install">Install / تركيب</option>
            <option value="return">Return / إرجاع</option>
            <option value="transfer">Transfer / نقل</option>
            <option value="adjustment">Adjustment / تعديل</option>
          </select>
        </FilterInput>
        <FilterInput label={`${t('Start Date')} / تاريخ البداية`}>
          <input type="date" value={filters.startDate} onChange={(e) => setFilters((f) => ({ ...f, startDate: e.target.value }))}
            className="px-3 py-1.5 border rounded-lg text-sm" />
        </FilterInput>
        <FilterInput label={`${t('End Date')} / تاريخ النهاية`}>
          <input type="date" value={filters.endDate} onChange={(e) => setFilters((f) => ({ ...f, endDate: e.target.value }))}
            className="px-3 py-1.5 border rounded-lg text-sm" />
        </FilterInput>
      </div>

      {loading && <div className="text-center py-12 text-gray-400">{t('Loading...')} / جارٍ التحميل...</div>}

      {!loading && data && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
            <SummaryCard icon={Package} label={`${t('Total Materials')} / إجمالي المواد`} value={data.summary?.totalMaterials || 0} color="blue" />
            <SummaryCard icon={BarChart3} label={`${t('Total Transactions')} / إجمالي المعاملات`} value={data.summary?.totalTransactions || 0} color="green" />
            <SummaryCard icon={Package} label={`${t('Installations')} / التركيبات`} value={data.summary?.totalInstallations || 0} color="amber" />
            <SummaryCard icon={Package} label={`${t('Returns')} / الإرجاعات`} value={data.summary?.totalReturns || 0} color="purple" />
            <SummaryCard icon={Package} label={`${t('Transfers')} / النقل`} value={data.summary?.totalTransfers || 0} color="cyan" />
          </div>

          {chartData.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">
                {t('Transaction Breakdown')} / تفاصيل المعاملات حسب النوع
              </h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {chartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="flex flex-wrap gap-2 mb-6">
            <ExportButtons onExport={(fmt) => onExport(fmt, 'combined', filters)} label="Combined" />
          </div>

          <div className="space-y-4">
            {(data.journey || []).map((mat, i) => {
              const key = `comb-${i}`;
              const isOpen = expandedRows[key];
              return (
                <div key={key} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="flex items-center gap-4 p-4 cursor-pointer hover:bg-gray-50/30 transition-colors"
                    onClick={() => toggleExpand(key)}>
                    <button className="text-gray-400">
                      {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-gray-800">{mat.material?.name}</h3>
                        <span className="text-xs text-gray-400">{mat.material?.code}</span>
                        {mat.material?.category && <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">{mat.material?.category}</span>}
                      </div>
                      <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-500">
                        <span>Available / المتاح: <strong className="text-green-600">{mat.stock?.available || 0}</strong></span>
                        <span>Assigned / المعين: <strong className="text-amber-600">{mat.stock?.assigned || 0}</strong></span>
                        <span>Installed / المركّب: <strong className="text-blue-600">{mat.stock?.installed || 0}</strong></span>
                        <span>Returned / المُعاد: <strong className="text-purple-600">{mat.stock?.returned || 0}</strong></span>
                      </div>
                    </div>
                    <ArrowRight size={16} className={`text-gray-400 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
                  </div>

                  {isOpen && (
                    <div className="border-t border-gray-200 p-4 space-y-4">
                      {mat.transactions?.length > 0 && (
                        <SubTable title={`${t('Transactions')} / المعاملات`} cols={['Type / النوع', 'Qty / الكمية', 'Date / التاريخ', 'Project / المشروع', 'By / بواسطة', 'Notes / ملاحظات']}
                          rows={mat.transactions.map((tx) => [
                            typeBadge(tx.type), tx.quantity, tx.date ? new Date(tx.date).toLocaleDateString() : '-',
                            tx.project?.name || '-', tx.performedBy?.name || tx.receivedBy?.name || '-', tx.remarks || '-'
                          ])} />
                      )}
                      {mat.projectUsage?.length > 0 && (
                        <SubTable title={`${t('Project Usage')} / الاستخدام في المشاريع`} cols={['Project / المشروع', 'Assigned / المعين', 'Installed / المركّب', 'Returned / المُعاد', 'Remaining / المتبقي']}
                          rows={mat.projectUsage.map((pu) => [
                            pu.project?.name || '-', pu.assigned, pu.installed, pu.returned, pu.remaining
                          ])} />
                      )}
                      {mat.installations?.length > 0 && (
                        <SubTable title={`${t('Installations')} / التركيبات`} cols={['Project / المشروع', 'Qty / الكمية', 'Date / التاريخ', 'Installed By / بواسطة']}
                          rows={mat.installations.map((ins) => [
                            ins.project?.name || '-', ins.quantity, ins.date ? new Date(ins.date).toLocaleDateString() : '-', ins.installedBy?.name || '-'
                          ])} />
                      )}
                      {mat.returns?.length > 0 && (
                        <SubTable title={`${t('Returns')} / الإرجاعات`} cols={['Project / المشروع', 'Qty / الكمية', 'Date / التاريخ', 'Returned By / أعاده', 'Received By / استلمه', 'Reason / السبب']}
                          rows={mat.returns.map((r) => [
                            r.project?.name || '-', r.quantity, r.date ? new Date(r.date).toLocaleDateString() : '-', r.returnedBy?.name || '-', r.receivedBy?.name || '-', r.reason || '-'
                          ])} />
                      )}
                      {mat.transfers?.length > 0 && (
                        <SubTable title={`${t('Transfers')} / النقل`} cols={['Direction / الاتجاه', 'Qty / الكمية', 'Other Project / المشروع الآخر', 'Date / التاريخ', 'Transferred By / بواسطة', 'Received By / استلمه']}
                          rows={mat.transfers.map((tr) => [
                            tr.direction === 'in' ? '← In / وارد' : '→ Out / صادر', tr.quantity,
                            tr.otherProject?.name || '-', tr.date ? new Date(tr.date).toLocaleDateString() : '-', tr.transferredBy?.name || '-', tr.receivedBy?.name || '-'
                          ])} />
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {!loading && !data && (
        <div className="text-center py-20 text-gray-400">
          <BarChart3 size={48} className="mx-auto mb-3 opacity-30" />
          <p>{t('Click "Load Report" to generate report')} / انقر "تحميل التقرير" لإنشاء التقرير</p>
        </div>
      )}
    </>
  );
}

function SubTable({ title, cols, rows }) {
  return (
    <div>
      <h4 className="text-sm font-semibold text-gray-700 mb-2">{title}</h4>
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-gray-50/50 text-left">
              {cols.map((c, i) => (
                <th key={i} className="px-3 py-2 font-medium text-gray-600">{c}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((row, i) => (
              <tr key={i} className="hover:bg-gray-50/30">
                {row.map((cell, j) => (
                  <td key={j} className="px-3 py-2 text-gray-700">{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
