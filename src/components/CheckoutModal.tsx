import React, { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { PaymentMethod, ShippingAddress } from '../types';
import {
  X,
  ShieldCheck,
  CreditCard,
  Banknote,
  CheckCircle2,
  ArrowRight,
  Truck,
  Sparkles,
  Lock,
  Smartphone,
  Building,
  Check,
  QrCode
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { UpiQrCard } from './UpiQrCard';

export const CheckoutModal: React.FC = () => {
  const {
    isCheckoutOpen,
    setIsCheckoutOpen,
    cart,
    cartSubtotal,
    activeCoupon,
    storeSettings,
    createOrder,
    currentUser,
    setActiveTab,
    setTrackingSearchId,
    showToast
  } = useStore();

  const [step, setStep] = useState<1 | 2 | 3 | 'success'>(1);
  const [createdOrderNumber, setCreatedOrderNumber] = useState<string>('');

  // Step 1: Address Form
  const [address, setAddress] = useState<ShippingAddress>({
    fullName: currentUser?.name || '',
    phone: currentUser?.phone || '',
    email: currentUser?.email || '',
    address: currentUser?.savedAddresses?.[0]?.address || '',
    city: currentUser?.savedAddresses?.[0]?.city || '',
    state: currentUser?.savedAddresses?.[0]?.state || 'Maharashtra',
    pincode: currentUser?.savedAddresses?.[0]?.pincode || ''
  });

  // Sync address with currentUser whenever modal opens or user logs in
  useEffect(() => {
    if (currentUser) {
      setAddress((prev) => ({
        fullName: currentUser.name || prev.fullName || '',
        phone: currentUser.phone || prev.phone || '',
        email: currentUser.email || prev.email || '',
        address: currentUser.savedAddresses?.[0]?.address || prev.address || '',
        city: currentUser.savedAddresses?.[0]?.city || prev.city || '',
        state: currentUser.savedAddresses?.[0]?.state || prev.state || 'Maharashtra',
        pincode: currentUser.savedAddresses?.[0]?.pincode || prev.pincode || ''
      }));
    }
  }, [currentUser, isCheckoutOpen]);

  // Step 2: Payment
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('upi_qr');
  const [upiTransactionRef, setUpiTransactionRef] = useState('');
  const [razorpaySubMethod, setRazorpaySubMethod] = useState<'upi' | 'card' | 'netbanking'>('upi');
  const [upiApp, setUpiApp] = useState<'gpay' | 'phonepe' | 'paytm' | 'other'>('gpay');
  const [upiId, setUpiId] = useState('');
  const [cardDetails, setCardDetails] = useState({
    number: '•••• •••• •••• 4242',
    name: currentUser?.name || 'Cardholder',
    expiry: '08/29',
    cvv: '•••'
  });
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  if (!isCheckoutOpen) return null;
  if (!currentUser) return null;

  // Calculation
  const isFreeShipping = cartSubtotal >= storeSettings.freeShippingThreshold;
  const shippingFee = isFreeShipping ? 0 : storeSettings.standardShippingFee;

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

  const codFee = paymentMethod === 'cod' && storeSettings.codEnabled ? storeSettings.codFee : 0;
  const finalTotal = Math.max(0, cartSubtotal - discountAmount + shippingFee + codFee);

  const handlePlaceOrder = () => {
    setIsProcessingPayment(true);

    setTimeout(() => {
      setIsProcessingPayment(false);

      const randomPayId = `pay_rzp_${Math.random().toString(36).substring(2, 10)}`;
      const randomOrderId = `order_rzp_${Math.random().toString(36).substring(2, 10)}`;

      const isPaid = paymentMethod === 'razorpay' || paymentMethod === 'upi_qr';

      const order = createOrder({
        customer: {
          name: address.fullName,
          email: address.email,
          phone: address.phone
        },
        shippingAddress: address,
        items: cart.map((item) => ({
          productId: item.product.id,
          productName: item.product.name,
          image: item.product.images[0],
          price: item.product.price,
          quantity: item.quantity,
          color: item.selectedColor
        })),
        subtotal: cartSubtotal,
        discount: discountAmount,
        couponCode: activeCoupon?.code,
        shippingFee,
        codFee,
        total: finalTotal,
        paymentMethod,
        paymentStatus: isPaid ? 'paid' : 'pending',
        razorpayPaymentId: paymentMethod === 'razorpay' ? randomPayId : undefined,
        razorpayOrderId: paymentMethod === 'razorpay' ? randomOrderId : undefined,
        upiTransactionRef: paymentMethod === 'upi_qr' ? (upiTransactionRef || 'UPI_SCAN_DIRECT') : undefined,
        trackingStatus: 'preparing',
        shiprocketTrackingNumber: `SR-IND-${Math.floor(10000000 + Math.random() * 90000000)}`,
        estimatedDeliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString(
          'en-IN',
          { day: 'numeric', month: 'short', year: 'numeric' }
        ),
        notes: 'Handcrafted with extra love by DreamQueen studio.'
      });

      setCreatedOrderNumber(order.orderNumber);
      setStep('success');

      // Trigger celebratory confetti
      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (e) {
        // fallback
      }

      showToast(`Order ${order.orderNumber} confirmed! Notification sent via WhatsApp & Email ✨`);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-black/50 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative bg-[#FDF9F4] w-full max-w-3xl rounded-3xl shadow-2xl border border-[#EAD5C5] overflow-hidden my-auto max-h-[95vh] flex flex-col"
      >
        {/* Header */}
        <div className="p-5 sm:p-6 bg-[#FFF8F0] border-b border-[#EAD5C5] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#F8D7DA] flex items-center justify-center text-lg">
              🌸
            </div>
            <div>
              <h2 className="font-heading text-xl font-bold text-[#5B3A29]">
                DreamQueen Checkout
              </h2>
              <span className="text-xs text-[#708238] font-medium">
                100% Secure • Delivered in 7 Days
              </span>
            </div>
          </div>

          {step !== 'success' && (
            <button
              onClick={() => setIsCheckoutOpen(false)}
              className="p-2 rounded-full text-[#6E6863] hover:text-[#2E2E2E] hover:bg-[#F8D7DA]/40 transition"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Checkout Steps Tracker (when not on success screen) */}
        {step !== 'success' && (
          <div className="px-6 py-3 bg-[#F8EFE7] border-b border-[#EAD5C5]/60 flex items-center justify-between text-xs font-semibold">
            <div
              className={`flex items-center gap-1.5 cursor-pointer ${
                step >= 1 ? 'text-[#5B3A29]' : 'text-gray-400'
              }`}
              onClick={() => setStep(1)}
            >
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                  step >= 1 ? 'bg-[#5B3A29] text-white' : 'bg-gray-200 text-gray-500'
                }`}
              >
                1
              </span>
              <span>Shipping Address</span>
            </div>

            <span className="text-gray-300">———</span>

            <div
              className={`flex items-center gap-1.5 cursor-pointer ${
                step >= 2 ? 'text-[#5B3A29]' : 'text-gray-400'
              }`}
              onClick={() => {
                if (address.fullName && address.address && address.pincode) setStep(2);
              }}
            >
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                  step >= 2 ? 'bg-[#5B3A29] text-white' : 'bg-gray-200 text-gray-500'
                }`}
              >
                2
              </span>
              <span>Payment (Razorpay / COD)</span>
            </div>

            <span className="text-gray-300">———</span>

            <div
              className={`flex items-center gap-1.5 cursor-pointer ${
                step === 3 ? 'text-[#5B3A29]' : 'text-gray-400'
              }`}
              onClick={() => {
                if (address.fullName && address.address && address.pincode) setStep(3);
              }}
            >
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                  step === 3 ? 'bg-[#5B3A29] text-white' : 'bg-gray-200 text-gray-500'
                }`}
              >
                3
              </span>
              <span>Order Summary</span>
            </div>
          </div>
        )}

        {/* Content Body */}
        <div className="overflow-y-auto flex-1 p-6 sm:p-8">
          {/* STEP 1: Shipping Address */}
          {step === 1 && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="font-heading text-lg font-bold text-[#5B3A29]">
                  Where should we send your crochet treasures?
                </h3>
                <span className="text-xs text-[#708238]">All India 7-Day Shipping</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#55504C] mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={address.fullName}
                    onChange={(e) => setAddress({ ...address, fullName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#EAD5C5] bg-white text-xs focus:outline-none focus:ring-1 focus:ring-[#5B3A29]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#55504C] mb-1">
                    Mobile Number (for WhatsApp delivery updates) *
                  </label>
                  <input
                    type="text"
                    required
                    value={address.phone}
                    onChange={(e) => setAddress({ ...address, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#EAD5C5] bg-white text-xs focus:outline-none focus:ring-1 focus:ring-[#5B3A29]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-[#55504C] mb-1">
                    Email Address (for invoice & tracking receipt) *
                  </label>
                  <input
                    type="email"
                    required
                    value={address.email}
                    onChange={(e) => setAddress({ ...address, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#EAD5C5] bg-white text-xs focus:outline-none focus:ring-1 focus:ring-[#5B3A29]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-[#55504C] mb-1">
                    Street Address / Flat / Building *
                  </label>
                  <input
                    type="text"
                    required
                    value={address.address}
                    onChange={(e) => setAddress({ ...address, address: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#EAD5C5] bg-white text-xs focus:outline-none focus:ring-1 focus:ring-[#5B3A29]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#55504C] mb-1">
                    City *
                  </label>
                  <input
                    type="text"
                    required
                    value={address.city}
                    onChange={(e) => setAddress({ ...address, city: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#EAD5C5] bg-white text-xs focus:outline-none focus:ring-1 focus:ring-[#5B3A29]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-[#55504C] mb-1">
                      State *
                    </label>
                    <input
                      type="text"
                      required
                      value={address.state}
                      onChange={(e) => setAddress({ ...address, state: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#EAD5C5] bg-white text-xs focus:outline-none focus:ring-1 focus:ring-[#5B3A29]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#55504C] mb-1">
                      Pincode *
                    </label>
                    <input
                      type="text"
                      required
                      value={address.pincode}
                      onChange={(e) => setAddress({ ...address, pincode: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#EAD5C5] bg-white text-xs focus:outline-none focus:ring-1 focus:ring-[#5B3A29]"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    if (!address.fullName || !address.address || !address.phone || !address.pincode) {
                      showToast('Please fill all mandatory shipping address fields', 'error');
                      return;
                    }
                    setStep(2);
                  }}
                  className="px-6 py-3 rounded-full bg-[#5B3A29] text-white text-xs font-semibold hover:bg-[#43291B] transition flex items-center gap-2 shadow-sm"
                >
                  <span>Continue to Payment</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Payment Method */}
          {step === 2 && (
            <div className="space-y-6">
              <h3 className="font-heading text-lg font-bold text-[#5B3A29]">
                Select Payment Method
              </h3>

              {/* Option 1: India Post Payments Bank / UPI QR Scanner */}
              <div
                onClick={() => setPaymentMethod('upi_qr')}
                className={`p-4 sm:p-5 rounded-2xl border-2 transition cursor-pointer ${
                  paymentMethod === 'upi_qr'
                    ? 'border-[#5B3A29] bg-[#FFF8F0]'
                    : 'border-[#EAD5C5] bg-white hover:bg-[#FFF8F0]/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full border-2 border-[#5B3A29] flex items-center justify-center p-0.5">
                      {paymentMethod === 'upi_qr' && (
                        <div className="w-full h-full rounded-full bg-[#5B3A29]" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-[#2E2E2E]">
                          Scan to Pay (India Post / UPI QR Scanner)
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-[#708238] text-white font-semibold text-[10px]">
                          INSTANT & ZERO FEE
                        </span>
                      </div>
                      <p className="text-xs text-[#6E6863] mt-0.5">
                        Scan the official studio QR code using GPay, PhonePe, Paytm or PostBank
                      </p>
                    </div>
                  </div>
                  <QrCode className="w-5 h-5 text-[#5B3A29]" />
                </div>

                {/* Expanded Official QR Scanner Card */}
                {paymentMethod === 'upi_qr' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-4 pt-4 border-t border-[#EAD5C5] space-y-4"
                  >
                    <div className="p-2 sm:p-4 bg-[#FDF9F4] rounded-2xl border border-[#EAD5C5]/70">
                      <UpiQrCard amount={finalTotal} showActions={true} />
                    </div>

                    <div className="p-3.5 bg-white rounded-xl border border-[#EAD5C5] space-y-2">
                      <label className="text-xs font-bold text-[#5B3A29] block">
                        UPI Transaction / UTR / Reference ID (Optional or last 4 digits)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 429184029103 or UPI Ref No."
                        value={upiTransactionRef}
                        onChange={(e) => setUpiTransactionRef(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-[#EAD5C5] text-xs font-mono focus:outline-none focus:border-[#5B3A29]"
                      />
                      <p className="text-[11px] text-[#708238] flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" />
                        <span>
                          Scan with your app and click "Place Order". Our team will match and prepare your handmade parcel right away!
                        </span>
                      </p>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Option 2: Razorpay */}
              <div
                onClick={() => setPaymentMethod('razorpay')}
                className={`p-4 sm:p-5 rounded-2xl border-2 transition cursor-pointer ${
                  paymentMethod === 'razorpay'
                    ? 'border-[#5B3A29] bg-[#FFF8F0]'
                    : 'border-[#EAD5C5] bg-white hover:bg-[#FFF8F0]/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full border-2 border-[#5B3A29] flex items-center justify-center p-0.5">
                      {paymentMethod === 'razorpay' && (
                        <div className="w-full h-full rounded-full bg-[#5B3A29]" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-[#2E2E2E]">
                          Razorpay Secure Payment
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-[#0C2340] text-white font-semibold text-[10px]">
                          RAZORPAY
                        </span>
                      </div>
                      <p className="text-xs text-[#6E6863] mt-0.5">
                        UPI, Google Pay, PhonePe, Paytm, Cards & Net Banking
                      </p>
                    </div>
                  </div>
                  <ShieldCheck className="w-5 h-5 text-[#708238]" />
                </div>

                {/* Expanded Razorpay Simulated Sub-Options */}
                {paymentMethod === 'razorpay' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-4 pt-4 border-t border-[#EAD5C5] space-y-3"
                  >
                    <div className="flex gap-2">
                      {[
                        { id: 'upi', label: 'UPI / QR', icon: Smartphone },
                        { id: 'card', label: 'Cards', icon: CreditCard },
                        { id: 'netbanking', label: 'Net Banking', icon: Building }
                      ].map((sub) => {
                        const Icon = sub.icon;
                        return (
                          <button
                            key={sub.id}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setRazorpaySubMethod(sub.id as any);
                            }}
                            className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                              razorpaySubMethod === sub.id
                                ? 'bg-[#5B3A29] text-white shadow-xs'
                                : 'bg-white border border-[#EAD5C5] text-[#5B3A29]'
                            }`}
                          >
                            <Icon className="w-3.5 h-3.5" />
                            <span>{sub.label}</span>
                          </button>
                        );
                      })}
                    </div>

                    {razorpaySubMethod === 'upi' && (
                      <div className="p-3 bg-white rounded-xl border border-[#EAD5C5] space-y-2">
                        <span className="text-[11px] font-semibold text-[#5B3A29] block">
                          Instant App Launch or UPI ID:
                        </span>
                        <div className="flex gap-2">
                          {['gpay', 'phonepe', 'paytm'].map((app) => (
                            <button
                              key={app}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setUpiApp(app as any);
                              }}
                              className={`flex-1 py-1.5 px-2 rounded-lg border text-xs font-bold uppercase transition ${
                                upiApp === app
                                  ? 'border-[#5B3A29] bg-[#F8D7DA]/40 text-[#5B3A29]'
                                  : 'border-gray-200 text-gray-600'
                              }`}
                            >
                              {app}
                            </button>
                          ))}
                        </div>
                        <p className="text-[10px] text-[#708238]">
                          ✓ Instant payment verification via Razorpay Gateway
                        </p>
                      </div>
                    )}

                    {razorpaySubMethod === 'card' && (
                      <div className="p-3 bg-white rounded-xl border border-[#EAD5C5] space-y-2 text-xs">
                        <div>
                          <label className="text-[10px] font-semibold text-[#8C7A6B]">
                            Card Number (Demo Sandbox)
                          </label>
                          <input
                            type="text"
                            readOnly
                            value={cardDetails.number}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 bg-gray-50 text-xs font-mono"
                          />
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </div>

              {/* Option 2: Cash on Delivery */}
              <div
                onClick={() => {
                  if (storeSettings.codEnabled) setPaymentMethod('cod');
                }}
                className={`p-4 sm:p-5 rounded-2xl border-2 transition ${
                  !storeSettings.codEnabled
                    ? 'opacity-60 cursor-not-allowed bg-gray-100 border-gray-200'
                    : paymentMethod === 'cod'
                    ? 'border-[#5B3A29] bg-[#FFF8F0] cursor-pointer'
                    : 'border-[#EAD5C5] bg-white hover:bg-[#FFF8F0]/50 cursor-pointer'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full border-2 border-[#5B3A29] flex items-center justify-center p-0.5">
                      {paymentMethod === 'cod' && (
                        <div className="w-full h-full rounded-full bg-[#5B3A29]" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-[#2E2E2E]">
                          Cash on Delivery (COD)
                        </span>
                        {storeSettings.codFee > 0 && (
                          <span className="px-2 py-0.5 rounded-md bg-[#FFF3A8] text-[#855D00] font-semibold text-[10px]">
                            +₹{storeSettings.codFee} COD Fee
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#6E6863] mt-0.5">
                        Pay with cash or UPI QR upon receiving your parcel
                      </p>
                    </div>
                  </div>
                  <Banknote className="w-5 h-5 text-[#5B3A29]" />
                </div>
              </div>

              {/* Navigation buttons */}
              <div className="pt-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-xs font-semibold text-[#6E6863] hover:text-[#5B3A29]"
                >
                  ← Back to Address
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="px-6 py-3 rounded-full bg-[#5B3A29] text-white text-xs font-semibold hover:bg-[#43291B] transition flex items-center gap-2 shadow-sm"
                >
                  <span>Review Order Summary</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Order Summary & Place Order */}
          {step === 3 && (
            <div className="space-y-6">
              <h3 className="font-heading text-lg font-bold text-[#5B3A29]">
                Review Your Order
              </h3>

              {/* Shipping Address Summary Card */}
              <div className="p-4 rounded-2xl bg-white border border-[#EAD5C5] text-xs">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-[#5B3A29]">Delivering to:</span>
                  <button
                    onClick={() => setStep(1)}
                    className="text-[#708238] font-semibold hover:underline"
                  >
                    Edit
                  </button>
                </div>
                <p className="font-medium text-[#2E2E2E]">{address.fullName} ({address.phone})</p>
                <p className="text-[#6E6863]">{address.address}, {address.city}, {address.state} - {address.pincode}</p>
                <p className="text-[#8C7A6B] mt-0.5 font-light">Estimated Delivery: within 7 Days</p>
              </div>

              {/* Payment Summary Card */}
              <div className="p-4 rounded-2xl bg-white border border-[#EAD5C5] text-xs flex justify-between items-center">
                <div>
                  <span className="font-bold text-[#5B3A29] block">Payment Method:</span>
                  <span className="text-[#2E2E2E]">
                    {paymentMethod === 'upi_qr'
                      ? 'India Post Bank / UPI QR Scanner (Ayesha Shaikh)'
                      : paymentMethod === 'razorpay'
                      ? 'Razorpay (Instant UPI / Cards)'
                      : 'Cash on Delivery (COD)'}
                  </span>
                  {paymentMethod === 'upi_qr' && upiTransactionRef && (
                    <span className="text-[11px] text-[#708238] block mt-0.5">
                      Ref: {upiTransactionRef}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setStep(2)}
                  className="text-[#708238] font-semibold hover:underline"
                >
                  Change
                </button>
              </div>

              {/* Items List */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-[#5B3A29]">Items ({cart.length})</span>
                <div className="max-h-40 overflow-y-auto space-y-2 pr-1">
                  {cart.map((item) => (
                    <div
                      key={`${item.product.id}-${item.selectedColor.name}`}
                      className="flex items-center gap-3 p-2 rounded-xl bg-white border border-[#EAD5C5]"
                    >
                      <img
                        src={item.product.images[0]}
                        alt={item.product.name}
                        className="w-10 h-10 rounded-lg object-cover"
                      />
                      <div className="flex-1 min-w-0 text-xs">
                        <p className="font-bold text-[#2E2E2E] truncate">{item.product.name}</p>
                        <p className="text-[11px] text-[#8C7A6B]">
                          Color: {item.selectedColor.name} • Qty: {item.quantity}
                        </p>
                      </div>
                      <span className="font-price font-bold text-xs text-[#5B3A29]">
                        ₹{item.product.price * item.quantity}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Financial Breakdown */}
              <div className="p-4 rounded-2xl bg-[#FFF8F0] border border-[#EAD5C5] space-y-2 text-xs">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-price font-bold text-[#2E2E2E]">₹{cartSubtotal}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-[#708238]">
                    <span>Discount ({activeCoupon?.code})</span>
                    <span className="font-price font-bold">-₹{discountAmount}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Shipping Fee</span>
                  <span className="font-price font-bold text-[#2E2E2E]">
                    {shippingFee === 0 ? <span className="text-[#708238]">FREE</span> : `₹${shippingFee}`}
                  </span>
                </div>
                {codFee > 0 && (
                  <div className="flex justify-between">
                    <span>Cash on Delivery Handling Fee</span>
                    <span className="font-price font-bold text-[#2E2E2E]">₹{codFee}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-bold text-[#5B3A29] pt-2 border-t border-[#EAD5C5]">
                  <span>Total Amount Payable</span>
                  <span className="font-price text-lg">₹{finalTotal}</span>
                </div>
              </div>

              {/* Place Order Button */}
              <div className="pt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="text-xs font-semibold text-[#6E6863] hover:text-[#5B3A29]"
                >
                  ← Back to Payment
                </button>

                <button
                  id="place-order-submit-btn"
                  type="button"
                  disabled={isProcessingPayment}
                  onClick={handlePlaceOrder}
                  className="px-8 py-3.5 rounded-full bg-[#5B3A29] hover:bg-[#43291B] text-white text-xs sm:text-sm font-semibold shadow-md transition flex items-center gap-2 disabled:opacity-50"
                >
                  {isProcessingPayment ? (
                    <span>
                      {paymentMethod === 'upi_qr'
                        ? 'Confirming UPI Payment...'
                        : paymentMethod === 'razorpay'
                        ? 'Processing Payment via Razorpay...'
                        : 'Confirming Order...'}
                    </span>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>Place Order • ₹{finalTotal}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* STEP: Success / Confirmation */}
          {step === 'success' && (
            <div className="text-center py-6 space-y-5">
              <div className="w-16 h-16 rounded-full bg-[#E8F0DC] text-[#4A5D1E] flex items-center justify-center mx-auto border-2 border-[#D5E5BC]">
                <Check className="w-8 h-8 stroke-[3]" />
              </div>

              <div>
                <span className="text-xs font-handwriting text-2xl text-[#708238] block font-bold">
                  Handmade with Love
                </span>
                <h3 className="font-heading text-2xl sm:text-3xl font-bold text-[#5B3A29]">
                  Thank You for Your Order!
                </h3>
                <p className="text-xs sm:text-sm text-[#6E6863] mt-1 max-w-md mx-auto">
                  Your order <strong>{createdOrderNumber}</strong> has been received. Our artisans have begun spinning the yarn!
                </p>
              </div>

              {/* Notification Badges */}
              <div className="p-4 rounded-2xl bg-[#FFF8F0] border border-[#EAD5C5] text-xs text-left max-w-md mx-auto space-y-2">
                <div className="flex items-center gap-2 text-[#708238] font-semibold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>WhatsApp & Email Confirmation Dispatched</span>
                </div>
                <p className="text-[#6E6863] text-[11px]">
                  Updates will be sent at each stage: Preparing → Packed → Shipped (Shiprocket) → Delivered.
                </p>
                <div className="pt-2 border-t border-[#EAD5C5] flex justify-between text-[11px]">
                  <span className="text-[#8C7A6B]">Estimated Delivery Date:</span>
                  <strong className="text-[#5B3A29]">Within 7 Days</strong>
                </div>
              </div>

              <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  id="track-new-order-btn"
                  onClick={() => {
                    setTrackingSearchId(createdOrderNumber);
                    setIsCheckoutOpen(false);
                    setActiveTab('track');
                  }}
                  className="w-full sm:w-auto px-6 py-3 rounded-full bg-[#5B3A29] text-white text-xs font-semibold hover:bg-[#43291B] transition shadow-sm"
                >
                  Track Order Timeline ({createdOrderNumber})
                </button>

                <button
                  onClick={() => {
                    setIsCheckoutOpen(false);
                    setActiveTab('shop');
                  }}
                  className="w-full sm:w-auto px-6 py-3 rounded-full bg-[#F8D7DA] text-[#5B3A29] text-xs font-semibold hover:bg-[#F2BAC0] transition"
                >
                  Continue Browsing
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
