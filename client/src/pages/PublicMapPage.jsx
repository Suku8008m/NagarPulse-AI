import React, { useState } from 'react';
import KpiStrip from '../components/map/KpiStrip';
import NelloreMap from '../components/map/NelloreMap';
import GrievanceFeed from '../components/map/GrievanceFeed';

export default function PublicMapPage({
  grievances = [],
  stats = { total: 0, pending: 0, resolved: 0, critical: 0 },
  onUpvote,
  onSelectGrievance,
  selectedGrievance,
  isLoading = false,
}) {
  const [internalSelected, setInternalSelected] = useState(null);

  const activeSelected = selectedGrievance || internalSelected;

  const handleSelect = (grievance) => {
    setInternalSelected(grievance);
    if (onSelectGrievance) {
      onSelectGrievance(grievance);
    }
  };

  return (
    <div className="space-y-4">
      {/* KPI Stats Strip */}
      <KpiStrip stats={stats} />

      {/* Main Split: Interactive Map & Live Civic Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Left: Interactive Nellore Corporation Map (7 cols on lg) */}
        <div className="lg:col-span-7 space-y-2">
          <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-xs">
            <div className="p-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Live Geospatial Hazard Grid • Nellore Corporation
                </h3>
              </div>
              <span className="text-[11px] font-mono text-slate-400">
                Lat: 14.4426° N, Lng: 79.9865° E
              </span>
            </div>

            <div className="h-[380px] sm:h-[460px] lg:h-[560px] relative">
              <NelloreMap
                grievances={grievances}
                selectedGrievance={activeSelected}
                onSelectGrievance={handleSelect}
              />
            </div>

            <div className="p-2.5 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-between text-[11px] text-slate-500 px-4">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span>
                  Critical (8-10)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
                  Moderate (5-7)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
                  Resolved
                </span>
              </div>
              <span className="font-mono text-[10px] text-slate-400">
                50m category-scoped deduplication active
              </span>
            </div>
          </div>
        </div>

        {/* Right: Civic Grievance Feed (5 cols on lg) */}
        <div className="lg:col-span-5">
          <GrievanceFeed
            grievances={grievances}
            selectedId={activeSelected?._id}
            onSelectGrievance={handleSelect}
            onUpvote={onUpvote}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
}
