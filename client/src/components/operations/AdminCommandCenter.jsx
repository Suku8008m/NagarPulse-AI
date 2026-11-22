import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import { StatusBadge, SeverityBadge, CategoryBadge } from '../common/StatusBadge';
import LoginAuditTable from './LoginAuditTable';
import { reassignGrievance } from '../../services/grievanceService';

export default function AdminCommandCenter({ grievances = [], onGrievanceUpdated }) {
  const { user } = useAuth();
  const [reassignTarget, setReassignTarget] = useState(null);
  const [newDepartment, setNewDepartment] = useState('');
  const [isReassigning, setIsReassigning] = useState(false);
  const [activeTab, setActiveTab] = useState('ANALYTICS'); // 'ANALYTICS' | 'DISPATCH' | 'AUDIT_LOGS'

  // Metric computations
  const safeList = Array.isArray(grievances) ? grievances : [];
  const total = safeList.length;
  const resolved = safeList.filter((g) => g.status === 'Verified Resolved').length;
  const critical = safeList.filter((g) => g.severityScore >= 8 && g.status !== 'Verified Resolved').length;
  const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;
  const totalUpvotes = safeList.reduce((acc, g) => acc + (g.upvotes || 0), 0);

  // Department breakdown
  const departments = ['Roads', 'Sanitation', 'Water', 'Electrical'];
  const deptStats = departments.map((dept) => {
    const deptTickets = safeList.filter((g) => g.category === dept || g.assignedDepartment?.includes(dept));
    const deptResolved = deptTickets.filter((g) => g.status === 'Verified Resolved').length;
    return {
      name: dept,
      total: deptTickets.length,
      resolved: deptResolved,
      pending: deptTickets.length - deptResolved,
      rate: deptTickets.length > 0 ? Math.round((deptResolved / deptTickets.length) * 100) : 100,
    };
  });

  const handleReassignSubmit = async (e) => {
    e.preventDefault();
    if (!reassignTarget || !newDepartment) return;

    setIsReassigning(true);
    try {
      const response = await reassignGrievance(reassignTarget._id, newDepartment);
      if (onGrievanceUpdated) {
        onGrievanceUpdated(response.data?.grievance || response.data || response);
      }
      toast.success(`Department updated to ${newDepartment} (${reassignTarget.trackingId})`);
      setReassignTarget(null);
      setNewDepartment('');
    } catch (err) {
      console.error('Reassignment failed:', err);
      const errMsg = err.response?.data?.message || err.message || 'Failed to reassign department';
      toast.error(errMsg);
    } finally {
      setIsReassigning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-700 text-white flex items-center justify-center font-bold text-sm shrink-0">
              MC
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">
                  Municipal Command & Oversight Center
                </h2>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
                  ADMINISTRATIVE ACCESS
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Nellore Municipal Corporation • Executive Telemetry, AI Triage Pipeline & RBAC Security Audits
              </p>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 text-xs self-start md:self-auto">
            <button
              type="button"
              onClick={() => setActiveTab('ANALYTICS')}
              className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
                activeTab === 'ANALYTICS' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Executive Telemetry
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('DISPATCH')}
              className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
                activeTab === 'DISPATCH' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Dispatch Management
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('AUDIT_LOGS')}
              className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
                activeTab === 'AUDIT_LOGS' ? 'bg-white text-purple-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Login Audit Ledger
            </button>
          </div>
        </div>
      </div>

      {/* VIEW 1: EXECUTIVE ANALYTICS */}
      {activeTab === 'ANALYTICS' && (
        <div className="space-y-6">
          {/* Top 4 Stat Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Grievances</span>
              <div className="text-2xl font-mono font-bold text-slate-900 mt-1">{total}</div>
              <div className="text-[11px] text-slate-500 mt-0.5">8 Nellore landmark seeds</div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-500">Critical Unresolved (8-10)</span>
              <div className="text-2xl font-mono font-bold text-rose-600 mt-1">{critical}</div>
              <div className="text-[11px] text-rose-600 font-medium mt-0.5">Require urgent dispatch</div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Verified Cleared Rate</span>
              <div className="text-2xl font-mono font-bold text-emerald-700 mt-1">{resolutionRate}%</div>
              <div className="text-[11px] text-emerald-600 mt-0.5">{resolved} tickets audited</div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">Citizen Co-Signatures</span>
              <div className="text-2xl font-mono font-bold text-blue-700 mt-1">{totalUpvotes}</div>
              <div className="text-[11px] text-blue-600 mt-0.5">Community duplicate merges</div>
            </div>
          </div>

          {/* Department Performance Cards */}
          <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 tracking-tight mb-4">
              Departmental Workload & Clearance Rates
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {deptStats.map((d) => (
                <div key={d.name} className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">{d.name}</span>
                    <span className="text-xs font-mono font-bold text-slate-700">{d.rate}% cleared</span>
                  </div>

                  <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        d.rate >= 70 ? 'bg-emerald-500' : d.rate >= 40 ? 'bg-blue-500' : 'bg-amber-500'
                      }`}
                      style={{ width: `${d.rate}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 font-mono">
                    <span>Active: <strong className="text-slate-800">{d.pending}</strong></span>
                    <span>Closed: <strong className="text-emerald-700">{d.resolved}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI Pipeline Architecture Card */}
          <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900">
                Autonomous AI Triage Engine Telemetry
              </h3>
              <span className="inline-flex items-center gap-1.5 text-xs font-mono px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Cascade Active
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/70">
                <div className="font-semibold text-slate-800 mb-1">Multi-Model Cascade</div>
                <p className="text-slate-500 text-[11px] leading-relaxed">
                  Tier 1: <code className="text-blue-700 font-mono">gemini-3.8-flash</code> (Primary)<br />
                  Tier 2: <code className="text-slate-700 font-mono">gemini-3.5-flash-lite</code><br />
                  Tier 3: <code className="text-slate-700 font-mono">gemini-3.7-flash</code>
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/70">
                <div className="font-semibold text-slate-800 mb-1">Geospatial Deduplication</div>
                <p className="text-slate-500 text-[11px] leading-relaxed">
                  50-Meter Category-Scoped Clustering using MongoDB <code className="text-blue-700 font-mono">$near</code> 2dsphere and Haversine fallback. Distinct hazards remain separate tickets.
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/70">
                <div className="font-semibold text-slate-800 mb-1">Dual-Image Vision Audit</div>
                <p className="text-slate-500 text-[11px] leading-relaxed">
                  Before/After comparative vision audit evaluating quality and confidence score (0-100%) before status transition to <code className="text-emerald-700 font-mono">Verified Resolved</code>.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: DISPATCH & REASSIGNMENT MANAGEMENT */}
      {activeTab === 'DISPATCH' && (
        <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Departmental Routing & Reassignment Matrix</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Override AI department triage routing when cross-departmental coordination is required.
              </p>
            </div>
          </div>

          <div className="divide-y divide-slate-100 max-h-[550px] overflow-y-auto">
            {(Array.isArray(grievances) ? grievances : []).map((g) => (
              <div key={g._id} className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-12 h-12 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0">
                    {g.imageUrl ? (
                      <img src={g.imageUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[10px] font-mono text-slate-400">N/A</div>
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-900">{g.trackingId}</span>
                      <CategoryBadge category={g.category} />
                      <SeverityBadge score={g.severityScore} />
                    </div>
                    <p className="text-xs text-slate-700 truncate max-w-md mt-0.5 font-medium">
                      {g.aiSummary || g.description}
                    </p>
                    <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                      Routing: <span className="text-blue-700 font-semibold">{g.assignedDepartment || g.category}</span> • {g.locationName}
                    </div>
                  </div>
                </div>

                <div className="shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setReassignTarget(g);
                      setNewDepartment(g.assignedDepartment || g.category);
                    }}
                    className="px-3 py-1.5 border border-slate-200 hover:bg-slate-100 rounded-lg text-xs font-semibold text-slate-700 transition-colors"
                  >
                    Reassign Dept
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW 3: AUDIT LOGS */}
      {activeTab === 'AUDIT_LOGS' && (
        <LoginAuditTable />
      )}

      {/* Reassign Modal */}
      {reassignTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md p-5 space-y-4">
            <div>
              <div className="font-mono text-xs text-blue-700 font-bold">{reassignTarget.trackingId}</div>
              <h4 className="text-sm font-bold text-slate-900 mt-0.5">Reassign Municipal Department</h4>
              <p className="text-xs text-slate-500 mt-1">
                Currently routed to: <strong className="text-slate-800">{reassignTarget.assignedDepartment}</strong>
              </p>
            </div>

            <form onSubmit={handleReassignSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Select New Municipal Department
                </label>
                <select
                  value={newDepartment}
                  onChange={(e) => setNewDepartment(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="Roads & Infrastructure">Roads & Infrastructure</option>
                  <option value="Sanitation & Waste Management">Sanitation & Waste Management</option>
                  <option value="Water Supply & Drainage Board">Water Supply & Drainage Board</option>
                  <option value="Electrical & Power Division">Electrical & Power Division</option>
                  <option value="Public Works Department">Public Works Department</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setReassignTarget(null)}
                  disabled={isReassigning}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isReassigning}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors"
                >
                  {isReassigning ? 'Updating Routing...' : 'Save Reassignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
