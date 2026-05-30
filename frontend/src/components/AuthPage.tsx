import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

import {
  Mail,
  Lock,
  Loader2,
  ArrowRight,
  ArrowLeft,
  ShieldAlert,
  ShieldCheck,
  Timer,
  RefreshCw,
  KeyRound
} from 'lucide-react';

import { toast } from 'sonner';
import { loginUser, registerUser, forgotPassword, resetPassword } from '../api';
import { useAuth } from '../lib/AuthContext';

export function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);

  // Main auth
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Forgot password flow
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [showOtpScreen, setShowOtpScreen] = useState(false);

  const [resetEmail, setResetEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Timers
  const [timerCountSlots, setTimerCountSlots] = useState(300);
  const [timerResendSlots, setTimerResendSlots] = useState(0);
  const [timerActive, setTimerActive] = useState(false);

  const [loading, setLoading] = useState(false);

  const { login } = useAuth();

  // OTP Expiry Timer
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    if (timerActive && timerCountSlots > 0) {
      interval = setInterval(() => {
        setTimerCountSlots((prev) => prev - 1);
      }, 1000);
    } else if (timerCountSlots === 0) {
      setTimerActive(false);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerActive, timerCountSlots]);

  // Resend Timer
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    if (timerResendSlots > 0) {
      interval = setInterval(() => {
        setTimerResendSlots((prev) => prev - 1);
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerResendSlots]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;

    return `${mins.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}`;
  };

  // LOGIN / REGISTER
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error('Please enter email and password');
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        const res = await loginUser({ email, password });

        login(res.access_token);

        toast.success('Successfully logged in');
      } else {
        await registerUser({ email, password });

        toast.success('Registration successful. Logging you in...');

        const res = await loginUser({ email, password });

        login(res.access_token);
      }
    } catch (err: any) {
      toast.error(err.message || 'Authentication failed');
      if (err.message && err.message.includes('Too many failed login attempts')) {
        handleStartForgotPassword();
      }
    } finally {
      setLoading(false);
    }
  };

  // OPEN FORGOT PASSWORD
  const handleStartForgotPassword = () => {
    setResetEmail(email);

    setIsForgotPassword(true);
    setShowOtpScreen(false);

    setOtpCode('');
    setGeneratedOtp('');

    setNewPassword('');
    setConfirmPassword('');
  };

  // SEND OTP
  const handleResendOtp = async () => {
    if (timerResendSlots > 0 || loading) return;

    setLoading(true);
    try {
      await forgotPassword(resetEmail);
      setTimerCountSlots(300);
      setTimerResendSlots(20);
      setTimerActive(true);
      toast.success('A new OTP has been sent to your email.');
    } catch (err: any) {
      toast.error(err.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  // REQUEST OTP
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!resetEmail) {
      toast.error('Please enter your email address');
      return;
    }

    setLoading(true);

    try {
      await forgotPassword(resetEmail);

      setIsForgotPassword(false);
      setShowOtpScreen(true);

      // Initialize verification timer
      setTimerCountSlots(300);
      setTimerResendSlots(20);
      setTimerActive(true);
      toast.success(`Verification code sent to ${resetEmail}`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to request OTP');
    } finally {
      setLoading(false);
    }
  };

  // VERIFY OTP + RESET
  const handleVerifyOtpAndReset = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!otpCode) {
      toast.error('Please enter OTP');
      return;
    }

    if (timerCountSlots <= 0) {
      toast.error('OTP expired');
      return;
    }

    if (!newPassword || newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      await resetPassword({
        email: resetEmail,
        otp: otpCode,
        new_password: newPassword
      });

      toast.success('Password reset successful');

      setShowOtpScreen(false);
      setIsLogin(true);

      setPassword('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dark min-h-screen w-full bg-black text-white flex items-center justify-center p-4 relative overflow-hidden font-sans">

      {/* Background */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(#ffffff03_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-600/10 blur-[120px] rounded-full -mr-48 -mt-48 pointer-events-none z-0" />

      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-600/10 blur-[100px] rounded-full -ml-32 -mb-32 pointer-events-none z-0" />

      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="w-full max-w-md bg-zinc-950/80 border border-white/10 p-8 rounded-3xl backdrop-blur-3xl z-10 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] relative overflow-hidden"
      >

        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 opacity-60" />

        <AnimatePresence mode="wait">

          {/* FORGOT PASSWORD */}
          {isForgotPassword ? (
            <motion.div
              key="forgot"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
            >

              <button
                type="button"
                onClick={() => setIsForgotPassword(false)}
                className="absolute left-6 top-8 text-zinc-500 hover:text-white"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>

              <div className="text-center mb-8">
                <div className="h-12 w-12 bg-blue-500/10 border border-blue-500/20 rounded-2xl mx-auto flex items-center justify-center mb-4 text-blue-400">
                  <KeyRound className="w-6 h-6" />
                </div>

                <h2 className="text-2xl font-bold">
                  Forgot Password
                </h2>

                <p className="text-zinc-400 mt-2 text-xs">
                  Enter your email to receive OTP
                </p>
              </div>

              <form onSubmit={handleRequestOtp} className="space-y-4">

                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-widest text-zinc-500">
                    Email Address
                  </label>

                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />

                    <input
                      type="email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      className="w-full bg-black/45 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500/60"
                      placeholder="you@example.com"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 mt-6"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <span>Send OTP</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          ) : showOtpScreen ? (

            /* OTP SCREEN */
            <motion.div
              key="otp"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
            >

              <button
                type="button"
                onClick={() => {
                  setShowOtpScreen(false);
                  setIsForgotPassword(true);
                }}
                className="absolute left-6 top-8 text-zinc-500 hover:text-white"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>

              <div className="text-center mb-8">
                <div className="h-12 w-12 bg-amber-500/10 border border-amber-500/20 rounded-2xl mx-auto flex items-center justify-center mb-4 text-amber-400">
                  <Timer className="w-6 h-6" />
                </div>

                <h2 className="text-2xl font-bold">
                  Verify OTP
                </h2>

                <p className="text-zinc-400 mt-2 text-xs">
                  OTP sent to {resetEmail}
                </p>
              </div>

              <form
                onSubmit={handleVerifyOtpAndReset}
                className="space-y-4"
              >

                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-widest text-zinc-500">
                    OTP Code
                  </label>

                  <input
                    type="text"
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) =>
                      setOtpCode(e.target.value.replace(/\D/g, ''))
                    }
                    className="w-full text-center tracking-[0.4em] font-mono text-lg font-extrabold bg-black/45 border border-white/10 rounded-xl py-3 text-blue-300 placeholder-zinc-600 focus:outline-none focus:border-blue-500/60"
                    placeholder="000000"
                    required
                  />

                  <div className="text-xs text-zinc-400 flex items-center gap-1">
                    <Timer className="w-3 h-3" />
                    OTP expires in {formatTimer(timerCountSlots)}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-widest text-zinc-500">
                    New Password
                  </label>

                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />

                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full bg-black/45 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500/60"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-widest text-zinc-500">
                    Confirm Password
                  </label>

                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />

                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) =>
                        setConfirmPassword(e.target.value)
                      }
                      className="w-full bg-black/45 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500/60"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">

                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={timerResendSlots > 0}
                    className="flex-1 border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] rounded-xl py-3 text-sm disabled:opacity-40 flex items-center justify-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />

                    {timerResendSlots > 0
                      ? `Resend (${timerResendSlots}s)`
                      : 'Resend'}
                  </button>

                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-blue-600 hover:bg-blue-500 rounded-xl py-3 text-sm font-bold flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        Reset
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          ) : (

            /* LOGIN / REGISTER */
            <motion.div
              key={isLogin ? 'login' : 'register'}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
            >

              <div className="text-center mb-8">
                <div className="h-12 w-12 bg-blue-600/20 border border-blue-500/30 rounded-2xl mx-auto flex items-center justify-center mb-4 text-blue-400">
                  <ArrowRight className="w-6 h-6" />
                </div>

                <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  {isLogin ? 'Welcome back' : 'Create an account'}
                </h2>

                <p className="text-zinc-400 mt-2 text-xs">
                  {isLogin
                    ? 'Enter your credentials to access your dashboard'
                    : 'Sign up to start with InferFlow'}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">

                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-widest text-zinc-500">
                    Email Address
                  </label>

                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />

                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-black/45 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500/60"
                      placeholder="you@example.com"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-widest text-zinc-500">
                    Password
                  </label>

                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />

                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-black/45 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500/60"
                      placeholder="••••••••"
                      required
                    />
                  </div>

                  {isLogin && (
                    <div className="text-right">
                      <button
                        type="button"
                        onClick={handleStartForgotPassword}
                        className="text-sm text-gray-400 hover:text-white transition-colors"
                      >
                        Forgot Password?
                      </button>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-3.5 px-4 rounded-xl transition-all shadow-lg shadow-blue-500/10 flex items-center justify-center space-x-2 text-xs tracking-wider uppercase border border-white/10 mt-6 disabled:opacity-60"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <span>
                      {isLogin ? 'Sign In' : 'Create Account'}
                    </span>
                  )}
                </button>
              </form>

              <div className="mt-8 text-center border-t border-white/5 pt-5">
                <button
                  type="button"
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-sm text-gray-400 hover:text-white transition-colors"
                >
                  {isLogin
                    ? "Don't have an account? Sign up"
                    : 'Already have an account? Sign in'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
