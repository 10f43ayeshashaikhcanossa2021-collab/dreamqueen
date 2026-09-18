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
  INITIAL_FEEDBACKS
} from '../data/initialProducts';
import {
  supabase,
  fetchProductsFromSupabase,
  upsertProductToSupabase,
  deleteProductFromSupabase,
  seedInitialProductsToSupabase,
  fetchOrdersFromSupabase,
  fetchCustomOrdersFromSupabase,
  fetchCurrentProfile,
  updateCurrentProfile,
  syncOrderToSupabase,
  syncCustomOrderToSupabase,
  syncFeedbackToSupabase
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
  updateOrderStatus: (orderId: string, status: OrderTrackingStatus, trackingNo?: string) => Promise<void>;
  getOrderByIdOrNumber: (query: string) => Order | undefined;

  coupons: Coupon[];
  activeCoupon: Coupon | null;
  applyCoupon: (code: string) => { success: boolean; message: string };
  removeCoupon: () => void;
  addCoupon: (coupon: Coupon) => void;
  deleteCoupon: (code: string) => void;

  customOrders: CustomOrderRequest[];
  submitCustomOrder: (request: Omit<CustomOrderRequest, 'id' | 'status' | 'createdAt'>) => void;
  updateCustomOrderStatus: (id: string, status: CustomOrderRequest['status']) => Promise<void>;

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
  registerUser: (data: { name: string; email: string; phone: string; password?: string }) => Promise<boolean>;
  loginUser: (identifier: string, password?: string) => Promise<boolean>;
  logoutUser: () => Promise<void>;
  updateUserProfile: (name: string, phone: string) => Promise<void>;

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
  // Products are store-wide data. localStorage is kept only as a temporary
  // fallback so the storefront can render while Supabase is loading.
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem('dreamqueen_products_v4');
      if (saved) return JSON.parse(saved);
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

  const [orders, setOrders] = useState<Order[]>([]);

  const [coupons, setCoupons] = useState<Coupon[]>(() => {
    try {
      const saved = localStorage.getItem('dreamqueen_coupons');
      return saved ? JSON.parse(saved) : INITIAL_COUPONS;
    } catch {
      return INITIAL_COUPONS;
    }
  });

  const [activeCoupon, setActiveCoupon] = useState<Coupon | null>(null);

  const [customOrders, setCustomOrders] = useState<CustomOrderRequest[]>([]);

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

  const [currentUser, setCurrentUser] = useState<User | null>(null);

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

  /**
   * Load the shared catalog from Supabase and subscribe to product changes.
   *
   * Before this fix products only existed in localStorage, which is isolated
   * per browser/device. This makes Supabase the shared source of truth.
   */
  useEffect(() => {
    let mounted = true;

    const loadProducts = async () => {
      try {
        const cloudProducts = await fetchProductsFromSupabase();

        if (!mounted) return;

        if (cloudProducts.length > 0) {
          setProducts(cloudProducts);
        } else {
          // First setup: move the built-in catalog to the shared database.
          const seeded = await seedInitialProductsToSupabase(INITIAL_PRODUCTS);
          if (mounted) setProducts(seeded);
        }
      } catch (error) {
        console.warn('[Supabase] Product catalog load failed; using local fallback:', error);
      }
    };

    loadProducts();

    // Realtime keeps the phone and admin browser in sync without refresh.
    const channel = supabase
      .channel('dreamqueen-products-sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'products' },
        (payload) => {
          if (!mounted) return;

          if (payload.eventType === 'DELETE') {
            const deletedId = String((payload.old as any)?.id || '');
            if (deletedId) {
              setProducts((prev) => prev.filter((p) => p.id !== deletedId));
            }
            return;
          }

          const nextProduct = (payload.new as any)?.id
            ? (payload.new as any)
            : null;

          if (!nextProduct) return;

          const mapped = {
            id: String(nextProduct.id),
            name: nextProduct.name || '',
            tagline: nextProduct.tagline || '',
            price: Number(nextProduct.price || 0),
            originalPrice:
              nextProduct.original_price == null
                ? undefined
                : Number(nextProduct.original_price),
            rating: Number(nextProduct.rating ?? 5),
            reviewsCount: Number(nextProduct.reviews_count ?? 0),
            category: nextProduct.category as Product['category'],
            images: Array.isArray(nextProduct.images) ? nextProduct.images : [],
            stock: Number(nextProduct.stock ?? 0),
            colors: Array.isArray(nextProduct.colors) ? nextProduct.colors : [],
            description: nextProduct.description || '',
            yarnType: nextProduct.yarn_type || '',
            careInstructions: nextProduct.care_instructions || '',
            tags: Array.isArray(nextProduct.tags) ? nextProduct.tags : [],
            isBestSeller: Boolean(nextProduct.is_best_seller),
            isNewArrival: Boolean(nextProduct.is_new_arrival),
            isFeatured: Boolean(nextProduct.is_featured)
          } satisfies Product;

          setProducts((prev) => {
            const exists = prev.some((p) => p.id === mapped.id);
            return exists
              ? prev.map((p) => (p.id === mapped.id ? mapped : p))
              : [mapped, ...prev];
          });
        }
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          console.warn('[Supabase] Product realtime channel failed. Cloud loading still works.');
        }
      });

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  // Load shared orders and subscribe to realtime changes. Supabase is the source of truth.
  useEffect(() => {
    let mounted = true;
    const loadOrders = async () => {
      try {
        const cloudOrders = await fetchOrdersFromSupabase();
        if (mounted) setOrders(cloudOrders);
      } catch (error) {
        console.error('[Supabase] Could not load orders:', error);
      }
    };
    loadOrders();

    const channel = supabase
      .channel('dreamqueen-orders-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
        if (!mounted) return;
        if (payload.eventType === 'DELETE') {
          const id = String((payload.old as any)?.id || '');
          if (id) setOrders(prev => prev.filter(order => order.id !== id));
          return;
        }
        const row = payload.new as any;
        if (!row?.id) return;
        const next = {
          id: String(row.id), orderNumber: row.order_number || '', customer: row.customer || {},
          shippingAddress: row.shipping_address || {}, items: row.items || [], subtotal: Number(row.subtotal || 0),
          discount: Number(row.discount || 0), couponCode: row.coupon_code || undefined,
          shippingFee: Number(row.shipping_fee || 0), codFee: Number(row.cod_fee || 0), total: Number(row.total || 0),
          paymentMethod: row.payment_method, paymentStatus: row.payment_status,
          razorpayPaymentId: row.razorpay_payment_id || undefined, razorpayOrderId: row.razorpay_order_id || undefined,
          trackingStatus: row.tracking_status || 'preparing', shiprocketTrackingNumber: row.shiprocket_tracking_number || undefined,
          estimatedDeliveryDate: row.estimated_delivery_date || '', notes: row.notes || undefined, createdAt: row.created_at
        } as Order;
        setOrders(prev => prev.some(o => o.id === next.id) ? prev.map(o => o.id === next.id ? next : o) : [next, ...prev]);
      })
      .subscribe(status => console.log('[Supabase] Orders realtime:', status));
    return () => { mounted = false; supabase.removeChannel(channel); };
  }, []);

  // Load shared custom orders and subscribe to changes.
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const data = await fetchCustomOrdersFromSupabase();
        if (mounted) setCustomOrders(data);
      } catch (error) {
        console.error('[Supabase] Could not load custom orders:', error);
      }
    };
    load();
    const channel = supabase
      .channel('dreamqueen-custom-orders-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'custom_orders' }, async () => {
        try { const data = await fetchCustomOrdersFromSupabase(); if (mounted) setCustomOrders(data); }
        catch (error) { console.error('[Supabase] Custom orders refresh failed:', error); }
      })
      .subscribe();
    return () => { mounted = false; supabase.removeChannel(channel); };
  }, []);

  // Restore the real Supabase Auth session on every device/browser.
  useEffect(() => {
    let mounted = true;
    const loadSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!mounted) return;
        if (!session?.user) { setCurrentUser(null); return; }
        const profile = await fetchCurrentProfile();
        if (!mounted) return;
        setCurrentUser({
          id: session.user.id,
          name: profile?.full_name || session.user.user_metadata?.full_name || 'DreamQueen Customer',
          email: profile?.email || session.user.email || '',
          phone: profile?.phone || session.user.user_metadata?.phone || '',
          role: (profile?.role === 'admin' ? 'admin' : 'customer'),
          savedAddresses: Array.isArray(profile?.saved_addresses) ? profile.saved_addresses : [],
          wishlistProductIds: wishlist
        });
      } catch (error) { console.error('[Supabase] Session load failed:', error); }
    };
    loadSession();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;
      if (!session?.user) { setCurrentUser(null); return; }
      try {
        const profile = await fetchCurrentProfile();
        if (!mounted) return;
        setCurrentUser({
          id: session.user.id,
          name: profile?.full_name || session.user.user_metadata?.full_name || 'DreamQueen Customer',
          email: profile?.email || session.user.email || '',
          phone: profile?.phone || session.user.user_metadata?.phone || '',
          role: profile?.role === 'admin' ? 'admin' : 'customer',
          savedAddresses: Array.isArray(profile?.saved_addresses) ? profile.saved_addresses : [],
          wishlistProductIds: wishlist
        });
      } catch (error) { console.error('[Supabase] Auth profile load failed:', error); }
    });
    return () => { mounted = false; subscription.unsubscribe(); };
  }, []);

  // Sync admin state
  useEffect(() => {
    try {
      localStorage.setItem('dreamqueen_is_admin', isAdmin ? 'true' : 'false');
    } catch (e) {
      console.warn('Storage save failed', e);
    }
  }, [isAdmin]);

  // Keep a browser fallback cache for faster first paint/offline viewing.
  // Cloud writes are handled by addProduct/updateProduct/deleteProduct above.
  useEffect(() => {
    try {
      localStorage.setItem('dreamqueen_products_v4', JSON.stringify(products));
    } catch (e) {
      console.warn('Product fallback cache save failed', e);
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
      localStorage.setItem('dreamqueen_coupons', JSON.stringify(coupons));
    } catch (e) {
      console.warn('Storage save failed', e);
    }
  }, [coupons]);

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

    // Update the UI immediately, then persist to the shared cloud database.
    setProducts((prev) => [newProduct, ...prev]);

    upsertProductToSupabase(newProduct).then(() => {
      showToast(`Added "${newProduct.name}" to the shared store catalog!`);
    }).catch((error) => {
      console.error('[Supabase] Could not save product:', error);
      showToast(`Product added locally, but cloud save failed: ${error?.message || 'Unknown error'}`, 'error');
    });
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    const existing = products.find((p) => p.id === id);
    if (!existing) return;

    const updated = { ...existing, ...updates };
    setProducts((prev) => prev.map((p) => (p.id === id ? updated : p)));

    upsertProductToSupabase(updated).catch((error) => {
      console.error('[Supabase] Could not update product:', error);
      showToast(`Cloud update failed: ${error?.message || 'Unknown error'}`, 'error');
    });

    showToast('Product details updated successfully');
  };

  const deleteProduct = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));

    deleteProductFromSupabase(id).then(() => {
      showToast('Product removed from the shared store catalog', 'info');
    }).catch((error) => {
      console.error('[Supabase] Could not delete product:', error);
      showToast(`Cloud delete failed: ${error?.message || 'Unknown error'}`, 'error');
    });
  };

  const updateProductStock = (id: string, delta: number) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, stock: Math.max(0, p.stock + delta) } : p))
    );
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
    syncOrderToSupabase(newOrder).then(result => {
      if (!result.success) {
        console.error('[Supabase] Order was not saved:', result.error);
        showToast(`Order created, but cloud save failed: ${result.error || 'Unknown error'}`, 'error');
      }
    });

    clearCart();
    setActiveCoupon(null);
    return newOrder;
  };

  const updateOrderStatus = async (orderId: string, status: OrderTrackingStatus, trackingNo?: string) => {
    const existing = orders.find(ord => ord.id === orderId || ord.orderNumber === orderId);
    if (!existing) return;
    const updated = { ...existing, trackingStatus: status, shiprocketTrackingNumber: trackingNo || existing.shiprocketTrackingNumber };
    setOrders(prev => prev.map(ord => ord.id === existing.id ? updated : ord));
    const result = await syncOrderToSupabase(updated);
    if (!result.success) { showToast(`Cloud order update failed: ${result.error || 'Unknown error'}`, 'error'); return; }
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
    syncCustomOrderToSupabase(newRequest).then(result => {
      if (!result.success) console.error('[Supabase] Custom order was not saved:', result.error);
    });

    showToast('Custom order inquiry submitted! We will contact you on WhatsApp 🌸');
  };

  const updateCustomOrderStatus = async (id: string, status: CustomOrderRequest['status']) => {
    const existing = customOrders.find(co => co.id === id);
    if (!existing) return;
    const updated = { ...existing, status };
    setCustomOrders(prev => prev.map(co => co.id === id ? updated : co));
    const result = await syncCustomOrderToSupabase(updated);
    if (!result.success) { showToast(`Cloud custom-order update failed: ${result.error || 'Unknown error'}`, 'error'); return; }
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
    setFeedbacks((prev) =>
      prev.map((f) => {
        if (f.id === feedbackId) {
          return {
            ...f,
            artisanResponse: {
              text: replyText,
              respondedAt: new Date().toISOString(),
              author: 'DreamQueen Atelier Team'
            }
          };
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

  const registerUser = async (data: { name: string; email: string; phone: string; password?: string }): Promise<boolean> => {
    const trimmedName = data.name.trim();
    const trimmedEmail = data.email.trim().toLowerCase();
    const digits = data.phone.replace(/\D/g, '');
    if (!trimmedName) { showToast('Please enter your full name', 'error'); return false; }
    if (digits.length < 10) { showToast('Please enter a valid 10-digit mobile number', 'error'); return false; }
    if (!trimmedEmail.includes('@')) { showToast('Please enter a valid email address', 'error'); return false; }
    if (!data.password || data.password.length < 6) { showToast('Password must be at least 6 characters', 'error'); return false; }
    try {
      const { data: authData, error } = await supabase.auth.signUp({
        email: trimmedEmail,
        password: data.password,
        options: { data: { full_name: trimmedName, phone: digits } }
      });
      if (error) { console.error('[Supabase] Signup error:', error); showToast(error.message, 'error'); return false; }
      if (!authData.user) { showToast('Account could not be created', 'error'); return false; }
      if (!authData.session) {
        showToast('Account created. Please verify your email, then sign in.', 'info');
        setIsAuthModalOpen(false);
        return true;
      }
      setCurrentUser({ id: authData.user.id, name: trimmedName, email: trimmedEmail, phone: digits, role: 'customer', savedAddresses: [], wishlistProductIds: wishlist });
      setIsAuthModalOpen(false);
      showToast(`Welcome to DreamQueen, ${trimmedName.split(' ')[0]}! 💕`);
      if (authModalIntent === 'checkout') setIsCheckoutOpen(true);
      return true;
    } catch (error: any) { console.error('[Supabase] Signup failed:', error); showToast(error?.message || 'Signup failed', 'error'); return false; }
  };

  const loginUser = async (identifier: string, password?: string): Promise<boolean> => {
    const email = identifier.trim().toLowerCase();
    if (!email.includes('@')) { showToast('Please enter your registered email address', 'error'); return false; }
    if (!password) { showToast('Please enter your password', 'error'); return false; }
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error || !data.user) { showToast(error?.message || 'Incorrect email or password', 'error'); return false; }
      const profile = await fetchCurrentProfile();
      const user: User = {
        id: data.user.id,
        name: profile?.full_name || data.user.user_metadata?.full_name || 'DreamQueen Customer',
        email: profile?.email || data.user.email || email,
        phone: profile?.phone || data.user.user_metadata?.phone || '',
        role: profile?.role === 'admin' ? 'admin' : 'customer',
        savedAddresses: Array.isArray(profile?.saved_addresses) ? profile.saved_addresses : [],
        wishlistProductIds: wishlist
      };
      setCurrentUser(user);
      setIsAuthModalOpen(false);
      showToast(`Welcome back, ${user.name.split(' ')[0]}! 🌸`);
      if (authModalIntent === 'checkout') setIsCheckoutOpen(true);
      return true;
    } catch (error: any) { console.error('[Supabase] Login failed:', error); showToast(error?.message || 'Login failed', 'error'); return false; }
  };

  const logoutUser = async (): Promise<void> => {
    const { error } = await supabase.auth.signOut();
    if (error) { showToast(error.message || 'Could not log out', 'error'); return; }
    setCurrentUser(null);
    showToast('Logged out successfully', 'info');
  };

  const updateUserProfile = async (name: string, phone: string): Promise<void> => {
    if (!currentUser) return;
    const cleanPhone = phone.replace(/\D/g, '');
    try {
      await updateCurrentProfile(name.trim(), cleanPhone);
      setCurrentUser({ ...currentUser, name: name.trim(), phone: cleanPhone });
      showToast('Profile updated successfully');
    } catch (error: any) { console.error('[Supabase] Profile update failed:', error); showToast(error?.message || 'Profile update failed', 'error'); }
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
        showToast
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
