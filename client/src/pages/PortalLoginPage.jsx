import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import {
  Shield,
  User,
  Wrench,
  Building2,
  Lock,
  Mail,
  KeyRound,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  RotateCcw
} from 'lucide-react';

export default function PortalLoginPage() {
  const { login, register, loginAsDemo, sendVerificationOtp, verifyOtp, error: authError } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTarget = searchParams.get('redirect');

  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [demoOtp, setDemoOtp] = useState('');
  const [infoMsg, setInfoMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState('');

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

  const resetRegisterState = () => {
    setOtpSent(false);
    setOtp('');
    setDemoOtp('');
    setResendCooldown(0);
    setInfoMsg('');
    setLocalError('');
  };

  const handleDemoClick = async (role) => {
    setIsSubmitting(true);
    setLocalError('');
    try {
      const res = await loginAsDemo(role);
      const displayName = res?.user?.name || (role.charAt(0).toUpperCase() + role.slice(1));
      const displayRole = res?.user?.role ? (res.user.role.charAt(0).toUpperCase() + res.user.role.slice(1)) : (role.charAt(0).toUpperCase() + role.slice(1));
      toast.success(`Signed in as ${displayName} (${displayRole})`);
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
      const errMsg = err.response?.data?.message || err.message || 'Demo login failed';
      setLocalError(errMsg);
      toast.error(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendOtp = (e) => handleStep1Submit(e);

  // Step 1: Send 6-digit OTP code to citizen email
  const handleStep1Submit = async (e) => {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    const cleanEmail = String(email || '').trim().toLowerCase();
    const cleanName = String(name || '').trim();
    const cleanPassword = String(password || '');

    if (!cleanEmail) {
      const msg = 'Please provide your email address.';
      setLocalError(msg);
      toast.error(msg);
      return;
    }
    if (!cleanName) {
      const msg = 'Please provide your full name.';
      setLocalError(msg);
      toast.error(msg);
      return;
    }
    if (cleanPassword.length < 6) {
      const msg = 'Password must be at least 6 characters long.';
      setLocalError(msg);
      toast.error(msg);
      return;
    }

    setIsSubmitting(true);
    setLocalError('');
    try {
      const res = await sendVerificationOtp({ email: cleanEmail, name: cleanName, password: cleanPassword });
      setOtpSent(true);
      setResendCooldown(60);
      setDemoOtp(res?.demoOtp || res?.demoOtpHint || '');
      setInfoMsg(res?.message || `6-digit verification code sent to ${cleanEmail}.`);
      toast.success("6-digit verification OTP sent to your email");
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'Failed to dispatch verification OTP.';
      setLocalError(errMsg);
      toast.error(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 2: Verify OTP & Complete Registration
  const handleStep2Submit = async (e) => {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    setIsSubmitting(true);
    setLocalError('');

    const cleanEmail = String(email || '').trim().toLowerCase();
    const cleanName = String(name || '').trim();
    const cleanPassword = String(password || '');
    const cleanOtp = String(otp || '').trim();

    if (!cleanOtp || cleanOtp.length !== 6) {
      const msg = 'Please enter the 6-digit verification code.';
      setLocalError(msg);
      toast.error(msg);
      setIsSubmitting(false);
      return;
    }

    try {
      // 1. Verify Email OTP
      const verifyRes = await verifyOtp({ email: cleanEmail, otp: cleanOtp });
      const verificationToken = verifyRes?.verificationToken;

      // 2. Finalize citizen registration
      await register({
        name: cleanName,
        email: cleanEmail,
        password: cleanPassword,
        otp: cleanOtp,
        verificationToken
      });
      toast.success("Email verified! Welcome to NagarPulse AI");
      navigate(redirectTarget || '/citizen');
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'Invalid or expired OTP code.';
      setLocalError(errMsg);
      toast.error(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Standard Login submit
  const handleLoginSubmit = async (e) => {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    setIsSubmitting(true);
    setLocalError('');

    const cleanEmail = String(email || '').trim().toLowerCase();
    const cleanPassword = String(password || '');

    if (!cleanEmail) {
      const msg = 'Please provide your email address.';
      setLocalError(msg);
      toast.error(msg);
      setIsSubmitting(false);
      return;
    }
    if (!cleanPassword) {
      const msg = 'Please provide your password.';
      setLocalError(msg);
      toast.error(msg);
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await login({ email: cleanEmail, password: cleanPassword });
      const displayName = res?.user?.name || 'User';
      const displayRole = res?.user?.role ? (res.user.role.charAt(0).toUpperCase() + res.user.role.slice(1)) : 'Citizen';
      toast.success(`Signed in as ${displayName} (${displayRole})`);
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
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'Wrong credentials. Please check email and password.';
      setLocalError(errMsg);
      toast.error(errMsg);
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
            Pre-verified demo accounts • Instant 1-click access without OTP friction
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

      {/* Clean 2-Step Citizen Email Registration & Login Form */}
      <div className="max-w-md mx-auto bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="text-center">
          <h2 className="text-sm font-bold text-slate-900">
            {isRegistering
              ? otpSent
                ? 'Step 2: Enter Email Verification OTP'
                : 'Step 1: Citizen Account Details'
              : 'Sign in to NagarPulse AI'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {isRegistering
              ? otpSent
                ? `6-digit code sent to ${email} (valid for 10 minutes)`
                : 'Enter your credentials to receive an Email Verification OTP'
              : 'Sign in using your registered email and password'}
          </p>
        </div>

        {/* Form Area: Step 1 vs Step 2 vs Standard Login as mutually exclusive forms */}
        {isRegistering ? (
          otpSent ? (
            /* STEP 2: 6-Digit Email OTP Form (Mutually exclusive form, NO password input, ignores autofill extensions) */
            <form
              onSubmit={handleStep2Submit}
              autoComplete="off"
              data-lpignore="true"
              className="space-y-3"
            >
              <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl space-y-3 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-blue-900 block">Enter 6-Digit Email OTP</span>
                    <span className="text-[10px] text-blue-700 font-mono">{email}</span>
                  </div>
                  <button
                    type="button"
                    onClick={resetRegisterState}
                    className="text-[11px] text-blue-700 hover:underline font-semibold cursor-pointer"
                  >
                    Change Details
                  </button>
                </div>

                <div className="relative">
                  <KeyRound className="w-4 h-4 text-blue-500 absolute left-3 top-2.5" />
                  <input
                    id="portal-otp"
                    name="otp"
                    type="text"
                    maxLength={6}
                    required
                    autoFocus
                    inputMode="numeric"
                    autoComplete="off"
                    data-lpignore="true"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="123456"
                    className="w-full pl-9 pr-3 py-2 text-xs font-mono tracking-widest bg-white border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 font-bold text-blue-900 text-center"
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
                        onClick={handleStep1Submit}
                        disabled={isSubmitting}
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
                      className="px-2 py-0.5 bg-white border border-blue-200 rounded text-blue-700 font-mono font-bold hover:bg-blue-50 transition-colors shadow-2xs cursor-pointer"
                    >
                      Auto-Fill {demoOtp}
                    </button>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    <span>Processing...</span>
                  </>
                ) : (
                  <span>Verify OTP &amp; Complete Registration</span>
                )}
              </button>
            </form>
          ) : (
            /* STEP 1: Registration Form (Full Name, Email, Password -> "Send Verification OTP") */
            <form onSubmit={handleStep1Submit} className="space-y-3">
              <div>
                <label htmlFor="portal-name" className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    id="portal-name"
                    name="name"
                    type="text"
                    required
                    autoComplete="name"
                    placeholder="e.g. S. Venkat Reddy"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="portal-email" className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    id="portal-email"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 font-mono"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="portal-password" className="block text-xs font-semibold text-slate-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    id="portal-password"
                    name="password"
                    type="password"
                    required
                    autoComplete="new-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    <span>Processing...</span>
                  </>
                ) : (
                  <span>Send Verification OTP</span>
                )}
              </button>
            </form>
          )
        ) : (
          /* STANDARD LOGIN FORM */
          <form onSubmit={handleLoginSubmit} className="space-y-3">
            <div>
              <label htmlFor="portal-login-email" className="block text-xs font-semibold text-slate-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  id="portal-login-email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 font-mono"
                />
              </div>
            </div>

            <div>
              <label htmlFor="portal-login-password" className="block text-xs font-semibold text-slate-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  id="portal-login-password"
                  name="password"
                  type="password"
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  <span>Processing...</span>
                </>
              ) : (
                <span>Sign In to Workspace</span>
              )}
            </button>
          </form>
        )}

        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
          <button
            type="button"
            onClick={() => {
              setIsRegistering(!isRegistering);
              resetRegisterState();
            }}
            className="text-blue-700 hover:underline font-semibold cursor-pointer"
          >
            {isRegistering ? 'Existing user? Sign In' : 'New citizen? Register with Email OTP'}
          </button>

          <Link to="/" className="text-slate-500 hover:text-slate-800">
            Return to Live Map
          </Link>
        </div>
      </div>
    </div>
  );
}
