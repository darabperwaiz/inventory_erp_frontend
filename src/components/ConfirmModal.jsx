import { useState, useCallback } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function useConfirm() {
  const [config, setConfig] = useState(null);

  const confirm = useCallback((message, title, confirmText, variant = 'danger') => {
    return new Promise((resolve) => {
      setConfig({ message, title, confirmText, variant, resolve });
    });
  }, []);

  const handleConfirm = () => {
    config?.resolve(true);
    setConfig(null);
  };

  const handleCancel = () => {
    config?.resolve(false);
    setConfig(null);
  };

  const ConfirmModal = config ? (
    <ConfirmModalComponent
      message={config.message}
      title={config.title}
      confirmText={config.confirmText}
      variant={config.variant}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
    />
  ) : null;

  return { confirm, ConfirmModal };
}

function ConfirmModalComponent({ message, title, confirmText, variant = 'danger', onConfirm, onCancel }) {
  const { t } = useTranslation();

  const variants = {
    danger: { btn: 'bg-red-600 hover:bg-red-700 text-white', icon: 'text-red-600' },
    warning: { btn: 'bg-amber-600 hover:bg-amber-700 text-white', icon: 'text-amber-600' },
    info: { btn: 'bg-blue-600 hover:bg-blue-700 text-white', icon: 'text-blue-600' },
  };
  const v = variants[variant] || variants.danger;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4" onClick={onCancel}>
      <div className="bg-white rounded-xl w-full max-w-sm shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="p-5 text-center">
          <div className={`mx-auto mb-3 w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center`}>
            <AlertTriangle size={24} className={v.icon} />
          </div>
          {title && <h3 className="text-lg font-semibold text-slate-800 mb-2">{title}</h3>}
          <p className="text-sm text-slate-600">{message}</p>
        </div>
        <div className="px-5 pb-5 flex flex-col-reverse sm:flex-row gap-2 sm:gap-3">
          <button onClick={onCancel} className="flex-1 px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium transition-colors">
            {t('app.cancel')}
          </button>
          <button onClick={onConfirm} className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${v.btn}`}>
            {confirmText || t('app.confirm')}
          </button>
        </div>
      </div>
    </div>
  );
}
