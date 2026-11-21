import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  X,
  Shield,
  User,
  Wrench,
  Building2,
  Lock,
  Mail,
  KeyRound,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  RotateCcw
} from 'lucide-react';

export const LoginModal = () => {
  const {
    isLoginModalOpen,
    closeLoginModal,
    login,
    register,
    sendVerificationOtp,
    verifyOtp,
    targetPortal
  } = useAuth();

  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [demoOtp, setDemoOtp] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 60-second cooldown interval timer for OTP resend
  useEffect(() => {
    let timer;
    if (otpSent && resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [otpSent, resendCooldown]);

  if (!isLoginModalOpen) return null;

  const resetRegisterState = () => {
    setOtpSent(false);
    setOtp('');
    setDemoOtp('');
    setResendCooldown(0);
    setInfoMessage('');
    setError(null);
  };

  // Step 1: Send 6-digit OTP code to citizen email
  const handleSendOtp = async (e) => {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    const cleanEmail = String(email || '').trim().toLowerCase();
    const cleanName = String(name || '').trim();
    const cleanPassword = String(password || '');

    if (!cleanEmail) {
      setError('Please provide your email address.');
      return;
    }
    if (isRegisterMode && !cleanName) {
      setError('Please provide your full name.');
      return;
    }
    if (isRegisterMode && cleanPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await sendVerificationOtp({ email: cleanEmail, name: cleanName, password: cleanPassword });
      setOtpSent(true);
      setResendCooldown(60);
      setDemoOtp(res?.demoOtp || res?.demoOtpHint || '');
      setInfoMessage(res?.message || `6-digit verification code sent to ${cleanEmail}.`);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to dispatch verification OTP.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2 or Login submission
  const handleCredentialsSubmit = async (e) => {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    setLoading(true);
    setError(null);

    const cleanEmail = String(email || '').trim().toLowerCase();
    const cleanName = String(name || '').trim();
    const cleanPassword = String(password || '');
    const cleanOtp = String(otp || '').trim();

    try {
      if (isRegisterMode) {
        if (!otpSent) {
          // If in Step 1, trigger sending the verification OTP
          await handleSendOtp();
          setLoading(false);
          return;
        }

        if (!cleanOtp || cleanOtp.length !== 6) {
          setError('Please enter the 6-digit verification code.');
          setLoading(false);
          return;
        }

        // Verify OTP first
        const verifyRes = await verifyOtp({ email: cleanEmail, otp: cleanOtp });
        const verificationToken = verifyRes?.verificationToken;

        // Register citizen with verified email
        await register({
          name: cleanName,
          email: cleanEmail,
          password: cleanPassword,
          otp: cleanOtp,
          verificationToken
        });
        closeLoginModal();
      } else {
        await login({ email: cleanEmail, password: cleanPassword });
        closeLoginModal();
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (demoRole) => {
    setLoading(true);
    setError(null);
    try {
      await login({ demoRole });
      closeLoginModal();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="px-5 sm:px-6 pt-5 pb-4 border-b border-slate-100 flex items-start justify-between shrink-0">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold mb-1.5">
              <Shield className="w-3.5 h-3.5" />
              <span>NagarPulse Access Control (RBAC)</span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">
              {isRegisterMode
                ? otpSent
                  ? 'Step 2: Enter Email Verification OTP'
                  : 'Step 1: Citizen Account Details'
                : 'Portal Authentication'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {isRegisterMode
                ? otpSent
                  ? `6-digit code sent to ${email} (valid for 10 minutes)`
                  : 'Enter your credentials to receive an Email Verification OTP'
                : targetPortal
                ? `Sign in to access the ${targetPortal} workspace.`
                : 'Sign in to access personalized civic portals and operations.'}
            </p>
          </div>
          <button
            onClick={closeLoginModal}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 sm:p-6 space-y-4 overflow-y-auto">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {infoMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
              <span>{infoMessage}</span>
            </div>
          )}

          {/* 1-Click Judge Demo Logins */}
          <div className="bg-slate-50 p-3.5 sm:p-4 rounded-xl border border-slate-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                Instant 1-Click Judge Demo Login
              </span>
              <span className="text-[10px] font-mono text-slate-400">Pre-Verified</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                disabled={loading}
                onClick={() => handleDemoLogin('citizen')}
                className="flex flex-col items-center justify-center p-2 sm:p-2.5 bg-white hover:bg-blue-50/60 border border-slate-200 hover:border-blue-300 rounded-lg text-center transition-all group cursor-pointer shadow-2xs"
              >
                <div className="w-7 h-7 rounded-full bg-slate-100 group-hover:bg-blue-100 flex items-center justify-center text-slate-700 group-hover:text-blue-700 mb-1">
                  <User className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-semibold text-slate-800">Citizen</span>
                <span className="text-[10px] text-slate-500">Ravi Kumar</span>
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={() => handleDemoLogin('operator')}
                className="flex flex-col items-center justify-center p-2 sm:p-2.5 bg-white hover:bg-blue-50/60 border border-slate-200 hover:border-blue-300 rounded-lg text-center transition-all group cursor-pointer shadow-2xs"
              >
                <div className="w-7 h-7 rounded-full bg-slate-100 group-hover:bg-blue-100 flex items-center justify-center text-slate-700 group-hover:text-blue-700 mb-1">
                  <Wrench className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-semibold text-slate-800">Operator</span>
                <span className="text-[10px] text-slate-500">Roads Dept</span>
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={() => handleDemoLogin('admin')}
                className="flex flex-col items-center justify-center p-2 sm:p-2.5 bg-white hover:bg-blue-50/60 border border-slate-200 hover:border-blue-300 rounded-lg text-center transition-all group cursor-pointer shadow-2xs"
              >
                <div className="w-7 h-7 rounded-full bg-slate-100 group-hover:bg-blue-100 flex items-center justify-center text-slate-700 group-hover:text-blue-700 mb-1">
                  <Building2 className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-semibold text-slate-800">Admin</span>
                <span className="text-[10px] text-slate-500">Commissioner</span>
              </button>
            </div>
          </div>

          <div className="relative flex items-center justify-center">
            <div className="border-t border-slate-200 w-full" />
            <span className="bg-white px-3 text-[11px] font-medium text-slate-400 uppercase tracking-wider absolute">
              Or {isRegisterMode ? 'New Citizen Registration' : 'Credentials'}
            </span>
          </div>

          {/* Clean 2-Step Registration / Login Form */}
          <form onSubmit={handleCredentialsSubmit} className="space-y-3">
            {/* Account Details (Name, Email, Password) - always mounted for password manager & extension compatibility */}
            <div className="space-y-3">
              {isRegisterMode && (
                <div>
                  <label htmlFor="modal-name" className="block text-xs font-semibold text-slate-700 mb-1">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      id="modal-name"
                      name="name"
                      type="text"
                      required
                      autoComplete="name"
                      disabled={isRegisterMode && otpSent}
                      readOnly={isRegisterMode && otpSent}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Ramesh Varma"
                      className={`w-full pl-9 pr-3 py-2 text-xs sm:text-sm border rounded-xl focus:outline-none transition-colors ${
                        isRegisterMode && otpSent
                          ? 'bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed'
                          : 'bg-slate-50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600'
                      }`}
                    />
                  </div>
                </div>
              )}

              <div>
                <label htmlFor="modal-email" className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    id="modal-email"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    disabled={isRegisterMode && otpSent}
                    readOnly={isRegisterMode && otpSent}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className={`w-full pl-9 pr-3 py-2 text-xs sm:text-sm border rounded-xl focus:outline-none transition-colors font-mono ${
                      isRegisterMode && otpSent
                        ? 'bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed'
                        : 'bg-slate-50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="modal-password" className="block text-xs font-semibold text-slate-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    id="modal-password"
                    name="password"
                    type="password"
                    required
                    autoComplete={isRegisterMode ? 'new-password' : 'current-password'}
                    disabled={isRegisterMode && otpSent}
                    readOnly={isRegisterMode && otpSent}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className={`w-full pl-9 pr-3 py-2 text-xs sm:text-sm border rounded-xl focus:outline-none transition-colors ${
                      isRegisterMode && otpSent
                        ? 'bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed'
                        : 'bg-slate-50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600'
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* STEP 2: 6-Digit Email OTP Input with 60s Cooldown Timer */}
            {isRegisterMode && otpSent && (
              <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl space-y-3 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-blue-900 block">Enter 6-Digit Email OTP</span>
                    <span className="text-[10px] text-blue-700 font-mono">{email}</span>
                  </div>
                  <button
                    type="button"
                    onClick={resetRegisterState}
                    className="text-[11px] text-blue-700 hover:underline font-semibold"
                  >
                    Change Email
                  </button>
                </div>

                <div className="relative">
                  <KeyRound className="w-4 h-4 text-blue-500 absolute left-3 top-2.5" />
                  <input
                    id="modal-otp"
                    name="otp"
                    type="text"
                    maxLength={6}
                    required
                    autoFocus
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="123456"
                    className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm font-mono tracking-widest bg-white border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 font-bold text-blue-900 text-center"
                  />
                </div>

                {/* 60-Second Cooldown Resend & Demo Pill */}
                <div className="flex items-center justify-between text-[11px] pt-1">
                  <div>
                    {resendCooldown > 0 ? (
                      <span className="text-slate-400 font-mono">
                        Resend code in <strong className="text-blue-700">{resendCooldown}s</strong>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        disabled={loading}
                        className="inline-flex items-center gap-1 text-blue-700 hover:text-blue-800 font-semibold cursor-pointer"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Resend OTP</span>
                      </button>
                    )}
                  </div>

                  {demoOtp && (
                    <button
                      type="button"
                      onClick={() => setOtp(demoOtp)}
                      className="px-2 py-0.5 bg-white border border-blue-200 rounded text-blue-700 font-mono font-bold hover:bg-blue-50 transition-colors shadow-2xs"
                    >
                      Auto-Fill {demoOtp}
                    </button>
                  )}
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-blue-700 hover:bg-blue-800 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>
                    {isRegisterMode
                      ? otpSent
                        ? 'Verify OTP & Create Account'
                        : 'Send Verification OTP'
                      : 'Sign In'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Toggle between Login and Register */}
          <div className="pt-2 text-center text-xs text-slate-500 border-t border-slate-100">
            {isRegisterMode ? (
              <span>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setIsRegisterMode(false);
                    resetRegisterState();
                  }}
                  className="text-blue-700 font-semibold hover:underline cursor-pointer"
                >
                  Sign in here
                </button>
              </span>
            ) : (
              <span>
                New resident in Nellore?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setIsRegisterMode(true);
                    resetRegisterState();
                  }}
                  className="text-blue-700 font-semibold hover:underline cursor-pointer"
                >
                  Register as Citizen
                </button>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;
