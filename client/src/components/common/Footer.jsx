import React from 'react';
import { Link } from 'react-router-dom';
import { useServerStatus } from '../../context/ServerStatusContext';

export const Footer = () => {
  const { isWakingUp, lastLatencyMs, isOnline } = useServerStatus();

  return (
    <footer className="w-full bg-white border-t border-slate-200 py-3.5 px-4 sm:px-6 transition-colors">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        {/* Left Signature */}
        <div className="flex items-center gap-2 text-slate-600 font-medium text-center md:text-left">
          <span className="w-2 h-2 rounded-full bg-blue-700 inline-block shrink-0" />
          <span>
            Engineered by <strong className="text-slate-900 font-semibold">Sukumar Kamapalli</strong> • Full-Stack MERN &amp; Multimodal AI Civic Triage System (Nellore, AP)
          </span>
        </div>

        {/* Center: Subtle Quick-Access Links for Judges */}
        <div className="flex items-center gap-3 text-[11px] text-slate-400 font-medium">
          <Link
            to="/operator"
            className="hover:text-blue-700 transition-colors"
          >
            Operator Portal
          </Link>
          <span>•</span>
          <Link
            to="/admin"
            className="hover:text-purple-700 transition-colors"
          >
            Admin Portal
          </Link>
          <span>•</span>
          <Link
            to="/login"
            className="hover:text-slate-700 transition-colors"
          >
            Judge Demo Access
          </Link>
        </div>

        {/* Right Live Telemetry */}
        <div className="flex flex-wrap items-center justify-center md:justify-end gap-2.5 font-mono text-[11px]">
          {/* Render Cloud Backend Latency Pill */}
          {isWakingUp ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
              <span>● Render API Waking Up...</span>
            </div>
          ) : lastLatencyMs !== null ? (
            <div
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700"
              title="Render cloud backend round-trip latency"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>● Render API Online ({lastLatencyMs}ms)</span>
            </div>
          ) : isOnline === false ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span>● Render API Offline</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-50 border border-slate-200 text-slate-600">
              <span className="w-2 h-2 rounded-full bg-slate-400 animate-pulse" />
              <span>● Render API Connecting...</span>
            </div>
          )}

          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>MongoDB Geospatial + Gemini 3.8 Flash Active</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
