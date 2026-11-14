import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import http from 'node:http';
import crypto from 'node:crypto';
import type { AddressInfo } from 'node:net';
import {
  calculateOrderTotals,
  validateCouponRule,
  DEFAULT_STORE_SETTINGS,
  isValidIndianPhone,
  isValidIndianPincode,
  isValidEmail
} from '../pricing';
import {
  computeRazorpayPaymentSignature,
  verifyRazorpayPaymentSignature,
  verifyRazorpayWebhookSignature
} from '../paymentCrypto';
import {
  buildWhatsAppOrderMessage,
  formatDisplayPhone,
  formatWhatsAppNumber,
  getWhatsAppOrderUrl
} from '../whatsappHelper';
import { createApp } from '../../../server';
import type { Coupon } from '../../types';

describe('DreamQueen Pricing & Shipping Engine', () => {
  it('charges ₹20 standard delivery below ₹499 and ₹10 COD fee for COD', () => {
    const res = calculateOrderTotals({
      items: [{ price: 150, quantity: 1 }],
      settings: DEFAULT_STORE_SETTINGS,
      paymentMethod: 'cod'
    });
    expect(res.subtotal).toBe(150);
    expect(res.shippingFee).toBe(20);
    expect(res.codFee).toBe(10);
    expect(res.discount).toBe(0);
    expect(res.total).toBe(180);
  });

  it('grants FREE shipping at or above ₹499 and omits COD fee on UPI QR', () => {
    const res = calculateOrderTotals({
      items: [{ price: 520, quantity: 1 }],
      settings: DEFAULT_STORE_SETTINGS,
      paymentMethod: 'upi_qr'
    });
    expect(res.subtotal).toBe(520);
    expect(res.shippingFee).toBe(0);
    expect(res.codFee).toBe(0);
    expect(res.total).toBe(520);
  });

  it('omits COD fee even on COD if store disables codEnabled', () => {
    const res = calculateOrderTotals({
      items: [{ price: 200, quantity: 1 }],
      settings: { ...DEFAULT_STORE_SETTINGS, codEnabled: false },
      paymentMethod: 'cod'
    });
    expect(res.codFee).toBe(0);
    expect(res.total).toBe(220);
  });

  it('applies percentage coupon with maxDiscount cap accurately', () => {
    const coupon: Coupon = {
      code: 'DREAM20',
      description: '20% off up to ₹50',
      discountPercent: 20,
      maxDiscount: 50,
      minOrderAmount: 100,
      isActive: true
    };
    const res = calculateOrderTotals({
      items: [{ price: 400, quantity: 1 }],
      coupon,
      settings: DEFAULT_STORE_SETTINGS,
      paymentMethod: 'upi_qr'
    });
    // 20% of 400 = 80, capped at 50
    expect(res.discount).toBe(50);
    expect(res.shippingFee).toBe(20);
    expect(res.total).toBe(370);
  });

  it('handles FREESHIP coupon cleanly without subtracting shipping twice', () => {
    const coupon: Coupon = {
      code: 'FREESHIP',
      description: 'Free shipping',
      discountPercent: 0,
      minOrderAmount: 100,
      isActive: true
    };
    const res = calculateOrderTotals({
      items: [{ price: 250, quantity: 1 }],
      coupon,
      settings: DEFAULT_STORE_SETTINGS,
      paymentMethod: 'upi_qr'
    });
    expect(res.shippingFee).toBe(0);
    expect(res.total).toBe(250);
  });

  it('rejects expired, maxed-out, inactive, or below-minimum coupons', () => {
    const now = new Date('2026-11-15T12:00:00Z');
    expect(
      validateCouponRule(
        {
          code: 'OLD',
          description: 'Expired',
          discountPercent: 10,
          minOrderAmount: 0,
          isActive: true,
          expiresAt: '2026-11-10T00:00:00Z'
        },
        300,
        now
      ).valid
    ).toBe(false);

    expect(
      validateCouponRule(
        {
          code: 'FULL',
          description: 'Maxed out',
          discountPercent: 10,
          minOrderAmount: 0,
          isActive: true,
          maxUses: 5,
          usedCount: 5
        },
        300,
        now
      ).valid
    ).toBe(false);

    expect(
      validateCouponRule(
        {
          code: 'OFF',
          description: 'Inactive',
          discountPercent: 10,
          minOrderAmount: 0,
          isActive: false
        },
        300,
        now
      ).valid
    ).toBe(false);

    expect(
      validateCouponRule(
        {
          code: 'MIN500',
          description: 'Min order 500',
          discountPercent: 15,
          minOrderAmount: 500,
          isActive: true
        },
        300,
        now
      ).valid
    ).toBe(false);
  });
});

describe('Indian Address, Phone & Email Validators', () => {
  it('validates 10-digit Indian phones and +91 prefixes', () => {
    expect(isValidIndianPhone('8097706536')).toBe(true);
    expect(isValidIndianPhone('+91 8097706536')).toBe(true);
    expect(isValidIndianPhone('12345')).toBe(false);
  });

  it('validates 6-digit Indian pincodes', () => {
    expect(isValidIndianPincode('400016')).toBe(true);
    expect(isValidIndianPincode('000123')).toBe(false);
    expect(isValidIndianPincode('40001')).toBe(false);
  });

  it('validates standard email addresses', () => {
    expect(isValidEmail('ayeshalk2025@gmail.com')).toBe(true);
    expect(isValidEmail('bad-email')).toBe(false);
  });
});

describe('Razorpay HMAC Signature Verification', () => {
  it('verifies valid payment HMAC-SHA256 signatures and rejects tampered ones', () => {
    const secret = 'rzp_test_secret_key';
    const orderId = 'order_ABC123';
    const paymentId = 'pay_XYZ987';
    const sig = computeRazorpayPaymentSignature(orderId, paymentId, secret);

    expect(
      verifyRazorpayPaymentSignature({
        razorpayOrderId: orderId,
        razorpayPaymentId: paymentId,
        razorpaySignature: sig,
        secret
      })
    ).toBe(true);

    expect(
      verifyRazorpayPaymentSignature({
        razorpayOrderId: orderId,
        razorpayPaymentId: 'pay_TAMPERED',
        razorpaySignature: sig,
        secret
      })
    ).toBe(false);
  });

  it('verifies webhook HMAC signatures over raw payload', () => {
    const webhookSecret = 'whsec_test_12345';
    const rawBody = JSON.stringify({ event: 'payment.captured', payload: { amount: 18000 } });
    const sig = crypto.createHmac('sha256', webhookSecret).update(rawBody).digest('hex');

    expect(
      verifyRazorpayWebhookSignature({
        rawBody,
        signatureHeader: sig,
        webhookSecret
      })
    ).toBe(true);

    expect(
      verifyRazorpayWebhookSignature({
        rawBody,
        signatureHeader: 'invalid_sig',
        webhookSecret
      })
    ).toBe(false);
  });
});

describe('WhatsApp Order Formatting', () => {
  it('renders ₹20 delivery fee, ₹10 COD fee, and UTR proof cleanly', () => {
    const msg = buildWhatsAppOrderMessage({
      orderNumber: 'DQ-123456',
      items: [{ name: 'Cherry Keychain', quantity: 1, price: 150, colorName: 'Cherry Red' }],
      subtotal: 150,
      shippingFee: 20,
      codFee: 10,
      total: 180,
      paymentMethod: 'cod',
      paymentStatus: 'pending',
      upiTransactionRef: '412345678901',
      customerName: 'Aisha',
      phone: '8097706536'
    });
    expect(msg).toContain('DQ-123456');
    expect(msg).toContain('₹20');
    expect(msg).toContain('₹10');
    expect(msg).toContain('₹180');
    expect(msg).toContain('412345678901');
  });

  it('normalizes merchant WhatsApp number and builds wa.me URL', () => {
    expect(formatWhatsAppNumber('8097706536')).toBe('918097706536');
    expect(formatWhatsAppNumber('+91 80977-06536')).toBe('918097706536');
    expect(formatDisplayPhone('+91 8097706536')).toBe('8097706536');

    const url = getWhatsAppOrderUrl({
      orderNumber: 'DQ-777888',
      items: [{ name: 'Rose Charm', quantity: 1, price: 120 }],
      subtotal: 120,
      shippingFee: 20,
      total: 140,
      targetPhone: '8097706536'
    });
    expect(url.startsWith('https://wa.me/918097706536?text=')).toBe(true);
    expect(decodeURIComponent(url)).toContain('DQ-777888');
  });
});

describe('Express API Security & Validation Contracts', () => {
  let server: http.Server;
  let baseUrl = '';

  beforeAll(async () => {
    const app = createApp();
    await new Promise<void>((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
        const addr = server.address() as AddressInfo;
        baseUrl = `http://127.0.0.1:${addr.port}`;
        resolve();
      });
    });
  });

  afterAll(async () => {
    if (server) {
      server.closeAllConnections?.();
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });

  it('returns service capability flags on GET /api/health & /api/payments/config', async () => {
    const healthRes = await fetch(`${baseUrl}/api/health`);
    expect(healthRes.status).toBe(200);
    const healthJson = await healthRes.json();
    expect(healthJson.ok).toBe(true);
    expect(typeof healthJson.integrations?.razorpayConfigured).toBe('boolean');

    const payRes = await fetch(`${baseUrl}/api/payments/config`);
    expect(payRes.status).toBe(200);
    const payJson = await payRes.json();
    expect(typeof payJson.razorpayConfigured).toBe('boolean');
  });

  it('rejects empty cart and invalid shipping data on POST /api/orders/create', async () => {
    const emptyRes = await fetch(`${baseUrl}/api/orders/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: [] })
    });
    expect(emptyRes.status).toBe(400);

    const badPincodeRes = await fetch(`${baseUrl}/api/orders/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: [{ productId: 'prod-heart-clips', quantity: 1 }],
        shippingAddress: {
          fullName: 'Test Buyer',
          phone: '8097706536',
          email: 'buyer@example.com',
          addressLine1: 'Room 30',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '12345'
        },
        paymentMethod: 'cod'
      })
    });
    expect(badPincodeRes.status).toBe(400);
  });

  it('blocks unauthenticated admin order payment verification with 401', async () => {
    const res = await fetch(`${baseUrl}/api/admin/orders/order-1/verify-payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    expect(res.status).toBe(401);
  });

  it('enforces orderNumber and verification contact on POST /api/orders/track', async () => {
    const res = await fetch(`${baseUrl}/api/orders/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderNumber: 'DQ-111111' })
    });
    expect(res.status).toBe(400);
  });

  it('creates an order with authoritative server pricing, tracks it privately, and subscribes newsletter cleanly', async () => {
    const createRes = await fetch(`${baseUrl}/api/orders/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: [{ productId: 'prod-heart-hair-clips', quantity: 2 }],
        shippingAddress: {
          fullName: 'Ayesha Test',
          phone: '8097706536',
          email: 'ayesha-test@example.com',
          addressLine1: 'Room No 30, Mahim East',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400016'
        },
        paymentMethod: 'cod',
        idempotencyKey: `test-idem-${Date.now()}`
      })
    });
    expect(createRes.status).toBe(201);
    const createdJson = await createRes.json();
    expect(createdJson.order).toBeDefined();
    expect(createdJson.merchantWhatsApp).toBe('918097706536');
    expect(String(createdJson.whatsappOrderUrl || '')).toContain('https://wa.me/918097706536?text=');
    // 2 * ₹20 = ₹40 + ₹20 shipping + ₹10 COD fee = ₹70
    expect(createdJson.order.subtotal).toBe(40);
    expect(createdJson.order.shippingFee).toBe(20);
    expect(createdJson.order.codFee).toBe(10);
    expect(createdJson.order.total).toBe(70);

    // Track with wrong email -> 403
    const wrongTrack = await fetch(`${baseUrl}/api/orders/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderNumber: createdJson.order.orderNumber,
        contact: 'intruder@example.com'
      })
    });
    expect(wrongTrack.status).toBe(403);

    // Track with matching email -> 200
    const rightTrack = await fetch(`${baseUrl}/api/orders/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderNumber: createdJson.order.orderNumber,
        contact: 'ayesha-test@example.com'
      })
    });
    expect(rightTrack.status).toBe(200);
    const trackedJson = await rightTrack.json();
    expect(trackedJson.order.orderNumber).toBe(createdJson.order.orderNumber);

    // Newsletter subscription
    const newsRes = await fetch(`${baseUrl}/api/newsletter/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: `club-${Date.now()}@example.com` })
    });
    expect([200, 201]).toContain(newsRes.status);
    const newsJson = await newsRes.json();
    expect(newsJson.subscribed).toBe(true);
  });
});

