import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Save, Mail, Bell, Database, Shield } from 'lucide-react';
import toast from 'react-hot-toast';
import { settingsApi } from '../api/settings.api';
import { userApi } from '../api/user.api';
import { useTranslation } from 'react-i18next';

export default function Settings() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('general');

  const tabs = [
    { id: 'general', label: t('settings.general'), icon: SettingsIcon },
    { id: 'notifications', label: t('settings.notifications'), icon: Bell },
    { id: 'email', label: t('settings.email'), icon: Mail },
    { id: 'security', label: t('settings.security'), icon: Shield },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">{t('settings.title')}</h2>
        <p className="text-slate-500 text-sm mt-1">System configuration and preferences</p>
      </div>

      <div className="flex gap-2 border-b border-slate-200">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
              activeTab === tab.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <tab.icon size={16} /> {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'general' && <GeneralSettings />}
      {activeTab === 'notifications' && <NotificationSettings />}
      {activeTab === 'email' && <EmailSettings />}
      {activeTab === 'security' && <SecuritySettings />}
    </div>
  );
}

function GeneralSettings() {
  const { t } = useTranslation();
  const [settings, setSettings] = useState({
    companyName: 'ERP Inventory System',
    currency: 'OMR',
    timezone: 'Asia/Muscat',
    lowStockThreshold: 10,
  });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    settingsApi.getGeneral().then(({ data }) => {
      if (data.data) setSettings(data.data);
    }).catch(() => {}).finally(() => setFetching(false));
  }, []);

  const handleSave = async () => {
    setLoading(true);
    try {
      await settingsApi.updateGeneral(settings);
      toast.success('Settings saved');
    } catch {
      toast.error('Failed to save');
    } finally { setLoading(false); }
  };

  if (fetching) return <div className="bg-white rounded-xl border border-slate-200 p-6 max-w-2xl text-center text-slate-400">Loading...</div>;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 max-w-2xl">
      <h3 className="font-semibold text-slate-800 mb-4">{t('settings.general')}</h3>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">{t('settings.companyName')}</label>
          <input type="text" value={settings.companyName} onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t('settings.currency')}</label>
            <select value={settings.currency} onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none">
              <option value="OMR">OMR (Omani Rial)</option>
              <option value="USD">USD (US Dollar)</option>
              <option value="AED">AED (UAE Dirham)</option>
              <option value="SAR">SAR (Saudi Riyal)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t('settings.timezone')}</label>
            <select value={settings.timezone} onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none">
              <option value="Asia/Muscat">Asia/Muscat (GMT+4)</option>
              <option value="Asia/Dubai">Asia/Dubai (GMT+4)</option>
              <option value="Asia/Riyadh">Asia/Riyadh (GMT+3)</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">{t('settings.lowStockThreshold')}</label>
          <input type="number" value={settings.lowStockThreshold} onChange={(e) => setSettings({ ...settings, lowStockThreshold: Number(e.target.value) })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
          <p className="text-xs text-slate-500 mt-1">Alert when available quantity falls below this threshold</p>
        </div>
        <button onClick={handleSave} disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">
          <Save size={16} /> {loading ? 'Saving...' : t('settings.saveSettings')}
        </button>
      </div>
    </div>
  );
}

function NotificationSettings() {
  const { t } = useTranslation();
  const [settings, setSettings] = useState({
    lowStockAlerts: true,
    materialAssigned: true,
    projectStatusChange: true,
    dailyReport: false,
  });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    settingsApi.getNotifications().then(({ data }) => {
      if (data.data) setSettings(data.data);
    }).catch(() => {}).finally(() => setFetching(false));
  }, []);

  const handleSave = async () => {
    setLoading(true);
    try {
      await settingsApi.updateNotifications(settings);
      toast.success('Notification settings saved');
    } catch {
      toast.error('Failed to save');
    } finally { setLoading(false); }
  };

  if (fetching) return <div className="bg-white rounded-xl border border-slate-200 p-6 max-w-2xl text-center text-slate-400">Loading...</div>;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 max-w-2xl">
      <h3 className="font-semibold text-slate-800 mb-4">{t('settings.notifications')}</h3>
      <div className="space-y-4">
        {[
          { key: 'lowStockAlerts', label: t('settings.lowStockAlerts'), desc: 'Receive email when materials fall below minimum stock' },
          { key: 'materialAssigned', label: t('settings.materialAssigned'), desc: 'Notify project manager when materials are assigned' },
          { key: 'projectStatusChange', label: t('settings.projectStatusChange'), desc: 'Notify when project status is updated' },
          { key: 'dailyReport', label: t('settings.dailyReport'), desc: 'Receive daily inventory and project summary' },
        ].map((item) => (
          <div key={item.key} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
            <div>
              <div className="font-medium text-sm text-slate-800">{item.label}</div>
              <div className="text-xs text-slate-500">{item.desc}</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={settings[item.key]}
                onChange={(e) => setSettings({ ...settings, [item.key]: e.target.checked })} className="sr-only peer" />
              <div className="w-11 h-6 bg-slate-300 peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        ))}
        <button onClick={handleSave} disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">
          <Save size={16} /> {loading ? 'Saving...' : 'Save'}
        </button>
      </div>
    </div>
  );
}

const SMTP_PRESETS = {
  gmail: { label: 'Gmail', smtpHost: 'smtp.gmail.com', smtpPort: 587 },
  outlook: { label: 'Outlook / Microsoft 365', smtpHost: 'smtp.office365.com', smtpPort: 587 },
  yahoo: { label: 'Yahoo Mail', smtpHost: 'smtp.mail.yahoo.com', smtpPort: 587 },
  custom: { label: 'Custom Domain SMTP', smtpHost: '', smtpPort: 587 },
};

function EmailSettings() {
  const { t } = useTranslation();
  const [provider, setProvider] = useState('gmail');
  const [settings, setSettings] = useState({
    smtpHost: 'smtp.gmail.com',
    smtpPort: 587,
    smtpUser: '',
    smtpPass: '',
    smtpFrom: '',
    smtpSecure: false,
  });
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testEmail, setTestEmail] = useState('');

  useEffect(() => {
    settingsApi.getEmail().then(({ data }) => {
      if (data.data && data.data.smtpUser) {
        setSettings(data.data);
        const host = data.data.smtpHost;
        const matched = Object.entries(SMTP_PRESETS).find(([, v]) => v.smtpHost === host);
        if (matched) setProvider(matched[0]);
        else setProvider('custom');
      }
    });
  }, []);

  const handleProviderChange = (key) => {
    setProvider(key);
    const preset = SMTP_PRESETS[key];
    setSettings((prev) => ({ ...prev, smtpHost: preset.smtpHost, smtpPort: preset.smtpPort }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await settingsApi.updateEmail(settings);
      toast.success('Email settings saved');
    } catch {
      toast.error('Failed to save');
    } finally { setLoading(false); }
  };

  const handleTest = async () => {
    if (!testEmail) return toast.error('Enter a test email');
    setTesting(true);
    try {
      await settingsApi.updateEmail(settings);
      await settingsApi.testEmail(testEmail);
      toast.success('Test email sent!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send test email');
    } finally { setTesting(false); }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 max-w-2xl">
      <h3 className="font-semibold text-slate-800 mb-4">{t('settings.email')} Configuration</h3>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">{t('settings.emailProvider')}</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {Object.entries(SMTP_PRESETS).map(([key, val]) => (
              <button key={key} onClick={() => handleProviderChange(key)}
                className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  provider === key ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-blue-300'
                }`}>
                {val.label}
              </button>
            ))}
          </div>
        </div>

        {provider === 'custom' && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-700">
            Enter your domain's SMTP server details. Check with your hosting provider or IT admin for the correct host and port.
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t('settings.smtpHost')}</label>
            <input type="text" value={settings.smtpHost} onChange={(e) => setSettings({ ...settings, smtpHost: e.target.value })}
              placeholder="smtp.gmail.com" disabled={provider !== 'custom'}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t('settings.smtpPort')}</label>
            <input type="number" value={settings.smtpPort} onChange={(e) => setSettings({ ...settings, smtpPort: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-slate-700">{t('settings.smtpPort')}</label>
          <div className="flex gap-2">
            <button onClick={() => setSettings({ ...settings, smtpPort: 587, smtpSecure: false })}
              className={`px-3 py-1.5 rounded-lg text-sm border ${!settings.smtpSecure ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-50 text-slate-700 border-slate-200'}`}>
              587 (Recommended)
            </button>
            <button onClick={() => setSettings({ ...settings, smtpPort: 465, smtpSecure: true })}
              className={`px-3 py-1.5 rounded-lg text-sm border ${settings.smtpSecure ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-50 text-slate-700 border-slate-200'}`}>
              465 (SSL)
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">{t('settings.smtpUsername')}</label>
          <input type="text" value={settings.smtpUser} onChange={(e) => setSettings({ ...settings, smtpUser: e.target.value })}
            placeholder="you@example.com"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            {t('settings.smtpPassword')} {provider === 'gmail' && <span className="text-slate-400 font-normal">/ App Password</span>}
          </label>
          <input type="password" value={settings.smtpPass} onChange={(e) => setSettings({ ...settings, smtpPass: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">{t('settings.smtpFrom')}</label>
          <input type="email" value={settings.smtpFrom} onChange={(e) => setSettings({ ...settings, smtpFrom: e.target.value })}
            placeholder="noreply@company.com" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
          <p className="text-xs text-slate-500 mt-1">Must match the username for Gmail. For custom domains, use an address on your domain.</p>
        </div>

        <div className="border-t border-slate-200 pt-4">
          <h4 className="text-sm font-medium text-slate-700 mb-2">{t('settings.testEmail')}</h4>
          <div className="flex gap-2">
            <input type="email" value={testEmail} onChange={(e) => setTestEmail(e.target.value)} placeholder="test@example.com"
              className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
            <button onClick={handleTest} disabled={testing}
              className="px-4 py-2 bg-amber-500 text-white rounded-lg text-sm hover:bg-amber-600 disabled:opacity-50">
              {testing ? 'Sending...' : t('settings.sendTest')}
            </button>
          </div>
        </div>

        <button onClick={handleSave} disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">
          <Save size={16} /> {loading ? 'Saving...' : t('settings.saveEmailSettings')}
        </button>
      </div>
    </div>
  );
}

function SecuritySettings() {
  const { t } = useTranslation();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    userApi.getAll({ limit: 100 }).then(({ data }) => {
      setStats({
        totalUsers: data.pagination.total,
        activeUsers: data.data.filter(u => u.isActive).length,
        inactiveUsers: data.data.filter(u => !u.isActive).length,
      });
    });
  }, []);

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="font-semibold text-slate-800 mb-4">{t('settings.userStatistics')}</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-blue-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{stats?.totalUsers || 0}</div>
            <div className="text-xs text-slate-500">Total Users</div>
          </div>
          <div className="bg-emerald-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-emerald-600">{stats?.activeUsers || 0}</div>
            <div className="text-xs text-slate-500">Active</div>
          </div>
          <div className="bg-red-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{stats?.inactiveUsers || 0}</div>
            <div className="text-xs text-slate-500">Inactive</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="font-semibold text-slate-800 mb-4">{t('settings.securityInfo')}</h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between p-3 bg-slate-50 rounded-lg">
            <span className="text-slate-600">Authentication</span>
            <span className="font-medium">JWT (Access + Refresh Tokens)</span>
          </div>
          <div className="flex justify-between p-3 bg-slate-50 rounded-lg">
            <span className="text-slate-600">Access Token Expiry</span>
            <span className="font-medium">15 minutes</span>
          </div>
          <div className="flex justify-between p-3 bg-slate-50 rounded-lg">
            <span className="text-slate-600">Refresh Token Expiry</span>
            <span className="font-medium">7 days</span>
          </div>
          <div className="flex justify-between p-3 bg-slate-50 rounded-lg">
            <span className="text-slate-600">Password Hashing</span>
            <span className="font-medium">bcrypt (12 rounds)</span>
          </div>
          <div className="flex justify-between p-3 bg-slate-50 rounded-lg">
            <span className="text-slate-600">Audit Logging</span>
            <span className="font-medium text-emerald-600">Enabled</span>
          </div>
          <div className="flex justify-between p-3 bg-slate-50 rounded-lg">
            <span className="text-slate-600">Transaction Immutability</span>
            <span className="font-medium text-emerald-600">Enabled</span>
          </div>
        </div>
      </div>
    </div>
  );
}
