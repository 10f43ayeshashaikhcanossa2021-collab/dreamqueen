import React from 'react';
import { Product } from '../types';
import { useStore } from '../context/StoreContext';
import { Heart, Star, ShoppingBag, Eye } from 'lucide-react';
import { motion } from 'motion/react';

interface ProductCardProps {
  product: Product;
  index?: number;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, index = 0 }) => {
  const { isInWishlist, toggleWishlist, addToCart, setSelectedProduct } = useStore();
  const wishlisted = isInWishlist(product.id);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className="group relative bg-white rounded-3xl p-3.5 border border-[#EAD5C5]/80 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
    >
      {/* Image container */}
      <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-[#FFF8F0] mb-3.5">
        <img
          src={product.images[0]}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
          referrerPolicy="no-referrer"
        />

        {/* Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 z-10 pointer-events-none">
          {product.price <= 20 ? (
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#F8D7DA] text-[#842029] border border-[#F0B8BE] shadow-xs">
              Special ₹20
            </span>
          ) : product.price <= 50 ? (
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#F8D7DA] text-[#842029] border border-[#F0B8BE] shadow-xs">
              Special ₹50
            </span>
          ) : null}
          {product.isBestSeller && (
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#FFF8F0] text-[#5B3A29] border border-[#EAD5C5] shadow-xs">
              Best Seller
            </span>
          )}
          {product.isNewArrival && (
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#E8F0DC] text-[#4A5D1E] border border-[#D5E5BC] shadow-xs">
              New Drop
            </span>
          )}
        </div>

        {/* Wishlist Heart Button */}
        <button
          id={`wishlist-btn-${product.id}`}
          onClick={(e) => {
            e.stopPropagation();
            toggleWishlist(product.id);
          }}
          className={`absolute top-2.5 right-2.5 p-2 rounded-full backdrop-blur-md transition shadow-sm ${
            wishlisted
              ? 'bg-[#F8D7DA] text-[#C83E4D]'
              : 'bg-white/80 text-[#5B3A29] hover:bg-white hover:text-[#C83E4D]'
          }`}
          aria-label="Toggle Wishlist"
        >
          <Heart className={`w-4 h-4 ${wishlisted ? 'fill-[#C83E4D]' : ''}`} />
        </button>

        {/* Quick View Button on Hover */}
        <div className="absolute inset-0 bg-black/15 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
          <button
            onClick={() => setSelectedProduct(product)}
            className="pointer-events-auto px-4 py-2 rounded-full bg-white/95 text-[#5B3A29] text-xs font-semibold shadow-md flex items-center gap-1.5 hover:bg-[#5B3A29] hover:text-white transition"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Quick View</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col justify-between">
        <div>
          {/* Category & Rating */}
          <div className="flex items-center justify-between text-[11px] text-[#708238] font-medium mb-1">
            <span>{product.category}</span>
            <div className="flex items-center gap-1 text-[#D4A017]">
              <Star className="w-3.5 h-3.5 fill-[#D4A017]" />
              <span className="font-bold text-[#2E2E2E]">{product.rating}</span>
              <span className="text-[#8C7A6B]">({product.reviewsCount})</span>
            </div>
          </div>

          {/* Product Name */}
          <h3
            onClick={() => setSelectedProduct(product)}
            className="font-heading text-base sm:text-lg font-bold text-[#2E2E2E] group-hover:text-[#5B3A29] cursor-pointer transition line-clamp-1"
          >
            {product.name}
          </h3>

          <p className="text-xs text-[#6E6863] line-clamp-1 mt-0.5 font-light">
            {product.tagline}
          </p>

          {/* Color swatches preview */}
          {product.colors && product.colors.length > 0 && (
            <div className="flex items-center gap-1.5 mt-2">
              {product.colors.slice(0, 4).map((c, i) => (
                <span
                  key={i}
                  title={c.name}
                  className="w-3 h-3 rounded-full border border-gray-300"
                  style={{ backgroundColor: c.hex }}
                />
              ))}
              {product.colors.length > 4 && (
                <span className="text-[10px] text-[#8C7A6B]">
                  +{product.colors.length - 4}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Pricing & Add to Cart button */}
        <div className="mt-4 pt-3 border-t border-[#F0DFD1] flex items-center justify-between">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-price font-bold text-lg text-[#5B3A29]">
                ₹{product.price}
              </span>
              {product.originalPrice && product.originalPrice > product.price && (
                <span className="text-xs text-[#9C948D] line-through font-price">
                  ₹{product.originalPrice}
                </span>
              )}
            </div>
            <span className="text-[10px] text-[#708238] block font-medium">
              Handcrafted on order
            </span>
          </div>

          <button
            id={`add-to-cart-btn-${product.id}`}
            onClick={() => addToCart(product, 1, 0)}
            className="p-2.5 sm:px-3 sm:py-2 rounded-xl bg-[#FFF8F0] hover:bg-[#5B3A29] text-[#5B3A29] hover:text-white border border-[#EAD5C5] hover:border-[#5B3A29] transition-all flex items-center gap-1.5 shadow-xs"
            aria-label={`Add ${product.name} to cart`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span className="hidden sm:inline text-xs font-semibold">Add</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
};
