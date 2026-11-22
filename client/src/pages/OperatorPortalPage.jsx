import React from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import OperatorQueue from '../components/operations/OperatorQueue';

export default function OperatorPortalPage({ grievances = [], onGrievanceUpdated, isLoading = false }) {
  const { user, loginAsDemo, openLoginModal } = useAuth();

  const handleDemoOperator = async () => {
    try {
      const res = await loginAsDemo('operator');
      toast.success(`Signed in as ${res?.user?.name || 'Eng. Karthik Rao'} (Operator)`);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Demo login failed');
    }
  };

  const isOperatorOrAdmin = user && (user.role === 'operator' || user.role === 'admin');

  if (!isOperatorOrAdmin) {
    return (
      <div className="max-w-xl mx-auto my-12 bg-white rounded-2xl border border-slate-200/80 p-8 shadow-xs text-center space-y-4">
        <div className="w-12 h-12 bg-blue-100 text-blue-700 rounded-xl flex items-center justify-center mx-auto">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>

        <div>
          <h3 className="text-lg font-bold text-slate-900">Field Operator Dispatch Desk</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            This workspace requires Field Technician or Municipal Engineering credentials to access the work order dispatch queue and perform Gemini Vision repair audits.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={handleDemoOperator}
            className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors inline-flex items-center justify-center gap-2 cursor-pointer"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>1-Click Demo Login (Eng. Karthik Rao • Roads)</span>
          </button>
          <button
            type="button"
            onClick={() => openLoginModal('operator')}
            className="w-full sm:w-auto px-4 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-medium transition-colors cursor-pointer"
          >
            Custom Credentials
          </button>
        </div>
      </div>
    );
  }

  return (
    <OperatorQueue
      grievances={grievances}
      onGrievanceUpdated={onGrievanceUpdated}
      isLoading={isLoading}
    />
  );
}
