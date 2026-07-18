import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Package, Users, Calendar, MapPin, Plus, Wrench, RotateCcw, ArrowRightLeft, Upload, FileText, Download, Trash2, ClipboardList, X } from 'lucide-react';
import { projectApi } from '../../api/project.api';
import { materialApi } from '../../api/material.api';
import { fileApi } from '../../api/file.api';
import { approvalApi } from '../../api/approval.api';
import useAuthStore from '../../store/authStore';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

const statusColors = {
  planning: 'bg-slate-100 text-slate-700',
  active: 'bg-emerald-100 text-emerald-700',
  on_hold: 'bg-amber-100 text-amber-700',
  completed: 'bg-blue-100 text-blue-700',
  cancelled: 'bg-red-100 text-red-700',
};

export default function ProjectDetail() {
  const { t } = useTranslation();
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [summary, setSummary] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAssign, setShowAssign] = useState(false);
  const [showInstall, setShowInstall] = useState(false);
  const [showReturn, setShowReturn] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const [showRequest, setShowRequest] = useState(false);
  const [files, setFiles] = useState([]);
  const { user } = useAuthStore();
  const canDirectAssign = ['admin', 'project_manager'].includes(user?.role);

  const fetchFiles = async () => {
    try {
      const { data } = await fileApi.getFiles({ relatedTo: 'project', relatedId: id });
      setFiles(data.data);
    } catch {}
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', 'document');
    formData.append('relatedTo', 'project');
    formData.append('relatedId', id);
    try {
      await fileApi.upload(formData);
      toast.success(t('projects.fileUploaded'));
      fetchFiles();
    } catch (err) {
      toast.error(err.response?.data?.message || t('projects.uploadFailed'));
    }
  };

  const handleFileDelete = async (fileId) => {
    if (!confirm(t('projects.confirmDeleteFile'))) return;
    try {
      await fileApi.delete(fileId);
      toast.success(t('projects.fileDeleted'));
      fetchFiles();
    } catch { toast.error(t('app.failed')); }
  };

  const fetchData = async () => {
    try {
      const [dashRes, matRes, timeRes] = await Promise.all([
        projectApi.getDashboard(id),
        projectApi.getMaterials(id),
        projectApi.getTimeline(id),
      ]);
      setProject(dashRes.data.data.project);
      setSummary(dashRes.data.data.materialSummary);
      setMaterials(matRes.data.data);
      setTimeline(timeRes.data.data);
      fetchFiles();
    } catch (err) {
      toast.error(t('projects.failedToLoad'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [id]);

  if (loading) return <div className="text-center py-8 text-slate-400">{t('app.loading')}</div>;
  if (!project) return <div className="text-center py-8 text-slate-400">{t('projects.notFound')}</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/projects" className="p-2 hover:bg-slate-100 rounded-lg">
          <ArrowLeft size={20} className="text-slate-600" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-slate-800">{project.name}</h2>
            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[project.status]}`}>
              {project.status?.replace('_', ' ')}
            </span>
          </div>
          <p className="text-slate-500 text-sm mt-1">{project.projectId}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-800 mb-4">{t('projects.projectInformation')}</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-slate-500">{t('projects.clientName')}:</span> <span className="font-medium ml-2">{project.clientName || '-'}</span></div>
              <div><span className="text-slate-500">{t('projects.priority')}:</span> <span className="font-medium ml-2 capitalize">{project.priority}</span></div>
              <div><span className="text-slate-500">{t('projects.siteName')}:</span> <span className="font-medium ml-2">{project.siteName || '-'}</span></div>
              <div><span className="text-slate-500">{t('projects.startDate')}:</span> <span className="font-medium ml-2">{project.startDate ? new Date(project.startDate).toLocaleDateString() : '-'}</span></div>
              <div className="col-span-2"><span className="text-slate-500">{t('projects.address')}:</span> <span className="font-medium ml-2">{[project.siteAddress, project.city, project.state, project.country].filter(Boolean).join(', ') || '-'}</span></div>
              {project.description && <div className="col-span-2"><span className="text-slate-500">{t('projects.description')}:</span> <span className="ml-2">{project.description}</span></div>}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-semibold text-slate-800">{t('projects.materials')}</h3>
              <div className="flex gap-2">
                {!canDirectAssign && (
                  <button onClick={() => setShowRequest(true)} className="flex items-center gap-1 px-3 py-1.5 bg-amber-600 text-white rounded-lg text-xs hover:bg-amber-700">
                    <ClipboardList size={14} /> {t('projects.request')}
                  </button>
                )}
                {canDirectAssign && (
                  <button onClick={() => setShowAssign(true)} className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs hover:bg-blue-700">
                    <Plus size={14} /> {t('projects.assign')}
                  </button>
                )}
                <button onClick={() => setShowInstall(true)} className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs hover:bg-emerald-700">
                  <Wrench size={14} /> {t('projects.install')}
                </button>
                <button onClick={() => setShowReturn(true)} className="flex items-center gap-1 px-3 py-1.5 bg-purple-600 text-white rounded-lg text-xs hover:bg-purple-700">
                  <RotateCcw size={14} /> {t('projects.return')}
                </button>
                <button onClick={() => setShowTransfer(true)} className="flex items-center gap-1 px-3 py-1.5 bg-cyan-600 text-white rounded-lg text-xs hover:bg-cyan-700">
                  <ArrowRightLeft size={14} /> {t('projects.transfer')}
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="text-left px-4 py-3 font-medium text-slate-600">{t('projects.material')}</th>
                    <th className="text-right px-4 py-3 font-medium text-slate-600">{t('projects.assigned')}</th>
                    <th className="text-right px-4 py-3 font-medium text-slate-600">{t('projects.installed')}</th>
                    <th className="text-right px-4 py-3 font-medium text-slate-600">{t('projects.returned')}</th>
                    <th className="text-right px-4 py-3 font-medium text-slate-600">{t('projects.remaining')}</th>
                    <th className="text-center px-4 py-3 font-medium text-slate-600">{t('app.status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {materials.length === 0 ? (
                    <tr><td colSpan="6" className="text-center py-8 text-slate-400">{t('projects.noMaterials')}</td></tr>
                  ) : (
                    materials.map((pm) => {
                      const remaining = pm.assignedQuantity - pm.installedQuantity - pm.returnedQuantity - pm.transferredOutQuantity;
                      return (
                        <tr key={pm._id} className="border-b border-slate-100">
                          <td className="px-4 py-3">
                            <div className="font-medium text-slate-800">{pm.material?.name}</div>
                            <div className="text-xs text-slate-500">{pm.material?.materialCode}</div>
                          </td>
                          <td className="px-4 py-3 text-right">{pm.assignedQuantity}</td>
                          <td className="px-4 py-3 text-right text-emerald-600">{pm.installedQuantity}</td>
                          <td className="px-4 py-3 text-right text-purple-600">{pm.returnedQuantity}</td>
                          <td className="px-4 py-3 text-right font-medium">{remaining}</td>
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                              pm.status === 'active' ? 'bg-amber-100 text-amber-700' :
                              pm.status === 'fully_installed' ? 'bg-emerald-100 text-emerald-700' :
                              'bg-slate-100 text-slate-600'
                            }`}>
                              {pm.status?.replace('_', ' ')}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {summary && (
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h3 className="font-semibold text-slate-800 mb-4">{t('projects.materialSummary')}</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm"><span className="text-slate-500">{t('projects.totalAssigned')}</span><span className="font-medium">{summary.totalAssigned}</span></div>
                <div className="flex justify-between text-sm"><span className="text-slate-500">{t('projects.totalInstalled')}</span><span className="font-medium text-emerald-600">{summary.totalInstalled}</span></div>
                <div className="flex justify-between text-sm"><span className="text-slate-500">{t('projects.totalReturned')}</span><span className="font-medium text-purple-600">{summary.totalReturned}</span></div>
                <div className="flex justify-between text-sm"><span className="text-slate-500">{t('projects.totalTransferred')}</span><span className="font-medium text-cyan-600">{summary.totalTransferred}</span></div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-800 mb-4">{t('projects.team')}</h3>
            <div className="space-y-2">
              {project.assignedTeam?.length > 0 ? (
                project.assignedTeam.map((member, i) => {
                  const u = member.user || member;
                  const projectRole = member.role || 'team_member';
                  const roleColors = {
                    project_manager: 'bg-blue-100 text-blue-700',
                    site_engineer: 'bg-amber-100 text-amber-700',
                    inventory_manager: 'bg-emerald-100 text-emerald-700',
                    team_member: 'bg-slate-100 text-slate-600',
                  };
                  const roleBg = {
                    project_manager: 'bg-blue-600',
                    site_engineer: 'bg-amber-500',
                    inventory_manager: 'bg-emerald-500',
                    team_member: 'bg-slate-400',
                  };
                  return (
                    <div key={i} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className={`w-7 h-7 ${roleBg[projectRole] || 'bg-slate-400'} rounded-full flex items-center justify-center text-white text-xs`}>
                          {u.name?.charAt(0)}
                        </div>
                        <div>
                          <div className="text-sm font-medium">{u.name}</div>
                          <div className="text-xs text-slate-500">{u.userId}</div>
                        </div>
                      </div>
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${roleColors[projectRole] || roleColors.team_member}`}>
                        {projectRole.replace('_', ' ')}
                      </span>
                    </div>
                  );
                })
              ) : project.projectManager ? (
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs">
                    {project.projectManager.name?.charAt(0)}
                  </div>
                  <div>
                    <div className="font-medium">{project.projectManager.name}</div>
                    <div className="text-xs text-slate-500">{t('projects.projectManager')}</div>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-400">{t('projects.noTeam')}</p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-800">{t('projects.documents')}</h3>
              <label className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs hover:bg-slate-200 cursor-pointer">
                <Upload size={14} /> {t('projects.upload')}
                <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx" onChange={handleFileUpload} />
              </label>
            </div>
            {files.length === 0 ? (
              <div className="text-center py-4 text-slate-400 text-sm">{t('projects.noDocuments')}</div>
            ) : (
              <div className="space-y-2">
                {files.map((f) => (
                  <div key={f._id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <FileText size={16} className="text-slate-400" />
                      <div>
                        <div className="text-sm font-medium">{f.originalName}</div>
                        <div className="text-xs text-slate-500">{f.category} • {(f.size / 1024).toFixed(1)} KB</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <a href={fileApi.download(f._id)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded">
                        <Download size={14} />
                      </a>
                      <button onClick={() => handleFileDelete(f._id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-slate-100 rounded">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-800 mb-4">{t('projects.recentActivity')}</h3>
            {timeline.length === 0 ? (
              <div className="text-center py-4 text-slate-400 text-sm">{t('projects.noActivity')}</div>
            ) : (
              <div className="space-y-3">
                {timeline.slice(0, 5).map((t) => (
                  <div key={t._id} className="flex items-start gap-2 text-sm">
                    <div className={`w-2 h-2 rounded-full mt-1.5 ${
                      t.type === 'receive' ? 'bg-emerald-500' :
                      t.type === 'assign' ? 'bg-amber-500' :
                      t.type === 'install' ? 'bg-blue-500' :
                      t.type === 'return' ? 'bg-purple-500' : 'bg-cyan-500'
                    }`} />
                    <div>
                      <div><span className="font-medium capitalize">{t.type}</span> {t.quantity} {t.material?.name}</div>
                      <div className="text-xs text-slate-500">{new Date(t.date || t.createdAt).toLocaleDateString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {showAssign && <AssignMaterialModal projectId={id} onClose={() => setShowAssign(false)} onSuccess={() => { setShowAssign(false); fetchData(); }} />}
      {showInstall && <InstallModal materials={materials} onClose={() => setShowInstall(false)} onSuccess={() => { setShowInstall(false); fetchData(); }} />}
      {showReturn && <ReturnModal materials={materials} onClose={() => setShowReturn(false)} onSuccess={() => { setShowReturn(false); fetchData(); }} />}
      {showTransfer && <TransferModal projectId={id} materials={materials} onClose={() => setShowTransfer(false)} onSuccess={() => { setShowTransfer(false); fetchData(); }} />}
      {showRequest && <RequestMaterialModal projectId={id} onClose={() => setShowRequest(false)} onSuccess={() => { setShowRequest(false); toast.success(t('projects.requestSubmitted')); }} />}
    </div>
  );
}

function AssignMaterialModal({ projectId, onClose, onSuccess }) {
  const { t } = useTranslation();
  const [allMaterials, setAllMaterials] = useState([]);
  const [form, setForm] = useState({ materialId: '', quantity: '', checklistNumber: '', issueVoucherNumber: '', receivedBy: '', remarks: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => { materialApi.getAll({ limit: 100 }).then(({ data }) => setAllMaterials(data.data)); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await projectApi.assignMaterial({ ...form, projectId, quantity: Number(form.quantity) });
      toast.success(t('projects.materialAssigned'));
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || t('app.failed'));
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-lg">
        <div className="p-6 border-b border-slate-200"><h3 className="text-lg font-semibold">{t('projects.assignMaterial')}</h3></div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t('projects.material')} *</label>
            <select value={form.materialId} onChange={(e) => setForm({ ...form, materialId: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" required>
              <option value="">{t('projects.selectMaterial')}</option>
              {allMaterials.map((m) => <option key={m._id} value={m._id}>{m.materialCode} - {m.name} ({t('projects.available')}: {m.availableQuantity})</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t('projects.quantity')} *</label>
              <input type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" required min="1" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t('projects.checklistNo')}</label>
              <input type="text" value={form.checklistNumber} onChange={(e) => setForm({ ...form, checklistNumber: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t('projects.issueVoucherNo')}</label>
              <input type="text" value={form.issueVoucherNumber} onChange={(e) => setForm({ ...form, issueVoucherNumber: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t('projects.receivedBy')}</label>
              <input type="text" value={form.receivedBy} onChange={(e) => setForm({ ...form, receivedBy: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t('projects.remarks')}</label>
            <textarea value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} rows={2}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm">{t('app.cancel')}</button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">
              {loading ? t('projects.assigning') : t('projects.assign')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function InstallModal({ materials, onClose, onSuccess }) {
  const { t } = useTranslation();
  const [form, setForm] = useState({ projectMaterialId: '', installationDate: new Date().toISOString().split('T')[0], installedQuantity: '', checklistNumber: '', remarks: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { transactionApi } = await import('../../api/transaction.api');
      await transactionApi.recordInstallation({ ...form, installedQuantity: Number(form.installedQuantity) });
      toast.success(t('projects.installationRecorded'));
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || t('app.failed'));
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-lg">
        <div className="p-6 border-b border-slate-200"><h3 className="text-lg font-semibold">{t('projects.recordInstallation')}</h3></div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t('projects.material')} *</label>
            <select value={form.projectMaterialId} onChange={(e) => setForm({ ...form, projectMaterialId: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" required>
              <option value="">{t('projects.selectMaterial')}</option>
              {materials.filter((m) => m.status === 'active').map((m) => (
                <option key={m._id} value={m._id}>{m.material?.name} ({t('projects.remaining')}: {m.assignedQuantity - m.installedQuantity - m.returnedQuantity - m.transferredOutQuantity})</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t('projects.installationDate')}</label>
              <input type="date" value={form.installationDate} onChange={(e) => setForm({ ...form, installationDate: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t('projects.quantity')} *</label>
              <input type="number" value={form.installedQuantity} onChange={(e) => setForm({ ...form, installedQuantity: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" required min="1" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t('projects.checklistNo')}</label>
            <input type="text" value={form.checklistNumber} onChange={(e) => setForm({ ...form, checklistNumber: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t('projects.remarks')}</label>
            <textarea value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} rows={2}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm">{t('app.cancel')}</button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700 disabled:opacity-50">
              {loading ? t('projects.recording') : t('projects.record')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ReturnModal({ materials, onClose, onSuccess }) {
  const { t } = useTranslation();
  const [form, setForm] = useState({ projectMaterialId: '', returnDate: new Date().toISOString().split('T')[0], quantity: '', returnReason: '', remarks: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { transactionApi } = await import('../../api/transaction.api');
      await transactionApi.recordReturn({ ...form, quantity: Number(form.quantity) });
      toast.success(t('projects.returnRecorded'));
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || t('app.failed'));
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-lg">
        <div className="p-6 border-b border-slate-200"><h3 className="text-lg font-semibold">{t('projects.returnMaterial')}</h3></div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t('projects.material')} *</label>
            <select value={form.projectMaterialId} onChange={(e) => setForm({ ...form, projectMaterialId: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" required>
              <option value="">{t('projects.selectMaterial')}</option>
              {materials.filter((m) => m.status === 'active').map((m) => (
                <option key={m._id} value={m._id}>{m.material?.name} ({t('projects.remaining')}: {m.assignedQuantity - m.installedQuantity - m.returnedQuantity - m.transferredOutQuantity})</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t('projects.returnDate')}</label>
              <input type="date" value={form.returnDate} onChange={(e) => setForm({ ...form, returnDate: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t('projects.quantity')} *</label>
              <input type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" required min="1" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t('projects.returnReason')}</label>
            <input type="text" value={form.returnReason} onChange={(e) => setForm({ ...form, returnReason: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t('projects.remarks')}</label>
            <textarea value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} rows={2}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm">{t('app.cancel')}</button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 disabled:opacity-50">
              {loading ? t('projects.returning') : t('projects.return')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function TransferModal({ projectId, materials, onClose, onSuccess }) {
  const { t } = useTranslation();
  const [projects, setProjects] = useState([]);
  const [form, setForm] = useState({ destinationProjectId: '', materialId: '', quantity: '', transferDate: new Date().toISOString().split('T')[0], remarks: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => { projectApi.getAll({ limit: 100 }).then(({ data }) => setProjects(data.data.filter((p) => p._id !== projectId))); }, [projectId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { transactionApi } = await import('../../api/transaction.api');
      await transactionApi.recordTransfer({ ...form, sourceProjectId: projectId, quantity: Number(form.quantity) });
      toast.success(t('projects.transferRecorded'));
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || t('app.failed'));
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-lg">
        <div className="p-6 border-b border-slate-200"><h3 className="text-lg font-semibold">{t('projects.transferMaterial')}</h3></div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t('projects.destinationProject')} *</label>
            <select value={form.destinationProjectId} onChange={(e) => setForm({ ...form, destinationProjectId: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" required>
              <option value="">{t('projects.selectProject')}</option>
              {projects.map((p) => <option key={p._id} value={p._id}>{p.projectId} - {p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t('projects.material')} *</label>
            <select value={form.materialId} onChange={(e) => setForm({ ...form, materialId: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" required>
              <option value="">{t('projects.selectMaterial')}</option>
              {materials.filter((m) => m.status === 'active').map((m) => (
                <option key={m.material?._id} value={m.material?._id}>{m.material?.name} ({t('projects.remaining')}: {m.assignedQuantity - m.installedQuantity - m.returnedQuantity - m.transferredOutQuantity})</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t('projects.quantity')} *</label>
              <input type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" required min="1" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t('projects.transferDate')}</label>
              <input type="date" value={form.transferDate} onChange={(e) => setForm({ ...form, transferDate: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t('projects.remarks')}</label>
            <textarea value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} rows={2}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm">{t('app.cancel')}</button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-cyan-600 text-white rounded-lg text-sm hover:bg-cyan-700 disabled:opacity-50">
              {loading ? t('projects.transferring') : t('projects.transfer')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function RequestMaterialModal({ projectId, onClose, onSuccess }) {
  const { t } = useTranslation();
  const [allMaterials, setAllMaterials] = useState([]);
  const [form, setForm] = useState({ materialId: '', quantity: '', purpose: '', urgency: 'medium' });
  const [loading, setLoading] = useState(false);

  useEffect(() => { materialApi.getAll({ limit: 100 }).then(({ data }) => setAllMaterials(data.data)); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await approvalApi.createRequest({ ...form, projectId, quantity: Number(form.quantity) });
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || t('projects.failedToSubmitRequest'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold">{t('projects.requestMaterial')}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t('projects.material')} *</label>
            <select value={form.materialId} onChange={(e) => setForm({ ...form, materialId: e.target.value })} required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none">
              <option value="">{t('projects.selectMaterial')}</option>
              {allMaterials.map((m) => (
                <option key={m._id} value={m._id}>{m.materialCode} - {m.name} ({t('projects.available')}: {m.availableQuantity})</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t('projects.quantity')} *</label>
              <input type="number" min="1" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t('projects.urgency')}</label>
              <select value={form.urgency} onChange={(e) => setForm({ ...form, urgency: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none">
                <option value="low">{t('projects.low')}</option>
                <option value="medium">{t('projects.medium')}</option>
                <option value="high">{t('projects.high')}</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t('projects.purpose')}</label>
            <textarea value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} rows={2}
              placeholder={t('projects.whyNeeded')}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg text-sm">{t('app.cancel')}</button>
            <button type="submit" disabled={loading} className="px-4 py-1.5 bg-amber-600 text-white rounded-lg text-sm hover:bg-amber-700 disabled:opacity-50">
              {loading ? t('projects.submitting') : t('projects.submitRequest')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
