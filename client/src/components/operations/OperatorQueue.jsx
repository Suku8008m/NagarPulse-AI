import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { StatusBadge, SeverityBadge, CategoryBadge } from '../common/StatusBadge';
import { formatRelativeTime } from '../../utils/formatters';
import VisionAuditModal from './VisionAuditModal';

export default function OperatorQueue({ grievances = [], onGrievanceUpdated, isLoading = false }) {
  const { user } = useAuth();
  const [selectedDept, setSelectedDept] = useState(
    user?.department && user.department !== 'All' ? user.department : 'ALL'
  );
  const [statusFilter, setStatusFilter] = useState('ACTIVE');
  const [search, setSearch] = useState('');
  const [auditTarget, setAuditTarget] = useState(null);

  const departments = ['ALL', 'Roads', 'Sanitation', 'Water', 'Electrical'];

  const filteredTickets = (Array.isArray(grievances) ? grievances : []).filter((g) => {
    const matchesDept = selectedDept === 'ALL' || g.category === selectedDept || g.assignedDepartment?.includes(selectedDept);
    const matchesStatus =
      statusFilter === 'ALL'
        ? true
        : statusFilter === 'ACTIVE'
        ? g.status !== 'Verified Resolved'
        : g.status === 'Verified Resolved';

    const matchesSearch =
      !search ||
      g.trackingId?.toLowerCase().includes(search.toLowerCase()) ||
      g.locationName?.toLowerCase().includes(search.toLowerCase()) ||
      g.description?.toLowerCase().includes(search.toLowerCase()) ||
      g.assignedDepartment?.toLowerCase().includes(search.toLowerCase());

    return matchesDept && matchesStatus && matchesSearch;
  });

  // Sort by severity descending (10 -> 1)
  const sortedTickets = [...filteredTickets].sort((a, b) => (b.severityScore || 0) - (a.severityScore || 0));

  const handleAuditSuccess = (updatedGrievance) => {
    if (onGrievanceUpdated) {
      onGrievanceUpdated(updatedGrievance);
    }
    setAuditTarget(null);
  };

  return (
    <div className="space-y-4">
      {/* Top Banner / Operator Identity */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-700 text-white flex items-center justify-center font-bold text-sm shrink-0">
              {user?.name ? user.name.charAt(0) : 'O'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">{user?.name || 'Field Operations Officer'}</h2>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                  {user?.role?.toUpperCase() || 'OPERATOR'}
                </span>
                <span className="text-xs font-medium text-slate-500">
                  • {user?.department || 'Roads & Infrastructure'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Nellore Municipal Corporation • High-Priority Field Dispatch & Vision Audit Triage
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <div className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-right">
              <span className="block text-[10px] uppercase font-bold text-slate-400">Actionable Queue</span>
              <span className="text-sm font-mono font-bold text-slate-900">
                {sortedTickets.filter((t) => t.status !== 'Verified Resolved').length} pending
              </span>
            </div>
            <div className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg text-right">
              <span className="block text-[10px] uppercase font-bold text-emerald-600">Verified Cleared</span>
              <span className="text-sm font-mono font-bold text-emerald-700">
                {sortedTickets.filter((t) => t.status === 'Verified Resolved').length} closed
              </span>
            </div>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Department pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-500 mr-1">Dept:</span>
            {departments.map((dept) => (
              <button
                key={dept}
                type="button"
                onClick={() => setSelectedDept(dept)}
                className={`text-xs px-2.5 py-1 rounded-md font-medium transition-all ${
                  selectedDept === dept
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {dept === 'ALL' ? 'All Divisions' : dept}
              </button>
            ))}
          </div>

          {/* Status & Search */}
          <div className="flex items-center gap-2">
            <div className="inline-flex rounded-md border border-slate-200 p-0.5 bg-slate-50 text-xs">
              <button
                type="button"
                onClick={() => setStatusFilter('ACTIVE')}
                className={`px-2.5 py-1 rounded font-medium ${
                  statusFilter === 'ACTIVE' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                }`}
              >
                Open
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('ALL')}
                className={`px-2.5 py-1 rounded font-medium ${
                  statusFilter === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('RESOLVED')}
                className={`px-2.5 py-1 rounded font-medium ${
                  statusFilter === 'RESOLVED' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600'
                }`}
              >
                Resolved
              </button>
            </div>

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search queue..."
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 w-36 sm:w-48"
            />
          </div>
        </div>
      </div>

      {/* Ticket List / Grid */}
      <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
            Prioritized Work Orders ({sortedTickets.length})
          </span>
          <span className="text-xs text-slate-400 font-mono">
            Sorted by Severity (10 → 1)
          </span>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-slate-400">
            <svg className="animate-spin w-6 h-6 mx-auto mb-2 text-blue-600" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            <p className="text-xs">Loading operational dispatch queue...</p>
          </div>
        ) : sortedTickets.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <svg className="w-10 h-10 mx-auto text-slate-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm font-medium text-slate-700">All clear! No active work orders matching filter.</p>
            <p className="text-xs text-slate-400 mt-1">Switch department or filter to view other tickets.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {sortedTickets.map((ticket) => {
              const isResolved = ticket.status === 'Verified Resolved';

              return (
                <div
                  key={ticket._id}
                  className="p-4.5 hover:bg-slate-50/80 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  {/* Left: Thumbnail + Core Info */}
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className="relative shrink-0">
                      {ticket.imageUrl ? (
                        <img
                          src={ticket.imageUrl}
                          alt={ticket.category}
                          className="w-20 h-20 rounded-xl object-cover border border-slate-200 bg-slate-100 shadow-2xs"
                        />
                      ) : (
                        <div className="w-20 h-20 rounded-xl border border-slate-200 bg-slate-100 flex items-center justify-center text-slate-400 text-xs font-mono">
                          No Pic
                        </div>
                      )}
                      <div className="absolute -top-1.5 -left-1.5">
                        <SeverityBadge score={ticket.severityScore} />
                      </div>
                    </div>

                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-900 tracking-tight">
                          {ticket.trackingId}
                        </span>
                        <CategoryBadge category={ticket.category} />
                        <StatusBadge status={ticket.status} />
                        {ticket.upvotes > 1 && (
                          <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-bold border border-blue-100">
                            +{ticket.upvotes} Citizens Impacted
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-800 leading-relaxed font-medium">
                        {ticket.aiSummary || ticket.description}
                      </p>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500 font-mono">
                        <span className="flex items-center gap-1 font-sans">
                          <svg className="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {ticket.locationName}
                        </span>

                        <span>
                          [{ticket.location?.coordinates?.[1]?.toFixed(4)}, {ticket.location?.coordinates?.[0]?.toFixed(4)}]
                        </span>

                        <span className="text-slate-400">
                          Reported {formatRelativeTime(ticket.createdAt)}
                        </span>
                      </div>

                      {/* If resolved, show proof snippet */}
                      {isResolved && ticket.aiVerification && (
                        <div className="mt-2 p-2 bg-emerald-50/60 border border-emerald-200/80 rounded-lg text-xs flex items-center justify-between">
                          <span className="text-emerald-800 font-medium flex items-center gap-1.5">
                            <svg className="w-4 h-4 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            Gemini Vision Audited ({ticket.aiVerification.confidence}% match)
                          </span>
                          <span className="text-[10px] font-mono text-emerald-700">
                            {ticket.aiVerification.qualityAssessment || 'Satisfactory'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Action Button */}
                  <div className="flex md:flex-col items-center justify-end gap-2 shrink-0">
                    {!isResolved ? (
                      <button
                        type="button"
                        onClick={() => setAuditTarget(ticket)}
                        className="w-full md:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-all inline-flex items-center justify-center gap-1.5"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Verify & Resolve</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setAuditTarget(ticket)}
                        className="w-full md:w-auto px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-colors"
                      >
                        Inspect Audit
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Vision Audit Modal */}
      <VisionAuditModal
        grievance={auditTarget}
        isOpen={!!auditTarget}
        onClose={() => setAuditTarget(null)}
        onSuccess={handleAuditSuccess}
      />
    </div>
  );
}
