import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  X,
  Shield,
  User,
  Wrench,
  Building2,
  Lock,
  Mail,
  Phone,
  KeyRound,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Sparkles
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
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [demoOtp, setDemoOtp] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isLoginModalOpen) return null;

  const resetRegisterState = () => {
    setOtpSent(false);
    setOtp('');
    setDemoOtp('');
    setInfoMessage('');
    setError(null);
  };

  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    if (!email || !phone) {
      setError('Please provide both your email and a 10-digit mobile phone number.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await sendVerificationOtp({ email, phone });
      setOtpSent(true);
      setDemoOtp(res?.demoOtpHint || res?.demoOtp || '123456');
      setInfoMessage(res?.message || 'Verification code sent to your email & mobile phone.');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to dispatch verification OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleCredentialsSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (isRegisterMode) {
        if (!otpSent) {
          // If citizen clicked submit before sending OTP, send it first
          await handleSendOtp();
          setLoading(false);
          return;
        }

        if (!otp) {
          setError('Please enter the 6-digit verification code.');
          setLoading(false);
          return;
        }

        // Verify OTP first to get verificationToken
        const verifyRes = await verifyOtp({ email, phone, otp });
        const verificationToken = verifyRes?.verificationToken;

        // Register citizen with verified credentials
        await register({
          name,
          email,
          phone,
          password,
          otp,
          verificationToken
        });
      } else {
        await login({ email, password });
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
              {isRegisterMode ? 'Verified Citizen Registration' : 'Portal Authentication'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {isRegisterMode
                ? 'Verify email & phone to register an authorized citizen account.'
                : targetPortal
                ? `Sign in to access the ${targetPortal} workspace.`
                : 'Sign in to access personalized civic portals and operations.'}
            </p>
          </div>
          <button
            onClick={closeLoginModal}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
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
              <span className="text-[10px] font-mono text-slate-400">Audit Logged</span>
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
              Or {isRegisterMode ? 'New Account Details' : 'Credentials'}
            </span>
          </div>

          {/* Standard Form */}
          <form onSubmit={handleCredentialsSubmit} className="space-y-3">
            {isRegisterMode && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Ramesh Varma"
                    className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-colors"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="email"
                  required
                  disabled={isRegisterMode && otpSent}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-colors font-mono disabled:opacity-75"
                />
              </div>
            </div>

            {isRegisterMode && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Mobile Phone Number
                  </label>
                  <span className="text-[10px] text-slate-400">10-digit mobile</span>
                </div>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="tel"
                    required
                    disabled={otpSent}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="9876543210"
                    className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-colors font-mono disabled:opacity-75"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-colors"
                />
              </div>
            </div>

            {/* OTP Verification Step (Register Mode) */}
            {isRegisterMode && (
              <div className="pt-1">
                {!otpSent ? (
                  <button
                    type="button"
                    disabled={loading || !email || !phone}
                    onClick={handleSendOtp}
                    className="w-full py-2 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-semibold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>Send 6-Digit Verification OTP</span>
                  </button>
                ) : (
                  <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl space-y-2 animate-in fade-in">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-blue-900">
                        Enter 6-Digit OTP Code
                      </label>
                      <button
                        type="button"
                        onClick={resetRegisterState}
                        className="text-[11px] text-blue-700 hover:underline"
                      >
                        Edit Contact
                      </button>
                    </div>

                    <div className="relative">
                      <KeyRound className="w-4 h-4 text-blue-500 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        maxLength={6}
                        required
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        placeholder="e.g. 123456"
                        className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm font-mono tracking-widest bg-white border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 font-bold text-blue-900"
                      />
                    </div>

                    {/* Judge Auto-Fill Demo OTP Pill */}
                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                      <span>Demo OTP:</span>
                      <button
                        type="button"
                        onClick={() => setOtp(demoOtp || '123456')}
                        className="px-2 py-0.5 bg-white border border-blue-200 rounded text-blue-700 font-mono font-bold hover:bg-blue-50 transition-colors"
                      >
                        Auto-Fill {demoOtp || '123456'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || (isRegisterMode && !otpSent)}
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
                        : 'Send Code First'
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
