import { CartItem, ShippingAddress } from '../types';

export const ARTISAN_WHATSAPP_NUMBER = '918097706536';
export const DISPLAY_WHATSAPP_NUMBER = '8097706536';

interface BuildOrderMessageParams {
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
  customerName?: string;
  phone?: string;
  address?: Partial<ShippingAddress>;
  notes?: string;
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
    customerName,
    phone,
    address,
    notes
  } = params;

  const lines: string[] = [
    '🌸 *NEW ORDER — DREAMQUEEN CROCHET* 🌸',
    '━━━━━━━━━━━━━━━━━━━━'
  ];

  if (orderNumber) {
    lines.push(`📋 *Order ID:* ${orderNumber}`);
  }

  lines.push('');
  lines.push('🛍️ *Items in Cart:*');
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
    `• Delivery Charges: ${shippingFee === 0 ? 'FREE (Orders over ₹499)' : `₹${shippingFee} (Standard 7-Day)`}`
  );

  if (paymentMethod === 'cod' && codFee > 0) {
    lines.push(`• Cash on Delivery Fee: ₹${codFee}`);
  }

  lines.push(`• *Total Amount Payable: ₹${total}*`);

  const paymentMethodLabel =
    paymentMethod === 'cod'
      ? 'Cash on Delivery (Pay on arrival)'
      : paymentMethod === 'upi_qr'
      ? 'UPI QR Scan (8097706536@postbank)'
      : 'Online Payment';
  lines.push(`• Payment Preference: ${paymentMethodLabel}`);

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
  lines.push('Please confirm my order and share payment / dispatch details! Thank you 🧶💖');

  return lines.join('\n');
}

/**
 * Returns the full wa.me direct link with prefilled order text.
 */
export function getWhatsAppOrderUrl(params: BuildOrderMessageParams): string {
  const text = buildWhatsAppOrderMessage(params);
  return `https://wa.me/${ARTISAN_WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
}

/**
 * Quick helper for cart drawer to send current cart items immediately to WhatsApp.
 */
export function getQuickCartWhatsAppUrl(
  cart: CartItem[],
  subtotal: number,
  shippingFee: number,
  finalTotal: number,
  customerName?: string
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
    shippingFee,
    total: finalTotal,
    paymentMethod: 'cod',
    customerName,
    notes: 'Inquiry & Direct Order from DreamQueen Website Cart'
  });
}
