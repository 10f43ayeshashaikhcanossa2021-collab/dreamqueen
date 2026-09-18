import React, { useState, useMemo } from 'react';
import { useStore } from '../context/StoreContext';
import { ProductCategory } from '../types';
import { ProductCard } from '../components/ProductCard';
import { Search, SlidersHorizontal, ArrowUpDown, Sparkles, Filter, X } from 'lucide-react';

export const ShopPage: React.FC = () => {
  const { products } = useStore();

  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [maxPrice, setMaxPrice] = useState<number>(400);
  const [sortBy, setSortBy] = useState<'featured' | 'priceAsc' | 'priceDesc' | 'rating' | 'newest'>('featured');
  const [onlyInStock, setOnlyInStock] = useState(false);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  const categories = ['All', 'Hair Accessories', 'Keychains', 'Bookmarks', 'Flowers', 'Gifts', 'Custom Orders'];

  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        // category filter
        if (selectedCategory !== 'All' && p.category !== selectedCategory) {
          return false;
        }
        // search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = p.name.toLowerCase().includes(q);
          const matchDesc = p.description.toLowerCase().includes(q);
          const matchTag = p.tags.some((t) => t.toLowerCase().includes(q));
          if (!matchName && !matchDesc && !matchTag) return false;
        }
        // price filter
        if (p.price > maxPrice) return false;
        // stock filter
        if (onlyInStock && p.stock <= 0) return false;

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'priceAsc') return a.price - b.price;
        if (sortBy === 'priceDesc') return b.price - a.price;
        if (sortBy === 'rating') return b.rating - a.rating;
        if (sortBy === 'newest') return (b.isNewArrival ? 1 : 0) - (a.isNewArrival ? 1 : 0);
        return (b.isBestSeller ? 1 : 0) - (a.isBestSeller ? 1 : 0);
      });
  }, [products, selectedCategory, searchQuery, maxPrice, sortBy, onlyInStock]);

  return (
    <div className="py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header Banner */}
      <div className="text-center max-w-3xl mx-auto mb-10">
        <span className="text-xs font-handwriting text-2xl text-[#708238] block font-semibold">
          Handmade Boutique
        </span>
        <h1 className="font-heading text-3xl sm:text-5xl font-bold text-[#5B3A29]">
          The DreamQueen Shop
        </h1>
        <p className="text-xs sm:text-sm text-[#6E6863] mt-2">
          Browse our full collection of tactile, artisanal milk-cotton crochet accessories starting from just ₹50.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-[#EAD5C5] shadow-xs mb-8 space-y-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Search Field */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-[#8C7A6B] absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search keychains, clips, bookmarks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs rounded-full border border-[#EAD5C5] bg-[#FDF9F4] focus:outline-none focus:ring-1 focus:ring-[#5B3A29]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-xs text-gray-400 hover:text-black"
              >
                ✕
              </button>
            )}
          </div>

          {/* Controls: Sorting & Mobile Filter Toggle */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
            <button
              onClick={() => setIsMobileFilterOpen(!isMobileFilterOpen)}
              className="md:hidden px-4 py-2 rounded-full border border-[#EAD5C5] text-xs font-medium text-[#5B3A29] flex items-center gap-1.5 bg-[#FFF8F0]"
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Filters</span>
            </button>

            <div className="flex items-center gap-2">
              <span className="text-xs text-[#8C7A6B] hidden sm:inline">Sort By:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 text-xs rounded-full border border-[#EAD5C5] bg-[#FFF8F0] text-[#5B3A29] font-medium focus:outline-none focus:ring-1 focus:ring-[#5B3A29]"
              >
                <option value="featured">Featured & Best Sellers</option>
                <option value="priceAsc">Price: Low to High (₹50+)</option>
                <option value="priceDesc">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
                <option value="newest">New Arrivals</option>
              </select>
            </div>
          </div>
        </div>

        {/* Category Pills (Desktop) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none pt-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition ${
                selectedCategory === cat
                  ? 'bg-[#5B3A29] text-white shadow-xs'
                  : 'bg-[#FFF8F0] text-[#5B3A29] border border-[#EAD5C5] hover:bg-[#F8D7DA]/40'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Extended Filter Bar (Price slider & In-stock toggle) */}
        <div className={`pt-3 border-t border-[#F0DFD1] flex-col sm:flex-row items-center justify-between gap-4 ${isMobileFilterOpen ? 'flex' : 'hidden md:flex'}`}>
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <span className="text-xs text-[#6E6863]">Max Price:</span>
            <input
              type="range"
              min={50}
              max={500}
              step={10}
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="accent-[#5B3A29] w-32"
            />
            <span className="font-price font-bold text-xs text-[#5B3A29]">₹{maxPrice}</span>
          </div>

          <label className="flex items-center gap-2 text-xs text-[#55504C] cursor-pointer self-start sm:self-auto">
            <input
              type="checkbox"
              checked={onlyInStock}
              onChange={(e) => setOnlyInStock(e.target.checked)}
              className="rounded text-[#5B3A29] focus:ring-0"
            />
            <span>Show In-Stock Only</span>
          </label>
        </div>
      </div>

      {/* Active Filter summary */}
      <div className="flex items-center justify-between text-xs text-[#6E6863] mb-6">
        <span>Showing {filteredProducts.length} handmade items</span>
        {(selectedCategory !== 'All' || searchQuery || maxPrice < 400 || onlyInStock) && (
          <button
            onClick={() => {
              setSelectedCategory('All');
              setSearchQuery('');
              setMaxPrice(400);
              setOnlyInStock(false);
            }}
            className="text-[#842029] hover:underline font-medium"
          >
            Clear all filters
          </button>
        )}
      </div>

      {/* Products Grid */}
      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredProducts.map((prod, idx) => (
            <ProductCard key={prod.id} product={prod} index={idx} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-3xl border border-[#EAD5C5] p-8 space-y-3">
          <p className="text-3xl">🌸</p>
          <h3 className="font-heading text-lg font-bold text-[#5B3A29]">
            No crochet pieces found
          </h3>
          <p className="text-xs text-[#6E6863]">
            Try adjusting your search query, price slider, or category filter.
          </p>
          <button
            onClick={() => {
              setSelectedCategory('All');
              setSearchQuery('');
              setMaxPrice(400);
            }}
            className="px-5 py-2 rounded-full bg-[#5B3A29] text-white text-xs font-semibold"
          >
            Reset Filters
          </button>
        </div>
      )}
    </div>
  );
};
