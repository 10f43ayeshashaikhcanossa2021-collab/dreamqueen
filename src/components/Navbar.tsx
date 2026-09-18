import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import {
  Heart,
  ShoppingBag,
  Search,
  User as UserIcon,
  Menu,
  X,
  Sparkles,
  ShieldCheck,
  ChevronRight,
  LogOut,
  SlidersHorizontal,
  Package,
  QrCode
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const Navbar: React.FC = () => {
  const {
    cartCount,
    cartSubtotal,
    wishlist,
    activeTab,
    setActiveTab,
    setIsCartOpen,
    setIsUpiScannerOpen,
    currentUser,
    isAdmin,
    setIsAdmin,
    loginUser,
    logoutUser,
    openAuthModal,
    products,
    setSelectedProduct
  } = useStore();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Focus input when search bar opens
  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  const searchResults = searchQuery.trim()
    ? products.filter(
        (p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : [];

  const handleProductSelect = (product: typeof products[0]) => {
    setSelectedProduct(product);
    setIsSearchOpen(false);
    setSearchQuery('');
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-[#FDF9F4]/95 backdrop-blur-md border-b border-[#EAD5C5]/60 transition-all">
      {/* Top Announcement Bar */}
      <div className="bg-[#FFF8F0] border-b border-[#F0DFD1] py-1.5 px-4 text-xs font-medium text-[#5B3A29] flex items-center justify-center gap-2 text-center">
        <Sparkles className="w-3.5 h-3.5 text-[#D4A017] shrink-0 animate-pulse" />
        <span>
          <strong>Handmade with Love:</strong> Free shipping across India on orders over ₹499 • 7 Days Delivery Guarantee
        </span>
        <span className="hidden sm:inline text-[#D4A017]">• 100% Milk Cotton Yarn</span>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Mobile menu toggle */}
          <div className="flex items-center lg:hidden">
            <button
              id="mobile-menu-toggle-btn"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-full text-[#5B3A29] hover:bg-[#F8D7DA]/40 transition"
              aria-label="Toggle Navigation Menu"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Brand Logo */}
          <div className="flex items-center">
            <button
              id="nav-logo-btn"
              onClick={() => {
                setActiveTab('home');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="text-left group flex items-center gap-2.5"
            >
              <div className="w-10 h-10 rounded-full bg-[#F8D7DA] flex items-center justify-center text-[#5B3A29] shadow-sm group-hover:scale-105 transition">
                <span className="text-xl">🌸</span>
              </div>
              <div>
                <span className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-[#5B3A29] group-hover:text-[#43291B] transition">
                  DreamQueen
                </span>
                <span className="block text-[11px] font-handwriting text-[#708238] tracking-wider -mt-1 font-semibold">
                  Handmade with Love
                </span>
              </div>
            </button>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-1 xl:space-x-2">
            {[
              { id: 'home', label: 'Home' },
              { id: 'shop', label: 'Shop All' },
              { id: 'custom', label: 'Custom Orders' },
              { id: 'track', label: 'Track Order' },
              { id: 'contact', label: 'About & Contact' }
            ].map((item) => (
              <button
                key={item.id}
                id={`nav-link-${item.id}`}
                onClick={() => {
                  setActiveTab(item.id as any);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={`px-3.5 py-2 rounded-full text-sm font-medium transition-all ${
                  activeTab === item.id
                    ? 'bg-[#5B3A29] text-white shadow-sm'
                    : 'text-[#2E2E2E] hover:text-[#5B3A29] hover:bg-[#FFF8F0]'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Right Action Icons */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Search Trigger */}
            <div className="relative">
              <button
                id="search-toggle-btn"
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className="p-2.5 rounded-full text-[#5B3A29] hover:bg-[#FFF8F0] hover:text-[#43291B] transition"
                aria-label="Search items"
              >
                <Search className="w-5 h-5" />
              </button>

              {/* Instant Search Dropdown */}
              <AnimatePresence>
                {isSearchOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#FFF8F0] rounded-2xl shadow-xl border border-[#EAD5C5] p-3 z-50"
                  >
                    <div className="relative">
                      <Search className="w-4 h-4 text-[#8C7A6B] absolute left-3 top-3" />
                      <input
                        ref={searchInputRef}
                        type="text"
                        placeholder="Search keychains, hair clips, bouquets..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-8 py-2 bg-white rounded-xl border border-[#EAD5C5] text-sm text-[#2E2E2E] placeholder-[#8C7A6B] focus:outline-none focus:ring-2 focus:ring-[#5B3A29]/20 focus:border-[#5B3A29]"
                      />
                      {searchQuery && (
                        <button
                          onClick={() => setSearchQuery('')}
                          className="absolute right-2.5 top-2.5 text-xs text-[#8C7A6B] hover:text-[#2E2E2E]"
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    {/* Autocomplete Results */}
                    {searchQuery.trim() && (
                      <div className="mt-3 max-h-64 overflow-y-auto space-y-1.5 pr-1">
                        {searchResults.length > 0 ? (
                          searchResults.map((prod) => (
                            <button
                              key={prod.id}
                              onClick={() => handleProductSelect(prod)}
                              className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-[#FDF9F4] text-left transition group"
                            >
                              <img
                                src={prod.images[0]}
                                alt={prod.name}
                                className="w-10 h-10 rounded-lg object-cover border border-[#EAD5C5]"
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-[#2E2E2E] truncate group-hover:text-[#5B3A29]">
                                  {prod.name}
                                </p>
                                <p className="text-[11px] text-[#708238]">{prod.category}</p>
                              </div>
                              <span className="font-price font-bold text-xs text-[#5B3A29]">
                                ₹{prod.price}
                              </span>
                            </button>
                          ))
                        ) : (
                          <p className="text-xs text-center py-4 text-[#8C7A6B]">
                            No crochet pieces match "{searchQuery}"
                          </p>
                        )}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* UPI QR Scanner quick button */}
            <button
              id="upi-qr-scanner-nav-btn"
              type="button"
              onClick={() => setIsUpiScannerOpen(true)}
              title="Scan to Pay (India Post / UPI QR Scanner)"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#FFF8F0] border border-[#EAD5C5] text-[#5B3A29] hover:bg-[#F8D7DA]/40 transition text-xs font-semibold"
            >
              <QrCode className="w-4 h-4 text-[#708238]" />
              <span className="hidden xl:inline">UPI Scanner</span>
            </button>

            {/* Wishlist Icon */}
            <button
              id="wishlist-nav-btn"
              onClick={() => {
                setActiveTab('customer');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="relative p-2.5 rounded-full text-[#5B3A29] hover:bg-[#FFF8F0] hover:text-[#43291B] transition"
              aria-label="Wishlist"
            >
              <Heart className="w-5 h-5" />
              {wishlist.length > 0 && (
                <span className="absolute top-1 right-1 bg-[#F8D7DA] text-[#842029] font-semibold text-[10px] w-4 h-4 rounded-full flex items-center justify-center border border-[#F0B8BE]">
                  {wishlist.length}
                </span>
              )}
            </button>

            {/* Cart Drawer Trigger */}
            <button
              id="cart-nav-btn"
              onClick={() => setIsCartOpen(true)}
              className="relative flex items-center gap-2 px-3 py-2 rounded-full bg-[#FFF8F0] border border-[#EAD5C5] text-[#5B3A29] hover:bg-[#F8D7DA]/40 transition group"
              aria-label="Shopping Cart"
            >
              <div className="relative">
                <ShoppingBag className="w-5 h-5 text-[#5B3A29]" />
                {cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-[#5B3A29] text-white font-bold text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </div>
              <span className="hidden md:inline font-price text-xs font-bold">
                ₹{cartSubtotal}
              </span>
            </button>

            {/* User Account / Login */}
            <div className="relative">
              <button
                id="user-menu-btn"
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="p-2.5 rounded-full text-[#5B3A29] hover:bg-[#FFF8F0] transition"
                aria-label="User Account"
              >
                <UserIcon className="w-5 h-5" />
              </button>

              <AnimatePresence>
                {isUserMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-56 bg-[#FFF8F0] rounded-2xl shadow-xl border border-[#EAD5C5] p-2 z-50"
                  >
                    {currentUser ? (
                      <div className="p-2.5 border-b border-[#EAD5C5] mb-1">
                        <p className="text-xs font-bold text-[#2E2E2E] truncate">{currentUser.name}</p>
                        <p className="text-[11px] text-[#8C7A6B] truncate">{currentUser.email}</p>
                      </div>
                    ) : (
                      <div className="p-2.5 border-b border-[#EAD5C5] mb-1">
                        <p className="text-xs font-semibold text-[#5B3A29]">Guest Shopper</p>
                        <p className="text-[11px] text-[#8C7A6B] mt-0.5">Browse freely or log in</p>
                        <button
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            openAuthModal('general');
                          }}
                          className="mt-2 w-full py-1.5 px-3 rounded-lg bg-[#5B3A29] text-white text-xs font-semibold hover:bg-[#43291B] transition shadow-xs text-center"
                        >
                          Sign In / Create Account
                        </button>
                      </div>
                    )}

                    <button
                      onClick={() => {
                        setActiveTab('customer');
                        setIsUserMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-[#2E2E2E] hover:bg-[#FDF9F4] rounded-xl transition"
                    >
                      <UserIcon className="w-4 h-4 text-[#5B3A29]" />
                      My Orders & Profile
                    </button>

                    <button
                      onClick={() => {
                        setActiveTab('track');
                        setIsUserMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-[#2E2E2E] hover:bg-[#FDF9F4] rounded-xl transition"
                    >
                      <Package className="w-4 h-4 text-[#5B3A29]" />
                      Track My Order
                    </button>

                    {isAdmin && (
                      <button
                        onClick={() => {
                          setActiveTab('admin');
                          setIsUserMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-[#708238] font-semibold hover:bg-[#FDF9F4] rounded-xl transition"
                      >
                        <SlidersHorizontal className="w-4 h-4 text-[#708238]" />
                        Open Admin Portal
                      </button>
                    )}

                    {currentUser && (
                      <button
                        onClick={() => {
                          logoutUser();
                          setIsUserMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-[#842029] hover:bg-[#FDF9F4] rounded-xl transition mt-1 border-t border-[#EAD5C5]"
                      >
                        <LogOut className="w-4 h-4" />
                        Log Out
                      </button>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Admin Switch Quick Badge - Only visible if logged in as Admin */}
            {isAdmin && (
              <button
                id="admin-quick-toggle-btn"
                onClick={() => {
                  if (activeTab === 'admin') {
                    setActiveTab('home');
                  } else {
                    setActiveTab('admin');
                  }
                }}
                className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition shadow-sm ${
                  activeTab === 'admin'
                    ? 'bg-[#708238] text-white border-[#708238]'
                    : 'bg-[#FFF8F0] text-[#708238] border-[#708238]/40 hover:bg-[#E8F0DC]'
                }`}
                title="Admin Workspace"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{activeTab === 'admin' ? 'Storefront View' : 'Artisan Admin'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-[#FFF8F0] border-b border-[#EAD5C5] px-4 py-5 overflow-hidden"
          >
            <div className="flex flex-col space-y-2">
              {[
                { id: 'home', label: 'Home' },
                { id: 'shop', label: 'Shop All Crochet' },
                { id: 'custom', label: 'Custom Crochet Orders' },
                { id: 'track', label: 'Track Order' },
                { id: 'customer', label: 'My Account & Orders' },
                { id: 'contact', label: 'About & Contact' },
                ...(isAdmin ? [{ id: 'admin', label: 'Artisan Admin Panel' }] : [])
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id as any);
                    setIsMobileMenuOpen(false);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium text-left ${
                    activeTab === item.id
                      ? 'bg-[#5B3A29] text-white font-semibold'
                      : 'text-[#2E2E2E] hover:bg-[#FDF9F4]'
                  }`}
                >
                  <span>{item.label}</span>
                  <ChevronRight className="w-4 h-4 opacity-70" />
                </button>
              ))}
              {/* Quick Scan to Pay Mobile Button */}
              <button
                type="button"
                onClick={() => {
                  setIsUpiScannerOpen(true);
                  setIsMobileMenuOpen(false);
                }}
                className="flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold bg-[#E8F0DC] text-[#4A5D1E] border border-[#D5E2C4]"
              >
                <div className="flex items-center gap-2">
                  <QrCode className="w-4 h-4 text-[#708238]" />
                  <span>Scan to Pay (India Post QR)</span>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-white px-2 py-0.5 rounded-md border border-[#D5E2C4]">
                  UPI
                </span>
              </button>

              {/* Mobile User Authentication Status */}
              <div className="pt-2 border-t border-[#EAD5C5]">
                {currentUser ? (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-[#EAD5C5]">
                    <div>
                      <p className="text-xs font-bold text-[#2E2E2E]">{currentUser.name}</p>
                      <p className="text-[11px] text-[#8C7A6B]">{currentUser.email}</p>
                    </div>
                    <button
                      onClick={() => {
                        logoutUser();
                        setIsMobileMenuOpen(false);
                      }}
                      className="text-xs font-semibold text-[#842029] hover:underline"
                    >
                      Log Out
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      openAuthModal('general');
                    }}
                    className="w-full py-2.5 px-4 rounded-xl bg-[#5B3A29] text-white font-semibold text-xs flex items-center justify-center gap-2 hover:bg-[#43291B] transition shadow-xs"
                  >
                    <UserIcon className="w-4 h-4" />
                    <span>Sign In or Create Account</span>
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
