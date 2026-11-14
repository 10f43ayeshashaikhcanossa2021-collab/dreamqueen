import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import {
  X,
  Trash2,
  ShoppingBag,
  ArrowRight,
  Tag,
  Truck,
  MessageCircle,
  Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { safeImage } from '../utils/imageHelper';
import { formatDisplayPhone, getQuickCartWhatsAppUrl } from '../utils/whatsappHelper';
import { calculateOrderTotals } from '../utils/pricing';

export const CartDrawer: React.FC = () => {
  const {
    isCartOpen,
    setIsCartOpen,
    cart,
    products,
    removeFromCart,
    updateCartQuantity,
    cartSubtotal,
    cartCount,
    activeCoupon,
    applyCoupon,
    removeCoupon,
    storeSettings,
    setIsCheckoutOpen,
    setActiveTab,
    currentUser
  } = useStore();

  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [couponError, setCouponError] = useState('');

  if (!isCartOpen) return null;

  const pricing = calculateOrderTotals({
    items: cart.map((c) => ({ price: c.product.price, quantity: c.quantity })),
    coupon: activeCoupon,
    settings: storeSettings,
    paymentMethod: 'upi_qr'
  });

  const isFreeShipping = cartSubtotal >= storeSettings.freeShippingThreshold;
  const amountNeededForFreeShipping = Math.max(0, storeSettings.freeShippingThreshold - cartSubtotal);
  const progressPercent =
    storeSettings.freeShippingThreshold > 0
      ? Math.min(100, (cartSubtotal / storeSettings.freeShippingThreshold) * 100)
      : 100;

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError('');
    if (!couponCodeInput.trim()) return;
    const res = applyCoupon(couponCodeInput);
    if (!res.success) {
      setCouponError(res.message);
    } else {
      setCouponCodeInput('');
    }
  };

  const handleProceedToCheckout = () => {
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  };

  const studioDisplayPhone = formatDisplayPhone(storeSettings.supportPhone);

  const quickWhatsAppUrl = getQuickCartWhatsAppUrl(
    cart,
    pricing.subtotal,
    pricing.shippingFee,
    pricing.total,
    currentUser?.name,
    {
      discount: pricing.discount,
      couponCode: activeCoupon?.code,
      paymentMethod: 'upi_qr',
      targetPhone: storeSettings.supportPhone,
      upiId: storeSettings.upiId
    }
  );

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-hidden">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsCartOpen(false)}
          className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
        />

        <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="w-screen max-w-md bg-[#FDF9F4] shadow-2xl border-l border-[#EAD5C5] flex flex-col"
          >
            {/* Header */}
            <div className="p-5 bg-[#FFF8F0] border-b border-[#EAD5C5] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <ShoppingBag className="w-5 h-5 text-[#5B3A29]" />
                <h2 className="font-heading text-xl font-bold text-[#5B3A29]">
                  Your Handmade Basket
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-[#F8D7DA] text-[#842029] text-xs font-bold">
                  {cartCount}
                </span>
              </div>

              <button
                id="close-cart-btn"
                onClick={() => setIsCartOpen(false)}
                className="p-2 rounded-full text-[#6E6863] hover:text-[#2E2E2E] hover:bg-[#F8D7DA]/40 transition"
                aria-label="Close basket"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Free Shipping Progress */}
            <div className="px-5 py-3 bg-[#F4EDE5] border-b border-[#EAD5C5]/60">
              <div className="flex items-center justify-between text-xs text-[#5B3A29] mb-1.5 font-medium">
                <div className="flex items-center gap-1.5">
                  <Truck className="w-4 h-4 text-[#708238]" />
                  <span>
                    {isFreeShipping
                      ? 'You unlocked FREE 7-Day Shipping!'
                      : `Add ₹${amountNeededForFreeShipping} more for FREE shipping`}
                  </span>
                </div>
                <span className="font-bold tabular-nums">{Math.round(progressPercent)}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-white overflow-hidden border border-[#EAD5C5]">
                <div
                  className="h-full bg-[#708238] transition-all duration-500 rounded-full"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
                  <div className="w-16 h-16 rounded-full bg-[#FFF8F0] border border-[#EAD5C5] flex items-center justify-center text-3xl">
                    🧶
                  </div>
                  <div>
                    <h3 className="font-heading text-lg font-bold text-[#5B3A29]">
                      Your basket is empty
                    </h3>
                    <p className="text-xs text-[#6E6863] mt-1 max-w-xs">
                      Explore handcrafted crochet hair clips, keychains, and gift charms starting at ₹20.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setIsCartOpen(false);
                      setActiveTab('shop');
                    }}
                    className="px-6 py-2.5 rounded-full bg-[#5B3A29] text-white text-xs font-semibold hover:bg-[#43291B] transition shadow-sm"
                  >
                    Start Shopping
                  </button>
                </div>
              ) : (
                cart.map((item) => {
                  const latestProduct = products.find((p) => p.id === item.product.id);
                  const maxStock = latestProduct?.stock ?? item.product.stock;
                  const atMaxStock = item.quantity >= maxStock;

                  return (
                    <div
                      key={`${item.product.id}-${item.selectedColor.name}`}
                      className="flex gap-3.5 p-3.5 rounded-2xl bg-white border border-[#EAD5C5] shadow-xs"
                    >
                      <img
                        src={safeImage(item.product.images?.[0])}
                        alt={item.product.name}
                        className="w-20 h-20 rounded-xl object-cover border border-[#EAD5C5] shrink-0"
                      />

                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-heading text-xs sm:text-sm font-bold text-[#2E2E2E] truncate">
                              {item.product.name}
                            </h4>
                            <button
                              onClick={() => removeFromCart(item.product.id, item.selectedColor.name)}
                              className="text-[#6E6863] hover:text-[#C83E4D] p-1 transition"
                              title="Remove"
                              aria-label={`Remove ${item.product.name}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="flex items-center justify-between text-[11px] text-[#6E6863] mt-0.5">
                            <div className="flex items-center gap-1.5">
                              <span
                                className="w-2.5 h-2.5 rounded-full border border-gray-300"
                                style={{ backgroundColor: item.selectedColor.hex }}
                              />
                              <span>{item.selectedColor.name}</span>
                            </div>
                            {maxStock <= 5 && (
                              <span className="text-[10px] font-semibold text-[#855D00]">
                                {maxStock} left
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between mt-2 pt-1 border-t border-[#F0DFD1]">
                          <div className="flex items-center border border-[#EAD5C5] rounded-lg bg-[#FFF8F0] overflow-hidden">
                            <button
                              onClick={() =>
                                updateCartQuantity(
                                  item.product.id,
                                  item.selectedColor.name,
                                  item.quantity - 1
                                )
                              }
                              className="px-2.5 py-0.5 text-xs text-[#5B3A29] hover:bg-[#F8D7DA]/50"
                              aria-label="Decrease quantity"
                            >
                              -
                            </button>
                            <span className="px-2.5 py-0.5 font-price text-xs font-bold text-[#2E2E2E] tabular-nums">
                              {item.quantity}
                            </span>
                            <button
                              disabled={atMaxStock}
                              onClick={() =>
                                updateCartQuantity(
                                  item.product.id,
                                  item.selectedColor.name,
                                  item.quantity + 1
                                )
                              }
                              className="px-2.5 py-0.5 text-xs text-[#5B3A29] hover:bg-[#F8D7DA]/50 disabled:opacity-40 disabled:cursor-not-allowed"
                              aria-label="Increase quantity"
                            >
                              +
                            </button>
                          </div>

                          <span className="font-price font-bold text-sm text-[#5B3A29] tabular-nums">
                            ₹{item.product.price * item.quantity}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            {cart.length > 0 && (
              <div className="p-5 bg-[#FFF8F0] border-t border-[#EAD5C5] space-y-4">
                {/* Coupon Code */}
                <div>
                  {activeCoupon ? (
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#E8F0DC] border border-[#D5E5BC] text-xs text-[#4A5D1E]">
                      <div className="flex items-center gap-2">
                        <Tag className="w-4 h-4" />
                        <span>
                          Code <strong>{activeCoupon.code}</strong> applied
                        </span>
                      </div>
                      <button
                        onClick={removeCoupon}
                        className="text-xs font-semibold hover:underline text-[#842029]"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleApplyCoupon} className="space-y-1">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Coupon code (e.g. DREAM10)"
                          value={couponCodeInput}
                          onChange={(e) => setCouponCodeInput(e.target.value.toUpperCase())}
                          className="flex-1 px-3 py-2 text-xs rounded-xl bg-white border border-[#EAD5C5] uppercase placeholder:normal-case focus:outline-none focus:ring-1 focus:ring-[#5B3A29]"
                        />
                        <button
                          type="submit"
                          className="px-4 py-2 bg-[#5B3A29] text-white text-xs font-semibold rounded-xl hover:bg-[#43291B] transition"
                        >
                          Apply
                        </button>
                      </div>
                      {couponError && <p className="text-[11px] text-[#842029]">{couponError}</p>}
                      <div className="flex items-center gap-2 text-[10px] text-[#6E6863]">
                        <span>Quick codes:</span>
                        <button
                          type="button"
                          onClick={() => {
                            const res = applyCoupon('DREAM10');
                            if (!res.success) setCouponError(res.message);
                          }}
                          className="underline hover:text-[#5B3A29]"
                        >
                          DREAM10
                        </button>
                        <span>•</span>
                        <button
                          type="button"
                          onClick={() => {
                            const res = applyCoupon('FREESHIP');
                            if (!res.success) setCouponError(res.message);
                          }}
                          className="underline hover:text-[#5B3A29]"
                        >
                          FREESHIP
                        </button>
                      </div>
                    </form>
                  )}
                </div>

                {/* Price Breakdown */}
                <div className="space-y-1.5 text-xs text-[#6E6863] pt-2 border-t border-[#EAD5C5]/60">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="font-price font-bold text-[#2E2E2E] tabular-nums">
                      ₹{pricing.subtotal}
                    </span>
                  </div>

                  {pricing.discount > 0 && (
                    <div className="flex justify-between text-[#4A5D1E]">
                      <span>Coupon Discount</span>
                      <span className="font-price font-bold tabular-nums">-₹{pricing.discount}</span>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <span>Shipping (7-Day Delivery)</span>
                    <span className="font-price font-bold text-[#2E2E2E] tabular-nums">
                      {pricing.shippingFee === 0 ? (
                        <span className="text-[#4A5D1E]">FREE</span>
                      ) : (
                        `₹${pricing.shippingFee}`
                      )}
                    </span>
                  </div>

                  <div className="flex justify-between text-sm font-bold text-[#5B3A29] pt-2 border-t border-[#EAD5C5]">
                    <span>Estimated Total</span>
                    <span className="font-price text-lg tabular-nums">₹{pricing.total}</span>
                  </div>
                </div>

                {/* Checkout + WhatsApp */}
                <div className="space-y-2 pt-1">
                  <button
                    id="cart-checkout-btn"
                    onClick={handleProceedToCheckout}
                    className="w-full py-3.5 px-4 rounded-full bg-[#5B3A29] hover:bg-[#43291B] text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Lock className="w-4 h-4" />
                    <span>Proceed to Checkout • ₹{pricing.total}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <a
                    href={quickWhatsAppUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 px-4 rounded-full bg-[#E8F5E9] hover:bg-[#D6EED8] text-[#1E7E34] border border-[#C8E6C9] text-xs font-semibold transition flex items-center justify-center gap-1.5"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Order on WhatsApp (+91 {studioDisplayPhone})</span>
                  </a>

                  <button
                    onClick={() => setIsCartOpen(false)}
                    className="w-full py-1.5 text-xs text-[#6E6863] hover:text-[#5B3A29] font-medium transition text-center"
                  >
                    Continue Shopping
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
};
