import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
    User,
    Mail,
    Lock,
    Shield,
    KeyRound,
    Calendar,
    AlertCircle,
    Timer,
    RefreshCw,
    X,
    CheckCircle2,
    LockOpen,
    Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { forgotPassword, resetPassword, changePassword } from '../api';

export function Settings() {
    const { user } = useAuth();

    // Use user email to derive a display name or fallback
    const displayName = user?.email ? user.email.split('@')[0] : 'User';
    const displayEmail = user?.email || '';

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isChangeModalOpen, setIsChangeModalOpen] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [otpValue, setOtpValue] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoadingApi, setIsLoadingApi] = useState(false);

    // OTP states
    const [timerCount, setTimerCount] = useState(300); // 5 minutes (04:52, etc)
    const [timerResendCount, setTimerResendCount] = useState(0); // 20 seconds disable lock-out
    const [timerRunning, setTimerRunning] = useState(false);

    // Inline validation feedback
    const [errorCurrent, setErrorCurrent] = useState('');
    const [errorOtp, setErrorOtp] = useState('');
    const [errorPassword, setErrorPassword] = useState('');
    const [errorConfirm, setErrorConfirm] = useState('');

    // Main countdown timer interval
    useEffect(() => {
        let interval: any = null;
        if (timerRunning && timerCount > 0) {
            interval = setInterval(() => {
                setTimerCount((prev) => prev - 1);
            }, 1000);
        } else if (timerCount === 0) {
            setTimerRunning(false);
        }
        return () => clearInterval(interval);
    }, [timerRunning, timerCount]);

    // Resend cool-down lockout interval
    useEffect(() => {
        let interval: any = null;
        if (timerResendCount > 0) {
            interval = setInterval(() => {
                setTimerResendCount((prev) => prev - 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [timerResendCount]);

    const handleOpenChangePassword = async () => {
        if (!displayEmail) {
            toast.error('User email not found. Please log in again.');
            return;
        }
        setIsLoadingApi(true);
        try {
            await forgotPassword(displayEmail);
            setIsModalOpen(true);
            setOtpValue('');
            setNewPassword('');
            setConfirmPassword('');
            setErrorOtp('');
            setErrorPassword('');
            setErrorConfirm('');
            setTimerCount(300);
            setTimerResendCount(20);
            setTimerRunning(true);
            toast.success(`Verification code sent to ${displayEmail}`);
        } catch (error: any) {
            toast.error(error.message || 'Failed to request verification code');
        } finally {
            setIsLoadingApi(false);
        }
    };

    const handleResendOtpAction = async (e: React.MouseEvent) => {
        e.preventDefault();
        if (timerResendCount > 0 || isLoadingApi) return;

        setIsLoadingApi(true);
        try {
            await forgotPassword(displayEmail);
            setTimerCount(300);
            setTimerResendCount(20);
            setTimerRunning(true);
            toast.success('A new OTP has been sent to your email.');
        } catch (error: any) {
            toast.error(error.message || 'Failed to resend OTP');
        } finally {
            setIsLoadingApi(false);
        }
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setTimerRunning(false);
    };

    const handleConfirmPasswordReset = async (e: React.FormEvent) => {
        e.preventDefault();

        let isValid = true;
        setErrorOtp('');
        setErrorPassword('');
        setErrorConfirm('');

        if (otpValue.length !== 6) {
            setErrorOtp('Verification key must be exactly 6 digits.');
            isValid = false;
        }

        if (timerCount <= 0) {
            setErrorOtp('This verification key has expired. Please claim a new key.');
            isValid = false;
        }

        if (!newPassword) {
            setErrorPassword('Please enter your new desired passage password.');
            isValid = false;
        } else if (newPassword.length < 8) {
            setErrorPassword('Passwords must contain at least 8 characters.');
            isValid = false;
        }

        if (newPassword !== confirmPassword) {
            setErrorConfirm('The password confirmation parameters do not correspond.');
            isValid = false;
        }

        if (!isValid) return;

        setIsLoadingApi(true);
        try {
            await resetPassword({
                email: displayEmail,
                otp: otpValue,
                new_password: newPassword
            });
            toast.success('Password updated successfully');
            handleCloseModal();
        } catch (error: any) {
            toast.error(error.message || 'Failed to update password');
        } finally {
            setIsLoadingApi(false);
        }
    };

    const handleOpenDirectChange = () => {
        setIsChangeModalOpen(true);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setErrorCurrent('');
        setErrorPassword('');
        setErrorConfirm('');
    };

    const handleCloseChangeModal = () => {
        setIsChangeModalOpen(false);
    };

    const handleConfirmDirectChange = async (e: React.FormEvent) => {
        e.preventDefault();

        let isValid = true;
        setErrorCurrent('');
        setErrorPassword('');
        setErrorConfirm('');

        if (!currentPassword) {
            setErrorCurrent('Please enter your current password.');
            isValid = false;
        }

        if (!newPassword) {
            setErrorPassword('Please enter your new password.');
            isValid = false;
        } else if (newPassword.length < 8) {
            setErrorPassword('Passwords must contain at least 8 characters.');
            isValid = false;
        }

        if (newPassword !== confirmPassword) {
            setErrorConfirm('The password confirmation parameters do not correspond.');
            isValid = false;
        }

        if (!isValid) return;

        setIsLoadingApi(true);
        try {
            await changePassword({
                current_password: currentPassword,
                new_password: newPassword
            });
            toast.success('Password changed successfully');
            handleCloseChangeModal();
        } catch (error: any) {
            toast.error(error.message || 'Failed to change password');
        } finally {
            setIsLoadingApi(false);
        }
    };

    // Convert raw countdown count to standard MM:SS
    const formatSecsToTimerMin = (totalSecs: number) => {
        const mins = Math.floor(totalSecs / 60);
        const secs = totalSecs % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="flex flex-col h-screen bg-zinc-950 text-white">
            {/* Page Header (Matching existing InferFlow style) */}
            <header className="px-6 py-5 border-b border-white/5 flex items-center justify-between bg-black/20 backdrop-blur-md">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <h1 className="text-xl font-extrabold text-white tracking-tight">Settings</h1>
                        <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-[10px] font-mono leading-none">
                            v1.4.0
                        </Badge>
                    </div>
                    <p className="text-zinc-400 text-xs leading-relaxed">
                        Manage your account and security preferences.
                    </p>
                </div>
            </header>

            {/* Main Settings Body */}
            <div className="flex-1 overflow-y-auto p-6 lg:p-8 custom-scrollbar">
                <div className="max-w-3xl mx-auto space-y-8 pb-10">

                    {/* 1. ACCOUNT SECTION */}
                    <section className="space-y-4">
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                                <User className="w-4.5 h-4.5 text-blue-400" />
                            </div>
                            <h2 className="text-sm font-bold tracking-widest text-zinc-400 uppercase">Account Profile</h2>
                        </div>

                        <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6 backdrop-blur-xl space-y-6 relative group hover:border-white/15 transition-all">
                            <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/5 blur-3xl rounded-full pointer-events-none -mr-16 -mt-16" />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-1.5">
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 block">Full Name</span>
                                    <div className="relative">
                                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                                        <input
                                            type="text"
                                            readOnly
                                            value={displayName}
                                            className="w-full bg-black/30 border border-white/5 rounded-xl py-2.5 pl-10 pr-4 text-xs font-semibold text-zinc-300 select-all focus:outline-none cursor-default"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 block">Email Address</span>
                                    <div className="relative">
                                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                                        <input
                                            type="text"
                                            readOnly
                                            value={displayEmail}
                                            className="w-full bg-black/30 border border-white/5 rounded-xl py-2.5 pl-10 pr-4 text-xs font-semibold text-zinc-300 select-all focus:outline-none cursor-default"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-black/40 border border-white/5 rounded-xl p-4 flex gap-3 items-center">
                                <Calendar className="w-4 h-4 text-zinc-500 shrink-0" />
                                <p className="text-[11px] text-zinc-500 leading-normal font-sans">
                                    Account profile is indexed as a verified identity in cloud nodes. Modify values through directory synchronization services.
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* 2. SECURITY SECTION */}
                    <section className="space-y-4">
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
                                <Shield className="w-4.5 h-4.5 text-indigo-400" />
                            </div>
                            <h2 className="text-sm font-bold tracking-widest text-zinc-400 uppercase">Credential Security</h2>
                        </div>

                        <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6 backdrop-blur-xl relative overflow-hidden group hover:border-white/15 transition-all">
                            <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/5 blur-3xl rounded-full pointer-events-none -ml-16 -mb-16" />

                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                                <div className="space-y-1">
                                    <h3 className="text-xs font-extrabold text-white tracking-widest uppercase flex items-center gap-2">
                                        Access Password
                                        <span className="w-2.5 h-2.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[8px] font-mono font-bold uppercase tracking-wider px-1 py-0.5 rounded leading-none">Verified</span>
                                    </h3>
                                    <p className="text-zinc-500 text-[11px] leading-normal max-w-md">Update your password directly if you know your current credentials, or request a verification OTP to reset your password if you forgot it.</p>
                                </div>

                                <div className="flex flex-col sm:flex-row gap-3 shrink-0">
                                    <Button
                                        onClick={handleOpenDirectChange}
                                        disabled={isLoadingApi}
                                        className="bg-gradient-to-r from-zinc-800 to-zinc-700 hover:from-zinc-700 hover:to-zinc-650 text-white font-bold h-10 px-4 rounded-xl text-xs flex gap-2 border border-white/10 cursor-pointer shadow-md select-none shrink-0"
                                    >
                                        <Lock className="w-4 h-4" /> Change Password
                                    </Button>

                                    <Button
                                        onClick={handleOpenChangePassword}
                                        disabled={isLoadingApi}
                                        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold h-10 px-4 rounded-xl text-xs flex gap-2 border border-white/5 cursor-pointer shadow-md select-none shrink-0"
                                    >
                                        {isLoadingApi ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />} Reset via OTP
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </section>

                </div>
            </div>

            {/* 3. CENTERED VERIFICATION & PASSWORD RESET MODAL */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        {/* Backdrop Blur overlay */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={handleCloseModal}
                            className="absolute inset-0 bg-black/85 backdrop-blur-md cursor-pointer"
                        />

                        {/* Modal Card content */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 15 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            transition={{ duration: 0.2 }}
                            className="relative w-full max-w-md bg-zinc-950 border border-white/10 rounded-2xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] overflow-hidden z-10 p-0"
                        >
                            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />

                            {/* Close toggle */}
                            <button
                                onClick={handleCloseModal}
                                className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-all p-1 hover:bg-white/5 border border-transparent hover:border-white/5 rounded-lg"
                            >
                                <X className="w-4.5 h-4.5" />
                            </button>

                            {/* Header section with blue mesh highlight */}
                            <div className="p-6 border-b border-white/5 bg-white/[0.01] flex items-start gap-4">
                                <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                                    <KeyRound className="w-5 h-5 text-blue-400" />
                                </div>
                                <div className="space-y-1 select-none">
                                    <h2 className="text-base font-extrabold text-white tracking-tight">Verify Identity</h2>
                                    <p className="text-zinc-500 text-[11px] leading-relaxed">
                                        An OTP has been sent to your registered email address.
                                    </p>
                                </div>
                            </div>

                            {/* Form Input fields */}
                            <form onSubmit={handleConfirmPasswordReset}>
                                <div className="p-6 space-y-5">

                                    {/* OTP security key */}
                                    <div className="space-y-1.5">
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">6-Digit OTP Token</span>
                                            <span className="text-[9px] font-mono text-zinc-500 flex items-center gap-1 font-bold leading-none select-none">
                                                {timerCount > 0 ? (
                                                    <>
                                                        <Timer className="w-3 h-3 text-amber-500/80" />
                                                        <span className="text-amber-400 font-extrabold">OTP expires in {formatSecsToTimerMin(timerCount)}</span>
                                                    </>
                                                ) : (
                                                    <span className="text-red-400 font-extrabold flex items-center gap-1">
                                                        <AlertCircle className="w-3 h-3" /> EXPIRED
                                                    </span>
                                                )}
                                            </span>
                                        </div>

                                        <div className="space-y-1">
                                            <input
                                                type="text"
                                                maxLength={6}
                                                value={otpValue}
                                                onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, ''))}
                                                placeholder="000000"
                                                className="w-full text-center tracking-[0.4em] font-mono font-black text-base bg-black/45 border border-white/5 rounded-xl py-2.5 text-blue-300 placeholder-zinc-800 focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/20 transition-all"
                                            />
                                            {errorOtp && (
                                                <span className="text-[10px] text-red-400 font-medium flex items-center gap-1.5 mt-1 select-none animate-slide-in">
                                                    <AlertCircle className="w-3.5 h-3.5" />
                                                    {errorOtp}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* New Lock Word */}
                                    <div className="space-y-1.5">
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 block">New Password</span>
                                        <div className="space-y-1">
                                            <div className="relative">
                                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                                                <Input
                                                    type="password"
                                                    value={newPassword}
                                                    onChange={(e) => setNewPassword(e.target.value)}
                                                    placeholder="••••••••"
                                                    className="bg-black/45 border-white/10 text-white placeholder-zinc-700 focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/20 transition-all rounded-xl h-10 px-9 text-xs"
                                                />
                                            </div>
                                            {errorPassword && (
                                                <span className="text-[10px] text-red-400 font-medium flex items-center gap-1.5 mt-1 select-none">
                                                    <AlertCircle className="w-3.5 h-3.5" />
                                                    {errorPassword}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Confirm password */}
                                    <div className="space-y-1.5">
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 block">Confirm Password</span>
                                        <div className="space-y-1">
                                            <div className="relative">
                                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                                                <Input
                                                    type="password"
                                                    value={confirmPassword}
                                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                                    placeholder="••••••••"
                                                    className="bg-black/45 border-white/10 text-white placeholder-zinc-700 focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/20 transition-all rounded-xl h-10 px-9 text-xs"
                                                />
                                            </div>
                                            {errorConfirm && (
                                                <span className="text-[10px] text-red-400 font-medium flex items-center gap-1.5 mt-1 select-none">
                                                    <AlertCircle className="w-3.5 h-3.5" />
                                                    {errorConfirm}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                </div>

                                {/* Secondary dialog Actions (OTP resend & verify submissions) */}
                                <div className="flex items-center justify-between gap-3 p-6 bg-white/[0.01]/border-t border-white/5 select-none">
                                    <button
                                        type="button"
                                        onClick={handleResendOtpAction}
                                        disabled={timerResendCount > 0 || isLoadingApi}
                                        className="flex items-center gap-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 disabled:opacity-40 disabled:hover:bg-white/5 px-4 h-10 rounded-xl text-xs font-semibold cursor-pointer select-none transition-all"
                                    >
                                        <RefreshCw className={`w-3.5 h-3.5 ${timerResendCount > 0 || isLoadingApi ? '' : 'animate-spin'}`} style={{ animationDuration: '6s' }} />
                                        <span>
                                            {timerResendCount > 0 ? `Resend (${timerResendCount}s)` : 'Resend Key'}
                                        </span>
                                    </button>

                                    <div className="flex items-center gap-2">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            onClick={handleCloseModal}
                                            className="text-zinc-400 hover:text-white hover:bg-white/5 rounded-xl border border-white/5 text-xs h-10 px-4 cursor-pointer font-semibold transition-all"
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            type="submit"
                                            disabled={isLoadingApi}
                                            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-md border border-white/10 text-xs h-10 px-5 cursor-pointer flex gap-1.5"
                                        >
                                            {isLoadingApi ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />} Reset Password
                                        </Button>
                                    </div>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* 4. DIRECT CHANGE PASSWORD MODAL */}
            <AnimatePresence>
                {isChangeModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        {/* Backdrop Blur overlay */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={handleCloseChangeModal}
                            className="absolute inset-0 bg-black/85 backdrop-blur-md cursor-pointer"
                        />

                        {/* Modal Card content */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 15 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            transition={{ duration: 0.2 }}
                            className="relative w-full max-w-md bg-zinc-950/95 border border-white/10 rounded-3xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] overflow-hidden z-10 backdrop-blur-3xl"
                        >
                            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 opacity-70" />
                            <div className="absolute top-0 right-0 w-[220px] h-[220px] bg-blue-600/10 blur-[90px] rounded-full pointer-events-none" />
                            <div className="absolute bottom-0 left-0 w-[180px] h-[180px] bg-purple-600/10 blur-[80px] rounded-full pointer-events-none" />

                            {/* Close toggle */}
                            <button
                                onClick={handleCloseChangeModal}
                                className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-all p-1 hover:bg-white/5 border border-transparent hover:border-white/5 rounded-lg"
                            >
                                <X className="w-4.5 h-4.5" />
                            </button>

                            {/* Header section */}
                            <div className="p-6 border-b border-white/5 bg-white/[0.01] flex items-start gap-4">
                                <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0 text-blue-400">
                                    <Lock className="w-5 h-5" />
                                </div>
                                <div className="space-y-1 select-none">
                                    <h2 className="text-base font-extrabold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent tracking-tight">Change Password</h2>
                                    <p className="text-zinc-500 text-[11px] leading-relaxed">
                                        Update your login credentials securely.
                                    </p>
                                </div>
                            </div>

                            {/* Form Input fields */}
                            <form onSubmit={handleConfirmDirectChange}>
                                <div className="p-6 space-y-5">

                                    {/* Current Password */}
                                    <div className="space-y-1.5">
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 block">Current Password</span>
                                        <div className="space-y-1">
                                            <div className="relative">
                                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                                                <Input
                                                    type="password"
                                                    value={currentPassword}
                                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                                    placeholder="••••••••"
                                                    className="bg-black/45 border border-white/10 text-white placeholder-zinc-600 focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/20 transition-all rounded-xl h-10 px-9 text-xs"
                                                />
                                            </div>
                                            {errorCurrent && (
                                                <span className="text-[10px] text-red-400 font-medium flex items-center gap-1.5 mt-1 select-none">
                                                    <AlertCircle className="w-3.5 h-3.5" />
                                                    {errorCurrent}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* New Password */}
                                    <div className="space-y-1.5">
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 block">New Password</span>
                                        <div className="space-y-1">
                                            <div className="relative">
                                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                                                <Input
                                                    type="password"
                                                    value={newPassword}
                                                    onChange={(e) => setNewPassword(e.target.value)}
                                                    placeholder="••••••••"
                                                    className="bg-black/45 border border-white/10 text-white placeholder-zinc-600 focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/20 transition-all rounded-xl h-10 px-9 text-xs"
                                                />
                                            </div>
                                            {errorPassword && (
                                                <span className="text-[10px] text-red-400 font-medium flex items-center gap-1.5 mt-1 select-none">
                                                    <AlertCircle className="w-3.5 h-3.5" />
                                                    {errorPassword}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Confirm password */}
                                    <div className="space-y-1.5">
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 block">Confirm Password</span>
                                        <div className="space-y-1">
                                            <div className="relative">
                                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                                                <Input
                                                    type="password"
                                                    value={confirmPassword}
                                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                                    placeholder="••••••••"
                                                    className="bg-black/45 border border-white/10 text-white placeholder-zinc-600 focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/20 transition-all rounded-xl h-10 px-9 text-xs"
                                                />
                                            </div>
                                            {errorConfirm && (
                                                <span className="text-[10px] text-red-400 font-medium flex items-center gap-1.5 mt-1 select-none">
                                                    <AlertCircle className="w-3.5 h-3.5" />
                                                    {errorConfirm}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                </div>

                                {/* Form Actions */}
                                <div className="flex items-center justify-end gap-3 p-6 border-t border-white/5 bg-white/[0.02] backdrop-blur-xl select-none">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={handleCloseChangeModal}
                                        className="text-zinc-500 hover:text-white hover:bg-white/5 rounded-xl border border-transparent hover:border-white/5 text-xs h-10 px-4 cursor-pointer font-semibold"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={isLoadingApi}
                                        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-blue-500/10 border border-white/10 text-xs h-10 px-5 cursor-pointer flex gap-1.5 transition-all"
                                    >
                                        {isLoadingApi ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />} Update Password
                                    </Button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}