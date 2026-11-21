import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
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
  Sparkles
} from 'lucide-react';

export default function PortalLoginPage() {
  const { login, register, loginAsDemo, sendVerificationOtp, verifyOtp, error: authError } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTarget = searchParams.get('redirect');

  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [demoOtp, setDemoOtp] = useState('');
  const [infoMsg, setInfoMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState('');

  const resetRegisterState = () => {
    setOtpSent(false);
    setOtp('');
    setDemoOtp('');
    setInfoMsg('');
    setLocalError('');
  };

  const handleDemoClick = async (role) => {
    setIsSubmitting(true);
    setLocalError('');
    try {
      await loginAsDemo(role);
      if (role === 'citizen') {
        navigate(redirectTarget || '/citizen');
      } else if (role === 'operator') {
        navigate(redirectTarget || '/operator');
      } else if (role === 'admin') {
        navigate(redirectTarget || '/admin');
      } else {
        navigate(redirectTarget || '/');
      }
    } catch (err) {
      console.error('Demo login error:', err);
      setLocalError(err.response?.data?.message || err.message || 'Demo login failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    if (!email || !phone) {
      setLocalError('Please provide both your email and a valid 10-digit mobile phone number.');
      return;
    }
    setIsSubmitting(true);
    setLocalError('');
    try {
      const res = await sendVerificationOtp({ email, phone });
      setOtpSent(true);
      setDemoOtp(res?.demoOtp || '123456');
      setInfoMsg(res?.message || 'Verification code sent to your email & mobile phone.');
    } catch (err) {
      setLocalError(err.response?.data?.message || err.message || 'Failed to dispatch verification OTP.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStandardSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setLocalError('');

    try {
      if (isRegistering) {
        if (!otpSent) {
          await handleSendOtp();
          setIsSubmitting(false);
          return;
        }

        if (!otp) {
          setLocalError('Please enter the 6-digit verification code.');
          setIsSubmitting(false);
          return;
        }

        const verifyRes = await verifyOtp({ email, phone, otp });
        const verificationToken = verifyRes?.verificationToken;

        await register({
          name,
          email,
          phone,
          password,
          otp,
          verificationToken
        });
        navigate(redirectTarget || '/citizen');
      } else {
        const res = await login({ email, password });
        const userRole = res?.user?.role;
        if (redirectTarget) {
          navigate(redirectTarget);
        } else if (userRole === 'admin') {
          navigate('/admin');
        } else if (userRole === 'operator') {
          navigate('/operator');
        } else {
          navigate('/citizen');
        }
      }
    } catch (err) {
      console.error('Login submit error:', err);
      setLocalError(err.response?.data?.message || err.message || 'Authentication failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 space-y-8 animate-in fade-in duration-200">
      {/* Top Banner / Gateway Header */}
      <div className="text-center space-y-2 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold">
          <Shield className="w-3.5 h-3.5" />
          <span>Nellore Municipal Corporation • Single Sign-On Gateway</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          NagarPulse AI Unified Portal Access
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Select an authorized role for 1-click evaluation access, or authenticate with department credentials.
        </p>
      </div>

      {(localError || authError) && (
        <div className="max-w-md mx-auto p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2.5 shadow-2xs">
          <svg className="w-4 h-4 text-rose-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <span>{localError || authError}</span>
        </div>
      )}

      {infoMsg && (
        <div className="max-w-md mx-auto p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2.5 shadow-2xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{infoMsg}</span>
        </div>
      )}

      {/* 1-Click Judge Demo Login Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              1-Click Judge Evaluation Logins
            </span>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            Auto-authenticated with persistent MongoDB audit logging
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 1. Citizen Portal Card */}
          <div
            onClick={() => !isSubmitting && handleDemoClick('citizen')}
            className="group relative bg-white border border-slate-200/90 hover:border-emerald-500 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center font-bold">
                  <User className="w-5 h-5" />
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono">
                  CITIZEN
                </span>
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                  Ravi Kumar
                </h3>
                <p className="text-[11px] font-mono text-slate-400">citizen@nagarpulse.in</p>
                <div className="text-[11px] font-semibold text-slate-600 mt-0.5">
                  Scope: All Municipal Divisions
                </div>
              </div>

              <p className="text-xs text-slate-500 leading-relaxed">
                Submit civic hazards with photo, voice notes, live GPS geotagging, and view personal complaint ledger.
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-emerald-700">
              <span>Sign in as Citizen</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* 2. Field Operator Card */}
          <div
            onClick={() => !isSubmitting && handleDemoClick('operator')}
            className="group relative bg-white border border-slate-200/90 hover:border-blue-500 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center font-bold">
                  <Wrench className="w-5 h-5" />
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 font-mono">
                  OPERATOR
                </span>
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                  Eng. Karthik Rao
                </h3>
                <p className="text-[11px] font-mono text-slate-400">operator.roads@nagarpulse.in</p>
                <div className="text-[11px] font-semibold text-blue-700 mt-0.5">
                  Scope: Roads Department
                </div>
              </div>

              <p className="text-xs text-slate-500 leading-relaxed">
                Acknowledge assigned defects, dispatch maintenance crews, and verify resolutions via AI camera before/after proof.
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-blue-700">
              <span>Sign in as Operator</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* 3. Municipal Admin Card */}
          <div
            onClick={() => !isSubmitting && handleDemoClick('admin')}
            className="group relative bg-white border border-slate-200/90 hover:border-purple-500 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 border border-purple-200 flex items-center justify-center font-bold">
                  <Building2 className="w-5 h-5" />
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200 font-mono">
                  ADMIN
                </span>
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-900 group-hover:text-purple-700 transition-colors">
                  Commissioner Nellore
                </h3>
                <p className="text-[11px] font-mono text-slate-400">admin@nagarpulse.in</p>
                <div className="text-[11px] font-semibold text-purple-700 mt-0.5">
                  Scope: City-Wide Executive Command
                </div>
              </div>

              <p className="text-xs text-slate-500 leading-relaxed">
                Full governance command, cross-department ticket overrides, SLA analytics, and persistent MongoDB login audit logs.
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-purple-700">
              <span>Sign in as Admin</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </div>

      {/* Standard Credentials Form */}
      <div className="max-w-md mx-auto bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="text-center">
          <h2 className="text-sm font-bold text-slate-900">
            {isRegistering ? 'Verified Citizen Registration' : 'Authenticate with Credentials'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {isRegistering
              ? 'Verify email & phone to register an authorized citizen account'
              : 'Sign in using your assigned email and password'}
          </p>
        </div>

        <form onSubmit={handleStandardSubmit} className="space-y-3">
          {isRegistering && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  placeholder="e.g. S. Venkat Reddy"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="email"
                required
                disabled={isRegistering && otpSent}
                placeholder="name@nagarpulse.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono disabled:opacity-75"
              />
            </div>
          </div>

          {isRegistering && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">Mobile Phone Number</label>
                <span className="text-[10px] text-slate-400">10-digit mobile</span>
              </div>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="tel"
                  required
                  disabled={otpSent}
                  placeholder="9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono disabled:opacity-75"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* OTP Verification Step for Registration */}
          {isRegistering && (
            <div className="pt-1">
              {!otpSent ? (
                <button
                  type="button"
                  disabled={isSubmitting || !email || !phone}
                  onClick={handleSendOtp}
                  className="w-full py-2 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
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
                      className="w-full pl-9 pr-3 py-2 text-xs font-mono tracking-widest bg-white border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 font-bold text-blue-900"
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
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
            disabled={isSubmitting || (isRegistering && !otpSent)}
            className="w-full py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                <span>Authenticating...</span>
              </>
            ) : (
              <span>
                {isRegistering
                  ? otpSent
                    ? 'Verify OTP & Complete Registration'
                    : 'Send Code First'
                  : 'Sign In to Workspace'}
              </span>
            )}
          </button>
        </form>

        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
          <button
            type="button"
            onClick={() => {
              setIsRegistering(!isRegistering);
              resetRegisterState();
            }}
            className="text-blue-700 hover:underline font-semibold"
          >
            {isRegistering ? 'Existing user? Sign In' : 'New citizen? Register here'}
          </button>

          <Link to="/" className="text-slate-500 hover:text-slate-800">
            Return to Live Map
          </Link>
        </div>
      </div>
    </div>
  );
}
