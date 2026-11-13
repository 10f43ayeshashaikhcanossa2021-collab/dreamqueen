import React, { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import type { Order, PaymentMethod, ShippingAddress } from '../types';
import {
  X,
  ShieldCheck,
  Banknote,
  CheckCircle2,
  ArrowRight,
  Lock,
  Check,
  QrCode,
  MessageCircle,
  Download,
  MapPin,
  AlertTriangle
} from 'lucide-react';
import { motion } from 'motion/react';
import confetti from 'canvas-confetti';
import { UpiQrCard } from './UpiQrCard';
import { safeImage } from '../utils/imageHelper';
import { getWhatsAppOrderUrl } from '../utils/whatsappHelper';
import {
  calculateOrderTotals,
  isValidEmail,
  isValidIndianPhone,
  isValidIndianPincode,
  normalizeIndianPhone
} from '../utils/pricing';
import { downloadOrderInvoicePdf } from '../utils/invoiceGenerator';
import { getAccessToken } from '../lib/supabase';

declare global {
  interface Window {
    Razorpay?: any;
  }
}

function loadRazorpayCheckoutScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const existing = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
    if (existing) {
      existing.addEventListener('load', () => resolve(Boolean(window.Razorpay)));
      existing.addEventListener('error', () => resolve(false));
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(Boolean(window.Razorpay));
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export const CheckoutModal: React.FC = () => {
  const {
    isCheckoutOpen,
    setIsCheckoutOpen,
    cart,
    activeCoupon,
    storeSettings,
    placeServerOrder,
    refreshOrderAfterGateway,
    submitUpiUtr,
    currentUser,
    saveUserAddress,
    setActiveTab,
    showToast
  } = useStore();

  const [step, setStep] = useState<1 | 2 | 3 | 'success'>(1);
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);
  const [createdWhatsAppUrl, setCreatedWhatsAppUrl] = useState<string>('');
  const [orderNotes, setOrderNotes] = useState<string>('');
  const [saveAddressToProfile, setSaveAddressToProfile] = useState<boolean>(true);
  const [validationError, setValidationError] = useState<string>('');
  const [idempotencyKey, setIdempotencyKey] = useState<string>(() => `idem-${Date.now()}`);

  // Gateway capability check
  const [razorpayConfigured, setRazorpayConfigured] = useState<boolean>(false);

  // Step 1: Address Form
  const [address, setAddress] = useState<ShippingAddress>({
    fullName: '',
    phone: '',
    email: '',
    address: '',
    addressLine2: '',
    city: '',
    state: 'Maharashtra',
    pincode: ''
  });

  // Step 2: Payment
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('upi_qr');
  const [isProcessingOrder, setIsProcessingOrder] = useState(false);

  // Step 4: Post-order UTR submission
  const [utrInput, setUtrInput] = useState('');
  const [utrSubmitting, setUtrSubmitting] = useState(false);
  const [utrSubmitted, setUtrSubmitted] = useState(false);

  useEffect(() => {
    if (!isCheckoutOpen) return;
    setStep(1);
    setCreatedOrder(null);
    setUtrInput('');
    setUtrSubmitted(false);
    setValidationError('');
    setIdempotencyKey(`idem-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`);

    fetch('/api/payments/config')
      .then((r) => r.json())
      .then((cfg) => {
        setRazorpayConfigured(Boolean(cfg?.razorpayConfigured));
      })
      .catch(() => setRazorpayConfigured(false));

    if (currentUser) {
      const defAddr =
        currentUser.savedAddresses?.find((a) => a.isDefault) || currentUser.savedAddresses?.[0];
      setAddress((prev) => ({
        fullName: defAddr?.fullName || currentUser.name || prev.fullName,
        phone: defAddr?.phone || currentUser.phone || prev.phone,
        email: defAddr?.email || currentUser.email || prev.email,
        address: defAddr?.address || defAddr?.addressLine1 || prev.address,
        addressLine2: defAddr?.addressLine2 || prev.addressLine2 || '',
        city: defAddr?.city || prev.city,
        state: defAddr?.state || prev.state || 'Maharashtra',
        pincode: defAddr?.pincode || prev.pincode
      }));
    }
  }, [isCheckoutOpen, currentUser]);

  if (!isCheckoutOpen) return null;

  const pricing = calculateOrderTotals({
    items: cart.map((c) => ({ price: c.product.price, quantity: c.quantity })),
    coupon: activeCoupon,
    settings: storeSettings,
    paymentMethod
  });

  const validateAddressStep = (): string | null => {
    if (!address.fullName.trim()) return 'Please enter your full name.';
    if (!isValidIndianPhone(address.phone)) return 'Please enter a valid 10-digit mobile number.';
    if (!isValidEmail(address.email)) return 'Please enter a valid email address.';
    if (!(address.address || '').trim()) return 'Please enter your street / flat / building address.';
    if (!address.city.trim()) return 'Please enter your city.';
    if (!address.state.trim()) return 'Please enter your state.';
    if (!isValidIndianPincode(address.pincode)) return 'Please enter a valid 6-digit Indian pincode.';
    return null;
  };

  const handleContinueToPayment = () => {
    const err = validateAddressStep();
    if (err) {
      setValidationError(err);
      showToast(err, 'error');
      return;
    }
    setValidationError('');
    setStep(2);
  };

  const handleConfirmOrder = async () => {
    const err = validateAddressStep();
    if (err) {
      setValidationError(err);
      setStep(1);
      return;
    }

    if (paymentMethod === 'cod' && !storeSettings.codEnabled) {
      setValidationError('Cash on Delivery is currently disabled.');
      return;
    }

    setValidationError('');
    setIsProcessingOrder(true);

    const normalizedAddress: ShippingAddress = {
      ...address,
      fullName: address.fullName.trim(),
      phone: normalizeIndianPhone(address.phone),
      email: address.email.trim().toLowerCase(),
      address: address.address.trim(),
      addressLine1: address.address.trim(),
      addressLine2: address.addressLine2?.trim() || '',
      city: address.city.trim(),
      state: address.state.trim(),
      pincode: address.pincode.trim()
    };

    if (currentUser && saveAddressToProfile) {
      await saveUserAddress({ ...normalizedAddress, label: 'Home' }).catch(() => {});
    }

    const result = await placeServerOrder({
      shippingAddress: normalizedAddress,
      paymentMethod,
      notes: orderNotes.trim() || undefined,
      idempotencyKey
    });

    if (result.error || !result.order) {
      setIsProcessingOrder(false);
      const msg = result.error || 'Unable to place your order. Please try again.';
      setValidationError(msg);
      showToast(msg, 'error');
      return;
    }

    let finalOrder = result.order;

    // If Razorpay online gateway is configured and chosen, launch real Razorpay checkout
    if (paymentMethod === 'razorpay' && razorpayConfigured) {
      try {
        const scriptReady = await loadRazorpayCheckoutScript();
        if (!scriptReady) {
          throw new Error('Could not load Razorpay checkout SDK. Check your internet connection.');
        }
        const token = await getAccessToken();
        const rzpCreateResp = await fetch('/api/payments/razorpay/create-order', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
          body: JSON.stringify({ orderId: finalOrder.id, orderNumber: finalOrder.orderNumber })
        });
        const rzpData = await rzpCreateResp.json();
        if (!rzpCreateResp.ok || !rzpData.razorpayOrderId) {
          throw new Error(rzpData.error || 'Could not initialize Razorpay transaction.');
        }

        const verificationResult = await new Promise<{ verified: boolean; orderRow?: any; error?: string }>(
          (resolve) => {
            const rzp = new window.Razorpay({
              key: rzpData.keyId,
              amount: rzpData.amount,
              currency: rzpData.currency,
              name: 'DreamQueen Atelier',
              description: `Order ${finalOrder.orderNumber}`,
              order_id: rzpData.razorpayOrderId,
              prefill: {
                name: finalOrder.customer.name,
                email: finalOrder.customer.email,
                contact: finalOrder.customer.phone
              },
              theme: { color: '#5B3A29' },
              handler: async (response: any) => {
                const verifyResp = await fetch('/api/payments/razorpay/verify', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {})
                  },
                  body: JSON.stringify({
                    orderId: finalOrder.id,
                    razorpay_order_id: response.razorpay_order_id,
                    razorpay_payment_id: response.razorpay_payment_id,
                    razorpay_signature: response.razorpay_signature
                  })
                });
                const verifyJson = await verifyResp.json().catch(() => ({}));
                if (verifyResp.ok && verifyJson.verified) {
                  resolve({ verified: true, orderRow: verifyJson.order });
                } else {
                  resolve({ verified: false, error: verifyJson.error || 'Signature mismatch.' });
                }
              },
              modal: {
                ondismiss: () =>
                  resolve({
                    verified: false,
                    error: 'Payment window closed. Your order is saved as pending payment.'
                  })
              }
            });
            rzp.open();
          }
        );

        if (verificationResult.verified && verificationResult.orderRow) {
          refreshOrderAfterGateway(verificationResult.orderRow);
          finalOrder = {
            ...finalOrder,
            paymentStatus: 'paid',
            trackingStatus: 'payment_confirmed'
          };
          showToast('Payment verified via Razorpay!');
        } else if (verificationResult.error) {
          showToast(verificationResult.error, 'info');
        }
      } catch (rzpErr: any) {
        showToast(rzpErr?.message || 'Razorpay payment was not completed.', 'info');
      }
    }

    setIsProcessingOrder(false);

    const waUrl = getWhatsAppOrderUrl({
      orderNumber: finalOrder.orderNumber,
      items: finalOrder.items.map((it) => ({
        name: it.productName,
        quantity: it.quantity,
        price: it.price,
        colorName: it.color?.name
      })),
      subtotal: finalOrder.subtotal,
      discount: finalOrder.discount,
      couponCode: finalOrder.couponCode,
      shippingFee: finalOrder.shippingFee,
      codFee: finalOrder.codFee,
      total: finalOrder.total,
      paymentMethod: finalOrder.paymentMethod,
      customerName: finalOrder.customer.name,
      phone: finalOrder.customer.phone,
      address: finalOrder.shippingAddress,
      notes: finalOrder.notes
    });

    setCreatedOrder(finalOrder);
    setCreatedWhatsAppUrl(waUrl);
    setStep('success');

    try {
      confetti({ particleCount: 80, spread: 65, origin: { y: 0.6 } });
    } catch {}

    showToast(`Order ${finalOrder.orderNumber} created!`);
  };

  const handleUtrSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createdOrder) return;
    if (utrInput.trim().length < 6) {
      showToast('Please enter a valid UPI / UTR reference (at least 6 characters).', 'error');
      return;
    }
    setUtrSubmitting(true);
    const res = await submitUpiUtr(createdOrder.id, utrInput);
    setUtrSubmitting(false);
    if (!res.success) {
      showToast(res.error || 'Could not record UTR reference.', 'error');
      return;
    }
    setCreatedOrder((prev) =>
      prev ? { ...prev, upiTransactionRef: utrInput.trim(), paymentStatus: 'pending' } : prev
    );
    setUtrSubmitted(true);
    showToast('UTR recorded! Payment remains Pending until studio verification.');
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
            <div className="w-10 h-10 rounded-full bg-[#F8D7DA] flex items-center justify-center text-[#5B3A29]">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-heading text-xl font-bold text-[#5B3A29]">
                DreamQueen Checkout
              </h2>
              <span className="text-xs text-[#708238] font-medium">
                Server-Validated Totals • 7-Day Express India Shipping
              </span>
            </div>
          </div>

          <button
            onClick={() => setIsCheckoutOpen(false)}
            className="p-2 rounded-full text-[#6E6863] hover:text-[#2E2E2E] hover:bg-[#F8D7DA]/40 transition"
            aria-label="Close checkout"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stepper */}
        {step !== 'success' && (
          <div className="px-6 py-3 bg-[#F8EFE7] border-b border-[#EAD5C5]/60 flex items-center justify-between text-xs font-semibold">
            {[
              { num: 1, label: 'Delivery Address' },
              { num: 2, label: 'Payment Method' },
              { num: 3, label: 'Review & Place Order' }
            ].map((s, idx) => (
              <React.Fragment key={s.num}>
                <button
                  type="button"
                  onClick={() => {
                    if (s.num < (step as number)) setStep(s.num as 1 | 2 | 3);
                  }}
                  className={`flex items-center gap-1.5 ${
                    (step as number) >= s.num ? 'text-[#5B3A29]' : 'text-gray-400'
                  }`}
                >
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                      (step as number) >= s.num
                        ? 'bg-[#5B3A29] text-white'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {s.num}
                  </span>
                  <span className="hidden sm:inline">{s.label}</span>
                </button>
                {idx < 2 && <span className="text-[#EAD5C5] flex-1 mx-2 h-px bg-[#EAD5C5]" />}
              </React.Fragment>
            ))}
          </div>
        )}

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-6 sm:p-8">
          {validationError && (
            <div className="mb-5 p-3 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          {/* STEP 1 */}
          {step === 1 && (
            <div className="space-y-5">
              {/* Saved Address Quick Picker */}
              {currentUser && currentUser.savedAddresses.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-bold text-[#5B3A29] flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#708238]" />
                    Select a Saved Delivery Address:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {currentUser.savedAddresses.map((saved, i) => (
                      <button
                        key={saved.id || i}
                        type="button"
                        onClick={() =>
                          setAddress({
                            ...saved,
                            address: saved.address || saved.addressLine1 || ''
                          })
                        }
                        className="p-3 text-left rounded-2xl border border-[#EAD5C5] bg-white hover:border-[#5B3A29] transition text-xs"
                      >
                        <div className="flex items-center justify-between font-bold text-[#5B3A29]">
                          <span>{saved.label || 'Saved Address'}</span>
                          {saved.isDefault && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#E8F0DC] text-[#4A5D1E]">
                              Default
                            </span>
                          )}
                        </div>
                        <p className="text-[#2E2E2E] mt-1 font-medium">{saved.fullName}</p>
                        <p className="text-[#6E6863] truncate">
                          {saved.address || saved.addressLine1}, {saved.city} - {saved.pincode}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

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
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#EAD5C5] bg-white text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#55504C] mb-1">
                    10-Digit Mobile Number *
                  </label>
                  <input
                    type="tel"
                    maxLength={10}
                    required
                    value={address.phone}
                    onChange={(e) =>
                      setAddress({ ...address, phone: e.target.value.replace(/\D/g, '') })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#EAD5C5] bg-white text-xs"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-[#55504C] mb-1">
                    Email Address (for Order Tracking & Receipt) *
                  </label>
                  <input
                    type="email"
                    required
                    value={address.email}
                    onChange={(e) => setAddress({ ...address, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#EAD5C5] bg-white text-xs"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-[#55504C] mb-1">
                    Street Address / House / Flat / Society *
                  </label>
                  <input
                    type="text"
                    required
                    value={address.address}
                    onChange={(e) => setAddress({ ...address, address: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#EAD5C5] bg-white text-xs"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-[#55504C] mb-1">
                    Area / Landmark (Optional)
                  </label>
                  <input
                    type="text"
                    value={address.addressLine2 || ''}
                    onChange={(e) => setAddress({ ...address, addressLine2: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#EAD5C5] bg-white text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#55504C] mb-1">City *</label>
                  <input
                    type="text"
                    required
                    value={address.city}
                    onChange={(e) => setAddress({ ...address, city: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#EAD5C5] bg-white text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-[#55504C] mb-1">State *</label>
                    <input
                      type="text"
                      required
                      value={address.state}
                      onChange={(e) => setAddress({ ...address, state: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#EAD5C5] bg-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#55504C] mb-1">
                      6-Digit Pincode *
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      required
                      value={address.pincode}
                      onChange={(e) =>
                        setAddress({ ...address, pincode: e.target.value.replace(/\D/g, '') })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#EAD5C5] bg-white text-xs"
                    />
                  </div>
                </div>
              </div>

              {currentUser && (
                <label className="flex items-center gap-2 text-xs text-[#55504C] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={saveAddressToProfile}
                    onChange={(e) => setSaveAddressToProfile(e.target.checked)}
                    className="rounded accent-[#5B3A29]"
                  />
                  <span>Save this delivery address to my account book</span>
                </label>
              )}

              <div>
                <label className="block text-xs font-semibold text-[#55504C] mb-1">
                  Order Notes (Gift message, custom shade detail, etc.)
                </label>
                <textarea
                  rows={2}
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#EAD5C5] bg-white text-xs resize-none"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleContinueToPayment}
                  className="px-6 py-3 rounded-full bg-[#5B3A29] text-white text-xs font-semibold hover:bg-[#43291B] transition flex items-center gap-2 shadow-sm"
                >
                  <span>Continue to Payment</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div className="space-y-4">
              <h3 className="font-heading text-lg font-bold text-[#5B3A29]">
                Select Payment Method
              </h3>

              {/* Option 1: Official UPI QR */}
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
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-[#2E2E2E]">
                          Official UPI QR (India Post Payments Bank)
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-[#708238] text-white font-semibold text-[10px]">
                          ZERO FEE
                        </span>
                      </div>
                      <p className="text-xs text-[#6E6863] mt-0.5">
                        A unique QR code for your exact order total will appear on the next step for instant UPI payment & UTR verification.
                      </p>
                    </div>
                  </div>
                  <QrCode className="w-5 h-5 text-[#5B3A29] shrink-0" />
                </div>
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
                        <span className="text-sm font-bold text-[#2E2E2E]">Cash on Delivery (COD)</span>
                        {storeSettings.codEnabled ? (
                          <span className="px-2 py-0.5 rounded-md bg-[#FFF3A8] text-[#855D00] font-semibold text-[10px]">
                            +₹{storeSettings.codFee} COD Fee
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md bg-gray-200 text-gray-700 font-semibold text-[10px]">
                            Currently Disabled
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#6E6863] mt-0.5">
                        Pay by cash or UPI when your handmade parcel arrives.
                      </p>
                    </div>
                  </div>
                  <Banknote className="w-5 h-5 text-[#5B3A29] shrink-0" />
                </div>
              </div>

              {/* Option 3: Razorpay Gateway (Truthful status) */}
              <div
                onClick={() => {
                  if (razorpayConfigured) setPaymentMethod('razorpay');
                }}
                className={`p-4 sm:p-5 rounded-2xl border-2 transition ${
                  !razorpayConfigured
                    ? 'opacity-70 cursor-not-allowed bg-gray-50 border-gray-200'
                    : paymentMethod === 'razorpay'
                    ? 'border-[#5B3A29] bg-[#FFF8F0] cursor-pointer'
                    : 'border-[#EAD5C5] bg-white hover:bg-[#FFF8F0]/50 cursor-pointer'
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
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-[#2E2E2E]">
                          Razorpay Gateway (Cards / NetBanking / UPI)
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-[#0C2340] text-white font-semibold text-[10px]">
                          {razorpayConfigured ? 'LIVE GATEWAY' : 'KEYS NOT CONFIGURED'}
                        </span>
                      </div>
                      <p className="text-xs text-[#6E6863] mt-0.5">
                        {razorpayConfigured
                          ? 'Real-time cryptographic Razorpay checkout with instant signature verification.'
                          : 'Online gateway requires RAZORPAY_KEY_ID & RAZORPAY_KEY_SECRET in server environment. Please use Official UPI QR or COD.'}
                      </p>
                    </div>
                  </div>
                  <ShieldCheck className="w-5 h-5 text-[#708238] shrink-0" />
                </div>
              </div>

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

          {/* STEP 3 */}
          {step === 3 && (
            <div className="space-y-5">
              <h3 className="font-heading text-lg font-bold text-[#5B3A29]">Review Your Order</h3>

              <div className="p-4 rounded-2xl bg-white border border-[#EAD5C5] text-xs space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-[#5B3A29]">Shipping to:</span>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-[#708238] font-semibold hover:underline"
                  >
                    Edit
                  </button>
                </div>
                <p className="font-medium text-[#2E2E2E]">
                  {address.fullName} ({normalizeIndianPhone(address.phone)})
                </p>
                <p className="text-[#6E6863]">
                  {address.address}
                  {address.addressLine2 ? `, ${address.addressLine2}` : ''}, {address.city},{' '}
                  {address.state} - {address.pincode}
                </p>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-bold text-[#5B3A29]">Items ({cart.length})</span>
                <div className="max-h-40 overflow-y-auto space-y-2 pr-1">
                  {cart.map((item) => (
                    <div
                      key={`${item.product.id}-${item.selectedColor.name}`}
                      className="flex items-center gap-3 p-2 rounded-xl bg-white border border-[#EAD5C5]"
                    >
                      <img
                        src={safeImage(item.product.images?.[0])}
                        alt={item.product.name}
                        className="w-10 h-10 rounded-lg object-cover"
                      />
                      <div className="flex-1 min-w-0 text-xs">
                        <p className="font-bold text-[#2E2E2E] truncate">{item.product.name}</p>
                        <p className="text-[11px] text-[#6E6863]">
                          {item.selectedColor.name} • Qty: {item.quantity}
                        </p>
                      </div>
                      <span className="font-price font-bold text-xs text-[#5B3A29] tabular-nums">
                        ₹{item.product.price * item.quantity}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#FFF8F0] border border-[#EAD5C5] space-y-2 text-xs">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-price font-bold text-[#2E2E2E] tabular-nums">
                    ₹{pricing.subtotal}
                  </span>
                </div>
                {pricing.discount > 0 && (
                  <div className="flex justify-between text-[#4A5D1E]">
                    <span>Discount ({activeCoupon?.code})</span>
                    <span className="font-price font-bold tabular-nums">-₹{pricing.discount}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Delivery Charges</span>
                  <span className="font-price font-bold text-[#2E2E2E] tabular-nums">
                    {pricing.shippingFee === 0 ? (
                      <span className="text-[#4A5D1E]">FREE</span>
                    ) : (
                      `₹${pricing.shippingFee}`
                    )}
                  </span>
                </div>
                {pricing.codFee > 0 && (
                  <div className="flex justify-between">
                    <span>Cash on Delivery Fee</span>
                    <span className="font-price font-bold text-[#2E2E2E] tabular-nums">
                      ₹{pricing.codFee}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-bold text-[#5B3A29] pt-2 border-t border-[#EAD5C5]">
                  <span>Total Payable</span>
                  <span className="font-price text-lg tabular-nums">₹{pricing.total}</span>
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
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
                  disabled={isProcessingOrder || cart.length === 0}
                  onClick={handleConfirmOrder}
                  className="w-full sm:w-auto px-7 py-3.5 rounded-full bg-[#5B3A29] hover:bg-[#43291B] text-white text-xs sm:text-sm font-bold shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isProcessingOrder ? 'Placing Order...' : `Confirm Order • ₹${pricing.total}`}
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Order Confirmation */}
          {step === 'success' && createdOrder && (
            <div className="text-center py-4 space-y-6">
              <div className="w-16 h-16 rounded-full bg-[#E8F0DC] text-[#4A5D1E] flex items-center justify-center mx-auto border-2 border-[#C5DCAB]">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h3 className="font-heading text-2xl sm:text-3xl font-bold text-[#5B3A29]">
                  Order Placed: {createdOrder.orderNumber}
                </h3>
                <p className="text-xs sm:text-sm text-[#6E6863] mt-1 max-w-md mx-auto">
                  Total Amount: <strong className="font-price">₹{createdOrder.total}</strong> •
                  Estimated Delivery: <strong>{createdOrder.estimatedDeliveryDate}</strong>
                </p>
                <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#FFF8F0] border border-[#EAD5C5] text-[#5B3A29]">
                  <span>Payment Status:</span>
                  <span
                    className={
                      createdOrder.paymentStatus === 'paid' ? 'text-[#4A5D1E]' : 'text-[#855D00]'
                    }
                  >
                    {createdOrder.paymentStatus === 'paid'
                      ? 'Verified & Paid'
                      : createdOrder.paymentMethod === 'upi_qr'
                      ? 'Pending Studio Verification'
                      : 'Pay on Delivery (COD)'}
                  </span>
                </div>
              </div>

              {/* Order-specific UPI QR & UTR verification */}
              {createdOrder.paymentMethod === 'upi_qr' && (
                <div className="bg-[#FFF8F0] border border-[#EAD5C5] rounded-3xl p-5 max-w-md mx-auto space-y-4 text-left">
                  <UpiQrCard
                    amount={createdOrder.total}
                    orderNumber={createdOrder.orderNumber}
                    showActions={true}
                  />

                  {utrSubmitted ? (
                    <div className="p-3 rounded-2xl bg-[#E8F0DC] border border-[#C5DCAB] text-xs text-[#3B4C16] flex items-center gap-2">
                      <Check className="w-4 h-4 shrink-0" />
                      <span>
                        UTR Reference <strong>{createdOrder.upiTransactionRef}</strong> recorded!
                        Payment stays pending until confirmed by our studio.
                      </span>
                    </div>
                  ) : (
                    <form onSubmit={handleUtrSubmit} className="space-y-2">
                      <label className="block text-xs font-bold text-[#5B3A29]">
                        Submit UPI Transaction / UTR Reference After Paying:
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          required
                          minLength={6}
                          placeholder="12-digit UTR / UPI Ref No."
                          value={utrInput}
                          onChange={(e) => setUtrInput(e.target.value)}
                          className="flex-1 px-3 py-2 rounded-xl border border-[#EAD5C5] bg-white text-xs font-mono"
                        />
                        <button
                          type="submit"
                          disabled={utrSubmitting}
                          className="px-4 py-2 rounded-xl bg-[#5B3A29] text-white text-xs font-semibold hover:bg-[#43291B]"
                        >
                          {utrSubmitting ? 'Saving...' : 'Submit UTR'}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col gap-2.5 max-w-md mx-auto">
                <a
                  href={createdWhatsAppUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3.5 px-6 rounded-full bg-[#25D366] hover:bg-[#1EBE5D] text-white text-xs sm:text-sm font-bold shadow-md transition flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-4 h-4 fill-white" />
                  <span>Share Order Receipt on WhatsApp (8097706536)</span>
                </a>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => downloadOrderInvoicePdf(createdOrder)}
                    className="py-2.5 px-4 rounded-full bg-white border border-[#EAD5C5] text-[#5B3A29] text-xs font-semibold hover:bg-[#FFF8F0] transition flex items-center justify-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>PDF Invoice</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsCheckoutOpen(false);
                      setActiveTab('track');
                    }}
                    className="py-2.5 px-4 rounded-full bg-[#5B3A29] text-white text-xs font-semibold hover:bg-[#43291B] transition"
                  >
                    Track This Order
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setIsCheckoutOpen(false);
                    setActiveTab('shop');
                  }}
                  className="w-full py-2.5 rounded-full bg-[#F8D7DA] text-[#5B3A29] text-xs font-semibold hover:bg-[#F2BAC0] transition"
                >
                  Continue Shopping
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
