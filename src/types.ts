export type ProductCategory =
  | 'Keychains'
  | 'Hair Accessories'
  | 'Bags & Pouches'
  | 'Accessories'
  | 'Gifts'
  | 'Custom Orders';

export interface ProductColor {
  name: string;
  hex: string;
}

export interface Product {
  id: string;
  name: string;
  tagline: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviewsCount: number;
  category: ProductCategory;
  images: string[];
  stock: number;
  colors: ProductColor[];
  description: string;
  yarnType: string;
  careInstructions: string;
  tags: string[];
  isBestSeller?: boolean;
  isNewArrival?: boolean;
  isFeatured?: boolean;
  isActive?: boolean;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedColor: ProductColor;
}

export interface Review {
  id: string;
  productId: string;
  customerName: string;
  customerAvatar?: string;
  rating: number;
  comment: string;
  date: string;
  photoUrl?: string;
  isVerified: boolean;
}

export interface PurchasedItemFeedback {
  id: string;
  userId?: string;
  orderId: string;
  orderNumber: string;
  productId: string;
  productName: string;
  productImage: string;
  selectedColor: ProductColor;
  customerName: string;
  customerEmail: string;
  rating: number; // 1 to 5
  headline: string;
  comment: string;
  tags: string[];
  photoUrl?: string;
  recommend: boolean;
  isVerifiedPurchase?: boolean;
  isApproved?: boolean;
  createdAt: string;
  artisanResponse?: {
    text: string;
    respondedAt: string;
    author: string;
  };
}

export type PaymentMethod = 'razorpay' | 'upi_qr' | 'cod';
export type PaymentStatus =
  | 'paid'
  | 'pending'
  | 'failed'
  | 'refund_initiated'
  | 'refunded';

export type OrderTrackingStatus =
  | 'pending'
  | 'payment_pending'
  | 'payment_confirmed'
  | 'preparing'
  | 'packed'
  | 'shipped'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled'
  | 'refund_initiated'
  | 'refunded';

export interface OrderStatusHistoryEntry {
  status: OrderTrackingStatus;
  timestamp: string;
  note?: string;
}

export interface ShippingAddress {
  id?: string;
  label?: string;
  fullName: string;
  phone: string;
  email: string;
  address: string;
  addressLine1?: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  isDefault?: boolean;
}

export interface OrderItem {
  productId: string;
  productName: string;
  image: string;
  price: number;
  quantity: number;
  color: ProductColor;
}

export interface Order {
  id: string;
  orderNumber: string; // e.g. DQ-849102
  userId?: string;
  createdAt: string;
  updatedAt?: string;
  customer: {
    name: string;
    email: string;
    phone: string;
  };
  shippingAddress: ShippingAddress;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  couponCode?: string;
  shippingFee: number;
  codFee: number;
  total: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  razorpayPaymentId?: string;
  razorpayOrderId?: string;
  upiTransactionRef?: string;
  paymentVerifiedAt?: string;
  trackingStatus: OrderTrackingStatus;
  shiprocketTrackingNumber?: string;
  estimatedDeliveryDate: string;
  notes?: string;
  cancellationReason?: string;
  refundStatus?: string;
  refundId?: string;
  statusHistory?: OrderStatusHistoryEntry[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'customer' | 'admin';
  emailConfirmed?: boolean;
  savedAddresses: ShippingAddress[];
  wishlistProductIds: string[];
}

export interface Coupon {
  code: string;
  discountPercent: number;
  minOrderAmount: number;
  maxDiscount?: number;
  description: string;
  isActive: boolean;
  expiresAt?: string;
  maxUses?: number;
  usedCount?: number;
}

export interface CustomOrderRequest {
  id: string;
  userId?: string;
  customerName: string;
  email: string;
  phone: string;
  category: string;
  colorPreference: string;
  size: string;
  budget: string;
  deliveryDatePreference: string;
  referenceImageUrl?: string;
  message: string;
  status: 'submitted' | 'reviewing' | 'accepted' | 'in_progress' | 'completed' | 'rejected';
  quotedPrice?: number;
  adminNotes?: string;
  createdAt: string;
}

export interface StoreSettings {
  codEnabled: boolean;
  codFee: number;
  freeShippingThreshold: number;
  standardShippingFee: number;
  shiprocketApiKey: string;
  supportPhone: string;
  supportEmail: string;
  pinterestUrl: string;
  pinterestHandle: string;
  upiId: string;
  upiPayeeName: string;
  studioAddress?: string;
}

export interface NewsletterSubscriber {
  id: string;
  email: string;
  status: 'active' | 'unsubscribed';
  source?: string;
  createdAt: string;
}

export type AppTab =
  | 'home'
  | 'shop'
  | 'custom'
  | 'track'
  | 'customer'
  | 'contact'
  | 'admin'
  | 'privacy'
  | 'terms'
  | 'shipping'
  | 'refunds';
