import React, { useState } from 'react';
import { StatusBadge, SeverityBadge, CategoryBadge } from '../common/StatusBadge';
import { formatRelativeTime } from '../../utils/formatters';
import { Zap, Construction, Trash2, Droplets, Building2 } from 'lucide-react';

const CategoryThumbnail = ({ category }) => {
  const cat = category || 'Other';
  if (cat === 'Electrical') {
    return (
      <div className="w-16 h-16 rounded-lg bg-amber-50 border border-amber-200 flex flex-col items-center justify-center shrink-0 text-amber-600 gap-1 shadow-2xs">
        <Zap className="w-5 h-5 text-amber-500 fill-amber-500/20" />
        <span className="text-[9px] font-bold uppercase tracking-wider text-amber-700">Power</span>
      </div>
    );
  }
  if (cat === 'Roads') {
    return (
      <div className="w-16 h-16 rounded-lg bg-slate-100 border border-slate-300 flex flex-col items-center justify-center shrink-0 text-slate-700 gap-1 shadow-2xs">
        <Construction className="w-5 h-5 text-slate-600" />
        <span className="text-[9px] font-bold uppercase tracking-wider text-slate-700">Road</span>
      </div>
    );
  }
  if (cat === 'Sanitation') {
    return (
      <div className="w-16 h-16 rounded-lg bg-emerald-50 border border-emerald-200 flex flex-col items-center justify-center shrink-0 text-emerald-600 gap-1 shadow-2xs">
        <Trash2 className="w-5 h-5 text-emerald-600" />
        <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-700">Waste</span>
      </div>
    );
  }
  if (cat === 'Water') {
    return (
      <div className="w-16 h-16 rounded-lg bg-blue-50 border border-blue-200 flex flex-col items-center justify-center shrink-0 text-blue-600 gap-1 shadow-2xs">
        <Droplets className="w-5 h-5 text-blue-600 fill-blue-600/20" />
        <span className="text-[9px] font-bold uppercase tracking-wider text-blue-700">Water</span>
      </div>
    );
  }
  return (
    <div className="w-16 h-16 rounded-lg bg-purple-50 border border-purple-200 flex flex-col items-center justify-center shrink-0 text-purple-600 gap-1 shadow-2xs">
      <Building2 className="w-5 h-5 text-purple-600" />
      <span className="text-[9px] font-bold uppercase tracking-wider text-purple-700">Civic</span>
    </div>
  );
};

const GrievanceItemImage = ({ g }) => {
  const [hasError, setHasError] = useState(false);
  const photoUrl = g.beforeImageUrl || g.imageUrl;

  if (!photoUrl || hasError) {
    return <CategoryThumbnail category={g.category} />;
  }

  return (
    <div className="w-16 h-16 rounded-lg border border-slate-200 bg-slate-100 overflow-hidden shrink-0 shadow-2xs">
      <img
        src={photoUrl}
        alt={g.category || 'Hazard'}
        className="w-full h-full object-cover"
        onError={() => setHasError(true)}
      />
    </div>
  );
};

export default function MyReportsList({ grievances = [], onSelectGrievance, selectedId }) {
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  const filteredReports = (Array.isArray(grievances) ? grievances : []).filter((g) => {
    const matchesFilter =
      filter === 'ALL'
        ? true
        : filter === 'RESOLVED'
        ? g.status === 'Verified Resolved'
        : filter === 'OPEN'
        ? g.status !== 'Verified Resolved'
        : true;

    const matchesSearch =
      !search ||
      g.trackingId?.toLowerCase().includes(search.toLowerCase()) ||
      g.category?.toLowerCase().includes(search.toLowerCase()) ||
      g.locationName?.toLowerCase().includes(search.toLowerCase()) ||
      g.description?.toLowerCase().includes(search.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  return (
    <div className="bg-white border border-slate-200/80 rounded-xl shadow-xs overflow-hidden">
      <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Citizen Complaint Ledger</span>
            <span className="text-xs font-mono font-medium px-2 py-0.5 bg-slate-100 text-slate-700 rounded-full">
              {filteredReports.length} {filteredReports.length === 1 ? 'ticket' : 'tickets'}
            </span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Track real-time status of civic hazards submitted across Nellore Corporation
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 text-xs">
            <button
              type="button"
              onClick={() => setFilter('ALL')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                filter === 'ALL'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setFilter('OPEN')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                filter === 'OPEN'
                  ? 'bg-white text-amber-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Active
            </button>
            <button
              type="button"
              onClick={() => setFilter('RESOLVED')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                filter === 'RESOLVED'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Resolved
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 py-2 bg-slate-50/70 border-b border-slate-100">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by Tracking ID, category, or location..."
          className="w-full text-xs bg-white border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <div className="divide-y divide-slate-100 max-h-[540px] overflow-y-auto">
        {filteredReports.length === 0 ? (
          <div className="p-10 text-center text-slate-400">
            <svg
              className="w-10 h-10 mx-auto text-slate-300 mb-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <p className="text-sm font-medium text-slate-600">No civic grievances found</p>
            <p className="text-xs text-slate-400 mt-1">
              Submit your first report using the form on the left.
            </p>
          </div>
        ) : (
          filteredReports.map((g) => {
            const isSelected = selectedId === g._id;
            return (
              <div
                key={g._id}
                onClick={() => onSelectGrievance && onSelectGrievance(g)}
                className={`p-3.5 hover:bg-slate-50/80 transition-colors cursor-pointer ${
                  isSelected ? 'bg-blue-50/60 ring-1 ring-blue-500/30' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <GrievanceItemImage g={g} />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-mono text-xs font-bold text-blue-700 tracking-tight">
                        {g.trackingId || 'NP-2026-REF'}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono shrink-0">
                        {formatRelativeTime(g.createdAt)}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                      <CategoryBadge category={g.category} />
                      <StatusBadge status={g.status} />
                      <SeverityBadge score={g.severityScore} />
                    </div>

                    <p className="text-xs text-slate-700 line-clamp-2 leading-relaxed">
                      {g.aiSummary || g.description || 'Civic issue reported'}
                    </p>

                    <div className="mt-2 flex items-center justify-between gap-2 text-[11px] text-slate-500">
                      <span className="truncate min-w-0 flex-1 flex items-center gap-1 font-sans">
                        <svg className="w-3 h-3 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="truncate">{g.locationName || 'Nellore Corporation'}</span>
                      </span>

                      <div className="flex items-center gap-2 shrink-0">
                        {g.upvotes > 0 && (
                          <span className="inline-flex items-center gap-1 text-slate-600 font-mono shrink-0">
                            <svg className="w-3 h-3 text-blue-600 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                            </svg>
                            <span>{g.upvotes}</span>
                          </span>
                        )}
                        {g.assignedDepartment && (
                          <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium shrink-0 max-w-[120px] truncate">
                            {g.assignedDepartment}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
