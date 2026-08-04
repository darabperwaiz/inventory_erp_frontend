import { useEffect, useRef } from 'react';

export default function SplashScreen({ onComplete }) {
  const svgRef = useRef(null);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const rect = svg.querySelector('.icon-rect');

    rect.style.fill = 'transparent';
    rect.style.stroke = '#0047FF';
    rect.style.strokeWidth = '16';
    rect.style.strokeDasharray = '2000';
    rect.style.strokeDashoffset = '0';

    const t0 = setTimeout(() => {
      rect.animate([
        { strokeDashoffset: '0' },
        { strokeDashoffset: '-2000' }
      ], { duration: 2000, easing: 'ease-in-out', fill: 'forwards' });
    }, 100);

    const t1 = setTimeout(() => {
      rect.animate([
        { strokeDasharray: '2000', strokeWidth: '16' },
        { strokeDasharray: '0 2000', strokeWidth: '16' }
      ], { duration: 500, easing: 'ease-in-out', fill: 'forwards' });
    }, 2990);

    const t2 = setTimeout(() => {
      rect.style.stroke = 'transparent';
      rect.animate([
        { fill: 'rgba(0,71,255,0)' },
        { fill: '#0047FF' }
      ], { duration: 800, easing: 'ease-out', fill: 'forwards' });
    }, 3000);

    const t4 = setTimeout(() => {
      const overlay = svg.closest('.splash-overlay');
      if (overlay) overlay.style.opacity = '0';
    }, 5200);

    const t5 = setTimeout(() => onComplete(), 6000);

    return () => {
      clearTimeout(t0);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t4);
      clearTimeout(t5);
    };
  }, [onComplete]);

  return (
    <div className="splash-overlay fixed inset-0 z-[9999] flex items-center justify-center bg-black" style={{ transition: 'opacity 0.8s ease' }}>
      <div className="flex flex-col items-center">
        <svg
          ref={svgRef}
          viewBox="0 0 512 512"
          className="w-32 h-32"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect className="icon-rect" x="16" y="16" width="480" height="480" rx="80" />
        </svg>

        <p className="subtitle-text text-slate-400 text-xs tracking-[0.3em] uppercase mt-4">
          Warehouse
        </p>

        <div className="dots-container flex gap-1.5 mt-3">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500" style={{ animation: 'dotBounce 0.6s ease infinite', animationDelay: '0ms' }} />
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500" style={{ animation: 'dotBounce 0.6s ease infinite', animationDelay: '150ms' }} />
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500" style={{ animation: 'dotBounce 0.6s ease infinite', animationDelay: '300ms' }} />
        </div>
      </div>

      <p className="brand-url fixed bottom-5 left-0 right-0 text-center text-[11px] tracking-[0.15em] text-slate-500">
        www.dotcomdotin.com
      </p>

      <style>{`
        @keyframes dotBounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
      `}</style>
    </div>
  );
}
