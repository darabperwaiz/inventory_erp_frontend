import { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, UserCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { userApi } from '../../api/user.api';
import { useTranslation } from 'react-i18next';
import { useConfirm } from '../../components/ConfirmModal';

const roleColors = {
  admin: 'bg-red-100 text-red-700',
  project_manager: 'bg-blue-100 text-blue-700',
  inventory_manager: 'bg-emerald-100 text-emerald-700',
  site_engineer: 'bg-amber-100 text-amber-700',
  viewer: 'bg-slate-100 text-slate-600',
};

const roleKeys = {
  admin: 'users.admin',
  project_manager: 'users.projectManager',
  inventory_manager: 'users.inventoryManager',
  site_engineer: 'users.siteEngineer',
  viewer: 'users.viewer',
};

const scopeColors = {
  global: 'bg-purple-100 text-purple-700',
  project_specific: 'bg-blue-100 text-blue-700',
  company: 'bg-orange-100 text-orange-700',
};

const scopeLabels = {
  global: 'Global',
  project_specific: 'Project Specific',
  company: 'Company',
};

const scopeTranslationKeys = {
  global: 'users.scopeGlobal',
  project_specific: 'users.scopeProjectSpecific',
  company: 'users.scopeCompany',
};

export default function UserList() {
  const { t } = useTranslation();
  const { confirm, ConfirmModal } = useConfirm();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data } = await userApi.getAll({ page, limit: 10, search });
      setUsers(data.data);
      setPagination(data.pagination);
    } catch {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    const handler = () => fetchUsers();
    window.addEventListener('app:refresh', handler);
    return () => window.removeEventListener('app:refresh', handler);
  }, [page, search]);

  const handleDelete = async (id) => {
    const ok = await confirm(t('users.deactivate'), null, t('app.confirm'));
    if (!ok) return;
    try {
      await userApi.delete(id);
      toast.success('User deactivated');
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">{t('users.title')}</h2>
          <p className="text-slate-500 text-sm mt-1">Manage user accounts, roles and access scope</p>
        </div>
        <button
          onClick={() => { setEditingUser(null); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
        >
          <Plus size={16} /> {t('users.addUser')}
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200">
        <div className="p-4 border-b border-slate-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder={t('users.searchUsers')}
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left px-4 py-3 font-medium text-slate-600">ID</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">{t('users.userName')}</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">{t('users.userEmail')}</th>
                <th className="text-center px-4 py-3 font-medium text-slate-600">{t('users.userRole')}</th>
                <th className="text-center px-4 py-3 font-medium text-slate-600">Scope</th>
                <th className="text-center px-4 py-3 font-medium text-slate-600">Status</th>
                <th className="text-right px-4 py-3 font-medium text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7" className="text-center py-8 text-slate-400">Loading...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan="7" className="text-center py-8 text-slate-400">No users found</td></tr>
              ) : (
                users.map((u) => (
                  <tr key={u._id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">{u.userId}</td>
                    <td className="px-4 py-3 font-medium text-slate-800">{u.name}</td>
                    <td className="px-4 py-3 text-slate-600">{u.email}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${roleColors[u.role]}`}>
                        {t(roleKeys[u.role] || u.role)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${scopeColors[u.scope] || scopeColors.project_specific}`}>
                        {t(scopeTranslationKeys[u.scope] || scopeTranslationKeys.project_specific)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                        u.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {u.isActive ? t('users.isActive') : t('users.inactive')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => { setEditingUser(u); setShowForm(true); }}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(u._id)}
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
              Page {pagination.page} of {pagination.pages}
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
        <UserForm
          user={editingUser}
          onClose={() => { setShowForm(false); setEditingUser(null); }}
          onSuccess={() => { setShowForm(false); setEditingUser(null); fetchUsers(); }}
        />
      )}

      {ConfirmModal}
    </div>
  );
}

function UserForm({ user, onClose, onSuccess }) {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    password: '',
    role: user?.role || 'viewer',
    scope: user?.scope || 'project_specific',
    phone: user?.phone || '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (user) {
        await userApi.update(user._id, form);
        toast.success('User updated');
      } else {
        await userApi.create(form);
        toast.success('User created');
      }
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally {
      setLoading(false);
    }
  };

  const scopeOptions = {
    admin: ['global'],
    project_manager: ['global', 'project_specific'],
    inventory_manager: ['global', 'project_specific', 'company'],
    site_engineer: ['global', 'project_specific'],
    viewer: ['global', 'project_specific'],
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-full sm:max-w-md">
        <div className="p-4 sm:p-6 border-b border-slate-200">
          <h3 className="text-lg font-semibold">{user ? t('users.editUser') : t('users.addUser')}</h3>
        </div>
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t('users.userName')} *</label>
            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t('users.userEmail')} *</label>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" required />
          </div>
          {!user && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Password *</label>
              <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" required minLength={6} />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t('users.userRole')} *</label>
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value, scope: scopeOptions[e.target.value]?.includes(form.scope) ? form.scope : scopeOptions[e.target.value]?.[0] || 'project_specific' })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none">
              <option value="admin">{t('users.admin')}</option>
              <option value="project_manager">{t('users.projectManager')}</option>
              <option value="inventory_manager">{t('users.inventoryManager')}</option>
              <option value="site_engineer">{t('users.siteEngineer')}</option>
              <option value="viewer">{t('users.viewer')}</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Access Scope *</label>
            <select value={form.scope} onChange={(e) => setForm({ ...form, scope: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none">
              {(scopeOptions[form.role] || ['project_specific']).map((s) => (
                <option key={s} value={s}>{scopeLabels[s]}</option>
              ))}
            </select>
            <p className="text-xs text-slate-500 mt-1">
              {form.scope === 'global' && 'Can access all projects and inventory across the organization'}
              {form.scope === 'project_specific' && 'Can only access assigned projects'}
              {form.scope === 'company' && 'Can access company-level inventory only'}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
            <input type="text" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm">Cancel</button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
