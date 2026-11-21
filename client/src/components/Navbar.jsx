import React from 'react';
import { Activity, AlertTriangle, Map, ShieldCheck, Radio, MapPin } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, stats }) {
  return (
    <header className="sticky top-0 z-50 bg-slate-950/95 backdrop-blur-md border-b border-slate-800/90 shadow-xl transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Civic Branding */}
          <div
            className="flex items-center space-x-3 cursor-pointer group"
            onClick={() => setActiveTab('dashboard')}
          >
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 text-white shadow-lg shadow-blue-500/30 group-hover:scale-105 transition-transform">
              <Activity className="w-5 h-5 text-white" />
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-80"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 ring-2 ring-slate-950"></span>
              </span>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-black tracking-tight text-white group-hover:text-blue-400 transition-colors">
                  NagarPulse<span className="text-blue-400 font-extrabold">AI</span>
                </span>
                <span className="hidden sm:inline-flex items-center space-x-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-blue-950 text-blue-400 border border-blue-800/80 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span>
                  <span>Gemini 3.5 Flash</span>
                </span>
              </div>
              <div className="flex items-center space-x-2 text-xs text-slate-400 hidden sm:flex">
                <span className="flex items-center space-x-1 text-slate-300 font-medium">
                  <MapPin className="w-3 h-3 text-rose-400" />
                  <span>Nellore Municipal Corp</span>
                </span>
                <span>•</span>
                <span className="text-[11px] text-emerald-400 font-semibold flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  <span>Live Pulse Active</span>
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex space-x-1 sm:space-x-1.5 bg-slate-900/90 p-1.5 rounded-xl border border-slate-800 shadow-inner">
            <button
              onClick={() => setActiveTab('report')}
              className={`flex items-center space-x-2 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all duration-150 cursor-pointer ${
                activeTab === 'report'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>Report Hazard</span>
            </button>

            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center space-x-2 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all duration-150 cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Map className="w-4 h-4 text-cyan-400" />
              <span>Public Dashboard & Map</span>
            </button>

            <button
              onClick={() => setActiveTab('authority')}
              className={`flex items-center space-x-2 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all duration-150 cursor-pointer ${
                activeTab === 'authority'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="flex items-center space-x-1.5">
                <span>Authority Portal</span>
                {stats?.pending > 0 && (
                  <span className="px-1.5 py-0.2 text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-full font-bold">
                    {stats.pending}
                  </span>
                )}
              </span>
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
}
