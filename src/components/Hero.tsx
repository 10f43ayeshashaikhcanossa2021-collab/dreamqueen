import React from 'react';
import { useStore } from '../context/StoreContext';
import { Sparkles, ArrowRight, Heart, Star, CheckCircle, Gift } from 'lucide-react';
import { motion } from 'motion/react';

export const Hero: React.FC = () => {
  const { setActiveTab } = useStore();

  return (
    <section className="relative overflow-hidden pt-8 pb-16 md:pt-12 md:pb-24">
      {/* Soft animated pastel blurred background blobs */}
      <div className="absolute top-0 left-1/4 w-72 h-72 md:w-96 md:h-96 bg-[#F8D7DA]/60 rounded-full blur-3xl -z-10 animate-pulse-glow" />
      <div className="absolute bottom-10 right-1/4 w-80 h-80 md:w-[450px] md:h-[450px] bg-[#FFF8F0] rounded-full blur-3xl -z-10 animate-float-slow" />
      <div className="absolute top-1/3 right-10 w-64 h-64 bg-[#708238]/10 rounded-full blur-3xl -z-10" />

      {/* Floating decorative elements */}
      <div className="absolute top-12 left-10 text-2xl animate-float-slow opacity-80 select-none hidden sm:block">
        🌸
      </div>
      <div className="absolute top-36 right-16 text-xl animate-float-gentle opacity-75 select-none hidden sm:block">
        ✨
      </div>
      <div className="absolute bottom-20 left-20 text-xl animate-float-slow opacity-70 select-none hidden md:block">
        🧶
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Typography & CTAs */}
          <div className="lg:col-span-7 text-center lg:text-left space-y-6">
            {/* Pill badge */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#FFF8F0] border border-[#EAD5C5] shadow-xs text-xs font-medium text-[#5B3A29]"
            >
              <span className="text-[#D4A017]">✨</span>
              <span className="font-semibold tracking-wide">Etsy & Pinterest Inspired Handmade Boutique</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#708238]"></span>
            </motion.div>

            {/* Main Headline */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="space-y-2"
            >
              <h1 className="font-heading text-4xl sm:text-6xl xl:text-7xl font-bold tracking-tight text-[#5B3A29] leading-[1.08]">
                DreamQueen
              </h1>
              <p className="font-subheading text-2xl sm:text-3xl lg:text-4xl text-[#708238] font-normal italic">
                Handmade Crochet Accessories Made with Love
              </p>
            </motion.div>

            {/* Narrative copy */}
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-[#55504C] text-base sm:text-lg max-w-xl mx-auto lg:mx-0 leading-relaxed"
            >
              Lovingly hand-crocheted using baby-soft milk cotton yarn. From blooming rose hair ties and sunflower keychains to everlasting bouquets and bespoke creations, each stitch is crafted to bring warmth and joy.
            </motion.p>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2"
            >
              <button
                id="hero-shop-now-btn"
                onClick={() => {
                  setActiveTab('shop');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="px-8 py-3.5 rounded-full bg-[#5B3A29] hover:bg-[#43291B] text-white font-medium text-sm shadow-md hover:shadow-lg transition-all flex items-center gap-2.5 group"
              >
                <span>Shop Now</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                id="hero-new-arrivals-btn"
                onClick={() => {
                  setActiveTab('shop');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="px-8 py-3.5 rounded-full bg-[#F8D7DA] hover:bg-[#F2BAC0] text-[#5B3A29] font-medium text-sm border border-[#F0B8BE] shadow-xs hover:shadow-sm transition-all"
              >
                New Arrivals
              </button>
            </motion.div>

            {/* Micro Trust Indicators */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.7, delay: 0.4 }}
              className="pt-6 border-t border-[#EAD5C5]/60 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs text-[#6E6863]"
            >
              <div className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-[#708238]" />
                <span>Starts at just ₹20</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Heart className="w-4 h-4 text-[#C83E4D] fill-[#F8D7DA]" />
                <span>100% Handcrafted</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Gift className="w-4 h-4 text-[#D4A017]" />
                <span>7-Day Delivery</span>
              </div>
            </motion.div>
          </div>

          {/* Right Column: Hero Visual Showcase */}
          <div className="lg:col-span-5 relative">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative mx-auto max-w-md lg:max-w-none"
            >
              {/* Soft aesthetic border frame */}
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-[#FFF8F0] bg-[#FFF8F0]">
                <img
                  src="/images/heart hairclip.jpeg"
                  alt="DreamQueen Handmade Crochet Flower Keychain and Phone Charm"
                  className="w-full h-[420px] sm:h-[480px] object-cover hover:scale-105 transition-transform duration-700"
                  referrerPolicy="no-referrer"
                />

                {/* Subtle vignette gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#5B3A29]/70 via-transparent to-transparent pointer-events-none" />

                {/* Overlaid Banner at Bottom of Hero Image */}
                <div className="absolute bottom-6 left-6 right-6 text-white pointer-events-none">
                  <p className="font-handwriting text-2xl text-[#F8D7DA] font-semibold">
                    Crafted with care
                  </p>
                  <p className="text-sm font-light text-[#FFF8F0] opacity-90">
                    Natural milk cotton yarn • From only ₹20
                  </p>
                </div>
              </div>

              {/* Floating Feature Card 1: Customer Love */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="absolute -bottom-6 -left-6 sm:-left-8 bg-white/95 backdrop-blur-md rounded-2xl p-3.5 shadow-xl border border-[#EAD5C5] flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-full bg-[#FFF8F0] border border-[#F8D7DA] flex items-center justify-center text-lg">
                  🌸
                </div>
                <div>
                  <div className="flex items-center gap-1 text-[#D4A017]">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-[#D4A017]" />
                    ))}
                  </div>
                  <p className="text-[11px] font-semibold text-[#2E2E2E] mt-0.5">
                    Over 500+ Happy Customers
                  </p>
                </div>
              </motion.div>

              {/* Floating Feature Card 2: Price Highlight */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="absolute -top-4 -right-4 sm:-right-6 bg-[#5B3A29] text-white rounded-2xl p-3.5 shadow-xl border border-[#43291B] text-center"
              >
                <span className="block text-[10px] uppercase tracking-wider text-[#F8D7DA] font-semibold">
                  Handmade Gems
                </span>
                <span className="font-price text-xl font-bold">From ₹20</span>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};
