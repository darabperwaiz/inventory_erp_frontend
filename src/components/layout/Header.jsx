import { useState, useEffect, useRef } from 'react';
import { LogOut, Bell, Check, Trash2, X, Download, RefreshCw } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import { useNavigate } from 'react-router-dom';
import { notificationApi } from '../../api/notification.api';
import { useTranslation } from 'react-i18next';

export default function Header() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifs, setShowNotifs] = useState(false);
  const [loadingNotifs, setLoadingNotifs] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstallable(false);
    }
    setDeferredPrompt(null);
  };

  useEffect(() => {
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setShowNotifs(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchUnread = async () => {
    try {
      const { data } = await notificationApi.getAll({ limit: 5, unreadOnly: true });
      setNotifications(data.data);
      setUnreadCount(data.unreadCount);
    } catch {}
  };

  const toggleNotifs = async () => {
    if (!showNotifs) {
      setLoadingNotifs(true);
      try {
        const { data } = await notificationApi.getAll({ limit: 10 });
        setNotifications(data.data);
        setUnreadCount(data.unreadCount);
      } catch {}
      setLoadingNotifs(false);
    }
    setShowNotifs(!showNotifs);
  };

  const markAllRead = async () => {
    await notificationApi.markAllRead();
    setUnreadCount(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const markOneRead = async (id) => {
    await notificationApi.markRead(id);
    setUnreadCount((prev) => Math.max(0, prev - 1));
    setNotifications((prev) => prev.map((n) => n._id === id ? { ...n, isRead: true } : n));
  };

  const deleteNotif = async (id) => {
    await notificationApi.delete(id);
    setNotifications((prev) => prev.filter((n) => n._id !== id));
    setUnreadCount((prev) => {
      const removed = notifications.find((n) => n._id === id);
      return removed && !removed.isRead ? Math.max(0, prev - 1) : prev;
    });
  };

  const typeIcons = { low_stock: '🔴', material_assigned: '📦', status_change: '📋', system: '🔔' };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between">
      <div>
        <h1 className="text-lg font-semibold text-slate-800">{t('app.title')}</h1>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={handleRefresh}
          className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          title="Refresh"
        >
          <RefreshCw size={18} />
        </button>

        {isInstallable && (
          <button
            onClick={handleInstall}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-sm font-medium transition-colors"
            title="Install App"
          >
            <Download size={16} />
            <span className="hidden sm:inline">Install App</span>
          </button>
        )}

        <div className="relative" ref={dropdownRef}>
          <button onClick={toggleNotifs} className="relative p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg" title={t('settings.notifications')}>
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifs && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl border border-slate-200 shadow-xl z-50">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                <span className="font-semibold text-sm text-slate-800">{t('settings.notifications')}</span>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button onClick={markAllRead} className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                      <Check size={12} /> Mark all read
                    </button>
                  )}
                  <button onClick={() => setShowNotifs(false)} className="text-slate-400 hover:text-slate-600">
                    <X size={14} />
                  </button>
                </div>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {loadingNotifs ? (
                  <div className="text-center py-6 text-slate-400 text-sm">Loading...</div>
                ) : notifications.length === 0 ? (
                  <div className="text-center py-6 text-slate-400 text-sm">No notifications</div>
                ) : (
                  notifications.map((n) => (
                    <div key={n._id} className={`px-4 py-3 border-b border-slate-50 hover:bg-slate-50 ${!n.isRead ? 'bg-blue-50/50' : ''}`}>
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-2">
                          <span className="mt-0.5">{typeIcons[n.type] || '🔔'}</span>
                          <div>
                            <div className="text-sm font-medium text-slate-800">{n.title}</div>
                            <div className="text-xs text-slate-500 mt-0.5">{n.message}</div>
                            <div className="text-[10px] text-slate-400 mt-1">{new Date(n.createdAt).toLocaleString()}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {!n.isRead && (
                            <button onClick={() => markOneRead(n._id)} className="p-1 text-slate-400 hover:text-blue-600" title="Mark read">
                              <Check size={12} />
                            </button>
                          )}
                          <button onClick={() => deleteNotif(n._id)} className="p-1 text-slate-400 hover:text-red-500" title="Delete">
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
            {user?.name?.charAt(0)?.toUpperCase()}
          </div>
          <div className="hidden sm:block">
            <div className="text-sm font-medium text-slate-700">{user?.name}</div>
            <div className="text-xs text-slate-400 capitalize">{user?.role?.replace('_', ' ')}</div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="p-2 text-slate-400 hover:text-red-500 hover:bg-slate-100 rounded-lg"
          title={t('auth.logout')}
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}
