import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { ProductCard } from './ProductCard';
import { ArrowRight, Sparkles } from 'lucide-react';

export const FeaturedProducts: React.FC = () => {
  const { products, setActiveTab } = useStore();
  const [activeFilter, setActiveFilter] = useState<'all' | 'under100' | 'bestsellers' | 'hair_keychains'>('all');

  const filtered = products.filter((p) => {
    if (activeFilter === 'under100') return p.price <= 100;
    if (activeFilter === 'bestsellers') return p.isBestSeller;
    if (activeFilter === 'hair_keychains') return p.category === 'Hair Accessories' || p.category === 'Keychains';
    return true;
  });

  return (
    <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#708238] uppercase tracking-wider mb-1">
            <Sparkles className="w-3.5 h-3.5 text-[#D4A017]" />
            <span>Artisan Crafted</span>
          </div>
          <h2 className="font-heading text-3xl sm:text-4xl font-bold text-[#5B3A29]">
            Featured Crochet Pieces
          </h2>
          <p className="text-sm text-[#6E6863] mt-1">
            Hand-crocheted everyday essentials starting at just ₹50
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center flex-wrap gap-2">
          {[
            { id: 'all', label: 'All Pieces' },
            { id: 'under100', label: 'Under ₹100' },
            { id: 'bestsellers', label: 'Best Sellers' },
            { id: 'hair_keychains', label: 'Hair & Keychains' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id as any)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition ${
                activeFilter === tab.id
                  ? 'bg-[#5B3A29] text-white shadow-xs'
                  : 'bg-[#FFF8F0] text-[#5B3A29] border border-[#EAD5C5] hover:bg-[#F8D7DA]/40'
              }`}
            >
              {tab.label}
            </button>
          ))}

          <button
            onClick={() => {
              setActiveTab('shop');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold text-[#5B3A29] hover:text-[#708238] ml-2 group"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {filtered.slice(0, 8).map((product, idx) => (
          <ProductCard key={product.id} product={product} index={idx} />
        ))}
      </div>

      {/* Mobile view all CTA */}
      <div className="mt-8 text-center sm:hidden">
        <button
          onClick={() => {
            setActiveTab('shop');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="px-6 py-3 rounded-full bg-[#5B3A29] text-white text-xs font-semibold shadow-md flex items-center justify-center gap-2 mx-auto"
        >
          <span>Explore All 20+ Pieces</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </section>
  );
};
