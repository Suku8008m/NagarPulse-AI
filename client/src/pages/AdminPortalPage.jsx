import React from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import AdminCommandCenter from '../components/operations/AdminCommandCenter';

export default function AdminPortalPage({ grievances = [], onGrievanceUpdated }) {
  const { user, loginAsDemo, openLoginModal } = useAuth();

  const handleDemoAdmin = async () => {
    try {
      const res = await loginAsDemo('admin');
      toast.success(`Signed in as ${res?.user?.name || 'Commissioner Nellore'} (Admin)`);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Demo login failed');
    }
  };

  const isAdmin = user && user.role === 'admin';

  if (!isAdmin) {
    return (
      <div className="max-w-xl mx-auto my-12 bg-white rounded-2xl border border-slate-200/80 p-8 shadow-xs text-center space-y-4">
        <div className="w-12 h-12 bg-purple-100 text-purple-700 rounded-xl flex items-center justify-center mx-auto">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>

        <div>
          <h3 className="text-lg font-bold text-slate-900">Municipal Command Center</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Restricted access. Requires Municipal Commissioner credentials to inspect city-wide resolution telemetry, override department routing, and audit persistent MongoDB login sessions.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={handleDemoAdmin}
            className="w-full sm:w-auto px-5 py-2.5 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors inline-flex items-center justify-center gap-2 cursor-pointer"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>1-Click Demo Login (Commissioner Nellore)</span>
          </button>
          <button
            type="button"
            onClick={() => openLoginModal('admin')}
            className="w-full sm:w-auto px-4 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-medium transition-colors cursor-pointer"
          >
            Custom Credentials
          </button>
        </div>
      </div>
    );
  }

  return (
    <AdminCommandCenter
      grievances={grievances}
      onGrievanceUpdated={onGrievanceUpdated}
    />
  );
}
