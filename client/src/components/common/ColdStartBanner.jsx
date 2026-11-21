import React, { useState, useEffect } from 'react';
import { useServerStatus } from '../../context/ServerStatusContext';
import { Zap, Loader2 } from 'lucide-react';

export const ColdStartBanner = () => {
  const { isWakingUp, wakeUpStartedAt } = useServerStatus();
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    if (!isWakingUp) {
      setElapsedSeconds(0);
      return;
    }

    const updateTimer = () => {
      const now = Date.now();
      const start = wakeUpStartedAt || now;
      const elapsed = Math.max(1, Math.floor((now - start) / 1000));
      setElapsedSeconds(elapsed);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [isWakingUp, wakeUpStartedAt]);

  if (!isWakingUp) {
    return null;
  }

  const remainingSeconds = Math.max(0, 50 - elapsedSeconds);

  return (
    <aside
      aria-live="polite"
      role="status"
      className="w-full bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-amber-950 border-b border-amber-600/30 px-4 py-2.5 shadow-sm transition-all duration-300 relative z-20"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 text-xs sm:text-sm font-medium">
        <div className="flex items-center gap-2 overflow-hidden text-ellipsis">
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-900/10 shrink-0 text-amber-950 animate-pulse">
            <Zap className="w-3.5 h-3.5 fill-current" />
          </span>
          <p className="tracking-tight text-amber-950 leading-snug">
            <strong className="font-bold">⚡ Cloud Server Waking Up (Render Free Tier Cold Start)</strong>
            <span className="mx-1.5 opacity-60">•</span>
            <span>
              Elapsed: <span className="font-mono font-bold">{elapsedSeconds}s</span> (Est. ~<span className="font-mono font-bold">{remainingSeconds}s</span> remaining) — Syncing MongoDB Atlas...
            </span>
          </p>
        </div>

        <div className="hidden md:flex items-center gap-2 shrink-0 text-[11px] font-mono font-semibold bg-amber-900/10 px-2.5 py-1 rounded-md text-amber-950">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          <span>Container Spinning Up</span>
        </div>
      </div>
    </aside>
  );
};

export default ColdStartBanner;
