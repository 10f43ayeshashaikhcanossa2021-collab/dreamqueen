import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import {
  User as UserIcon,
  Package,
  Heart,
  MapPin,
  CreditCard,
  Settings,
  LogOut,
  ExternalLink,
  ShoppingBag,
  Trash2,
  CheckCircle2,
  Clock,
  Download,
  Star,
  MessageSquare,
  Sparkles,
  ThumbsUp,
  AlertCircle
} from 'lucide-react';
import { motion } from 'motion/react';
import { Order, OrderItem } from '../types';

export const CustomerDashboard: React.FC = () => {
  const {
    currentUser,
    orders,
    wishlist,
    products,
    feedbacks,
    setActiveFeedbackTarget,
    getFeedbackForOrderItem,
    toggleWishlist,
    addToCart,
    setActiveTab,
    setTrackingSearchId,
    updateUserProfile,
    logoutUser,
    loginUser,
    openAuthModal,
    showToast
  } = useStore();

  const [activeSubTab, setActiveSubTab] = useState<
    'orders' | 'feedback' | 'wishlist' | 'addresses' | 'payments' | 'profile'
  >('orders');

  // Profile edit states
  const [profileName, setProfileName] = useState(currentUser?.name || '');
  const [profilePhone, setProfilePhone] = useState(currentUser?.phone || '');

  // If not logged in, show aesthetic sign-in / registration card
  if (!currentUser) {
    return (
      <div className="py-20 max-w-md mx-auto px-4 text-center">
        <div className="bg-white p-8 rounded-3xl border border-[#EAD5C5] shadow-lg space-y-5">
          <div className="w-16 h-16 rounded-full bg-[#F8D7DA] flex items-center justify-center text-3xl mx-auto shadow-xs">
            🌸
          </div>
          <div>
            <span className="text-[11px] uppercase tracking-wider font-bold text-[#708238]">
              Customer Account
            </span>
            <h2 className="font-heading text-2xl font-bold text-[#5B3A29] mt-1">
              Sign In or Create Account
            </h2>
          </div>
          <p className="text-xs text-[#6E6863] leading-relaxed">
            Please log in or create your DreamQueen account to track your orders in real time, view order history, and manage your wishlist.
          </p>
          <div className="space-y-3 pt-2">
            <button
              onClick={() => openAuthModal('general')}
              className="w-full py-3.5 rounded-full bg-[#5B3A29] text-white text-xs font-semibold hover:bg-[#43291B] transition shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <UserIcon className="w-4 h-4" />
              <span>Sign In or Create Account</span>
            </button>
            <button
              onClick={() => setActiveTab('shop')}
              className="w-full py-3 rounded-full bg-[#FFF8F0] border border-[#EAD5C5] text-[#5B3A29] text-xs font-semibold hover:bg-[#F8D7DA]/40 transition"
            >
              Explore Shop First
            </button>
          </div>
        </div>
      </div>
    );
  }

  const wishlistedProducts = products.filter((p) => wishlist.includes(p.id));

  // Feedbacks submitted by this user (or on orders owned by this user)
  const userFeedbacks = feedbacks.filter(
    (fb) =>
      fb.customerEmail.toLowerCase() === (currentUser?.email || '').toLowerCase() ||
      orders.some((o) => o.orderNumber === fb.orderNumber)
  );

  // Purchased items awaiting customer review
  const itemsAwaitingFeedback: Array<{ order: Order; item: OrderItem }> = [];
  orders.forEach((ord) => {
    ord.items.forEach((it) => {
      const alreadyReviewed = getFeedbackForOrderItem(ord.orderNumber, it.productId);
      if (!alreadyReviewed) {
        itemsAwaitingFeedback.push({ order: ord, item: it });
      }
    });
  });

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateUserProfile(profileName, profilePhone);
    showToast('Profile information saved!');
  };

  const handleDownloadInvoice = (orderNumber: string) => {
    showToast(`Downloading official invoice for ${orderNumber}... 📄`);
  };

  return (
    <div className="py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Sidebar */}
        <div className="lg:col-span-4 xl:col-span-3">
          <div className="bg-white rounded-3xl border border-[#EAD5C5] p-6 shadow-xs space-y-6">
            {/* User Profile Card */}
            <div className="text-center pb-5 border-b border-[#F0DFD1]">
              <div className="w-16 h-16 rounded-full bg-[#FFF8F0] border-2 border-[#F8D7DA] flex items-center justify-center text-2xl mx-auto mb-3">
                🌸
              </div>
              <h2 className="font-heading text-lg font-bold text-[#5B3A29]">
                {currentUser.name}
              </h2>
              <p className="text-xs text-[#8C7A6B]">{currentUser.email}</p>
              <span className="inline-block mt-2 px-3 py-1 rounded-full text-[10px] font-bold bg-[#E8F0DC] text-[#4A5D1E]">
                DreamQueen VIP Shopper
              </span>
            </div>

            {/* Sidebar Tabs */}
            <nav className="space-y-1.5">
              {[
                { id: 'orders', label: 'My Orders', icon: Package, count: orders.length },
                {
                  id: 'feedback',
                  label: 'Item Reviews & Feedback',
                  icon: Star,
                  count: userFeedbacks.length
                },
                { id: 'wishlist', label: 'Wishlist', icon: Heart, count: wishlist.length },
                { id: 'addresses', label: 'Saved Addresses', icon: MapPin },
                { id: 'payments', label: 'Payment History', icon: CreditCard },
                { id: 'profile', label: 'Account Settings', icon: Settings }
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveSubTab(tab.id as any)}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition ${
                      activeSubTab === tab.id
                        ? 'bg-[#5B3A29] text-white shadow-xs'
                        : 'text-[#2E2E2E] hover:bg-[#FFF8F0]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className="w-4 h-4" />
                      <span>{tab.label}</span>
                    </div>
                    {typeof tab.count === 'number' && (
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full ${
                          activeSubTab === tab.id ? 'bg-white/20' : 'bg-gray-100'
                        }`}
                      >
                        {tab.count}
                      </span>
                    )}
                  </button>
                );
              })}

              <button
                onClick={logoutUser}
                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl text-xs font-semibold text-[#842029] hover:bg-[#FFF0F0] transition mt-4 pt-3 border-t border-[#F0DFD1]"
              >
                <LogOut className="w-4 h-4" />
                <span>Log Out</span>
              </button>
            </nav>
          </div>
        </div>

        {/* Right Content Area */}
        <div className="lg:col-span-8 xl:col-span-9">
          {/* TAB 1: Orders */}
          {activeSubTab === 'orders' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-heading text-2xl font-bold text-[#5B3A29]">
                    My Orders
                  </h3>
                  <p className="text-xs text-[#6E6863]">
                    Track your orders and view past receipts
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('shop')}
                  className="px-4 py-2 rounded-full bg-[#5B3A29] text-white text-xs font-semibold hover:bg-[#43291B] transition"
                >
                  Shop More
                </button>
              </div>

              {orders.length === 0 ? (
                <div className="bg-white rounded-3xl border border-[#EAD5C5] p-12 text-center space-y-3">
                  <p className="text-3xl">📦</p>
                  <p className="font-heading text-base font-bold text-[#5B3A29]">No orders yet</p>
                  <p className="text-xs text-[#6E6863]">Find your first handcrafted gem!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((ord) => (
                    <div
                      key={ord.id}
                      className="bg-white rounded-3xl border border-[#EAD5C5] p-5 sm:p-6 shadow-xs space-y-4"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#F0DFD1] gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-heading text-lg font-bold text-[#5B3A29]">
                              {ord.orderNumber}
                            </span>
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                ord.trackingStatus === 'delivered'
                                  ? 'bg-[#E8F0DC] text-[#4A5D1E]'
                                  : 'bg-[#FFF3A8] text-[#855D00]'
                              }`}
                            >
                              {ord.trackingStatus.replace('_', ' ')}
                            </span>
                          </div>
                          <span className="text-[11px] text-[#8C7A6B]">
                            Placed on {new Date(ord.createdAt).toLocaleDateString()} • {ord.items.length} item(s)
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setTrackingSearchId(ord.orderNumber);
                              setActiveTab('track');
                            }}
                            className="px-4 py-1.5 rounded-full bg-[#FFF8F0] border border-[#EAD5C5] text-xs font-semibold text-[#5B3A29] hover:bg-[#F8D7DA]/40 transition"
                          >
                            Live Tracking
                          </button>
                          <button
                            onClick={() => handleDownloadInvoice(ord.orderNumber)}
                            className="p-2 rounded-full text-[#6E6863] hover:text-[#2E2E2E] hover:bg-[#FFF8F0]"
                            title="Download Invoice PDF"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Items */}
                      <div className="space-y-3">
                        {ord.items.map((it, i) => {
                          const existingFb = getFeedbackForOrderItem(ord.orderNumber, it.productId);
                          return (
                            <div
                              key={i}
                              className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-2xl bg-[#FFFDFB] border border-[#F0DFD1] gap-3 text-xs"
                            >
                              <div className="flex items-center gap-3">
                                <img
                                  src={it.image}
                                  alt={it.productName}
                                  className="w-12 h-12 rounded-xl object-cover border border-[#EAD5C5] shrink-0"
                                />
                                <div>
                                  <span className="font-bold text-[#2E2E2E] block">{it.productName}</span>
                                  <span className="text-[11px] text-[#8C7A6B]">
                                    {it.color.name} × {it.quantity} • <span className="font-price font-bold text-[#5B3A29]">₹{it.price * it.quantity}</span>
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 self-start sm:self-auto">
                                {existingFb ? (
                                  <button
                                    onClick={() => setActiveFeedbackTarget({ order: ord, item: it })}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#E8F0DC] border border-[#708238]/30 text-[#4A5D1E] font-bold text-[11px] hover:bg-[#DCE8CD] transition shadow-2xs"
                                  >
                                    <Star className="w-3.5 h-3.5 fill-[#708238] text-[#708238]" />
                                    <span>Reviewed ({existingFb.rating}★) • View/Edit</span>
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => setActiveFeedbackTarget({ order: ord, item: it })}
                                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#5B3A29] hover:bg-[#43291B] text-white font-semibold text-[11px] transition shadow-2xs group"
                                  >
                                    <Star className="w-3.5 h-3.5 text-[#F4B41A] fill-[#F4B41A]" />
                                    <span>Rate & Leave Feedback</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="pt-3 border-t border-[#F0DFD1] flex justify-between items-center text-xs">
                        <span className="text-[#708238] font-medium">
                          Estimated Delivery: {ord.estimatedDeliveryDate}
                        </span>
                        <div className="font-bold text-sm text-[#5B3A29]">
                          Total Paid: <span className="font-price font-bold">₹{ord.total}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 1.5: Feedback & Reviews */}
          {activeSubTab === 'feedback' && (
            <div className="space-y-6">
              <div>
                <h3 className="font-heading text-2xl font-bold text-[#5B3A29]">
                  My Reviews & Item Feedback
                </h3>
                <p className="text-xs text-[#6E6863]">
                  Your verified thoughts empower our rural women artisans and guide fellow crochet lovers.
                </p>
              </div>

              {/* Stats Overview */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 rounded-2xl bg-white border border-[#EAD5C5] flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#FFF8F0] border border-[#EAD5C5] flex items-center justify-center text-[#5B3A29]">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs text-[#8C7A6B] block">Reviews Given</span>
                    <span className="font-heading text-lg font-bold text-[#5B3A29]">
                      {userFeedbacks.length}
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-[#EAD5C5] flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#FFF8F0] border border-[#EAD5C5] flex items-center justify-center text-[#D4A017]">
                    <Star className="w-5 h-5 fill-[#D4A017]" />
                  </div>
                  <div>
                    <span className="text-xs text-[#8C7A6B] block">Avg Rating Given</span>
                    <span className="font-heading text-lg font-bold text-[#5B3A29]">
                      {userFeedbacks.length > 0
                        ? (
                            userFeedbacks.reduce((acc, f) => acc + f.rating, 0) /
                            userFeedbacks.length
                          ).toFixed(1) + ' ★'
                        : '5.0 ★'}
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-[#EAD5C5] flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#E8F0DC] border border-[#708238]/30 flex items-center justify-center text-[#4A5D1E]">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs text-[#8C7A6B] block">Awaiting Feedback</span>
                    <span className="font-heading text-lg font-bold text-[#4A5D1E]">
                      {itemsAwaitingFeedback.length} piece{itemsAwaitingFeedback.length === 1 ? '' : 's'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Items Awaiting Review */}
              {itemsAwaitingFeedback.length > 0 && (
                <div className="p-5 rounded-3xl bg-[#FFF8F0] border-2 border-[#EAD5C5] space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#8B4052]" />
                      <h4 className="font-heading text-sm font-bold text-[#5B3A29]">
                        Purchased Items Awaiting Your Craft Review ({itemsAwaitingFeedback.length})
                      </h4>
                    </div>
                    <span className="text-[11px] text-[#8C7A6B]">Share your experience</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {itemsAwaitingFeedback.map(({ order: ord, item: it }, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-white rounded-2xl border border-[#EAD5C5] flex items-center justify-between gap-3 shadow-2xs"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={it.image}
                            alt={it.productName}
                            className="w-12 h-12 rounded-xl object-cover border border-[#EAD5C5] shrink-0"
                          />
                          <div className="min-w-0">
                            <span className="text-xs font-bold text-[#2E2E2E] block truncate">
                              {it.productName}
                            </span>
                            <span className="text-[10px] text-[#8C7A6B] block">
                              Order #{ord.orderNumber} • {it.color.name}
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => setActiveFeedbackTarget({ order: ord, item: it })}
                          className="shrink-0 px-3 py-1.5 rounded-full bg-[#5B3A29] hover:bg-[#43291B] text-white text-xs font-semibold flex items-center gap-1 transition shadow-2xs"
                        >
                          <Star className="w-3.5 h-3.5 fill-[#F4B41A] text-[#F4B41A]" />
                          <span>Review</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Submitted Reviews List */}
              <div className="space-y-4">
                <h4 className="font-heading text-base font-bold text-[#5B3A29]">
                  Your Published Reviews ({userFeedbacks.length})
                </h4>

                {userFeedbacks.length === 0 ? (
                  <div className="text-center py-12 bg-white rounded-3xl border border-[#EAD5C5] p-6 space-y-3">
                    <div className="w-12 h-12 rounded-full bg-[#FFF8F0] flex items-center justify-center text-xl mx-auto text-[#8C7A6B]">
                      🌸
                    </div>
                    <h4 className="font-heading text-base font-bold text-[#5B3A29]">
                      No reviews shared yet
                    </h4>
                    <p className="text-xs text-[#6E6863] max-w-sm mx-auto">
                      Whenever your handmade crochet items arrive, you can leave helpful feedback and craft ratings here!
                    </p>
                    {orders.length > 0 && (
                      <button
                        onClick={() => setActiveSubTab('orders')}
                        className="px-5 py-2 rounded-full bg-[#5B3A29] text-white text-xs font-semibold hover:bg-[#43291B] transition"
                      >
                        View My Orders
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {userFeedbacks.map((fb) => {
                      const matchedOrder = orders.find((o) => o.orderNumber === fb.orderNumber);
                      const matchedItem = matchedOrder?.items.find(
                        (it) => it.productId === fb.productId
                      );

                      return (
                        <div
                          key={fb.id}
                          className="bg-white rounded-3xl border border-[#EAD5C5] p-5 sm:p-6 shadow-xs space-y-4"
                        >
                          {/* Top Row */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#F0DFD1]">
                            <div className="flex items-center gap-3.5">
                              {fb.productImage && (
                                <img
                                  src={fb.productImage}
                                  alt={fb.productName}
                                  className="w-12 h-12 rounded-xl object-cover border border-[#EAD5C5]"
                                />
                              )}
                              <div>
                                <div className="flex items-center gap-2">
                                  <h5 className="font-heading text-sm font-bold text-[#2E2E2E]">
                                    {fb.productName}
                                  </h5>
                                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#E8F0DC] text-[#4A5D1E]">
                                    Verified Order #{fb.orderNumber}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <div className="flex items-center">
                                    {[...Array(5)].map((_, i) => (
                                      <Star
                                        key={i}
                                        className={`w-3.5 h-3.5 ${
                                          i < fb.rating
                                            ? 'text-[#D4A017] fill-[#D4A017]'
                                            : 'text-gray-200'
                                        }`}
                                      />
                                    ))}
                                  </div>
                                  <span className="text-[11px] text-[#8C7A6B]">
                                    {new Date(fb.createdAt).toLocaleDateString()}
                                  </span>
                                  {fb.selectedColor && (
                                    <span className="text-[11px] text-[#5B3A29] font-medium">
                                      • Shade: {fb.selectedColor.name}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Edit Button if order and item matched */}
                            {matchedOrder && matchedItem && (
                              <button
                                onClick={() =>
                                  setActiveFeedbackTarget({
                                    order: matchedOrder,
                                    item: matchedItem
                                  })
                                }
                                className="self-start sm:self-auto px-3.5 py-1.5 rounded-full bg-[#FFF8F0] border border-[#EAD5C5] text-xs font-semibold text-[#5B3A29] hover:bg-[#F8D7DA]/40 transition"
                              >
                                Edit Review
                              </button>
                            )}
                          </div>

                          {/* Headline & Body */}
                          <div className="space-y-1.5">
                            {fb.headline && (
                              <h6 className="font-bold text-xs sm:text-sm text-[#5B3A29]">
                                "{fb.headline}"
                              </h6>
                            )}
                            <p className="text-xs sm:text-sm text-[#4A4540] leading-relaxed">
                              {fb.comment}
                            </p>
                          </div>

                          {/* Tags & Photo */}
                          <div className="space-y-3">
                            {fb.tags && fb.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1.5">
                                {fb.tags.map((tg, i) => (
                                  <span
                                    key={i}
                                    className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-[#FFF8F0] border border-[#EAD5C5] text-[#5B3A29]"
                                  >
                                    {tg}
                                  </span>
                                ))}
                              </div>
                            )}

                            {fb.photoUrl && (
                              <div className="pt-1">
                                <span className="text-[11px] font-bold text-[#8C7A6B] block mb-1.5">
                                  Customer Shared Photo:
                                </span>
                                <img
                                  src={fb.photoUrl}
                                  alt="Customer purchase"
                                  className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl object-cover border border-[#EAD5C5] shadow-xs"
                                />
                              </div>
                            )}
                          </div>

                          {/* Artisan Response */}
                          {fb.artisanResponse && (
                            <div className="p-3.5 rounded-2xl bg-[#FFF8F0] border-l-4 border-[#5B3A29] space-y-1">
                              <div className="flex items-center gap-1.5 text-xs font-bold text-[#5B3A29]">
                                <Sparkles className="w-3.5 h-3.5 text-[#8B4052]" />
                                <span>Response from {fb.artisanResponse.author}</span>
                                <span className="text-[10px] text-[#8C7A6B] font-normal">
                                  • {new Date(fb.artisanResponse.respondedAt).toLocaleDateString()}
                                </span>
                              </div>
                              <p className="text-xs text-[#55504C] italic">
                                "{fb.artisanResponse.text}"
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: Wishlist */}
          {activeSubTab === 'wishlist' && (
            <div className="space-y-6">
              <div>
                <h3 className="font-heading text-2xl font-bold text-[#5B3A29]">
                  My Saved Wishlist
                </h3>
                <p className="text-xs text-[#6E6863]">
                  Handmade crochet pieces you are saving for later or gifting
                </p>
              </div>

              {wishlistedProducts.length === 0 ? (
                <div className="bg-white rounded-3xl border border-[#EAD5C5] p-12 text-center space-y-3">
                  <Heart className="w-10 h-10 text-[#F8D7DA] mx-auto fill-[#F8D7DA]" />
                  <p className="font-heading text-base font-bold text-[#5B3A29]">
                    Your wishlist is empty
                  </p>
                  <button
                    onClick={() => setActiveTab('shop')}
                    className="px-5 py-2.5 rounded-full bg-[#5B3A29] text-white text-xs font-semibold"
                  >
                    Browse Crochet Collection
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {wishlistedProducts.map((prod) => (
                    <div
                      key={prod.id}
                      className="bg-white rounded-2xl border border-[#EAD5C5] p-3 shadow-xs space-y-2 flex flex-col justify-between"
                    >
                      <div className="aspect-square rounded-xl overflow-hidden bg-[#FFF8F0]">
                        <img
                          src={prod.images[0]}
                          alt={prod.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <h4 className="font-heading text-sm font-bold text-[#2E2E2E] truncate">
                          {prod.name}
                        </h4>
                        <span className="font-price font-bold text-xs text-[#5B3A29]">
                          ₹{prod.price}
                        </span>
                      </div>
                      <div className="flex gap-2 pt-2 border-t border-[#F0DFD1]">
                        <button
                          onClick={() => addToCart(prod, 1, 0)}
                          className="flex-1 py-1.5 px-3 rounded-xl bg-[#5B3A29] text-white text-xs font-semibold hover:bg-[#43291B] transition flex items-center justify-center gap-1"
                        >
                          <ShoppingBag className="w-3.5 h-3.5" />
                          <span>Add to Cart</span>
                        </button>
                        <button
                          onClick={() => toggleWishlist(prod.id)}
                          className="p-1.5 rounded-xl border border-gray-200 text-gray-400 hover:text-red-500"
                          title="Remove"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Saved Addresses */}
          {activeSubTab === 'addresses' && (
            <div className="space-y-6">
              <div>
                <h3 className="font-heading text-2xl font-bold text-[#5B3A29]">
                  Saved Addresses
                </h3>
                <p className="text-xs text-[#6E6863]">
                  Manage delivery addresses for seamless 1-click checkout
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white p-5 rounded-3xl border-2 border-[#5B3A29] shadow-xs space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="px-2 py-0.5 rounded-full bg-[#F8D7DA] text-[#842029] text-[10px] font-bold">
                      Default Address
                    </span>
                    <span className="text-xs text-[#708238] font-bold">Verified Pincode</span>
                  </div>
                  <p className="font-heading text-base font-bold text-[#2E2E2E]">
                    {currentUser.name}
                  </p>
                  <p className="text-xs text-[#6E6863]">
                    Flat 402, Blossom Heights, Bandra West, Mumbai, Maharashtra - 400050
                  </p>
                  <p className="text-xs text-[#8C7A6B]">Mobile: {currentUser.phone}</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Payments History */}
          {activeSubTab === 'payments' && (
            <div className="space-y-6">
              <div>
                <h3 className="font-heading text-2xl font-bold text-[#5B3A29]">
                  Payment History
                </h3>
                <p className="text-xs text-[#6E6863]">
                  Razorpay settlement records, payment IDs, and transaction statuses
                </p>
              </div>

              <div className="bg-white rounded-3xl border border-[#EAD5C5] overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FFF8F0] border-b border-[#EAD5C5] text-[#5B3A29] font-bold">
                    <tr>
                      <th className="p-4">Payment ID</th>
                      <th className="p-4">Order Ref</th>
                      <th className="p-4">Method</th>
                      <th className="p-4">Amount</th>
                      <th className="p-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F0DFD1]">
                    {orders.map((ord) => (
                      <tr key={ord.id} className="hover:bg-[#FDF9F4]">
                        <td className="p-4 font-mono text-[11px] text-[#2E2E2E]">
                          {ord.razorpayPaymentId || 'COD_RECORD'}
                        </td>
                        <td className="p-4 font-bold text-[#5B3A29]">{ord.orderNumber}</td>
                        <td className="p-4 uppercase font-semibold text-gray-600">
                          {ord.paymentMethod}
                        </td>
                        <td className="p-4 font-price font-bold text-[#2E2E2E]">₹{ord.total}</td>
                        <td className="p-4">
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-[#E8F0DC] text-[#4A5D1E]">
                            {ord.paymentStatus}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: Profile Settings */}
          {activeSubTab === 'profile' && (
            <div className="bg-white rounded-3xl border border-[#EAD5C5] p-6 sm:p-8 shadow-xs space-y-6">
              <div>
                <h3 className="font-heading text-2xl font-bold text-[#5B3A29]">
                  Account Settings
                </h3>
                <p className="text-xs text-[#6E6863]">
                  Update your personal profile and communication preferences
                </p>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-4 max-w-md">
                <div>
                  <label className="block text-xs font-semibold text-[#55504C] mb-1">
                    Your Name
                  </label>
                  <input
                    type="text"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#EAD5C5] bg-[#FDF9F4] focus:outline-none focus:ring-1 focus:ring-[#5B3A29]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#55504C] mb-1">
                    Phone Number (WhatsApp)
                  </label>
                  <input
                    type="text"
                    value={profilePhone}
                    onChange={(e) => setProfilePhone(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#EAD5C5] bg-[#FDF9F4] focus:outline-none focus:ring-1 focus:ring-[#5B3A29]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#55504C] mb-1">
                    Email Address (Read-only)
                  </label>
                  <input
                    type="email"
                    readOnly
                    value={currentUser.email}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 bg-gray-50 text-gray-500"
                  />
                </div>

                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-full bg-[#5B3A29] text-white text-xs font-semibold hover:bg-[#43291B] transition shadow-xs"
                >
                  Save Profile Changes
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
