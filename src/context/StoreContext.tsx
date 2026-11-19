import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type {
  Product,
  CartItem,
  Order,
  OrderItem,
  Coupon,
  User,
  CustomOrderRequest,
  StoreSettings,
  OrderTrackingStatus,
  PurchasedItemFeedback,
  ShippingAddress,
  PaymentMethod,
  AppTab
} from '../types';
import {
  INITIAL_PRODUCTS,
  INITIAL_COUPONS,
  INITIAL_ORDERS,
  INITIAL_FEEDBACKS
} from '../data/initialProducts';
import { resolveItemImage } from '../utils/imageHelper';
import {
  DEFAULT_STORE_SETTINGS,
  validateCouponRule,
  normalizeIndianPhone
} from '../utils/pricing';
import {
  supabase,
  syncOrderToSupabase,
  syncCustomOrderToSupabase,
  syncFeedbackToSupabase,
  fetchProductsFromSupabase,
  fetchOrdersFromSupabase,
  fetchCustomOrdersFromSupabase,
  fetchFeedbacksFromSupabase,
  fetchCouponsFromSupabase,
  fetchStoreSettingsFromSupabase,
  syncProductToSupabase,
  deleteProductFromSupabase,
  updateOrderStatusInSupabase,
  updateCustomOrderInSupabase,
  deleteFeedbackFromSupabase,
  upsertCouponToSupabase,
  deleteCouponFromSupabase,
  updateStoreSettingsInSupabase,
  fetchCurrentProfile,
  fetchUserAddresses,
  upsertUserAddress,
  deleteUserAddress,
  updateCurrentProfile,
  signUpWithSupabase,
  signInWithSupabase,
  sendPasswordResetEmail,
  updateUserPassword,
  resendVerificationEmail,
  signOutSupabase,
  getAccessToken,
  subscribeToRealtimeUpdates,
  productFromSupabaseRow,
  orderFromSupabaseRow,
  customOrderFromSupabaseRow,
  feedbackFromSupabaseRow
} from '../lib/supabase';

interface ToastInfo {
  id: string;
  message: string;
  type: 'success' | 'info' | 'error';
}

export interface AuthActionResult {
  success: boolean;
  error?: string;
  requiresEmailVerification?: boolean;
}

export interface PlaceOrderInput {
  shippingAddress: ShippingAddress;
  paymentMethod: PaymentMethod;
  notes?: string;
  idempotencyKey?: string;
}

export interface PlaceOrderResult {
  order?: Order;
  error?: string;
}

interface StoreContextType {
  products: Product[];
  activeProducts: Product[];
  addProduct: (product: Omit<Product, 'id'>) => Promise<void>;
  updateProduct: (id: string, updates: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  updateProductStock: (id: string, delta: number) => Promise<void>;

  cart: CartItem[];
  addToCart: (product: Product, quantity?: number, colorIndex?: number) => void;
  removeFromCart: (productId: string, colorName: string) => void;
  updateCartQuantity: (productId: string, colorName: string, quantity: number) => void;
  clearCart: () => void;
  cartCount: number;
  cartSubtotal: number;

  wishlist: string[];
  toggleWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;

  orders: Order[];
  placeServerOrder: (input: PlaceOrderInput) => Promise<PlaceOrderResult>;
  refreshOrderAfterGateway: (updatedOrderRow: any) => void;
  submitUpiUtr: (orderId: string, utr: string) => Promise<{ success: boolean; error?: string }>;
  verifyOrderPaymentAdmin: (orderId: string) => Promise<{ success: boolean; error?: string }>;
  refundOrderAdmin: (orderId: string) => Promise<{ success: boolean; refundStatus?: string; error?: string }>;
  cancelUserOrder: (orderId: string, reason?: string) => Promise<{ success: boolean; error?: string }>;
  updateOrderStatus: (
    orderId: string,
    status: OrderTrackingStatus,
    trackingNo?: string,
    cancellationReason?: string
  ) => Promise<{ success: boolean; error?: string }>;
  getOrderByIdOrNumber: (query: string) => Order | undefined;

  coupons: Coupon[];
  activeCoupon: Coupon | null;
  applyCoupon: (code: string) => { success: boolean; message: string };
  removeCoupon: () => void;
  addCoupon: (coupon: Coupon) => Promise<void>;
  updateCoupon: (coupon: Coupon) => Promise<void>;
  deleteCoupon: (code: string) => Promise<void>;

  customOrders: CustomOrderRequest[];
  submitCustomOrder: (request: Omit<CustomOrderRequest, 'id' | 'status' | 'createdAt'>) => Promise<void>;
  updateCustomOrderStatus: (
    id: string,
    status: CustomOrderRequest['status'],
    extra?: { quotedPrice?: number; adminNotes?: string }
  ) => Promise<void>;

  feedbacks: PurchasedItemFeedback[];
  submitFeedback: (feedback: Omit<PurchasedItemFeedback, 'id' | 'createdAt'>) => Promise<void>;
  getFeedbackForOrderItem: (orderNumber: string, productId: string) => PurchasedItemFeedback | undefined;
  replyToFeedback: (feedbackId: string, replyText: string) => Promise<void>;
  toggleFeedbackApproval: (feedbackId: string, isApproved: boolean) => Promise<void>;
  deleteFeedback: (feedbackId: string) => Promise<void>;
  activeFeedbackTarget: { order: Order; item: OrderItem } | null;
  setActiveFeedbackTarget: (val: { order: Order; item: OrderItem } | null) => void;

  storeSettings: StoreSettings;
  updateStoreSettings: (settings: Partial<StoreSettings>) => Promise<void>;

  currentUser: User | null;
  isAuthLoading: boolean;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (val: boolean) => void;
  isPasswordRecoveryMode: boolean;
  setIsPasswordRecoveryMode: (val: boolean) => void;
  authModalIntent: 'checkout' | 'general' | 'custom_order';
  setAuthModalIntent: (val: 'checkout' | 'general' | 'custom_order') => void;
  openAuthModal: (intent?: 'checkout' | 'general' | 'custom_order') => void;
  registerUser: (data: {
    name: string;
    email: string;
    phone: string;
    password: string;
  }) => Promise<AuthActionResult>;
  loginUser: (email: string, password: string) => Promise<AuthActionResult>;
  requestPasswordReset: (email: string) => Promise<AuthActionResult>;
  completePasswordReset: (newPassword: string) => Promise<AuthActionResult>;
  resendVerification: (email: string) => Promise<AuthActionResult>;
  logoutUser: () => Promise<void>;
  updateUserProfile: (name: string, phone: string) => Promise<{ error?: string }>;
  saveUserAddress: (address: ShippingAddress) => Promise<{ address?: ShippingAddress; error?: string }>;
  removeUserAddress: (addressId: string) => Promise<{ error?: string }>;

  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  selectedShopCategory: string;
  setSelectedShopCategory: (category: string) => void;

  selectedProduct: Product | null;
  setSelectedProduct: (product: Product | null) => void;

  isCartOpen: boolean;
  setIsCartOpen: (val: boolean) => void;

  isCheckoutOpen: boolean;
  setIsCheckoutOpen: (val: boolean) => void;

  isUpiScannerOpen: boolean;
  setIsUpiScannerOpen: (val: boolean) => void;

  searchQuery: string;
  setSearchQuery: (q: string) => void;

  toasts: ToastInfo[];
  showToast: (message: string, type?: 'success' | 'info' | 'error') => void;

  isSupabaseSyncing: boolean;
  refreshFromSupabase: () => Promise<void>;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

function isValidCatalogImage(img?: string): boolean {
  if (!img) return false;
  return (
    img.startsWith('/assets/aistudio/') ||
    img.startsWith('/images/') ||
    img.startsWith('https://') ||
    img.startsWith('http://')
  );
}

function getDeletedStarterProductIds(): Set<string> {
  try {
    const raw = localStorage.getItem('dreamqueen_deleted_product_ids_v1');
    const parsed = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(parsed) ? parsed.map(String) : []);
  } catch {
    return new Set();
  }
}

function mergeMissingStarterProducts(existing: Product[]): Product[] {
  const deletedIds = getDeletedStarterProductIds();
  const seenIds = new Set(existing.map((p) => p.id));
  const missing = INITIAL_PRODUCTS.filter(
    (p) => !seenIds.has(p.id) && !deletedIds.has(p.id)
  ).map((p) => ({ ...p, isActive: p.isActive ?? true }));
  return missing.length > 0 ? [...existing, ...missing] : existing;
}

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem('dreamqueen_products_catalog_v1');
      if (saved) {
        const parsed: Product[] = JSON.parse(saved);
        if (
          Array.isArray(parsed) &&
          parsed.length > 0 &&
          parsed.every((p) => p.id && p.images?.some(isValidCatalogImage))
        ) {
          const normalized = parsed.map((p) => {
            if (p.id === 'prod-pearl-rose-charm' && p.name.includes('(Set of 3)')) {
              return { ...p, name: 'Pearl Blossom Crochet Rose' };
            }
            if (
              [
                'prod-pink-bow-bag-charm',
                'prod-initial-letter-keychain',
                'prod-lavender-bow-bag-charm',
                'prod-sky-blue-bow-bag-charm'
              ].includes(p.id) &&
              !localStorage.getItem('dreamqueen_new_keychains_price50_v1')
            ) {
              return { ...p, price: 50, originalPrice: 99 };
            }
            return p;
          });
          try {
            localStorage.setItem('dreamqueen_new_keychains_price50_v1', '1');
          } catch {}
          return mergeMissingStarterProducts(normalized);
        }
      }
      return INITIAL_PRODUCTS.map((p) => ({ ...p, isActive: p.isActive ?? true }));
    } catch {
      return INITIAL_PRODUCTS.map((p) => ({ ...p, isActive: p.isActive ?? true }));
    }
  });

  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('dreamqueen_cart');
      if (saved) {
        const parsed: CartItem[] = JSON.parse(saved);
        return (Array.isArray(parsed) ? parsed : []).filter(
          (item) => item?.product?.id && Number(item.quantity) > 0
        );
      }
      return [];
    } catch {
      return [];
    }
  });

  const [wishlist, setWishlist] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('dreamqueen_wishlist');
      if (saved) {
        const parsed: string[] = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
      return [];
    } catch {
      return [];
    }
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    try {
      const saved = localStorage.getItem('dreamqueen_orders_v2');
      if (saved) {
        const parsed: Order[] = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.map((ord) => ({
            ...ord,
            items: (ord.items || []).map((it) => ({
              ...it,
              image: resolveItemImage(it.productId, it.image)
            }))
          }));
        }
      }
      return INITIAL_ORDERS;
    } catch {
      return INITIAL_ORDERS;
    }
  });

  const [coupons, setCoupons] = useState<Coupon[]>(() => {
    try {
      const saved = localStorage.getItem('dreamqueen_coupons');
      return saved ? JSON.parse(saved) : INITIAL_COUPONS;
    } catch {
      return INITIAL_COUPONS;
    }
  });

  const [activeCoupon, setActiveCoupon] = useState<Coupon | null>(null);

  const [customOrders, setCustomOrders] = useState<CustomOrderRequest[]>(() => {
    try {
      const saved = localStorage.getItem('dreamqueen_custom_orders');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [feedbacks, setFeedbacks] = useState<PurchasedItemFeedback[]>(() => {
    try {
      const saved = localStorage.getItem('dreamqueen_feedbacks');
      return saved ? JSON.parse(saved) : INITIAL_FEEDBACKS;
    } catch {
      return INITIAL_FEEDBACKS;
    }
  });

  const [activeFeedbackTarget, setActiveFeedbackTarget] = useState<{
    order: Order;
    item: OrderItem;
  } | null>(null);

  const [storeSettings, setStoreSettings] = useState<StoreSettings>(() => {
    try {
      const saved = localStorage.getItem('dreamqueen_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...DEFAULT_STORE_SETTINGS,
          ...parsed,
          shiprocketApiKey: ''
        };
      }
      return DEFAULT_STORE_SETTINGS;
    } catch {
      return DEFAULT_STORE_SETTINGS;
    }
  });

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isPasswordRecoveryMode, setIsPasswordRecoveryMode] = useState(false);
  const [authModalIntent, setAuthModalIntent] = useState<'checkout' | 'general' | 'custom_order'>(
    'general'
  );

  const openAuthModal = (intent: 'checkout' | 'general' | 'custom_order' = 'general') => {
    setAuthModalIntent(intent);
    setIsAuthModalOpen(true);
  };

  const [activeTab, setActiveTabState] = useState<AppTab>('home');
  const [selectedShopCategory, setSelectedShopCategory] = useState<string>('All');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isUpiScannerOpen, setIsUpiScannerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [toasts, setToasts] = useState<ToastInfo[]>([]);
  const [isSupabaseSyncing, setIsSupabaseSyncing] = useState<boolean>(false);

  const setActiveTab = useCallback((tab: AppTab) => {
    setActiveTabState(tab);
  }, []);

  const showToast = useCallback(
    (message: string, type: 'success' | 'info' | 'error' = 'success') => {
      const id = Math.random().toString(36).substring(2, 9);
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4000);
    },
    []
  );

  // Clean up legacy insecure password storage key if present
  useEffect(() => {
    try {
      localStorage.removeItem('dreamqueen_registered_users');
      localStorage.removeItem('dreamqueen_current_user');
    } catch {}
  }, []);

  // Hydrate authenticated Supabase user -> profiles + addresses
  const hydrateUserFromSession = useCallback(async (authUser: any | null) => {
    if (!authUser) {
      setCurrentUser(null);
      setIsAuthLoading(false);
      return;
    }

    try {
      const [profile, addresses] = await Promise.all([
        fetchCurrentProfile().catch(() => null),
        fetchUserAddresses(authUser.id).catch(() => [])
      ]);

      const fallbackAddresses: ShippingAddress[] = Array.isArray(profile?.saved_addresses)
        ? profile.saved_addresses
        : [];
      const mergedAddresses = addresses.length > 0 ? addresses : fallbackAddresses;

      const userWish: string[] = Array.isArray(profile?.wishlist_product_ids)
        ? profile.wishlist_product_ids
        : [];

      const role: 'customer' | 'admin' = profile?.role === 'admin' ? 'admin' : 'customer';

      const hydratedUser: User = {
        id: authUser.id,
        name:
          profile?.full_name ||
          authUser.user_metadata?.full_name ||
          authUser.email?.split('@')[0] ||
          'DreamQueen Customer',
        email: authUser.email || profile?.email || '',
        phone: profile?.phone || authUser.user_metadata?.phone || '',
        role,
        emailConfirmed: Boolean(authUser.email_confirmed_at),
        savedAddresses: mergedAddresses,
        wishlistProductIds: userWish
      };

      setCurrentUser(hydratedUser);
      if (userWish.length > 0) {
        setWishlist((prev) => Array.from(new Set([...prev, ...userWish])));
      }
    } catch {
      setCurrentUser({
        id: authUser.id,
        name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'Customer',
        email: authUser.email || '',
        phone: authUser.user_metadata?.phone || '',
        role: 'customer',
        emailConfirmed: Boolean(authUser.email_confirmed_at),
        savedAddresses: [],
        wishlistProductIds: []
      });
    } finally {
      setIsAuthLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!mounted) return;
        hydrateUserFromSession(data.session?.user || null);
      })
      .catch(() => {
        if (mounted) hydrateUserFromSession(null);
      });

    const { data: subscription } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      if (event === 'PASSWORD_RECOVERY') {
        setIsPasswordRecoveryMode(true);
        setIsAuthModalOpen(true);
      }
      hydrateUserFromSession(session?.user || null);
    });

    return () => {
      mounted = false;
      subscription.subscription.unsubscribe();
    };
  }, [hydrateUserFromSession]);

  // Synchronize data from connected Supabase backend
  const refreshFromSupabase = useCallback(async () => {
    setIsSupabaseSyncing(true);
    try {
      // 1. Products
      try {
        const liveProducts = await fetchProductsFromSupabase();
        if (liveProducts && liveProducts.length > 0) {
          const sanitized = liveProducts
            .filter((p) => p.images?.some(isValidCatalogImage))
            .map((p) => {
              if (p.id !== 'prod-pearl-rose-charm') return p;
              const nextName = p.name.includes('(Set of 3)')
                ? 'Pearl Blossom Crochet Rose'
                : p.name;
              const nextImages =
                p.images?.[0]?.startsWith('/assets/aistudio/') &&
                !p.images[0].includes('Crochet_Flower_Charm_on_Cream_Handbag_02a1d697')
                  ? ['/assets/aistudio/Crochet_Flower_Charm_on_Cream_Handbag_02a1d697.png']
                  : p.images;
              return nextName !== p.name || nextImages !== p.images
                ? { ...p, name: nextName, images: nextImages }
                : p;
            });
          if (sanitized.length > 0) {
            setProducts(mergeMissingStarterProducts(sanitized));
          }
        }
      } catch (err) {
        console.warn('[Supabase] Products sync notice:', err);
      }

      // 2. Orders (respects RLS: user sees own orders; admin sees all orders)
      try {
        const remoteOrders = await fetchOrdersFromSupabase();
        if (remoteOrders && remoteOrders.length > 0) {
          setOrders((prev) => {
            const remoteById = new Map(remoteOrders.map((o) => [o.id, o]));
            const remoteByNum = new Map(remoteOrders.map((o) => [o.orderNumber.toUpperCase(), o]));
            const merged = [...remoteOrders];
            for (const ord of prev) {
              if (
                !remoteById.has(ord.id) &&
                !remoteByNum.has(ord.orderNumber.toUpperCase()) &&
                !ord.id.startsWith('ord-demo-')
              ) {
                merged.push(ord);
              }
            }
            return merged.sort(
              (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
          });
        }
      } catch (err) {
        console.warn('[Supabase] Orders sync notice:', err);
      }

      // 3. Custom orders
      try {
        const liveCustom = await fetchCustomOrdersFromSupabase();
        if (liveCustom && liveCustom.length > 0) {
          setCustomOrders(liveCustom);
        }
      } catch (err) {
        console.warn('[Supabase] Custom orders sync notice:', err);
      }

      // 4. Feedbacks
      try {
        const liveFeedbacks = await fetchFeedbacksFromSupabase();
        if (liveFeedbacks && liveFeedbacks.length > 0) {
          setFeedbacks(liveFeedbacks);
        }
      } catch (err) {
        console.warn('[Supabase] Feedbacks sync notice:', err);
      }

      // 5. Coupons
      try {
        const liveCoupons = await fetchCouponsFromSupabase();
        if (liveCoupons && liveCoupons.length > 0) {
          setCoupons(liveCoupons);
        }
      } catch (err) {
        console.warn('[Supabase] Coupons sync notice:', err);
      }

      // 6. Store settings
      try {
        const liveSettings = await fetchStoreSettingsFromSupabase();
        if (liveSettings) {
          setStoreSettings((prev) => ({
            ...prev,
            ...liveSettings
          }));
        }
      } catch (err) {
        console.warn('[Supabase] Store settings sync notice:', err);
      }
    } finally {
      setIsSupabaseSyncing(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    let unsubscribe = () => {};
    let intervalId: ReturnType<typeof setInterval> | null = null;

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        refreshFromSupabase();
      }
    };

    const bootstrapSync = async () => {
      try {
        const healthResp = await fetch('/api/health');
        const healthJson = await healthResp.json().catch(() => null);
        if (healthJson && healthJson.integrations?.supabaseReachable === false) {
          return;
        }
      } catch {
        // Proceed if /api/health unavailable
      }

      if (!active) return;
      refreshFromSupabase();

      unsubscribe = subscribeToRealtimeUpdates({
        onProductChange: (event, payload) => {
          if (event === 'DELETE' && payload.old?.id) {
            const delId = String(payload.old.id);
            setProducts((prev) => prev.filter((p) => p.id !== delId));
          } else if (payload.new) {
            const incoming = productFromSupabaseRow(payload.new);
            setProducts((prev) => {
              const idx = prev.findIndex((p) => p.id === incoming.id);
              if (idx >= 0) {
                const updated = [...prev];
                updated[idx] = incoming;
                return updated;
              }
              return [incoming, ...prev];
            });
          }
        },
        onOrderChange: (event, payload) => {
          if (event === 'DELETE') {
            const delId = String(payload.old?.id || '');
            const delNum = String(payload.old?.order_number || '');
            setOrders((prev) =>
              prev.filter(
                (o) => (delId ? o.id !== delId : true) && (delNum ? o.orderNumber !== delNum : true)
              )
            );
          } else if (payload.new) {
            const incoming = orderFromSupabaseRow(payload.new);
            setOrders((prev) => {
              const idx = prev.findIndex(
                (o) => o.id === incoming.id || o.orderNumber === incoming.orderNumber
              );
              if (idx >= 0) {
                const updated = [...prev];
                updated[idx] = incoming;
                return updated;
              }
              return [incoming, ...prev];
            });
          }
        },
        onCustomOrderChange: (event, payload) => {
          if (event === 'DELETE' && payload.old?.id) {
            const delId = String(payload.old.id);
            setCustomOrders((prev) => prev.filter((c) => c.id !== delId));
          } else if (payload.new) {
            const incoming = customOrderFromSupabaseRow(payload.new);
            setCustomOrders((prev) => {
              const idx = prev.findIndex((c) => c.id === incoming.id);
              if (idx >= 0) {
                const updated = [...prev];
                updated[idx] = incoming;
                return updated;
              }
              return [incoming, ...prev];
            });
          }
        },
        onFeedbackChange: (event, payload) => {
          if (event === 'DELETE' && payload.old?.id) {
            const delId = String(payload.old.id);
            setFeedbacks((prev) => prev.filter((f) => f.id !== delId));
          } else if (payload.new) {
            const incoming = feedbackFromSupabaseRow(payload.new);
            setFeedbacks((prev) => {
              const idx = prev.findIndex((f) => f.id === incoming.id);
              if (idx >= 0) {
                const updated = [...prev];
                updated[idx] = incoming;
                return updated;
              }
              return [incoming, ...prev];
            });
          }
        },
        onCouponChange: () => {
          fetchCouponsFromSupabase()
            .then((list) => {
              if (list.length > 0) setCoupons(list);
            })
            .catch(() => {});
        },
        onSettingsChange: () => {
          fetchStoreSettingsFromSupabase()
            .then((s) => {
              if (s) setStoreSettings((prev) => ({ ...prev, ...s }));
            })
            .catch(() => {});
        }
      });

      intervalId = setInterval(() => {
        refreshFromSupabase();
      }, 20000);

      document.addEventListener('visibilitychange', handleVisibility);
    };

    bootstrapSync();

    return () => {
      active = false;
      unsubscribe();
      if (intervalId) clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [refreshFromSupabase]);

  // Persist non-sensitive UI caches locally
  useEffect(() => {
    try {
      localStorage.setItem('dreamqueen_products_catalog_v1', JSON.stringify(products));
    } catch {}
  }, [products]);

  useEffect(() => {
    try {
      localStorage.setItem('dreamqueen_cart', JSON.stringify(cart));
    } catch {}
  }, [cart]);

  useEffect(() => {
    try {
      localStorage.setItem('dreamqueen_wishlist', JSON.stringify(wishlist));
    } catch {}
  }, [wishlist]);

  useEffect(() => {
    try {
      localStorage.setItem('dreamqueen_orders_v2', JSON.stringify(orders));
    } catch {}
  }, [orders]);

  useEffect(() => {
    try {
      localStorage.setItem('dreamqueen_coupons', JSON.stringify(coupons));
    } catch {}
  }, [coupons]);

  useEffect(() => {
    try {
      localStorage.setItem('dreamqueen_custom_orders', JSON.stringify(customOrders));
    } catch {}
  }, [customOrders]);

  useEffect(() => {
    try {
      localStorage.setItem('dreamqueen_feedbacks', JSON.stringify(feedbacks));
    } catch {}
  }, [feedbacks]);

  useEffect(() => {
    try {
      localStorage.setItem('dreamqueen_settings', JSON.stringify(storeSettings));
    } catch {}
  }, [storeSettings]);

  const activeProducts = products.filter((p) => p.isActive !== false);

  // =========================================================
  // ADMIN PRODUCT CRUD
  // =========================================================
  const addProduct = async (productData: Omit<Product, 'id'>) => {
    const newProduct: Product = {
      ...productData,
      isActive: productData.isActive ?? true,
      id: `prod-${Date.now()}`
    };
    setProducts((prev) => [newProduct, ...prev]);
    const res = await syncProductToSupabase(newProduct);
    if (!res.success) {
      showToast(`Saved locally. Supabase notice: ${res.error}`, 'info');
    } else {
      showToast(`Added "${newProduct.name}" to catalog!`);
    }
  };

  const updateProduct = async (id: string, updates: Partial<Product>) => {
    let updatedTarget: Product | undefined;
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          updatedTarget = { ...p, ...updates };
          return updatedTarget;
        }
        return p;
      })
    );
    if (updatedTarget) {
      const res = await syncProductToSupabase(updatedTarget);
      if (!res.success) {
        showToast(`Updated locally. Supabase notice: ${res.error}`, 'info');
        return;
      }
    }
    showToast('Product updated successfully');
  };

  const deleteProduct = async (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
    try {
      const deleted = getDeletedStarterProductIds();
      deleted.add(id);
      localStorage.setItem('dreamqueen_deleted_product_ids_v1', JSON.stringify(Array.from(deleted)));
    } catch {}
    try {
      await deleteProductFromSupabase(id);
      showToast('Product removed from catalog', 'info');
    } catch (err: any) {
      showToast(err?.message || 'Removed locally (check admin permissions in DB)', 'info');
    }
  };

  const updateProductStock = async (id: string, delta: number) => {
    let target: Product | undefined;
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          target = { ...p, stock: Math.max(0, p.stock + delta) };
          return target;
        }
        return p;
      })
    );
    if (target) {
      await syncProductToSupabase(target).catch(() => {});
    }
  };

  // =========================================================
  // CART & WISHLIST (Stock-capped)
  // =========================================================
  const addToCart = (product: Product, quantity = 1, colorIndex = 0) => {
    if (product.stock <= 0 || product.isActive === false) {
      showToast(`"${product.name}" is currently out of stock.`, 'error');
      return;
    }

    const chosenColor =
      product.colors && product.colors.length > 0
        ? product.colors[colorIndex] || product.colors[0]
        : { name: 'Original', hex: '#5B3A29' };

    let capped = false;
    setCart((prev) => {
      const existing = prev.find(
        (item) => item.product.id === product.id && item.selectedColor.name === chosenColor.name
      );
      const existingQty = existing ? existing.quantity : 0;
      const desiredTotal = existingQty + quantity;
      const finalQty = Math.min(product.stock, desiredTotal);
      if (desiredTotal > product.stock) {
        capped = true;
      }
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id && item.selectedColor.name === chosenColor.name
            ? { ...item, product, quantity: finalQty }
            : item
        );
      }
      return [...prev, { product, quantity: finalQty, selectedColor: chosenColor }];
    });

    if (capped) {
      showToast(`Adjusted to maximum available stock (${product.stock}) for ${product.name}.`, 'info');
    } else {
      showToast(`Added ${product.name} (${chosenColor.name}) to your basket!`);
    }
  };

  const removeFromCart = (productId: string, colorName: string) => {
    setCart((prev) =>
      prev.filter(
        (item) => !(item.product.id === productId && item.selectedColor.name === colorName)
      )
    );
    showToast('Item removed from basket', 'info');
  };

  const updateCartQuantity = (productId: string, colorName: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId, colorName);
      return;
    }
    const latestProd = products.find((p) => p.id === productId);
    setCart((prev) =>
      prev.map((item) => {
        if (item.product.id === productId && item.selectedColor.name === colorName) {
          const maxStock = latestProd?.stock ?? item.product.stock;
          if (quantity > maxStock) {
            showToast(`Only ${maxStock} piece(s) in stock right now.`, 'info');
            return { ...item, quantity: Math.max(1, maxStock) };
          }
          return { ...item, quantity };
        }
        return item;
      })
    );
  };

  const clearCart = () => setCart([]);

  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const cartSubtotal = cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0);

  const toggleWishlist = (productId: string) => {
    setWishlist((prev) => {
      const exists = prev.includes(productId);
      const next = exists ? prev.filter((id) => id !== productId) : [...prev, productId];
      showToast(exists ? 'Removed from wishlist' : 'Saved to your handmade wishlist', exists ? 'info' : 'success');

      if (currentUser) {
        updateCurrentProfile(currentUser.name, currentUser.phone, {
          wishlistProductIds: next
        }).catch(() => {});
      }
      return next;
    });
  };

  const isInWishlist = (productId: string) => wishlist.includes(productId);

  // =========================================================
  // SERVER-VALIDATED ORDER LIFECYCLE
  // =========================================================
  const placeServerOrder = async (input: PlaceOrderInput): Promise<PlaceOrderResult> => {
    try {
      const token = await getAccessToken();
      const resp = await fetch('/api/orders/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          items: cart.map((item) => ({
            productId: item.product.id,
            quantity: item.quantity,
            selectedColor: item.selectedColor
          })),
          shippingAddress: input.shippingAddress,
          paymentMethod: input.paymentMethod,
          couponCode: activeCoupon?.code || undefined,
          notes: input.notes,
          idempotencyKey: input.idempotencyKey
        })
      });

      const payload = await resp.json().catch(() => ({}));
      if (!resp.ok || !payload.order) {
        return {
          error:
            payload?.error ||
            'Could not create your order right now. Please check your details and try again.'
        };
      }

      const createdOrder: Order = payload.order;
      setOrders((prev) => {
        const exists = prev.some((o) => o.id === createdOrder.id);
        return exists ? prev : [createdOrder, ...prev];
      });

      // Deduct local product stock to mirror server state immediately
      createdOrder.items.forEach((it) => {
        setProducts((prev) =>
          prev.map((p) =>
            p.id === it.productId ? { ...p, stock: Math.max(0, p.stock - it.quantity) } : p
          )
        );
      });

      // Clear cart & active coupon ONLY after persistence succeeded!
      clearCart();
      setActiveCoupon(null);

      return { order: createdOrder };
    } catch (err: any) {
      return {
        error: err?.message || 'Network error while placing your order. Your basket is still safe.'
      };
    }
  };

  const refreshOrderAfterGateway = (updatedOrderRow: any) => {
    if (!updatedOrderRow) return;
    const mapped = orderFromSupabaseRow(updatedOrderRow);
    setOrders((prev) => prev.map((o) => (o.id === mapped.id ? mapped : o)));
  };

  const submitUpiUtr = async (
    orderId: string,
    utr: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const token = await getAccessToken();
      const resp = await fetch('/api/payments/upi/submit-utr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ orderId, utr })
      });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        return { success: false, error: data.error || 'Could not record UTR reference.' };
      }

      setOrders((prev) =>
        prev.map((ord) =>
          ord.id === orderId
            ? {
                ...ord,
                upiTransactionRef: utr.trim(),
                paymentStatus: 'pending',
                trackingStatus: 'payment_pending'
              }
            : ord
        )
      );
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Network error submitting UTR.' };
    }
  };

  const verifyOrderPaymentAdmin = async (
    orderId: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const token = await getAccessToken();
      const resp = await fetch(`/api/admin/orders/${orderId}/verify-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        return { success: false, error: data.error || 'Verification failed.' };
      }
      const nowIso = new Date().toISOString();
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? {
                ...o,
                paymentStatus: 'paid',
                paymentVerifiedAt: nowIso,
                trackingStatus:
                  o.trackingStatus === 'pending' || o.trackingStatus === 'payment_pending'
                    ? 'preparing'
                    : o.trackingStatus
              }
            : o
        )
      );
      showToast('Payment marked as verified & paid!');
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Verification request failed.' };
    }
  };

  const refundOrderAdmin = async (
    orderId: string
  ): Promise<{ success: boolean; refundStatus?: string; error?: string }> => {
    try {
      const token = await getAccessToken();
      const resp = await fetch(`/api/admin/orders/${orderId}/refund`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        return { success: false, error: data.error || 'Refund failed.' };
      }
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? {
                ...o,
                paymentStatus: data.refundStatus || 'refund_initiated',
                trackingStatus: data.refundStatus || 'refund_initiated',
                refundStatus: data.refundStatus,
                refundId: data.refundId || o.refundId
              }
            : o
        )
      );
      showToast(`Refund ${data.refundStatus === 'refunded' ? 'completed' : 'initiated'}.`);
      return { success: true, refundStatus: data.refundStatus };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Refund request failed.' };
    }
  };

  const cancelUserOrder = async (
    orderId: string,
    reason = 'Cancelled by customer before dispatch'
  ): Promise<{ success: boolean; error?: string }> => {
    const target = orders.find((o) => o.id === orderId || o.orderNumber === orderId);
    if (!target) {
      return { success: false, error: 'Order not found.' };
    }
    const cancellableStatuses: OrderTrackingStatus[] = [
      'pending',
      'payment_pending',
      'payment_confirmed',
      'preparing'
    ];
    if (!cancellableStatuses.includes(target.trackingStatus)) {
      return {
        success: false,
        error: 'Orders already packed or shipped cannot be cancelled online. Please contact support.'
      };
    }

    const res = await updateOrderStatus(target.id, 'cancelled', undefined, reason);
    return res;
  };

  const updateOrderStatus = async (
    orderId: string,
    status: OrderTrackingStatus,
    trackingNo?: string,
    cancellationReason?: string
  ): Promise<{ success: boolean; error?: string }> => {
    const existing = orders.find((ord) => ord.id === orderId || ord.orderNumber === orderId);
    const shouldRestoreStock =
      existing && existing.trackingStatus !== 'cancelled' && status === 'cancelled';

    setOrders((prev) =>
      prev.map((ord) => {
        if (ord.id === orderId || ord.orderNumber === orderId) {
          return {
            ...ord,
            trackingStatus: status,
            shiprocketTrackingNumber:
              trackingNo !== undefined ? trackingNo : ord.shiprocketTrackingNumber,
            cancellationReason:
              cancellationReason !== undefined ? cancellationReason : ord.cancellationReason
          };
        }
        return ord;
      })
    );

    if (shouldRestoreStock && existing) {
      for (const it of existing.items) {
        await updateProductStock(it.productId, it.quantity);
      }
    }

    if (currentUser?.role === 'admin') {
      try {
        const token = await getAccessToken();
        const resp = await fetch(`/api/admin/orders/${existing?.id || orderId}/status`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
          body: JSON.stringify({
            trackingStatus: status,
            shiprocketTrackingNumber: trackingNo,
            cancellationReason
          })
        });
        if (!resp.ok) {
          const data = await resp.json().catch(() => ({}));
          return { success: false, error: data.error };
        }
      } catch {}
    } else {
      await updateOrderStatusInSupabase(existing?.id || orderId, status, trackingNo).catch(
        () => {}
      );
    }

    showToast(`Order status updated to ${status.replace(/_/g, ' ').toUpperCase()}`);
    return { success: true };
  };

  const getOrderByIdOrNumber = (query: string): Order | undefined => {
    const clean = query.trim().toUpperCase();
    return orders.find(
      (ord) => ord.orderNumber.toUpperCase() === clean || ord.id.toUpperCase() === clean
    );
  };

  // =========================================================
  // COUPONS
  // =========================================================
  const applyCoupon = (code: string) => {
    const normalized = code.trim().toUpperCase();
    const coupon = coupons.find((c) => c.code.toUpperCase() === normalized);
    const check = validateCouponRule(coupon, cartSubtotal);

    if (!check.valid || !coupon) {
      return { success: false, message: check.reason || 'Invalid or expired coupon code.' };
    }

    setActiveCoupon(coupon);
    showToast(`Coupon ${coupon.code} applied! Enjoy your handmade discount 🌸`);
    return { success: true, message: `Coupon ${coupon.code} applied successfully!` };
  };

  const removeCoupon = () => {
    setActiveCoupon(null);
    showToast('Coupon removed', 'info');
  };

  const addCoupon = async (coupon: Coupon) => {
    const normalized = { ...coupon, code: coupon.code.toUpperCase() };
    setCoupons((prev) => [normalized, ...prev.filter((c) => c.code !== normalized.code)]);
    try {
      await upsertCouponToSupabase(normalized);
      showToast(`Coupon ${normalized.code} saved!`);
    } catch (err: any) {
      showToast(err?.message || 'Saved locally (admin DB policy notice)', 'info');
    }
  };

  const updateCoupon = async (coupon: Coupon) => {
    setCoupons((prev) => prev.map((c) => (c.code === coupon.code ? coupon : c)));
    try {
      await upsertCouponToSupabase(coupon);
      showToast(`Coupon ${coupon.code} updated`);
    } catch (err: any) {
      showToast(err?.message || 'Updated locally', 'info');
    }
  };

  const deleteCoupon = async (code: string) => {
    setCoupons((prev) => prev.filter((c) => c.code !== code));
    if (activeCoupon?.code === code) setActiveCoupon(null);
    try {
      await deleteCouponFromSupabase(code);
      showToast('Coupon deleted', 'info');
    } catch {
      showToast('Coupon deleted locally', 'info');
    }
  };

  // =========================================================
  // CUSTOM ORDERS
  // =========================================================
  const submitCustomOrder = async (
    request: Omit<CustomOrderRequest, 'id' | 'status' | 'createdAt'>
  ) => {
    const newRequest: CustomOrderRequest = {
      ...request,
      userId: currentUser?.id,
      id: `custom-${Date.now()}`,
      status: 'submitted',
      createdAt: new Date().toISOString()
    };
    setCustomOrders((prev) => [newRequest, ...prev]);
    await syncCustomOrderToSupabase(newRequest).catch(() => {});
    showToast('Custom order inquiry submitted! We will contact you on WhatsApp 🌸');
  };

  const updateCustomOrderStatus = async (
    id: string,
    status: CustomOrderRequest['status'],
    extra?: { quotedPrice?: number; adminNotes?: string }
  ) => {
    setCustomOrders((prev) =>
      prev.map((co) =>
        co.id === id
          ? {
              ...co,
              status,
              quotedPrice: extra?.quotedPrice ?? co.quotedPrice,
              adminNotes: extra?.adminNotes ?? co.adminNotes
            }
          : co
      )
    );
    await updateCustomOrderInSupabase(id, {
      status,
      quotedPrice: extra?.quotedPrice,
      adminNotes: extra?.adminNotes
    }).catch(() => {});
    showToast('Custom inquiry updated');
  };

  // =========================================================
  // FEEDBACK / REVIEWS
  // =========================================================
  const submitFeedback = async (
    feedbackData: Omit<PurchasedItemFeedback, 'id' | 'createdAt'>
  ) => {
    const existingIndex = feedbacks.findIndex(
      (f) => f.orderNumber === feedbackData.orderNumber && f.productId === feedbackData.productId
    );

    let feedbackToSync: PurchasedItemFeedback;
    if (existingIndex >= 0) {
      feedbackToSync = {
        ...feedbacks[existingIndex],
        ...feedbackData,
        userId: currentUser?.id || feedbacks[existingIndex].userId,
        isApproved: true,
        createdAt: new Date().toISOString()
      };
      setFeedbacks((prev) => prev.map((f, i) => (i === existingIndex ? feedbackToSync : f)));
      showToast('Thank you! Your review has been updated 🌸');
    } else {
      feedbackToSync = {
        ...feedbackData,
        userId: currentUser?.id,
        isVerifiedPurchase: true,
        isApproved: true,
        id: `fb-${Date.now()}`,
        createdAt: new Date().toISOString()
      };
      setFeedbacks((prev) => [feedbackToSync, ...prev]);
      setProducts((prev) =>
        prev.map((p) => {
          if (p.id === feedbackData.productId) {
            const curCount = p.reviewsCount || 0;
            const nextCount = curCount + 1;
            const nextAvg = Number(
              (((p.rating || 5) * curCount + feedbackData.rating) / nextCount).toFixed(1)
            );
            return { ...p, reviewsCount: nextCount, rating: nextAvg };
          }
          return p;
        })
      );
      showToast('Thank you! Your verified review helps our artisans bloom 🌸');
    }

    setActiveFeedbackTarget(null);
    await syncFeedbackToSupabase(feedbackToSync).catch(() => {});
  };

  const getFeedbackForOrderItem = (
    orderNumber: string,
    productId: string
  ): PurchasedItemFeedback | undefined => {
    return feedbacks.find(
      (f) => f.orderNumber === orderNumber && f.productId === productId
    );
  };

  const replyToFeedback = async (feedbackId: string, replyText: string) => {
    const replyObj = {
      text: replyText,
      respondedAt: new Date().toISOString(),
      author: 'DreamQueen Atelier Team'
    };
    let targetFb: PurchasedItemFeedback | undefined;
    setFeedbacks((prev) =>
      prev.map((f) => {
        if (f.id === feedbackId) {
          targetFb = { ...f, artisanResponse: replyObj };
          return targetFb;
        }
        return f;
      })
    );
    if (targetFb) {
      await syncFeedbackToSupabase(targetFb).catch(() => {});
    }
    showToast('Artisan response posted! 💌');
  };

  const toggleFeedbackApproval = async (feedbackId: string, isApproved: boolean) => {
    let targetFb: PurchasedItemFeedback | undefined;
    setFeedbacks((prev) =>
      prev.map((f) => {
        if (f.id === feedbackId) {
          targetFb = { ...f, isApproved };
          return targetFb;
        }
        return f;
      })
    );
    if (targetFb) {
      await syncFeedbackToSupabase(targetFb).catch(() => {});
    }
    showToast(isApproved ? 'Review published to storefront' : 'Review hidden from storefront', 'info');
  };

  const deleteFeedback = async (feedbackId: string) => {
    setFeedbacks((prev) => prev.filter((f) => f.id !== feedbackId));
    await deleteFeedbackFromSupabase(feedbackId).catch(() => {});
    showToast('Review deleted', 'info');
  };

  // =========================================================
  // STORE SETTINGS
  // =========================================================
  const updateStoreSettings = async (settings: Partial<StoreSettings>) => {
    const next = { ...storeSettings, ...settings };
    setStoreSettings(next);
    try {
      await updateStoreSettingsInSupabase(next);
      showToast('Store settings saved to database');
    } catch (err: any) {
      showToast(err?.message || 'Settings saved locally', 'info');
    }
  };

  // =========================================================
  // REAL SUPABASE AUTHENTICATION
  // =========================================================
  const registerUser = async (data: {
    name: string;
    email: string;
    phone: string;
    password: string;
  }): Promise<AuthActionResult> => {
    const trimmedName = data.name.trim();
    const trimmedEmail = data.email.trim().toLowerCase();
    const normalizedPhone = normalizeIndianPhone(data.phone);

    if (!trimmedName) {
      return { success: false, error: 'Please enter your full name.' };
    }
    if (normalizedPhone.length < 10) {
      return { success: false, error: 'Please enter a valid 10-digit mobile number.' };
    }
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      return { success: false, error: 'Please enter a valid email address.' };
    }
    if (!data.password || data.password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters long.' };
    }

    const res = await signUpWithSupabase({
      name: trimmedName,
      email: trimmedEmail,
      phone: normalizedPhone,
      password: data.password
    });

    if (res.error) {
      return { success: false, error: res.error };
    }

    if (res.requiresEmailVerification) {
      showToast('Verification link sent to your email! Please confirm before signing in.', 'info');
      return { success: true, requiresEmailVerification: true };
    }

    await hydrateUserFromSession(res.user);
    setIsAuthModalOpen(false);
    showToast(`Welcome to DreamQueen, ${trimmedName.split(' ')[0]}! 💕`);

    if (authModalIntent === 'checkout') {
      setIsCheckoutOpen(true);
    }
    return { success: true };
  };

  const loginUser = async (email: string, password: string): Promise<AuthActionResult> => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { success: false, error: 'Please enter a valid registered email address.' };
    }
    if (!password) {
      return { success: false, error: 'Please enter your password.' };
    }

    const res = await signInWithSupabase(cleanEmail, password);
    if (res.error || !res.user) {
      return {
        success: false,
        error: res.error || 'Invalid email or password. Please verify your credentials.'
      };
    }

    await hydrateUserFromSession(res.user);
    setIsAuthModalOpen(false);
    const firstName =
      res.user.user_metadata?.full_name?.split(' ')[0] || cleanEmail.split('@')[0];
    showToast(`Welcome back, ${firstName}! 🌸`);

    if (authModalIntent === 'checkout') {
      setIsCheckoutOpen(true);
    }
    return { success: true };
  };

  const requestPasswordReset = async (email: string): Promise<AuthActionResult> => {
    const clean = email.trim().toLowerCase();
    if (!clean || !clean.includes('@')) {
      return { success: false, error: 'Please enter your registered email address.' };
    }
    const res = await sendPasswordResetEmail(clean);
    if (!res.success) {
      return { success: false, error: res.error || 'Could not send reset email.' };
    }
    showToast('Password reset link sent to your email!', 'success');
    return { success: true };
  };

  const completePasswordReset = async (newPassword: string): Promise<AuthActionResult> => {
    if (!newPassword || newPassword.length < 6) {
      return { success: false, error: 'New password must be at least 6 characters.' };
    }
    const res = await updateUserPassword(newPassword);
    if (!res.success) {
      return { success: false, error: res.error || 'Failed to update password.' };
    }
    setIsPasswordRecoveryMode(false);
    setIsAuthModalOpen(false);
    showToast('Your password has been updated! 🎉');
    return { success: true };
  };

  const resendVerification = async (email: string): Promise<AuthActionResult> => {
    const res = await resendVerificationEmail(email);
    if (!res.success) {
      return { success: false, error: res.error };
    }
    showToast('Verification email resent! Please check your inbox.', 'info');
    return { success: true };
  };

  const logoutUser = async () => {
    await signOutSupabase();
    setCurrentUser(null);
    if (activeTab === 'admin') {
      setActiveTab('home');
    }
    showToast('Logged out successfully', 'info');
  };

  const updateUserProfile = async (
    name: string,
    phone: string
  ): Promise<{ error?: string }> => {
    if (!currentUser) return { error: 'Not authenticated' };
    const cleanPhone = normalizeIndianPhone(phone);
    const res = await updateCurrentProfile(name.trim(), cleanPhone);
    if (res.error) return { error: res.error };

    setCurrentUser((prev) =>
      prev ? { ...prev, name: name.trim(), phone: cleanPhone } : prev
    );
    showToast('Profile saved!');
    return {};
  };

  const saveUserAddress = async (
    address: ShippingAddress
  ): Promise<{ address?: ShippingAddress; error?: string }> => {
    if (!currentUser) {
      return { error: 'Please sign in to save addresses.' };
    }
    const res = await upsertUserAddress(currentUser.id, address);
    if (res.error || !res.address) {
      return { error: res.error || 'Could not save address.' };
    }

    const updated = await fetchUserAddresses(currentUser.id);
    const nextAddresses =
      updated.length > 0
        ? updated
        : [res.address, ...currentUser.savedAddresses.filter((a) => a.id !== res.address!.id)];

    setCurrentUser((prev) => (prev ? { ...prev, savedAddresses: nextAddresses } : prev));
    await updateCurrentProfile(currentUser.name, currentUser.phone, {
      savedAddresses: nextAddresses
    }).catch(() => {});
    showToast('Delivery address saved!');
    return { address: res.address };
  };

  const removeUserAddress = async (addressId: string): Promise<{ error?: string }> => {
    if (!currentUser) return { error: 'Not authenticated' };
    const res = await deleteUserAddress(currentUser.id, addressId);
    if (res.error) return { error: res.error };
    setCurrentUser((prev) =>
      prev
        ? {
            ...prev,
            savedAddresses: prev.savedAddresses.filter((a) => a.id !== addressId)
          }
        : prev
    );
    showToast('Address deleted', 'info');
    return {};
  };

  return (
    <StoreContext.Provider
      value={{
        products,
        activeProducts,
        addProduct,
        updateProduct,
        deleteProduct,
        updateProductStock,
        cart,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        cartCount,
        cartSubtotal,
        wishlist,
        toggleWishlist,
        isInWishlist,
        orders,
        placeServerOrder,
        refreshOrderAfterGateway,
        submitUpiUtr,
        verifyOrderPaymentAdmin,
        refundOrderAdmin,
        cancelUserOrder,
        updateOrderStatus,
        getOrderByIdOrNumber,
        coupons,
        activeCoupon,
        applyCoupon,
        removeCoupon,
        addCoupon,
        updateCoupon,
        deleteCoupon,
        customOrders,
        submitCustomOrder,
        updateCustomOrderStatus,
        feedbacks,
        submitFeedback,
        getFeedbackForOrderItem,
        replyToFeedback,
        toggleFeedbackApproval,
        deleteFeedback,
        activeFeedbackTarget,
        setActiveFeedbackTarget,
        storeSettings,
        updateStoreSettings,
        currentUser,
        isAuthLoading,
        isAuthModalOpen,
        setIsAuthModalOpen,
        isPasswordRecoveryMode,
        setIsPasswordRecoveryMode,
        authModalIntent,
        setAuthModalIntent,
        openAuthModal,
        registerUser,
        loginUser,
        requestPasswordReset,
        completePasswordReset,
        resendVerification,
        logoutUser,
        updateUserProfile,
        saveUserAddress,
        removeUserAddress,
        activeTab,
        setActiveTab,
        selectedShopCategory,
        setSelectedShopCategory,
        selectedProduct,
        setSelectedProduct,
        isCartOpen,
        setIsCartOpen,
        isCheckoutOpen,
        setIsCheckoutOpen,
        isUpiScannerOpen,
        setIsUpiScannerOpen,
        searchQuery,
        setSearchQuery,
        toasts,
        showToast,
        isSupabaseSyncing,
        refreshFromSupabase
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
