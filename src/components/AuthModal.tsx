import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useStore } from '../context/StoreContext';
import {
  X,
  User as UserIcon,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  ShoppingBag,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  KeyRound,
  RefreshCw
} from 'lucide-react';
import { isValidEmail, isValidIndianPhone } from '../utils/pricing';

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    setIsAuthModalOpen,
    isPasswordRecoveryMode,
    setIsPasswordRecoveryMode,
    authModalIntent,
    registerUser,
    loginUser,
    requestPasswordReset,
    completePasswordReset,
    resendVerification,
    cartCount,
    cartSubtotal
  } = useStore();

  const [mode, setMode] = useState<'login' | 'signup' | 'forgot' | 'verify_email' | 'recovery'>('login');
  const [showPassword, setShowPassword] = useState(false);

  // Sign up fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Login fields
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Reset / verification helper states
  const [resetEmail, setResetEmail] = useState('');
  const [pendingVerifyEmail, setPendingVerifyEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  const [errorMessage, setErrorMessage] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isPasswordRecoveryMode) {
      setMode('recovery');
      setErrorMessage('');
      setInfoMessage('Enter a new password for your DreamQueen Atelier account.');
    }
  }, [isPasswordRecoveryMode]);

  if (!isAuthModalOpen) return null;

  const handleClose = () => {
    setErrorMessage('');
    setInfoMessage('');
    if (isPasswordRecoveryMode) setIsPasswordRecoveryMode(false);
    setIsAuthModalOpen(false);
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setInfoMessage('');

    if (!name.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }
    if (!isValidIndianPhone(phone)) {
      setErrorMessage('Please enter a valid 10-digit Indian mobile number.');
      return;
    }
    if (!isValidEmail(email)) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }
    if (!password || password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    setIsSubmitting(true);
    const result = await registerUser({
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim(),
      password
    });
    setIsSubmitting(false);

    if (!result.success) {
      setErrorMessage(result.error || 'Could not create account.');
      return;
    }

    if (result.requiresEmailVerification) {
      setPendingVerifyEmail(email.trim().toLowerCase());
      setMode('verify_email');
      setInfoMessage('Please click the verification link in your inbox, then return to sign in.');
      return;
    }

    setName('');
    setPhone('');
    setEmail('');
    setPassword('');
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setInfoMessage('');

    if (!isValidEmail(loginEmail)) {
      setErrorMessage('Please enter your registered email address.');
      return;
    }
    if (!loginPassword) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setIsSubmitting(true);
    const result = await loginUser(loginEmail.trim(), loginPassword);
    setIsSubmitting(false);

    if (!result.success) {
      const msg = result.error || 'Invalid email or password.';
      setErrorMessage(msg);
      if (msg.toLowerCase().includes('confirm') || msg.toLowerCase().includes('verified')) {
        setPendingVerifyEmail(loginEmail.trim().toLowerCase());
      }
      return;
    }

    setLoginEmail('');
    setLoginPassword('');
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setInfoMessage('');

    if (!isValidEmail(resetEmail)) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    setIsSubmitting(true);
    const res = await requestPasswordReset(resetEmail.trim());
    setIsSubmitting(false);

    if (!res.success) {
      setErrorMessage(res.error || 'Failed to send reset link.');
      return;
    }
    setInfoMessage(`Password reset instructions have been sent to ${resetEmail.trim()}.`);
  };

  const handleRecoverySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    if (newPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    const res = await completePasswordReset(newPassword);
    setIsSubmitting(false);

    if (!res.success) {
      setErrorMessage(res.error || 'Could not update password.');
      return;
    }
    setNewPassword('');
    setConfirmNewPassword('');
    setMode('login');
  };

  const handleResendVerification = async () => {
    if (!pendingVerifyEmail) return;
    setErrorMessage('');
    setIsSubmitting(true);
    const res = await resendVerification(pendingVerifyEmail);
    setIsSubmitting(false);
    if (!res.success) {
      setErrorMessage(res.error || 'Could not resend verification email.');
    } else {
      setInfoMessage(`A fresh confirmation email was sent to ${pendingVerifyEmail}.`);
    }
  };

  const isCheckoutIntent = authModalIntent === 'checkout';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-md bg-[#FDF9F4] rounded-3xl shadow-2xl border border-[#EAD5C5] overflow-hidden z-10 my-8"
        >
          {/* Header Bar */}
          <div className="relative px-6 pt-6 pb-4 bg-gradient-to-b from-[#FFF8F0] to-[#FDF9F4] border-b border-[#F0DFD1]">
            <button
              onClick={handleClose}
              className="absolute top-5 right-5 p-2 rounded-full text-[#8C7A6B] hover:text-[#5B3A29] hover:bg-[#F8D7DA]/40 transition"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-1">
              <span className="w-8 h-8 rounded-full bg-[#F8D7DA] flex items-center justify-center text-sm">
                🌸
              </span>
              <span className="text-xs font-semibold uppercase tracking-wider text-[#708238]">
                DreamQueen Atelier
              </span>
            </div>

            <h2 className="font-heading text-2xl font-bold text-[#5B3A29]">
              {mode === 'signup'
                ? 'Create Your Account'
                : mode === 'forgot'
                ? 'Reset Your Password'
                : mode === 'recovery'
                ? 'Choose a New Password'
                : mode === 'verify_email'
                ? 'Confirm Your Email'
                : 'Welcome Back'}
            </h2>

            <p className="text-xs text-[#6E6863] mt-1">
              {isCheckoutIntent
                ? 'Sign in or create an account to save orders and track deliveries.'
                : 'Access your orders, saved addresses, and handmade wishlist.'}
            </p>

            {isCheckoutIntent && cartCount > 0 && (
              <div className="mt-3 p-2.5 rounded-2xl bg-[#FFF8F0] border border-[#EAD5C5] flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-[#5B3A29]">
                  <ShoppingBag className="w-4 h-4 text-[#708238]" />
                  <span>
                    Your Basket:{' '}
                    <strong>
                      {cartCount} {cartCount === 1 ? 'item' : 'items'}
                    </strong>
                  </span>
                </div>
                <span className="text-xs font-bold font-price text-[#5B3A29]">₹{cartSubtotal}</span>
              </div>
            )}
          </div>

          {/* Mode Tabs (Login / Sign Up) */}
          {(mode === 'login' || mode === 'signup') && (
            <div className="px-6 pt-4">
              <div className="grid grid-cols-2 p-1 rounded-2xl bg-[#F4EDE5] border border-[#EAD5C5]">
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setErrorMessage('');
                    setInfoMessage('');
                  }}
                  className={`py-2 text-xs font-semibold rounded-xl transition ${
                    mode === 'login'
                      ? 'bg-white text-[#5B3A29] shadow-xs'
                      : 'text-[#6E6863] hover:text-[#5B3A29]'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode('signup');
                    setErrorMessage('');
                    setInfoMessage('');
                  }}
                  className={`py-2 text-xs font-semibold rounded-xl transition ${
                    mode === 'signup'
                      ? 'bg-white text-[#5B3A29] shadow-xs'
                      : 'text-[#6E6863] hover:text-[#5B3A29]'
                  }`}
                >
                  Create Account
                </button>
              </div>
            </div>
          )}

          {/* Error / Info Alerts */}
          {errorMessage && (
            <div className="mx-6 mt-4 p-3 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs space-y-2">
              <p>{errorMessage}</p>
              {pendingVerifyEmail && (
                <button
                  type="button"
                  onClick={handleResendVerification}
                  className="text-[11px] font-bold text-[#5B3A29] underline flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Resend verification email</span>
                </button>
              )}
            </div>
          )}

          {infoMessage && (
            <div className="mx-6 mt-4 p-3 rounded-2xl bg-[#E8F0DC] border border-[#C5DCAB] text-[#3B4C16] text-xs">
              {infoMessage}
            </div>
          )}

          {/* Sign In Form */}
          {mode === 'login' && (
            <form onSubmit={handleLoginSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#5B3A29] mb-1">
                  Registered Email *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#8C7A6B] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#EAD5C5] rounded-xl text-xs text-[#2E2E2E] focus:outline-hidden focus:border-[#708238] focus:ring-1 focus:ring-[#708238]"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-[#5B3A29]">Password *</label>
                  <button
                    type="button"
                    onClick={() => {
                      setResetEmail(loginEmail);
                      setMode('forgot');
                      setErrorMessage('');
                      setInfoMessage('');
                    }}
                    className="text-[11px] font-semibold text-[#708238] hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#8C7A6B] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full pl-10 pr-10 py-2.5 bg-white border border-[#EAD5C5] rounded-xl text-xs text-[#2E2E2E] focus:outline-hidden focus:border-[#708238] focus:ring-1 focus:ring-[#708238]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8C7A6B] hover:text-[#5B3A29]"
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 px-4 rounded-full bg-[#5B3A29] text-white font-semibold text-xs hover:bg-[#43291B] transition shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isSubmitting ? 'Signing In...' : 'Sign In'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <p className="text-center text-xs text-[#6E6863]">
                New to DreamQueen?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('signup');
                    setErrorMessage('');
                  }}
                  className="text-[#708238] font-bold hover:underline"
                >
                  Create an account
                </button>
              </p>
            </form>
          )}

          {/* Sign Up Form */}
          {mode === 'signup' && (
            <form onSubmit={handleSignupSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#5B3A29] mb-1">
                  Full Name *
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-[#8C7A6B] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Priya Verma"
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#EAD5C5] rounded-xl text-xs text-[#2E2E2E] focus:outline-hidden focus:border-[#708238]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#5B3A29] mb-1">
                  10-Digit Mobile Number *
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-[#8C7A6B] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    placeholder="10-digit mobile number"
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#EAD5C5] rounded-xl text-xs text-[#2E2E2E] focus:outline-hidden focus:border-[#708238]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#5B3A29] mb-1">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#8C7A6B] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#EAD5C5] rounded-xl text-xs text-[#2E2E2E] focus:outline-hidden focus:border-[#708238]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#5B3A29] mb-1">
                  Password (min 6 characters) *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#8C7A6B] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a secure password"
                    className="w-full pl-10 pr-10 py-2.5 bg-white border border-[#EAD5C5] rounded-xl text-xs text-[#2E2E2E] focus:outline-hidden focus:border-[#708238]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8C7A6B] hover:text-[#5B3A29]"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 px-4 rounded-full bg-[#5B3A29] text-white font-semibold text-xs hover:bg-[#43291B] transition shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isSubmitting ? 'Creating Account...' : 'Create Account'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="flex items-center justify-center gap-1.5 text-[11px] text-[#6E6863]">
                <ShieldCheck className="w-3.5 h-3.5 text-[#708238]" />
                <span>Authenticated via Supabase Auth</span>
              </div>
            </form>
          )}

          {/* Forgot Password Form */}
          {mode === 'forgot' && (
            <form onSubmit={handleForgotSubmit} className="p-6 space-y-4">
              <p className="text-xs text-[#6E6863]">
                Enter the email address associated with your account and we will send you a link to reset your password.
              </p>
              <div>
                <label className="block text-xs font-semibold text-[#5B3A29] mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full px-3.5 py-2.5 bg-white border border-[#EAD5C5] rounded-xl text-xs focus:outline-hidden focus:border-[#708238]"
                />
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 rounded-full bg-[#5B3A29] text-white text-xs font-semibold hover:bg-[#43291B] transition"
              >
                {isSubmitting ? 'Sending Link...' : 'Send Password Reset Link'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setErrorMessage('');
                  setInfoMessage('');
                }}
                className="w-full text-center text-xs text-[#708238] font-semibold hover:underline"
              >
                Back to Sign In
              </button>
            </form>
          )}

          {/* Recovery Mode: Set New Password */}
          {mode === 'recovery' && (
            <form onSubmit={handleRecoverySubmit} className="p-6 space-y-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#5B3A29]">
                <KeyRound className="w-4 h-4 text-[#708238]" />
                <span>Set your new password below</span>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#5B3A29] mb-1">
                  New Password (min 6 chars)
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-[#EAD5C5] rounded-xl text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#5B3A29] mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-[#EAD5C5] rounded-xl text-xs"
                />
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 rounded-full bg-[#5B3A29] text-white text-xs font-semibold hover:bg-[#43291B] transition"
              >
                {isSubmitting ? 'Updating Password...' : 'Update Password'}
              </button>
            </form>
          )}

          {/* Email Verification Pending View */}
          {mode === 'verify_email' && (
            <div className="p-6 space-y-4 text-center">
              <div className="w-12 h-12 rounded-full bg-[#E8F0DC] text-[#4A5D1E] flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <p className="text-xs text-[#55504C] leading-relaxed">
                We sent a confirmation link to <strong>{pendingVerifyEmail}</strong>. Once verified, click below to sign in.
              </p>
              <button
                type="button"
                onClick={handleResendVerification}
                disabled={isSubmitting}
                className="w-full py-2.5 rounded-full bg-[#FFF8F0] border border-[#EAD5C5] text-[#5B3A29] text-xs font-semibold hover:bg-[#F3E5D8] transition"
              >
                Resend Verification Email
              </button>
              <button
                type="button"
                onClick={() => {
                  setLoginEmail(pendingVerifyEmail);
                  setMode('login');
                  setErrorMessage('');
                }}
                className="w-full py-3 rounded-full bg-[#5B3A29] text-white text-xs font-semibold hover:bg-[#43291B] transition"
              >
                Go to Sign In
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
