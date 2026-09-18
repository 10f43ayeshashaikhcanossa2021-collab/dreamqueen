import React from 'react';
import { StoreProvider, useStore } from './context/StoreContext';
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

// Pages
import { ShopPage } from './pages/ShopPage';
import { OrderTrackingPage } from './pages/OrderTrackingPage';
import { CustomOrderPage } from './pages/CustomOrderPage';
import { CustomerDashboard } from './pages/CustomerDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { ContactPage } from './pages/ContactPage';

import { MessageCircle, Heart, ArrowUp } from 'lucide-react';

const MainLayout: React.FC = () => {
  const { activeTab, isUpiScannerOpen, setIsUpiScannerOpen } = useStore();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FDF9F4] text-[#2E2E2E] selection:bg-[#F8D7DA] selection:text-[#5B3A29]">
      <ToastContainer />
      <Navbar />

      {/* Main View Router */}
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
        {activeTab === 'track' && <OrderTrackingPage />}
        {activeTab === 'custom' && <CustomOrderPage />}
        {activeTab === 'customer' && <CustomerDashboard />}
        {activeTab === 'admin' && <AdminDashboard />}
        {activeTab === 'contact' && <ContactPage />}
      </main>

      <Footer />

      {/* Global Modals & Slide-Overs */}
      <CartDrawer />
      <ProductDetailModal />
      <CheckoutModal />
      <AuthModal />
      <ItemFeedbackModal />
      <UpiScannerModal
        isOpen={isUpiScannerOpen}
        onClose={() => setIsUpiScannerOpen(false)}
      />

      {/* Floating Artisan WhatsApp Direct Button */}
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
    <StoreProvider>
      <MainLayout />
    </StoreProvider>
  );
}
