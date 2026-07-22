import { useState, useEffect } from 'react';

export default function SplashScreen({ onComplete }) {
  const [phase, setPhase] = useState('reveal');

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('shrink'), 2000);
    const t2 = setTimeout(() => setPhase('exit'), 2800);
    const t3 = setTimeout(() => onComplete(), 3600);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onComplete]);

  return (
    <div className={`fixed inset-0 z-[9999] flex items-center justify-center bg-[#0f172a] transition-opacity duration-800 ${phase === 'exit' ? 'opacity-0' : 'opacity-100'}`}>
      <div className="relative" style={{ width: 320, height: 80 }}>

        {/* Logo reveal container — clipped from right, expands left to right */}
        <div
          className="absolute inset-0 flex items-center overflow-hidden"
          style={{
            clipPath: phase === 'reveal'
              ? 'inset(0 100% 0 0)'
              : phase === 'shrink'
                ? 'inset(0 0% 0 0)'
                : 'inset(0 0% 0 0)',
            transition: phase === 'shrink'
              ? 'clip-path 800ms ease-out'
              : 'none',
          }}
        >
          <img src="/brand-logo.svg" alt="dotcomdotin" className="h-12 w-auto" />
        </div>

        {/* Blue square — slides left to right as the reveal cursor */}
        <div
          className="absolute bg-[#0047FF]"
          style={{
            width: phase === 'shrink' || phase === 'exit' ? 10 : 6,
            height: phase === 'shrink' || phase === 'exit' ? 10 : 48,
            borderRadius: phase === 'shrink' || phase === 'exit' ? 2 : 1,
            top: '50%',
            left: phase === 'reveal' ? undefined : 289,
            transform: phase === 'shrink' || phase === 'exit'
              ? 'translate(0, -50%)'
              : 'translate(-50%, -50%)',
            transition: phase === 'shrink'
              ? 'all 800ms ease-out'
              : 'left 2000ms linear, width 200ms, height 200ms, border-radius 200ms',
            ...(phase === 'reveal' ? { animation: 'slideReveal 2000ms linear forwards' } : {}),
          }}
        />

        {/* Subtitle */}
        <div
          className="absolute left-0 right-0 text-center transition-opacity"
          style={{
            bottom: -32,
            opacity: phase === 'shrink' || phase === 'exit' ? 1 : 0,
            transitionDuration: '600ms',
          }}
        >
          <p className="text-slate-400 text-xs tracking-[0.3em] uppercase">Inventory & Project Management</p>
        </div>

        {/* Loading dots */}
        <div
          className="absolute flex justify-center gap-1.5 transition-opacity"
          style={{
            bottom: -56,
            left: 0,
            right: 0,
            opacity: phase === 'shrink' || phase === 'exit' ? 1 : 0,
            transitionDuration: '400ms',
          }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>

        <style>{`
          @keyframes slideReveal {
            0% { left: 0; }
            100% { left: 100%; }
          }
        `}</style>
      </div>
    </div>
  );
}
