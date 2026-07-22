import { useState, useEffect } from 'react';

export default function SplashScreen({ onComplete }) {
  const [phase, setPhase] = useState('enter');

  useEffect(() => {
    const timer1 = setTimeout(() => setPhase('visible'), 50);
    const timer2 = setTimeout(() => setPhase('exit'), 2200);
    const timer3 = setTimeout(() => onComplete(), 3000);
    return () => { clearTimeout(timer1); clearTimeout(timer2); clearTimeout(timer3); };
  }, [onComplete]);

  return (
    <div className={`fixed inset-0 z-[9999] flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 transition-opacity duration-700 ${phase === 'exit' ? 'opacity-0' : 'opacity-100'}`}>
      <div className={`text-center transition-all duration-700 ${phase === 'enter' ? 'opacity-0 scale-90' : 'opacity-100 scale-100'}`}>
        <div className="mb-6">
          <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
            <span className="text-white text-3xl font-bold">D</span>
          </div>
        </div>
        <h1 className="text-4xl font-bold text-white tracking-tight">
          dotcomdot<span className="text-blue-400">in</span>
        </h1>
        <p className="text-slate-400 mt-3 text-sm tracking-widest uppercase">Inventory & Project Management</p>
        <div className="mt-8 flex justify-center">
          <div className="flex gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      </div>
    </div>
  );
}
