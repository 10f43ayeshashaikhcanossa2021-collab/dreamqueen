import { createClient } from '@supabase/supabase-js';
import {
  Order,
  PurchasedItemFeedback,
  CustomOrderRequest,
  Product,
  Coupon,
  StoreSettings,
  OrderTrackingStatus
} from '../types';

// Supabase configuration provided by the user
const env = (import.meta as any)?.env || {};
export const SUPABASE_URL =
  env.VITE_SUPABASE_URL ||
  env.NEXT_PUBLIC_SUPABASE_URL ||
  'https://aosdiqpdpfmozuuogroz.supabase.co';

export const SUPABASE_ANON_KEY =
  env.VITE_SUPABASE_ANON_KEY ||
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvc2RpcXBkcGZtb3p1dW9ncm96Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk0NTczMDUsImV4cCI6MjEwNTAzMzMwNX0.SahukijE13jnAqc65MBTcJsBygisCsEESNDQ6FsVZ9c';

// Create and export the Supabase client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);


/**
 * Product synchronization helpers.
 *
 * Products are store-wide data, so they must live in Supabase rather than
 * browser localStorage. These helpers convert between the app's camelCase
 * Product shape and the products table's snake_case columns.
 */
export function productFromSupabaseRow(row: any): Product {
  let colors = row.colors;
  if (typeof colors === 'string') {
    try {
      colors = JSON.parse(colors);
    } catch {
      colors = [{ name: 'Original', hex: '#5B3A29' }];
    }
  }
  if (!Array.isArray(colors) || colors.length === 0) {
    colors = [{ name: 'Original', hex: '#5B3A29' }];
  }

  let images = row.images;
  if (typeof images === 'string') {
    try {
      images = JSON.parse(images);
    } catch {
      images = [images];
    }
  }
  if (!Array.isArray(images) || images.length === 0) {
    images = ['https://images.unsplash.com/photo-1584992236310-6edddc08acff?w=600&auto=format&fit=crop&q=80'];
  }

  let tags = row.tags;
  if (typeof tags === 'string') {
    try {
      tags = JSON.parse(tags);
    } catch {
      tags = ['crochet', 'handmade'];
    }
  }
  if (!Array.isArray(tags)) {
    tags = ['crochet', 'handmade'];
  }

  return {
    id: String(row.id),
    name: row.name || 'Handmade Crochet Piece',
    tagline: row.tagline || 'Handmade with gentle touch',
    price: Number(row.price || 0),
    originalPrice:
      row.original_price === null || row.original_price === undefined
        ? undefined
        : Number(row.original_price),
    rating: Number(row.rating ?? 5),
    reviewsCount: Number(row.reviews_count ?? 0),
    category: row.category as Product['category'],
    images,
    stock: Number(row.stock ?? 0),
    colors,
    description: row.description || '',
    yarnType: row.yarn_type || '100% Milk Cotton Yarn',
    careInstructions: row.care_instructions || 'Gentle hand wash in cold water.',
    tags,
    isBestSeller: Boolean(row.is_best_seller),
    isNewArrival: Boolean(row.is_new_arrival),
    isFeatured: Boolean(row.is_featured),
  };
}

export function productToSupabaseRow(product: Product) {
  return {
    id: product.id,
    name: product.name,
    tagline: product.tagline || '',
    price: product.price,
    original_price: product.originalPrice ?? null,
    rating: product.rating ?? 5,
    reviews_count: product.reviewsCount ?? 0,
    category: product.category,
    images: product.images || [],
    stock: product.stock ?? 0,
    colors: product.colors || [],
    description: product.description || '',
    yarn_type: product.yarnType || '',
    care_instructions: product.careInstructions || '',
    tags: product.tags || [],
    is_best_seller: Boolean(product.isBestSeller),
    is_new_arrival: Boolean(product.isNewArrival),
    is_featured: Boolean(product.isFeatured),
    updated_at: new Date().toISOString(),
  };
}

export async function fetchProductsFromSupabase(): Promise<Product[]> {
  // Query without unindexed server-side sorting to avoid PostgreSQL 57014 statement timeout on large image arrays
  const { data, error } = await supabase
    .from('products')
    .select('*');

  if (error) throw error;
  const list = (data || []).map(productFromSupabaseRow);
  return list.sort((a, b) => {
    const timeA = (a as any).updated_at || (a as any).updatedAt || a.id;
    const timeB = (b as any).updated_at || (b as any).updatedAt || b.id;
    return String(timeB).localeCompare(String(timeA));
  });
}

export async function upsertProductToSupabase(product: Product): Promise<void> {
  const { error } = await supabase
    .from('products')
    .upsert(productToSupabaseRow(product), { onConflict: 'id' });

  if (error) throw error;
}

export async function deleteProductFromSupabase(id: string): Promise<void> {
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) throw error;
}

/**
 * Seed the cloud catalog only when the products table is empty.
 * This prevents a device's localStorage from becoming the source of truth.
 */
export async function seedInitialProductsToSupabase(products: Product[]): Promise<Product[]> {
  if (!products.length) return [];

  const { error } = await supabase
    .from('products')
    .upsert(products.map(productToSupabaseRow), { onConflict: 'id' });

  if (error) throw error;
  return products;
}

export interface SupabaseHealthStatus {
  connected: boolean;
  url: string;
  latencyMs: number;
  message: string;
  tables: {
    orders: boolean;
    custom_orders: boolean;
    feedbacks: boolean;
    products: boolean;
  };
}

/**
 * Checks connectivity and verifies which tables currently exist in the database.
 */
export async function testSupabaseHealth(): Promise<SupabaseHealthStatus> {
  const start = performance.now();
  const tables = {
    orders: false,
    custom_orders: false,
    feedbacks: false,
    products: false
  };

  try {
    // Quick test against Supabase endpoint
    const [ordersRes, customRes, feedbacksRes, productsRes] = await Promise.all([
      supabase.from('orders').select('id').limit(1),
      supabase.from('custom_orders').select('id').limit(1),
      supabase.from('feedbacks').select('id').limit(1),
      supabase.from('products').select('id').limit(1)
    ]);

    tables.orders = !ordersRes.error;
    tables.custom_orders = !customRes.error;
    tables.feedbacks = !feedbacksRes.error;
    tables.products = !productsRes.error;

    const latencyMs = Math.round(performance.now() - start);

    return {
      connected: true,
      url: SUPABASE_URL,
      latencyMs,
      message: 'Supabase cloud endpoint reachable and responding.',
      tables
    };
  } catch (error: any) {
    const latencyMs = Math.round(performance.now() - start);
    return {
      connected: false,
      url: SUPABASE_URL,
      latencyMs,
      message: error?.message || 'Failed to ping Supabase.',
      tables
    };
  }
}

/**
 * Persists an order to Supabase orders table (with fallback).
 */

export function orderFromSupabaseRow(row: any): Order {
  let customer = row.customer;
  if (typeof customer === 'string') {
    try {
      customer = JSON.parse(customer);
    } catch {
      customer = { name: '', email: '', phone: '' };
    }
  }

  let shippingAddress = row.shipping_address;
  if (typeof shippingAddress === 'string') {
    try {
      shippingAddress = JSON.parse(shippingAddress);
    } catch {
      shippingAddress = { fullName: '', phone: '', email: '', address: '', city: '', state: '', pincode: '' };
    }
  }

  let items = row.items;
  if (typeof items === 'string') {
    try {
      items = JSON.parse(items);
    } catch {
      items = [];
    }
  }

  const street = shippingAddress?.address || shippingAddress?.addressLine1 || '';
  const normalizedAddress = {
    fullName: shippingAddress?.fullName || customer?.name || 'Customer',
    phone: shippingAddress?.phone || customer?.phone || '',
    email: shippingAddress?.email || customer?.email || '',
    address: street,
    addressLine1: street,
    addressLine2: shippingAddress?.addressLine2 || '',
    city: shippingAddress?.city || '',
    state: shippingAddress?.state || '',
    pincode: shippingAddress?.pincode || '',
  };

  const normalizedCustomer = {
    name: customer?.name || shippingAddress?.fullName || 'Customer',
    email: customer?.email || shippingAddress?.email || '',
    phone: customer?.phone || shippingAddress?.phone || '',
  };

  return {
    id: String(row.id),
    orderNumber: row.order_number || '',
    customer: normalizedCustomer,
    shippingAddress: normalizedAddress,
    items: Array.isArray(items) ? items : [],
    subtotal: Number(row.subtotal || 0),
    discount: Number(row.discount || 0),
    couponCode: row.coupon_code || undefined,
    shippingFee: Number(row.shipping_fee || 0),
    codFee: Number(row.cod_fee || 0),
    total: Number(row.total || 0),
    paymentMethod: row.payment_method,
    paymentStatus: row.payment_status,
    razorpayPaymentId: row.razorpay_payment_id || undefined,
    razorpayOrderId: row.razorpay_order_id || undefined,
    trackingStatus: row.tracking_status || 'preparing',
    shiprocketTrackingNumber: row.shiprocket_tracking_number || undefined,
    estimatedDeliveryDate: row.estimated_delivery_date || '',
    notes: row.notes || undefined,
    createdAt: row.created_at || new Date().toISOString()
  };
}

export async function fetchOrdersFromSupabase(): Promise<Order[]> {
  const { data, error } = await supabase
    .from('orders')
    .select('*');
  if (error) throw error;
  const orders = (data || []).map(orderFromSupabaseRow);
  return orders.sort((a, b) => {
    return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
  });
}

export async function fetchCustomOrdersFromSupabase(): Promise<CustomOrderRequest[]> {
  const { data, error } = await supabase
    .from('custom_orders')
    .select('*');
  if (error) throw error;
  const list = (data || []).map((row: any) => ({
    id: String(row.id),
    customerName: row.customer_name || '',
    email: row.email || '',
    phone: row.phone || '',
    category: row.category || '',
    colorPreference: row.color_preference || '',
    size: row.size || '',
    budget: row.budget || '',
    deliveryDatePreference: row.delivery_date_preference || '',
    referenceImageUrl: row.reference_image_url || undefined,
    message: row.message || '',
    status: row.status || 'submitted',
    createdAt: row.created_at || new Date().toISOString()
  }));
  return list.sort((a, b) => {
    return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
  });
}

export async function fetchCurrentProfile(): Promise<any | null> {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return null;
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function updateCurrentProfile(name: string, phone: string): Promise<void> {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) throw new Error('No authenticated user');
  const { error } = await supabase
    .from('profiles')
    .upsert({ id: user.id, full_name: name, email: user.email || '', phone, updated_at: new Date().toISOString() }, { onConflict: 'id' });
  if (error) throw error;
  const { error: authError } = await supabase.auth.updateUser({ data: { full_name: name, phone } });
  if (authError) throw authError;
}

export async function syncOrderToSupabase(
  order: Order
): Promise<{ success: boolean; error?: string }> {
  try {
    const shipping = order.shippingAddress || ({} as any);
    const streetAddr = shipping.address || shipping.addressLine1 || '';

    const orderRow = {
      id: order.id,
      order_number: order.orderNumber,

      customer: {
        name: order.customer?.name || shipping.fullName || 'Valued Customer',
        email: order.customer?.email || shipping.email || '',
        phone: order.customer?.phone || shipping.phone || '',
      },

      shipping_address: {
        fullName: shipping.fullName || order.customer?.name || 'Valued Customer',
        phone: shipping.phone || order.customer?.phone || '',
        email: shipping.email || order.customer?.email || '',
        address: streetAddr,
        addressLine1: streetAddr,
        addressLine2: shipping.addressLine2 || '',
        city: shipping.city || '',
        state: shipping.state || '',
        pincode: shipping.pincode || '',
      },

      items: order.items ?? [],

      subtotal: Number(order.subtotal ?? 0),
      discount: Number(order.discount ?? 0),
      coupon_code: order.couponCode ?? null,
      shipping_fee: Number(order.shippingFee ?? 0),
      cod_fee: Number(order.codFee ?? 0),
      total: Number(order.total ?? 0),

      payment_method: order.paymentMethod ?? 'cod',
      payment_status: order.paymentStatus ?? 'pending',

      razorpay_payment_id: order.razorpayPaymentId ?? null,
      razorpay_order_id: order.razorpayOrderId ?? null,

      tracking_status: order.trackingStatus ?? 'preparing',
      shiprocket_tracking_number: order.shiprocketTrackingNumber ?? null,
      estimated_delivery_date: order.estimatedDeliveryDate ?? null,
      notes: order.notes ?? null,

      created_at: order.createdAt || new Date().toISOString(),
    };

    console.log('[Supabase] Syncing order to database:', order.orderNumber);

    const { error } = await supabase
      .from('orders')
      .upsert(orderRow, {
        onConflict: 'id',
      });

    if (error) {
      console.error('[Supabase] ORDER SAVE FAILED:', error.message);
      return {
        success: false,
        error: error.message,
      };
    }

    console.log('[Supabase] ORDER SAVED SUCCESSFULLY:', order.orderNumber);
    return {
      success: true,
    };
  } catch (err: any) {
    console.error('[Supabase] Unexpected order sync error:', err);
    return {
      success: false,
      error: err?.message || 'Unknown Supabase order error',
    };
  }
}

/**
 * Persists a custom order request to Supabase.
 */
export async function syncCustomOrderToSupabase(
  customOrder: CustomOrderRequest
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.from('custom_orders').upsert({
      id: customOrder.id,
      customer_name: customOrder.customerName,
      email: customOrder.email,
      phone: customOrder.phone,
      category: customOrder.category,
      color_preference: customOrder.colorPreference,
      size: customOrder.size,
      budget: customOrder.budget,
      delivery_date_preference: customOrder.deliveryDatePreference,
      reference_image_url: customOrder.referenceImageUrl,
      message: customOrder.message,
      status: customOrder.status,
      created_at: customOrder.createdAt
    });

    if (error) {
      console.warn('[Supabase] custom_orders sync notice:', error.message);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    console.warn('[Supabase] Sync custom order error:', err);
    return { success: false, error: err?.message };
  }
}

/**
 * Persists customer feedback to Supabase.
 */
export async function syncFeedbackToSupabase(
  feedback: PurchasedItemFeedback
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
  .from('feedbacks')
  .upsert(
    {
      id: feedback.id,
      order_id: feedback.orderId,
      order_number: feedback.orderNumber,
      product_id: feedback.productId,
      product_name: feedback.productName,
      product_image: feedback.productImage,
      selected_color: feedback.selectedColor,
      customer_name: feedback.customerName,
      customer_email: feedback.customerEmail,
      rating: feedback.rating,
      headline: feedback.headline,
      comment: feedback.comment,
      tags: feedback.tags,
      photo_url: feedback.photoUrl ?? null,
      recommend: feedback.recommend,
      artisan_response: feedback.artisanResponse,
      created_at: feedback.createdAt
    },
    {
      onConflict: 'id'
    }
  );

    if (error) {
      console.warn('[Supabase] feedbacks sync notice:', error.message);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    console.warn('[Supabase] Sync feedback error:', err);
    return { success: false, error: err?.message };
  }
}

/**
 * Ready-to-use PostgreSQL schema script for Supabase SQL Editor.
 */
export const SUPABASE_SQL_SCHEMA = `-- DreamQueen Atelier Database Schema for Supabase
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard/project/aosdiqpdpfmozuuogroz/sql)

-- 1. Orders Table
CREATE TABLE IF NOT EXISTS public.orders (
    id TEXT PRIMARY KEY,
    order_number TEXT NOT NULL,
    customer JSONB NOT NULL,
    shipping_address JSONB NOT NULL,
    items JSONB NOT NULL,
    subtotal NUMERIC NOT NULL,
    discount NUMERIC DEFAULT 0,
    coupon_code TEXT,
    shipping_fee NUMERIC DEFAULT 0,
    cod_fee NUMERIC DEFAULT 0,
    total NUMERIC NOT NULL,
    payment_method TEXT NOT NULL,
    payment_status TEXT NOT NULL,
    razorpay_payment_id TEXT,
    razorpay_order_id TEXT,
    tracking_status TEXT DEFAULT 'preparing',
    shiprocket_tracking_number TEXT,
    estimated_delivery_date TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- 2. Custom Orders / Commissions Table
CREATE TABLE IF NOT EXISTS public.custom_orders (
    id TEXT PRIMARY KEY,
    customer_name TEXT NOT NULL,
    email TEXT,
    phone TEXT NOT NULL,
    category TEXT,
    color_preference TEXT,
    size TEXT,
    budget TEXT,
    delivery_date_preference TEXT,
    reference_image_url TEXT,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'submitted',
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- 3. Purchased Item Feedbacks & Reviews Table
CREATE TABLE IF NOT EXISTS public.feedbacks (
    id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL,
    order_number TEXT NOT NULL,
    product_id TEXT NOT NULL,
    product_name TEXT NOT NULL,
    product_image TEXT,
    selected_color JSONB,
    customer_name TEXT NOT NULL,
    customer_email TEXT,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    headline TEXT,
    comment TEXT NOT NULL,
    tags TEXT[],
    photo_url TEXT,
    recommend BOOLEAN DEFAULT true,
    artisan_response JSONB,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- 4. Products Table
CREATE TABLE IF NOT EXISTS public.products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    tagline TEXT,
    price NUMERIC NOT NULL,
    original_price NUMERIC,
    rating NUMERIC DEFAULT 5.0,
    reviews_count INTEGER DEFAULT 0,
    category TEXT NOT NULL,
    images TEXT[],
    stock INTEGER DEFAULT 10,
    colors JSONB,
    description TEXT,
    yarn_type TEXT,
    care_instructions TEXT,
    tags TEXT[],
    is_best_seller BOOLEAN DEFAULT false,
    is_new_arrival BOOLEAN DEFAULT false,
    is_featured BOOLEAN DEFAULT false,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- Enable public row level security or open access for read/insert
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedbacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Allow anonymous access for the web storefront
CREATE POLICY "Allow public read-write orders" ON public.orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read-write custom_orders" ON public.custom_orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read-write feedbacks" ON public.feedbacks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read-write products" ON public.products FOR ALL USING (true) WITH CHECK (true);

-- Enable Supabase Realtime so all connected devices sync immediately
ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.custom_orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.feedbacks;
`;

// =========================================================
// COUPONS
// =========================================================

export async function fetchCouponsFromSupabase(): Promise<Coupon[]> {
  const { data, error } = await supabase
    .from('coupons')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data || []).map((row: any) => ({
    code: String(row.code),
    discountPercent: Number(row.discount_percent || 0),
    minOrderAmount: Number(row.min_order_amount || 0),
    maxDiscount:
      row.max_discount == null
        ? undefined
        : Number(row.max_discount),
    description: row.description || '',
    isActive: Boolean(row.is_active)
  }));
}


export async function upsertCouponToSupabase(
  coupon: Coupon
): Promise<void> {
  const { error } = await supabase
    .from('coupons')
    .upsert(
      {
        code: coupon.code.toUpperCase(),
        discount_percent: coupon.discountPercent,
        min_order_amount: coupon.minOrderAmount,
        max_discount: coupon.maxDiscount ?? null,
        description: coupon.description || '',
        is_active: coupon.isActive,
        updated_at: new Date().toISOString()
      },
      {
        onConflict: 'code'
      }
    );

  if (error) throw error;
}


export async function deleteCouponFromSupabase(
  code: string
): Promise<void> {
  const { error } = await supabase
    .from('coupons')
    .delete()
    .eq('code', code);

  if (error) throw error;
}


// =========================================================
// STORE SETTINGS
// =========================================================

export async function fetchStoreSettingsFromSupabase(): Promise<StoreSettings | null> {
  const { data, error } = await supabase
    .from('store_settings')
    .select('*')
    .eq('id', 1)
    .maybeSingle();

  if (error) throw error;

  if (!data) return null;

  return {
    codEnabled: Boolean(data.cod_enabled),
    codFee: Number(data.cod_fee || 0),
    freeShippingThreshold: Number(
      data.free_shipping_threshold || 0
    ),
    standardShippingFee: Number(
      data.standard_shipping_fee || 0
    ),

    // These should NOT be stored in frontend-visible settings
    // as private API credentials.
    shiprocketApiKey: '',

    supportPhone: data.support_phone || '',
    supportEmail: data.support_email || '',

    pinterestUrl: data.pinterest_url || '',
    pinterestHandle: data.pinterest_handle || '',

    upiId: data.upi_id || '',
    upiPayeeName: data.upi_payee_name || ''
  };
}


export async function updateStoreSettingsInSupabase(
  settings: StoreSettings
): Promise<void> {
  const { error } = await supabase
    .from('store_settings')
    .upsert(
      {
        id: 1,

        cod_enabled: settings.codEnabled,
        cod_fee: settings.codFee,
        free_shipping_threshold:
          settings.freeShippingThreshold,
        standard_shipping_fee:
          settings.standardShippingFee,

        support_phone: settings.supportPhone,
        support_email: settings.supportEmail,

        pinterest_url: settings.pinterestUrl,
        pinterest_handle: settings.pinterestHandle,

        upi_id: settings.upiId,
        upi_payee_name: settings.upiPayeeName,

        updated_at: new Date().toISOString()
      },
      {
        onConflict: 'id'
      }
    );

  if (error) throw error;
}


// =========================================================
// FEEDBACKS
// =========================================================

export async function fetchFeedbacksFromSupabase(): Promise<PurchasedItemFeedback[]> {
  const { data, error } = await supabase
    .from('feedbacks')
    .select('*');

  if (error) throw error;

  const list = (data || []).map((row: any) => ({
    id: String(row.id),

    orderId: row.order_id || '',
    orderNumber: row.order_number || '',

    productId: row.product_id || '',
    productName: row.product_name || '',
    productImage: row.product_image || '',

    selectedColor: row.selected_color || {
      name: 'Original',
      hex: '#5B3A29'
    },

    customerName: row.customer_name || '',
    customerEmail: row.customer_email || '',

    rating: Number(row.rating || 5),
    headline: row.headline || '',
    comment: row.comment || '',

    tags: Array.isArray(row.tags)
      ? row.tags
      : [],

    photoUrl: row.photo_url || undefined,
    recommend: row.recommend === null ? true : Boolean(row.recommend),
    artisanResponse: row.artisan_response || undefined,
    createdAt: row.created_at || new Date().toISOString()
  }));

  return list.sort((a, b) => {
    return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
  });
}

// =========================================================
// COMPATIBILITY & AUTHENTICATION HELPERS
// =========================================================

export async function syncProductToSupabase(product: Product): Promise<{ success: boolean; error?: string }> {
  try {
    await upsertProductToSupabase(product);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message };
  }
}

export async function updateOrderStatusInSupabase(
  orderId: string,
  status: OrderTrackingStatus | string,
  trackingNo?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const updates: any = { tracking_status: status };
    if (trackingNo) {
      updates.shiprocket_tracking_number = trackingNo;
    }
    const { error } = await supabase
      .from('orders')
      .update(updates)
      .or(`id.eq.${orderId},order_number.eq.${orderId}`);
    if (error) {
      console.warn('[Supabase] updateOrderStatus notice:', error.message);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message };
  }
}

export async function updateCustomOrderStatusInSupabase(
  id: string,
  status: CustomOrderRequest['status']
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('custom_orders')
      .update({ status })
      .eq('id', id);
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message };
  }
}

export async function signUpWithSupabase(data: {
  name: string;
  email: string;
  phone: string;
  password?: string;
}): Promise<{ user?: any; error?: string }> {
  try {
    const password = data.password || 'crochet123';
    const { data: authData, error } = await supabase.auth.signUp({
      email: data.email,
      password,
      options: {
        data: {
          full_name: data.name,
          phone: data.phone
        }
      }
    });
    if (error) {
      return { error: error.message };
    }
    return { user: authData.user };
  } catch (err: any) {
    return { error: err?.message || 'Signup failed' };
  }
}

export async function signInWithSupabase(
  email: string,
  password: string
): Promise<{ user?: any; error?: string }> {
  try {
    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    if (error) {
      return { error: error.message };
    }
    return { user: authData.user };
  } catch (err: any) {
    return { error: err?.message || 'Login failed' };
  }
}

export async function signOutSupabase(): Promise<void> {
  try {
    await supabase.auth.signOut();
  } catch (err) {
    console.warn('Sign out error:', err);
  }
}

export async function getSupabaseSessionUser(): Promise<any | null> {
  try {
    const { data } = await supabase.auth.getUser();
    return data.user || null;
  } catch {
    return null;
  }
}

// =========================================================
// REALTIME CROSS-DEVICE SYNCHRONIZATION
// =========================================================

export function customOrderFromSupabaseRow(row: any): CustomOrderRequest {
  return {
    id: String(row.id),
    customerName: row.customer_name || '',
    email: row.email || '',
    phone: row.phone || '',
    category: row.category || 'Custom Orders',
    colorPreference: row.color_preference || '',
    size: row.size || '',
    budget: row.budget || '',
    deliveryDatePreference: row.delivery_date_preference || '',
    referenceImageUrl: row.reference_image_url || undefined,
    message: row.message || '',
    status: row.status || 'submitted',
    createdAt: row.created_at || new Date().toISOString()
  };
}

export function feedbackFromSupabaseRow(row: any): PurchasedItemFeedback {
  let selectedColor = row.selected_color;
  if (typeof selectedColor === 'string') {
    try {
      selectedColor = JSON.parse(selectedColor);
    } catch {
      selectedColor = { name: 'Original', hex: '#5B3A29' };
    }
  }

  let artisanResponse = row.artisan_response;
  if (typeof artisanResponse === 'string') {
    try {
      artisanResponse = JSON.parse(artisanResponse);
    } catch {
      artisanResponse = undefined;
    }
  }

  return {
    id: String(row.id),
    orderId: row.order_id || '',
    orderNumber: row.order_number || '',
    productId: row.product_id || '',
    productName: row.product_name || '',
    productImage: row.product_image || '',
    selectedColor: selectedColor || { name: 'Original', hex: '#5B3A29' },
    customerName: row.customer_name || '',
    customerEmail: row.customer_email || '',
    rating: Number(row.rating || 5),
    headline: row.headline || '',
    comment: row.comment || '',
    tags: Array.isArray(row.tags) ? row.tags : [],
    photoUrl: row.photo_url || undefined,
    recommend: row.recommend === null ? true : Boolean(row.recommend),
    artisanResponse: artisanResponse || undefined,
    createdAt: row.created_at || new Date().toISOString()
  };
}

export interface RealtimeSyncHandlers {
  onProductChange?: (event: 'INSERT' | 'UPDATE' | 'DELETE', payload: any) => void;
  onOrderChange?: (event: 'INSERT' | 'UPDATE' | 'DELETE', payload: any) => void;
  onCustomOrderChange?: (event: 'INSERT' | 'UPDATE' | 'DELETE', payload: any) => void;
  onFeedbackChange?: (event: 'INSERT' | 'UPDATE' | 'DELETE', payload: any) => void;
}

export function subscribeToRealtimeUpdates(handlers: RealtimeSyncHandlers) {
  const channel = supabase
    .channel('dreamqueen-cross-device-sync')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'products' },
      (payload) => {
        handlers.onProductChange?.(payload.eventType as any, payload);
      }
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'orders' },
      (payload) => {
        handlers.onOrderChange?.(payload.eventType as any, payload);
      }
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'custom_orders' },
      (payload) => {
        handlers.onCustomOrderChange?.(payload.eventType as any, payload);
      }
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'feedbacks' },
      (payload) => {
        handlers.onFeedbackChange?.(payload.eventType as any, payload);
      }
    )
    .subscribe((status, err) => {
      if (err) {
        console.warn('[Supabase Realtime] Sync subscription notice:', err);
      } else if (status === 'SUBSCRIBED') {
        console.log('[Supabase Realtime] Live cross-device sync active 🌸');
      }
    });

  return () => {
    supabase.removeChannel(channel);
  };
}



