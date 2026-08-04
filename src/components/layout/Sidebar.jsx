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
  Truck,
} from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import useAuthStore from '../../store/authStore';

export default function Sidebar() {
  const { t } = useTranslation();
  const [collapsed, setCollapsed] = useState(false);
  const { user } = useAuthStore();

  const navItems = [
    { to: '/', icon: LayoutDashboard, label: t('nav.dashboard'), shortLabel: 'Home', roles: ['admin', 'project_manager', 'inventory_manager', 'site_engineer', 'viewer'] },
    { to: '/procurement', icon: Truck, label: t('nav.procurement'), shortLabel: 'Suppliers', roles: ['admin', 'inventory_manager'] },
    { to: '/projects', icon: FolderKanban, label: t('nav.projects'), shortLabel: 'Projects', roles: ['admin', 'project_manager', 'inventory_manager', 'site_engineer', 'viewer'] },
    { to: '/inventory', icon: Package, label: t('nav.inventory'), shortLabel: 'Stock', roles: ['admin', 'project_manager', 'inventory_manager', 'site_engineer', 'viewer'] },
    { to: '/reports', icon: BarChart3, label: t('nav.reports'), shortLabel: 'Reports', roles: ['admin', 'project_manager', 'inventory_manager', 'site_engineer', 'viewer'] },
    { to: '/users', icon: Users, label: t('nav.users'), shortLabel: 'Users', roles: ['admin'] },
    { to: '/audit-logs', icon: ScrollText, label: t('nav.auditLogs'), shortLabel: 'Audit', roles: ['admin'] },
    { to: '/settings', icon: Settings, label: t('nav.settings'), shortLabel: 'Settings', roles: ['admin'] },
  ];

  const filtered = navItems.filter((item) => item.roles.includes(user?.role));

  const bottomNavItems = filtered.slice(0, 5);

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={`hidden lg:flex bg-slate-900 text-white h-screen flex-col transition-all duration-300 ${
          collapsed ? 'w-16' : 'w-64'
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <img src="/logo-192px.png" alt="Logo" className="w-7 h-7 rounded" />
              <span className="text-lg font-bold tracking-tight">Warehouse</span>
            </div>
          )}
          {collapsed && <img src="/logo-192px.png" alt="Logo" className="w-7 h-7 rounded mx-auto" />}
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

      {/* Mobile bottom nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-700 z-50 safe-area-bottom">
        <div className="flex items-center justify-around py-1">
          {bottomNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 px-3 py-2 rounded-lg text-[10px] transition-colors min-w-[56px] ${
                  isActive
                    ? 'text-blue-400'
                    : 'text-slate-400'
                }`
              }
            >
              <item.icon size={20} />
              <span>{item.shortLabel}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </>
  );
}
