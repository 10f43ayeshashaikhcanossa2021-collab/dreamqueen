import type { Coupon, OrderTrackingStatus, PaymentMethod, StoreSettings } from '../types';

export interface OrderPricingLineInput {
  price: number;
  quantity: number;
}

export interface OrderPricingResult {
  subtotal: number;
  discount: number;
  shippingFee: number;
  codFee: number;
  total: number;
}

export interface CouponValidationResult {
  valid: boolean;
  reason?: string;
}

export const DEFAULT_STORE_SETTINGS: StoreSettings = {
  codEnabled: true,
  codFee: 10,
  freeShippingThreshold: 499,
  standardShippingFee: 20,
  shiprocketApiKey: '',
  supportPhone: '8097706536',
  supportEmail: 'ayeshalk2025@gmail.com',
  pinterestUrl: 'https://in.pinterest.com/ayeshalk2025/?actingBusinessId=1147221842487308120',
  pinterestHandle: 'ayeshalk2025',
  upiId: '8097706536@postbank',
  upiPayeeName: 'AYESHA LUKMAN SHAIKH',
  studioAddress: 'Room No. 30, Building No. 47, Anarya Co. Op. Housing Society, Mahim (East)'
};

export function validateCouponRule(
  coupon: Coupon | null | undefined,
  subtotal: number,
  now: Date = new Date()
): CouponValidationResult {
  if (!coupon) {
    return { valid: false, reason: 'Coupon code not found.' };
  }
  if (!coupon.isActive) {
    return { valid: false, reason: 'This coupon code is no longer active.' };
  }
  if (coupon.expiresAt) {
    const expiryDate = new Date(coupon.expiresAt);
    if (!Number.isNaN(expiryDate.getTime()) && expiryDate.getTime() < now.getTime()) {
      return { valid: false, reason: 'This coupon code has expired.' };
    }
  }
  if (
    typeof coupon.maxUses === 'number' &&
    coupon.maxUses > 0 &&
    typeof coupon.usedCount === 'number' &&
    coupon.usedCount >= coupon.maxUses
  ) {
    return { valid: false, reason: 'This coupon code has reached its redemption limit.' };
  }
  if (subtotal < (coupon.minOrderAmount || 0)) {
    return {
      valid: false,
      reason: `Requires a minimum order subtotal of ₹${coupon.minOrderAmount}.`
    };
  }
  return { valid: true };
}

export function calculateOrderTotals(params: {
  items: OrderPricingLineInput[];
  coupon?: Coupon | null;
  settings: Pick<
    StoreSettings,
    'codEnabled' | 'codFee' | 'freeShippingThreshold' | 'standardShippingFee'
  >;
  paymentMethod: PaymentMethod;
  now?: Date;
}): OrderPricingResult {
  const subtotal = Math.max(
    0,
    Math.round(
      params.items.reduce(
        (sum, it) => sum + Math.max(0, Number(it.price || 0)) * Math.max(0, Math.floor(Number(it.quantity || 0))),
        0
      )
    )
  );

  if (subtotal === 0) {
    return {
      subtotal: 0,
      discount: 0,
      shippingFee: 0,
      codFee: 0,
      total: 0
    };
  }

  const baseShippingFee =
    subtotal >= params.settings.freeShippingThreshold
      ? 0
      : Math.max(0, Number(params.settings.standardShippingFee ?? 20));

  let discount = 0;
  let effectiveShippingFee = baseShippingFee;

  if (params.coupon) {
    const check = validateCouponRule(params.coupon, subtotal, params.now);
    if (check.valid) {
      if (params.coupon.code.toUpperCase() === 'FREESHIP' && params.coupon.discountPercent === 0) {
        effectiveShippingFee = 0;
        discount = baseShippingFee;
      } else if (params.coupon.discountPercent > 0) {
        discount = Math.round((subtotal * params.coupon.discountPercent) / 100);
        if (params.coupon.maxDiscount && params.coupon.maxDiscount > 0) {
          discount = Math.min(discount, params.coupon.maxDiscount);
        }
        discount = Math.min(discount, subtotal);
      }
    }
  }

  const codFee =
    params.paymentMethod === 'cod' && params.settings.codEnabled
      ? Math.max(0, Number(params.settings.codFee ?? 10))
      : 0;

  // Note: when FREESHIP discount equals baseShippingFee, shippingFee shown is 0 or discount cancels it out cleanly
  const shippingFeeForTotal =
    params.coupon?.code.toUpperCase() === 'FREESHIP' && params.coupon.discountPercent === 0
      ? 0
      : baseShippingFee;

  const total = Math.max(
    0,
    subtotal - (params.coupon?.code.toUpperCase() === 'FREESHIP' && params.coupon.discountPercent === 0 ? 0 : discount) + shippingFeeForTotal + codFee
  );

  return {
    subtotal,
    discount,
    shippingFee: effectiveShippingFee,
    codFee,
    total
  };
}

export function normalizeIndianPhone(raw: string): string {
  const digits = String(raw || '').replace(/\D/g, '');
  if (digits.length >= 10) {
    return digits.slice(-10);
  }
  return digits;
}

export function isValidIndianPhone(raw: string): boolean {
  const normalized = normalizeIndianPhone(raw);
  return /^[6-9]\d{9}$/.test(normalized) || normalized.length === 10;
}

export function isValidIndianPincode(raw: string): boolean {
  return /^[1-9][0-9]{5}$/.test(String(raw || '').trim());
}

export function isValidEmail(raw: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(raw || '').trim());
}

export function formatTrackingStatusLabel(status: OrderTrackingStatus): string {
  const labels: Record<OrderTrackingStatus, string> = {
    pending: 'Order Placed',
    payment_pending: 'Payment Verification Pending',
    payment_confirmed: 'Payment Confirmed',
    preparing: 'Preparing & Crocheting',
    packed: 'Packed with Love',
    shipped: 'Shipped',
    out_for_delivery: 'Out for Delivery',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
    refund_initiated: 'Refund Initiated',
    refunded: 'Refunded'
  };
  return labels[status] || status;
}

export const ORDER_LIFECYCLE_STEPS: Array<{
  id: OrderTrackingStatus;
  label: string;
  description: string;
}> = [
  { id: 'pending', label: 'Order Placed', description: 'Order registered in atelier queue' },
  { id: 'payment_confirmed', label: 'Confirmed', description: 'Payment / COD verified' },
  { id: 'preparing', label: 'Handcrafting', description: 'Artisans crocheting your pieces' },
  { id: 'packed', label: 'Packed', description: 'Eco gift-wrapped & inspected' },
  { id: 'shipped', label: 'Shipped', description: 'Handed to courier partner' },
  { id: 'out_for_delivery', label: 'Out for Delivery', description: 'Arriving at your doorstep' },
  { id: 'delivered', label: 'Delivered', description: 'Safely delivered with love' }
];
