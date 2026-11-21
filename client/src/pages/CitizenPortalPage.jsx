import React, { useState } from 'react';
import ReportForm from '../components/citizen/ReportForm';
import MyReportsList from '../components/citizen/MyReportsList';
import { useAuth } from '../context/AuthContext';
import { Lock, ShieldCheck, Sparkles, User, FileText, ListFilter } from 'lucide-react';

export default function CitizenPortalPage({ grievances = [], onGrievanceCreated }) {
  const { user, isAuthenticated, loginAsDemo, openLoginModal } = useAuth();
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [demoLoading, setDemoLoading] = useState(false);
  const [mobileTab, setMobileTab] = useState('report'); // 'report' | 'ledger'

  const isCitizenAuthorized = isAuthenticated && user && (user.role === 'citizen' || user.role === 'admin');

  const handleCreated = (newGrievance) => {
    setSelectedTicket(newGrievance);
    if (onGrievanceCreated) {
      onGrievanceCreated(newGrievance);
    }
  };

  const handleCitizenDemo = async () => {
    setDemoLoading(true);
    try {
      await loginAsDemo('citizen');
    } catch (err) {
      console.error('Citizen demo login error:', err);
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Banner / Citizen Help Bar */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-slate-900">
                Citizen Civic Action Desk
              </h2>
              <span className="text-[11px] sm:text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                AI TRIAGE & GEOTAGGING
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Report potholes, exposed power lines, overflowing garbage, and water leaks directly to Nellore Municipal Corporation.
            </p>
          </div>

          {!isCitizenAuthorized ? (
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleCitizenDemo}
                disabled={demoLoading}
                className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold border border-emerald-200 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>1-Click Citizen Demo</span>
              </button>
              <button
                type="button"
                onClick={() => openLoginModal('citizen')}
                className="px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold border border-blue-200 transition-colors cursor-pointer"
              >
                Sign In
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-medium shrink-0">
              <User className="w-3.5 h-3.5 text-emerald-600" />
              <span>Logged In: <strong>{user.name}</strong> (Citizen)</span>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Tab Switcher for Responsive Small Screens */}
      <div className="flex lg:hidden bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
        <button
          type="button"
          onClick={() => setMobileTab('report')}
          className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            mobileTab === 'report'
              ? 'bg-white text-blue-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Report Hazard</span>
        </button>
        <button
          type="button"
          onClick={() => setMobileTab('ledger')}
          className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            mobileTab === 'ledger'
              ? 'bg-white text-blue-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <ListFilter className="w-3.5 h-3.5" />
          <span>Complaint Ledger ({Array.isArray(grievances) ? grievances.length : 0})</span>
        </button>
      </div>

      {/* Grid: Form on Left, Ledger on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Report Submission Form (7 cols) */}
        <div className={`lg:col-span-7 space-y-4 ${mobileTab === 'ledger' ? 'hidden lg:block' : 'block'}`}>
          {isCitizenAuthorized ? (
            <ReportForm onGrievanceCreated={handleCreated} />
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-8 text-center space-y-5 animate-in fade-in duration-200">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto shadow-xs">
                <Lock className="w-7 h-7" />
              </div>
              <div className="space-y-2 max-w-md mx-auto">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Verified Citizen Access Required</span>
                </span>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900">
                  Citizen Login Required to Report Hazards
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                  Nellore Municipal Corporation restricts civic incident logging to authenticated citizens to ensure tamper-proof GPS telemetry, eliminate duplicate spam/media replay attacks, and link real-time repair audit notifications directly to your municipal tracking ledger.
                </p>
              </div>

              {/* 1-Click Citizen Demo Login & Standard Login */}
              <div className="space-y-2.5 max-w-sm mx-auto pt-2">
                <button
                  type="button"
                  onClick={handleCitizenDemo}
                  disabled={demoLoading}
                  className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  <Sparkles className="w-4 h-4 text-emerald-200" />
                  <span>1-Click Citizen Demo Login (Ravi Kumar)</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => openLoginModal('citizen')}
                    className="flex-1 py-2.5 px-3 bg-blue-700 hover:bg-blue-800 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                  >
                    Citizen Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => openLoginModal('register')}
                    className="flex-1 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl border border-slate-200 transition-colors cursor-pointer"
                  >
                    Verify &amp; Register
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right: Citizen Complaint Ledger (5 cols) */}
        <div className={`lg:col-span-5 space-y-4 ${mobileTab === 'report' ? 'hidden lg:block' : 'block'}`}>
          <MyReportsList
            grievances={grievances}
            selectedId={selectedTicket?._id}
            onSelectGrievance={(g) => setSelectedTicket(g)}
          />
        </div>
      </div>
    </div>
  );
}
