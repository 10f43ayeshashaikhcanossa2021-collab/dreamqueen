import React, { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import {
  User as UserIcon,
  Package,
  Heart,
  MapPin,
  CreditCard,
  Settings,
  LogOut,
  ShoppingBag,
  Trash2,
  Download,
  Star,
  MessageSquare,
  Sparkles,
  Plus,
  Edit3,
  CheckCircle2,
  Truck,
  XCircle
} from 'lucide-react';
import { Order, OrderItem, ShippingAddress } from '../types';
import { resolveItemImage, safeImage } from '../utils/imageHelper';
import { downloadOrderInvoicePdf } from '../utils/invoiceGenerator';
import { isValidIndianPhone, isValidIndianPincode, normalizeIndianPhone } from '../utils/pricing';

const emptyAddressForm = (user?: { name?: string; email?: string; phone?: string } | null): ShippingAddress => ({
  label: 'Home',
  fullName: user?.name || '',
  email: user?.email || '',
  phone: user?.phone || '',
  address: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: 'Maharashtra',
  pincode: '',
  isDefault: false
});

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
    updateUserProfile,
    saveUserAddress,
    removeUserAddress,
    cancelUserOrder,
    logoutUser,
    openAuthModal,
    showToast
  } = useStore();

  const [activeSubTab, setActiveSubTab] = useState<
    'orders' | 'feedback' | 'wishlist' | 'addresses' | 'payments' | 'profile'
  >('orders');

  const [profileName, setProfileName] = useState(currentUser?.name || '');
  const [profilePhone, setProfilePhone] = useState(currentUser?.phone || '');
  const [isAddressFormOpen, setIsAddressFormOpen] = useState(false);
  const [addressForm, setAddressForm] = useState<ShippingAddress>(() => emptyAddressForm(currentUser));
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);

  useEffect(() => {
    if (currentUser) {
      setProfileName(currentUser.name || '');
      setProfilePhone(currentUser.phone || '');
    }
  }, [currentUser]);

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
            Log in or create your DreamQueen account to track orders, save delivery addresses, download PDF invoices, and manage your wishlist.
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
              className="w-full py-3 rounded-full bg-[#FFF8F0] border border-[#EAD5C5] text-[#5B3A29] text-xs font-semibold hover:bg-[#F8D7DA]/40 transition cursor-pointer"
            >
              Explore Shop First
            </button>
          </div>
        </div>
      </div>
    );
  }

  const wishlistedProducts = products.filter((p) => wishlist.includes(p.id) && p.isActive !== false);

  const userOrders = orders.filter((o) => {
    if (o.userId && currentUser.id && o.userId === currentUser.id) return true;
    const userEmail = (currentUser.email || '').trim().toLowerCase();
    const orderEmail = (o.customer?.email || o.shippingAddress?.email || '').trim().toLowerCase();
    if (userEmail && orderEmail && userEmail === orderEmail) return true;

    const userPhone = normalizeIndianPhone(currentUser.phone || '');
    const orderPhone = normalizeIndianPhone(o.customer?.phone || o.shippingAddress?.phone || '');
    if (userPhone && orderPhone && userPhone === orderPhone) return true;

    return false;
  });

  const ordersCount = userOrders.length;
  const isVipShopper = ordersCount >= 3;

  const userFeedbacks = feedbacks.filter(
    (fb) =>
      fb.customerEmail.toLowerCase() === (currentUser.email || '').toLowerCase() ||
      userOrders.some((o) => o.orderNumber === fb.orderNumber)
  );

  const itemsAwaitingFeedback: Array<{ order: Order; item: OrderItem }> = [];
  userOrders.forEach((ord) => {
    if (ord.trackingStatus === 'cancelled') return;
    ord.items.forEach((it) => {
      const alreadyReviewed = getFeedbackForOrderItem(ord.orderNumber, it.productId);
      if (!alreadyReviewed) {
        itemsAwaitingFeedback.push({ order: ord, item: it });
      }
    });
  });

  const savedAddresses = currentUser.savedAddresses || [];

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileName.trim()) {
      showToast('Name cannot be empty', 'error');
      return;
    }
    if (profilePhone.trim() && !isValidIndianPhone(profilePhone)) {
      showToast('Enter a valid 10-digit Indian phone number', 'error');
      return;
    }
    const { error } = await updateUserProfile(profileName.trim(), profilePhone.trim());
    if (error) {
      showToast(error, 'error');
      return;
    }
    showToast('Profile information saved!');
  };

  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addressForm.fullName.trim() || !addressForm.addressLine1.trim() || !addressForm.city.trim()) {
      showToast('Please fill full name, address line, and city.', 'error');
      return;
    }
    if (!isValidIndianPhone(addressForm.phone)) {
      showToast('Enter a valid 10-digit Indian phone number.', 'error');
      return;
    }
    if (!isValidIndianPincode(addressForm.pincode)) {
      showToast('Enter a valid 6-digit Indian pincode.', 'error');
      return;
    }

    const { error } = await saveUserAddress({
      ...addressForm,
      email: addressForm.email || currentUser.email,
      isDefault: savedAddresses.length === 0 ? true : addressForm.isDefault
    });

    if (error) {
      showToast(error, 'error');
      return;
    }
    showToast('Saved address updated!');
    setIsAddressFormOpen(false);
    setAddressForm(emptyAddressForm(currentUser));
  };

  const handleCancelOrder = async (orderId: string) => {
    setCancellingOrderId(orderId);
    try {
      const res = await cancelUserOrder(orderId, 'Cancelled by customer from account');
      if (res.success) {
        showToast('Order cancelled and stock restored.');
      } else {
        showToast(res.error || 'Could not cancel order.', 'error');
      }
    } finally {
      setCancellingOrderId(null);
    }
  };

  const canCancelStatus = (status: Order['trackingStatus']) =>
    status === 'pending' || status === 'payment_pending' || status === 'preparing';

  return (
    <div className="py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 xl:col-span-3">
          <div className="bg-white rounded-3xl border border-[#EAD5C5] p-6 shadow-xs space-y-6">
            <div className="text-center pb-5 border-b border-[#F0DFD1]">
              <div className="w-16 h-16 rounded-full bg-[#FFF8F0] border-2 border-[#F8D7DA] flex items-center justify-center text-2xl mx-auto mb-3 font-heading font-bold text-[#5B3A29]">
                {currentUser.name.charAt(0).toUpperCase()}
              </div>
              <h2 className="font-heading text-lg font-bold text-[#5B3A29]">
                {currentUser.name}
              </h2>
              <p className="text-xs text-[#8C7A6B] break-all">{currentUser.email}</p>

              {isVipShopper ? (
                <div className="mt-2.5">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-[#E8F0DC] text-[#4A5D1E] border border-[#C5DCAB] shadow-2xs">
                    <span>👑</span>
                    <span>DreamQueen VIP Shopper</span>
                    <span className="bg-[#4A5D1E] text-white text-[9px] px-1.5 py-0.2 rounded-full font-bold">
                      VIP
                    </span>
                  </span>
                  <div className="mt-2 text-[10px] font-semibold text-[#4A5D1E] bg-[#F4F9EC] rounded-xl p-2 border border-[#E0EED0]">
                    Active VIP Member ({ordersCount} Orders Placed)
                  </div>
                </div>
              ) : (
                <div className="mt-2.5 space-y-2">
                  <span className="inline-block px-3 py-1 rounded-full text-[10px] font-semibold bg-[#FFF8F0] border border-[#EAD5C5] text-[#5B3A29]">
                    {ordersCount === 0
                      ? 'DreamQueen Member • 0 orders'
                      : `${ordersCount} Order${ordersCount === 1 ? '' : 's'} Placed • ${3 - ordersCount} more to VIP`}
                  </span>
                  <div className="p-2.5 rounded-xl bg-[#FDF9F4] border border-[#EAD5C5] text-left">
                    <div className="flex items-center justify-between text-[10px] font-bold text-[#5B3A29] mb-1">
                      <span>VIP Status Progress</span>
                      <span>{ordersCount}/3 Orders</span>
                    </div>
                    <div className="w-full bg-[#EAD5C5]/40 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-[#708238] h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, (ordersCount / 3) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <nav className="space-y-1.5">
              {[
                { id: 'orders', label: 'My Orders', icon: Package, count: userOrders.length },
                { id: 'feedback', label: 'Item Reviews', icon: Star, count: userFeedbacks.length },
                { id: 'wishlist', label: 'Wishlist', icon: Heart, count: wishlistedProducts.length },
                { id: 'addresses', label: 'Saved Addresses', icon: MapPin, count: savedAddresses.length },
                { id: 'payments', label: 'Payment History', icon: CreditCard },
                { id: 'profile', label: 'Account Settings', icon: Settings }
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveSubTab(tab.id as any)}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition cursor-pointer ${
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
                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl text-xs font-semibold text-[#842029] hover:bg-[#FFF0F0] transition mt-4 pt-3 border-t border-[#F0DFD1] cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Log Out</span>
              </button>
            </nav>
          </div>
        </div>

        <div className="lg:col-span-8 xl:col-span-9">
          {activeSubTab === 'orders' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="font-heading text-2xl font-bold text-[#5B3A29]">My Orders</h3>
                  <p className="text-xs text-[#6E6863]">
                    Track your orders, download invoices, or manage pending requests
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveTab('track')}
                    className="px-4 py-2 rounded-full bg-[#FFF8F0] border border-[#EAD5C5] text-[#5B3A29] text-xs font-semibold hover:bg-[#F8D7DA]/40 transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Truck className="w-3.5 h-3.5" />
                    <span>Track Order</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('shop')}
                    className="px-4 py-2 rounded-full bg-[#5B3A29] text-white text-xs font-semibold hover:bg-[#43291B] transition cursor-pointer"
                  >
                    Shop More
                  </button>
                </div>
              </div>

              {userOrders.length === 0 ? (
                <div className="bg-white rounded-3xl border border-[#EAD5C5] p-12 text-center space-y-3">
                  <p className="text-3xl">📦</p>
                  <p className="font-heading text-base font-bold text-[#5B3A29]">No orders yet</p>
                  <p className="text-xs text-[#6E6863]">Find your first handcrafted gem!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {userOrders.map((ord) => (
                    <div
                      key={ord.id}
                      className="bg-white rounded-3xl border border-[#EAD5C5] p-5 sm:p-6 shadow-xs space-y-4"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#F0DFD1] gap-2">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-heading text-lg font-bold text-[#5B3A29]">
                              {ord.orderNumber}
                            </span>
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                ord.trackingStatus === 'delivered'
                                  ? 'bg-[#E8F0DC] text-[#4A5D1E]'
                                  : ord.trackingStatus === 'cancelled'
                                  ? 'bg-[#FEE2E2] text-[#842029]'
                                  : 'bg-[#FFF3A8] text-[#855D00]'
                              }`}
                            >
                              {ord.trackingStatus.replace(/_/g, ' ')}
                            </span>
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#FFF8F0] border border-[#EAD5C5] text-[#5B3A29]">
                              Payment: {ord.paymentStatus}
                            </span>
                          </div>
                          <span className="text-[11px] text-[#8C7A6B]">
                            Placed on {new Date(ord.createdAt).toLocaleDateString()} • {ord.items.length} item(s)
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {ord.shiprocketTrackingNumber && (
                            <span className="px-3 py-1 rounded-full bg-[#FFF8F0] border border-[#EAD5C5] text-[11px] font-mono font-semibold text-[#5B3A29]">
                              {ord.shiprocketTrackingNumber}
                            </span>
                          )}
                          <button
                            onClick={() => {
                              downloadOrderInvoicePdf(ord);
                              showToast(`Invoice PDF downloaded for ${ord.orderNumber}`);
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-[#EAD5C5] text-[11px] font-semibold text-[#5B3A29] hover:bg-[#FFF8F0] cursor-pointer"
                            title="Download Invoice PDF"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Invoice</span>
                          </button>
                          {canCancelStatus(ord.trackingStatus) && (
                            <button
                              onClick={() => handleCancelOrder(ord.id)}
                              disabled={cancellingOrderId === ord.id}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-[#F5C2C7] text-[11px] font-semibold text-[#842029] hover:bg-[#FFF0F0] cursor-pointer disabled:opacity-50"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>{cancellingOrderId === ord.id ? 'Cancelling...' : 'Cancel'}</span>
                            </button>
                          )}
                        </div>
                      </div>

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
                                  src={resolveItemImage(it.productId, it.image)}
                                  alt={it.productName}
                                  className="w-12 h-12 rounded-xl object-cover border border-[#EAD5C5] shrink-0"
                                />
                                <div>
                                  <span className="font-bold text-[#2E2E2E] block">{it.productName}</span>
                                  <span className="text-[11px] text-[#8C7A6B]">
                                    {it.color.name} × {it.quantity} •{' '}
                                    <span className="font-price font-bold text-[#5B3A29]">
                                      ₹{it.price * it.quantity}
                                    </span>
                                  </span>
                                </div>
                              </div>

                              {ord.trackingStatus !== 'cancelled' && (
                                <div className="flex items-center gap-2 self-start sm:self-auto">
                                  {existingFb ? (
                                    <button
                                      onClick={() => setActiveFeedbackTarget({ order: ord, item: it })}
                                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#E8F0DC] border border-[#708238]/30 text-[#4A5D1E] font-bold text-[11px] hover:bg-[#DCE8CD] transition cursor-pointer"
                                    >
                                      <Star className="w-3.5 h-3.5 fill-[#708238] text-[#708238]" />
                                      <span>Reviewed ({existingFb.rating}★)</span>
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => setActiveFeedbackTarget({ order: ord, item: it })}
                                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#5B3A29] hover:bg-[#43291B] text-white font-semibold text-[11px] transition cursor-pointer"
                                    >
                                      <Star className="w-3.5 h-3.5 text-[#F4B41A] fill-[#F4B41A]" />
                                      <span>Rate &amp; Review</span>
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      <div className="pt-3 border-t border-[#F0DFD1] flex flex-wrap justify-between items-center text-xs gap-2">
                        <span className="text-[#708238] font-medium">
                          {ord.trackingStatus === 'cancelled'
                            ? ord.cancellationReason || 'Order cancelled'
                            : `Estimated Delivery: ${ord.estimatedDeliveryDate}`}
                        </span>
                        <div className="font-bold text-sm text-[#5B3A29]">
                          Order Total: <span className="font-price font-bold">₹{ord.total}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeSubTab === 'feedback' && (
            <div className="space-y-6">
              <div>
                <h3 className="font-heading text-2xl font-bold text-[#5B3A29]">
                  My Reviews &amp; Item Feedback
                </h3>
                <p className="text-xs text-[#6E6863]">
                  Your verified thoughts guide fellow crochet lovers and appear after studio moderation.
                </p>
              </div>

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
                        : '—'}
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

              {itemsAwaitingFeedback.length > 0 && (
                <div className="p-5 rounded-3xl bg-[#FFF8F0] border-2 border-[#EAD5C5] space-y-3">
                  <h4 className="font-heading text-sm font-bold text-[#5B3A29]">
                    Purchased Items Awaiting Your Review ({itemsAwaitingFeedback.length})
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {itemsAwaitingFeedback.map(({ order: ord, item: it }, idx) => (
                      <div
                        key={`${ord.id}-${it.productId}-${idx}`}
                        className="p-3 bg-white rounded-2xl border border-[#EAD5C5] flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={resolveItemImage(it.productId, it.image)}
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
                          className="shrink-0 px-3 py-1.5 rounded-full bg-[#5B3A29] hover:bg-[#43291B] text-white text-xs font-semibold cursor-pointer"
                        >
                          Review
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <h4 className="font-heading text-base font-bold text-[#5B3A29]">
                  Your Submitted Reviews ({userFeedbacks.length})
                </h4>

                {userFeedbacks.length === 0 ? (
                  <div className="text-center py-12 bg-white rounded-3xl border border-[#EAD5C5] p-6 space-y-2">
                    <h4 className="font-heading text-base font-bold text-[#5B3A29]">No reviews shared yet</h4>
                    <p className="text-xs text-[#6E6863]">
                      Once you place an order, you can rate your crochet items right here.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {userFeedbacks.map((fb) => (
                      <div
                        key={fb.id}
                        className="bg-white rounded-3xl border border-[#EAD5C5] p-5 shadow-xs space-y-3"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[#F0DFD1]">
                          <div>
                            <h5 className="font-heading text-sm font-bold text-[#2E2E2E]">{fb.productName}</h5>
                            <span className="text-[11px] text-[#8C7A6B]">
                              {fb.rating}★ • Order #{fb.orderNumber} •{' '}
                              {fb.isApproved === false ? 'Pending Moderation' : 'Published'}
                            </span>
                          </div>
                        </div>
                        {fb.headline && <p className="font-bold text-xs text-[#5B3A29]">"{fb.headline}"</p>}
                        <p className="text-xs text-[#4A4540]">{fb.comment}</p>
                        {fb.artisanResponse && (
                          <div className="p-3 rounded-2xl bg-[#FFF8F0] border-l-4 border-[#5B3A29] text-xs text-[#55504C]">
                            <strong>{fb.artisanResponse.author}:</strong> "{fb.artisanResponse.text}"
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeSubTab === 'wishlist' && (
            <div className="space-y-6">
              <div>
                <h3 className="font-heading text-2xl font-bold text-[#5B3A29]">My Saved Wishlist</h3>
                <p className="text-xs text-[#6E6863]">
                  Handmade crochet pieces you are saving for later or gifting
                </p>
              </div>

              {wishlistedProducts.length === 0 ? (
                <div className="bg-white rounded-3xl border border-[#EAD5C5] p-12 text-center space-y-3">
                  <Heart className="w-10 h-10 text-[#F8D7DA] mx-auto fill-[#F8D7DA]" />
                  <p className="font-heading text-base font-bold text-[#5B3A29]">Your wishlist is empty</p>
                  <button
                    onClick={() => setActiveTab('shop')}
                    className="px-5 py-2.5 rounded-full bg-[#5B3A29] text-white text-xs font-semibold cursor-pointer"
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
                          src={safeImage(prod.images?.[0])}
                          alt={prod.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <h4 className="font-heading text-sm font-bold text-[#2E2E2E] truncate">
                          {prod.name}
                        </h4>
                        <span className="font-price font-bold text-xs text-[#5B3A29]">₹{prod.price}</span>
                      </div>
                      <div className="flex gap-2 pt-2 border-t border-[#F0DFD1]">
                        <button
                          onClick={() => addToCart(prod, 1, 0)}
                          disabled={prod.stock <= 0}
                          className="flex-1 py-1.5 px-3 rounded-xl bg-[#5B3A29] disabled:bg-gray-300 text-white text-xs font-semibold hover:bg-[#43291B] transition flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <ShoppingBag className="w-3.5 h-3.5" />
                          <span>{prod.stock <= 0 ? 'Sold Out' : 'Add to Cart'}</span>
                        </button>
                        <button
                          onClick={() => toggleWishlist(prod.id)}
                          className="p-1.5 rounded-xl border border-gray-200 text-gray-400 hover:text-red-500 cursor-pointer"
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

          {activeSubTab === 'addresses' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <h3 className="font-heading text-2xl font-bold text-[#5B3A29]">Saved Addresses</h3>
                  <p className="text-xs text-[#6E6863]">
                    Manage multiple delivery addresses for quick checkout
                  </p>
                </div>
                <button
                  onClick={() => {
                    setAddressForm(emptyAddressForm(currentUser));
                    setIsAddressFormOpen(true);
                  }}
                  className="px-4 py-2 rounded-full bg-[#5B3A29] text-white text-xs font-semibold flex items-center gap-1.5 hover:bg-[#43291B] transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Address</span>
                </button>
              </div>

              {isAddressFormOpen && (
                <form
                  onSubmit={handleAddressSubmit}
                  className="bg-white rounded-3xl border border-[#EAD5C5] p-6 shadow-xs space-y-4 text-xs"
                >
                  <h4 className="font-heading text-base font-bold text-[#5B3A29]">
                    {addressForm.id ? 'Edit Delivery Address' : 'Add New Delivery Address'}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-[#55504C] mb-1">Address Label</label>
                      <input
                        type="text"
                        value={addressForm.label || 'Home'}
                        onChange={(e) => setAddressForm({ ...addressForm, label: e.target.value })}
                        placeholder="Home / Work / Hostel"
                        className="w-full px-3 py-2 rounded-xl border border-[#EAD5C5] bg-[#FDF9F4]"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-[#55504C] mb-1">Full Name *</label>
                      <input
                        type="text"
                        required
                        value={addressForm.fullName}
                        onChange={(e) => setAddressForm({ ...addressForm, fullName: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-[#EAD5C5] bg-[#FDF9F4]"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-[#55504C] mb-1">Phone (10 digits) *</label>
                      <input
                        type="tel"
                        required
                        value={addressForm.phone}
                        onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-[#EAD5C5] bg-[#FDF9F4]"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-[#55504C] mb-1">6-Digit Pincode *</label>
                      <input
                        type="text"
                        required
                        maxLength={6}
                        value={addressForm.pincode}
                        onChange={(e) => setAddressForm({ ...addressForm, pincode: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-[#EAD5C5] bg-[#FDF9F4]"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block font-semibold text-[#55504C] mb-1">Address Line 1 *</label>
                      <input
                        type="text"
                        required
                        value={addressForm.addressLine1}
                        onChange={(e) => setAddressForm({ ...addressForm, addressLine1: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-[#EAD5C5] bg-[#FDF9F4]"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block font-semibold text-[#55504C] mb-1">Landmark / Line 2</label>
                      <input
                        type="text"
                        value={addressForm.addressLine2 || ''}
                        onChange={(e) => setAddressForm({ ...addressForm, addressLine2: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-[#EAD5C5] bg-[#FDF9F4]"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-[#55504C] mb-1">City *</label>
                      <input
                        type="text"
                        required
                        value={addressForm.city}
                        onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-[#EAD5C5] bg-[#FDF9F4]"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-[#55504C] mb-1">State *</label>
                      <input
                        type="text"
                        required
                        value={addressForm.state}
                        onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-[#EAD5C5] bg-[#FDF9F4]"
                      />
                    </div>
                  </div>
                  <label className="flex items-center gap-2 text-xs text-[#55504C] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(addressForm.isDefault)}
                      onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                    />
                    <span>Set as my default delivery address</span>
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="px-5 py-2.5 rounded-full bg-[#5B3A29] text-white font-semibold cursor-pointer"
                    >
                      Save Address
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsAddressFormOpen(false)}
                      className="px-5 py-2.5 rounded-full border border-[#EAD5C5] text-[#5B3A29] font-semibold cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {savedAddresses.length === 0 ? (
                <div className="bg-white rounded-3xl border border-[#EAD5C5] p-10 text-center space-y-2">
                  <MapPin className="w-8 h-8 text-[#8C7A6B] mx-auto" />
                  <p className="font-heading text-base font-bold text-[#5B3A29]">
                    No saved addresses yet
                  </p>
                  <p className="text-xs text-[#6E6863]">
                    Add your delivery address here or save one automatically during checkout.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {savedAddresses.map((addr) => (
                    <div
                      key={addr.id}
                      className={`bg-white p-5 rounded-3xl shadow-xs space-y-2 ${
                        addr.isDefault ? 'border-2 border-[#5B3A29]' : 'border border-[#EAD5C5]'
                      }`}
                    >
                      <div className="flex justify-between items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full bg-[#FFF8F0] border border-[#EAD5C5] text-[#5B3A29] text-[10px] font-bold uppercase">
                          {addr.label || 'Home'}
                        </span>
                        {addr.isDefault && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-[#4A5D1E] font-bold bg-[#E8F0DC] px-2 py-0.5 rounded-full">
                            <CheckCircle2 className="w-3 h-3" /> Default
                          </span>
                        )}
                      </div>
                      <p className="font-heading text-base font-bold text-[#2E2E2E]">{addr.fullName}</p>
                      <p className="text-xs text-[#6E6863]">
                        {addr.addressLine1}
                        {addr.addressLine2 ? `, ${addr.addressLine2}` : ''}
                        <br />
                        {addr.city}, {addr.state} - {addr.pincode}
                      </p>
                      <p className="text-xs text-[#8C7A6B]">Mobile: {addr.phone}</p>
                      <div className="flex flex-wrap gap-2 pt-2 border-t border-[#F0DFD1] text-[11px]">
                        {!addr.isDefault && addr.id && (
                          <button
                            onClick={() => saveUserAddress({ ...addr, isDefault: true })}
                            className="text-[#708238] font-semibold hover:underline cursor-pointer"
                          >
                            Make Default
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setAddressForm(addr);
                            setIsAddressFormOpen(true);
                          }}
                          className="inline-flex items-center gap-1 text-[#5B3A29] font-semibold hover:underline cursor-pointer"
                        >
                          <Edit3 className="w-3 h-3" /> Edit
                        </button>
                        {addr.id && (
                          <button
                            onClick={() => removeUserAddress(addr.id!)}
                            className="inline-flex items-center gap-1 text-[#842029] font-semibold hover:underline cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" /> Delete
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeSubTab === 'payments' && (
            <div className="space-y-6">
              <div>
                <h3 className="font-heading text-2xl font-bold text-[#5B3A29]">Payment History</h3>
                <p className="text-xs text-[#6E6863]">
                  Razorpay IDs, UPI UTR references, Cash on Delivery records, and payment verification status
                </p>
              </div>

              <div className="bg-white rounded-3xl border border-[#EAD5C5] overflow-x-auto shadow-xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FFF8F0] border-b border-[#EAD5C5] text-[#5B3A29] font-bold">
                    <tr>
                      <th className="p-4">Transaction / Ref</th>
                      <th className="p-4">Order #</th>
                      <th className="p-4">Method</th>
                      <th className="p-4">Amount</th>
                      <th className="p-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F0DFD1]">
                    {userOrders.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-6 text-center text-[#8C7A6B]">
                          No payment records yet.
                        </td>
                      </tr>
                    ) : (
                      userOrders.map((ord) => (
                        <tr key={ord.id} className="hover:bg-[#FDF9F4]">
                          <td className="p-4 font-mono text-[11px] text-[#2E2E2E]">
                            {ord.razorpayPaymentId || ord.utrNumber || (ord.paymentMethod === 'cod' ? 'COD' : 'AWAITING_UTR')}
                          </td>
                          <td className="p-4 font-bold text-[#5B3A29]">{ord.orderNumber}</td>
                          <td className="p-4 uppercase font-semibold text-gray-600">{ord.paymentMethod}</td>
                          <td className="p-4 font-price font-bold text-[#2E2E2E]">₹{ord.total}</td>
                          <td className="p-4">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                                ord.paymentStatus === 'paid'
                                  ? 'bg-[#E8F0DC] text-[#4A5D1E]'
                                  : ord.paymentStatus === 'refunded'
                                  ? 'bg-[#E0F2FE] text-[#0369A1]'
                                  : ord.paymentStatus === 'failed'
                                  ? 'bg-[#FEE2E2] text-[#842029]'
                                  : 'bg-[#FFF3A8] text-[#855D00]'
                              }`}
                            >
                              {ord.paymentStatus}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeSubTab === 'profile' && (
            <div className="bg-white rounded-3xl border border-[#EAD5C5] p-6 sm:p-8 shadow-xs space-y-6">
              <div>
                <h3 className="font-heading text-2xl font-bold text-[#5B3A29]">Account Settings</h3>
                <p className="text-xs text-[#6E6863]">
                  Update your personal profile and communication preferences
                </p>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-4 max-w-md">
                <div>
                  <label className="block text-xs font-semibold text-[#55504C] mb-1">Your Name</label>
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
                  className="px-6 py-2.5 rounded-full bg-[#5B3A29] text-white text-xs font-semibold hover:bg-[#43291B] transition shadow-xs cursor-pointer"
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
