import { createClient } from '@supabase/supabase-js';
import type {
  Order,
  PurchasedItemFeedback,
  CustomOrderRequest,
  Product,
  Coupon,
  StoreSettings,
  OrderTrackingStatus,
  ShippingAddress
} from '../types';
import { resolveItemImage } from '../utils/imageHelper';
import { DEFAULT_STORE_SETTINGS } from '../utils/pricing';

const env = (import.meta as any)?.env || {};
export const SUPABASE_URL =
  env.VITE_SUPABASE_URL ||
  env.NEXT_PUBLIC_SUPABASE_URL ||
  'https://aosdiqpdpfmozuuogroz.supabase.co';

export const SUPABASE_ANON_KEY =
  env.VITE_SUPABASE_ANON_KEY ||
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvc2RpcXBkcGZtb3p1dW9ncm96Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk0NTczMDUsImV4cCI6MjEwNTAzMzMwNX0.SahukijE13jnAqc65MBTcJsBygisCsEESNDQ6FsVZ9c';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

// =========================================================
// IMAGE VALIDATION & SUPABASE STORAGE HELPERS
// =========================================================

const ALLOWED_IMAGE_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_IMAGE_FILE_BYTES = 5 * 1024 * 1024; // 5 MB

export function validateImageUploadFile(file: File): string | null {
  if (!ALLOWED_IMAGE_MIME_TYPES.has(file.type)) {
    return 'Only JPG, PNG, or WEBP images are supported.';
  }
  if (file.size > MAX_IMAGE_FILE_BYTES) {
    return 'Image file size must be 5 MB or less.';
  }
  return null;
}

export async function uploadImageToBucket(
  bucket: 'product-images' | 'custom-order-references',
  file: File,
  folderPrefix: string = 'uploads'
): Promise<{ publicUrl?: string; error?: string }> {
  const validationError = validateImageUploadFile(file);
  if (validationError) {
    return { error: validationError };
  }

  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const safeSlug = file.name
    .replace(/\.[^/.]+$/, '')
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, '-')
    .slice(0, 40);
  const path = `${folderPrefix}/${Date.now()}-${safeSlug}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type
    });

  if (uploadError) {
    return { error: uploadError.message };
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return { publicUrl: data.publicUrl };
}

export async function deleteStorageImageByUrl(
  bucket: 'product-images' | 'custom-order-references',
  publicUrl: string
): Promise<void> {
  if (!publicUrl || !publicUrl.includes(`/storage/v1/object/public/${bucket}/`)) {
    return;
  }
  const objectPath = publicUrl.split(`/storage/v1/object/public/${bucket}/`)[1];
  if (!objectPath) return;
  await supabase.storage.from(bucket).remove([decodeURIComponent(objectPath)]);
}

// =========================================================
// PRODUCTS
// =========================================================

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
    images = ['/assets/aistudio/hair_clip_____47816559.jpg'];
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
    isActive: row.is_active === undefined || row.is_active === null ? true : Boolean(row.is_active)
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
    is_active: product.isActive === undefined ? true : Boolean(product.isActive),
    updated_at: new Date().toISOString()
  };
}

export async function fetchProductsFromSupabase(): Promise<Product[]> {
  const { data, error } = await supabase.from('products').select('*');
  if (error) throw error;
  const list = (data || []).map(productFromSupabaseRow);
  return list.sort((a, b) => a.id.localeCompare(b.id));
}

export async function upsertProductToSupabase(product: Product): Promise<void> {
  const { error } = await supabase
    .from('products')
    .upsert(productToSupabaseRow(product), { onConflict: 'id' });
  if (error) throw error;
}

export async function syncProductToSupabase(
  product: Product
): Promise<{ success: boolean; error?: string }> {
  try {
    await upsertProductToSupabase(product);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message };
  }
}

export async function deleteProductFromSupabase(id: string): Promise<void> {
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) throw error;
}

// =========================================================
// ORDERS
// =========================================================

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
      shippingAddress = {
        fullName: '',
        phone: '',
        email: '',
        address: '',
        city: '',
        state: '',
        pincode: ''
      };
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

  let statusHistory = row.status_history;
  if (typeof statusHistory === 'string') {
    try {
      statusHistory = JSON.parse(statusHistory);
    } catch {
      statusHistory = [];
    }
  }

  const street =
    shippingAddress?.address ||
    shippingAddress?.addressLine1 ||
    shippingAddress?.street ||
    (typeof shippingAddress === 'string' ? shippingAddress : '');

  const normalizedAddress: ShippingAddress = {
    fullName: shippingAddress?.fullName || customer?.name || 'Valued Customer',
    phone: shippingAddress?.phone || customer?.phone || '',
    email: shippingAddress?.email || customer?.email || '',
    address: street,
    addressLine1: street,
    addressLine2: shippingAddress?.addressLine2 || '',
    city: shippingAddress?.city || '',
    state: shippingAddress?.state || '',
    pincode: shippingAddress?.pincode || ''
  };

  const normalizedCustomer = {
    name: customer?.name || shippingAddress?.fullName || 'Valued Customer',
    email: customer?.email || shippingAddress?.email || '',
    phone: customer?.phone || shippingAddress?.phone || ''
  };

  const normalizedItems = (Array.isArray(items) ? items : []).map((it: any) => ({
    productId: it.productId || '',
    productName: it.productName || 'Handcrafted Crochet Creation',
    image: resolveItemImage(it.productId, it.image),
    price: Number(it.price || 0),
    quantity: Number(it.quantity || 1),
    color: it.color || { name: 'Original', hex: '#5B3A29' }
  }));

  return {
    id: String(row.id),
    orderNumber: row.order_number || '',
    userId: row.user_id || undefined,
    customer: normalizedCustomer,
    shippingAddress: normalizedAddress,
    items: normalizedItems,
    subtotal: Number(row.subtotal || 0),
    discount: Number(row.discount || 0),
    couponCode: row.coupon_code || undefined,
    shippingFee: Number(row.shipping_fee || 0),
    codFee: Number(row.cod_fee || 0),
    total: Number(row.total || 0),
    paymentMethod: row.payment_method || 'cod',
    paymentStatus: row.payment_status || 'pending',
    razorpayPaymentId: row.razorpay_payment_id || undefined,
    razorpayOrderId: row.razorpay_order_id || undefined,
    upiTransactionRef: row.upi_transaction_ref || undefined,
    paymentVerifiedAt: row.payment_verified_at || undefined,
    trackingStatus: row.tracking_status || 'pending',
    shiprocketTrackingNumber: row.shiprocket_tracking_number || undefined,
    estimatedDeliveryDate: row.estimated_delivery_date || '',
    notes: row.notes || undefined,
    cancellationReason: row.cancellation_reason || undefined,
    refundStatus: row.refund_status || undefined,
    refundId: row.refund_id || undefined,
    statusHistory: Array.isArray(statusHistory) ? statusHistory : undefined,
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || undefined
  };
}

export async function fetchOrdersFromSupabase(): Promise<Order[]> {
  const { data, error } = await supabase.from('orders').select('*');
  if (error) throw error;
  const orders = (data || []).map(orderFromSupabaseRow);
  return orders.sort(
    (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
  );
}

export async function trackOrderViaRpc(
  orderNumber: string,
  contact: string
): Promise<Order | null> {
  const { data, error } = await supabase.rpc('track_order_secure', {
    p_order_number: orderNumber,
    p_contact: contact
  });
  if (error || !data) return null;
  return orderFromSupabaseRow(data);
}

export async function syncOrderToSupabase(
  order: Order
): Promise<{ success: boolean; error?: string }> {
  try {
    const shipping = order.shippingAddress || ({} as any);
    const streetAddr = shipping.address || shipping.addressLine1 || '';

    const orderRow: Record<string, any> = {
      id: order.id,
      order_number: order.orderNumber,
      user_id: order.userId || null,
      customer: {
        name: order.customer?.name || shipping.fullName || 'Valued Customer',
        email: order.customer?.email || shipping.email || '',
        phone: order.customer?.phone || shipping.phone || ''
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
        pincode: shipping.pincode || ''
      },
      items: (order.items ?? []).map((it) => ({
        productId: it.productId,
        productName: it.productName,
        image:
          it.image && it.image.startsWith('data:')
            ? resolveItemImage(it.productId)
            : resolveItemImage(it.productId, it.image),
        price: Number(it.price || 0),
        quantity: Number(it.quantity || 1),
        color: it.color
      })),
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
      upi_transaction_ref: order.upiTransactionRef ?? null,
      tracking_status: order.trackingStatus ?? 'pending',
      shiprocket_tracking_number: order.shiprocketTrackingNumber ?? null,
      estimated_delivery_date: order.estimatedDeliveryDate ?? null,
      notes: order.notes ?? null,
      status_history: order.statusHistory ?? [],
      created_at: order.createdAt || new Date().toISOString()
    };

    const { error } = await supabase
      .from('orders')
      .upsert(orderRow, { onConflict: 'id' });

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Unknown Supabase order error' };
  }
}

export async function updateOrderStatusInSupabase(
  orderId: string,
  status: OrderTrackingStatus | string,
  trackingNo?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const updates: any = {
      tracking_status: status,
      updated_at: new Date().toISOString()
    };
    if (trackingNo !== undefined) {
      updates.shiprocket_tracking_number = trackingNo;
    }
    const { error } = await supabase
      .from('orders')
      .update(updates)
      .or(`id.eq.${orderId},order_number.eq.${orderId}`);
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message };
  }
}

// =========================================================
// PROFILES & ADDRESSES
// =========================================================

export async function fetchCurrentProfile(): Promise<any | null> {
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();
  if (userError || !user) return null;
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function fetchUserAddresses(userId: string): Promise<ShippingAddress[]> {
  const { data, error } = await supabase
    .from('addresses')
    .select('*')
    .eq('user_id', userId)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: false });
  if (error) return [];
  return (data || []).map((row: any) => ({
    id: row.id,
    label: row.label || 'Home',
    fullName: row.full_name || '',
    phone: row.phone || '',
    email: row.email || '',
    address: row.address_line1 || '',
    addressLine1: row.address_line1 || '',
    addressLine2: row.address_line2 || '',
    city: row.city || '',
    state: row.state || '',
    pincode: row.pincode || '',
    isDefault: Boolean(row.is_default)
  }));
}

export async function upsertUserAddress(
  userId: string,
  addr: ShippingAddress
): Promise<{ address?: ShippingAddress; error?: string }> {
  const addressId = addr.id || `addr-${Date.now()}`;
  const street = addr.address || addr.addressLine1 || '';
  if (addr.isDefault) {
    await supabase.from('addresses').update({ is_default: false }).eq('user_id', userId);
  }
  const { error } = await supabase.from('addresses').upsert(
    {
      id: addressId,
      user_id: userId,
      label: addr.label || 'Home',
      full_name: addr.fullName,
      phone: addr.phone,
      email: addr.email || '',
      address_line1: street,
      address_line2: addr.addressLine2 || '',
      city: addr.city,
      state: addr.state,
      pincode: addr.pincode,
      is_default: Boolean(addr.isDefault),
      updated_at: new Date().toISOString()
    },
    { onConflict: 'id' }
  );
  if (error) return { error: error.message };
  return { address: { ...addr, id: addressId, address: street, addressLine1: street } };
}

export async function deleteUserAddress(userId: string, addressId: string): Promise<{ error?: string }> {
  const { error } = await supabase
    .from('addresses')
    .delete()
    .eq('id', addressId)
    .eq('user_id', userId);
  if (error) return { error: error.message };
  return {};
}

export async function updateCurrentProfile(
  name: string,
  phone: string,
  extra?: { savedAddresses?: ShippingAddress[]; wishlistProductIds?: string[] }
): Promise<{ error?: string }> {
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();
  if (userError || !user) return { error: 'Not authenticated' };

  const payload: Record<string, any> = {
    id: user.id,
    full_name: name,
    email: user.email || '',
    phone,
    updated_at: new Date().toISOString()
  };
  if (extra?.savedAddresses !== undefined) {
    payload.saved_addresses = extra.savedAddresses;
  }
  if (extra?.wishlistProductIds !== undefined) {
    payload.wishlist_product_ids = extra.wishlistProductIds;
  }

  const { error } = await supabase.from('profiles').upsert(payload, { onConflict: 'id' });
  if (error) return { error: error.message };

  const { error: authError } = await supabase.auth.updateUser({
    data: { full_name: name, phone }
  });
  if (authError) return { error: authError.message };
  return {};
}

// =========================================================
// CUSTOM ORDERS
// =========================================================

export function customOrderFromSupabaseRow(row: any): CustomOrderRequest {
  return {
    id: String(row.id),
    userId: row.user_id || undefined,
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
    quotedPrice: row.quoted_price === null || row.quoted_price === undefined ? undefined : Number(row.quoted_price),
    adminNotes: row.admin_notes || undefined,
    createdAt: row.created_at || new Date().toISOString()
  };
}

export async function fetchCustomOrdersFromSupabase(): Promise<CustomOrderRequest[]> {
  const { data, error } = await supabase.from('custom_orders').select('*');
  if (error) throw error;
  const list = (data || []).map(customOrderFromSupabaseRow);
  return list.sort(
    (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
  );
}

export async function syncCustomOrderToSupabase(
  customOrder: CustomOrderRequest
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.from('custom_orders').upsert({
      id: customOrder.id,
      user_id: customOrder.userId || null,
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
      quoted_price: customOrder.quotedPrice ?? null,
      admin_notes: customOrder.adminNotes ?? null,
      created_at: customOrder.createdAt
    });
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message };
  }
}

export async function updateCustomOrderInSupabase(
  id: string,
  updates: { status: CustomOrderRequest['status']; quotedPrice?: number; adminNotes?: string }
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('custom_orders')
      .update({
        status: updates.status,
        quoted_price: updates.quotedPrice ?? null,
        admin_notes: updates.adminNotes ?? null,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message };
  }
}

// =========================================================
// FEEDBACKS / REVIEWS
// =========================================================

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
    userId: row.user_id || undefined,
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
    isVerifiedPurchase:
      row.is_verified_purchase === undefined ? true : Boolean(row.is_verified_purchase),
    isApproved: row.is_approved === undefined ? true : Boolean(row.is_approved),
    artisanResponse: artisanResponse || undefined,
    createdAt: row.created_at || new Date().toISOString()
  };
}

export async function fetchFeedbacksFromSupabase(): Promise<PurchasedItemFeedback[]> {
  const { data, error } = await supabase.from('feedbacks').select('*');
  if (error) throw error;
  const list = (data || []).map(feedbackFromSupabaseRow);
  return list.sort(
    (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
  );
}

export async function syncFeedbackToSupabase(
  feedback: PurchasedItemFeedback
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.from('feedbacks').upsert(
      {
        id: feedback.id,
        user_id: feedback.userId || null,
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
        is_verified_purchase: feedback.isVerifiedPurchase ?? true,
        is_approved: feedback.isApproved ?? true,
        artisan_response: feedback.artisanResponse ?? null,
        created_at: feedback.createdAt
      },
      { onConflict: 'id' }
    );
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message };
  }
}

export async function deleteFeedbackFromSupabase(id: string): Promise<{ error?: string }> {
  const { error } = await supabase.from('feedbacks').delete().eq('id', id);
  if (error) return { error: error.message };
  return {};
}

// =========================================================
// COUPONS & STORE SETTINGS
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
    maxDiscount: row.max_discount == null ? undefined : Number(row.max_discount),
    description: row.description || '',
    isActive: Boolean(row.is_active),
    expiresAt: row.expires_at || undefined,
    maxUses: row.max_uses == null ? undefined : Number(row.max_uses),
    usedCount: row.used_count == null ? 0 : Number(row.used_count)
  }));
}

export async function upsertCouponToSupabase(coupon: Coupon): Promise<void> {
  const { error } = await supabase.from('coupons').upsert(
    {
      code: coupon.code.toUpperCase(),
      discount_percent: coupon.discountPercent,
      min_order_amount: coupon.minOrderAmount,
      max_discount: coupon.maxDiscount ?? null,
      description: coupon.description || '',
      is_active: coupon.isActive,
      expires_at: coupon.expiresAt ?? null,
      max_uses: coupon.maxUses ?? null,
      used_count: coupon.usedCount ?? 0,
      updated_at: new Date().toISOString()
    },
    { onConflict: 'code' }
  );
  if (error) throw error;
}

export async function deleteCouponFromSupabase(code: string): Promise<void> {
  const { error } = await supabase.from('coupons').delete().eq('code', code);
  if (error) throw error;
}

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
    codFee: Number(data.cod_fee ?? DEFAULT_STORE_SETTINGS.codFee),
    freeShippingThreshold: Number(
      data.free_shipping_threshold ?? DEFAULT_STORE_SETTINGS.freeShippingThreshold
    ),
    standardShippingFee: Number(
      data.standard_shipping_fee ?? DEFAULT_STORE_SETTINGS.standardShippingFee
    ),
    shiprocketApiKey: '',
    supportPhone: data.support_phone || DEFAULT_STORE_SETTINGS.supportPhone,
    supportEmail: data.support_email || DEFAULT_STORE_SETTINGS.supportEmail,
    pinterestUrl: data.pinterest_url || DEFAULT_STORE_SETTINGS.pinterestUrl,
    pinterestHandle: data.pinterest_handle || DEFAULT_STORE_SETTINGS.pinterestHandle,
    upiId: data.upi_id || DEFAULT_STORE_SETTINGS.upiId,
    upiPayeeName: data.upi_payee_name || DEFAULT_STORE_SETTINGS.upiPayeeName,
    studioAddress: data.studio_address || DEFAULT_STORE_SETTINGS.studioAddress
  };
}

export async function updateStoreSettingsInSupabase(settings: StoreSettings): Promise<void> {
  const { error } = await supabase.from('store_settings').upsert(
    {
      id: 1,
      cod_enabled: settings.codEnabled,
      cod_fee: settings.codFee,
      free_shipping_threshold: settings.freeShippingThreshold,
      standard_shipping_fee: settings.standardShippingFee,
      support_phone: settings.supportPhone,
      support_email: settings.supportEmail,
      pinterest_url: settings.pinterestUrl,
      pinterest_handle: settings.pinterestHandle,
      upi_id: settings.upiId,
      upi_payee_name: settings.upiPayeeName,
      studio_address: settings.studioAddress || DEFAULT_STORE_SETTINGS.studioAddress,
      updated_at: new Date().toISOString()
    },
    { onConflict: 'id' }
  );
  if (error) throw error;
}

// =========================================================
// REAL AUTHENTICATION HELPERS (Single Source of Truth)
// =========================================================

export async function signUpWithSupabase(data: {
  name: string;
  email: string;
  phone: string;
  password: string;
}): Promise<{
  user?: any;
  session?: any;
  requiresEmailVerification?: boolean;
  error?: string;
}> {
  try {
    const { data: authData, error } = await supabase.auth.signUp({
      email: data.email.trim().toLowerCase(),
      password: data.password,
      options: {
        emailRedirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
        data: {
          full_name: data.name.trim(),
          phone: data.phone.trim()
        }
      }
    });

    if (error) {
      return { error: error.message };
    }

    // Supabase returns empty identities array if the email already exists (when email enum protection is enabled)
    if (authData.user && Array.isArray(authData.user.identities) && authData.user.identities.length === 0) {
      return {
        error: 'An account with this email already exists. Please sign in or use Forgot Password.'
      };
    }

    const requiresEmailVerification = Boolean(authData.user && !authData.session);
    return {
      user: authData.user,
      session: authData.session,
      requiresEmailVerification
    };
  } catch (err: any) {
    return { error: err?.message || 'Registration failed. Please try again.' };
  }
}

export async function signInWithSupabase(
  email: string,
  password: string
): Promise<{ user?: any; session?: any; error?: string }> {
  try {
    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password
    });
    if (error) {
      return { error: error.message };
    }
    return { user: authData.user, session: authData.session };
  } catch (err: any) {
    return { error: err?.message || 'Sign in failed. Please check your credentials.' };
  }
}

export async function sendPasswordResetEmail(
  email: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: typeof window !== 'undefined' ? window.location.origin : undefined
    });
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to send password reset email.' };
  }
}

export async function updateUserPassword(
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to update password.' };
  }
}

export async function resendVerificationEmail(
  email: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email.trim().toLowerCase()
    });
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Could not resend verification email.' };
  }
}

export async function signOutSupabase(): Promise<void> {
  await supabase.auth.signOut();
}

export async function getAccessToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token || null;
}

// =========================================================
// REALTIME CROSS-DEVICE SYNCHRONIZATION
// =========================================================

export interface RealtimeSyncHandlers {
  onProductChange?: (event: 'INSERT' | 'UPDATE' | 'DELETE', payload: any) => void;
  onOrderChange?: (event: 'INSERT' | 'UPDATE' | 'DELETE', payload: any) => void;
  onCustomOrderChange?: (event: 'INSERT' | 'UPDATE' | 'DELETE', payload: any) => void;
  onFeedbackChange?: (event: 'INSERT' | 'UPDATE' | 'DELETE', payload: any) => void;
  onCouponChange?: () => void;
  onSettingsChange?: () => void;
}

export function subscribeToRealtimeUpdates(handlers: RealtimeSyncHandlers) {
  const channel = supabase
    .channel('dreamqueen-cross-device-sync')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, (payload) => {
      handlers.onProductChange?.(payload.eventType as any, payload);
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
      handlers.onOrderChange?.(payload.eventType as any, payload);
    })
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'custom_orders' },
      (payload) => {
        handlers.onCustomOrderChange?.(payload.eventType as any, payload);
      }
    )
    .on('postgres_changes', { event: '*', schema: 'public', table: 'feedbacks' }, (payload) => {
      handlers.onFeedbackChange?.(payload.eventType as any, payload);
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'coupons' }, () => {
      handlers.onCouponChange?.();
    })
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'store_settings' },
      () => {
        handlers.onSettingsChange?.();
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
