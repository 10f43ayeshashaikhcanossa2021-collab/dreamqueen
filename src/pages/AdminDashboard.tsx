import React, { useState, useMemo } from 'react';
import { useStore } from '../context/StoreContext';
import type {
  Product,
  ProductCategory,
  OrderTrackingStatus,
  CustomOrderRequest,
  Coupon
} from '../types';
import {
  ShieldAlert,
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  Sparkles,
  MessageSquare,
  Settings,
  Plus,
  Edit3,
  Trash2,
  Upload,
  CheckCircle2,
  Download,
  RefreshCw,
  Tag,
  X,
  Eye,
  EyeOff
} from 'lucide-react';
import { safeImage } from '../utils/imageHelper';
import { uploadImageToBucket, deleteStorageImageByUrl } from '../lib/supabase';
import { downloadOrderInvoicePdf } from '../utils/invoiceGenerator';
import { formatTrackingStatusLabel } from '../utils/pricing';

type AdminSection =
  | 'overview'
  | 'products'
  | 'orders'
  | 'customers'
  | 'custom_orders'
  | 'reviews'
  | 'settings';

const CATEGORIES: ProductCategory[] = [
  'Hair Accessories',
  'Keychains',
  'Bags & Pouches',
  'Accessories',
  'Gifts',
  'Custom Orders'
];

export const AdminDashboard: React.FC = () => {
  const {
    currentUser,
    isAuthLoading,
    openAuthModal,
    setActiveTab,
    products,
    addProduct,
    updateProduct,
    deleteProduct,
    updateProductStock,
    orders,
    verifyOrderPaymentAdmin,
    refundOrderAdmin,
    updateOrderStatus,
    customOrders,
    updateCustomOrderStatus,
    feedbacks,
    replyToFeedback,
    toggleFeedbackApproval,
    deleteFeedback,
    coupons,
    addCoupon,
    updateCoupon,
    deleteCoupon,
    storeSettings,
    updateStoreSettings,
    showToast
  } = useStore();

  const [section, setSection] = useState<AdminSection>('overview');

  // Product modal state
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isProductFormOpen, setIsProductFormOpen] = useState(false);
  const [prodName, setProdName] = useState('');
  const [prodTagline, setProdTagline] = useState('');
  const [prodPrice, setProdPrice] = useState('99');
  const [prodOrigPrice, setProdOrigPrice] = useState('');
  const [prodCategory, setProdCategory] = useState<ProductCategory>('Hair Accessories');
  const [prodStock, setProdStock] = useState('20');
  const [prodImages, setProdImages] = useState<string[]>([]);
  const [prodDesc, setProdDesc] = useState('');
  const [prodYarn, setProdYarn] = useState('100% Milk Cotton Yarn');
  const [prodCare, setProdCare] = useState('Gentle hand wash in cold water; dry flat.');
  const [prodActive, setProdActive] = useState(true);
  const [prodBestSeller, setProdBestSeller] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [prodSearch, setProdSearch] = useState('');

  // Orders filter/tracking inputs
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');
  const [trackingDrafts, setTrackingDrafts] = useState<Record<string, string>>({});

  // Custom order admin notes/quote drafts
  const [quoteDrafts, setQuoteDrafts] = useState<Record<string, string>>({});
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});

  // Review reply drafts
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});

  // Settings form state
  const [settingsForm, setSettingsForm] = useState(storeSettings);

  // Coupon form state
  const [newCouponCode, setNewCouponCode] = useState('');
  const [newCouponDiscount, setNewCouponDiscount] = useState('10');
  const [newCouponMin, setNewCouponMin] = useState('199');
  const [newCouponMaxDisc, setNewCouponMaxDisc] = useState('150');
  const [newCouponMaxUses, setNewCouponMaxUses] = useState('');
  const [newCouponExpires, setNewCouponExpires] = useState('');
  const [newCouponDesc, setNewCouponDesc] = useState('');

  const metrics = useMemo(() => {
    const validOrders = orders.filter((o) => o.trackingStatus !== 'cancelled' && o.trackingStatus !== 'refunded');
    const totalRevenue = validOrders.reduce((s, o) => s + Number(o.total || 0), 0);
    const pendingOrders = orders.filter((o) =>
      ['pending', 'payment_pending', 'payment_confirmed', 'preparing', 'packed'].includes(
        o.trackingStatus
      )
    ).length;
    const completedOrders = orders.filter((o) => o.trackingStatus === 'delivered').length;
    const cancelledOrders = orders.filter((o) =>
      ['cancelled', 'refund_initiated', 'refunded'].includes(o.trackingStatus)
    ).length;
    const lowStockProducts = products.filter((p) => p.stock <= 5);

    const uniqueCustomerEmails = new Set(
      orders.map((o) => o.customer?.email?.toLowerCase()).filter(Boolean)
    );

    return {
      totalRevenue,
      totalOrders: orders.length,
      totalCustomers: uniqueCustomerEmails.size,
      totalProducts: products.length,
      pendingOrders,
      completedOrders,
      cancelledOrders,
      lowStockProducts
    };
  }, [orders, products]);

  const customersList = useMemo(() => {
    const map = new Map<
      string,
      { name: string; email: string; phone: string; orders: number; spent: number; lastOrder: string }
    >();
    orders.forEach((o) => {
      const key = (o.customer?.email || o.customer?.phone || o.id).toLowerCase();
      const cur = map.get(key);
      if (cur) {
        cur.orders += 1;
        cur.spent += Number(o.total || 0);
        if (new Date(o.createdAt) > new Date(cur.lastOrder)) cur.lastOrder = o.createdAt;
      } else {
        map.set(key, {
          name: o.customer?.name || 'Customer',
          email: o.customer?.email || '',
          phone: o.customer?.phone || '',
          orders: 1,
          spent: Number(o.total || 0),
          lastOrder: o.createdAt
        });
      }
    });
    return Array.from(map.values()).sort((a, b) => b.spent - a.spent);
  }, [orders]);

  // Strict RBAC Gate
  if (isAuthLoading) {
    return (
      <div className="py-24 text-center text-sm text-[#6E6863]">
        Verifying administrator credentials...
      </div>
    );
  }

  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <div className="py-20 max-w-md mx-auto px-4 text-center">
        <div className="bg-white rounded-3xl border border-[#EAD5C5] p-8 shadow-md space-y-4">
          <div className="w-14 h-14 rounded-full bg-red-50 text-[#842029] flex items-center justify-center mx-auto border border-red-200">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <h1 className="font-heading text-2xl font-bold text-[#5B3A29]">
            Administrator Access Required
          </h1>
          <p className="text-xs text-[#6E6863] leading-relaxed">
            {currentUser
              ? `Signed in as ${currentUser.email} (${currentUser.role}). Only verified DreamQueen Studio administrators can access store management.`
              : 'Please sign in with an authorized DreamQueen Studio administrator account.'}
          </p>
          <div className="flex flex-col gap-2 pt-2">
            {!currentUser && (
              <button
                onClick={() => openAuthModal('general')}
                className="w-full py-3 rounded-full bg-[#5B3A29] text-white text-xs font-semibold hover:bg-[#43291B]"
              >
                Sign In as Administrator
              </button>
            )}
            <button
              onClick={() => setActiveTab('home')}
              className="w-full py-3 rounded-full bg-[#FFF8F0] border border-[#EAD5C5] text-[#5B3A29] text-xs font-semibold"
            >
              Return to Storefront
            </button>
          </div>
        </div>
      </div>
    );
  }

  const openCreateProduct = () => {
    setEditingProduct(null);
    setProdName('');
    setProdTagline('');
    setProdPrice('99');
    setProdOrigPrice('');
    setProdCategory('Hair Accessories');
    setProdStock('20');
    setProdImages([]);
    setProdDesc('');
    setProdYarn('100% Milk Cotton Yarn');
    setProdCare('Gentle hand wash in cold water; dry flat.');
    setProdActive(true);
    setProdBestSeller(false);
    setIsProductFormOpen(true);
  };

  const openEditProduct = (p: Product) => {
    setEditingProduct(p);
    setProdName(p.name);
    setProdTagline(p.tagline);
    setProdPrice(String(p.price));
    setProdOrigPrice(p.originalPrice ? String(p.originalPrice) : '');
    setProdCategory(p.category);
    setProdStock(String(p.stock));
    setProdImages(p.images || []);
    setProdDesc(p.description);
    setProdYarn(p.yarnType);
    setProdCare(p.careInstructions);
    setProdActive(p.isActive !== false);
    setProdBestSeller(Boolean(p.isBestSeller));
    setIsProductFormOpen(true);
  };

  const handleUploadProductImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingImage(true);
    const res = await uploadImageToBucket('product-images', file, 'products');
    setIsUploadingImage(false);
    if (res.error || !res.publicUrl) {
      showToast(res.error || 'Upload failed', 'error');
      return;
    }
    setProdImages((prev) => [...prev, res.publicUrl!]);
    showToast('Product image uploaded to Supabase Storage!');
  };

  const handleRemoveProductImage = async (url: string) => {
    setProdImages((prev) => prev.filter((img) => img !== url));
    await deleteStorageImageByUrl('product-images', url).catch(() => {});
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const numericPrice = Math.max(1, Number(prodPrice) || 50);
    const numericStock = Math.max(0, Math.floor(Number(prodStock) || 0));
    const finalImages =
      prodImages.length > 0 ? prodImages : ['/assets/aistudio/hair_clip_____47816559.jpg'];

    if (editingProduct) {
      await updateProduct(editingProduct.id, {
        name: prodName.trim(),
        tagline: prodTagline.trim(),
        price: numericPrice,
        originalPrice: prodOrigPrice ? Number(prodOrigPrice) : undefined,
        category: prodCategory,
        stock: numericStock,
        images: finalImages,
        description: prodDesc.trim(),
        yarnType: prodYarn.trim(),
        careInstructions: prodCare.trim(),
        isActive: prodActive,
        isBestSeller: prodBestSeller
      });
    } else {
      await addProduct({
        name: prodName.trim(),
        tagline: prodTagline.trim() || 'Handmade crochet with gentle love',
        price: numericPrice,
        originalPrice: prodOrigPrice ? Number(prodOrigPrice) : undefined,
        rating: 5.0,
        reviewsCount: 0,
        category: prodCategory,
        images: finalImages,
        stock: numericStock,
        colors: [{ name: 'Original Artisan Shade', hex: '#5B3A29' }],
        description: prodDesc.trim() || 'Handcrafted by DreamQueen Atelier.',
        yarnType: prodYarn.trim(),
        careInstructions: prodCare.trim(),
        tags: [prodCategory, 'Handmade'],
        isBestSeller: prodBestSeller,
        isNewArrival: true,
        isFeatured: true,
        isActive: prodActive
      });
    }
    setIsProductFormOpen(false);
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCouponCode.trim()) return;
    const coupon: Coupon = {
      code: newCouponCode.trim().toUpperCase(),
      discountPercent: Math.max(0, Math.min(90, Number(newCouponDiscount) || 0)),
      minOrderAmount: Math.max(0, Number(newCouponMin) || 0),
      maxDiscount: newCouponMaxDisc ? Number(newCouponMaxDisc) : undefined,
      maxUses: newCouponMaxUses ? Number(newCouponMaxUses) : undefined,
      expiresAt: newCouponExpires ? new Date(newCouponExpires).toISOString() : undefined,
      description: newCouponDesc.trim() || 'Studio promotional discount',
      isActive: true,
      usedCount: 0
    };
    await addCoupon(coupon);
    setNewCouponCode('');
    setNewCouponDesc('');
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(prodSearch.toLowerCase()) ||
      p.category.toLowerCase().includes(prodSearch.toLowerCase())
  );

  const filteredOrders = orders.filter((o) => {
    if (orderStatusFilter !== 'all' && o.trackingStatus !== orderStatusFilter) return false;
    if (orderSearch.trim()) {
      const q = orderSearch.toLowerCase();
      return (
        o.orderNumber.toLowerCase().includes(q) ||
        o.customer?.name?.toLowerCase().includes(q) ||
        o.customer?.email?.toLowerCase().includes(q) ||
        (o.upiTransactionRef || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl border border-[#EAD5C5] p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#708238]">
            Protected Artisan Backoffice
          </span>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-[#5B3A29]">
            DreamQueen Studio Admin
          </h1>
          <p className="text-xs text-[#6E6863]">
            Signed in as <strong>{currentUser.email}</strong> (Verified Admin Role)
          </p>
        </div>

        {/* Navigation Pills */}
        <div className="flex flex-wrap gap-1.5">
          {[
            { id: 'overview', label: 'Overview', icon: LayoutDashboard },
            { id: 'products', label: 'Products', icon: Package },
            { id: 'orders', label: 'Orders', icon: ShoppingBag },
            { id: 'customers', label: 'Customers', icon: Users },
            { id: 'custom_orders', label: 'Custom Orders', icon: Sparkles },
            { id: 'reviews', label: 'Reviews', icon: MessageSquare },
            { id: 'settings', label: 'Settings & Coupons', icon: Settings }
          ].map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setSection(item.id as AdminSection)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
                  section === item.id
                    ? 'bg-[#5B3A29] text-white shadow-xs'
                    : 'bg-[#FFF8F0] text-[#5B3A29] border border-[#EAD5C5] hover:bg-[#F8D7DA]/40'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* SECTION A: OVERVIEW */}
      {section === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Net Revenue', value: `₹${metrics.totalRevenue.toLocaleString('en-IN')}` },
              { label: 'Total Orders', value: String(metrics.totalOrders) },
              { label: 'Unique Customers', value: String(metrics.totalCustomers) },
              { label: 'Catalog Pieces', value: String(metrics.totalProducts) },
              { label: 'Pending / Active Orders', value: String(metrics.pendingOrders) },
              { label: 'Completed / Delivered', value: String(metrics.completedOrders) },
              { label: 'Cancelled / Refunded', value: String(metrics.cancelledOrders) },
              { label: 'Low Stock Alerts (≤5)', value: String(metrics.lowStockProducts.length) }
            ].map((kpi) => (
              <div
                key={kpi.label}
                className="bg-white rounded-2xl border border-[#EAD5C5] p-4 shadow-xs"
              >
                <span className="text-[11px] font-semibold text-[#6E6863] block">
                  {kpi.label}
                </span>
                <span className="font-heading text-2xl font-bold text-[#5B3A29] tabular-nums mt-1 block">
                  {kpi.value}
                </span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Low Stock Alert List */}
            <div className="bg-white rounded-3xl border border-[#EAD5C5] p-5 space-y-3">
              <h3 className="font-heading text-lg font-bold text-[#5B3A29]">
                Low-Stock Products ({metrics.lowStockProducts.length})
              </h3>
              {metrics.lowStockProducts.length === 0 ? (
                <p className="text-xs text-[#6E6863]">All products are well stocked above 5 units.</p>
              ) : (
                <div className="space-y-2">
                  {metrics.lowStockProducts.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-[#FFF8F0] border border-[#EAD5C5] text-xs"
                    >
                      <span className="font-semibold text-[#2E2E2E] truncate pr-2">{p.name}</span>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-bold text-[#842029] tabular-nums">
                          {p.stock} left
                        </span>
                        <button
                          onClick={() => updateProductStock(p.id, 10)}
                          className="px-2.5 py-1 rounded-lg bg-[#5B3A29] text-white text-[11px] font-semibold"
                        >
                          +10 Stock
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Transactions */}
            <div className="bg-white rounded-3xl border border-[#EAD5C5] p-5 space-y-3">
              <h3 className="font-heading text-lg font-bold text-[#5B3A29]">
                Recent Transactions
              </h3>
              <div className="space-y-2">
                {orders.slice(0, 6).map((o) => (
                  <div
                    key={o.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-[#FDF9F4] border border-[#EAD5C5] text-xs"
                  >
                    <div>
                      <span className="font-bold text-[#5B3A29]">{o.orderNumber}</span>
                      <span className="text-[#6E6863] ml-2">{o.customer?.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="uppercase text-[10px] px-2 py-0.5 rounded-full bg-white border border-[#EAD5C5] font-semibold">
                        {o.paymentMethod} • {o.paymentStatus}
                      </span>
                      <span className="font-price font-bold text-[#5B3A29] tabular-nums">
                        ₹{o.total}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION B: PRODUCTS */}
      {section === 'products' && (
        <div className="bg-white rounded-3xl border border-[#EAD5C5] p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-heading text-xl font-bold text-[#5B3A29]">
                Product Catalog ({products.length})
              </h2>
              <p className="text-xs text-[#6E6863]">
                Manage handmade items, Supabase Storage photos, pricing, and inventory levels.
              </p>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Search products..."
                value={prodSearch}
                onChange={(e) => setProdSearch(e.target.value)}
                className="px-3.5 py-2 rounded-xl border border-[#EAD5C5] text-xs bg-[#FDF9F4]"
              />
              <button
                onClick={openCreateProduct}
                className="px-4 py-2 rounded-xl bg-[#5B3A29] text-white text-xs font-semibold flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Add Product</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FFF8F0] border-b border-[#EAD5C5] text-[#5B3A29]">
                <tr>
                  <th className="p-3">Product</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Price</th>
                  <th className="p-3">Stock</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0DFD1]">
                {filteredProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-[#FDF9F4]">
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={safeImage(p.images?.[0])}
                          alt={p.name}
                          className="w-10 h-10 rounded-lg object-cover border border-[#EAD5C5]"
                        />
                        <span className="font-bold text-[#2E2E2E]">{p.name}</span>
                      </div>
                    </td>
                    <td className="p-3 text-[#6E6863]">{p.category}</td>
                    <td className="p-3 font-price font-bold tabular-nums">₹{p.price}</td>
                    <td className="p-3 tabular-nums">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => updateProductStock(p.id, -1)}
                          className="px-1.5 py-0.5 rounded border border-[#EAD5C5]"
                        >
                          -
                        </button>
                        <span className="font-bold">{p.stock}</span>
                        <button
                          onClick={() => updateProductStock(p.id, 1)}
                          className="px-1.5 py-0.5 rounded border border-[#EAD5C5]"
                        >
                          +
                        </button>
                      </div>
                    </td>
                    <td className="p-3">
                      <button
                        onClick={() => updateProduct(p.id, { isActive: p.isActive === false })}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 ${
                          p.isActive !== false
                            ? 'bg-[#E8F0DC] text-[#4A5D1E]'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {p.isActive !== false ? (
                          <>
                            <Eye className="w-3 h-3" /> Active
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-3 h-3" /> Hidden
                          </>
                        )}
                      </button>
                    </td>
                    <td className="p-3 text-right space-x-2">
                      <button
                        onClick={() => openEditProduct(p)}
                        className="p-1.5 rounded-lg border border-[#EAD5C5] text-[#5B3A29] hover:bg-[#FFF8F0]"
                        title="Edit"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => deleteProduct(p.id)}
                        className="p-1.5 rounded-lg border border-red-200 text-red-700 hover:bg-red-50"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SECTION C: ORDERS */}
      {section === 'orders' && (
        <div className="bg-white rounded-3xl border border-[#EAD5C5] p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="font-heading text-xl font-bold text-[#5B3A29]">
              Order Management ({filteredOrders.length})
            </h2>
            <div className="flex flex-wrap gap-2">
              <input
                type="text"
                placeholder="Order #, name, email, UTR..."
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
                className="px-3.5 py-2 rounded-xl border border-[#EAD5C5] text-xs bg-[#FDF9F4]"
              />
              <select
                value={orderStatusFilter}
                onChange={(e) => setOrderStatusFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-[#EAD5C5] text-xs bg-[#FFF8F0]"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Order Placed</option>
                <option value="payment_pending">Payment Pending</option>
                <option value="payment_confirmed">Payment Confirmed</option>
                <option value="preparing">Preparing</option>
                <option value="packed">Packed</option>
                <option value="shipped">Shipped</option>
                <option value="out_for_delivery">Out for Delivery</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <div className="space-y-4">
            {filteredOrders.map((ord) => (
              <div
                key={ord.id}
                className="p-4 rounded-2xl border border-[#EAD5C5] bg-[#FDF9F4] space-y-3 text-xs"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 pb-2 border-b border-[#EAD5C5]">
                  <div>
                    <span className="font-heading text-base font-bold text-[#5B3A29]">
                      {ord.orderNumber}
                    </span>
                    <span className="ml-2 text-[#6E6863]">
                      {ord.customer?.name} ({ord.customer?.phone}) • {ord.customer?.email}
                    </span>
                    {ord.upiTransactionRef && (
                      <span className="block font-mono text-[11px] text-[#5B3A29] mt-0.5">
                        Submitted UTR: <strong>{ord.upiTransactionRef}</strong>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center flex-wrap gap-2">
                    <span className="font-price font-bold text-sm text-[#5B3A29] tabular-nums">
                      ₹{ord.total}
                    </span>
                    <span className="px-2.5 py-1 rounded-full bg-white border border-[#EAD5C5] font-bold uppercase text-[10px]">
                      {ord.paymentMethod} • {ord.paymentStatus}
                    </span>
                    {ord.paymentStatus === 'pending' && (
                      <button
                        onClick={() => verifyOrderPaymentAdmin(ord.id)}
                        className="px-3 py-1 rounded-full bg-[#708238] text-white font-semibold text-[11px] flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3 h-3" /> Verify Payment
                      </button>
                    )}
                    <button
                      onClick={() => downloadOrderInvoicePdf(ord)}
                      className="px-2.5 py-1 rounded-full bg-white border border-[#EAD5C5] text-[#5B3A29] font-semibold text-[11px] flex items-center gap-1"
                    >
                      <Download className="w-3 h-3" /> Invoice
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <label className="font-semibold text-[#5B3A29]">Lifecycle:</label>
                    <select
                      value={ord.trackingStatus}
                      onChange={(e) =>
                        updateOrderStatus(ord.id, e.target.value as OrderTrackingStatus)
                      }
                      className="px-2.5 py-1.5 rounded-xl border border-[#EAD5C5] bg-white font-semibold"
                    >
                      {(
                        [
                          'pending',
                          'payment_pending',
                          'payment_confirmed',
                          'preparing',
                          'packed',
                          'shipped',
                          'out_for_delivery',
                          'delivered',
                          'cancelled'
                        ] as OrderTrackingStatus[]
                      ).map((st) => (
                        <option key={st} value={st}>
                          {formatTrackingStatusLabel(st)}
                        </option>
                      ))}
                    </select>

                    <input
                      type="text"
                      placeholder="Courier Tracking #"
                      value={trackingDrafts[ord.id] ?? ord.shiprocketTrackingNumber ?? ''}
                      onChange={(e) =>
                        setTrackingDrafts({ ...trackingDrafts, [ord.id]: e.target.value })
                      }
                      className="px-2.5 py-1.5 rounded-xl border border-[#EAD5C5] bg-white font-mono"
                    />
                    <button
                      onClick={() =>
                        updateOrderStatus(
                          ord.id,
                          ord.trackingStatus,
                          trackingDrafts[ord.id] ?? ord.shiprocketTrackingNumber ?? ''
                        )
                      }
                      className="px-3 py-1.5 rounded-xl bg-[#5B3A29] text-white font-semibold"
                    >
                      Save Tracking
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    {ord.trackingStatus !== 'cancelled' && (
                      <button
                        onClick={() =>
                          updateOrderStatus(ord.id, 'cancelled', undefined, 'Cancelled by studio admin')
                        }
                        className="px-3 py-1.5 rounded-xl border border-red-200 text-red-700 hover:bg-red-50 font-semibold"
                      >
                        Cancel & Restore Stock
                      </button>
                    )}
                    {ord.paymentStatus === 'paid' && (
                      <button
                        onClick={() => refundOrderAdmin(ord.id)}
                        className="px-3 py-1.5 rounded-xl bg-[#FFF3A8] text-[#855D00] font-semibold flex items-center gap-1"
                      >
                        <RefreshCw className="w-3 h-3" /> Issue Refund
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION D: CUSTOMERS */}
      {section === 'customers' && (
        <div className="bg-white rounded-3xl border border-[#EAD5C5] p-6 space-y-4">
          <h2 className="font-heading text-xl font-bold text-[#5B3A29]">
            Customer Directory ({customersList.length})
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FFF8F0] border-b border-[#EAD5C5] text-[#5B3A29]">
                <tr>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Phone</th>
                  <th className="p-3">Orders</th>
                  <th className="p-3">Lifetime Spend</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0DFD1]">
                {customersList.map((c) => (
                  <tr key={c.email || c.phone} className="hover:bg-[#FDF9F4]">
                    <td className="p-3 font-bold text-[#2E2E2E]">{c.name}</td>
                    <td className="p-3 text-[#6E6863]">{c.email}</td>
                    <td className="p-3 font-mono">{c.phone}</td>
                    <td className="p-3 tabular-nums font-bold">{c.orders}</td>
                    <td className="p-3 tabular-nums font-price font-bold text-[#5B3A29]">
                      ₹{c.spent}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SECTION E: CUSTOM ORDERS */}
      {section === 'custom_orders' && (
        <div className="bg-white rounded-3xl border border-[#EAD5C5] p-6 space-y-4">
          <h2 className="font-heading text-xl font-bold text-[#5B3A29]">
            Bespoke Custom Order Requests ({customOrders.length})
          </h2>
          {customOrders.length === 0 ? (
            <p className="text-xs text-[#6E6863]">No custom requests submitted yet.</p>
          ) : (
            <div className="space-y-4">
              {customOrders.map((co) => (
                <div
                  key={co.id}
                  className="p-4 rounded-2xl border border-[#EAD5C5] bg-[#FDF9F4] flex flex-col md:flex-row gap-4 text-xs"
                >
                  {co.referenceImageUrl && (
                    <img
                      src={safeImage(co.referenceImageUrl)}
                      alt="Reference"
                      className="w-24 h-24 rounded-xl object-cover border border-[#EAD5C5] shrink-0"
                    />
                  )}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <span className="font-bold text-sm text-[#5B3A29]">
                        {co.customerName} • {co.phone}
                      </span>
                      <select
                        value={co.status}
                        onChange={(e) =>
                          updateCustomOrderStatus(
                            co.id,
                            e.target.value as CustomOrderRequest['status']
                          )
                        }
                        className="px-2.5 py-1 rounded-xl border border-[#EAD5C5] bg-white font-semibold"
                      >
                        <option value="submitted">Submitted</option>
                        <option value="reviewing">Reviewing</option>
                        <option value="accepted">Accepted</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </div>
                    <p className="text-[#55504C]">
                      <strong>Specs:</strong> {co.category} • {co.colorPreference} • {co.size} •
                      Budget {co.budget}
                    </p>
                    <p className="italic text-[#2E2E2E]">"{co.message}"</p>
                    <div className="flex flex-wrap gap-2 pt-1">
                      <input
                        type="number"
                        placeholder="Quoted Price ₹"
                        value={quoteDrafts[co.id] ?? (co.quotedPrice ? String(co.quotedPrice) : '')}
                        onChange={(e) =>
                          setQuoteDrafts({ ...quoteDrafts, [co.id]: e.target.value })
                        }
                        className="px-2.5 py-1.5 rounded-xl border border-[#EAD5C5] bg-white w-36"
                      />
                      <input
                        type="text"
                        placeholder="Internal studio note..."
                        value={noteDrafts[co.id] ?? co.adminNotes ?? ''}
                        onChange={(e) => setNoteDrafts({ ...noteDrafts, [co.id]: e.target.value })}
                        className="px-2.5 py-1.5 rounded-xl border border-[#EAD5C5] bg-white flex-1 min-w-[200px]"
                      />
                      <button
                        onClick={() =>
                          updateCustomOrderStatus(co.id, co.status, {
                            quotedPrice: quoteDrafts[co.id]
                              ? Number(quoteDrafts[co.id])
                              : co.quotedPrice,
                            adminNotes: noteDrafts[co.id] ?? co.adminNotes
                          })
                        }
                        className="px-3.5 py-1.5 rounded-xl bg-[#5B3A29] text-white font-semibold"
                      >
                        Save Quote & Note
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SECTION F: REVIEWS MODERATION */}
      {section === 'reviews' && (
        <div className="bg-white rounded-3xl border border-[#EAD5C5] p-6 space-y-4">
          <h2 className="font-heading text-xl font-bold text-[#5B3A29]">
            Customer Reviews Moderation ({feedbacks.length})
          </h2>
          <div className="space-y-4">
            {feedbacks.map((fb) => (
              <div
                key={fb.id}
                className="p-4 rounded-2xl border border-[#EAD5C5] bg-[#FDF9F4] space-y-2 text-xs"
              >
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <span className="font-bold text-[#5B3A29]">{fb.customerName}</span> on{' '}
                    <strong>{fb.productName}</strong> ({fb.rating}★)
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleFeedbackApproval(fb.id, fb.isApproved === false)}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        fb.isApproved !== false
                          ? 'bg-[#E8F0DC] text-[#4A5D1E]'
                          : 'bg-gray-200 text-gray-700'
                      }`}
                    >
                      {fb.isApproved !== false ? 'Published' : 'Hidden'}
                    </button>
                    <button
                      onClick={() => deleteFeedback(fb.id)}
                      className="p-1.5 rounded-lg border border-red-200 text-red-700"
                      title="Delete review"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <p className="text-[#2E2E2E]">{fb.comment}</p>
                {fb.artisanResponse && (
                  <p className="italic text-[#708238]">
                    Replied: "{fb.artisanResponse.text}"
                  </p>
                )}
                <div className="flex gap-2 pt-1">
                  <input
                    type="text"
                    placeholder="Write artisan response..."
                    value={replyDrafts[fb.id] || ''}
                    onChange={(e) => setReplyDrafts({ ...replyDrafts, [fb.id]: e.target.value })}
                    className="flex-1 px-3 py-1.5 rounded-xl border border-[#EAD5C5] bg-white"
                  />
                  <button
                    onClick={() => {
                      if (!replyDrafts[fb.id]?.trim()) return;
                      replyToFeedback(fb.id, replyDrafts[fb.id].trim());
                      setReplyDrafts({ ...replyDrafts, [fb.id]: '' });
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-[#5B3A29] text-white font-semibold"
                  >
                    Post Reply
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION G: SETTINGS & COUPONS */}
      {section === 'settings' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Store Settings */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              updateStoreSettings(settingsForm);
            }}
            className="bg-white rounded-3xl border border-[#EAD5C5] p-6 space-y-4 text-xs"
          >
            <h2 className="font-heading text-xl font-bold text-[#5B3A29]">
              Store & Delivery Configuration
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold mb-1">Standard Delivery Fee (₹)</label>
                <input
                  type="number"
                  value={settingsForm.standardShippingFee}
                  onChange={(e) =>
                    setSettingsForm({
                      ...settingsForm,
                      standardShippingFee: Number(e.target.value)
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-[#EAD5C5]"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Free Shipping Over (₹)</label>
                <input
                  type="number"
                  value={settingsForm.freeShippingThreshold}
                  onChange={(e) =>
                    setSettingsForm({
                      ...settingsForm,
                      freeShippingThreshold: Number(e.target.value)
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-[#EAD5C5]"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">COD Fee (₹)</label>
                <input
                  type="number"
                  value={settingsForm.codFee}
                  onChange={(e) =>
                    setSettingsForm({ ...settingsForm, codFee: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-[#EAD5C5]"
                />
              </div>
              <div className="flex items-end pb-2">
                <label className="flex items-center gap-2 font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settingsForm.codEnabled}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, codEnabled: e.target.checked })
                    }
                    className="accent-[#5B3A29]"
                  />
                  <span>Enable Cash on Delivery (COD)</span>
                </label>
              </div>
              <div>
                <label className="block font-semibold mb-1">UPI ID (VPA)</label>
                <input
                  type="text"
                  value={settingsForm.upiId}
                  onChange={(e) => setSettingsForm({ ...settingsForm, upiId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-[#EAD5C5]"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">UPI Payee Name</label>
                <input
                  type="text"
                  value={settingsForm.upiPayeeName}
                  onChange={(e) =>
                    setSettingsForm({ ...settingsForm, upiPayeeName: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-[#EAD5C5]"
                />
              </div>
            </div>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-full bg-[#5B3A29] text-white font-semibold"
            >
              Save Store Settings
            </button>
          </form>

          {/* Coupons */}
          <div className="bg-white rounded-3xl border border-[#EAD5C5] p-6 space-y-4 text-xs">
            <h2 className="font-heading text-xl font-bold text-[#5B3A29]">
              Promo Coupons ({coupons.length})
            </h2>
            <form onSubmit={handleCreateCoupon} className="grid grid-cols-2 gap-2.5">
              <input
                type="text"
                required
                placeholder="Code (e.g. ROSE15)"
                value={newCouponCode}
                onChange={(e) => setNewCouponCode(e.target.value.toUpperCase())}
                className="px-3 py-2 rounded-xl border border-[#EAD5C5] uppercase"
              />
              <input
                type="number"
                placeholder="Discount %"
                value={newCouponDiscount}
                onChange={(e) => setNewCouponDiscount(e.target.value)}
                className="px-3 py-2 rounded-xl border border-[#EAD5C5]"
              />
              <input
                type="number"
                placeholder="Min Order ₹"
                value={newCouponMin}
                onChange={(e) => setNewCouponMin(e.target.value)}
                className="px-3 py-2 rounded-xl border border-[#EAD5C5]"
              />
              <input
                type="number"
                placeholder="Max Discount ₹"
                value={newCouponMaxDisc}
                onChange={(e) => setNewCouponMaxDisc(e.target.value)}
                className="px-3 py-2 rounded-xl border border-[#EAD5C5]"
              />
              <input
                type="number"
                placeholder="Max Uses (optional)"
                value={newCouponMaxUses}
                onChange={(e) => setNewCouponMaxUses(e.target.value)}
                className="px-3 py-2 rounded-xl border border-[#EAD5C5]"
              />
              <input
                type="date"
                value={newCouponExpires}
                onChange={(e) => setNewCouponExpires(e.target.value)}
                className="px-3 py-2 rounded-xl border border-[#EAD5C5]"
              />
              <input
                type="text"
                placeholder="Description"
                value={newCouponDesc}
                onChange={(e) => setNewCouponDesc(e.target.value)}
                className="col-span-2 px-3 py-2 rounded-xl border border-[#EAD5C5]"
              />
              <button
                type="submit"
                className="col-span-2 py-2.5 rounded-full bg-[#5B3A29] text-white font-semibold"
              >
                Create Coupon
              </button>
            </form>

            <div className="space-y-2 pt-2 border-t border-[#F0DFD1]">
              {coupons.map((c) => (
                <div
                  key={c.code}
                  className="p-2.5 rounded-xl bg-[#FDF9F4] border border-[#EAD5C5] flex items-center justify-between"
                >
                  <div>
                    <div className="flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-[#708238]" />
                      <strong className="font-mono">{c.code}</strong>
                      <span>({c.discountPercent}% off</span>
                      <span>min ₹{c.minOrderAmount})</span>
                    </div>
                    <span className="text-[10px] text-[#6E6863]">
                      Uses: {c.usedCount || 0}
                      {c.maxUses ? `/${c.maxUses}` : ''}
                      {c.expiresAt ? ` • Exp: ${new Date(c.expiresAt).toLocaleDateString()}` : ''}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateCoupon({ ...c, isActive: !c.isActive })}
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        c.isActive ? 'bg-[#E8F0DC] text-[#4A5D1E]' : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      {c.isActive ? 'Active' : 'Paused'}
                    </button>
                    <button
                      onClick={() => deleteCoupon(c.code)}
                      className="text-red-700 hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* PRODUCT CREATE / EDIT MODAL */}
      {isProductFormOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-[#EAD5C5] max-w-xl w-full p-6 space-y-4 my-auto max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="font-heading text-xl font-bold text-[#5B3A29]">
                {editingProduct ? 'Edit Product' : 'Add New Crochet Piece'}
              </h3>
              <button onClick={() => setIsProductFormOpen(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-semibold mb-1">Product Name *</label>
                  <input
                    type="text"
                    required
                    value={prodName}
                    onChange={(e) => setProdName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#EAD5C5]"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-semibold mb-1">Tagline</label>
                  <input
                    type="text"
                    value={prodTagline}
                    onChange={(e) => setProdTagline(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#EAD5C5]"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Selling Price (₹) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={prodPrice}
                    onChange={(e) => setProdPrice(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#EAD5C5]"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Original MRP (₹)</label>
                  <input
                    type="number"
                    value={prodOrigPrice}
                    onChange={(e) => setProdOrigPrice(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#EAD5C5]"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Category</label>
                  <select
                    value={prodCategory}
                    onChange={(e) => setProdCategory(e.target.value as ProductCategory)}
                    className="w-full px-3 py-2 rounded-xl border border-[#EAD5C5]"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Stock Quantity *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={prodStock}
                    onChange={(e) => setProdStock(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#EAD5C5]"
                  />
                </div>
              </div>

              {/* Supabase Storage Image Uploader */}
              <div className="space-y-2 pt-1">
                <label className="block font-semibold">
                  Product Photos (Uploaded to Supabase Storage)
                </label>
                <div className="flex flex-wrap gap-2">
                  {prodImages.map((imgUrl, i) => (
                    <div key={i} className="relative w-16 h-16 rounded-xl overflow-hidden border border-[#EAD5C5]">
                      <img src={imgUrl} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemoveProductImage(imgUrl)}
                        className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-black/70 text-white text-[10px] flex items-center justify-center"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  <label className="w-16 h-16 rounded-xl border-2 border-dashed border-[#EAD5C5] flex flex-col items-center justify-center cursor-pointer hover:bg-[#FFF8F0]">
                    <Upload className="w-4 h-4 text-[#5B3A29]" />
                    <span className="text-[9px] mt-0.5">{isUploadingImage ? '...' : 'Upload'}</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleUploadProductImage}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Description</label>
                <textarea
                  rows={3}
                  value={prodDesc}
                  onChange={(e) => setProdDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#EAD5C5]"
                />
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={prodActive}
                    onChange={(e) => setProdActive(e.target.checked)}
                    className="accent-[#5B3A29]"
                  />
                  <span>Active on Storefront</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={prodBestSeller}
                    onChange={(e) => setProdBestSeller(e.target.checked)}
                    className="accent-[#5B3A29]"
                  />
                  <span>Best Seller Badge</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsProductFormOpen(false)}
                  className="px-4 py-2 rounded-full border border-[#EAD5C5]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-full bg-[#5B3A29] text-white font-semibold"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
