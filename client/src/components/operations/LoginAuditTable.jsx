import React, { useEffect, useState } from 'react';
import { getLoginLogs } from '../../services/authService';
import { formatDate, formatRelativeTime } from '../../utils/formatters';

export default function LoginAuditTable() {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({ total: 0, byRole: {} });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchLogs = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await getLoginLogs(50);
      const data = response.data || response;
      setLogs(data.logs || []);
      setStats({
        total: data.total || data.logs?.length || 0,
        byRole: data.byRole || {},
      });
    } catch (err) {
      console.error('Failed to fetch login audit logs:', err);
      setError('Unable to load login audit logs. Admin authorization required.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            ADMIN
          </span>
        );
      case 'operator':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            OPERATOR
          </span>
        );
      case 'citizen':
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            CITIZEN
          </span>
        );
    }
  };

  return (
    <div className="bg-white border border-slate-200/80 rounded-xl shadow-xs overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              MongoDB Persistent Login Audit Ledger
            </h3>
            <span className="text-xs font-mono font-bold px-2 py-0.5 bg-blue-50 text-blue-700 rounded border border-blue-100">
              Collection: LoginLog
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Tamper-evident access log recording citizen, operator, and administrator sessions with IP and role provenance.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchLogs}
            disabled={isLoading}
            className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 inline-flex items-center gap-1.5 transition-colors"
          >
            <svg
              className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-blue-600' : 'text-slate-500'}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>{isLoading ? 'Polling...' : 'Refresh Logs'}</span>
          </button>
        </div>
      </div>

      {/* Stats Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-slate-100 bg-slate-50/60 border-b border-slate-100">
        <div className="p-3.5 text-center">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Recorded Sessions</div>
          <div className="text-lg font-mono font-bold text-slate-900 mt-0.5">{stats.total}</div>
        </div>
        <div className="p-3.5 text-center">
          <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Citizen Logins</div>
          <div className="text-lg font-mono font-bold text-emerald-700 mt-0.5">{stats.byRole?.citizen || 0}</div>
        </div>
        <div className="p-3.5 text-center">
          <div className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Operator Logins</div>
          <div className="text-lg font-mono font-bold text-blue-700 mt-0.5">{stats.byRole?.operator || 0}</div>
        </div>
        <div className="p-3.5 text-center">
          <div className="text-[10px] font-bold text-purple-600 uppercase tracking-wider">Admin Logins</div>
          <div className="text-lg font-mono font-bold text-purple-700 mt-0.5">{stats.byRole?.admin || 0}</div>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 bg-rose-50 text-xs text-rose-700 border-b border-rose-100 flex items-center gap-2">
          <svg className="w-4 h-4 text-rose-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto max-h-[460px] overflow-y-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100 sticky top-0 z-10">
            <tr>
              <th className="py-2.5 px-4 font-semibold uppercase text-[10px] tracking-wider">User Identity</th>
              <th className="py-2.5 px-4 font-semibold uppercase text-[10px] tracking-wider">Role & Division</th>
              <th className="py-2.5 px-4 font-semibold uppercase text-[10px] tracking-wider">Auth Method</th>
              <th className="py-2.5 px-4 font-semibold uppercase text-[10px] tracking-wider font-mono">IP Address</th>
              <th className="py-2.5 px-4 font-semibold uppercase text-[10px] tracking-wider font-mono text-right">Timestamp</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading && logs.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-slate-400">
                  <div className="inline-flex items-center gap-2">
                    <svg className="animate-spin w-4 h-4 text-blue-600" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    <span>Reading audit records from MongoDB...</span>
                  </div>
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-400">
                  No login sessions recorded yet. Use the 1-click Demo Logins in Navbar to generate live audit logs.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log._id || log.timestamp} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-900">{log.name || 'Anonymous User'}</div>
                    <div className="text-[11px] text-slate-500 font-mono">{log.email}</div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1.5">
                      {getRoleBadge(log.role)}
                      <span className="text-[11px] text-slate-600 font-medium">
                        {log.department || 'All Divisions'}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    {log.loginMethod === 'demo-quick-login' ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 bg-blue-50 text-blue-700 rounded border border-blue-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                        1-Click Demo
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 bg-slate-100 text-slate-700 rounded border border-slate-200">
                        Credentials
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                    {log.ipAddress || '127.0.0.1'}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="font-mono text-slate-800 text-[11px]">
                      {formatDate(log.timestamp)}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {formatRelativeTime(log.timestamp)}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
