import React, {
  createContext,
  useContext,
  useState,
  useEffect
} from 'react';

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

  fetchOrdersFromSupabase,

  fetchCustomOrdersFromSupabase,

  fetchCurrentProfile,
  updateCurrentProfile,

  syncOrderToSupabase,
  syncCustomOrderToSupabase,
  syncFeedbackToSupabase,

  fetchCouponsFromSupabase,
  upsertCouponToSupabase,
  deleteCouponFromSupabase,

  fetchStoreSettingsFromSupabase,
  updateStoreSettingsInSupabase,

  fetchFeedbacksFromSupabase
} from '../lib/supabase';


/* =========================================================
   TYPES
========================================================= */

interface ToastInfo {
  id: string;
  message: string;
  type: 'success' | 'info' | 'error';
}

interface StoreContextType {
  /* Products */
  products: Product[];
  addProduct: (product: Omit<Product, 'id'>) => Promise<void>;
  updateProduct: (
    id: string,
    updates: Partial<Product>
  ) => void;
  deleteProduct: (id: string) => Promise<void>;
  updateProductStock: (
    id: string,
    delta: number
  ) => Promise<void>;

  /* Cart */
  cart: CartItem[];
  addToCart: (
    product: Product,
    quantity?: number,
    colorIndex?: number
  ) => void;
  removeFromCart: (
    productId: string,
    colorName: string
  ) => void;
  updateCartQuantity: (
    productId: string,
    colorName: string,
    quantity: number
  ) => void;
  clearCart: () => void;
  cartCount: number;
  cartSubtotal: number;

  /* Wishlist */
  wishlist: string[];
  toggleWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;

  /* Orders */
  orders: Order[];
  createOrder: (
    orderData: Omit<
      Order,
      'id' | 'orderNumber' | 'createdAt'
    >
  ) => Promise<Order>;
  updateOrderStatus: (
    orderId: string,
    status: OrderTrackingStatus,
    trackingNo?: string
  ) => Promise<void>;
  getOrderByIdOrNumber: (
    query: string
  ) => Order | undefined;

  /* Coupons */
  coupons: Coupon[];
  activeCoupon: Coupon | null;
  applyCoupon: (
    code: string
  ) => {
    success: boolean;
    message: string;
  };
  removeCoupon: () => void;
  addCoupon: (coupon: Coupon) => void;
  deleteCoupon: (code: string) => void;

  /* Custom orders */
  customOrders: CustomOrderRequest[];
  submitCustomOrder: (
    request: Omit<
      CustomOrderRequest,
      'id' | 'status' | 'createdAt'
    >
  ) => void;
  updateCustomOrderStatus: (
    id: string,
    status: CustomOrderRequest['status']
  ) => Promise<void>;

  /* Feedback */
  feedbacks: PurchasedItemFeedback[];
  submitFeedback: (
    feedback: Omit<
      PurchasedItemFeedback,
      'id' | 'createdAt'
    >
  ) => void;
  getFeedbackForOrderItem: (
    orderNumber: string,
    productId: string
  ) => PurchasedItemFeedback | undefined;
  replyToFeedback: (
    feedbackId: string,
    replyText: string
  ) => void;

  activeFeedbackTarget: {
    order: Order;
    item: OrderItem;
  } | null;

  setActiveFeedbackTarget: (
    val: {
      order: Order;
      item: OrderItem;
    } | null
  ) => void;

  /* Store settings */
  storeSettings: StoreSettings;
  updateStoreSettings: (
    settings: Partial<StoreSettings>
  ) => void;

  /* Authentication */
  currentUser: User | null;
  isAdmin: boolean;
  setIsAdmin: (val: boolean) => void;

  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (val: boolean) => void;

  authModalIntent:
    | 'checkout'
    | 'general'
    | 'custom_order';

  setAuthModalIntent: (
    val: 'checkout' | 'general' | 'custom_order'
  ) => void;

  openAuthModal: (
    intent?: 'checkout' | 'general' | 'custom_order'
  ) => void;

  registerUser: (data: {
    name: string;
    email: string;
    phone: string;
    password?: string;
  }) => Promise<boolean>;

  loginUser: (
    identifier: string,
    password?: string
  ) => Promise<boolean>;

  logoutUser: () => Promise<void>;

  updateUserProfile: (
    name: string,
    phone: string
  ) => Promise<void>;

  /* Navigation */
  activeTab:
    | 'home'
    | 'shop'
    | 'custom'
    | 'track'
    | 'customer'
    | 'admin'
    | 'contact';

  setActiveTab: (
    tab:
      | 'home'
      | 'shop'
      | 'custom'
      | 'track'
      | 'customer'
      | 'admin'
      | 'contact'
  ) => void;

  /* Product modal */
  selectedProduct: Product | null;
  setSelectedProduct: (
    product: Product | null
  ) => void;

  /* UI */
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

  showToast: (
    message: string,
    type?: 'success' | 'info' | 'error'
  ) => void;
}


/* =========================================================
   CONTEXT
========================================================= */

const StoreContext =
  createContext<StoreContextType | undefined>(
    undefined
  );


/* =========================================================
   DEFAULT SETTINGS
========================================================= */

const DEFAULT_SETTINGS: StoreSettings = {
  codEnabled: true,
  codFee: 29,
  freeShippingThreshold: 499,
  standardShippingFee: 40,

  /*
   * IMPORTANT:
   * Do not put a real private Shiprocket API key here.
   * Keep real credentials on a backend/server.
   */
  shiprocketApiKey: '',

  supportPhone: '8097706536',

  supportEmail:
    'dreamqueen29@gmail.com',

  pinterestUrl:
    'https://in.pinterest.com/ayeshalk2025/?actingBusinessId=1147221842487308120',

  pinterestHandle:
    'ayeshalk2025',

  upiId:
    '8097706536@postbank',

  upiPayeeName:
    'AYESHA LUKMAN SHAIKH'
};


/* =========================================================
   PROVIDER
========================================================= */

export const StoreProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {


  /* =======================================================
     PRODUCTS
  ======================================================= */

  /*
   * Supabase is the source of truth.
   *
   * INITIAL_PRODUCTS is only used temporarily while
   * Supabase is loading or unavailable.
   */
  const [products, setProducts] =
    useState<Product[]>(INITIAL_PRODUCTS);


  /* =======================================================
     CART
  ======================================================= */

  const [cart, setCart] =
    useState<CartItem[]>(() => {
      try {
        const saved =
          localStorage.getItem(
            'dreamqueen_cart'
          );

        return saved
          ? JSON.parse(saved)
          : [];
      } catch {
        return [];
      }
    });


  /* =======================================================
     WISHLIST
  ======================================================= */

  const [wishlist, setWishlist] =
    useState<string[]>(() => {
      try {
        const saved =
          localStorage.getItem(
            'dreamqueen_wishlist'
          );

        return saved
          ? JSON.parse(saved)
          : [
              'prod-rose-hair-tie',
              'prod-sunflower-keychain'
            ];
      } catch {
        return [
          'prod-rose-hair-tie',
          'prod-sunflower-keychain'
        ];
      }
    });


  /* =======================================================
     ORDERS
  ======================================================= */

  const [orders, setOrders] =
    useState<Order[]>([]);


  /* =======================================================
     COUPONS
  ======================================================= */

  const [coupons, setCoupons] =
    useState<Coupon[]>(() => {
      try {
        const saved =
          localStorage.getItem(
            'dreamqueen_coupons'
          );

        return saved
          ? JSON.parse(saved)
          : INITIAL_COUPONS;
      } catch {
        return INITIAL_COUPONS;
      }
    });


  const [activeCoupon, setActiveCoupon] =
    useState<Coupon | null>(null);


  /* =======================================================
     CUSTOM ORDERS
  ======================================================= */

  const [customOrders, setCustomOrders] =
    useState<CustomOrderRequest[]>([]);


  /* =======================================================
     FEEDBACK
  ======================================================= */

  const [feedbacks, setFeedbacks] =
    useState<PurchasedItemFeedback[]>(() => {
      try {
        const saved =
          localStorage.getItem(
            'dreamqueen_feedbacks'
          );

        return saved
          ? JSON.parse(saved)
          : INITIAL_FEEDBACKS;
      } catch {
        return INITIAL_FEEDBACKS;
      }
    });


  const [
    activeFeedbackTarget,
    setActiveFeedbackTarget
  ] = useState<{
    order: Order;
    item: OrderItem;
  } | null>(null);


  /* =======================================================
     STORE SETTINGS
  ======================================================= */

  const [storeSettings, setStoreSettings] =
    useState<StoreSettings>(() => {
      try {
        const saved =
          localStorage.getItem(
            'dreamqueen_settings'
          );

        if (saved) {
          return {
            ...DEFAULT_SETTINGS,
            ...JSON.parse(saved)
          };
        }

        return DEFAULT_SETTINGS;
      } catch {
        return DEFAULT_SETTINGS;
      }
    });


  /* =======================================================
     AUTH
  ======================================================= */

  const [currentUser, setCurrentUser] =
    useState<User | null>(null);

  const [isAdmin, setIsAdmin] =
    useState<boolean>(false);

  const [
    isAuthModalOpen,
    setIsAuthModalOpen
  ] = useState(false);

  const [
    authModalIntent,
    setAuthModalIntent
  ] = useState<
    'checkout' | 'general' | 'custom_order'
  >('general');


  const openAuthModal = (
    intent:
      | 'checkout'
      | 'general'
      | 'custom_order' = 'general'
  ) => {
    setAuthModalIntent(intent);
    setIsAuthModalOpen(true);
  };


  /* =======================================================
     UI STATE
  ======================================================= */

  const [activeTab, setActiveTab] =
    useState<
      | 'home'
      | 'shop'
      | 'custom'
      | 'track'
      | 'customer'
      | 'admin'
      | 'contact'
    >('home');


  const [
    selectedProduct,
    setSelectedProduct
  ] = useState<Product | null>(null);


  const [isCartOpen, setIsCartOpen] =
    useState(false);

  const [
    isCheckoutOpen,
    setIsCheckoutOpen
  ] = useState(false);

  const [
    isUpiScannerOpen,
    setIsUpiScannerOpen
  ] = useState(false);

  const [
    trackingSearchId,
    setTrackingSearchId
  ] = useState('');

  const [
    searchQuery,
    setSearchQuery
  ] = useState('');

  const [toasts, setToasts] =
    useState<ToastInfo[]>([]);


  /* =======================================================
     TOAST
  ======================================================= */

  const showToast = (
    message: string,
    type:
      | 'success'
      | 'info'
      | 'error' = 'success'
  ) => {
    const id =
      Math.random()
        .toString(36)
        .substring(2, 9);

    setToasts((prev) => [
      ...prev,
      {
        id,
        message,
        type
      }
    ]);

    setTimeout(() => {
      setToasts((prev) =>
        prev.filter(
          (toast) =>
            toast.id !== id
        )
      );
    }, 3800);
  };


  /* =========================================================
     LOAD PRODUCTS + REALTIME SYNC
  ========================================================= */

  useEffect(() => {
    let mounted = true;

    const loadProducts = async () => {
      try {
        console.log(
          '[Supabase] Loading products...'
        );

        const cloudProducts =
          await fetchProductsFromSupabase();

        if (!mounted) return;

        console.log(
          '[Supabase] Products loaded:',
          cloudProducts.length
        );

        /*
         * Only replace the catalog when Supabase
         * actually returned products.
         *
         * This prevents a temporary API error from
         * wiping the storefront.
         */
        if (cloudProducts.length > 0) {
          setProducts(cloudProducts);
        } else {
          console.warn(
            '[Supabase] Product table returned 0 products.'
          );
        }
      } catch (error) {
        console.error(
          '[Supabase] Product catalog load failed:',
          error
        );

        /*
         * IMPORTANT:
         * Do NOT do setProducts([]).
         *
         * The current catalog remains visible.
         */
      }
    };

    loadProducts();


    /* =====================================================
       REALTIME
    ===================================================== */

    const channel =
      supabase
        .channel(
          'dreamqueen-products-sync'
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'products'
          },
          async (payload) => {
            if (!mounted) return;

            console.log(
              '[Supabase] Product change:',
              payload.eventType
            );


            /* DELETE */

            if (
              payload.eventType ===
              'DELETE'
            ) {
              const deletedId =
                String(
                  (payload.old as any)
                    ?.id || ''
                );

              if (deletedId) {
                setProducts((prev) =>
                  prev.filter(
                    (product) =>
                      product.id !==
                      deletedId
                  )
                );
              }

              return;
            }


            /* INSERT / UPDATE */

            try {
              const latestProducts =
                await fetchProductsFromSupabase();

              if (
                mounted &&
                latestProducts.length > 0
              ) {
                setProducts(
                  latestProducts
                );

                console.log(
                  '[Supabase] Product catalog refreshed:',
                  latestProducts.length
                );
              }
            } catch (error) {
              console.error(
                '[Supabase] Product realtime refresh failed:',
                error
              );
            }
          }
        )
        .subscribe((status) => {
          console.log(
            '[Supabase] Product realtime:',
            status
          );

          if (
            status ===
            'CHANNEL_ERROR'
          ) {
            console.error(
              '[Supabase] Product realtime channel failed.'
            );
          }

          if (
            status ===
            'TIMED_OUT'
          ) {
            console.error(
              '[Supabase] Product realtime channel timed out.'
            );
          }
        });


    return () => {
      mounted = false;

      supabase.removeChannel(
        channel
      );
    };
  }, []);


  /* =========================================================
     STORE SETTINGS REALTIME
  ========================================================= */

  useEffect(() => {
    let mounted = true;

    const loadSettings = async () => {
      try {
        const cloudSettings =
          await fetchStoreSettingsFromSupabase();

        if (
          !mounted ||
          !cloudSettings
        ) {
          return;
        }

        setStoreSettings(
          (previous) => ({
            ...previous,
            ...cloudSettings,

            /*
             * Keep private API credentials
             * out of Supabase/public data.
             */
            shiprocketApiKey:
              previous.shiprocketApiKey
          })
        );
      } catch (error) {
        console.error(
          '[Supabase] Could not load store settings:',
          error
        );
      }
    };

    loadSettings();


    const channel =
      supabase
        .channel(
          'dreamqueen-settings-sync'
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'store_settings'
          },
          async () => {
            try {
              const updated =
                await fetchStoreSettingsFromSupabase();

              if (
                mounted &&
                updated
              ) {
                setStoreSettings(
                  (previous) => ({
                    ...previous,
                    ...updated,
                    shiprocketApiKey:
                      previous.shiprocketApiKey
                  })
                );
              }
            } catch (error) {
              console.error(
                '[Supabase] Settings realtime refresh failed:',
                error
              );
            }
          }
        )
        .subscribe((status) => {
          console.log(
            '[Supabase] Settings realtime:',
            status
          );

          if (
            status ===
            'CHANNEL_ERROR'
          ) {
            console.error(
              '[Supabase] Settings realtime channel failed.'
            );
          }

          if (
            status ===
            'TIMED_OUT'
          ) {
            console.error(
              '[Supabase] Settings realtime channel timed out.'
            );
          }
        });


    return () => {
      mounted = false;
      supabase.removeChannel(
        channel
      );
    };
  }, []);


  /* =========================================================
     COUPONS REALTIME
  ========================================================= */

  useEffect(() => {
    let mounted = true;

    const loadCoupons = async () => {
      try {
        const cloudCoupons =
          await fetchCouponsFromSupabase();

        if (!mounted) return;

        setCoupons(cloudCoupons);
      } catch (error) {
        console.error(
          '[Supabase] Could not load coupons:',
          error
        );
      }
    };

    loadCoupons();


    const channel =
      supabase
        .channel(
          'dreamqueen-coupons-sync'
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'coupons'
          },
          async () => {
            try {
              const updated =
                await fetchCouponsFromSupabase();

              if (mounted) {
                setCoupons(updated);
              }
            } catch (error) {
              console.error(
                '[Supabase] Coupon realtime refresh failed:',
                error
              );
            }
          }
        )
        .subscribe((status) => {
          console.log(
            '[Supabase] Coupons realtime:',
            status
          );
        });


    return () => {
      mounted = false;
      supabase.removeChannel(
        channel
      );
    };
  }, []);


  /* =========================================================
     FEEDBACK REALTIME
  ========================================================= */

  useEffect(() => {
    let mounted = true;

    const loadFeedbacks =
      async () => {
        try {
          const cloudFeedbacks =
            await fetchFeedbacksFromSupabase();

          if (mounted) {
            setFeedbacks(
              cloudFeedbacks
            );
          }
        } catch (error) {
          console.error(
            '[Supabase] Could not load feedbacks:',
            error
          );
        }
      };

    loadFeedbacks();


    const channel =
      supabase
        .channel(
          'dreamqueen-feedbacks-sync'
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'feedbacks'
          },
          async () => {
            try {
              const updated =
                await fetchFeedbacksFromSupabase();

              if (mounted) {
                setFeedbacks(
                  updated
                );
              }
            } catch (error) {
              console.error(
                '[Supabase] Feedback realtime refresh failed:',
                error
              );
            }
          }
        )
        .subscribe((status) => {
          console.log(
            '[Supabase] Feedback realtime:',
            status
          );
        });


    return () => {
      mounted = false;
      supabase.removeChannel(
        channel
      );
    };
  }, []);


  /* =========================================================
     ORDERS REALTIME
  ========================================================= */

  useEffect(() => {
    let mounted = true;

    const loadOrders = async () => {
      try {
        const cloudOrders =
          await fetchOrdersFromSupabase();

        if (mounted) {
          setOrders(
            cloudOrders
          );
        }
      } catch (error) {
        console.error(
          '[Supabase] Could not load orders:',
          error
        );
      }
    };

    loadOrders();


    const channel =
      supabase
        .channel(
          'dreamqueen-orders-sync'
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'orders'
          },
          (payload) => {
            if (!mounted) return;


            /* DELETE */

            if (
              payload.eventType ===
              'DELETE'
            ) {
              const id =
                String(
                  (payload.old as any)
                    ?.id || ''
                );

              if (id) {
                setOrders(
                  (prev) =>
                    prev.filter(
                      (order) =>
                        order.id !==
                        id
                    )
                );
              }

              return;
            }


            /* INSERT / UPDATE */

            const row =
              payload.new as any;

            if (!row?.id) {
              return;
            }


            const next: Order = {
              id: String(
                row.id
              ),

              orderNumber:
                row.order_number ||
                '',

              customer:
                row.customer ||
                {},

              shippingAddress:
                row.shipping_address ||
                {},

              items:
                row.items ||
                [],

              subtotal:
                Number(
                  row.subtotal || 0
                ),

              discount:
                Number(
                  row.discount || 0
                ),

              couponCode:
                row.coupon_code ||
                undefined,

              shippingFee:
                Number(
                  row.shipping_fee ||
                    0
                ),

              codFee:
                Number(
                  row.cod_fee || 0
                ),

              total:
                Number(
                  row.total || 0
                ),

              paymentMethod:
                row.payment_method,

              paymentStatus:
                row.payment_status,

              razorpayPaymentId:
                row.razorpay_payment_id ||
                undefined,

              razorpayOrderId:
                row.razorpay_order_id ||
                undefined,

              trackingStatus:
                row.tracking_status ||
                'preparing',

              shiprocketTrackingNumber:
                row.shiprocket_tracking_number ||
                undefined,

              estimatedDeliveryDate:
                row.estimated_delivery_date ||
                '',

              notes:
                row.notes ||
                undefined,

              createdAt:
                row.created_at
            };


            setOrders((prev) =>
              prev.some(
                (order) =>
                  order.id ===
                  next.id
              )
                ? prev.map(
                    (order) =>
                      order.id ===
                      next.id
                        ? next
                        : order
                  )
                : [
                    next,
                    ...prev
                  ]
            );
          }
        )
        .subscribe((status) => {
          console.log(
            '[Supabase] Orders realtime:',
            status
          );

          if (
            status ===
            'CHANNEL_ERROR'
          ) {
            console.error(
              '[Supabase] Orders realtime channel failed.'
            );
          }

          if (
            status ===
            'TIMED_OUT'
          ) {
            console.error(
              '[Supabase] Orders realtime channel timed out.'
            );
          }
        });


    return () => {
      mounted = false;
      supabase.removeChannel(
        channel
      );
    };
  }, []);


  /* =========================================================
     CUSTOM ORDERS REALTIME
  ========================================================= */

  useEffect(() => {
    let mounted = true;

    const loadCustomOrders =
      async () => {
        try {
          const data =
            await fetchCustomOrdersFromSupabase();

          if (mounted) {
            setCustomOrders(data);
          }
        } catch (error) {
          console.error(
            '[Supabase] Could not load custom orders:',
            error
          );
        }
      };

    loadCustomOrders();


    const channel =
      supabase
        .channel(
          'dreamqueen-custom-orders-sync'
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'custom_orders'
          },
          async () => {
            try {
              const data =
                await fetchCustomOrdersFromSupabase();

              if (mounted) {
                setCustomOrders(
                  data
                );
              }
            } catch (error) {
              console.error(
                '[Supabase] Custom orders refresh failed:',
                error
              );
            }
          }
        )
        .subscribe((status) => {
          console.log(
            '[Supabase] Custom orders realtime:',
            status
          );

          if (
            status ===
            'CHANNEL_ERROR'
          ) {
            console.error(
              '[Supabase] Custom order realtime channel failed.'
            );
          }

          if (
            status ===
            'TIMED_OUT'
          ) {
            console.error(
              '[Supabase] Custom order realtime channel timed out.'
            );
          }
        });


    return () => {
      mounted = false;
      supabase.removeChannel(
        channel
      );
    };
  }, []);


  /* =========================================================
     SUPABASE AUTH SESSION
  ========================================================= */

  useEffect(() => {
    let mounted = true;


    const loadSession =
      async () => {
        try {
          const {
            data: {
              session
            }
          } =
            await supabase.auth.getSession();


          if (!mounted) return;


          if (!session?.user) {
            setCurrentUser(null);
            setIsAdmin(false);
            return;
          }


          const profile =
            await fetchCurrentProfile();


          if (!mounted) return;


          const userIsAdmin =
            profile?.role ===
            'admin';


          setIsAdmin(
            userIsAdmin
          );


          setCurrentUser({
            id: session.user.id,

            name:
              profile?.full_name ||
              session.user
                .user_metadata
                ?.full_name ||
              'DreamQueen Customer',

            email:
              profile?.email ||
              session.user.email ||
              '',

            phone:
              profile?.phone ||
              session.user
                .user_metadata
                ?.phone ||
              '',

            role: userIsAdmin
              ? 'admin'
              : 'customer',

            savedAddresses:
              Array.isArray(
                profile?.saved_addresses
              )
                ? profile.saved_addresses
                : [],

            wishlistProductIds:
              wishlist
          });
        } catch (error) {
          console.error(
            '[Supabase] Session load failed:',
            error
          );
        }
      };


    loadSession();


    const {
      data: {
        subscription
      }
    } =
      supabase.auth.onAuthStateChange(
        async (
          _event,
          session
        ) => {
          if (!mounted) return;


          if (!session?.user) {
            setCurrentUser(null);
            setIsAdmin(false);
            return;
          }


          try {
            const profile =
              await fetchCurrentProfile();


            if (!mounted) return;


            const userIsAdmin =
              profile?.role ===
              'admin';


            setIsAdmin(
              userIsAdmin
            );


            setCurrentUser({
              id: session.user.id,

              name:
                profile?.full_name ||
                session.user
                  .user_metadata
                  ?.full_name ||
                'DreamQueen Customer',

              email:
                profile?.email ||
                session.user.email ||
                '',

              phone:
                profile?.phone ||
                session.user
                  .user_metadata
                  ?.phone ||
                '',

              role: userIsAdmin
                ? 'admin'
                : 'customer',

              savedAddresses:
                Array.isArray(
                  profile?.saved_addresses
                )
                  ? profile.saved_addresses
                  : [],

              wishlistProductIds:
                wishlist
            });
          } catch (error) {
            console.error(
              '[Supabase] Auth profile load failed:',
              error
            );
          }
        }
      );


    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [wishlist]);


  /* =========================================================
     LOCAL STORAGE
     
     Only browser-specific data should be stored locally.
  ========================================================= */

  useEffect(() => {
    try {
      localStorage.setItem(
        'dreamqueen_cart',
        JSON.stringify(cart)
      );
    } catch (error) {
      console.warn(
        'Cart storage save failed',
        error
      );
    }
  }, [cart]);


  useEffect(() => {
    try {
      localStorage.setItem(
        'dreamqueen_wishlist',
        JSON.stringify(
          wishlist
        )
      );
    } catch (error) {
      console.warn(
        'Wishlist storage save failed',
        error
      );
    }
  }, [wishlist]);


  useEffect(() => {
    try {
      localStorage.setItem(
        'dreamqueen_settings',
        JSON.stringify(
          storeSettings
        )
      );
    } catch (error) {
      console.warn(
        '[Storage] Store settings cache save failed:',
        error
      );
    }
  }, [storeSettings]);


  /* =========================================================
     PRODUCT FUNCTIONS
  ========================================================= */

  const addProduct = async (
    productData: Omit<Product, 'id'>
  ): Promise<void> => {
    const newProduct: Product = {
      ...productData,
      id: `prod-${Date.now()}`
    };


    try {
      /*
       * FIRST save to Supabase.
       */
      await upsertProductToSupabase(
        newProduct
      );


      /*
       * THEN update local UI.
       */
      setProducts((prev) => [
        newProduct,
        ...prev
      ]);


      showToast(
        `"${newProduct.name}" added and synced to all devices`
      );
    } catch (error: any) {
      console.error(
        '[Supabase] Could not save product:',
        error
      );


      showToast(
        `Product could not be saved: ${
          error?.message ||
          'Database error'
        }`,
        'error'
      );
    }
  };


  const updateProduct = (
    id: string,
    updates: Partial<Product>
  ) => {
    const existing =
      products.find(
        (product) =>
          product.id === id
      );


    if (!existing) return;


    const updated: Product = {
      ...existing,
      ...updates
    };


    /*
     * Immediate UI update.
     */
    setProducts((prev) =>
      prev.map((product) =>
        product.id === id
          ? updated
          : product
      )
    );


    /*
     * Shared cloud update.
     */
    upsertProductToSupabase(
      updated
    )
      .then(() => {
        console.log(
          '[Supabase] Product updated successfully:',
          updated.id
        );

        showToast(
          'Product updated and synced to all devices'
        );
      })
      .catch((error: any) => {
        console.error(
          '[Supabase] Product update failed:',
          error
        );

        showToast(
          `Cloud update failed: ${
            error?.message ||
            'Database error'
          }`,
          'error'
        );
      });
  };


  const deleteProduct = async (
    id: string
  ): Promise<void> => {
    try {
      /*
       * FIRST delete from Supabase.
       */
      await deleteProductFromSupabase(
        id
      );


      /*
       * THEN update local UI.
       */
      setProducts((prev) =>
        prev.filter(
          (product) =>
            product.id !== id
        )
      );


      showToast(
        'Product removed and synced to all devices',
        'info'
      );
    } catch (error: any) {
      console.error(
        '[Supabase] Could not delete product:',
        error
      );


      showToast(
        `Cloud delete failed: ${
          error?.message ||
          'Database error'
        }`,
        'error'
      );
    }
  };


  const updateProductStock =
    async (
      id: string,
      delta: number
    ): Promise<void> => {
      const existing =
        products.find(
          (product) =>
            product.id === id
        );


      if (!existing) return;


      const newStock =
        Math.max(
          0,
          existing.stock + delta
        );


      const updatedProduct: Product = {
        ...existing,
        stock: newStock
      };


      try {
        await upsertProductToSupabase(
          updatedProduct
        );


        setProducts((prev) =>
          prev.map(
            (product) =>
              product.id === id
                ? updatedProduct
                : product
          )
        );


        console.log(
          `[Supabase] Stock updated: ${existing.name} → ${newStock}`
        );
      } catch (error: any) {
        console.error(
          '[Supabase] Stock update failed:',
          error
        );


        showToast(
          `Stock update failed: ${
            error?.message ||
            'Database error'
          }`,
          'error'
        );
      }
    };


  /* =========================================================
     CART
  ========================================================= */

  const addToCart = (
    product: Product,
    quantity = 1,
    colorIndex = 0
  ) => {
    const chosenColor =
      product.colors &&
      product.colors.length > 0
        ? product.colors[
            colorIndex
          ] ||
          product.colors[0]
        : {
            name: 'Original',
            hex: '#5B3A29'
          };


    setCart((prev) => {
      const existing =
        prev.find(
          (item) =>
            item.product.id ===
              product.id &&
            item.selectedColor.name ===
              chosenColor.name
        );


      if (existing) {
        return prev.map(
          (item) =>
            item.product.id ===
              product.id &&
            item.selectedColor.name ===
              chosenColor.name
              ? {
                  ...item,
                  quantity:
                    item.quantity +
                    quantity
                }
              : item
        );
      }


      return [
        ...prev,
        {
          product,
          quantity,
          selectedColor:
            chosenColor
        }
      ];
    });


    showToast(
      `Added ${product.name} (${chosenColor.name}) to your basket!`
    );
  };


  const removeFromCart = (
    productId: string,
    colorName: string
  ) => {
    setCart((prev) =>
      prev.filter(
        (item) =>
          !(
            item.product.id ===
              productId &&
            item.selectedColor.name ===
              colorName
          )
      )
    );


    showToast(
      'Item removed from basket',
      'info'
    );
  };


  const updateCartQuantity = (
    productId: string,
    colorName: string,
    quantity: number
  ) => {
    if (quantity <= 0) {
      removeFromCart(
        productId,
        colorName
      );
      return;
    }


    setCart((prev) =>
      prev.map((item) =>
        item.product.id ===
            productId &&
          item.selectedColor.name ===
            colorName
          ? {
              ...item,
              quantity
            }
          : item
      )
    );
  };


  const clearCart = () => {
    setCart([]);
  };


  const cartCount =
    cart.reduce(
      (total, item) =>
        total + item.quantity,
      0
    );


  const cartSubtotal =
    cart.reduce(
      (total, item) =>
        total +
        item.product.price *
          item.quantity,
      0
    );


  /* =========================================================
     WISHLIST
  ========================================================= */

  const toggleWishlist = (
    productId: string
  ) => {
    setWishlist((prev) => {
      const exists =
        prev.includes(
          productId
        );


      if (exists) {
        showToast(
          'Removed from wishlist',
          'info'
        );

        return prev.filter(
          (id) =>
            id !== productId
        );
      }


      showToast(
        'Saved to your handmade wishlist ❤️'
      );


      return [
        ...prev,
        productId
      ];
    });
  };


  const isInWishlist = (
    productId: string
  ) =>
    wishlist.includes(
      productId
    );


  /* =========================================================
     ORDERS
  ========================================================= */

  const createOrder = async (
    orderData: Omit<
      Order,
      'id' | 'orderNumber' | 'createdAt'
    >
  ): Promise<Order> => {
    const randomNum =
      Math.floor(
        100000 +
          Math.random() *
            900000
      );


    const orderNumber =
      `DQ-${randomNum}`;


    const newOrder: Order = {
      ...orderData,
      id: `ord-${Date.now()}`,
      orderNumber,
      createdAt:
        new Date().toISOString()
    };


    /*
     * Immediately show order locally.
     */
    setOrders((prev) => [
      newOrder,
      ...prev
    ]);


    /*
     * Deduct product stock.
     */
    await Promise.all(
      newOrder.items.map(
        (item) =>
          updateProductStock(
            item.productId,
            -item.quantity
          )
      )
    );


    /*
     * Save order to Supabase.
     */
    syncOrderToSupabase(
      newOrder
    ).then((result) => {
      if (!result.success) {
        console.error(
          '[Supabase] Order was not saved:',
          result.error
        );


        showToast(
          `Order created, but cloud save failed: ${
            result.error ||
            'Unknown error'
          }`,
          'error'
        );
      }
    });


    clearCart();
    setActiveCoupon(null);


    return newOrder;
  };


  const updateOrderStatus =
    async (
      orderId: string,
      status: OrderTrackingStatus,
      trackingNo?: string
    ): Promise<void> => {
      const existing =
        orders.find(
          (order) =>
            order.id ===
              orderId ||
            order.orderNumber ===
              orderId
        );


      if (!existing) return;


      const updated: Order = {
        ...existing,

        trackingStatus:
          status,

        shiprocketTrackingNumber:
          trackingNo ||
          existing.shiprocketTrackingNumber
      };


      setOrders((prev) =>
        prev.map(
          (order) =>
            order.id ===
              existing.id
              ? updated
              : order
        )
      );


      const result =
        await syncOrderToSupabase(
          updated
        );


      if (!result.success) {
        showToast(
          `Cloud order update failed: ${
            result.error ||
            'Unknown error'
          }`,
          'error'
        );

        return;
      }


      showToast(
        `Order status updated to: ${status
          .replace('_', ' ')
          .toUpperCase()}`
      );
    };


  const getOrderByIdOrNumber = (
    query: string
  ): Order | undefined => {
    const clean =
      query
        .trim()
        .toUpperCase();


    return orders.find(
      (order) =>
        order.orderNumber.toUpperCase() ===
          clean ||
        order.id.toUpperCase() ===
          clean
    );
  };


  /* =========================================================
     COUPONS
  ========================================================= */

  const applyCoupon = (
    code: string
  ) => {
    const normalized =
      code
        .trim()
        .toUpperCase();


    const coupon =
      coupons.find(
        (item) =>
          item.code.toUpperCase() ===
            normalized &&
          item.isActive
      );


    if (!coupon) {
      return {
        success: false,
        message:
          'Invalid or expired coupon code'
      };
    }


    if (
      cartSubtotal <
      coupon.minOrderAmount
    ) {
      return {
        success: false,
        message:
          `Requires a minimum cart value of ₹${coupon.minOrderAmount}`
      };
    }


    setActiveCoupon(
      coupon
    );


    showToast(
      'Coupon applied! Enjoy your handmade discount 🌸'
    );


    return {
      success: true,
      message:
        `Coupon ${coupon.code} applied successfully!`
    };
  };


  const removeCoupon = () => {
    setActiveCoupon(null);

    showToast(
      'Coupon removed',
      'info'
    );
  };


  const addCoupon = (
    coupon: Coupon
  ) => {
    setCoupons((prev) => [
      coupon,
      ...prev.filter(
        (item) =>
          item.code !==
          coupon.code
      )
    ]);


    upsertCouponToSupabase(
      coupon
    )
      .then(() => {
        showToast(
          `Coupon ${coupon.code} synced to all devices`
        );
      })
      .catch((error: any) => {
        console.error(
          '[Supabase] Coupon save failed:',
          error
        );


        showToast(
          `Coupon cloud save failed: ${
            error?.message ||
            'Database error'
          }`,
          'error'
        );
      });
  };


  const deleteCoupon = (
    code: string
  ) => {
    setCoupons((prev) =>
      prev.filter(
        (coupon) =>
          coupon.code !==
          code
      )
    );


    deleteCouponFromSupabase(
      code
    )
      .then(() => {
        showToast(
          'Coupon deleted from all devices',
          'info'
        );
      })
      .catch((error: any) => {
        console.error(
          '[Supabase] Coupon delete failed:',
          error
        );


        showToast(
          `Coupon cloud delete failed: ${
            error?.message ||
            'Database error'
          }`,
          'error'
        );
      });
  };


  /* =========================================================
     CUSTOM ORDERS
  ========================================================= */

  const submitCustomOrder = (
    request: Omit<
      CustomOrderRequest,
      'id' | 'status' | 'createdAt'
    >
  ) => {
    const newRequest:
      CustomOrderRequest = {
      ...request,

      id: `custom-${Date.now()}`,

      status: 'submitted',

      createdAt:
        new Date().toISOString()
    };


    setCustomOrders(
      (prev) => [
        newRequest,
        ...prev
      ]
    );


    syncCustomOrderToSupabase(
      newRequest
    ).then((result) => {
      if (!result.success) {
        console.error(
          '[Supabase] Custom order was not saved:',
          result.error
        );
      }
    });


    showToast(
      'Custom order inquiry submitted! We will contact you on WhatsApp 🌸'
    );
  };


  const updateCustomOrderStatus =
    async (
      id: string,
      status: CustomOrderRequest['status']
    ): Promise<void> => {
      const existing =
        customOrders.find(
          (order) =>
            order.id === id
        );


      if (!existing) return;


      const updated = {
        ...existing,
        status
      };


      setCustomOrders(
        (prev) =>
          prev.map(
            (order) =>
              order.id === id
                ? updated
                : order
          )
      );


      const result =
        await syncCustomOrderToSupabase(
          updated
        );


      if (!result.success) {
        showToast(
          `Cloud custom-order update failed: ${
            result.error ||
            'Unknown error'
          }`,
          'error'
        );

        return;
      }


      showToast(
        'Custom inquiry status updated'
      );
    };


  /* =========================================================
     FEEDBACK
  ========================================================= */

  const submitFeedback = (
    feedbackData: Omit<
      PurchasedItemFeedback,
      'id' | 'createdAt'
    >
  ) => {
    const existingIndex =
      feedbacks.findIndex(
        (feedback) =>
          feedback.orderNumber ===
            feedbackData.orderNumber &&
          feedback.productId ===
            feedbackData.productId
      );


    let updatedFeedbacks:
      PurchasedItemFeedback[];

    let feedbackToSync:
      PurchasedItemFeedback;


    /* =====================================================
       UPDATE EXISTING FEEDBACK
    ===================================================== */

    if (
      existingIndex >= 0
    ) {
      const updatedItem:
        PurchasedItemFeedback =
        {
          ...feedbacks[
            existingIndex
          ],

          ...feedbackData,

          createdAt:
            new Date().toISOString()
        };


      feedbackToSync =
        updatedItem;


      updatedFeedbacks =
        feedbacks.map(
          (feedback, index) =>
            index ===
            existingIndex
              ? updatedItem
              : feedback
        );


      showToast(
        'Thank you! Your feedback has been updated 🌸'
      );
    }


    /* =====================================================
       CREATE NEW FEEDBACK
    ===================================================== */

    else {
      const newFeedback:
        PurchasedItemFeedback =
        {
          ...feedbackData,

          id: `fb-${Date.now()}`,

          createdAt:
            new Date().toISOString()
        };


      feedbackToSync =
        newFeedback;


      updatedFeedbacks = [
        newFeedback,
        ...feedbacks
      ];


      /*
       * Update product rating locally.
       */
      setProducts((prev) =>
        prev.map((product) => {
          if (
            product.id !==
            feedbackData.productId
          ) {
            return product;
          }


          const currentCount =
            product.reviewsCount ||
            0;


          const newCount =
            currentCount + 1;


          const newAverage =
            Number(
              (
                (
                  (product.rating ||
                    5) *
                    currentCount +
                  feedbackData.rating
                ) /
                newCount
              ).toFixed(1)
            );


          return {
            ...product,

            reviewsCount:
              newCount,

            rating:
              newAverage
          };
        })
      );


      showToast(
        'Thank you! Your review helps our women artisans bloom 🌸'
      );
    }


    setFeedbacks(
      updatedFeedbacks
    );


    setActiveFeedbackTarget(
      null
    );


    /*
     * Save feedback to Supabase.
     */
    syncFeedbackToSupabase(
      feedbackToSync
    ).catch((error) =>
      console.warn(
        '[Supabase] Auto-sync feedback skipped/queued:',
        error
      )
    );
  };


  const getFeedbackForOrderItem = (
    orderNumber: string,
    productId: string
  ): PurchasedItemFeedback | undefined => {
    return feedbacks.find(
      (feedback) =>
        feedback.orderNumber ===
          orderNumber &&
        feedback.productId ===
          productId
    );
  };


  const replyToFeedback = (
    feedbackId: string,
    replyText: string
  ) => {
    const existing =
      feedbacks.find(
        (feedback) =>
          feedback.id ===
          feedbackId
      );


    if (!existing) return;


    const updatedFeedback:
      PurchasedItemFeedback = {
      ...existing,

      artisanResponse: {
        text: replyText,

        respondedAt:
          new Date().toISOString(),

        author:
          'DreamQueen Atelier Team'
      }
    };


    /*
     * Update current browser.
     */
    setFeedbacks((prev) =>
      prev.map(
        (feedback) =>
          feedback.id ===
            feedbackId
            ? updatedFeedback
            : feedback
      )
    );


    /*
     * Save shared version.
     */
    syncFeedbackToSupabase(
      updatedFeedback
    )
      .then((result) => {
        if (!result.success) {
          throw new Error(
            result.error ||
              'Feedback update failed'
          );
        }


        showToast(
          'Artisan response synced to all devices 💌'
        );
      })
      .catch((error: any) => {
        console.error(
          '[Supabase] Feedback reply failed:',
          error
        );


        showToast(
          `Reply cloud sync failed: ${
            error?.message ||
            'Database error'
          }`,
          'error'
        );
      });
  };


  /* =========================================================
     STORE SETTINGS
  ========================================================= */

  const updateStoreSettings = (
    settings: Partial<StoreSettings>
  ) => {
    const updatedSettings:
      StoreSettings = {
      ...storeSettings,
      ...settings
    };


    /*
     * Update current browser.
     */
    setStoreSettings(
      updatedSettings
    );


    /*
     * Save shared settings.
     */
    updateStoreSettingsInSupabase(
      updatedSettings
    )
      .then(() => {
        showToast(
          'Store settings synced to all devices'
        );
      })
      .catch((error: any) => {
        console.error(
          '[Supabase] Settings save failed:',
          error
        );


        showToast(
          `Settings cloud save failed: ${
            error?.message ||
            'Database error'
          }`,
          'error'
        );
      });
  };


  /* =========================================================
     REGISTER
  ========================================================= */

  const registerUser =
    async (data: {
      name: string;
      email: string;
      phone: string;
      password?: string;
    }): Promise<boolean> => {
      const trimmedName =
        data.name.trim();

      const trimmedEmail =
        data.email
          .trim()
          .toLowerCase();

      const digits =
        data.phone.replace(
          /\D/g,
          ''
        );


      if (!trimmedName) {
        showToast(
          'Please enter your full name',
          'error'
        );

        return false;
      }


      if (digits.length < 10) {
        showToast(
          'Please enter a valid 10-digit mobile number',
          'error'
        );

        return false;
      }


      if (
        !trimmedEmail.includes(
          '@'
        )
      ) {
        showToast(
          'Please enter a valid email address',
          'error'
        );

        return false;
      }


      if (
        !data.password ||
        data.password.length < 6
      ) {
        showToast(
          'Password must be at least 6 characters',
          'error'
        );

        return false;
      }


      try {
        const {
          data: authData,
          error
        } =
          await supabase.auth.signUp(
            {
              email:
                trimmedEmail,

              password:
                data.password,

              options: {
                data: {
                  full_name:
                    trimmedName,

                  phone:
                    digits
                }
              }
            }
          );


        if (error) {
          console.error(
            '[Supabase] Signup error:',
            error
          );

          showToast(
            error.message,
            'error'
          );

          return false;
        }


        if (!authData.user) {
          showToast(
            'Account could not be created',
            'error'
          );

          return false;
        }


        /*
         * Email confirmation enabled.
         */
        if (!authData.session) {
          showToast(
            'Account created. Please verify your email, then sign in.',
            'info'
          );

          setIsAuthModalOpen(
            false
          );

          return true;
        }


        setCurrentUser({
          id: authData.user.id,

          name: trimmedName,

          email:
            trimmedEmail,

          phone: digits,

          role: 'customer',

          savedAddresses: [],

          wishlistProductIds:
            wishlist
        });


        setIsAdmin(false);


        setIsAuthModalOpen(
          false
        );


        showToast(
          `Welcome to DreamQueen, ${
            trimmedName.split(
              ' '
            )[0]
          }! 💕`
        );


        if (
          authModalIntent ===
          'checkout'
        ) {
          setIsCheckoutOpen(
            true
          );
        }


        return true;
      } catch (error: any) {
        console.error(
          '[Supabase] Signup failed:',
          error
        );


        showToast(
          error?.message ||
            'Signup failed',
          'error'
        );


        return false;
      }
    };


  /* =========================================================
     LOGIN
  ========================================================= */

  const loginUser = async (
    identifier: string,
    password?: string
  ): Promise<boolean> => {
    const email =
      identifier
        .trim()
        .toLowerCase();


    if (!email.includes('@')) {
      showToast(
        'Please enter your registered email address',
        'error'
      );

      return false;
    }


    if (!password) {
      showToast(
        'Please enter your password',
        'error'
      );

      return false;
    }


    try {
      const {
        data,
        error
      } =
        await supabase.auth.signInWithPassword(
          {
            email,
            password
          }
        );


      if (
        error ||
        !data.user
      ) {
        showToast(
          error?.message ||
            'Incorrect email or password',
          'error'
        );

        return false;
      }


      const profile =
        await fetchCurrentProfile();


      const userIsAdmin =
        profile?.role ===
        'admin';


      const user: User = {
        id: data.user.id,

        name:
          profile?.full_name ||
          data.user.user_metadata
            ?.full_name ||
          'DreamQueen Customer',

        email:
          profile?.email ||
          data.user.email ||
          email,

        phone:
          profile?.phone ||
          data.user.user_metadata
            ?.phone ||
          '',

        role: userIsAdmin
          ? 'admin'
          : 'customer',

        savedAddresses:
          Array.isArray(
            profile?.saved_addresses
          )
            ? profile.saved_addresses
            : [],

        wishlistProductIds:
          wishlist
      };


      setCurrentUser(
        user
      );


      setIsAdmin(
        userIsAdmin
      );


      setIsAuthModalOpen(
        false
      );


      showToast(
        `Welcome back, ${
          user.name.split(
            ' '
          )[0]
        }! 🌸`
      );


      if (
        authModalIntent ===
        'checkout'
      ) {
        setIsCheckoutOpen(
          true
        );
      }


      return true;
    } catch (error: any) {
      console.error(
        '[Supabase] Login failed:',
        error
      );


      showToast(
        error?.message ||
          'Login failed',
        'error'
      );


      return false;
    }
  };


  /* =========================================================
     LOGOUT
  ========================================================= */

  const logoutUser =
    async (): Promise<void> => {
      const {
        error
      } =
        await supabase.auth.signOut();


      if (error) {
        showToast(
          error.message ||
            'Could not log out',
          'error'
        );

        return;
      }


      setCurrentUser(
        null
      );

      setIsAdmin(
        false
      );


      showToast(
        'Logged out successfully',
        'info'
      );
    };


  /* =========================================================
     UPDATE USER PROFILE
  ========================================================= */

  const updateUserProfile =
    async (
      name: string,
      phone: string
    ): Promise<void> => {
      if (!currentUser) {
        return;
      }


      const cleanPhone =
        phone.replace(
          /\D/g,
          ''
        );


      try {
        await updateCurrentProfile(
          name.trim(),
          cleanPhone
        );


        setCurrentUser({
          ...currentUser,

          name:
            name.trim(),

          phone:
            cleanPhone
        });


        showToast(
          'Profile updated successfully'
        );
      } catch (error: any) {
        console.error(
          '[Supabase] Profile update failed:',
          error
        );


        showToast(
          error?.message ||
            'Profile update failed',
          'error'
        );
      }
    };


  /* =========================================================
     CONTEXT VALUE
  ========================================================= */

  return (
    <StoreContext.Provider
      value={{
        /* Products */
        products,
        addProduct,
        updateProduct,
        deleteProduct,
        updateProductStock,

        /* Cart */
        cart,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        cartCount,
        cartSubtotal,

        /* Wishlist */
        wishlist,
        toggleWishlist,
        isInWishlist,

        /* Orders */
        orders,
        createOrder,
        updateOrderStatus,
        getOrderByIdOrNumber,

        /* Coupons */
        coupons,
        activeCoupon,
        applyCoupon,
        removeCoupon,
        addCoupon,
        deleteCoupon,

        /* Custom orders */
        customOrders,
        submitCustomOrder,
        updateCustomOrderStatus,

        /* Feedback */
        feedbacks,
        submitFeedback,
        getFeedbackForOrderItem,
        replyToFeedback,
        activeFeedbackTarget,
        setActiveFeedbackTarget,

        /* Settings */
        storeSettings,
        updateStoreSettings,

        /* Auth */
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

        /* Navigation */
        activeTab,
        setActiveTab,

        /* Product */
        selectedProduct,
        setSelectedProduct,

        /* UI */
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

        /* Toasts */
        toasts,
        showToast
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};


/* =========================================================
   HOOK
========================================================= */

export const useStore =
  () => {
    const context =
      useContext(
        StoreContext
      );


    if (!context) {
      throw new Error(
        'useStore must be used within a StoreProvider'
      );
    }


    return context;
  };