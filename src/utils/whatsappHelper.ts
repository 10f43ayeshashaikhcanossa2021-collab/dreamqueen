import { CartItem, ShippingAddress } from '../types';

export const ARTISAN_WHATSAPP_NUMBER = '918097706536';
export const DISPLAY_WHATSAPP_NUMBER = '8097706536';

/**
 * Normalizes an Indian/international phone number to digits suitable for https://wa.me/<digits>.
 * 10-digit Indian mobile numbers get prefixed with '91'. Falls back to ARTISAN_WHATSAPP_NUMBER.
 */
export function formatWhatsAppNumber(phone?: string): string {
  const digits = String(phone || '').replace(/\D/g, '');
  if (!digits) return ARTISAN_WHATSAPP_NUMBER;
  if (digits.length === 10) return `91${digits}`;
  if (digits.length === 11 && digits.startsWith('0')) return `91${digits.slice(1)}`;
  if (digits.length >= 11) return digits;
  return ARTISAN_WHATSAPP_NUMBER;
}

export function formatDisplayPhone(phone?: string): string {
  const digits = String(phone || '').replace(/\D/g, '');
  if (digits.length >= 10) return digits.slice(-10);
  return DISPLAY_WHATSAPP_NUMBER;
}

export interface BuildOrderMessageParams {
  orderNumber?: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    colorName?: string;
  }>;
  subtotal: number;
  discount?: number;
  couponCode?: string;
  shippingFee: number;
  codFee?: number;
  total: number;
  paymentMethod?: string;
  paymentStatus?: string;
  upiTransactionRef?: string;
  upiId?: string;
  estimatedDeliveryDate?: string;
  customerName?: string;
  phone?: string;
  address?: Partial<ShippingAddress>;
  notes?: string;
  targetPhone?: string;
}

/**
 * Builds a beautifully formatted WhatsApp message for DreamQueen orders.
 */
export function buildWhatsAppOrderMessage(params: BuildOrderMessageParams): string {
  const {
    orderNumber,
    items,
    subtotal,
    discount = 0,
    couponCode,
    shippingFee,
    codFee = 0,
    total,
    paymentMethod = 'cod',
    paymentStatus,
    upiTransactionRef,
    upiId = '8097706536@postbank',
    estimatedDeliveryDate,
    customerName,
    phone,
    address,
    notes
  } = params;

  const lines: string[] = [
    '🌸 *NEW ORDER — DREAMQUEEN ATELIER* 🌸',
    '━━━━━━━━━━━━━━━━━━━━'
  ];

  if (orderNumber) {
    lines.push(`📋 *Order ID:* ${orderNumber}`);
  }
  if (estimatedDeliveryDate) {
    lines.push(`🚚 *Est. Delivery:* ${estimatedDeliveryDate}`);
  }

  lines.push('');
  lines.push('🛍️ *Ordered Items:*');
  items.forEach((item, idx) => {
    lines.push(`${idx + 1}. *${item.name}*`);
    if (item.colorName) {
      lines.push(`   • Color: ${item.colorName}`);
    }
    lines.push(`   • Qty: ${item.quantity} × ₹${item.price} = ₹${item.quantity * item.price}`);
  });

  lines.push('');
  lines.push('━━━━━━━━━━━━━━━━━━━━');
  lines.push('💰 *Payment & Billing:*');
  lines.push(`• Subtotal: ₹${subtotal}`);

  if (discount > 0) {
    lines.push(`• Discount${couponCode ? ` (${couponCode})` : ''}: -₹${discount}`);
  }

  lines.push(
    `• Delivery Charges: ${shippingFee === 0 ? 'FREE (Orders ₹499+)' : `₹${shippingFee} (Standard 7-Day)`}`
  );

  if (paymentMethod === 'cod' && codFee > 0) {
    lines.push(`• Cash on Delivery Fee: ₹${codFee}`);
  }

  lines.push(`• *Total Amount Payable: ₹${total}*`);

  const paymentMethodLabel =
    paymentMethod === 'cod'
      ? 'Cash on Delivery (Pay on arrival)'
      : paymentMethod === 'upi_qr'
      ? `UPI QR Scan (${upiId})`
      : 'Razorpay Online Payment';
  lines.push(`• Payment Method: ${paymentMethodLabel}`);

  if (paymentStatus) {
    const statusLabel =
      paymentStatus === 'paid'
        ? 'Verified & Paid'
        : paymentMethod === 'upi_qr'
        ? 'Pending Studio Verification'
        : 'Pay on Delivery';
    lines.push(`• Payment Status: ${statusLabel}`);
  }

  if (upiTransactionRef && upiTransactionRef.trim()) {
    lines.push(`• *UPI / UTR Ref:* ${upiTransactionRef.trim()}`);
  }

  if (customerName || (address && address.fullName)) {
    lines.push('');
    lines.push('📍 *Delivery Details:*');
    lines.push(`• Name: ${customerName || address?.fullName || 'Valued Customer'}`);
    if (phone || address?.phone) {
      lines.push(`• Phone: ${phone || address?.phone}`);
    }
    const fullStreet = (address?.address || address?.addressLine1 || '').trim();
    if (fullStreet) {
      lines.push(`• Street: ${fullStreet}`);
      if (address?.addressLine2) lines.push(`• Area / Landmark: ${address.addressLine2}`);
    }
    if (address?.city || address?.state || address?.pincode) {
      lines.push(
        `• Location: ${[address?.city, address?.state, address?.pincode].filter(Boolean).join(', ')}`
      );
    }
  }

  if (notes && notes.trim()) {
    lines.push('');
    lines.push(`📝 *Note for Artisan:* ${notes.trim()}`);
  }

  lines.push('');
  lines.push('━━━━━━━━━━━━━━━━━━━━');
  lines.push('Please confirm my order and share dispatch updates! Thank you 🧶💖');

  return lines.join('\n');
}

/**
 * Returns the full wa.me direct link with prefilled order text.
 */
export function getWhatsAppOrderUrl(params: BuildOrderMessageParams): string {
  const target = formatWhatsAppNumber(params.targetPhone);
  const text = buildWhatsAppOrderMessage(params);
  return `https://wa.me/${target}?text=${encodeURIComponent(text)}`;
}

/**
 * Quick helper for cart drawer to send current cart items immediately to WhatsApp.
 */
export function getQuickCartWhatsAppUrl(
  cart: CartItem[],
  subtotal: number,
  shippingFee: number,
  finalTotal: number,
  customerName?: string,
  options?: {
    discount?: number;
    couponCode?: string;
    codFee?: number;
    paymentMethod?: string;
    targetPhone?: string;
    upiId?: string;
  }
): string {
  const items = cart.map((c) => ({
    name: c.product.name,
    quantity: c.quantity,
    price: c.product.price,
    colorName: c.selectedColor?.name
  }));

  return getWhatsAppOrderUrl({
    items,
    subtotal,
    discount: options?.discount ?? 0,
    couponCode: options?.couponCode,
    shippingFee,
    codFee: options?.codFee ?? 0,
    total: finalTotal,
    paymentMethod: options?.paymentMethod || 'upi_qr',
    upiId: options?.upiId,
    targetPhone: options?.targetPhone,
    customerName,
    notes: 'Direct Order Inquiry from DreamQueen Website Cart'
  });
}
