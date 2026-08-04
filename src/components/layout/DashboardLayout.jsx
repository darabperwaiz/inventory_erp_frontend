import { Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

const routeTitles = {
  '/': 'Dashboard',
  '/projects': 'Projects',
  '/inventory': 'Inventory',
  '/reports': 'Reports',
  '/procurement': 'Suppliers',
  '/approvals': 'Approvals',
  '/users': 'Users',
  '/audit-logs': 'Audit Logs',
  '/reorder-alerts': 'Reorder Alerts',
  '/settings': 'Settings',
};

export default function DashboardLayout() {
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname;
    let title = 'Warehouse';

    if (routeTitles[path]) {
      title = `${routeTitles[path]} | Warehouse`;
    } else if (path.startsWith('/projects/')) {
      title = 'Project Detail | Warehouse';
    } else if (path.match(/\/inventory\/[^/]+\/history/)) {
      title = 'Material History | Warehouse';
    } else if (path.match(/\/procurement\/[^/]+/)) {
      title = 'Supplier Detail | Warehouse';
    }

    document.title = title;
  }, [location.pathname]);

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 pb-20 lg:pb-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
