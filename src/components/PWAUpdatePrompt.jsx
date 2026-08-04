import { useState, useEffect } from 'react';
import { X, RefreshCw, Download } from 'lucide-react';

export default function PWAUpdatePrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [registration, setRegistration] = useState(null);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    navigator.serviceWorker.ready.then((reg) => {
      setRegistration(reg);

      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        if (!newWorker) return;

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            setUpdateAvailable(true);
            setTimeout(() => setShowPrompt(true), 1000);
          }
        });
      });
    });
  }, []);

  const handleUpdate = () => {
    if (registration?.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
    window.location.reload();
  };

  const handleDismiss = () => {
    setShowPrompt(false);
  };

  if (!showPrompt || !updateAvailable) return null;

  return (
    <div className="fixed bottom-20 lg:bottom-4 right-4 z-[100] max-w-sm w-[calc(100%-2rem)]">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 sm:p-5 animate-slide-up">
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <RefreshCw size={24} className="text-white" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800">Update Available</h3>
            <p className="text-xs text-slate-500">تحديث متاح</p>
          </div>
        </div>

        <p className="text-slate-600 text-sm mb-4 leading-relaxed">
          A new version of Dotcomdotin Warehouse is ready. Refresh to get the latest features and improvements.
        </p>

        <div className="flex gap-2">
          <button
            onClick={handleDismiss}
            className="flex-1 px-3 py-2.5 text-sm font-medium text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
          >
            Later
          </button>
          <button
            onClick={handleUpdate}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-medium text-white bg-green-600 rounded-xl hover:bg-green-700 transition-colors"
          >
            <RefreshCw size={16} />
            Update Now
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
