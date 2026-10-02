import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Product,
  CartItem,
  Order,
  OrderItem,
  Coupon,
  User,
  CustomOrderRequest,
  StoreSettings,
  OrderTrackingStatus,
  PurchasedItemFeedback
} from '../types';
import {
  INITIAL_PRODUCTS,
  INITIAL_COUPONS,
  INITIAL_ORDERS,
  INITIAL_FEEDBACKS
} from '../data/initialProducts';
import {
  syncOrderToSupabase,
  syncCustomOrderToSupabase,
  syncFeedbackToSupabase,
  fetchProductsFromSupabase,
  fetchOrdersFromSupabase,
  fetchCustomOrdersFromSupabase,
  fetchFeedbacksFromSupabase,
  syncProductToSupabase,
  deleteProductFromSupabase,
  updateOrderStatusInSupabase,
  updateCustomOrderStatusInSupabase,
  signUpWithSupabase,
  signInWithSupabase,
  signOutSupabase,
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

interface StoreContextType {
  products: Product[];
  addProduct: (product: Omit<Product, 'id'>) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  updateProductStock: (id: string, delta: number) => void;

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
  createOrder: (orderData: Omit<Order, 'id' | 'orderNumber' | 'createdAt'>) => Order;
  updateOrderStatus: (orderId: string, status: OrderTrackingStatus, trackingNo?: string) => void;
  getOrderByIdOrNumber: (query: string) => Order | undefined;

  coupons: Coupon[];
  activeCoupon: Coupon | null;
  applyCoupon: (code: string) => { success: boolean; message: string };
  removeCoupon: () => void;
  addCoupon: (coupon: Coupon) => void;
  deleteCoupon: (code: string) => void;

  customOrders: CustomOrderRequest[];
  submitCustomOrder: (request: Omit<CustomOrderRequest, 'id' | 'status' | 'createdAt'>) => void;
  updateCustomOrderStatus: (id: string, status: CustomOrderRequest['status']) => void;

  feedbacks: PurchasedItemFeedback[];
  submitFeedback: (feedback: Omit<PurchasedItemFeedback, 'id' | 'createdAt'>) => void;
  getFeedbackForOrderItem: (orderNumber: string, productId: string) => PurchasedItemFeedback | undefined;
  replyToFeedback: (feedbackId: string, replyText: string) => void;
  activeFeedbackTarget: { order: Order; item: OrderItem } | null;
  setActiveFeedbackTarget: (val: { order: Order; item: OrderItem } | null) => void;

  storeSettings: StoreSettings;
  updateStoreSettings: (settings: Partial<StoreSettings>) => void;

  currentUser: User | null;
  isAdmin: boolean;
  setIsAdmin: (val: boolean) => void;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (val: boolean) => void;
  authModalIntent: 'checkout' | 'general' | 'custom_order';
  setAuthModalIntent: (val: 'checkout' | 'general' | 'custom_order') => void;
  openAuthModal: (intent?: 'checkout' | 'general' | 'custom_order') => void;
  registerUser: (data: { name: string; email: string; phone: string; password?: string }) => boolean;
  loginUser: (identifier: string, passwordOrName?: string) => boolean;
  logoutUser: () => void;
  updateUserProfile: (name: string, phone: string) => void;

  activeTab: 'home' | 'shop' | 'custom' | 'track' | 'customer' | 'admin' | 'contact';
  setActiveTab: (tab: 'home' | 'shop' | 'custom' | 'track' | 'customer' | 'admin' | 'contact') => void;

  selectedProduct: Product | null;
  setSelectedProduct: (product: Product | null) => void;

  isCartOpen: boolean;
  setIsCartOpen: (val: boolean) => void;

  isCheckoutOpen: boolean;
  setIsCheckoutOpen: (val: boolean) => void;

  isUpiScannerOpen: boolean;
  setIsUpiScannerOpen: (val: boolean) => void;

  trackingSearchId: string;
  setTrackingSearchId: (id: string) => void;

  searchQuery: string;
  setSearchQuery: (q: string) => void;

  toasts: ToastInfo[];
  showToast: (message: string, type?: 'success' | 'info' | 'error') => void;

  isSupabaseSyncing: boolean;
  refreshFromSupabase: () => Promise<void>;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

const DEFAULT_SETTINGS: StoreSettings = {
  codEnabled: true,
  codFee: 29,
  freeShippingThreshold: 499,
  standardShippingFee: 40,
  shiprocketApiKey: 'sr_live_demo_984180410',
  supportPhone: '8097706536',
  supportEmail: 'dreamqueen29@gmail.com',
  pinterestUrl: 'https://in.pinterest.com/ayeshalk2025/?actingBusinessId=1147221842487308120',
  pinterestHandle: 'ayeshalk2025',
  upiId: '8097706536@postbank',
  upiPayeeName: 'AYESHA LUKMAN SHAIKH'
};

const DEFAULT_USER: User = {
  id: 'usr-1',
  name: 'Aanya Sharma',
  email: 'aanya@example.com',
  phone: '8097706536',
  role: 'customer',
  savedAddresses: [
    {
      fullName: 'Aanya Sharma',
      phone: '8097706536',
      email: 'aanya@example.com',
      address: 'Flat 402, Blossom Heights, Bandra West',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400050'
    }
  ],
  wishlistProductIds: ['prod-rose-hair-tie', 'prod-lavender-bouquet']
};

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem('dreamqueen_products_v4');
      if (saved) return JSON.parse(saved);
      const prevSaved = localStorage.getItem('dreamqueen_products');
      if (prevSaved) {
        const parsed: Product[] = JSON.parse(prevSaved);
        const existingIds = new Set(parsed.map((p) => p.id));
        const newProducts = INITIAL_PRODUCTS.filter((p) => !existingIds.has(p.id));
        const merged = [...newProducts, ...parsed];
        localStorage.setItem('dreamqueen_products_v4', JSON.stringify(merged));
        return merged;
      }
      return INITIAL_PRODUCTS;
    } catch {
      return INITIAL_PRODUCTS;
    }
  });

  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('dreamqueen_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [wishlist, setWishlist] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('dreamqueen_wishlist');
      return saved ? JSON.parse(saved) : ['prod-rose-hair-tie', 'prod-sunflower-keychain'];
    } catch {
      return ['prod-rose-hair-tie', 'prod-sunflower-keychain'];
    }
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    try {
      const saved = localStorage.getItem('dreamqueen_orders');
      return saved ? JSON.parse(saved) : INITIAL_ORDERS;
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
          ...DEFAULT_SETTINGS,
          ...parsed,
          supportPhone: '8097706536',
          supportEmail: 'dreamqueen29@gmail.com',
          upiId: '8097706536@postbank',
          upiPayeeName: 'AYESHA LUKMAN SHAIKH'
        };
      }
      return DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('dreamqueen_current_user');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.email && parsed.name && parsed.name !== 'Aanya Sharma') {
          return parsed;
        }
      }
      return null;
    } catch {
      return null;
    }
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalIntent, setAuthModalIntent] = useState<'checkout' | 'general' | 'custom_order'>('general');

  const openAuthModal = (intent: 'checkout' | 'general' | 'custom_order' = 'general') => {
    setAuthModalIntent(intent);
    setIsAuthModalOpen(true);
  };
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    try {
      return localStorage.getItem('dreamqueen_is_admin') === 'true';
    } catch {
      return false;
    }
  });
  const [activeTab, setActiveTab] = useState<'home' | 'shop' | 'custom' | 'track' | 'customer' | 'admin' | 'contact'>('home');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isUpiScannerOpen, setIsUpiScannerOpen] = useState(false);
  const [trackingSearchId, setTrackingSearchId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [toasts, setToasts] = useState<ToastInfo[]>([]);
  const [isSupabaseSyncing, setIsSupabaseSyncing] = useState<boolean>(false);

  // Synchronize data from connected Supabase backend
  const refreshFromSupabase = async () => {
    setIsSupabaseSyncing(true);
    try {
      const [prodsRes, ordersRes, customRes, feedbacksRes] = await Promise.allSettled([
        fetchProductsFromSupabase(),
        fetchOrdersFromSupabase(),
        fetchCustomOrdersFromSupabase(),
        fetchFeedbacksFromSupabase()
      ]);

      if (prodsRes.status === 'fulfilled' && prodsRes.value.length > 0) {
        setProducts(prodsRes.value);
        try {
          localStorage.setItem('dreamqueen_products_v4', JSON.stringify(prodsRes.value));
        } catch {}
      }

      if (ordersRes.status === 'fulfilled' && ordersRes.value.length > 0) {
        setOrders((prev) => {
          const remoteOrders = ordersRes.value;
          const remoteMap = new Map(remoteOrders.map((o) => [o.id, o]));
          const remoteNumMap = new Map(remoteOrders.map((o) => [o.orderNumber.toUpperCase(), o]));
          const merged = [...remoteOrders];
          for (const ord of prev) {
            if (!remoteMap.has(ord.id) && !remoteNumMap.has(ord.orderNumber.toUpperCase())) {
              merged.push(ord);
            }
          }
          return merged;
        });
      }

      if (customRes.status === 'fulfilled' && customRes.value.length > 0) {
        setCustomOrders(customRes.value);
      }

      if (feedbacksRes.status === 'fulfilled' && feedbacksRes.value.length > 0) {
        setFeedbacks(feedbacksRes.value);
      }
    } catch (err) {
      console.warn('[Supabase] Sync notice:', err);
    } finally {
      setIsSupabaseSyncing(false);
    }
  };

  // Cross-device live Realtime & visibility sync
  useEffect(() => {
    // 1. Initial cloud fetch
    refreshFromSupabase();

    // 2. Realtime WebSocket subscription for instant cross-device updates
    const unsubscribe = subscribeToRealtimeUpdates({
      onProductChange: (event, payload) => {
        if (event === 'DELETE') {
          if (payload.old?.id) {
            const delId = String(payload.old.id);
            setProducts((prev) => prev.filter((p) => p.id !== delId));
          }
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
          if (payload.old?.id) {
            const delId = String(payload.old.id);
            setOrders((prev) => prev.filter((o) => o.id !== delId));
          }
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
        if (event === 'DELETE') {
          if (payload.old?.id) {
            const delId = String(payload.old.id);
            setCustomOrders((prev) => prev.filter((c) => c.id !== delId));
          }
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
        if (event === 'DELETE') {
          if (payload.old?.id) {
            const delId = String(payload.old.id);
            setFeedbacks((prev) => prev.filter((f) => f.id !== delId));
          }
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
      }
    });

    // 3. Fallback polling every 10 seconds to keep all devices 100% in sync
    const intervalId = setInterval(() => {
      refreshFromSupabase();
    }, 10000);

    // 4. Instant re-sync when switching tabs or bringing app to foreground on mobile
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        refreshFromSupabase();
      }
    };
    const handleFocus = () => {
      refreshFromSupabase();
    };

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', handleFocus);

    return () => {
      unsubscribe();
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // Sync current user session
  useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem('dreamqueen_current_user', JSON.stringify(currentUser));
      } else {
        localStorage.removeItem('dreamqueen_current_user');
      }
    } catch (e) {
      console.warn('User storage save failed', e);
    }
  }, [currentUser]);

  // Sync admin state
  useEffect(() => {
    try {
      localStorage.setItem('dreamqueen_is_admin', isAdmin ? 'true' : 'false');
    } catch (e) {
      console.warn('Storage save failed', e);
    }
  }, [isAdmin]);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('dreamqueen_products_v4', JSON.stringify(products));
      localStorage.setItem('dreamqueen_products', JSON.stringify(products));
    } catch (e) {
      console.warn('Storage save failed', e);
    }
  }, [products]);

  useEffect(() => {
    try {
      localStorage.setItem('dreamqueen_cart', JSON.stringify(cart));
    } catch (e) {
      console.warn('Storage save failed', e);
    }
  }, [cart]);

  useEffect(() => {
    try {
      localStorage.setItem('dreamqueen_wishlist', JSON.stringify(wishlist));
    } catch (e) {
      console.warn('Storage save failed', e);
    }
  }, [wishlist]);

  useEffect(() => {
    try {
      localStorage.setItem('dreamqueen_orders', JSON.stringify(orders));
    } catch (e) {
      console.warn('Storage save failed', e);
    }
  }, [orders]);

  useEffect(() => {
    try {
      localStorage.setItem('dreamqueen_coupons', JSON.stringify(coupons));
    } catch (e) {
      console.warn('Storage save failed', e);
    }
  }, [coupons]);

  useEffect(() => {
    try {
      localStorage.setItem('dreamqueen_custom_orders', JSON.stringify(customOrders));
    } catch (e) {
      console.warn('Storage save failed', e);
    }
  }, [customOrders]);

  useEffect(() => {
    try {
      localStorage.setItem('dreamqueen_feedbacks', JSON.stringify(feedbacks));
    } catch (e) {
      console.warn('Storage save failed', e);
    }
  }, [feedbacks]);

  useEffect(() => {
    try {
      localStorage.setItem('dreamqueen_settings', JSON.stringify(storeSettings));
    } catch (e) {
      console.warn('Storage save failed', e);
    }
  }, [storeSettings]);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3800);
  };

  const addProduct = (productData: Omit<Product, 'id'>) => {
    const newProduct: Product = {
      ...productData,
      id: `prod-${Date.now()}`
    };
    setProducts((prev) => [newProduct, ...prev]);
    syncProductToSupabase(newProduct).catch((err) =>
      console.warn('[Supabase] Sync product notice:', err)
    );
    showToast(`Added "${newProduct.name}" to store catalog!`);
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    setProducts((prev) => {
      const next = prev.map((p) => (p.id === id ? { ...p, ...updates } : p));
      const target = next.find((p) => p.id === id);
      if (target) {
        syncProductToSupabase(target).catch((err) =>
          console.warn('[Supabase] Sync product update notice:', err)
        );
      }
      return next;
    });
    showToast('Product details updated successfully');
  };

  const deleteProduct = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
    deleteProductFromSupabase(id).catch((err) =>
      console.warn('[Supabase] Delete product notice:', err)
    );
    showToast('Product removed from catalog', 'info');
  };

  const updateProductStock = (id: string, delta: number) => {
    setProducts((prev) => {
      const next = prev.map((p) => (p.id === id ? { ...p, stock: Math.max(0, p.stock + delta) } : p));
      const target = next.find((p) => p.id === id);
      if (target) {
        syncProductToSupabase(target).catch((err) =>
          console.warn('[Supabase] Sync product stock update notice:', err)
        );
      }
      return next;
    });
  };

  const addToCart = (product: Product, quantity = 1, colorIndex = 0) => {
    const chosenColor = product.colors && product.colors.length > 0
      ? product.colors[colorIndex] || product.colors[0]
      : { name: 'Original', hex: '#5B3A29' };

    setCart((prev) => {
      const existing = prev.find(
        (item) => item.product.id === product.id && item.selectedColor.name === chosenColor.name
      );
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id && item.selectedColor.name === chosenColor.name
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { product, quantity, selectedColor: chosenColor }];
    });

    showToast(`Added ${product.name} (${chosenColor.name}) to your basket!`);
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
    setCart((prev) =>
      prev.map((item) =>
        item.product.id === productId && item.selectedColor.name === colorName
          ? { ...item, quantity }
          : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const cartSubtotal = cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0);

  const toggleWishlist = (productId: string) => {
    const product = products.find((p) => p.id === productId);
    setWishlist((prev) => {
      const exists = prev.includes(productId);
      if (exists) {
        showToast(`Removed from wishlist`, 'info');
        return prev.filter((id) => id !== productId);
      } else {
        showToast(`Saved to your handmade wishlist ❤️`);
        return [...prev, productId];
      }
    });
  };

  const isInWishlist = (productId: string) => wishlist.includes(productId);

  const createOrder = (orderData: Omit<Order, 'id' | 'orderNumber' | 'createdAt'>): Order => {
    const randomNum = Math.floor(100000 + Math.random() * 900000);
    const orderNumber = `DQ-${randomNum}`;
    const newOrder: Order = {
      ...orderData,
      id: `ord-${Date.now()}`,
      orderNumber,
      createdAt: new Date().toISOString()
    };

    setOrders((prev) => [newOrder, ...prev]);

    // deduct stock
    newOrder.items.forEach((item) => {
      updateProductStock(item.productId, -item.quantity);
    });

    // Asynchronously sync order to Supabase
    syncOrderToSupabase(newOrder).catch((err) =>
      console.warn('[Supabase] Auto-sync order skipped/queued:', err)
    );

    clearCart();
    setActiveCoupon(null);
    return newOrder;
  };

  const updateOrderStatus = (
    orderId: string,
    status: OrderTrackingStatus,
    trackingNo?: string
  ) => {
    setOrders((prev) =>
      prev.map((ord) => {
        if (ord.id === orderId || ord.orderNumber === orderId) {
          return {
            ...ord,
            trackingStatus: status,
            shiprocketTrackingNumber: trackingNo || ord.shiprocketTrackingNumber
          };
        }
        return ord;
      })
    );
    updateOrderStatusInSupabase(orderId, status, trackingNo).catch((err) =>
      console.warn('[Supabase] Update order status notice:', err)
    );
    showToast(`Order status updated to: ${status.replace('_', ' ').toUpperCase()}`);
  };

  const getOrderByIdOrNumber = (query: string): Order | undefined => {
    const clean = query.trim().toUpperCase();
    return orders.find(
      (ord) => ord.orderNumber.toUpperCase() === clean || ord.id.toUpperCase() === clean
    );
  };

  const applyCoupon = (code: string) => {
    const normalized = code.trim().toUpperCase();
    const coupon = coupons.find((c) => c.code.toUpperCase() === normalized && c.isActive);

    if (!coupon) {
      return { success: false, message: 'Invalid or expired coupon code' };
    }

    if (cartSubtotal < coupon.minOrderAmount) {
      return {
        success: false,
        message: `Requires a minimum cart value of ₹${coupon.minOrderAmount}`
      };
    }

    setActiveCoupon(coupon);
    showToast(`Coupon applied! Enjoy your handmade discount 🌸`);
    return { success: true, message: `Coupon ${coupon.code} applied successfully!` };
  };

  const removeCoupon = () => {
    setActiveCoupon(null);
    showToast('Coupon removed', 'info');
  };

  const addCoupon = (coupon: Coupon) => {
    setCoupons((prev) => [coupon, ...prev]);
    showToast(`Coupon ${coupon.code} created!`);
  };

  const deleteCoupon = (code: string) => {
    setCoupons((prev) => prev.filter((c) => c.code !== code));
    showToast(`Coupon deleted`, 'info');
  };

  const submitCustomOrder = (request: Omit<CustomOrderRequest, 'id' | 'status' | 'createdAt'>) => {
    const newRequest: CustomOrderRequest = {
      ...request,
      id: `custom-${Date.now()}`,
      status: 'submitted',
      createdAt: new Date().toISOString()
    };
    setCustomOrders((prev) => [newRequest, ...prev]);

    // Asynchronously sync custom order to Supabase
    syncCustomOrderToSupabase(newRequest).catch((err) =>
      console.warn('[Supabase] Auto-sync custom order skipped/queued:', err)
    );

    showToast('Custom order inquiry submitted! We will contact you on WhatsApp 🌸');
  };

  const updateCustomOrderStatus = (id: string, status: CustomOrderRequest['status']) => {
    setCustomOrders((prev) => prev.map((co) => (co.id === id ? { ...co, status } : co)));
    updateCustomOrderStatusInSupabase(id, status).catch((err) =>
      console.warn('[Supabase] Update custom order status notice:', err)
    );
    showToast('Custom inquiry status updated');
  };

  const submitFeedback = (
    feedbackData: Omit<PurchasedItemFeedback, 'id' | 'createdAt'>
  ) => {
    const existingIndex = feedbacks.findIndex(
      (f) =>
        f.orderNumber === feedbackData.orderNumber &&
        f.productId === feedbackData.productId
    );

    let updatedFeedbacks: PurchasedItemFeedback[];
    let feedbackToSync: PurchasedItemFeedback;

    if (existingIndex >= 0) {
      const updatedItem: PurchasedItemFeedback = {
        ...feedbacks[existingIndex],
        ...feedbackData,
        createdAt: new Date().toISOString()
      };
      feedbackToSync = updatedItem;
      updatedFeedbacks = feedbacks.map((f, idx) =>
        idx === existingIndex ? updatedItem : f
      );
      showToast('Thank you! Your feedback has been updated 🌸');
    } else {
      const newFeedback: PurchasedItemFeedback = {
        ...feedbackData,
        id: `fb-${Date.now()}`,
        createdAt: new Date().toISOString()
      };
      feedbackToSync = newFeedback;
      updatedFeedbacks = [newFeedback, ...feedbacks];

      // Update product rating and reviews count
      setProducts((prev) =>
        prev.map((p) => {
          if (p.id === feedbackData.productId) {
            const currentCount = p.reviewsCount || 0;
            const newCount = currentCount + 1;
            const newAvg = Number(
              (((p.rating || 5) * currentCount + feedbackData.rating) / newCount).toFixed(1)
            );
            return {
              ...p,
              reviewsCount: newCount,
              rating: newAvg
            };
          }
          return p;
        })
      );

      showToast('Thank you! Your review helps our women artisans bloom 🌸');
    }

    setFeedbacks(updatedFeedbacks);
    setActiveFeedbackTarget(null);

    // Asynchronously sync feedback to Supabase
    syncFeedbackToSupabase(feedbackToSync).catch((err) =>
      console.warn('[Supabase] Auto-sync feedback skipped/queued:', err)
    );
  };

  const getFeedbackForOrderItem = (
    orderNumber: string,
    productId: string
  ): PurchasedItemFeedback | undefined => {
    return feedbacks.find(
      (f) => f.orderNumber === orderNumber && f.productId === productId
    );
  };

  const replyToFeedback = (feedbackId: string, replyText: string) => {
    const replyObj = {
      text: replyText,
      respondedAt: new Date().toISOString(),
      author: 'DreamQueen Atelier Team'
    };
    setFeedbacks((prev) =>
      prev.map((f) => {
        if (f.id === feedbackId) {
          const updated = {
            ...f,
            artisanResponse: replyObj
          };
          syncFeedbackToSupabase(updated).catch((err) =>
            console.warn('[Supabase] Sync feedback reply notice:', err)
          );
          return updated;
        }
        return f;
      })
    );
    showToast('Artisan response posted to customer review! 💌');
  };

  const updateStoreSettings = (settings: Partial<StoreSettings>) => {
    setStoreSettings((prev) => ({ ...prev, ...settings }));
    showToast('Store settings saved');
  };

  const registerUser = (data: { name: string; email: string; phone: string; password?: string }) => {
    const trimmedName = data.name.trim();
    const trimmedEmail = data.email.trim().toLowerCase();
    const trimmedPhone = data.phone.trim();

    if (!trimmedName) {
      showToast('Please enter your full name', 'error');
      return false;
    }
    const digits = trimmedPhone.replace(/\D/g, '');
    if (digits.length < 10) {
      showToast('Please enter a valid 10-digit mobile number', 'error');
      return false;
    }
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      showToast('Please enter a valid email address', 'error');
      return false;
    }

    // Connect with Supabase Auth
    if (data.password) {
      signUpWithSupabase({
        name: trimmedName,
        email: trimmedEmail,
        phone: trimmedPhone,
        password: data.password
      }).catch((e) => console.warn('[Supabase Auth] Notice:', e));
    }

    let accounts: any[] = [];
    try {
      const saved = localStorage.getItem('dreamqueen_registered_users');
      accounts = saved ? JSON.parse(saved) : [];
    } catch {
      accounts = [];
    }

    const existing = accounts.find(
      (a) => a.email?.toLowerCase() === trimmedEmail || a.phone?.replace(/\D/g, '') === digits
    );

    const newUser: User = {
      id: existing ? existing.id : `usr-${Date.now()}`,
      name: trimmedName,
      email: trimmedEmail,
      phone: trimmedPhone,
      role: 'customer',
      savedAddresses: existing?.savedAddresses || [],
      wishlistProductIds: existing?.wishlistProductIds || wishlist
    };

    const newAccount = {
      ...newUser,
      password: data.password || 'crochet123',
      createdAt: existing?.createdAt || new Date().toISOString()
    };

    const updated = accounts.filter((a) => a.id !== newUser.id);
    updated.push(newAccount);
    try {
      localStorage.setItem('dreamqueen_registered_users', JSON.stringify(updated));
    } catch (e) {
      console.warn(e);
    }

    setCurrentUser(newUser);
    setIsAuthModalOpen(false);
    showToast(`Welcome to DreamQueen, ${trimmedName.split(' ')[0]}! 💕`);

    if (authModalIntent === 'checkout') {
      setIsCheckoutOpen(true);
    }
    return true;
  };

  const loginUser = (identifier: string, passwordOrName?: string) => {
    const clean = identifier.trim().toLowerCase();
    if (!clean) {
      showToast('Please enter your email or mobile number', 'error');
      return false;
    }

    // Attempt Supabase Auth login if email provided
    if (clean.includes('@') && passwordOrName) {
      signInWithSupabase(clean, passwordOrName).catch((e) =>
        console.warn('[Supabase Auth] Login notice:', e)
      );
    }

    let accounts: any[] = [];
    try {
      const saved = localStorage.getItem('dreamqueen_registered_users');
      accounts = saved ? JSON.parse(saved) : [];
    } catch {
      accounts = [];
    }

    const cleanDigits = clean.replace(/\D/g, '');
    const matched = accounts.find(
      (a) =>
        a.email?.toLowerCase() === clean ||
        (cleanDigits.length >= 10 && a.phone?.replace(/\D/g, '') === cleanDigits)
    );

    if (matched) {
      if (passwordOrName && matched.password && matched.password !== passwordOrName && !passwordOrName.includes('@')) {
        showToast('Incorrect password. Please try again.', 'error');
        return false;
      }
      const user: User = {
        id: matched.id,
        name: matched.name,
        email: matched.email,
        phone: matched.phone,
        role: matched.role || 'customer',
        savedAddresses: matched.savedAddresses || [],
        wishlistProductIds: matched.wishlistProductIds || []
      };
      setCurrentUser(user);
      setIsAuthModalOpen(false);
      showToast(`Welcome back, ${user.name.split(' ')[0]}! 🌸`);
      if (authModalIntent === 'checkout') {
        setIsCheckoutOpen(true);
      }
      return true;
    }

    // Auto-setup account if logging in with valid email/phone
    const isEmail = clean.includes('@');
    const namePart = passwordOrName && !passwordOrName.includes('•') && !passwordOrName.includes('@')
      ? passwordOrName
      : (isEmail ? clean.split('@')[0].replace(/[^a-zA-Z]/g, ' ') : 'Valued Customer');
    const finalName = namePart.trim()
      ? namePart.trim().charAt(0).toUpperCase() + namePart.trim().slice(1)
      : 'Valued Customer';

    const newUser: User = {
      id: `usr-${Date.now()}`,
      name: finalName,
      email: isEmail ? clean : `${clean}@customer.dreamqueen.in`,
      phone: !isEmail && cleanDigits.length >= 10 ? cleanDigits : '8097706536',
      role: 'customer',
      savedAddresses: [],
      wishlistProductIds: wishlist
    };

    const newAccount = {
      ...newUser,
      password: passwordOrName || 'crochet123',
      createdAt: new Date().toISOString()
    };
    accounts.push(newAccount);
    try {
      localStorage.setItem('dreamqueen_registered_users', JSON.stringify(accounts));
    } catch {}

    setCurrentUser(newUser);
    setIsAuthModalOpen(false);
    showToast(`Signed in as ${finalName}! 🌸`);
    if (authModalIntent === 'checkout') {
      setIsCheckoutOpen(true);
    }
    return true;
  };

  const logoutUser = () => {
    signOutSupabase().catch(() => {});
    setCurrentUser(null);
    showToast('Logged out successfully', 'info');
  };

  const updateUserProfile = (name: string, phone: string) => {
    if (currentUser) {
      setCurrentUser({ ...currentUser, name, phone });
      showToast('Profile updated');
    }
  };

  return (
    <StoreContext.Provider
      value={{
        products,
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
        createOrder,
        updateOrderStatus,
        getOrderByIdOrNumber,
        coupons,
        activeCoupon,
        applyCoupon,
        removeCoupon,
        addCoupon,
        deleteCoupon,
        customOrders,
        submitCustomOrder,
        updateCustomOrderStatus,
        feedbacks,
        submitFeedback,
        getFeedbackForOrderItem,
        replyToFeedback,
        activeFeedbackTarget,
        setActiveFeedbackTarget,
        storeSettings,
        updateStoreSettings,
        currentUser,
        isAdmin,
        setIsAdmin,
        isAuthModalOpen,
        setIsAuthModalOpen,
        authModalIntent,
        setAuthModalIntent,
        openAuthModal,
        registerUser,
        loginUser,
        logoutUser,
        updateUserProfile,
        activeTab,
        setActiveTab,
        selectedProduct,
        setSelectedProduct,
        isCartOpen,
        setIsCartOpen,
        isCheckoutOpen,
        setIsCheckoutOpen,
        isUpiScannerOpen,
        setIsUpiScannerOpen,
        trackingSearchId,
        setTrackingSearchId,
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
