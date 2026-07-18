import { useState, useEffect } from 'react';
import { Plus, Search, FolderKanban, Edit2, Trash2, Eye, Users } from 'lucide-react';
import { projectApi } from '../../api/project.api';
import { userApi } from '../../api/user.api';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

const statusColors = {
  planning: 'bg-slate-100 text-slate-700',
  active: 'bg-emerald-100 text-emerald-700',
  on_hold: 'bg-amber-100 text-amber-700',
  completed: 'bg-blue-100 text-blue-700',
  cancelled: 'bg-red-100 text-red-700',
};

const priorityColors = {
  low: 'bg-slate-100 text-slate-600',
  medium: 'bg-blue-100 text-blue-700',
  high: 'bg-amber-100 text-amber-700',
  critical: 'bg-red-100 text-red-700',
};

export default function ProjectList() {
  const { t } = useTranslation();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [showForm, setShowForm] = useState(false);
  const [editingProject, setEditingProject] = useState(null);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const { data } = await projectApi.getAll({ page, limit: 10, search });
      setProjects(data.data);
      setPagination(data.pagination);
    } catch (err) {
      toast.error(t('projects.failedToLoad'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [page, search]);

  const handleDelete = async (id) => {
    if (!confirm(t('projects.confirmDelete'))) return;
    try {
      await projectApi.delete(id);
      toast.success(t('projects.projectDeleted'));
      fetchProjects();
    } catch (err) {
      toast.error(err.response?.data?.message || t('projects.failedToDelete'));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">{t('projects.title')}</h2>
          <p className="text-slate-500 text-sm mt-1">{t('projects.manageYourProjects')}</p>
        </div>
        <button
          onClick={() => { setEditingProject(null); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
        >
          <Plus size={16} /> {t('projects.newProject')}
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200">
        <div className="p-4 border-b border-slate-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder={t('projects.searchProjects')}
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left px-4 py-3 font-medium text-slate-600">{t('projects.projectID')}</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">{t('projects.name')}</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">{t('projects.clientName')}</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">{t('projects.siteName')}</th>
                <th className="text-center px-4 py-3 font-medium text-slate-600">{t('projects.team')}</th>
                <th className="text-center px-4 py-3 font-medium text-slate-600">{t('app.status')}</th>
                <th className="text-center px-4 py-3 font-medium text-slate-600">{t('projects.priority')}</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">{t('projects.startDate')}</th>
                <th className="text-right px-4 py-3 font-medium text-slate-600">{t('projects.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
              <tr><td colSpan="9" className="text-center py-8 text-slate-400">{t('app.loading')}</td></tr>
              ) : projects.length === 0 ? (
              <tr><td colSpan="9" className="text-center py-8 text-slate-400">{t('app.noData')}</td></tr>
              ) : (
                projects.map((p) => (
                  <tr key={p._id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">{p.projectId}</td>
                    <td className="px-4 py-3 font-medium text-slate-800">{p.name}</td>
                    <td className="px-4 py-3 text-slate-600">{p.clientName || '-'}</td>
                    <td className="px-4 py-3 text-slate-600">{p.siteName || '-'}</td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Users size={12} className="text-slate-400" />
                        <span className="text-sm text-slate-600">{p.assignedTeam?.length || 0}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[p.status]}`}>
                        {p.status?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${priorityColors[p.priority]}`}>
                        {p.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 text-xs">
                      {p.startDate ? new Date(p.startDate).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          to={`/projects/${p._id}`}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded"
                        >
                          <Eye size={14} />
                        </Link>
                        <button
                          onClick={() => { setEditingProject(p); setShowForm(true); }}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(p._id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-slate-100 rounded"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
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
              {t('projects.showing')} {((page - 1) * 10) + 1} {t('projects.to')} {Math.min(page * 10, pagination.total)} {t('projects.of')} {pagination.total}
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
        <ProjectForm
          project={editingProject}
          onClose={() => { setShowForm(false); setEditingProject(null); }}
          onSuccess={() => { setShowForm(false); setEditingProject(null); fetchProjects(); }}
        />
      )}
    </div>
  );
}

function ProjectForm({ project, onClose, onSuccess }) {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    name: project?.name || '',
    clientName: project?.clientName || '',
    siteName: project?.siteName || '',
    siteAddress: project?.siteAddress || '',
    city: project?.city || '',
    state: project?.state || '',
    country: project?.country || '',
    status: project?.status || 'planning',
    priority: project?.priority || 'medium',
    startDate: project?.startDate?.split('T')[0] || '',
    expectedCompletionDate: project?.expectedCompletionDate?.split('T')[0] || '',
    description: project?.description || '',
    notes: project?.notes || '',
  });
  const [team, setTeam] = useState(
    project?.assignedTeam?.map((t) => ({
      user: t.user?._id || t.user,
      role: t.role,
      name: t.user?.name || '',
    })) || []
  );
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    userApi.getAll({ limit: 100 }).then(({ data }) => setUsers(data.data));
  }, []);

  const addTeamMember = () => {
    setTeam([...team, { user: '', role: 'team_member', name: '' }]);
  };

  const removeTeamMember = (index) => {
    setTeam(team.filter((_, i) => i !== index));
  };

  const updateTeamMember = (index, field, value) => {
    const updated = [...team];
    updated[index] = { ...updated[index], [field]: value };
    if (field === 'user') {
      const u = users.find((u) => u._id === value);
      updated[index].name = u?.name || '';
    }
    setTeam(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...form,
        assignedTeam: team.filter((t) => t.user).map((t) => ({ user: t.user, role: t.role })),
      };
      if (project) {
        await projectApi.update(project._id, payload);
        toast.success(t('projects.projectUpdated'));
      } else {
        await projectApi.create(payload);
        toast.success(t('projects.projectCreated'));
      }
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || t('projects.failedToSave'));
    } finally {
      setLoading(false);
    }
  };

  const teamRoleColors = {
    project_manager: 'bg-blue-100 text-blue-700',
    site_engineer: 'bg-amber-100 text-amber-700',
    inventory_manager: 'bg-emerald-100 text-emerald-700',
    team_member: 'bg-slate-100 text-slate-600',
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-200">
          <h3 className="text-lg font-semibold">{project ? t('projects.editProject') : t('projects.newProject')}</h3>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">{t('projects.projectName')} *</label>
              <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t('projects.clientName')}</label>
              <input type="text" value={form.clientName} onChange={(e) => setForm({ ...form, clientName: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t('projects.siteName')}</label>
              <input type="text" value={form.siteName} onChange={(e) => setForm({ ...form, siteName: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">{t('projects.siteAddress')}</label>
              <input type="text" value={form.siteAddress} onChange={(e) => setForm({ ...form, siteAddress: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t('projects.city')}</label>
              <input type="text" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t('projects.state')}</label>
              <input type="text" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t('projects.country')}</label>
              <input type="text" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t('app.status')}</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none">
                <option value="planning">{t('projects.planning')}</option>
                <option value="active">{t('projects.active')}</option>
                <option value="on_hold">{t('projects.onHold')}</option>
                <option value="completed">{t('projects.completed')}</option>
                <option value="cancelled">{t('projects.cancelled')}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t('projects.priority')}</label>
              <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none">
                <option value="low">{t('projects.low')}</option>
                <option value="medium">{t('projects.medium')}</option>
                <option value="high">{t('projects.high')}</option>
                <option value="critical">{t('projects.critical')}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t('projects.startDate')}</label>
              <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t('projects.expectedCompletion')}</label>
              <input type="date" value={form.expectedCompletionDate} onChange={(e) => setForm({ ...form, expectedCompletionDate: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">{t('projects.description')}</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">{t('projects.notes')}</label>
              <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
            </div>
          </div>

          <div className="border-t border-slate-200 pt-4">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                <Users size={16} /> {t('projects.projectTeam')}
              </label>
              <button type="button" onClick={addTeamMember}
                className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs hover:bg-blue-700">
                <Plus size={12} /> {t('projects.addMember')}
              </button>
            </div>
            {team.length === 0 ? (
              <p className="text-xs text-slate-400 py-2">{t('projects.noTeam')}</p>
            ) : (
              <div className="space-y-2">
                {team.map((member, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                    <select value={member.user} onChange={(e) => updateTeamMember(i, 'user', e.target.value)}
                      className="flex-1 px-2 py-1.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none">
                      <option value="">{t('projects.selectUser')}</option>
                      {users.map((u) => (
                        <option key={u._id} value={u._id}>{u.name} ({u.role?.replace('_', ' ')})</option>
                      ))}
                    </select>
                    <select value={member.role} onChange={(e) => updateTeamMember(i, 'role', e.target.value)}
                      className={`px-2 py-1.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none`}>
                      <option value="project_manager">{t('projects.projectManager')}</option>
                      <option value="site_engineer">{t('projects.siteEngineer')}</option>
                      <option value="inventory_manager">{t('projects.inventoryManager')}</option>
                      <option value="team_member">{t('projects.teamMember')}</option>
                    </select>
                    <button type="button" onClick={() => removeTeamMember(i)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm">{t('app.cancel')}</button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">
              {loading ? t('app.saving') : t('app.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
