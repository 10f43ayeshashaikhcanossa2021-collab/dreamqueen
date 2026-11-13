import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import Razorpay from 'razorpay';
import { createClient } from '@supabase/supabase-js';
import type { Order, PaymentMethod, OrderTrackingStatus, Coupon, StoreSettings } from './src/types.ts';
import {
  calculateOrderTotals,
  DEFAULT_STORE_SETTINGS,
  isValidEmail,
  isValidIndianPhone,
  isValidIndianPincode,
  normalizeIndianPhone,
  validateCouponRule
} from './src/utils/pricing.ts';
import { INITIAL_COUPONS, INITIAL_PRODUCTS } from './src/data/initialProducts.ts';
import { resolveItemImage } from './src/utils/imageHelper.ts';
import {
  verifyRazorpayPaymentSignature,
  verifyRazorpayWebhookSignature
} from './src/utils/paymentCrypto.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 3000);
const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  'https://aosdiqpdpfmozuuogroz.supabase.co';
const SUPABASE_ANON_KEY =
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvc2RpcXBkcGZtb3p1dW9ncm96Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk0NTczMDUsImV4cCI6MjEwNTAzMzMwNX0.SahukijE13jnAqc65MBTcJsBygisCsEESNDQ6FsVZ9c';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || '';
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || '';
const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || '';
const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const EMAIL_FROM = process.env.EMAIL_FROM || 'DreamQueen Atelier <onboarding@resend.dev>';
const SHIPROCKET_EMAIL = process.env.SHIPROCKET_EMAIL || '';
const SHIPROCKET_PASSWORD = process.env.SHIPROCKET_PASSWORD || '';

function isRazorpayConfigured(): boolean {
  return Boolean(RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET);
}

function getRazorpayInstance(): Razorpay | null {
  if (!isRazorpayConfigured()) return null;
  return new Razorpay({
    key_id: RAZORPAY_KEY_ID,
    key_secret: RAZORPAY_KEY_SECRET
  });
}

function getSupabaseServerClient(userAccessToken?: string) {
  if (SUPABASE_SERVICE_ROLE_KEY) {
    return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false }
    });
  }
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: userAccessToken
      ? { headers: { Authorization: `Bearer ${userAccessToken}` } }
      : undefined
  });
}

function extractBearerToken(req: express.Request): string | undefined {
  const authHeader = req.headers.authorization || '';
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7).trim();
  }
  return undefined;
}

async function getAuthenticatedUser(token?: string) {
  if (!token) return null;
  const client = getSupabaseServerClient(token);
  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user;
}

async function requireAdmin(req: express.Request) {
  const token = extractBearerToken(req);
  if (!token) return { error: 'Authentication required.', status: 401 as const };
  const user = await getAuthenticatedUser(token);
  if (!user) return { error: 'Invalid or expired session.', status: 401 as const };

  const db = getSupabaseServerClient(token);
  const { data: profile, error } = await db
    .from('profiles')
    .select('id, role, email')
    .eq('id', user.id)
    .maybeSingle();

  if (error || !profile || profile.role !== 'admin') {
    return { error: 'Administrator privileges required.', status: 403 as const };
  }

  return { user, token, db };
}

async function sendTransactionalEmail(params: {
  to: string;
  subject: string;
  html: string;
}): Promise<{ sent: boolean; reason?: string }> {
  if (!RESEND_API_KEY || !params.to || !isValidEmail(params.to)) {
    return { sent: false, reason: 'RESEND_API_KEY not configured or invalid recipient.' };
  }
  try {
    const resp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: EMAIL_FROM,
        to: [params.to],
        subject: params.subject,
        html: params.html
      })
    });
    if (!resp.ok) {
      const text = await resp.text();
      return { sent: false, reason: text };
    }
    return { sent: true };
  } catch (err: any) {
    return { sent: false, reason: err?.message };
  }
}

// Simple in-memory idempotency cache to prevent accidental double clicks
const recentIdempotencyOrders = new Map<string, { order: Order; expiresAt: number }>();

function pruneIdempotencyCache() {
  const now = Date.now();
  for (const [k, v] of recentIdempotencyOrders.entries()) {
    if (v.expiresAt < now) {
      recentIdempotencyOrders.delete(k);
    }
  }
}

export function createApp() {
  const app = express();

  // Preserve raw body for Razorpay Webhook HMAC verification
  app.use(
    express.json({
      limit: '2mb',
      verify: (req: any, _res, buf) => {
        req.rawBody = buf;
      }
    })
  );

  // Health & Gateway Capability Discovery (no secrets returned!)
  app.get('/api/health', (_req, res) => {
    res.json({
      ok: true,
      service: 'dreamqueen-atelier-api',
      integrations: {
        supabaseServiceRole: Boolean(SUPABASE_SERVICE_ROLE_KEY),
        razorpayConfigured: isRazorpayConfigured(),
        razorpayWebhookConfigured: Boolean(RAZORPAY_WEBHOOK_SECRET),
        emailConfigured: Boolean(RESEND_API_KEY),
        shiprocketConfigured: Boolean(SHIPROCKET_EMAIL && SHIPROCKET_PASSWORD)
      }
    });
  });

  app.get('/api/payments/config', (_req, res) => {
    res.json({
      razorpayConfigured: isRazorpayConfigured(),
      razorpayKeyId: isRazorpayConfigured() ? RAZORPAY_KEY_ID : null
    });
  });

  // =========================================================
  // SERVER-VALIDATED ORDER CREATION (AUTHORITATIVE PRICES/STOCK)
  // =========================================================
  app.post('/api/orders/create', async (req, res) => {
    try {
      pruneIdempotencyCache();
      const {
        items,
        shippingAddress,
        paymentMethod,
        couponCode,
        notes,
        idempotencyKey
      } = req.body || {};

      if (idempotencyKey && recentIdempotencyOrders.has(String(idempotencyKey))) {
        const cached = recentIdempotencyOrders.get(String(idempotencyKey));
        if (cached && cached.expiresAt > Date.now()) {
          return res.status(200).json({ order: cached.order, deduplicated: true });
        }
      }

      if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: 'Your cart is empty.' });
      }

      const fullName = String(shippingAddress?.fullName || '').trim();
      const phone = normalizeIndianPhone(String(shippingAddress?.phone || ''));
      const email = String(shippingAddress?.email || '').trim().toLowerCase();
      const street = String(shippingAddress?.address || shippingAddress?.addressLine1 || '').trim();
      const city = String(shippingAddress?.city || '').trim();
      const state = String(shippingAddress?.state || '').trim();
      const pincode = String(shippingAddress?.pincode || '').trim();

      if (!fullName || !street || !city || !state) {
        return res.status(400).json({ error: 'Please complete all required shipping address fields.' });
      }
      if (!isValidIndianPhone(phone)) {
        return res.status(400).json({ error: 'Please enter a valid 10-digit Indian mobile number.' });
      }
      if (!isValidEmail(email)) {
        return res.status(400).json({ error: 'Please enter a valid email address.' });
      }
      if (!isValidIndianPincode(pincode)) {
        return res.status(400).json({ error: 'Please enter a valid 6-digit Indian pincode.' });
      }

      const chosenMethod: PaymentMethod =
        paymentMethod === 'razorpay' || paymentMethod === 'upi_qr' || paymentMethod === 'cod'
          ? paymentMethod
          : 'cod';

      if (chosenMethod === 'razorpay' && !isRazorpayConfigured()) {
        return res.status(503).json({
          error:
            'Razorpay server credentials are not configured yet. Please select Official UPI QR or Cash on Delivery.'
        });
      }

      const token = extractBearerToken(req);
      const authUser = await getAuthenticatedUser(token);
      const db = getSupabaseServerClient(token);

      // 1. Load authoritative store settings
      let settings: StoreSettings = { ...DEFAULT_STORE_SETTINGS };
      try {
        const { data: settingsRow } = await db
          .from('store_settings')
          .select('*')
          .eq('id', 1)
          .maybeSingle();
        if (settingsRow) {
          settings = {
            ...DEFAULT_STORE_SETTINGS,
            codEnabled: Boolean(settingsRow.cod_enabled),
            codFee: Number(settingsRow.cod_fee ?? DEFAULT_STORE_SETTINGS.codFee),
            freeShippingThreshold: Number(
              settingsRow.free_shipping_threshold ?? DEFAULT_STORE_SETTINGS.freeShippingThreshold
            ),
            standardShippingFee: Number(
              settingsRow.standard_shipping_fee ?? DEFAULT_STORE_SETTINGS.standardShippingFee
            ),
            upiId: settingsRow.upi_id || DEFAULT_STORE_SETTINGS.upiId,
            upiPayeeName: settingsRow.upi_payee_name || DEFAULT_STORE_SETTINGS.upiPayeeName
          };
        }
      } catch {}

      if (chosenMethod === 'cod' && !settings.codEnabled) {
        return res.status(400).json({ error: 'Cash on Delivery is currently disabled.' });
      }

      // 2. Load authoritative catalog products from Supabase (fallback to INITIAL_PRODUCTS only if DB empty)
      const productIds = Array.from(new Set(items.map((it: any) => String(it.productId))));
      const { data: dbProducts } = await db
        .from('products')
        .select('id, name, price, stock, images, is_active')
        .in('id', productIds);

      const productMap = new Map<
        string,
        { id: string; name: string; price: number; stock: number; images: string[]; isActive: boolean; fromDb: boolean }
      >();

      for (const row of dbProducts || []) {
        productMap.set(String(row.id), {
          id: String(row.id),
          name: row.name,
          price: Number(row.price),
          stock: Number(row.stock ?? 0),
          images: Array.isArray(row.images) ? row.images : [],
          isActive: row.is_active === undefined || row.is_active === null ? true : Boolean(row.is_active),
          fromDb: true
        });
      }

      for (const initP of INITIAL_PRODUCTS) {
        if (!productMap.has(initP.id)) {
          productMap.set(initP.id, {
            id: initP.id,
            name: initP.name,
            price: initP.price,
            stock: initP.stock,
            images: initP.images,
            isActive: true,
            fromDb: false
          });
        }
      }

      const verifiedItems: Order['items'] = [];
      for (const rawItem of items) {
        const pid = String(rawItem.productId || '');
        const qty = Math.floor(Number(rawItem.quantity || 0));
        if (!pid || qty <= 0) {
          return res.status(400).json({ error: 'Invalid item quantity in cart.' });
        }
        const catalogProduct = productMap.get(pid);
        if (!catalogProduct) {
          return res.status(400).json({ error: `Product "${pid}" could not be found.` });
        }
        if (!catalogProduct.isActive) {
          return res.status(400).json({
            error: `"${catalogProduct.name}" is currently unavailable.`
          });
        }
        if (catalogProduct.stock < qty) {
          return res.status(409).json({
            error:
              catalogProduct.stock <= 0
                ? `"${catalogProduct.name}" is out of stock.`
                : `Only ${catalogProduct.stock} unit(s) of "${catalogProduct.name}" left in stock.`
          });
        }

        verifiedItems.push({
          productId: catalogProduct.id,
          productName: catalogProduct.name,
          image: resolveItemImage(catalogProduct.id, catalogProduct.images?.[0]),
          price: catalogProduct.price,
          quantity: qty,
          color: rawItem.selectedColor || rawItem.color || { name: 'Original', hex: '#5B3A29' }
        });
      }

      // 3. Validate coupon server-side
      let matchedCoupon: Coupon | null = null;
      const cleanCouponCode = String(couponCode || '').trim().toUpperCase();
      if (cleanCouponCode) {
        const { data: couponRow } = await db
          .from('coupons')
          .select('*')
          .eq('code', cleanCouponCode)
          .maybeSingle();
        if (couponRow) {
          matchedCoupon = {
            code: couponRow.code,
            discountPercent: Number(couponRow.discount_percent || 0),
            minOrderAmount: Number(couponRow.min_order_amount || 0),
            maxDiscount: couponRow.max_discount == null ? undefined : Number(couponRow.max_discount),
            description: couponRow.description || '',
            isActive: Boolean(couponRow.is_active),
            expiresAt: couponRow.expires_at || undefined,
            maxUses: couponRow.max_uses == null ? undefined : Number(couponRow.max_uses),
            usedCount: couponRow.used_count == null ? 0 : Number(couponRow.used_count)
          };
        } else {
          matchedCoupon =
            INITIAL_COUPONS.find((c) => c.code.toUpperCase() === cleanCouponCode) || null;
        }

        const provisionalSubtotal = verifiedItems.reduce((s, it) => s + it.price * it.quantity, 0);
        const validation = validateCouponRule(matchedCoupon, provisionalSubtotal);
        if (!validation.valid) {
          return res.status(400).json({ error: validation.reason || 'Invalid coupon code.' });
        }
      }

      // 4. Calculate authoritative totals
      const pricing = calculateOrderTotals({
        items: verifiedItems.map((it) => ({ price: it.price, quantity: it.quantity })),
        coupon: matchedCoupon,
        settings,
        paymentMethod: chosenMethod
      });

      const orderId = `ord-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
      const orderNumber = `DQ-${Math.floor(100000 + Math.random() * 900000)}`;
      const nowIso = new Date().toISOString();
      const initialTrackingStatus: OrderTrackingStatus =
        chosenMethod === 'cod' ? 'preparing' : 'payment_pending';

      const newOrder: Order = {
        id: orderId,
        orderNumber,
        userId: authUser?.id,
        createdAt: nowIso,
        customer: { name: fullName, email, phone },
        shippingAddress: {
          fullName,
          phone,
          email,
          address: street,
          addressLine1: street,
          addressLine2: String(shippingAddress?.addressLine2 || '').trim(),
          city,
          state,
          pincode
        },
        items: verifiedItems,
        subtotal: pricing.subtotal,
        discount: pricing.discount,
        couponCode: matchedCoupon ? matchedCoupon.code : undefined,
        shippingFee: pricing.shippingFee,
        codFee: pricing.codFee,
        total: pricing.total,
        paymentMethod: chosenMethod,
        paymentStatus: 'pending',
        trackingStatus: initialTrackingStatus,
        estimatedDeliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString(
          'en-IN',
          { day: 'numeric', month: 'short', year: 'numeric' }
        ),
        notes: String(notes || '').trim() || undefined,
        statusHistory: [
          {
            status: initialTrackingStatus,
            timestamp: nowIso,
            note:
              chosenMethod === 'cod'
                ? 'Order placed with Cash on Delivery'
                : 'Order created — awaiting payment completion'
          }
        ]
      };

      // 5. Persist order, order_items, payment record & decrement stock in Supabase
      const { error: insertOrderErr } = await db.from('orders').insert({
        id: newOrder.id,
        order_number: newOrder.orderNumber,
        user_id: authUser?.id || null,
        customer: newOrder.customer,
        shipping_address: newOrder.shippingAddress,
        items: newOrder.items,
        subtotal: newOrder.subtotal,
        discount: newOrder.discount,
        coupon_code: newOrder.couponCode || null,
        shipping_fee: newOrder.shippingFee,
        cod_fee: newOrder.codFee,
        total: newOrder.total,
        payment_method: newOrder.paymentMethod,
        payment_status: newOrder.paymentStatus,
        tracking_status: newOrder.trackingStatus,
        estimated_delivery_date: newOrder.estimatedDeliveryDate,
        notes: newOrder.notes || null,
        status_history: newOrder.statusHistory,
        created_at: newOrder.createdAt
      });

      if (insertOrderErr) {
        return res.status(400).json({
          error: `Could not persist order: ${insertOrderErr.message}`
        });
      }

      // Insert normalized order_items (non-fatal if table not yet migrated)
      await db
        .from('order_items')
        .insert(
          verifiedItems.map((it, idx) => ({
            id: `${newOrder.id}-item-${idx + 1}`,
            order_id: newOrder.id,
            product_id: it.productId,
            product_name: it.productName,
            image: it.image,
            unit_price: it.price,
            quantity: it.quantity,
            selected_color: it.color,
            line_total: it.price * it.quantity
          }))
        )
        .then(() => undefined, () => undefined);

      // Insert initial payments ledger row (uses service_role when configured)
      await db
        .from('payments')
        .insert({
          id: `pay-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
          order_id: newOrder.id,
          order_number: newOrder.orderNumber,
          user_id: authUser?.id || null,
          gateway: newOrder.paymentMethod,
          amount: newOrder.total,
          currency: 'INR',
          status: 'pending'
        })
        .then(() => undefined, () => undefined);

      // Deduct stock if service_role is available (otherwise admin/trigger handles)
      if (SUPABASE_SERVICE_ROLE_KEY) {
        for (const it of verifiedItems) {
          const prod = productMap.get(it.productId);
          if (prod?.fromDb) {
            await db
              .from('products')
              .update({
                stock: Math.max(0, prod.stock - it.quantity),
                updated_at: nowIso
              })
              .eq('id', it.productId);
          }
        }
        if (matchedCoupon) {
          await db
            .from('coupons')
            .update({ used_count: (matchedCoupon.usedCount || 0) + 1, updated_at: nowIso })
            .eq('code', matchedCoupon.code);
        }
      }

      if (idempotencyKey) {
        recentIdempotencyOrders.set(String(idempotencyKey), {
          order: newOrder,
          expiresAt: Date.now() + 5 * 60 * 1000
        });
      }

      // Optional order confirmation email if Resend configured
      sendTransactionalEmail({
        to: email,
        subject: `DreamQueen Order Confirmed — ${newOrder.orderNumber}`,
        html: `<h2>Thank you for ordering from DreamQueen Atelier, ${fullName}!</h2>
          <p>Order Number: <strong>${newOrder.orderNumber}</strong></p>
          <p>Total: <strong>₹${newOrder.total}</strong> (${newOrder.paymentMethod.toUpperCase()})</p>
          <p>Estimated Delivery: ${newOrder.estimatedDeliveryDate}</p>
          <p>Questions? Reply on WhatsApp +91 8097706536.</p>`
      }).catch(() => undefined);

      return res.status(201).json({ order: newOrder });
    } catch (err: any) {
      return res.status(500).json({ error: err?.message || 'Internal checkout error.' });
    }
  });

  // =========================================================
  // RAZORPAY REAL PAYMENT GATEWAY
  // =========================================================
  app.post('/api/payments/razorpay/create-order', async (req, res) => {
    const rzp = getRazorpayInstance();
    if (!rzp) {
      return res.status(503).json({
        configured: false,
        error: 'Razorpay is not configured (missing RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET).'
      });
    }

    try {
      const { orderId, orderNumber } = req.body || {};
      const token = extractBearerToken(req);
      const db = getSupabaseServerClient(token);

      const { data: orderRow, error } = await db
        .from('orders')
        .select('*')
        .or(`id.eq.${orderId},order_number.eq.${orderNumber}`)
        .maybeSingle();

      if (error || !orderRow) {
        return res.status(404).json({ error: 'Order not found.' });
      }
      if (orderRow.payment_status === 'paid') {
        return res.status(400).json({ error: 'Order is already paid.' });
      }

      const amountPaise = Math.round(Number(orderRow.total) * 100);
      const rzpOrder = await rzp.orders.create({
        amount: amountPaise,
        currency: 'INR',
        receipt: orderRow.order_number,
        notes: {
          dreamqueen_order_id: orderRow.id,
          dreamqueen_order_number: orderRow.order_number
        }
      });

      await db
        .from('orders')
        .update({ razorpay_order_id: rzpOrder.id, updated_at: new Date().toISOString() })
        .eq('id', orderRow.id);

      await db
        .from('payments')
        .update({ gateway_order_id: rzpOrder.id, updated_at: new Date().toISOString() })
        .eq('order_id', orderRow.id);

      return res.json({
        configured: true,
        keyId: RAZORPAY_KEY_ID,
        razorpayOrderId: rzpOrder.id,
        amount: rzpOrder.amount,
        currency: rzpOrder.currency
      });
    } catch (err: any) {
      return res.status(500).json({ error: err?.message || 'Could not create Razorpay order.' });
    }
  });

  app.post('/api/payments/razorpay/verify', async (req, res) => {
    if (!isRazorpayConfigured()) {
      return res.status(503).json({ error: 'Razorpay is not configured.' });
    }

    try {
      const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body || {};
      const isValid = verifyRazorpayPaymentSignature({
        razorpayOrderId: String(razorpay_order_id || ''),
        razorpayPaymentId: String(razorpay_payment_id || ''),
        razorpaySignature: String(razorpay_signature || ''),
        secret: RAZORPAY_KEY_SECRET
      });

      const db = getSupabaseServerClient(extractBearerToken(req));
      const nowIso = new Date().toISOString();

      if (!isValid) {
        if (orderId) {
          await db
            .from('orders')
            .update({ payment_status: 'failed', updated_at: nowIso })
            .eq('id', orderId);
        }
        return res.status(400).json({ verified: false, error: 'Invalid payment signature.' });
      }

      const { data: updated } = await db
        .from('orders')
        .update({
          payment_status: 'paid',
          tracking_status: 'payment_confirmed',
          razorpay_order_id,
          razorpay_payment_id,
          payment_verified_at: nowIso,
          updated_at: nowIso
        })
        .eq('id', orderId)
        .select('*')
        .maybeSingle();

      await db
        .from('payments')
        .update({
          status: 'paid',
          gateway_order_id: razorpay_order_id,
          gateway_payment_id: razorpay_payment_id,
          gateway_signature: razorpay_signature,
          updated_at: nowIso
        })
        .eq('order_id', orderId);

      return res.json({ verified: true, order: updated });
    } catch (err: any) {
      return res.status(500).json({ error: err?.message || 'Payment verification failed.' });
    }
  });

  app.post('/api/payments/razorpay/webhook', async (req: any, res) => {
    if (!RAZORPAY_WEBHOOK_SECRET) {
      return res.status(503).json({ error: 'Razorpay webhook secret not configured.' });
    }
    const signature = String(req.headers['x-razorpay-signature'] || '');
    const valid = verifyRazorpayWebhookSignature({
      rawBody: req.rawBody || JSON.stringify(req.body || {}),
      signatureHeader: signature,
      webhookSecret: RAZORPAY_WEBHOOK_SECRET
    });

    if (!valid) {
      return res.status(400).json({ error: 'Invalid webhook signature.' });
    }

    const event = req.body?.event;
    const paymentEntity = req.body?.payload?.payment?.entity;
    const rzpOrderId = paymentEntity?.order_id;
    const rzpPaymentId = paymentEntity?.id;
    const db = getSupabaseServerClient();
    const nowIso = new Date().toISOString();

    if (event === 'payment.captured' && rzpOrderId) {
      await db
        .from('orders')
        .update({
          payment_status: 'paid',
          tracking_status: 'payment_confirmed',
          razorpay_payment_id: rzpPaymentId,
          payment_verified_at: nowIso,
          updated_at: nowIso
        })
        .eq('razorpay_order_id', rzpOrderId);

      await db
        .from('payments')
        .update({
          status: 'paid',
          gateway_payment_id: rzpPaymentId,
          updated_at: nowIso
        })
        .eq('gateway_order_id', rzpOrderId);
    } else if (event === 'payment.failed' && rzpOrderId) {
      await db
        .from('orders')
        .update({ payment_status: 'failed', updated_at: nowIso })
        .eq('razorpay_order_id', rzpOrderId);
      await db
        .from('payments')
        .update({ status: 'failed', updated_at: nowIso })
        .eq('gateway_order_id', rzpOrderId);
    } else if (event === 'refund.processed' && rzpPaymentId) {
      await db
        .from('orders')
        .update({
          payment_status: 'refunded',
          tracking_status: 'refunded',
          refund_status: 'processed',
          updated_at: nowIso
        })
        .eq('razorpay_payment_id', rzpPaymentId);
    }

    return res.json({ received: true });
  });

  // =========================================================
  // UPI QR TRANSACTION REFERENCE SUBMISSION (REMAINS PENDING UNTIL VERIFIED)
  // =========================================================
  app.post('/api/payments/upi/submit-utr', async (req, res) => {
    try {
      const { orderId, utr } = req.body || {};
      const cleanUtr = String(utr || '').trim();
      if (!orderId || cleanUtr.length < 6) {
        return res.status(400).json({
          error: 'Please enter a valid UPI Transaction / UTR Reference (at least 6 characters).'
        });
      }

      const db = getSupabaseServerClient(extractBearerToken(req));
      const nowIso = new Date().toISOString();
      // Keep payment_status = 'pending' until an Admin verifies receipt!
      const { error } = await db
        .from('orders')
        .update({
          upi_transaction_ref: cleanUtr,
          payment_status: 'pending',
          tracking_status: 'payment_pending',
          updated_at: nowIso
        })
        .eq('id', orderId);

      if (error) {
        return res.status(400).json({ error: error.message });
      }

      await db
        .from('payments')
        .update({
          upi_transaction_ref: cleanUtr,
          status: 'pending',
          updated_at: nowIso
        })
        .eq('order_id', orderId)
        .then(() => undefined, () => undefined);

      return res.json({
        success: true,
        paymentStatus: 'pending',
        message: 'UTR recorded! Payment stays pending until verified by our studio.'
      });
    } catch (err: any) {
      return res.status(500).json({ error: err?.message || 'Failed to record UPI reference.' });
    }
  });

  // =========================================================
  // PRIVACY-SAFE ORDER TRACKING LOOKUP
  // =========================================================
  app.post('/api/orders/track', async (req, res) => {
    try {
      const orderNumber = String(req.body?.orderNumber || '').trim().toUpperCase();
      const contact = String(req.body?.contact || '').trim();
      const token = extractBearerToken(req);

      if (!orderNumber) {
        return res.status(400).json({ error: 'Order number is required.' });
      }

      const authUser = await getAuthenticatedUser(token);
      if (!authUser && !contact) {
        return res.status(400).json({
          error: 'Please enter the matching email or 10-digit phone number for this order.'
        });
      }

      const db = getSupabaseServerClient(token);
      // Try secure RPC first
      const { data: rpcOrder } = await db.rpc('track_order_secure', {
        p_order_number: orderNumber,
        p_contact: contact
      });

      if (rpcOrder) {
        return res.json({ order: rpcOrder });
      }

      // Direct service-role / authenticated query check with explicit ownership verification
      if (SUPABASE_SERVICE_ROLE_KEY || authUser) {
        const { data: row } = await db
          .from('orders')
          .select('*')
          .ilike('order_number', orderNumber)
          .maybeSingle();

        if (!row) {
          return res.status(404).json({ error: 'No matching order found.' });
        }

        const cleanContact = contact.toLowerCase();
        const digits = normalizeIndianPhone(contact);
        const orderEmail = String(
          row.customer?.email || row.shipping_address?.email || ''
        ).toLowerCase();
        const orderPhone = normalizeIndianPhone(
          String(row.customer?.phone || row.shipping_address?.phone || '')
        );

        const authorized =
          (authUser && (row.user_id === authUser.id || authUser.email?.toLowerCase() === orderEmail)) ||
          (cleanContact && orderEmail === cleanContact) ||
          (digits.length === 10 && orderPhone === digits);

        if (!authorized) {
          return res.status(403).json({
            error: 'Please enter the matching email or 10-digit phone number for this order.'
          });
        }

        return res.json({ order: row });
      }

      return res.status(404).json({
        error: 'Order not found or contact details did not match.'
      });
    } catch (err: any) {
      return res.status(500).json({ error: err?.message || 'Unable to track order right now.' });
    }
  });

  // =========================================================
  // NEWSLETTER SUBSCRIPTION
  // =========================================================
  app.post('/api/newsletter/subscribe', async (req, res) => {
    try {
      const email = String(req.body?.email || '').trim().toLowerCase();
      if (!isValidEmail(email)) {
        return res.status(400).json({ error: 'Please enter a valid email address.' });
      }

      const db = getSupabaseServerClient();
      const { error } = await db.from('newsletter_subscribers').insert({
        id: `sub-${Date.now()}`,
        email,
        status: 'active',
        source: 'website'
      });

      if (error) {
        if (error.code === '23505') {
          return res.json({
            subscribed: true,
            alreadySubscribed: true,
            message: 'You are already part of the DreamQueen Crochet Club! Use code DREAM10 at checkout.'
          });
        }
        return res.status(400).json({ error: error.message });
      }

      return res.status(201).json({
        subscribed: true,
        message: 'Welcome to DreamQueen! Use code DREAM10 for 10% off.'
      });
    } catch (err: any) {
      return res.status(500).json({ error: err?.message || 'Subscription failed.' });
    }
  });

  // =========================================================
  // PROTECTED ADMIN ACTIONS (Role Verified Server-Side)
  // =========================================================
  app.post('/api/admin/orders/:id/verify-payment', async (req, res) => {
    const auth = await requireAdmin(req);
    if ('error' in auth) return res.status(auth.status).json({ error: auth.error });

    const { id } = req.params;
    const nowIso = new Date().toISOString();

    const { error } = await auth.db
      .from('orders')
      .update({
        payment_status: 'paid',
        payment_verified_at: nowIso,
        tracking_status: 'preparing',
        updated_at: nowIso
      })
      .eq('id', id);

    if (error) return res.status(400).json({ error: error.message });

    await auth.db
      .from('payments')
      .update({ status: 'paid', updated_at: nowIso })
      .eq('order_id', id);

    return res.json({ success: true });
  });

  app.patch('/api/admin/orders/:id/status', async (req, res) => {
    const auth = await requireAdmin(req);
    if ('error' in auth) return res.status(auth.status).json({ error: auth.error });

    const { id } = req.params;
    const { trackingStatus, shiprocketTrackingNumber, cancellationReason } = req.body || {};
    const nowIso = new Date().toISOString();

    const updates: Record<string, any> = {
      tracking_status: trackingStatus,
      updated_at: nowIso
    };
    if (shiprocketTrackingNumber !== undefined) {
      updates.shiprocket_tracking_number = shiprocketTrackingNumber;
    }
    if (cancellationReason !== undefined) {
      updates.cancellation_reason = cancellationReason;
    }

    const { data: orderRow, error } = await auth.db
      .from('orders')
      .update(updates)
      .eq('id', id)
      .select('*')
      .maybeSingle();

    if (error) return res.status(400).json({ error: error.message });

    if (orderRow?.customer?.email) {
      sendTransactionalEmail({
        to: orderRow.customer.email,
        subject: `Order ${orderRow.order_number} Update — ${String(trackingStatus).replace(/_/g, ' ')}`,
        html: `<p>Your DreamQueen order <strong>${orderRow.order_number}</strong> status is now: <strong>${String(trackingStatus).replace(/_/g, ' ').toUpperCase()}</strong>.</p>
          ${shiprocketTrackingNumber ? `<p>Tracking #: <strong>${shiprocketTrackingNumber}</strong></p>` : ''}`
      }).catch(() => undefined);
    }

    return res.json({ success: true, order: orderRow });
  });

  app.post('/api/admin/orders/:id/refund', async (req, res) => {
    const auth = await requireAdmin(req);
    if ('error' in auth) return res.status(auth.status).json({ error: auth.error });

    const { id } = req.params;
    const { data: orderRow } = await auth.db
      .from('orders')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (!orderRow) return res.status(404).json({ error: 'Order not found.' });

    const nowIso = new Date().toISOString();
    let refundId: string | null = null;
    let nextPaymentStatus: 'refund_initiated' | 'refunded' = 'refund_initiated';

    if (orderRow.razorpay_payment_id && isRazorpayConfigured()) {
      const rzp = getRazorpayInstance()!;
      const refund = await rzp.payments.refund(orderRow.razorpay_payment_id, {
        amount: Math.round(Number(orderRow.total) * 100)
      });
      refundId = refund.id;
      nextPaymentStatus = 'refunded';
    }

    const { error } = await auth.db
      .from('orders')
      .update({
        payment_status: nextPaymentStatus,
        tracking_status: nextPaymentStatus,
        refund_status: nextPaymentStatus,
        refund_id: refundId,
        updated_at: nowIso
      })
      .eq('id', id);

    if (error) return res.status(400).json({ error: error.message });

    await auth.db
      .from('payments')
      .update({ status: nextPaymentStatus, updated_at: nowIso })
      .eq('order_id', id);

    return res.json({ success: true, refundStatus: nextPaymentStatus, refundId });
  });

  app.post('/api/shipping/shiprocket/create', async (req, res) => {
    const auth = await requireAdmin(req);
    if ('error' in auth) return res.status(auth.status).json({ error: auth.error });

    if (!SHIPROCKET_EMAIL || !SHIPROCKET_PASSWORD) {
      return res.status(503).json({
        configured: false,
        error:
          'Shiprocket API credentials (SHIPROCKET_EMAIL / SHIPROCKET_PASSWORD) are not configured. Enter a manual courier tracking number instead.'
      });
    }

    return res.status(501).json({
      configured: true,
      error: 'Connect live Shiprocket pickup location ID in .env before dispatching automated API shipments.'
    });
  });

  return app;
}

async function startServer() {
  const app = createApp();
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`DreamQueen Atelier server running on http://0.0.0.0:${PORT}`);
  });
}

// Only start HTTP listener when executed as entrypoint (not during Vitest imports)
if (process.env.VITEST !== 'true') {
  startServer().catch((err) => {
    console.error('Failed to start DreamQueen server:', err);
    process.exit(1);
  });
}
