import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Mail, Lock, User, Loader2, ArrowRight, ShieldCheck, ArrowLeft, RefreshCw, AlertCircle } from 'lucide-react';
import { useAppStore } from '../store/store';
import { api, GOOGLE_AUTH_URL } from '../lib/api';

export default function AuthPage() {
  const [searchParams] = useSearchParams();
  const initialMode = searchParams.get('mode');
  const urlError = searchParams.get('error');

  const [isLogin, setIsLogin] = useState(initialMode !== 'signup');
  const [step, setStep] = useState<'form' | 'otp'>('form');

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // OTP State
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [devCode, setDevCode] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(
    urlError === 'google_not_configured'
      ? 'Google Sign-In is not configured yet (requires GOOGLE_CLIENT_ID). Please create an account or sign in with your email below.'
      : ''
  );
  const [infoMsg, setInfoMsg] = useState('');

  const { login } = useAppStore();
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Timer countdown for resending OTP
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Handle Login or Request OTP for Signup
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfoMsg('');

    if (isLogin) {
      if (!email || !password) {
        setError('Please enter both your email and password.');
        return;
      }
      setLoading(true);
      try {
        const res = await api.post<{ token: string; user: any }>('/auth/login', { email, password });
        login(res.user, res.token);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Invalid credentials. Please try again.');
      } finally {
        setLoading(false);
      }
    } else {
      // Signup: Request OTP
      if (!name.trim() || !email.trim() || !password) {
        setError('Please provide your name, email address, and a password.');
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters.');
        return;
      }

      setLoading(true);
      try {
        const res = await api.post<{ msg: string; devCode?: string }>('/auth/send-otp', {
          name: name.trim(),
          email: email.trim(),
          password
        });
        
        setStep('otp');
        setOtpDigits(['', '', '', '', '', '']);
        setResendCooldown(30);
        setInfoMsg(res.msg || 'Verification code sent to your email!');
        if (res.devCode) {
          setDevCode(res.devCode);
        } else {
          setDevCode(null);
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to send verification code.');
      } finally {
        setLoading(false);
      }
    }
  };

  // Handle OTP digit inputs
  const handleOtpChange = (index: number, val: string) => {
    const digit = val.slice(-1).replace(/[^0-9]/g, '');
    const newDigits = [...otpDigits];
    newDigits[index] = digit;
    setOtpDigits(newDigits);

    // Auto-advance
    if (digit && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const paste = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 6);
    if (!paste) return;
    const newDigits = [...otpDigits];
    for (let i = 0; i < paste.length; i++) {
      newDigits[i] = paste[i];
    }
    setOtpDigits(newDigits);
    const nextIdx = Math.min(paste.length, 5);
    otpInputRefs.current[nextIdx]?.focus();
  };

  // Handle OTP Verification
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullOtp = otpDigits.join('');
    if (fullOtp.length < 6) {
      setError('Please enter the complete 6-digit verification code.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await api.post<{ token: string; user: any }>('/auth/verify-otp', {
        email: email.trim(),
        otp: fullOtp
      });
      login(res.user, res.token);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Verification failed. Please check the code.');
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (resendCooldown > 0 || loading) return;
    setLoading(true);
    setError('');
    try {
      const res = await api.post<{ msg: string; devCode?: string }>('/auth/resend-otp', {
        email: email.trim()
      });
      setResendCooldown(30);
      setInfoMsg(res.msg || 'A fresh verification code has been sent to your email.');
      if (res.devCode) {
        setDevCode(res.devCode);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to resend verification code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950 text-slate-100">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-2xl shadow-indigo-500/25 mb-4">
            <Sparkles className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Nexus OS</h1>
          <p className="text-slate-400 text-sm mt-1">AI-powered productivity system</p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="card border-white/[0.08] backdrop-blur-xl shadow-2xl p-6 sm:p-8"
        >
          {/* Notifications & Error messages */}
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mb-6 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs sm:text-sm flex items-start gap-2.5"
            >
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </motion.div>
          )}

          {infoMsg && !error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mb-6 p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/25 text-indigo-300 text-xs sm:text-sm flex items-start gap-2.5"
            >
              <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
              <span>{infoMsg}</span>
            </motion.div>
          )}

          <AnimatePresence mode="wait">
            {step === 'form' ? (
              <motion.div
                key="auth-form"
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 15 }}
              >
                <div className="mb-6 text-center">
                  <h2 className="text-xl font-bold text-white">
                    {isLogin ? 'Sign In to Your Account' : 'Create Your Account'}
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    {isLogin
                      ? 'Enter your email and password to access your dashboard'
                      : 'Sign up to get started. We will verify your email with a 6-digit code.'}
                  </p>
                </div>

                <form onSubmit={handleAuthSubmit} className="space-y-4">
                  {!isLogin && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">
                        Full Name
                      </label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input
                          type="text"
                          required
                          className="input-base pl-11"
                          placeholder="Your Name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input
                        type="email"
                        required
                        className="input-base pl-11"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        autoComplete="email"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input
                        type="password"
                        required
                        className="input-base pl-11"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete={isLogin ? 'current-password' : 'new-password'}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !email || !password || (!isLogin && !name)}
                    className="btn-primary w-full mt-6 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {loading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        {isLogin ? 'Sign In' : 'Continue & Verify Email'}
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>

                {/* Divider */}
                <div className="relative my-7">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/[0.08]"></div>
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-slate-900/90 px-3 text-slate-500 uppercase tracking-wider font-medium">
                      Or continue with
                    </span>
                  </div>
                </div>

                {/* Google Sign-In */}
                <button
                  type="button"
                  onClick={() => {
                    window.location.href = GOOGLE_AUTH_URL;
                  }}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-3 p-3 rounded-xl bg-white text-slate-900 font-medium hover:bg-slate-100 transition-colors disabled:opacity-50 cursor-pointer shadow-sm text-sm"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Google Account
                </button>
              </motion.div>
            ) : (
              /* OTP Verification Step */
              <motion.div
                key="otp-step"
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setStep('form');
                    setError('');
                  }}
                  className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors mb-4"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to edit details
                </button>

                <div className="text-center mb-6">
                  <div className="w-12 h-12 mx-auto rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center mb-3">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <h2 className="text-xl font-bold text-white">Verify Your Email</h2>
                  <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                    We sent a 6-digit verification code to <span className="font-semibold text-indigo-300">{email}</span>
                  </p>
                </div>

                {devCode && (
                  <div
                    onClick={() => {
                      const chars = devCode.slice(0, 6).split('');
                      setOtpDigits(chars);
                    }}
                    className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs text-center cursor-pointer hover:bg-amber-500/15 transition-colors"
                  >
                    <p className="font-semibold">💡 Verification Code: {devCode}</p>
                    <p className="text-[11px] opacity-80 mt-0.5">(Click here to auto-fill your code)</p>
                  </div>
                )}

                <form onSubmit={handleVerifyOtp} className="space-y-6">
                  {/* 6 Digit Inputs */}
                  <div className="flex justify-between gap-2 sm:gap-2.5">
                    {otpDigits.map((digit, index) => (
                      <input
                        key={index}
                        ref={(el) => (otpInputRefs.current[index] = el)}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(index, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(index, e)}
                        onPaste={index === 0 ? handleOtpPaste : undefined}
                        className="w-11 h-13 sm:w-12 sm:h-14 text-center text-xl font-bold font-mono rounded-xl bg-white/[0.06] border border-white/[0.12] focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-white transition-all outline-none"
                      />
                    ))}
                  </div>

                  <button
                    type="submit"
                    disabled={loading || otpDigits.join('').length < 6}
                    className="btn-primary w-full flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {loading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        Verify & Activate Account
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>

                {/* Resend OTP */}
                <div className="mt-6 text-center">
                  {resendCooldown > 0 ? (
                    <p className="text-xs text-slate-500">
                      Resend code available in <span className="font-mono text-slate-300">{resendCooldown}s</span>
                    </p>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={loading}
                      className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> Resend verification code
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Switch Mode footer */}
        {step === 'form' && (
          <p className="text-center text-sm text-slate-500 mt-6">
            {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
                setInfoMsg('');
              }}
              className="text-indigo-400 hover:text-indigo-300 font-medium ml-1 transition-colors cursor-pointer"
            >
              {isLogin ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        )}
      </div>
    </div>
  );
}
