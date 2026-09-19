import React, { useState, useRef } from 'react';
import { useStore } from '../context/StoreContext';
import { Product, Order, OrderTrackingStatus, Coupon } from '../types';
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Sparkles,
  Tag,
  Settings,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Truck,
  IndianRupee,
  Users,
  Search,
  MessageCircle,
  ExternalLink,
  X,
  Star,
  MessageSquare,
  ShieldCheck,
  UploadCloud,
  Image as ImageIcon,
  Camera,
  Lock,
  Eye,
  EyeOff,
  KeyRound,
  LogOut,
  ArrowLeft,
  Check,
  Database,
  Copy,
  RefreshCw,
  AlertCircle,
  Terminal,
  CheckSquare
} from 'lucide-react';
import { motion } from 'motion/react';
import {
  SUPABASE_SQL_SCHEMA,
  SUPABASE_URL,
  testSupabaseHealth,
  SupabaseHealthStatus
} from '../lib/supabase';

export const AdminDashboard: React.FC = () => {
  const {
    products,
    orders,
    customOrders,
    coupons,
    feedbacks,
    replyToFeedback,
    storeSettings,
    updateStoreSettings,
    updateOrderStatus,
    addProduct,
    updateProduct,
    deleteProduct,
    addCoupon,
    deleteCoupon,
    showToast,
    isAdmin,
    setIsAdmin,
    setActiveTab: setStoreActiveTab
  } = useStore();

  // Admin Passcode Gate State
  const [passcodeInput, setPasscodeInput] = useState('');
  const [showPasscode, setShowPasscode] = useState(false);
  const [passcodeError, setPasscodeError] = useState('');

  const [activeTab, setActiveTab] = useState<
    'overview' | 'products' | 'orders' | 'custom' | 'coupons' | 'feedbacks' | 'settings' | 'database'
  >('overview');

  // Supabase Database Health & Schema State
  const [supabaseHealth, setSupabaseHealth] = useState<SupabaseHealthStatus | null>(null);
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);
  const [copiedSchema, setCopiedSchema] = useState(false);

  // Feedbacks management state
  const [feedbackSearchQuery, setFeedbackSearchQuery] = useState('');
  const [feedbackRatingFilter, setFeedbackRatingFilter] = useState<'all' | number>('all');
  const [replyInputs, setReplyInputs] = useState<Record<string, string>>({});

  // Product Add / Edit Modal State
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState<Partial<Product>>({
    name: '',
    category: 'Hair Accessories',
    price: 99,
    originalPrice: 149,
    stock: 25,
    images: ['https://images.unsplash.com/photo-1584992236310-6edddc08acff?w=600&auto=format&fit=crop&q=80'],
    description: '',
    yarnType: '100% Organic Milk Cotton Yarn',
    careInstructions: 'Gentle hand wash in cold water with mild detergent.',
    tagline: 'Handmade with gentle touch',
    tags: ['crochet', 'handmade']
  });

  // Coupon modal state
  const [newCouponCode, setNewCouponCode] = useState('');
  const [newCouponDiscount, setNewCouponDiscount] = useState(10);
  const [newCouponMinOrder, setNewCouponMinOrder] = useState(200);

  // Settings form state
  const [settingsForm, setSettingsForm] = useState(storeSettings);

  // Analytics Metrics
  const totalRevenue = orders.reduce((sum, ord) => sum + ord.total, 0);
  const totalOrdersCount = orders.length;
  const lowStockProducts = products.filter((p) => p.stock <= 5);
  const pendingOrdersCount = orders.filter((o) => o.trackingStatus !== 'delivered').length;

  const handleOpenNewProduct = () => {
    setEditingProduct(null);
    setProductForm({
      name: '',
      category: 'Hair Accessories',
      price: 120,
      originalPrice: 180,
      stock: 20,
      images: ['https://images.unsplash.com/photo-1584992236310-6edddc08acff?w=600&auto=format&fit=crop&q=80'],
      description: 'Artisanal crochet piece woven with soft organic cotton yarn.',
      yarnType: '100% Milk Cotton Yarn',
      careInstructions: 'Spot clean or hand wash gently in cold water.',
      tagline: 'Handmade with love',
      tags: ['crochet', 'handmade']
    });
    setIsProductModalOpen(true);
  };

  const handleOpenEditProduct = (prod: Product) => {
    setEditingProduct(prod);
    setProductForm({ ...prod });
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.name || !productForm.price) return;

    if (editingProduct) {
      updateProduct(editingProduct.id, productForm);
      showToast(`Updated product "${productForm.name}"`);
    } else {
      addProduct({
        name: productForm.name!,
        category: productForm.category as any,
        price: Number(productForm.price),
        originalPrice: productForm.originalPrice ? Number(productForm.originalPrice) : undefined,
        stock: Number(productForm.stock || 10),
        images: productForm.images?.length
          ? productForm.images
          : ['https://images.unsplash.com/photo-1584992236310-6edddc08acff?w=600&auto=format&fit=crop&q=80'],
        description: productForm.description || '',
        yarnType: productForm.yarnType || '100% Organic Milk Cotton',
        careInstructions: productForm.careInstructions || 'Hand wash cold.',
        tagline: productForm.tagline || 'Handmade treasure',
        rating: 5.0,
        reviewsCount: 1,
        colors: [{ name: 'Pastel Pink', hex: '#F8D7DA' }, { name: 'Sage Green', hex: '#708238' }],
        tags: productForm.tags || ['handmade', 'crochet'],
        isBestSeller: false,
        isNewArrival: true
      });
      showToast(`Added new product "${productForm.name}" 🌸`);
    }
    setIsProductModalOpen(false);
  };

  // Image Uploading States & Handlers for Products
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [manualUrlInput, setManualUrlInput] = useState('');

  const handleImageFiles = (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    let loadedCount = 0;
    const newImages: string[] = [];

    fileArray.forEach((file) => {
      if (!file.type.startsWith('image/')) {
        showToast(`"${file.name}" is not an image file`, 'error');
        return;
      }
      if (file.size > 15 * 1024 * 1024) {
        showToast(`"${file.name}" is too large (max 15MB)`, 'error');
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (result) {
          newImages.push(result);
        }
        loadedCount++;
        if (loadedCount === fileArray.length) {
          setProductForm((prev) => {
            const current = prev.images || [];
            // If the only image is the default placeholder, replace it with the uploaded photo
            const isDefaultPlaceholder =
              current.length === 1 &&
              current[0].includes('unsplash.com/photo-1584992236310-6edddc08acff');
            const baseImages = isDefaultPlaceholder ? [] : current;
            return {
              ...prev,
              images: [...baseImages, ...newImages]
            };
          });
          showToast(`Uploaded ${newImages.length} photo(s) to product!`);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleAddUrlImage = () => {
    if (!manualUrlInput.trim()) return;
    setProductForm((prev) => {
      const current = prev.images || [];
      const isDefaultPlaceholder =
        current.length === 1 &&
        current[0].includes('unsplash.com/photo-1584992236310-6edddc08acff');
      const baseImages = isDefaultPlaceholder ? [] : current;
      return {
        ...prev,
        images: [...baseImages, manualUrlInput.trim()]
      };
    });
    setManualUrlInput('');
    showToast('Image URL added to gallery');
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setProductForm((prev) => ({
      ...prev,
      images: (prev.images || []).filter((_, idx) => idx !== indexToRemove)
    }));
  };

  const handleSetCoverImage = (indexToPromote: number) => {
    setProductForm((prev) => {
      const imgs = [...(prev.images || [])];
      const [promoted] = imgs.splice(indexToPromote, 1);
      return {
        ...prev,
        images: [promoted, ...imgs]
      };
    });
    showToast('Set as main cover photo');
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanInput = passcodeInput.trim().toLowerCase();
    const validPasscodes = ['dreamqueen2025', 'dq2025', 'admin123', '8097706536', 'ayesha2025'];
    if (validPasscodes.includes(cleanInput)) {
      setIsAdmin(true);
      setPasscodeError('');
      setPasscodeInput('');
      showToast('Admin access granted! Welcome, Ayesha 🌸');
    } else {
      setPasscodeError('Incorrect passcode. Access is restricted to authorized workshop staff.');
    }
  };

  const handleAdminLogout = () => {
    setIsAdmin(false);
    setStoreActiveTab('home');
    showToast('Logged out of Admin Portal');
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateStoreSettings(settingsForm);
    showToast('Store settings & payment parameters updated!');
  };

  const handleCreateCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCouponCode) return;
    addCoupon({
      code: newCouponCode.toUpperCase(),
      discountPercent: Number(newCouponDiscount),
      minOrderAmount: Number(newCouponMinOrder),
      description: `${newCouponDiscount}% off on orders above ₹${newCouponMinOrder}`
    });
    setNewCouponCode('');
    showToast(`Created coupon code "${newCouponCode.toUpperCase()}"!`);
  };

  const checkSupabase = async () => {
    setIsCheckingHealth(true);
    try {
      const health = await testSupabaseHealth();
      setSupabaseHealth(health);
      if (health.connected) {
        const allPresent =
          health.tables.orders &&
          health.tables.custom_orders &&
          health.tables.feedbacks &&
          health.tables.products;
        if (allPresent) {
          showToast('All 4 Supabase database tables are active and connected! 🎉');
        } else {
          showToast('Supabase connected, but some tables are missing.', 'error');
        }
      } else {
        showToast(health.message || 'Could not reach Supabase endpoint', 'error');
      }
    } catch (e: any) {
      showToast(e?.message || 'Database test failed', 'error');
    } finally {
      setIsCheckingHealth(false);
    }
  };

  const handleCopySchema = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setCopiedSchema(true);
    showToast('SQL schema copied to clipboard! Paste it in Supabase SQL editor.');
    setTimeout(() => setCopiedSchema(false), 4000);
  };

  // RESTRICTED GATE: If not logged in as Admin, show Passcode Lock
  if (!isAdmin) {
    return (
      <div className="py-16 max-w-md mx-auto px-4">
        <div className="bg-white rounded-3xl border border-[#EAD5C5] shadow-xl p-8 text-center space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-[#E8F0DC] border border-[#D5E2C4] flex items-center justify-center mx-auto text-[#4A5D1E] shadow-xs">
            <Lock className="w-8 h-8" />
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#708238] bg-[#E8F0DC] px-3 py-1 rounded-full border border-[#D5E2C4]">
              Artisan Atelier Only
            </span>
            <h2 className="font-heading text-2xl font-bold text-[#5B3A29] mt-3">
              Admin Access Gate
            </h2>
            <p className="text-xs text-[#6E6863] mt-1.5 leading-relaxed">
              This management workspace is strictly restricted to DreamQueen boutique administrators. Please enter your studio master passcode to continue.
            </p>
          </div>

          <form onSubmit={handleAdminLogin} className="space-y-4 text-left">
            <div>
              <label className="block text-xs font-semibold text-[#55504C] mb-1.5">
                Master Studio Passcode
              </label>
              <div className="relative">
                <input
                  type={showPasscode ? 'text' : 'password'}
                  required
                  placeholder="Enter studio passcode..."
                  value={passcodeInput}
                  onChange={(e) => {
                    setPasscodeInput(e.target.value);
                    setPasscodeError('');
                  }}
                  className={`w-full pl-10 pr-10 py-3 rounded-2xl text-xs border ${
                    passcodeError ? 'border-red-400 bg-red-50/40' : 'border-[#EAD5C5] bg-[#FDF9F4]'
                  } focus:outline-hidden focus:ring-2 focus:ring-[#708238]/30`}
                />
                <KeyRound className="w-4 h-4 text-[#8C7A6B] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <button
                  type="button"
                  onClick={() => setShowPasscode(!showPasscode)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#5B3A29]"
                >
                  {showPasscode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {passcodeError && (
                <p className="text-[11px] text-red-600 mt-1.5 font-medium">{passcodeError}</p>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-2xl bg-[#5B3A29] text-white font-semibold text-xs hover:bg-[#43291B] transition shadow-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Unlock Admin Panel</span>
            </button>
          </form>

          <div className="pt-4 border-t border-[#F0DFD1] flex flex-col items-center gap-2">
            <button
              onClick={() => setStoreActiveTab('home')}
              className="text-xs text-[#708238] font-medium hover:underline flex items-center gap-1 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Customer Storefront</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Top Admin Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-[#EAD5C5] gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full bg-[#708238] text-white text-[10px] font-bold uppercase tracking-wider">
              Admin Portal
            </span>
            <span className="text-xs text-[#8C7A6B]">DreamQueen Artisan Atelier</span>
            <span className="text-[11px] bg-[#E8F0DC] text-[#4A5D1E] px-2 py-0.5 rounded-full font-medium border border-[#D5E2C4]">
              Authenticated: Ayesha Lukman Shaikh
            </span>
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-[#5B3A29] mt-1">
            Store Management Dashboard
          </h1>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setStoreActiveTab('home')}
            className="px-3.5 py-2 rounded-full border border-[#EAD5C5] bg-white hover:bg-[#FDF9F4] text-[#5B3A29] text-xs font-semibold shadow-xs flex items-center gap-1.5 transition"
            title="Switch to customer storefront"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Storefront</span>
          </button>
          <button
            onClick={handleOpenNewProduct}
            className="px-4 py-2 rounded-full bg-[#5B3A29] hover:bg-[#43291B] text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Crochet Piece</span>
          </button>
          <button
            onClick={handleAdminLogout}
            className="px-3 py-2 rounded-full border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold flex items-center gap-1.5 transition"
            title="Log out of admin mode"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Log Out</span>
          </button>
        </div>
      </div>

      {/* Admin Navigation Pills */}
      <div className="flex items-center gap-2 overflow-x-auto py-4 border-b border-[#F0DFD1] scrollbar-none">
        {[
          { id: 'overview', label: 'Overview & Stats', icon: LayoutDashboard },
          { id: 'orders', label: `Orders (${orders.length})`, icon: Package },
          { id: 'products', label: `Catalog (${products.length})`, icon: ShoppingBag },
          { id: 'custom', label: `Custom Inquiries (${customOrders.length})`, icon: Sparkles },
          { id: 'coupons', label: `Coupons (${coupons.length})`, icon: Tag },
          { id: 'feedbacks', label: `Purchased Item Reviews (${feedbacks.length})`, icon: Star },
          { id: 'settings', label: 'Store & Payments', icon: Settings },
          { id: 'database', label: 'Database & Supabase', icon: Database }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-2xl text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition ${
                activeTab === tab.id
                  ? 'bg-[#5B3A29] text-white shadow-xs'
                  : 'bg-white border border-[#EAD5C5] text-[#5B3A29] hover:bg-[#FFF8F0]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="py-6 space-y-8">
          {/* Key Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="p-5 rounded-3xl bg-white border border-[#EAD5C5] shadow-xs">
              <div className="flex justify-between items-center text-[#8C7A6B] text-xs font-semibold">
                <span>Total Revenue</span>
                <IndianRupee className="w-4 h-4 text-[#708238]" />
              </div>
              <p className="font-price text-3xl font-bold text-[#5B3A29] mt-2">
                ₹{totalRevenue}
              </p>
              <span className="text-[11px] text-[#708238] font-medium block mt-1">
                ↑ 18.5% from last week
              </span>
            </div>

            <div className="p-5 rounded-3xl bg-white border border-[#EAD5C5] shadow-xs">
              <div className="flex justify-between items-center text-[#8C7A6B] text-xs font-semibold">
                <span>Total Orders</span>
                <Package className="w-4 h-4 text-[#5B3A29]" />
              </div>
              <p className="font-price text-3xl font-bold text-[#2E2E2E] mt-2">
                {totalOrdersCount}
              </p>
              <span className="text-[11px] text-[#6E6863] font-medium block mt-1">
                {pendingOrdersCount} orders currently in fulfillment
              </span>
            </div>

            <div className="p-5 rounded-3xl bg-white border border-[#EAD5C5] shadow-xs">
              <div className="flex justify-between items-center text-[#8C7A6B] text-xs font-semibold">
                <span>Custom Inquiries</span>
                <Sparkles className="w-4 h-4 text-[#D4A017]" />
              </div>
              <p className="font-price text-3xl font-bold text-[#D4A017] mt-2">
                {customOrders.length}
              </p>
              <span className="text-[11px] text-[#708238] font-medium block mt-1">
                Bespoke artisan commissions
              </span>
            </div>

            <div className="p-5 rounded-3xl bg-white border border-[#EAD5C5] shadow-xs">
              <div className="flex justify-between items-center text-[#8C7A6B] text-xs font-semibold">
                <span>Catalog Items</span>
                <ShoppingBag className="w-4 h-4 text-[#8B4052]" />
              </div>
              <p className="font-price text-3xl font-bold text-[#8B4052] mt-2">
                {products.length}
              </p>
              <span className="text-[11px] text-[#8C7A6B] font-medium block mt-1">
                {lowStockProducts.length} low stock alerts
              </span>
            </div>
          </div>

          {/* Low Stock Warning Banner if any */}
          {lowStockProducts.length > 0 && (
            <div className="p-4 rounded-2xl bg-[#FFF3A8]/60 border border-[#FFE26F] flex items-center justify-between text-xs text-[#855D00]">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-[#D4A017]" />
                <span>
                  <strong>Low Stock Alert:</strong> {lowStockProducts.map((p) => p.name).join(', ')} are running low on yarn stock!
                </span>
              </div>
              <button
                onClick={() => setActiveTab('products')}
                className="underline font-bold text-[#5B3A29]"
              >
                Refill Inventory
              </button>
            </div>
          )}

          {/* Recent Orders in Overview */}
          <div className="bg-white rounded-3xl border border-[#EAD5C5] p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-heading text-lg font-bold text-[#5B3A29]">
                Recent Orders Stream
              </h3>
              <button
                onClick={() => setActiveTab('orders')}
                className="text-xs font-semibold text-[#708238] hover:underline"
              >
                View all orders →
              </button>
            </div>

            <div className="divide-y divide-[#F0DFD1]">
              {orders.slice(0, 4).map((ord) => (
                <div key={ord.id} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-[#5B3A29] mr-2">{ord.orderNumber}</span>
                    <span className="text-[#6E6863]">{ord.customer.name}</span>
                    <span className="text-[11px] text-[#8C7A6B] block">
                      {ord.items.length} item(s) • {ord.paymentMethod.toUpperCase()}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-price font-bold text-sm text-[#2E2E2E]">₹{ord.total}</span>
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                        ord.trackingStatus === 'delivered'
                          ? 'bg-[#E8F0DC] text-[#4A5D1E]'
                          : 'bg-[#FFF3A8] text-[#855D00]'
                      }`}
                    >
                      {ord.trackingStatus}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB: ORDERS MANAGEMENT */}
      {activeTab === 'orders' && (
        <div className="py-6 space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="font-heading text-xl font-bold text-[#5B3A29]">
                Customer Orders & Shiprocket Fulfillment
              </h2>
              <p className="text-xs text-[#6E6863]">
                Manage fulfillment stages, update Shiprocket tracking numbers, and view customer notes.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {orders.map((ord) => (
              <div
                key={ord.id}
                className="bg-white rounded-3xl border border-[#EAD5C5] p-5 shadow-xs space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#F0DFD1] gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-heading text-lg font-bold text-[#5B3A29]">
                        {ord.orderNumber}
                      </span>
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#F8D7DA] text-[#842029]">
                        {ord.paymentMethod.toUpperCase()} ({ord.paymentStatus.toUpperCase()})
                      </span>
                    </div>
                    <p className="text-xs text-[#6E6863]">
                      Customer: <strong>{ord.customer.name}</strong> • Phone: {ord.customer.phone} • City:{' '}
                      {ord.shippingAddress.city}
                    </p>
                    <div className="mt-2 rounded-lg bg-[#F8F5F1] p-3">
                      <p className="text-xs font-semibold text-[#4A4541]">
                         📍 Delivery Address
                         </p>

                       <p className="mt-1 text-sm text-[#6E6863]">
                          {ord.shippingAddress?.addressLine1}
                          {ord.shippingAddress?.addressLine2 && (
                              <>
                           , {ord.shippingAddress.addressLine2}
                             </>
                             )}
                             {ord.shippingAddress?.city && (
      <>
        , {ord.shippingAddress.city}
      </>
    )}
    {ord.shippingAddress?.state && (
      <>
        , {ord.shippingAddress.state}
      </>
    )}
    {ord.shippingAddress?.pincode && (
      <>
        - {ord.shippingAddress.pincode}
      </>
    )}
  </p>
</div>
                  </div>

                  {/* Status Dropdown */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[#8C7A6B]">Status:</span>
                    <select
                      value={ord.trackingStatus}
                      onChange={(e) =>
                        updateOrderStatus(ord.id, e.target.value as OrderTrackingStatus)
                      }
                      className="px-3 py-1.5 text-xs rounded-xl border border-[#EAD5C5] bg-[#FFF8F0] font-bold text-[#5B3A29] focus:outline-none"
                    >
                      <option value="pending">Pending</option>
                      <option value="preparing">Preparing (Crocheting)</option>
                      <option value="packed">Packed with Love</option>
                      <option value="shipped">Shipped (Shiprocket)</option>
                      <option value="out_for_delivery">Out for Delivery</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>

                {/* Items & Financials */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div className="sm:col-span-2 space-y-2">
                    <span className="font-bold text-[#8C7A6B] block uppercase text-[10px]">
                      Items in Package:
                    </span>
                    {ord.items.map((it, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <img
                          src={it.image}
                          alt={it.productName}
                          className="w-7 h-7 rounded-md object-cover"
                        />
                        <span className="text-[#2E2E2E]">
                          {it.productName} ({it.color.name}) × {it.quantity}
                        </span>
                        <span className="text-[#8C7A6B] font-price">₹{it.price * it.quantity}</span>
                      </div>
                    ))}
                  </div>

                  <div className="bg-[#FFF8F0] p-3 rounded-2xl border border-[#EAD5C5] space-y-1">
                    <div className="flex justify-between">
                      <span>Total:</span>
                      <strong className="font-price text-sm text-[#5B3A29]">₹{ord.total}</strong>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span>Shiprocket AWB:</span>
                      <span className="font-mono text-[#2E2E2E]">
                        {ord.shiprocketTrackingNumber || 'Pending'}
                      </span>
                    </div>
                    <div className="pt-2">
                      <a
                        href={`https://wa.me/${ord.customer.phone.replace(/[^0-9]/g, '')}?text=Hi%20${ord.customer.name},%20DreamQueen%20here!%20Your%20order%20${ord.orderNumber}%20status%20is%20${ord.trackingStatus}.`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#25D366] hover:underline"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>Send WhatsApp Update</span>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB: PRODUCTS MANAGEMENT */}
      {activeTab === 'products' && (
        <div className="py-6 space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="font-heading text-xl font-bold text-[#5B3A29]">
                Product Inventory & Catalog
              </h2>
              <p className="text-xs text-[#6E6863]">
                Manage prices, inventory counts, yarn specifications, and images.
              </p>
            </div>
            <button
                onClick={handleOpenNewProduct}
                className="px-4 py-2 rounded-full bg-[#5B3A29] text-white text-xs font-semibold flex items-center gap-1.5 hover:bg-[#43291B]"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Product</span>
            </button>
          </div>

          <div className="bg-white rounded-3xl border border-[#EAD5C5] overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FFF8F0] border-b border-[#EAD5C5] text-[#5B3A29] font-bold">
                <tr>
                  <th className="p-4">Item</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Price</th>
                  <th className="p-4">Stock</th>
                  <th className="p-4">Yarn Type</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0DFD1]">
                {products.map((prod) => (
                  <tr key={prod.id} className="hover:bg-[#FDF9F4]">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={prod.images[0]}
                          alt={prod.name}
                          className="w-10 h-10 rounded-xl object-cover border border-[#EAD5C5]"
                        />
                        <div>
                          <span className="font-bold text-[#2E2E2E] block">{prod.name}</span>
                          <span className="text-[10px] text-[#8C7A6B]">{prod.tagline}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 font-medium text-[#708238]">{prod.category}</td>
                    <td className="p-4 font-price font-bold text-[#5B3A29]">₹{prod.price}</td>
                    <td className="p-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          prod.stock <= 5
                            ? 'bg-red-100 text-red-700'
                            : 'bg-[#E8F0DC] text-[#4A5D1E]'
                        }`}
                      >
                        {prod.stock} left
                      </span>
                    </td>
                    <td className="p-4 text-[11px] text-[#6E6863] truncate max-w-xs">
                      {prod.yarnType}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEditProduct(prod)}
                          className="p-1.5 text-[#5B3A29] hover:bg-[#FFF8F0] rounded-lg"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => deleteProduct(prod.id)}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: CUSTOM ORDERS INQUIRIES */}
      {activeTab === 'custom' && (
        <div className="py-6 space-y-6">
          <div>
            <h2 className="font-heading text-xl font-bold text-[#5B3A29]">
              Custom Crochet Commissions
            </h2>
            <p className="text-xs text-[#6E6863]">
              Inquiries submitted through the bespoke custom order builder with customer vision and reference images.
            </p>
          </div>

          <div className="space-y-4">
            {customOrders.map((comm) => (
              <div
                key={comm.id}
                className="bg-white rounded-3xl border border-[#EAD5C5] p-5 shadow-xs space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#F0DFD1] gap-2">
                  <div>
                    <h3 className="font-heading text-base font-bold text-[#5B3A29]">
                      {comm.category} for {comm.customerName}
                    </h3>
                    <p className="text-xs text-[#6E6863]">
                      Phone: <strong>{comm.phone}</strong> • Target Budget: {comm.budget} • Delivery:{' '}
                      {comm.deliveryDatePreference}
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-[#E8F0DC] text-[#4A5D1E]">
                    {comm.status}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  {comm.referenceImageUrl && (
                    <div>
                      <span className="text-[10px] font-bold text-[#8C7A6B] block mb-1">
                        Inspiration Picture:
                      </span>
                      <img
                        src={comm.referenceImageUrl}
                        alt="Reference"
                        className="w-full h-32 object-cover rounded-xl border border-[#EAD5C5]"
                      />
                    </div>
                  )}

                  <div className="sm:col-span-2 space-y-2">
                    <div className="bg-[#FFF8F0] p-3 rounded-2xl border border-[#EAD5C5] space-y-1">
                      <span className="font-bold text-[#5B3A29] block">Artisan Note / Request:</span>
                      <p className="text-[#55504C]">{comm.message}</p>
                      <div className="pt-2 flex gap-4 text-[11px] text-[#8C7A6B]">
                        <span>Color: <strong>{comm.colorPreference}</strong></span>
                        <span>Size: <strong>{comm.size}</strong></span>
                      </div>
                    </div>

                    <a
                      href={`https://wa.me/${comm.phone.replace(/[^0-9]/g, '')}?text=Hi%20${comm.customerName},%20this%20is%20DreamQueen%20regarding%20your%20custom%20crochet%20request!`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#25D366] text-white text-xs font-semibold hover:bg-[#1EBE5D] transition"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>Chat with Client on WhatsApp</span>
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB: COUPONS */}
      {activeTab === 'coupons' && (
        <div className="py-6 space-y-6">
          <div>
            <h2 className="font-heading text-xl font-bold text-[#5B3A29]">
              Promo Codes & Discount Coupons
            </h2>
            <p className="text-xs text-[#6E6863]">
              Generate marketing promotional codes (e.g. DREAM10, FREESHIP) for shoppers.
            </p>
          </div>

          {/* New coupon form */}
          <form
            onSubmit={handleCreateCoupon}
            className="bg-white p-5 rounded-3xl border border-[#EAD5C5] grid grid-cols-1 sm:grid-cols-4 gap-3 items-end"
          >
            <div>
              <label className="block text-xs font-semibold text-[#55504C] mb-1">Coupon Code</label>
              <input
                type="text"
                required
                placeholder="e.g. CROCHET15"
                value={newCouponCode}
                onChange={(e) => setNewCouponCode(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 text-xs rounded-xl border border-[#EAD5C5] uppercase"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#55504C] mb-1">
                Discount Percent (%)
              </label>
              <input
                type="number"
                min={1}
                max={100}
                value={newCouponDiscount}
                onChange={(e) => setNewCouponDiscount(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs rounded-xl border border-[#EAD5C5]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#55504C] mb-1">
                Min Order Amount (₹)
              </label>
              <input
                type="number"
                value={newCouponMinOrder}
                onChange={(e) => setNewCouponMinOrder(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs rounded-xl border border-[#EAD5C5]"
              />
            </div>

            <button
              type="submit"
              className="py-2.5 px-4 rounded-xl bg-[#5B3A29] text-white text-xs font-semibold hover:bg-[#43291B] transition"
            >
              Add Coupon
            </button>
          </form>

          {/* Coupons List */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {coupons.map((c) => (
              <div
                key={c.code}
                className="bg-white p-4 rounded-2xl border border-[#EAD5C5] shadow-xs flex justify-between items-center text-xs"
              >
                <div>
                  <span className="font-mono text-sm font-bold text-[#5B3A29] block">
                    {c.code}
                  </span>
                  <span className="text-[#708238] font-semibold block">
                    {c.discountPercent}% Discount
                  </span>
                  <span className="text-[10px] text-[#8C7A6B]">
                    Min order: ₹{c.minOrderAmount}
                  </span>
                </div>
                <button
                  onClick={() => deleteCoupon(c.code)}
                  className="p-2 text-red-400 hover:text-red-600"
                  title="Delete Coupon"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB: STORE & PAYMENTS SETTINGS */}
      {activeTab === 'settings' && (
        <div className="py-6 max-w-2xl space-y-6">
          <div>
            <h2 className="font-heading text-xl font-bold text-[#5B3A29]">
              Store & Payment Configuration
            </h2>
            <p className="text-xs text-[#6E6863]">
              Configure Cash on Delivery settings, Free Shipping thresholds, and WhatsApp alerts.
            </p>
          </div>

          <form
            onSubmit={handleSaveSettings}
            className="bg-white p-6 rounded-3xl border border-[#EAD5C5] shadow-xs space-y-5"
          >
            <div>
              <label className="block text-xs font-semibold text-[#55504C] mb-1">
                Store Brand Name
              </label>
              <input
                type="text"
                value={settingsForm.storeName}
                onChange={(e) => setSettingsForm({ ...settingsForm, storeName: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-[#EAD5C5] bg-[#FDF9F4]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#55504C] mb-1">
                Brand Tagline
              </label>
              <input
                type="text"
                value={settingsForm.storeTagline}
                onChange={(e) =>
                  setSettingsForm({ ...settingsForm, storeTagline: e.target.value })
                }
                className="w-full px-3 py-2 text-xs rounded-xl border border-[#EAD5C5] bg-[#FDF9F4]"
              />
            </div>

            <div className="pt-3 border-t border-[#F0DFD1] space-y-3">
              <h4 className="text-xs font-bold text-[#5B3A29]">Payment Options</h4>

              <div className="p-3.5 rounded-2xl bg-[#FFF8F0] border border-[#EAD5C5] space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-[#2E2E2E] block">
                      India Post Payments Bank / UPI QR Code Scanner
                    </span>
                    <span className="text-[11px] text-[#6E6863]">
                      Direct payment to studio VPA with zero gateway fees
                    </span>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-[#E8F0DC] text-[#4A5D1E] text-xs font-bold">
                    Active & Verified
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#55504C] mb-1">
                      UPI ID (VPA)
                    </label>
                    <input
                      type="text"
                      value={settingsForm.upiId || '8097706536@postbank'}
                      onChange={(e) =>
                        setSettingsForm({ ...settingsForm, upiId: e.target.value })
                      }
                      className="w-full px-3 py-1.5 text-xs rounded-xl border border-[#EAD5C5] bg-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[#55504C] mb-1">
                      Payee Registered Name
                    </label>
                    <input
                      type="text"
                      value={settingsForm.upiPayeeName || 'AYESHA LUKMAN SHAIKH'}
                      onChange={(e) =>
                        setSettingsForm({ ...settingsForm, upiPayeeName: e.target.value })
                      }
                      className="w-full px-3 py-1.5 text-xs rounded-xl border border-[#EAD5C5] bg-white font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-[#FFF8F0] border border-[#EAD5C5]">
                <div>
                  <span className="text-xs font-bold text-[#2E2E2E] block">
                    Razorpay Online Gateway
                  </span>
                  <span className="text-[11px] text-[#6E6863]">
                    Instant UPI, Cards & Net Banking
                  </span>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-[#E8F0DC] text-[#4A5D1E] text-xs font-bold">
                  Active (Live)
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-[#FFF8F0] border border-[#EAD5C5]">
                <div>
                  <span className="text-xs font-bold text-[#2E2E2E] block">
                    Cash on Delivery (COD)
                  </span>
                  <span className="text-[11px] text-[#6E6863]">
                    Allow customers to pay cash at delivery
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={settingsForm.codEnabled}
                  onChange={(e) =>
                    setSettingsForm({ ...settingsForm, codEnabled: e.target.checked })
                  }
                  className="w-4 h-4 text-[#5B3A29] rounded"
                />
              </div>

              {settingsForm.codEnabled && (
                <div>
                  <label className="block text-xs font-semibold text-[#55504C] mb-1">
                    Cash on Delivery (COD) Extra Fee (₹)
                  </label>
                  <input
                    type="number"
                    value={settingsForm.codFee}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, codFee: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#EAD5C5] bg-[#FDF9F4]"
                  />
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-[#F0DFD1] space-y-3">
              <h4 className="text-xs font-bold text-[#5B3A29]">Contact & WhatsApp Notifications</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#55504C] mb-1">
                    Official WhatsApp Phone
                  </label>
                  <input
                    type="text"
                    value={settingsForm.whatsappNumber || '8097706536'}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, whatsappNumber: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#EAD5C5] bg-[#FDF9F4]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#55504C] mb-1">
                    Official Support Email
                  </label>
                  <input
                    type="email"
                    value={settingsForm.adminEmail || 'dreamqueen29@gmail.com'}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, adminEmail: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#EAD5C5] bg-[#FDF9F4]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#55504C] mb-1">
                  Official Pinterest URL
                </label>
                <input
                  type="url"
                  value={settingsForm.pinterestUrl || 'https://in.pinterest.com/ayeshalk2025/?actingBusinessId=1147221842487308120'}
                  onChange={(e) =>
                    setSettingsForm({ ...settingsForm, pinterestUrl: e.target.value })
                  }
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#EAD5C5] bg-[#FDF9F4] font-mono text-[11px]"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-[#F0DFD1] grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#55504C] mb-1">
                  Free Shipping Minimum (₹)
                </label>
                <input
                  type="number"
                  value={settingsForm.freeShippingThreshold}
                  onChange={(e) =>
                    setSettingsForm({
                      ...settingsForm,
                      freeShippingThreshold: Number(e.target.value)
                    })
                  }
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#EAD5C5] bg-[#FDF9F4]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#55504C] mb-1">
                  Standard 7-Day Shipping Fee (₹)
                </label>
                <input
                  type="number"
                  value={settingsForm.standardShippingFee}
                  onChange={(e) =>
                    setSettingsForm({
                      ...settingsForm,
                      standardShippingFee: Number(e.target.value)
                    })
                  }
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#EAD5C5] bg-[#FDF9F4]"
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                className="px-6 py-2.5 rounded-full bg-[#5B3A29] text-white text-xs font-semibold hover:bg-[#43291B] transition shadow-xs"
              >
                Save Settings
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB: PURCHASED ITEM FEEDBACKS */}
      {activeTab === 'feedbacks' && (
        <div className="py-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-heading text-xl font-bold text-[#5B3A29]">
                Customer Purchased Item Feedback & Reviews
              </h3>
              <p className="text-xs text-[#6E6863]">
                Manage verified buyer reviews, view product ratings, and post artisan replies.
              </p>
            </div>

            {/* Rating Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {(['all', 5, 4, 3, 2] as const).map((star) => (
                <button
                  key={star}
                  onClick={() => setFeedbackRatingFilter(star)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${
                    feedbackRatingFilter === star
                      ? 'bg-[#5B3A29] text-white'
                      : 'bg-white border border-[#EAD5C5] text-[#5B3A29] hover:bg-[#FFF8F0]'
                  }`}
                >
                  {star === 'all' ? 'All Reviews' : `${star} ★`}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-white border border-[#EAD5C5] shadow-2xs">
              <span className="text-xs text-[#8C7A6B] block">Total Verified Reviews</span>
              <span className="font-heading text-2xl font-bold text-[#5B3A29]">
                {feedbacks.length}
              </span>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-[#EAD5C5] shadow-2xs">
              <span className="text-xs text-[#8C7A6B] block">5-Star Reviews</span>
              <span className="font-heading text-2xl font-bold text-[#708238]">
                {feedbacks.filter((f) => f.rating === 5).length} ({feedbacks.length ? Math.round((feedbacks.filter((f) => f.rating === 5).length / feedbacks.length) * 100) : 100}%)
              </span>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-[#EAD5C5] shadow-2xs">
              <span className="text-xs text-[#8C7A6B] block">Replies Posted by Artisans</span>
              <span className="font-heading text-2xl font-bold text-[#8B4052]">
                {feedbacks.filter((f) => !!f.artisanResponse).length} / {feedbacks.length}
              </span>
            </div>
          </div>

          {/* Search bar */}
          <div className="relative max-w-md">
            <Search className="w-4 h-4 text-[#8C7A6B] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={feedbackSearchQuery}
              onChange={(e) => setFeedbackSearchQuery(e.target.value)}
              placeholder="Search by product, customer, or Order #DQ..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-[#EAD5C5] bg-white text-xs focus:outline-none focus:ring-1 focus:ring-[#5B3A29]"
            />
          </div>

          {/* Feedbacks List */}
          {(() => {
            const filteredFeedbacks = feedbacks.filter((fb) => {
              const matchesFilter =
                feedbackRatingFilter === 'all' || fb.rating === feedbackRatingFilter;
              const matchesSearch =
                feedbackSearchQuery.trim() === '' ||
                fb.productName.toLowerCase().includes(feedbackSearchQuery.toLowerCase()) ||
                fb.customerName.toLowerCase().includes(feedbackSearchQuery.toLowerCase()) ||
                fb.orderNumber.toLowerCase().includes(feedbackSearchQuery.toLowerCase()) ||
                fb.comment.toLowerCase().includes(feedbackSearchQuery.toLowerCase());
              return matchesFilter && matchesSearch;
            });

            if (filteredFeedbacks.length === 0) {
              return (
                <div className="p-8 text-center bg-white rounded-3xl border border-[#EAD5C5] text-xs text-[#8C7A6B]">
                  No customer reviews match your filter.
                </div>
              );
            }

            return (
              <div className="space-y-4">
                {filteredFeedbacks.map((fb) => {
                  const replyText =
                    replyInputs[fb.id] !== undefined
                      ? replyInputs[fb.id]
                      : fb.artisanResponse?.text || '';

                  return (
                    <div
                      key={fb.id}
                      className="bg-white rounded-3xl border border-[#EAD5C5] p-5 sm:p-6 shadow-2xs space-y-4"
                    >
                      {/* Top Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#F0DFD1]">
                        <div className="flex items-center gap-3">
                          {fb.productImage && (
                            <img
                              src={fb.productImage}
                              alt={fb.productName}
                              className="w-12 h-12 rounded-xl object-cover border border-[#EAD5C5]"
                            />
                          )}
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-heading text-sm font-bold text-[#2E2E2E]">
                                {fb.productName}
                              </h4>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E8F0DC] text-[#4A5D1E] flex items-center gap-1">
                                <ShieldCheck className="w-3 h-3" />
                                <span>Verified Order #{fb.orderNumber}</span>
                              </span>
                            </div>
                            <p className="text-[11px] text-[#8C7A6B]">
                              Customer: <span className="font-semibold text-[#5B3A29]">{fb.customerName}</span> ({fb.customerEmail})
                              {fb.selectedColor && ` • Color: ${fb.selectedColor.name}`}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-start sm:self-auto">
                          <div className="flex items-center text-[#D4A017]">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${
                                  i < fb.rating ? 'fill-[#D4A017]' : 'text-gray-200'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-xs text-[#8C7A6B]">
                            {new Date(fb.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      {/* Headline and text */}
                      <div className="space-y-1">
                        {fb.headline && (
                          <h5 className="font-heading text-xs sm:text-sm font-bold text-[#5B3A29]">
                            "{fb.headline}"
                          </h5>
                        )}
                        <p className="text-xs sm:text-sm text-[#4A4540] leading-relaxed">
                          {fb.comment}
                        </p>
                      </div>

                      {/* Tags & photo */}
                      <div className="space-y-2">
                        {fb.tags && fb.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {fb.tags.map((tg, i) => (
                              <span
                                key={i}
                                className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#FFF8F0] text-[#5B3A29] border border-[#EAD5C5]"
                              >
                                {tg}
                              </span>
                            ))}
                          </div>
                        )}

                        {fb.photoUrl && (
                          <div className="pt-1 flex items-center gap-2">
                            <span className="text-[11px] text-[#8C7A6B]">Customer Photo:</span>
                            <img
                              src={fb.photoUrl}
                              alt="Customer upload"
                              className="w-16 h-16 rounded-xl object-cover border border-[#EAD5C5]"
                            />
                          </div>
                        )}
                      </div>

                      {/* Artisan Response Area */}
                      <div className="p-4 rounded-2xl bg-[#FFF8F0] border border-[#EAD5C5] space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-[#5B3A29] flex items-center gap-1.5">
                            <MessageSquare className="w-3.5 h-3.5 text-[#8B4052]" />
                            <span>
                              {fb.artisanResponse
                                ? `Artisan Response (${fb.artisanResponse.author})`
                                : 'Reply to Customer as Artisan Team'}
                            </span>
                          </span>
                          {fb.artisanResponse && (
                            <span className="text-[10px] text-[#708238] font-bold">
                              ✓ Published to Storefront
                            </span>
                          )}
                        </div>

                        <div className="flex flex-col sm:flex-row gap-2">
                          <input
                            type="text"
                            value={replyText}
                            onChange={(e) =>
                              setReplyInputs((prev) => ({
                                ...prev,
                                [fb.id]: e.target.value
                              }))
                            }
                            placeholder="e.g., Thank you so much! Our women artisans put so much love into this stitch 🌸"
                            className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-[#EAD5C5] bg-white focus:outline-none focus:ring-1 focus:ring-[#5B3A29]"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (!replyText.trim()) return;
                              replyToFeedback(fb.id, replyText.trim());
                            }}
                            className="px-4 py-2 rounded-xl bg-[#5B3A29] hover:bg-[#43291B] text-white text-xs font-semibold shrink-0 transition"
                          >
                            {fb.artisanResponse ? 'Update Reply' : 'Post Reply'}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      )}

      {/* TAB: DATABASE & SUPABASE SYNCHRONIZATION */}
      {activeTab === 'database' && (
        <div className="py-6 space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-[#E8F0DC] text-[#4A5D1E] text-[10px] font-bold uppercase tracking-wider border border-[#D5E2C4]">
                  Cloud Persistence
                </span>
                <span className="text-xs text-[#8C7A6B]">Supabase PostgreSQL</span>
              </div>
              <h3 className="font-heading text-xl sm:text-2xl font-bold text-[#5B3A29] mt-1">
                Supabase Database & Tables Setup
              </h3>
              <p className="text-xs text-[#6E6863] mt-0.5">
                Connect and sync orders, custom commissions, product catalog, and customer reviews to your cloud database.
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={checkSupabase}
                disabled={isCheckingHealth}
                className="px-4 py-2 rounded-xl bg-white border border-[#EAD5C5] text-[#5B3A29] hover:bg-[#FFF8F0] text-xs font-semibold flex items-center gap-2 transition shadow-2xs disabled:opacity-60 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-[#708238] ${isCheckingHealth ? 'animate-spin' : ''}`} />
                <span>{isCheckingHealth ? 'Checking...' : 'Test Tables & Ping'}</span>
              </button>
              <a
                href="https://supabase.com/dashboard/project/aosdiqpdpfmozuuogroz/sql"
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 rounded-xl bg-[#5B3A29] hover:bg-[#43291B] text-white text-xs font-semibold flex items-center gap-2 transition shadow-xs cursor-pointer"
              >
                <span>Open Supabase SQL Editor</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Explanation Alert Box */}
          <div className="bg-[#FFF8F0] border border-[#EAD5C5] rounded-3xl p-6 space-y-3">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-[#E8F0DC] border border-[#D5E2C4] flex items-center justify-center text-[#4A5D1E] shrink-0 mt-0.5">
                <Database className="w-5 h-5" />
              </div>
              <div className="space-y-1 text-xs">
                <h4 className="font-heading text-sm font-bold text-[#5B3A29]">
                  Why aren't tables showing in your Supabase dashboard yet?
                </h4>
                <p className="text-[#6E6863] leading-relaxed">
                  Supabase requires that initial database tables (<code className="bg-white px-1.5 py-0.5 rounded-md border border-[#EAD5C5] text-[#5B3A29] font-mono">orders</code>, <code className="bg-white px-1.5 py-0.5 rounded-md border border-[#EAD5C5] text-[#5B3A29] font-mono">custom_orders</code>, <code className="bg-white px-1.5 py-0.5 rounded-md border border-[#EAD5C5] text-[#5B3A29] font-mono">feedbacks</code>, and <code className="bg-white px-1.5 py-0.5 rounded-md border border-[#EAD5C5] text-[#5B3A29] font-mono">products</code>) be created by running a short SQL schema script in your Supabase dashboard. Because client-side web keys only have permission to read and insert data (not alter database schemas for security), running the script in the SQL editor creates all tables in 30 seconds!
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-[#F0DFD1]">
              <div className="bg-white p-3.5 rounded-2xl border border-[#EAD5C5] space-y-1">
                <span className="w-6 h-6 rounded-full bg-[#5B3A29] text-white text-[11px] font-bold flex items-center justify-center">1</span>
                <h5 className="font-bold text-xs text-[#5B3A29]">Copy Schema Script</h5>
                <p className="text-[11px] text-[#8C7A6B]">Click the "Copy SQL Schema" button below to copy the complete table script.</p>
              </div>
              <div className="bg-white p-3.5 rounded-2xl border border-[#EAD5C5] space-y-1">
                <span className="w-6 h-6 rounded-full bg-[#5B3A29] text-white text-[11px] font-bold flex items-center justify-center">2</span>
                <h5 className="font-bold text-xs text-[#5B3A29]">Open Supabase SQL Editor</h5>
                <p className="text-[11px] text-[#8C7A6B]">Go to your Supabase project dashboard, click "SQL Editor" in the left sidebar, and click "New Query".</p>
              </div>
              <div className="bg-white p-3.5 rounded-2xl border border-[#EAD5C5] space-y-1">
                <span className="w-6 h-6 rounded-full bg-[#5B3A29] text-white text-[11px] font-bold flex items-center justify-center">3</span>
                <h5 className="font-bold text-xs text-[#5B3A29]">Paste & Click Run</h5>
                <p className="text-[11px] text-[#8C7A6B]">Paste the code, click "RUN", and all tables with row security policies will be created immediately!</p>
              </div>
            </div>
          </div>

          {/* Database Health Cards */}
          <div className="bg-white p-6 rounded-3xl border border-[#EAD5C5] shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#F0DFD1]">
              <div>
                <h4 className="font-heading text-base font-bold text-[#5B3A29]">
                  Live Table Status Checker
                </h4>
                <p className="text-xs text-[#8C7A6B]">
                  Connected Supabase Project URL: <span className="font-mono font-bold text-[#5B3A29]">{SUPABASE_URL}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={checkSupabase}
                disabled={isCheckingHealth}
                className="px-3.5 py-1.5 rounded-xl bg-[#FFF8F0] hover:bg-[#F3E5D8] text-[#5B3A29] text-xs font-semibold border border-[#EAD5C5] flex items-center gap-1.5 transition cursor-pointer self-start sm:self-auto"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isCheckingHealth ? 'animate-spin text-[#708238]' : ''}`} />
                <span>Run Diagnostic Check</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {[
                {
                  key: 'orders',
                  title: 'orders',
                  desc: 'Customer orders, items, shipping address, & payment tracking',
                  count: orders.length
                },
                {
                  key: 'custom_orders',
                  title: 'custom_orders',
                  desc: 'Handmade commission requests, photos, & color choices',
                  count: customOrders.length
                },
                {
                  key: 'feedbacks',
                  title: 'feedbacks',
                  desc: 'Verified item reviews, photo feedback, & artisan replies',
                  count: feedbacks.length
                },
                {
                  key: 'products',
                  title: 'products',
                  desc: 'Crochet catalog, photos, stock counts, & pricing',
                  count: products.length
                }
              ].map((tbl) => {
                const isFound = supabaseHealth?.tables?.[tbl.key as keyof typeof supabaseHealth.tables];
                const checked = supabaseHealth !== null;

                return (
                  <div
                    key={tbl.key}
                    className={`p-4 rounded-2xl border transition ${
                      checked
                        ? isFound
                          ? 'bg-[#E8F0DC]/40 border-[#D5E2C4]'
                          : 'bg-amber-50/50 border-amber-200'
                        : 'bg-[#FDF9F4] border-[#EAD5C5]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-xs font-bold text-[#5B3A29]">
                        public.{tbl.title}
                      </span>
                      {checked ? (
                        isFound ? (
                          <span className="px-2 py-0.5 rounded-full bg-[#E8F0DC] text-[#4A5D1E] text-[10px] font-bold flex items-center gap-1 border border-[#D5E2C4]">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Active</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold flex items-center gap-1 border border-amber-200">
                            <AlertCircle className="w-3 h-3" />
                            <span>Pending Run</span>
                          </span>
                        )
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-[10px] font-medium">
                          Click Check
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-[#6E6863] leading-relaxed mb-3">
                      {tbl.desc}
                    </p>
                    <div className="pt-2 border-t border-black/5 flex items-center justify-between text-[11px] text-[#8C7A6B]">
                      <span>Local cached:</span>
                      <span className="font-bold text-[#5B3A29]">{tbl.count} records</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {supabaseHealth && !supabaseHealth.connected && (
              <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{supabaseHealth.message}</span>
              </div>
            )}
          </div>

          {/* SQL Code View & Copy */}
          <div className="bg-white rounded-3xl border border-[#EAD5C5] shadow-xs overflow-hidden">
            <div className="p-4 sm:p-5 bg-[#5B3A29] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-[#EAD5C5]" />
                  <h4 className="font-heading text-sm font-bold text-white">
                    PostgreSQL Schema Creation Script
                  </h4>
                </div>
                <p className="text-[11px] text-[#EAD5C5]/80 mt-0.5">
                  Copy and paste this into your Supabase SQL Editor. It creates tables and sets up public row policies.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleCopySchema}
                  className="px-4 py-2 rounded-xl bg-white text-[#5B3A29] hover:bg-[#FDF9F4] text-xs font-bold flex items-center gap-1.5 transition shadow-xs cursor-pointer"
                >
                  {copiedSchema ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSchema ? 'Copied to Clipboard!' : 'Copy SQL Schema'}</span>
                </button>
                <a
                  href="https://supabase.com/dashboard/project/aosdiqpdpfmozuuogroz/sql"
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-2 rounded-xl bg-[#43291B] hover:bg-[#341F14] text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <span>Open SQL Editor</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            <div className="p-4 bg-[#1E1E1E] overflow-x-auto max-h-96 text-xs font-mono text-[#D4D4D4] leading-relaxed select-all">
              <pre>{SUPABASE_SQL_SCHEMA}</pre>
            </div>

            <div className="p-4 bg-[#FDF9F4] border-t border-[#EAD5C5] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-[#6E6863]">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#708238]" />
                <span>Zero Downtime Resilience: Storefront works seamlessly with local state cache even before SQL execution.</span>
              </div>
              <button
                type="button"
                onClick={handleCopySchema}
                className="text-xs font-bold text-[#5B3A29] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copiedSchema ? 'Copied!' : 'Copy Script'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Product Add / Edit Modal */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-[#EAD5C5] shadow-2xl w-full max-w-2xl p-6 sm:p-7 max-h-[92vh] overflow-y-auto space-y-5">
            <div className="flex justify-between items-center pb-3 border-b border-[#F0DFD1]">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#708238] bg-[#E8F0DC] px-2.5 py-0.5 rounded-full border border-[#D5E2C4]">
                  Artisan Inventory
                </span>
                <h3 className="font-heading text-xl font-bold text-[#5B3A29] mt-1">
                  {editingProduct ? 'Edit Crochet Piece' : 'Add New Crochet Creation'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsProductModalOpen(false)}
                className="p-2 rounded-full text-gray-400 hover:text-gray-700 hover:bg-[#FDF9F4] transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
              {/* Basic Details */}
              <div>
                <label className="block font-semibold text-[#55504C] mb-1">
                  Product Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Handmade Sunflower Crochet Keychain"
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#EAD5C5] bg-[#FDF9F4] focus:outline-hidden focus:ring-1 focus:ring-[#5B3A29]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-semibold text-[#55504C] mb-1">Category</label>
                  <select
                    value={productForm.category}
                    onChange={(e) =>
                      setProductForm({ ...productForm, category: e.target.value as any })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#EAD5C5] bg-[#FDF9F4] focus:outline-hidden focus:ring-1 focus:ring-[#5B3A29]"
                  >
                    <option value="Hair Accessories">Hair Accessories</option>
                    <option value="Keychains">Keychains</option>
                    <option value="Bookmarks">Bookmarks</option>
                    <option value="Flowers">Flowers</option>
                    <option value="Gifts">Gifts</option>
                    <option value="Custom Orders">Custom Orders</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-[#55504C] mb-1">In-Stock Count</label>
                  <input
                    type="number"
                    min="0"
                    value={productForm.stock}
                    onChange={(e) =>
                      setProductForm({ ...productForm, stock: Number(e.target.value) })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#EAD5C5] bg-[#FDF9F4] focus:outline-hidden focus:ring-1 focus:ring-[#5B3A29]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-semibold text-[#55504C] mb-1">Selling Price (₹) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={productForm.price}
                    onChange={(e) =>
                      setProductForm({ ...productForm, price: Number(e.target.value) })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#EAD5C5] bg-[#FDF9F4] font-bold text-sm text-[#5B3A29] focus:outline-hidden focus:ring-1 focus:ring-[#5B3A29]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#55504C] mb-1">
                    Original Price (₹ Strike-through / MRP)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 180"
                    value={productForm.originalPrice || ''}
                    onChange={(e) =>
                      setProductForm({
                        ...productForm,
                        originalPrice: e.target.value ? Number(e.target.value) : undefined
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#EAD5C5] bg-[#FDF9F4] text-[#8C7A6B] focus:outline-hidden focus:ring-1 focus:ring-[#5B3A29]"
                  />
                </div>
              </div>

              {/* IMAGE UPLOAD & GALLERY SECTION */}
              <div className="p-4 rounded-2xl bg-[#FFF8F0] border border-[#EAD5C5] space-y-3.5">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-heading text-sm font-bold text-[#5B3A29] flex items-center gap-1.5">
                      <ImageIcon className="w-4 h-4 text-[#708238]" />
                      <span>Item Pictures & Photo Gallery</span>
                    </h4>
                    <p className="text-[11px] text-[#6E6863]">
                      Upload crochet photos from your phone or PC. You can add multiple angles.
                    </p>
                  </div>
                  <span className="text-[11px] font-bold text-[#708238] bg-white px-2.5 py-1 rounded-full border border-[#EAD5C5]">
                    {productForm.images?.length || 0} photo(s)
                  </span>
                </div>

                {/* Hidden File Input */}
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/png,image/jpeg,image/webp,image/gif,image/avif"
                  multiple
                  onChange={(e) => e.target.files && handleImageFiles(e.target.files)}
                  className="hidden"
                />

                {/* Drag and Drop Zone */}
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    if (e.dataTransfer.files) {
                      handleImageFiles(e.dataTransfer.files);
                    }
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2 ${
                    isDragging
                      ? 'border-[#708238] bg-[#E8F0DC]/50 scale-[1.01]'
                      : 'border-[#D4B8A3] bg-white hover:border-[#5B3A29] hover:bg-[#FDF9F4]'
                  }`}
                >
                  <div className="w-12 h-12 rounded-full bg-[#FFF8F0] border border-[#EAD5C5] flex items-center justify-center text-[#5B3A29] shadow-2xs">
                    <UploadCloud className="w-6 h-6 text-[#708238]" />
                  </div>
                  <div>
                    <span className="font-bold text-xs text-[#5B3A29] block">
                      Click to choose photos from device or take photo
                    </span>
                    <span className="text-[11px] text-[#8C7A6B]">
                      or drag & drop your crochet images here (PNG, JPG, WEBP)
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="px-2 py-0.5 rounded-md bg-[#FFF8F0] border border-[#EAD5C5] text-[10px] font-semibold text-[#5B3A29] flex items-center gap-1">
                      <Camera className="w-3 h-3 text-[#708238]" />
                      <span>Phone Camera / Gallery</span>
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-[#FFF8F0] border border-[#EAD5C5] text-[10px] font-semibold text-[#5B3A29]">
                      Multi-Photo Upload
                    </span>
                  </div>
                </div>

                {/* Direct Image URL input */}
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="Or paste an image web URL..."
                    value={manualUrlInput}
                    onChange={(e) => setManualUrlInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddUrlImage();
                      }
                    }}
                    className="flex-1 px-3 py-2 text-xs rounded-xl border border-[#EAD5C5] bg-white focus:outline-hidden focus:ring-1 focus:ring-[#5B3A29]"
                  />
                  <button
                    type="button"
                    onClick={handleAddUrlImage}
                    className="px-3.5 py-2 rounded-xl bg-[#FFF8F0] hover:bg-[#F3E5D8] border border-[#EAD5C5] text-[#5B3A29] font-bold text-xs shrink-0 transition cursor-pointer"
                  >
                    + Add URL
                  </button>
                </div>

                {/* Uploaded Photos Thumbnails & Cover Manager */}
                {productForm.images && productForm.images.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-[#F0DFD1]">
                    <span className="text-[11px] font-bold text-[#5B3A29] block">
                      Manage Photo Gallery (first photo is the Cover):
                    </span>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                      {productForm.images.map((img, idx) => (
                        <div
                          key={idx}
                          className={`relative group rounded-xl overflow-hidden border-2 bg-white ${
                            idx === 0
                              ? 'border-[#708238] ring-2 ring-[#708238]/20'
                              : 'border-[#EAD5C5]'
                          }`}
                        >
                          <img
                            src={img}
                            alt={`Product pic ${idx + 1}`}
                            className="w-full h-24 object-cover"
                          />
                          {idx === 0 ? (
                            <span className="absolute top-1 left-1 bg-[#708238] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md shadow-xs flex items-center gap-0.5">
                              <Check className="w-2.5 h-2.5" />
                              <span>Cover</span>
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleSetCoverImage(idx)}
                              className="absolute top-1 left-1 bg-[#5B3A29]/90 hover:bg-[#5B3A29] text-white text-[9px] font-semibold px-1.5 py-0.5 rounded-md shadow-xs opacity-90 hover:opacity-100 transition cursor-pointer"
                              title="Set as main cover picture"
                            >
                              Make Cover
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(idx)}
                            className="absolute top-1 right-1 bg-red-600/90 hover:bg-red-700 text-white p-1 rounded-md shadow-xs opacity-90 hover:opacity-100 transition cursor-pointer"
                            title="Delete this photo"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                          <span className="absolute bottom-1 right-1 bg-black/60 text-white text-[9px] px-1 rounded-sm">
                            #{idx + 1}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Live Card Preview */}
                {productForm.images && productForm.images[0] && (
                  <div className="pt-2 border-t border-[#F0DFD1]">
                    <span className="text-[11px] font-bold text-[#8C7A6B] block mb-1.5">
                      Storefront Live Preview Card:
                    </span>
                    <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-white border border-[#EAD5C5]">
                      <img
                        src={productForm.images[0]}
                        alt="Preview"
                        className="w-16 h-16 rounded-xl object-cover border border-[#EAD5C5] shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] text-[#708238] font-bold uppercase tracking-wider block">
                          {productForm.category}
                        </span>
                        <h5 className="font-heading text-xs font-bold text-[#5B3A29] truncate">
                          {productForm.name || 'Untitled Crochet Piece'}
                        </h5>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="font-price font-bold text-sm text-[#2E2E2E]">
                            ₹{productForm.price || 0}
                          </span>
                          {productForm.originalPrice && productForm.originalPrice > (productForm.price || 0) && (
                            <span className="text-[11px] text-[#8C7A6B] line-through">
                              ₹{productForm.originalPrice}
                            </span>
                          )}
                          <span className="text-[9px] font-bold text-[#8B4052] bg-[#F8D7DA] px-1.5 py-0.5 rounded-md">
                            Handmade
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Description & Yarn Details */}
              <div>
                <label className="block font-semibold text-[#55504C] mb-1">Description & Craft Story</label>
                <textarea
                  rows={2}
                  value={productForm.description}
                  onChange={(e) =>
                    setProductForm({ ...productForm, description: e.target.value })
                  }
                  placeholder="Describe the stitches, texture, and inspiration..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#EAD5C5] bg-[#FDF9F4] focus:outline-hidden focus:ring-1 focus:ring-[#5B3A29]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-semibold text-[#55504C] mb-1">Yarn Specification</label>
                  <input
                    type="text"
                    value={productForm.yarnType || '100% Organic Milk Cotton Yarn'}
                    onChange={(e) => setProductForm({ ...productForm, yarnType: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#EAD5C5] bg-[#FDF9F4] focus:outline-hidden focus:ring-1 focus:ring-[#5B3A29]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#55504C] mb-1">Care Advice</label>
                  <input
                    type="text"
                    value={productForm.careInstructions || 'Spot clean or gentle hand wash in cold water.'}
                    onChange={(e) => setProductForm({ ...productForm, careInstructions: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#EAD5C5] bg-[#FDF9F4] focus:outline-hidden focus:ring-1 focus:ring-[#5B3A29]"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-[#F0DFD1] flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 transition cursor-pointer font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-[#5B3A29] text-white font-semibold hover:bg-[#43291B] transition shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingProduct ? 'Save Changes' : 'Publish to Catalog'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
