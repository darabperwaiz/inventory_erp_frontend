import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderKanban,
  Package,
  BarChart3,
  Users,
  ScrollText,
  Settings,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  AlertTriangle,
} from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import useAuthStore from '../../store/authStore';

export default function Sidebar() {
  const { t } = useTranslation();
  const [collapsed, setCollapsed] = useState(false);
  const { user } = useAuthStore();

  const navItems = [
    { to: '/', icon: LayoutDashboard, label: t('nav.dashboard'), roles: ['admin', 'project_manager', 'inventory_manager', 'site_engineer', 'viewer'] },
    { to: '/projects', icon: FolderKanban, label: t('nav.projects'), roles: ['admin', 'project_manager', 'inventory_manager', 'site_engineer', 'viewer'] },
    { to: '/inventory', icon: Package, label: t('nav.inventory'), roles: ['admin', 'project_manager', 'inventory_manager', 'site_engineer', 'viewer'] },
    { to: '/reports', icon: BarChart3, label: t('nav.reports'), roles: ['admin', 'project_manager', 'inventory_manager', 'site_engineer', 'viewer'] },
    { to: '/approvals', icon: ClipboardCheck, label: t('nav.approvals'), roles: ['admin', 'project_manager'] },
    { to: '/reorder-alerts', icon: AlertTriangle, label: t('nav.reorderAlerts'), roles: ['admin', 'inventory_manager'] },
    { to: '/users', icon: Users, label: t('nav.users'), roles: ['admin'] },
    { to: '/audit-logs', icon: ScrollText, label: t('nav.auditLogs'), roles: ['admin'] },
    { to: '/settings', icon: Settings, label: t('nav.settings'), roles: ['admin'] },
  ];

  const filtered = navItems.filter((item) => item.roles.includes(user?.role));

  return (
    <aside
      className={`bg-slate-900 text-white h-screen flex flex-col transition-all duration-300 ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      <div className="flex items-center justify-between p-4 border-b border-slate-700">
        {!collapsed && <span className="text-lg font-bold tracking-tight">ERP System</span>}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 rounded hover:bg-slate-700 text-slate-400"
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      <nav className="flex-1 py-2 overflow-y-auto">
        {filtered.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`
            }
          >
            <item.icon size={18} />
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {!collapsed && (
        <div className="p-4 border-t border-slate-700">
          <div className="text-xs text-slate-400 truncate">{user?.name}</div>
          <div className="text-xs text-slate-500 capitalize">{user?.role?.replace('_', ' ')}</div>
        </div>
      )}
    </aside>
  );
}
