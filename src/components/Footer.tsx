import React from 'react';
import { useStore } from '../context/StoreContext';
import { Heart, Pin, MessageCircle, Mail, MapPin, ShieldCheck, Truck, RefreshCw, QrCode, Lock } from 'lucide-react';

export const Footer: React.FC = () => {
  const { setActiveTab, setIsUpiScannerOpen } = useStore();

  return (
    <footer className="bg-[#FFF8F0] border-t border-[#EAD5C5] text-[#2E2E2E]">
      {/* Value Badges Banner */}
      <div className="border-b border-[#EAD5C5]/60 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 text-center sm:text-left">
            <div className="flex items-center gap-3 justify-center sm:justify-start">
              <div className="p-3 rounded-2xl bg-[#F8D7DA] text-[#8B4052]">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#5B3A29]">Fast 7-Day Delivery</h4>
                <p className="text-[11px] text-[#6E6863]">Direct to doorstep across India</p>
              </div>
            </div>

            <div className="flex items-center gap-3 justify-center sm:justify-start">
              <div className="p-3 rounded-2xl bg-[#E8F0DC] text-[#4A5D1E]">
                <Heart className="w-5 h-5 fill-[#4A5D1E]" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#5B3A29]">100% Handcrafted</h4>
                <p className="text-[11px] text-[#6E6863]">Organic soft milk cotton yarn</p>
              </div>
            </div>

            <div className="flex items-center gap-3 justify-center sm:justify-start">
              <div className="p-3 rounded-2xl bg-[#FFF3A8] text-[#855D00]">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#5B3A29]">Razorpay & COD</h4>
                <p className="text-[11px] text-[#6E6863]">100% Secure & verified checkout</p>
              </div>
            </div>

            <div className="flex items-center gap-3 justify-center sm:justify-start">
              <div className="p-3 rounded-2xl bg-[#FCECEE] text-[#C83E4D]">
                <RefreshCw className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#5B3A29]">Craft Replacement</h4>
                <p className="text-[11px] text-[#6E6863]">Guaranteed undamaged delivery</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-[#F8D7DA] flex items-center justify-center text-lg">
                🌸
              </div>
              <div>
                <span className="font-heading text-2xl font-bold text-[#5B3A29]">
                  DreamQueen
                </span>
                <span className="block text-[11px] font-handwriting text-[#708238] font-bold -mt-1">
                  Handmade with Love
                </span>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-[#6E6863] leading-relaxed max-w-sm">
              DreamQueen is an artisanal handmade crochet boutique celebrating the beauty of gentle slow fashion, tactile milk-cotton craftsmanship, and thoughtful gifting. Every piece is woven with care and joy.
            </p>

            <div className="flex items-center gap-3 pt-1">
              <a
                href="https://in.pinterest.com/ayeshalk2025/?actingBusinessId=1147221842487308120"
                target="_blank"
                rel="noreferrer"
                className="p-2.5 rounded-full bg-white border border-[#EAD5C5] text-[#E60023] hover:bg-[#FEE2E2] transition shadow-xs"
                aria-label="Pinterest"
                title="Follow us on Pinterest (@ayeshalk2025)"
              >
                <Pin className="w-4 h-4" />
              </a>
              <a
                href="https://wa.me/918097706536"
                target="_blank"
                rel="noreferrer"
                className="p-2.5 rounded-full bg-white border border-[#EAD5C5] text-[#25D366] hover:bg-[#E8F8EE] transition shadow-xs"
                aria-label="WhatsApp"
              >
                <MessageCircle className="w-4 h-4" />
              </a>
              <a
                href="mailto:dreamqueen29@gmail.com"
                className="p-2.5 rounded-full bg-white border border-[#EAD5C5] text-[#5B3A29] hover:bg-[#FFF8F0] transition shadow-xs"
                aria-label="Email"
              >
                <Mail className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Quick Shop Links */}
          <div>
            <h4 className="font-heading text-sm font-bold text-[#5B3A29] mb-4">Shop Collections</h4>
            <ul className="space-y-2 text-xs text-[#55504C]">
              <li>
                <button
                  onClick={() => {
                    setActiveTab('shop');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="hover:text-[#5B3A29] hover:underline"
                >
                  All Crochet Pieces
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    setActiveTab('shop');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="hover:text-[#5B3A29] hover:underline"
                >
                  Hair Accessories & Clips
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    setActiveTab('shop');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="hover:text-[#5B3A29] hover:underline"
                >
                  Sunflowers & Keychains
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    setActiveTab('shop');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="hover:text-[#5B3A29] hover:underline"
                >
                  Daisy Bookmarks
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    setActiveTab('custom');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="hover:text-[#5B3A29] hover:underline"
                >
                  Custom Crochet Requests
                </button>
              </li>
            </ul>
          </div>

          {/* Customer Care */}
          <div>
            <h4 className="font-heading text-sm font-bold text-[#5B3A29] mb-4">Customer Care</h4>
            <ul className="space-y-2 text-xs text-[#55504C]">
              <li>
                <button
                  onClick={() => {
                    setActiveTab('track');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="hover:text-[#5B3A29] hover:underline font-semibold text-[#708238]"
                >
                  Track Your Order (7 Days)
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    setActiveTab('customer');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="hover:text-[#5B3A29] hover:underline"
                >
                  My Account & Orders
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    setActiveTab('contact');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="hover:text-[#5B3A29] hover:underline"
                >
                  Shipping & Return Policy
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    setActiveTab('contact');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="hover:text-[#5B3A29] hover:underline"
                >
                  Yarn Care Instructions
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    setActiveTab('contact');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="hover:text-[#5B3A29] hover:underline"
                >
                  FAQ & Support
                </button>
              </li>
              <li className="pt-1">
                <button
                  onClick={() => {
                    setActiveTab('admin');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="text-[11px] text-[#8C7A6B] hover:text-[#5B3A29] flex items-center gap-1.5 transition"
                  title="Artisan & Administrator login"
                >
                  <Lock className="w-3 h-3 text-[#708238]" />
                  <span>Artisan Portal (Admin)</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Contact & Hours */}
          <div>
            <h4 className="font-heading text-sm font-bold text-[#5B3A29] mb-4">Artisan Studio</h4>
            <ul className="space-y-2.5 text-xs text-[#55504C]">
              <li className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-[#5B3A29] shrink-0 mt-0.5" />
                <span>Handmade Atelier, Mumbai & Pune, India</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-[#5B3A29] shrink-0" />
                <a href="mailto:dreamqueen29@gmail.com" className="hover:text-[#5B3A29] hover:underline">
                  dreamqueen29@gmail.com
                </a>
              </li>
              <li className="flex items-center gap-2">
                <MessageCircle className="w-3.5 h-3.5 text-[#25D366] shrink-0" />
                <a href="https://wa.me/918097706536" target="_blank" rel="noreferrer" className="hover:text-[#5B3A29] hover:underline">
                  +91 8097706536
                </a>
              </li>
              <li className="pt-1">
                <button
                  type="button"
                  onClick={() => setIsUpiScannerOpen(true)}
                  className="w-full py-2 px-3 rounded-xl bg-white border border-[#EAD5C5] text-[#5B3A29] hover:bg-[#FFF8F0] font-semibold flex items-center justify-center gap-1.5 transition shadow-2xs text-[11px]"
                >
                  <QrCode className="w-3.5 h-3.5 text-[#708238]" />
                  <span>Scan to Pay (India Post QR)</span>
                </button>
              </li>
              <li className="text-[11px] text-[#8C7A6B] pt-0.5">
                Artisan crafting hours: Mon – Sat (10am – 7pm)
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright & payment icons */}
        <div className="mt-12 pt-6 border-t border-[#EAD5C5]/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#8C7A6B]">
          <div className="flex items-center gap-1.5">
            <span>© {new Date().getFullYear()} DreamQueen.</span>
            <span>Handmade with</span>
            <Heart className="w-3.5 h-3.5 text-[#C83E4D] fill-[#C83E4D] inline" />
            <span>in India.</span>
          </div>

          <div className="flex items-center gap-2 flex-wrap justify-center text-[11px] font-medium text-[#5B3A29]">
            <button
              onClick={() => setIsUpiScannerOpen(true)}
              className="px-2 py-0.5 rounded-md bg-[#FFF8F0] border border-[#EAD5C5] text-[#5B3A29] font-bold hover:bg-[#F3E5D8] transition flex items-center gap-1 cursor-pointer"
            >
              <QrCode className="w-3 h-3 text-[#708238]" />
              <span>India Post UPI QR</span>
            </button>
            <span className="px-2 py-0.5 rounded-md bg-white border border-[#EAD5C5]">Razorpay Gateway</span>
            <span className="px-2 py-0.5 rounded-md bg-white border border-[#EAD5C5]">GPay / PhonePe</span>
            <span className="px-2 py-0.5 rounded-md bg-white border border-[#EAD5C5]">Cash on Delivery</span>
            <span className="px-2 py-0.5 rounded-md bg-white border border-[#EAD5C5]">Shiprocket 7-Day</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
