import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import {
  X,
  Trash2,
  ShoppingBag,
  Sparkles,
  ArrowRight,
  Tag,
  Check,
  Truck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const CartDrawer: React.FC = () => {
  const {
    isCartOpen,
    setIsCartOpen,
    cart,
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
    currentUser,
    openAuthModal
  } = useStore();

  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [couponError, setCouponError] = useState('');

  if (!isCartOpen) return null;

  // Shipping calculation
  const isFreeShipping = cartSubtotal >= storeSettings.freeShippingThreshold;
  const shippingFee = cartSubtotal === 0 ? 0 : isFreeShipping ? 0 : storeSettings.standardShippingFee;

  // Coupon discount calculation
  let discountAmount = 0;
  if (activeCoupon) {
    if (activeCoupon.discountPercent > 0) {
      discountAmount = Math.round((cartSubtotal * activeCoupon.discountPercent) / 100);
      if (activeCoupon.maxDiscount) {
        discountAmount = Math.min(discountAmount, activeCoupon.maxDiscount);
      }
    } else if (activeCoupon.code === 'FREESHIP') {
      discountAmount = shippingFee;
    }
  }

  const finalTotal = Math.max(0, cartSubtotal - discountAmount + (activeCoupon?.code === 'FREESHIP' ? 0 : shippingFee));
  const amountNeededForFreeShipping = Math.max(0, storeSettings.freeShippingThreshold - cartSubtotal);
  const progressPercent = Math.min(100, (cartSubtotal / storeSettings.freeShippingThreshold) * 100);

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
    if (!currentUser) {
      openAuthModal('checkout');
    } else {
      setIsCheckoutOpen(true);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-hidden">
        {/* Backdrop */}
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
            {/* Drawer Header */}
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
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Free Shipping Milestone Progress */}
            <div className="px-5 py-3 bg-[#F4EDE5] border-b border-[#EAD5C5]/60">
              <div className="flex items-center justify-between text-xs text-[#5B3A29] mb-1.5 font-medium">
                <div className="flex items-center gap-1.5">
                  <Truck className="w-4 h-4 text-[#708238]" />
                  <span>
                    {isFreeShipping
                      ? '✨ You unlocked FREE 7-Day Shipping!'
                      : `Add ₹${amountNeededForFreeShipping} more for FREE shipping!`}
                  </span>
                </div>
                <span className="font-bold">{Math.round(progressPercent)}%</span>
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
                      Explore our handcrafted rose hair ties, keychains, and flower clips starting at ₹50.
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
                cart.map((item) => (
                  <div
                    key={`${item.product.id}-${item.selectedColor.name}`}
                    className="flex gap-3.5 p-3.5 rounded-2xl bg-white border border-[#EAD5C5] shadow-xs"
                  >
                    <img
                      src={item.product.images[0]}
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
                            className="text-[#9C948D] hover:text-[#C83E4D] p-1 transition"
                            title="Remove"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="flex items-center gap-1.5 text-[11px] text-[#6E6863] mt-0.5">
                          <span
                            className="w-2.5 h-2.5 rounded-full border border-gray-300"
                            style={{ backgroundColor: item.selectedColor.hex }}
                          />
                          <span>{item.selectedColor.name}</span>
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
                            className="px-2 py-0.5 text-xs text-[#5B3A29] hover:bg-[#F8D7DA]/50"
                          >
                            -
                          </button>
                          <span className="px-2 py-0.5 font-price text-xs font-bold text-[#2E2E2E]">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              updateCartQuantity(
                                item.product.id,
                                item.selectedColor.name,
                                item.quantity + 1
                              )
                            }
                            className="px-2 py-0.5 text-xs text-[#5B3A29] hover:bg-[#F8D7DA]/50"
                          >
                            +
                          </button>
                        </div>

                        <span className="font-price font-bold text-sm text-[#5B3A29]">
                          ₹{item.product.price * item.quantity}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Drawer Footer (Summary & Checkout) */}
            {cart.length > 0 && (
              <div className="p-5 bg-[#FFF8F0] border-t border-[#EAD5C5] space-y-4">
                {/* Coupon Code Section */}
                <div>
                  {activeCoupon ? (
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#E8F0DC] border border-[#D5E5BC] text-xs text-[#4A5D1E]">
                      <div className="flex items-center gap-2">
                        <Tag className="w-4 h-4" />
                        <span>
                          Code <strong>{activeCoupon.code}</strong> applied!
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
                      {couponError && (
                        <p className="text-[11px] text-[#842029]">{couponError}</p>
                      )}
                      <div className="flex items-center gap-2 text-[10px] text-[#8C7A6B]">
                        <span>Try:</span>
                        <button
                          type="button"
                          onClick={() => applyCoupon('DREAM10')}
                          className="underline hover:text-[#5B3A29]"
                        >
                          DREAM10
                        </button>
                        <span>•</span>
                        <button
                          type="button"
                          onClick={() => applyCoupon('FREESHIP')}
                          className="underline hover:text-[#5B3A29]"
                        >
                          FREESHIP
                        </button>
                      </div>
                    </form>
                  )}
                </div>

                {/* Price Breakdown */}
                <div className="space-y-2 text-xs text-[#6E6863] pt-2 border-t border-[#EAD5C5]/60">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="font-price font-bold text-[#2E2E2E]">₹{cartSubtotal}</span>
                  </div>

                  {discountAmount > 0 && (
                    <div className="flex justify-between text-[#708238]">
                      <span>Handmade Discount</span>
                      <span className="font-price font-bold">-₹{discountAmount}</span>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <span>Shipping (7-Day Delivery)</span>
                    <span className="font-price font-bold text-[#2E2E2E]">
                      {shippingFee === 0 ? (
                        <span className="text-[#708238]">FREE</span>
                      ) : (
                        `₹${shippingFee}`
                      )}
                    </span>
                  </div>

                  <div className="flex justify-between text-sm font-bold text-[#5B3A29] pt-2 border-t border-[#EAD5C5]">
                    <span>Estimated Total</span>
                    <span className="font-price text-lg">₹{finalTotal}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-2 pt-1">
                  <button
                    id="cart-checkout-btn"
                    onClick={handleProceedToCheckout}
                    className="w-full py-3.5 px-4 rounded-full bg-[#5B3A29] hover:bg-[#43291B] text-white font-semibold text-sm shadow-md transition flex items-center justify-center gap-2"
                  >
                    <span>Proceed to Checkout</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => setIsCartOpen(false)}
                    className="w-full py-2 text-xs text-[#6E6863] hover:text-[#5B3A29] font-medium transition text-center"
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
