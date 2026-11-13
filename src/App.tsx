import React from 'react';
import { StoreProvider, useStore } from './context/StoreContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { CategoryList } from './components/CategoryList';
import { FeaturedProducts } from './components/FeaturedProducts';
import { BestSellersCarousel } from './components/BestSellersCarousel';
import { WhyChooseUs } from './components/WhyChooseUs';
import { CustomerReviews } from './components/CustomerReviews';
import { PinterestSection } from './components/PinterestSection';
import { Newsletter } from './components/Newsletter';
import { Footer } from './components/Footer';
import { CartDrawer } from './components/CartDrawer';
import { ProductDetailModal } from './components/ProductDetailModal';
import { CheckoutModal } from './components/CheckoutModal';
import { AuthModal } from './components/AuthModal';
import { ItemFeedbackModal } from './components/ItemFeedbackModal';
import { UpiScannerModal } from './components/UpiScannerModal';
import { ToastContainer } from './components/ToastContainer';

import { ShopPage } from './pages/ShopPage';
import { CustomOrderPage } from './pages/CustomOrderPage';
import { CustomerDashboard } from './pages/CustomerDashboard';
import { ContactPage } from './pages/ContactPage';
import { OrderTrackingPage } from './pages/OrderTrackingPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { PolicyPages } from './pages/PolicyPages';

import { MessageCircle } from 'lucide-react';

const MainLayout: React.FC = () => {
  const { activeTab, setActiveTab, isUpiScannerOpen, setIsUpiScannerOpen } = useStore();

  const knownTabs = new Set([
    'home',
    'shop',
    'custom',
    'track',
    'customer',
    'contact',
    'admin',
    'privacy',
    'terms',
    'shipping',
    'refunds'
  ]);

  return (
    <div className="min-h-screen flex flex-col bg-[#FDF9F4] text-[#2E2E2E] selection:bg-[#F8D7DA] selection:text-[#5B3A29]">
      <ToastContainer />
      <Navbar />

      <main className="flex-1">
        {activeTab === 'home' && (
          <>
            <Hero />
            <CategoryList />
            <FeaturedProducts />
            <BestSellersCarousel />
            <WhyChooseUs />
            <CustomerReviews />
            <PinterestSection />
            <Newsletter />
          </>
        )}

        {activeTab === 'shop' && <ShopPage />}
        {activeTab === 'custom' && <CustomOrderPage />}
        {activeTab === 'track' && <OrderTrackingPage />}
        {activeTab === 'customer' && <CustomerDashboard />}
        {activeTab === 'contact' && <ContactPage />}
        {activeTab === 'admin' && <AdminDashboard />}
        {(activeTab === 'privacy' ||
          activeTab === 'terms' ||
          activeTab === 'shipping' ||
          activeTab === 'refunds') && <PolicyPages policyType={activeTab} />}

        {!knownTabs.has(activeTab) && (
          <div className="py-20 text-center space-y-4">
            <h2 className="font-heading text-2xl font-bold text-[#5B3A29]">Page Not Found</h2>
            <button
              onClick={() => setActiveTab('home')}
              className="px-6 py-2.5 rounded-full bg-[#5B3A29] text-white text-xs font-semibold"
            >
              Return Home
            </button>
          </div>
        )}
      </main>

      <Footer />

      <CartDrawer />
      <ProductDetailModal />
      <CheckoutModal />
      <AuthModal />
      <ItemFeedbackModal />
      <UpiScannerModal
        isOpen={isUpiScannerOpen}
        onClose={() => setIsUpiScannerOpen(false)}
      />

      <a
        href="https://wa.me/918097706536?text=Hi%20DreamQueen%20Atelier!%20I'm%20interested%20in%20handmade%20crochet."
        target="_blank"
        rel="noreferrer"
        className="fixed bottom-6 right-6 z-40 p-3.5 rounded-full bg-[#25D366] text-white shadow-xl hover:scale-110 hover:bg-[#1EBE5D] transition-all flex items-center gap-2 group"
        aria-label="Artisan WhatsApp Chat"
      >
        <MessageCircle className="w-6 h-6 fill-white" />
        <span className="max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-xs transition-all duration-300 text-xs font-semibold pr-1">
          Chat with Artisan
        </span>
      </a>
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <StoreProvider>
        <MainLayout />
      </StoreProvider>
    </ErrorBoundary>
  );
}
