import React, { useState } from 'react';
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
  ShieldCheck
} from 'lucide-react';

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    setIsAuthModalOpen,
    authModalIntent,
    registerUser,
    loginUser,
    cartCount,
    cartSubtotal
  } = useStore();

  const [mode, setMode] = useState<'signup' | 'login'>('signup');
  const [showPassword, setShowPassword] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Login specific state
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isAuthModalOpen) return null;

  const handleClose = () => {
    setErrorMessage('');
    setIsAuthModalOpen(false);
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!name.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }

    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setErrorMessage('Please enter a valid 10-digit mobile number.');
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    if (!password || password.length < 6) {
      setErrorMessage('Please choose a password with at least 4 characters.');
      return;
    }

    setIsSubmitting(true);
    const success = await registerUser({
      name: name.trim(),
      phone: cleanPhone,
      email: email.trim(),
      password
    });

    setIsSubmitting(false);
    if (success) {
      setName('');
      setPhone('');
      setEmail('');
      setPassword('');
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!loginIdentifier.trim()) {
      setErrorMessage('Please enter your registered email address.');
      return;
    }

    if (!loginPassword.trim()) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setIsSubmitting(true);
    const success = await loginUser(loginIdentifier.trim(), loginPassword);
    setIsSubmitting(false);

    if (success) {
      setLoginIdentifier('');
      setLoginPassword('');
    } else {
      setErrorMessage('Could not sign in. Please verify your details or create a new account.');
    }
  };

  const isCheckoutIntent = authModalIntent === 'checkout';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
        />

        {/* Modal Dialog */}
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
              {mode === 'signup' ? 'Create Your Account' : 'Welcome Back'}
            </h2>

            <p className="text-xs text-[#8C7A6B] mt-1">
              {isCheckoutIntent
                ? 'Please create an account or sign in to complete your handmade order.'
                : 'Manage your handmade orders, wishlist, and shipping addresses.'}
            </p>

            {/* Order context banner if from checkout */}
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
                <span className="text-xs font-bold text-[#5B3A29]">₹{cartSubtotal}</span>
              </div>
            )}
          </div>

          {/* Mode Switcher Tabs */}
          <div className="px-6 pt-4">
            <div className="grid grid-cols-2 p-1 rounded-2xl bg-[#F4EDE5] border border-[#EAD5C5]">
              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  setErrorMessage('');
                }}
                className={`py-2 text-xs font-semibold rounded-xl transition ${
                  mode === 'signup'
                    ? 'bg-white text-[#5B3A29] shadow-xs'
                    : 'text-[#8C7A6B] hover:text-[#5B3A29]'
                }`}
              >
                Create Account
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setErrorMessage('');
                }}
                className={`py-2 text-xs font-semibold rounded-xl transition ${
                  mode === 'login'
                    ? 'bg-white text-[#5B3A29] shadow-xs'
                    : 'text-[#8C7A6B] hover:text-[#5B3A29]'
                }`}
              >
                Sign In
              </button>
            </div>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="mx-6 mt-4 p-3 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <span className="shrink-0">⚠️</span>
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Tab 1: Create Account Form */}
          {mode === 'signup' ? (
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
                    placeholder="e.g. Ayesha Shaikh"
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#EAD5C5] rounded-xl text-xs text-[#2E2E2E] focus:outline-hidden focus:border-[#708238] focus:ring-1 focus:ring-[#708238]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#5B3A29] mb-1">
                  Mobile Number (WhatsApp & Delivery) *
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
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#EAD5C5] rounded-xl text-xs text-[#2E2E2E] focus:outline-hidden focus:border-[#708238] focus:ring-1 focus:ring-[#708238]"
                  />
                </div>
                <p className="text-[10px] text-[#8C7A6B] mt-1">
                  We use this for order dispatch alerts and WhatsApp tracking updates.
                </p>
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
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#EAD5C5] rounded-xl text-xs text-[#2E2E2E] focus:outline-hidden focus:border-[#708238] focus:ring-1 focus:ring-[#708238]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#5B3A29] mb-1">
                  Password *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#8C7A6B] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a password"
                    className="w-full pl-10 pr-10 py-2.5 bg-white border border-[#EAD5C5] rounded-xl text-xs text-[#2E2E2E] focus:outline-hidden focus:border-[#708238] focus:ring-1 focus:ring-[#708238]"
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

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 px-4 rounded-full bg-[#5B3A29] text-white font-semibold text-xs hover:bg-[#43291B] transition shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>
                    {isCheckoutIntent ? 'Create Account & Continue to Order' : 'Create Account'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center justify-center gap-1.5 text-[11px] text-[#8C7A6B] pt-1">
                <ShieldCheck className="w-3.5 h-3.5 text-[#708238]" />
                <span>Your information is safe and private</span>
              </div>
            </form>
          ) : (
            /* Tab 2: Sign In Form */
            <form onSubmit={handleLoginSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#5B3A29] mb-1">
                  Email Address *
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-[#8C7A6B] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    placeholder="Enter your registered email"
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#EAD5C5] rounded-xl text-xs text-[#2E2E2E] focus:outline-hidden focus:border-[#708238] focus:ring-1 focus:ring-[#708238]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#5B3A29] mb-1">
                  Password *
                </label>
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
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 px-4 rounded-full bg-[#5B3A29] text-white font-semibold text-xs hover:bg-[#43291B] transition shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{isCheckoutIntent ? 'Sign In & Continue to Order' : 'Sign In'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              <div className="text-center pt-2">
                <p className="text-xs text-[#8C7A6B]">
                  Don't have an account yet?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('signup');
                      setErrorMessage('');
                    }}
                    className="text-[#708238] font-bold hover:underline"
                  >
                    Create one here
                  </button>
                </p>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
