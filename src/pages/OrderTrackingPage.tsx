import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import type { Order } from '../types';
import {
  Search,
  Package,
  Truck,
  CheckCircle2,
  MapPin,
  Download,
  MessageCircle,
  Lock,
  AlertCircle,
  XCircle
} from 'lucide-react';
import { orderFromSupabaseRow, getAccessToken } from '../lib/supabase';
import { ORDER_LIFECYCLE_STEPS, formatTrackingStatusLabel } from '../utils/pricing';
import { resolveItemImage } from '../utils/imageHelper';
import { downloadOrderInvoicePdf } from '../utils/invoiceGenerator';

export const OrderTrackingPage: React.FC = () => {
  const { currentUser, orders } = useStore();

  const [orderNumberInput, setOrderNumberInput] = useState('');
  const [contactInput, setContactInput] = useState(currentUser?.email || currentUser?.phone || '');
  const [trackedOrder, setTrackedOrder] = useState<Order | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');

  // Only show quick-select order chips for the authenticated user's own orders
  const myOrders = currentUser
    ? orders.filter(
        (o) =>
          o.userId === currentUser.id ||
          (currentUser.email &&
            o.customer?.email?.toLowerCase() === currentUser.email.toLowerCase())
      )
    : [];

  const handleTrackSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setSearchError('');
    setTrackedOrder(null);

    const cleanOrd = orderNumberInput.trim().toUpperCase();
    const cleanContact = contactInput.trim();

    if (!cleanOrd) {
      setSearchError('Please enter your DreamQueen Order Number (e.g. DQ-849201).');
      return;
    }
    if (!cleanContact && !currentUser) {
      setSearchError('For your privacy, please enter the email or 10-digit phone used on this order.');
      return;
    }

    setIsSearching(true);
    try {
      const token = await getAccessToken();
      const resp = await fetch('/api/orders/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          orderNumber: cleanOrd,
          contact: cleanContact || currentUser?.email || currentUser?.phone || ''
        })
      });

      const data = await resp.json().catch(() => ({}));
      if (resp.ok && data.order) {
        setTrackedOrder(orderFromSupabaseRow(data.order));
        setIsSearching(false);
        return;
      }

      // Check signed-in user's own local state only
      if (currentUser) {
        const ownMatch = myOrders.find((o) => o.orderNumber.toUpperCase() === cleanOrd);
        if (ownMatch) {
          setTrackedOrder(ownMatch);
          setIsSearching(false);
          return;
        }
      }

      setSearchError(
        data?.error || 'Order not found or contact email/phone did not match this order.'
      );
    } catch {
      setSearchError('Unable to check order status right now. Please try again shortly.');
    } finally {
      setIsSearching(false);
    }
  };

  const isCancelledBranch =
    trackedOrder &&
    ['cancelled', 'refund_initiated', 'refunded'].includes(trackedOrder.trackingStatus);

  const activeStepIndex = trackedOrder
    ? Math.max(
        0,
        ORDER_LIFECYCLE_STEPS.findIndex((s) => s.id === trackedOrder.trackingStatus)
      )
    : -1;

  return (
    <div className="py-12 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
      <div className="text-center max-w-2xl mx-auto">
        <span className="text-xs font-semibold uppercase tracking-wider text-[#708238]">
          Private Order Verification
        </span>
        <h1 className="font-heading text-3xl sm:text-4xl font-bold text-[#5B3A29] mt-1">
          Track Your Handmade Parcel
        </h1>
        <p className="text-xs sm:text-sm text-[#6E6863] mt-2">
          Enter your Order ID and the matching email address or 10-digit phone number used at checkout.
        </p>
      </div>

      {/* Quick Order Pills ONLY for signed-in customer */}
      {myOrders.length > 0 && (
        <div className="bg-[#FFF8F0] rounded-2xl border border-[#EAD5C5] p-4 flex flex-wrap items-center gap-2 text-xs">
          <span className="font-bold text-[#5B3A29]">Your Recent Orders:</span>
          {myOrders.slice(0, 4).map((o) => (
            <button
              key={o.id}
              type="button"
              onClick={() => {
                setOrderNumberInput(o.orderNumber);
                setTrackedOrder(o);
                setSearchError('');
              }}
              className="px-3 py-1 rounded-full bg-white border border-[#EAD5C5] text-[#5B3A29] font-semibold hover:bg-[#F8D7DA]/40 transition"
            >
              {o.orderNumber}
            </button>
          ))}
        </div>
      )}

      {/* Privacy-Safe Lookup Form */}
      <form
        onSubmit={handleTrackSearch}
        className="bg-white rounded-3xl border border-[#EAD5C5] p-6 shadow-sm space-y-4"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#5B3A29] mb-1">
              Order Number *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. DQ-849201"
              value={orderNumberInput}
              onChange={(e) => setOrderNumberInput(e.target.value.toUpperCase())}
              className="w-full px-4 py-2.5 rounded-xl border border-[#EAD5C5] bg-[#FDF9F4] text-xs font-mono"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#5B3A29] mb-1">
              Registered Email or 10-Digit Phone *
            </label>
            <input
              type="text"
              required={!currentUser}
              placeholder="you@example.com or 98XXXXXXXX"
              value={contactInput}
              onChange={(e) => setContactInput(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-[#EAD5C5] bg-[#FDF9F4] text-xs"
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <span className="text-[11px] text-[#6E6863] flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-[#708238]" />
            <span>Protected lookup: contact verification prevents unauthorized access.</span>
          </span>
          <button
            type="submit"
            disabled={isSearching}
            className="px-6 py-2.5 rounded-full bg-[#5B3A29] text-white text-xs font-semibold hover:bg-[#43291B] transition flex items-center justify-center gap-2"
          >
            <Search className="w-4 h-4" />
            <span>{isSearching ? 'Checking...' : 'Track Order'}</span>
          </button>
        </div>

        {searchError && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{searchError}</span>
          </div>
        )}
      </form>

      {/* Tracked Result */}
      {trackedOrder && (
        <div className="bg-white rounded-3xl border border-[#EAD5C5] p-6 sm:p-8 shadow-md space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#F0DFD1]">
            <div>
              <span className="text-[11px] font-bold uppercase text-[#708238] tracking-wider">
                Order Verification Confirmed
              </span>
              <h2 className="font-heading text-2xl font-bold text-[#5B3A29]">
                {trackedOrder.orderNumber}
              </h2>
              <p className="text-xs text-[#6E6863]">
                Placed on {new Date(trackedOrder.createdAt).toLocaleDateString('en-IN')} • Estimated
                Delivery: <strong>{trackedOrder.estimatedDeliveryDate}</strong>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {trackedOrder.shiprocketTrackingNumber && (
                <span className="px-3 py-1.5 rounded-xl bg-[#FFF8F0] border border-[#EAD5C5] text-xs font-mono font-bold text-[#5B3A29]">
                  AWB: {trackedOrder.shiprocketTrackingNumber}
                </span>
              )}
              <button
                type="button"
                onClick={() => downloadOrderInvoicePdf(trackedOrder)}
                className="px-3.5 py-1.5 rounded-full bg-[#FFF8F0] border border-[#EAD5C5] text-xs font-semibold text-[#5B3A29] hover:bg-[#F3E5D8] flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Invoice</span>
              </button>
            </div>
          </div>

          {/* Cancelled / Refund Branch */}
          {isCancelledBranch ? (
            <div className="p-4 rounded-2xl bg-red-50 border border-red-200 flex items-start gap-3 text-xs text-red-900">
              <XCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-sm">
                  {formatTrackingStatusLabel(trackedOrder.trackingStatus)}
                </strong>
                <p className="mt-1">
                  {trackedOrder.cancellationReason ||
                    'This order has been cancelled or refunded.'}
                </p>
              </div>
            </div>
          ) : (
            /* Standard 7-Step Progress */
            <div className="grid grid-cols-1 sm:grid-cols-7 gap-3">
              {ORDER_LIFECYCLE_STEPS.map((step, idx) => {
                const done = idx <= activeStepIndex;
                return (
                  <div key={step.id} className="flex sm:flex-col items-center gap-2 sm:text-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 shrink-0 ${
                        done
                          ? 'bg-[#708238] border-[#708238] text-white'
                          : 'bg-white border-[#EAD5C5] text-[#8C7A6B]'
                      }`}
                    >
                      {done ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                    </div>
                    <div>
                      <p
                        className={`text-[11px] font-bold ${
                          done ? 'text-[#5B3A29]' : 'text-[#8C7A6B]'
                        }`}
                      >
                        {step.label}
                      </p>
                      <p className="text-[10px] text-[#6E6863] hidden sm:block">{step.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Items & Address */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-[#F0DFD1] text-xs">
            <div className="p-4 rounded-2xl bg-[#FDF9F4] border border-[#EAD5C5] space-y-2">
              <h3 className="font-bold text-[#5B3A29] flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-[#708238]" /> Shipping Destination
              </h3>
              <p className="font-medium text-[#2E2E2E]">{trackedOrder.shippingAddress.fullName}</p>
              <p className="text-[#6E6863]">
                {trackedOrder.shippingAddress.city}, {trackedOrder.shippingAddress.state} -{' '}
                {trackedOrder.shippingAddress.pincode}
              </p>
              <p className="text-[#6E6863]">
                Payment: <strong className="uppercase">{trackedOrder.paymentMethod}</strong> •{' '}
                Status: <strong className="uppercase">{trackedOrder.paymentStatus}</strong>
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#FDF9F4] border border-[#EAD5C5] space-y-2">
              <h3 className="font-bold text-[#5B3A29] flex items-center gap-1.5">
                <Package className="w-4 h-4 text-[#708238]" /> Items ({trackedOrder.items.length})
              </h3>
              <div className="space-y-1.5">
                {trackedOrder.items.map((it, idx) => (
                  <div key={idx} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <img
                        src={resolveItemImage(it.productId, it.image)}
                        alt={it.productName}
                        className="w-8 h-8 rounded-lg object-cover border border-[#EAD5C5]"
                      />
                      <span className="truncate font-medium">
                        {it.productName} × {it.quantity}
                      </span>
                    </div>
                    <span className="font-price font-bold tabular-nums">
                      ₹{it.price * it.quantity}
                    </span>
                  </div>
                ))}
              </div>
              <div className="pt-2 border-t border-[#EAD5C5] flex justify-between font-bold text-[#5B3A29]">
                <span>Order Total</span>
                <span className="font-price tabular-nums">₹{trackedOrder.total}</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <a
              href={`https://wa.me/918097706536?text=${encodeURIComponent(
                `Hello DreamQueen Atelier! Checking status for my order ${trackedOrder.orderNumber}.`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-2.5 rounded-full bg-[#25D366] text-white text-xs font-semibold flex items-center gap-2"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Ask Artisan on WhatsApp</span>
            </a>
          </div>
        </div>
      )}
    </div>
  );
};
