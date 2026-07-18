import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import useAuthStore from './store/authStore';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './components/layout/DashboardLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import MaterialList from './pages/Inventory/MaterialList';
import MaterialHistory from './pages/Inventory/MaterialHistory';
import ProjectList from './pages/Projects/ProjectList';
import ProjectDetail from './pages/Projects/ProjectDetail';
import Reports from './pages/Reports/Reports';
import UserList from './pages/Users/UserList';
import AuditLogs from './pages/AuditLogs';
import Approvals from './pages/Approvals';
import ReorderAlerts from './pages/ReorderAlerts';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';

function App() {
  const { isLoading, initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <div>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="projects" element={<ProjectList />} />
          <Route path="projects/:id" element={<ProjectDetail />} />
          <Route path="inventory" element={<MaterialList />} />
          <Route path="inventory/:id/history" element={<MaterialHistory />} />
          <Route path="reports" element={<Reports />} />
          <Route path="approvals" element={
            <ProtectedRoute roles={['admin', 'project_manager']}>
              <Approvals />
            </ProtectedRoute>
          } />
          <Route
            path="users"
            element={
              <ProtectedRoute roles={['admin']}>
                <UserList />
              </ProtectedRoute>
            }
          />
          <Route
            path="audit-logs"
            element={
              <ProtectedRoute roles={['admin']}>
                <AuditLogs />
              </ProtectedRoute>
            }
          />
          <Route
            path="reorder-alerts"
            element={
              <ProtectedRoute roles={['admin', 'inventory_manager']}>
                <ReorderAlerts />
              </ProtectedRoute>
            }
          />
          <Route
            path="settings"
            element={
              <ProtectedRoute roles={['admin']}>
                <Settings />
              </ProtectedRoute>
            }
          />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
