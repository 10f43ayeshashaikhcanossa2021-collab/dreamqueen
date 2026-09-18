export type ProductCategory =
  | 'Hair Accessories'
  | 'Keychains'
  | 'Bookmarks'
  | 'Flowers'
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
  createdAt: string;
  artisanResponse?: {
    text: string;
    respondedAt: string;
    author: string;
  };
}

export type PaymentMethod = 'razorpay' | 'upi_qr' | 'cod';
export type PaymentStatus = 'paid' | 'pending' | 'failed';
export type OrderTrackingStatus =
  | 'pending'
  | 'preparing'
  | 'packed'
  | 'shipped'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled';

export interface ShippingAddress {
  fullName: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
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
  createdAt: string;
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
  trackingStatus: OrderTrackingStatus;
  shiprocketTrackingNumber?: string;
  estimatedDeliveryDate: string;
  notes?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'customer' | 'admin';
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
}

export interface CustomOrderRequest {
  id: string;
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
  status: 'submitted' | 'reviewing' | 'accepted' | 'in_progress' | 'completed';
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
}
