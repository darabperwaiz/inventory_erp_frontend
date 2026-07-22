import { useState, useEffect } from 'react';

export default function SplashScreen({ onComplete }) {
  const [phase, setPhase] = useState('square');

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('logo'), 600);
    const t2 = setTimeout(() => setPhase('shrink'), 1400);
    const t3 = setTimeout(() => setPhase('exit'), 2600);
    const t4 = setTimeout(() => onComplete(), 3400);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, [onComplete]);

  return (
    <div className={`fixed inset-0 z-[9999] flex items-center justify-center bg-[#0f172a] transition-opacity duration-800 ${phase === 'exit' ? 'opacity-0' : 'opacity-100'}`}>
      <div className="relative" style={{ width: 320, height: 100 }}>

        {/* Blue square — starts centered, shrinks into logo position */}
        <div
          className="absolute bg-[#0047FF] transition-all ease-in-out"
          style={{
            width: phase === 'square' ? 60 : phase === 'logo' ? 60 : 10,
            height: phase === 'square' ? 60 : phase === 'logo' ? 60 : 10,
            borderRadius: phase === 'shrink' || phase === 'exit' ? 2 : 6,
            top: phase === 'shrink' || phase === 'exit' ? 32 : '50%',
            left: phase === 'shrink' || phase === 'exit' ? 289 : '50%',
            transform: phase === 'shrink' || phase === 'exit' ? 'translate(0, 0)' : 'translate(-50%, -50%)',
            transitionDuration: phase === 'shrink' ? '800ms' : '600ms',
          }}
        />

        {/* Logo SVG — fades in after square appears */}
        <div
          className="absolute inset-0 flex items-center justify-center transition-opacity"
          style={{
            opacity: phase === 'square' ? 0 : 1,
            transitionDuration: '800ms',
          }}
        >
          <img src="/brand-logo.svg" alt="dotcomdotin" className="h-12 w-auto" />
        </div>

        {/* Subtitle */}
        <div
          className="absolute left-0 right-0 text-center transition-opacity"
          style={{
            bottom: -36,
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
            bottom: -64,
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
      </div>
    </div>
  );
}
