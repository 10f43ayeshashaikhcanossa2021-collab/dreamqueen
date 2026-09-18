import React, { useRef } from 'react';
import { useStore } from '../context/StoreContext';
import { ProductCard } from './ProductCard';
import { ChevronLeft, ChevronRight, Flame } from 'lucide-react';

export const BestSellersCarousel: React.FC = () => {
  const { products } = useStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  const bestSellers = products.filter((p) => p.isBestSeller || p.rating >= 4.9);

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -320 : 320;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <section className="py-14 bg-[#FFF8F0] border-y border-[#EAD5C5]/50 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-8">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#8B4052] uppercase tracking-wider mb-1">
              <Flame className="w-4 h-4 text-[#8B4052]" />
              <span>Customer Favorites</span>
            </div>
            <h2 className="font-heading text-3xl sm:text-4xl font-bold text-[#5B3A29]">
              Most Loved Best Sellers
            </h2>
            <p className="text-sm text-[#6E6863] mt-1">
              The handmade pieces everyone is loving and saving on Pinterest
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleScroll('left')}
              className="p-2.5 rounded-full bg-white border border-[#EAD5C5] text-[#5B3A29] hover:bg-[#F8D7DA]/40 transition shadow-xs"
              aria-label="Previous best sellers"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => handleScroll('right')}
              className="p-2.5 rounded-full bg-white border border-[#EAD5C5] text-[#5B3A29] hover:bg-[#F8D7DA]/40 transition shadow-xs"
              aria-label="Next best sellers"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Container */}
        <div
          ref={scrollRef}
          className="flex gap-6 overflow-x-auto pb-4 pt-1 snap-x scrollbar-none scroll-smooth"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {bestSellers.map((product, idx) => (
            <div key={product.id} className="w-[270px] sm:w-[300px] shrink-0 snap-start">
              <ProductCard product={product} index={idx} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
