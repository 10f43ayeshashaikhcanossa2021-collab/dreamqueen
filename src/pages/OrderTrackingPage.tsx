import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { OrderTrackingStatus } from '../types';
import {
  Search,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  MapPin,
  MessageCircle,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { motion } from 'motion/react';

const TRACKING_STEPS: Array<{ key: OrderTrackingStatus; label: string; desc: string }> = [
  { key: 'pending', label: 'Order Placed', desc: 'Payment verified & order queued' },
  { key: 'preparing', label: 'Preparing & Crocheting', desc: 'Artisans handcrafting your pieces' },
  { key: 'packed', label: 'Packed with Love', desc: 'Wrapped in craft paper with cute stickers' },
  { key: 'shipped', label: 'Shipped (Shiprocket)', desc: 'Handed to express courier partner' },
  { key: 'out_for_delivery', label: 'Out for Delivery', desc: 'Rider is arriving at your doorstep' },
  { key: 'delivered', label: 'Delivered', desc: 'Handmade treasure safely arrived' }
];

export const OrderTrackingPage: React.FC = () => {
  const { orders, getOrderByIdOrNumber, trackingSearchId, setTrackingSearchId } = useStore();

  const [inputQuery, setInputQuery] = useState(trackingSearchId || 'DQ-849201');
  const [searchedOrder, setSearchedOrder] = useState(() => {
    return getOrderByIdOrNumber(trackingSearchId || 'DQ-849201') || orders[0];
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputQuery.trim()) return;
    const found = getOrderByIdOrNumber(inputQuery);
    setSearchedOrder(found);
  };

  const getStepIndex = (status: OrderTrackingStatus) => {
    const map: Record<OrderTrackingStatus, number> = {
      pending: 0,
      preparing: 1,
      packed: 2,
      shipped: 3,
      out_for_delivery: 4,
      delivered: 5,
      cancelled: -1
    };
    return map[status] ?? 0;
  };

  const currentStepIndex = searchedOrder ? getStepIndex(searchedOrder.trackingStatus) : 0;

  return (
    <div className="py-12 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="text-center max-w-xl mx-auto mb-10">
        <span className="text-xs font-handwriting text-2xl text-[#708238] block font-semibold">
          7-Day Delivery Promise
        </span>
        <h1 className="font-heading text-3xl sm:text-4xl font-bold text-[#5B3A29]">
          Track Your Handmade Order
        </h1>
        <p className="text-xs sm:text-sm text-[#6E6863] mt-2">
          Enter your DreamQueen Order ID (e.g., <strong>DQ-849201</strong>) to follow your package’s journey from artisan hook to your door.
        </p>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="max-w-md mx-auto mb-10 flex gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#8C7A6B] absolute left-3.5 top-3.5" />
          <input
            type="text"
            placeholder="Enter Order ID (e.g. DQ-849201)"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-full border border-[#EAD5C5] bg-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#5B3A29]/20 focus:border-[#5B3A29] uppercase"
          />
        </div>
        <button
          type="submit"
          className="px-6 py-3 rounded-full bg-[#5B3A29] hover:bg-[#43291B] text-white text-xs sm:text-sm font-semibold shadow-md transition shrink-0"
        >
          Track
        </button>
      </form>

      {/* Recent quick clicks */}
      {orders.length > 0 && (
        <div className="text-center mb-8">
          <span className="text-[11px] text-[#8C7A6B] mr-2">Recent Orders:</span>
          {orders.slice(0, 3).map((ord) => (
            <button
              key={ord.id}
              onClick={() => {
                setInputQuery(ord.orderNumber);
                setSearchedOrder(ord);
              }}
              className="inline-block mx-1 px-2.5 py-1 rounded-md bg-[#FFF8F0] border border-[#EAD5C5] text-[11px] font-bold text-[#5B3A29] hover:bg-[#F8D7DA]"
            >
              {ord.orderNumber}
            </button>
          ))}
        </div>
      )}

      {/* Tracking Result Card */}
      {searchedOrder ? (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl border border-[#EAD5C5] shadow-md p-6 sm:p-8 space-y-8"
        >
          {/* Top Order Status Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-[#EAD5C5] gap-4">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#708238] block">
                Official Order Tracking
              </span>
              <h2 className="font-heading text-2xl font-bold text-[#5B3A29]">
                {searchedOrder.orderNumber}
              </h2>
              <p className="text-xs text-[#6E6863]">
                Placed on {new Date(searchedOrder.createdAt).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                })}
              </p>
            </div>

            <div className="sm:text-right">
              <span className="text-[11px] text-[#8C7A6B] block">Shiprocket Tracking #:</span>
              <span className="font-mono text-xs font-bold text-[#2E2E2E]">
                {searchedOrder.shiprocketTrackingNumber || 'SR-IND-PENDING'}
              </span>
              <div className="mt-1">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#E8F0DC] text-[#4A5D1E]">
                  <Truck className="w-3.5 h-3.5" />
                  <span>Estimated: {searchedOrder.estimatedDeliveryDate}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Timeline Visualizer */}
          <div className="py-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#8C7A6B] mb-6">
              Live Order Progress
            </h3>

            <div className="relative">
              {/* Connecting vertical/horizontal bar */}
              <div className="hidden md:block absolute top-5 left-8 right-8 h-1 bg-gray-200 -z-0">
                <div
                  className="h-full bg-[#708238] transition-all duration-700"
                  style={{
                    width: `${Math.min(100, (currentStepIndex / (TRACKING_STEPS.length - 1)) * 100)}%`
                  }}
                />
              </div>

              {/* Steps */}
              <div className="grid grid-cols-1 md:grid-cols-6 gap-6 relative z-10">
                {TRACKING_STEPS.map((step, idx) => {
                  const isCompleted = currentStepIndex >= idx;
                  const isCurrent = currentStepIndex === idx;

                  return (
                    <div key={step.key} className="flex md:flex-col items-center gap-3 md:text-center">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border-2 transition-all shadow-xs ${
                          isCompleted
                            ? 'bg-[#708238] text-white border-[#53682B]'
                            : 'bg-white text-gray-400 border-gray-300'
                        } ${isCurrent ? 'ring-4 ring-[#708238]/20' : ''}`}
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="w-5 h-5" />
                        ) : (
                          <span className="text-xs font-bold">{idx + 1}</span>
                        )}
                      </div>

                      <div>
                        <h4
                          className={`text-xs font-bold ${
                            isCompleted ? 'text-[#5B3A29]' : 'text-gray-400'
                          }`}
                        >
                          {step.label}
                        </h4>
                        <p className="text-[10px] text-[#6E6863] mt-0.5 line-clamp-2">
                          {step.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-[#EAD5C5]">
            {/* Delivery address */}
            <div className="p-4 rounded-2xl bg-[#FFF8F0] border border-[#EAD5C5]/70 space-y-2 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-[#5B3A29]">
                <MapPin className="w-4 h-4" />
                <span>Shipping Address</span>
              </div>
              <p className="font-semibold text-[#2E2E2E]">
                {searchedOrder.shippingAddress.fullName} ({searchedOrder.shippingAddress.phone})
              </p>
              <p className="text-[#6E6863]">
                {searchedOrder.shippingAddress.address}, {searchedOrder.shippingAddress.city},{' '}
                {searchedOrder.shippingAddress.state} - {searchedOrder.shippingAddress.pincode}
              </p>
            </div>

            {/* Support & Notification */}
            <div className="p-4 rounded-2xl bg-[#FFF8F0] border border-[#EAD5C5]/70 space-y-2 text-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-1.5 font-bold text-[#5B3A29]">
                  <MessageCircle className="w-4 h-4 text-[#25D366]" />
                  <span>WhatsApp Updates Active</span>
                </div>
                <p className="text-[#6E6863] mt-1">
                  We send automatic WhatsApp messages when your parcel is crocheted, shipped, and out for delivery!
                </p>
              </div>

              <a
                href={`https://wa.me/918097706536?text=Hi%20DreamQueen,%20checking%20status%20for%20order%20${searchedOrder.orderNumber}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#25D366] text-white font-semibold text-xs hover:bg-[#1EBE5D] transition w-fit"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>Chat with Artisan on WhatsApp</span>
              </a>
            </div>
          </div>

          {/* Items Summary */}
          <div className="pt-6 border-t border-[#EAD5C5] space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#8C7A6B]">
              Ordered Items ({searchedOrder.items.length})
            </h3>
            <div className="space-y-2">
              {searchedOrder.items.map((it, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-xl bg-white border border-[#EAD5C5]"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={it.image}
                      alt={it.productName}
                      className="w-12 h-12 rounded-lg object-cover border border-[#EAD5C5]"
                    />
                    <div>
                      <p className="text-xs font-bold text-[#2E2E2E]">{it.productName}</p>
                      <p className="text-[11px] text-[#8C7A6B]">
                        Color: {it.color.name} • Qty: {it.quantity}
                      </p>
                    </div>
                  </div>
                  <span className="font-price font-bold text-xs text-[#5B3A29]">
                    ₹{it.price * it.quantity}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex justify-between text-xs font-bold text-[#5B3A29] pt-3">
              <span>Total Paid ({searchedOrder.paymentMethod.toUpperCase()})</span>
              <span className="font-price text-sm">₹{searchedOrder.total}</span>
            </div>
          </div>
        </motion.div>
      ) : (
        <div className="text-center py-12 bg-white rounded-3xl border border-[#EAD5C5] p-8 space-y-3">
          <AlertCircle className="w-10 h-10 text-[#842029] mx-auto" />
          <h3 className="font-heading text-lg font-bold text-[#5B3A29]">
            Order Not Found
          </h3>
          <p className="text-xs text-[#6E6863]">
            Please verify the Order ID (e.g. DQ-849201) or check your confirmation email/WhatsApp.
          </p>
        </div>
      )}
    </div>
  );
};
