import React, { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import {
  X,
  Star,
  ShoppingBag,
  Heart,
  Truck,
  ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { safeImage } from '../utils/imageHelper';

export const ProductDetailModal: React.FC = () => {
  const {
    selectedProduct,
    setSelectedProduct,
    addToCart,
    toggleWishlist,
    isInWishlist,
    activeProducts,
    setIsCheckoutOpen,
    feedbacks,
    orders,
    setActiveFeedbackTarget,
    currentUser,
    openAuthModal
  } = useStore();

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedColorIndex, setSelectedColorIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    setSelectedImageIndex(0);
    setSelectedColorIndex(0);
    setQuantity(1);
  }, [selectedProduct?.id]);

  if (!selectedProduct) return null;

  const outOfStock = selectedProduct.stock <= 0;
  const wishlisted = isInWishlist(selectedProduct.id);
  const relatedProducts = activeProducts
    .filter((p) => p.category === selectedProduct.category && p.id !== selectedProduct.id)
    .slice(0, 4);

  // Only show approved, verified feedbacks
  const verifiedFeedbacks = feedbacks.filter(
    (f) => f.productId === selectedProduct.id && f.isApproved !== false
  );

  // Check if the authenticated customer has actually purchased this item
  const matchingPurchasedOrder = currentUser
    ? orders.find(
        (o) =>
          (o.userId === currentUser.id ||
            o.customer?.email?.toLowerCase() === currentUser.email.toLowerCase()) &&
          o.items.some((it) => it.productId === selectedProduct.id)
      )
    : undefined;
  const matchingPurchasedItem = matchingPurchasedOrder?.items.find(
    (it) => it.productId === selectedProduct.id
  );

  const handleAddToCart = () => {
    addToCart(selectedProduct, quantity, selectedColorIndex);
  };

  const handleBuyNow = () => {
    addToCart(selectedProduct, quantity, selectedColorIndex);
    setSelectedProduct(null);
    setIsCheckoutOpen(true);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto backdrop-blur-sm bg-black/40">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-[#EAD5C5] overflow-hidden my-auto max-h-[92vh] flex flex-col"
        >
          <button
            id="close-product-modal-btn"
            onClick={() => setSelectedProduct(null)}
            className="absolute top-4 right-4 z-20 p-2 rounded-full bg-white/90 text-[#5B3A29] hover:bg-[#F8D7DA] transition shadow-md"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="overflow-y-auto flex-1 p-6 sm:p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
              {/* Left Gallery */}
              <div className="space-y-4">
                <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-[#FFF8F0] border border-[#EAD5C5] group cursor-zoom-in">
                  <img
                    src={safeImage(
                      selectedProduct.images?.[selectedImageIndex] || selectedProduct.images?.[0]
                    )}
                    alt={selectedProduct.name}
                    className="w-full h-full object-cover group-hover:scale-125 transition-transform duration-500 ease-out"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute bottom-3 left-3 bg-white/80 backdrop-blur-xs px-2.5 py-1 rounded-full text-[10px] text-[#5B3A29] font-medium pointer-events-none">
                    Hover to zoom
                  </div>
                </div>

                {selectedProduct.images.length > 1 && (
                  <div className="flex gap-3 overflow-x-auto pb-1">
                    {selectedProduct.images.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedImageIndex(idx)}
                        className={`w-16 h-16 rounded-xl overflow-hidden border-2 shrink-0 transition ${
                          selectedImageIndex === idx
                            ? 'border-[#5B3A29] ring-2 ring-[#5B3A29]/20'
                            : 'border-[#EAD5C5] opacity-70 hover:opacity-100'
                        }`}
                      >
                        <img
                          src={safeImage(img)}
                          alt="thumbnail"
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Right Details */}
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#708238] uppercase tracking-wider">
                    {selectedProduct.category}
                  </span>
                  <div className="flex items-center gap-1.5 text-xs">
                    <div className="flex text-[#D4A017]">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-[#D4A017]" />
                      ))}
                    </div>
                    <span className="font-bold text-[#2E2E2E]">{selectedProduct.rating}</span>
                    <span className="text-[#6E6863]">({selectedProduct.reviewsCount} reviews)</span>
                  </div>
                </div>

                <div>
                  <h2 className="font-heading text-2xl sm:text-3xl font-bold text-[#5B3A29]">
                    {selectedProduct.name}
                  </h2>
                  <p className="text-xs sm:text-sm text-[#6E6863] mt-1 font-light">
                    {selectedProduct.tagline}
                  </p>
                </div>

                {/* Price & Stock */}
                <div className="p-4 rounded-2xl bg-[#FFF8F0] border border-[#EAD5C5] flex items-center justify-between">
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="font-price font-bold text-3xl text-[#5B3A29] tabular-nums">
                        ₹{selectedProduct.price}
                      </span>
                      {selectedProduct.originalPrice && (
                        <span className="font-price text-sm text-[#9C948D] line-through tabular-nums">
                          ₹{selectedProduct.originalPrice}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-[#708238] font-medium block mt-0.5">
                      Inclusive of all taxes • Handcrafted upon order
                    </span>
                  </div>

                  <div className="text-right">
                    {outOfStock ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-[#842029]">
                        Out of Stock
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#E8F0DC] text-[#4A5D1E]">
                        <span className="w-2 h-2 rounded-full bg-[#708238]" />
                        In Stock ({selectedProduct.stock})
                      </span>
                    )}
                  </div>
                </div>

                {/* Color Selection */}
                {selectedProduct.colors && selectedProduct.colors.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-xs font-semibold text-[#2E2E2E] block">
                      Yarn Color:{' '}
                      <span className="text-[#5B3A29] font-normal">
                        {selectedProduct.colors[selectedColorIndex]?.name}
                      </span>
                    </span>
                    <div className="flex items-center gap-3">
                      {selectedProduct.colors.map((color, idx) => (
                        <button
                          key={idx}
                          onClick={() => setSelectedColorIndex(idx)}
                          className={`p-1 rounded-full border-2 transition ${
                            selectedColorIndex === idx
                              ? 'border-[#5B3A29] scale-110'
                              : 'border-transparent hover:border-gray-300'
                          }`}
                        >
                          <span
                            className="block w-7 h-7 rounded-full shadow-inner border border-gray-200"
                            style={{ backgroundColor: color.hex }}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quantity Selector (stock-capped) */}
                {!outOfStock && (
                  <div className="flex items-center gap-4">
                    <span className="text-xs font-semibold text-[#2E2E2E]">Quantity:</span>
                    <div className="flex items-center border border-[#EAD5C5] rounded-xl bg-[#FFF8F0] overflow-hidden">
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="px-3 py-1 text-sm font-bold text-[#5B3A29] hover:bg-[#F8D7DA]/40 transition"
                      >
                        -
                      </button>
                      <span className="px-4 py-1 font-price text-sm font-bold text-[#2E2E2E] tabular-nums">
                        {quantity}
                      </span>
                      <button
                        disabled={quantity >= selectedProduct.stock}
                        onClick={() =>
                          setQuantity((q) => Math.min(selectedProduct.stock, q + 1))
                        }
                        className="px-3 py-1 text-sm font-bold text-[#5B3A29] hover:bg-[#F8D7DA]/40 transition disabled:opacity-40"
                      >
                        +
                      </button>
                    </div>
                  </div>
                )}

                {/* Delivery Promise */}
                <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-[#F8D7DA]/30 border border-[#F8D7DA] text-xs text-[#5B3A29]">
                  <Truck className="w-5 h-5 text-[#8B4052] shrink-0" />
                  <div>
                    <strong className="block text-[#8B4052]">
                      Delivery Promise: Within 7 Days Across India
                    </strong>
                    <span className="text-[#6E6863]">
                      ₹20 flat delivery under ₹499 • Free shipping ₹499+
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-3 pt-2">
                  <button
                    id="modal-add-to-cart-btn"
                    disabled={outOfStock}
                    onClick={handleAddToCart}
                    className="flex-1 py-3.5 px-4 rounded-full bg-[#5B3A29] hover:bg-[#43291B] text-white font-medium text-sm shadow-md transition flex items-center justify-center gap-2 disabled:opacity-45 disabled:cursor-not-allowed"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>{outOfStock ? 'Sold Out' : 'Add to Cart'}</span>
                  </button>

                  <button
                    id="modal-buy-now-btn"
                    disabled={outOfStock}
                    onClick={handleBuyNow}
                    className="flex-1 py-3.5 px-4 rounded-full bg-[#F8D7DA] hover:bg-[#F2BAC0] text-[#5B3A29] font-semibold text-sm border border-[#F0B8BE] shadow-xs transition disabled:opacity-45 disabled:cursor-not-allowed"
                  >
                    Buy Now
                  </button>

                  <button
                    onClick={() => toggleWishlist(selectedProduct.id)}
                    className={`p-3.5 rounded-full border transition ${
                      wishlisted
                        ? 'bg-[#F8D7DA] border-[#F0B8BE] text-[#C83E4D]'
                        : 'bg-white border-[#EAD5C5] text-[#5B3A29] hover:bg-[#FFF8F0]'
                    }`}
                    aria-label="Wishlist"
                  >
                    <Heart className={`w-5 h-5 ${wishlisted ? 'fill-[#C83E4D]' : ''}`} />
                  </button>
                </div>

                {/* Description */}
                <div className="pt-4 border-t border-[#F0DFD1] space-y-3 text-xs text-[#55504C]">
                  <p className="leading-relaxed">{selectedProduct.description}</p>
                  <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                    <div className="bg-[#FFF8F0] p-2.5 rounded-xl">
                      <span className="font-semibold text-[#5B3A29] block">Yarn Type</span>
                      <span>{selectedProduct.yarnType}</span>
                    </div>
                    <div className="bg-[#FFF8F0] p-2.5 rounded-xl">
                      <span className="font-semibold text-[#5B3A29] block">Care Guide</span>
                      <span>{selectedProduct.careInstructions}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Verified Customer Reviews Section */}
            <div className="mt-12 pt-8 border-t border-[#EAD5C5]">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-heading text-xl font-bold text-[#5B3A29]">
                    Verified Buyer Reviews ({verifiedFeedbacks.length})
                  </h3>
                  <p className="text-xs text-[#6E6863]">
                    Authentic reviews linked exclusively to confirmed DreamQueen orders
                  </p>
                </div>
              </div>

              {matchingPurchasedOrder && matchingPurchasedItem ? (
                <div className="mb-6 p-4 rounded-2xl bg-[#FFF8F0] border-2 border-[#EAD5C5] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#E8F0DC] text-[#4A5D1E] flex items-center justify-center shrink-0">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-[#5B3A29] block">
                        Purchased in Order #{matchingPurchasedOrder.orderNumber}
                      </span>
                      <span className="text-[11px] text-[#6E6863]">
                        Share your verified buyer feedback for this piece.
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() =>
                      setActiveFeedbackTarget({
                        order: matchingPurchasedOrder,
                        item: matchingPurchasedItem
                      })
                    }
                    className="px-4 py-2 rounded-full bg-[#5B3A29] hover:bg-[#43291B] text-white text-xs font-semibold flex items-center gap-1.5"
                  >
                    <Star className="w-3.5 h-3.5 fill-[#F4B41A] text-[#F4B41A]" />
                    <span>Write Verified Review</span>
                  </button>
                </div>
              ) : !currentUser ? (
                <div className="mb-6 p-3.5 rounded-2xl bg-[#FFF8F0] border border-[#EAD5C5] flex items-center justify-between text-xs">
                  <span className="text-[#6E6863]">
                    Purchased this crochet piece? Sign in to leave a verified buyer review.
                  </span>
                  <button
                    onClick={() => {
                      setSelectedProduct(null);
                      openAuthModal('general');
                    }}
                    className="font-bold text-[#5B3A29] underline shrink-0 ml-2"
                  >
                    Sign In
                  </button>
                </div>
              ) : null}

              {verifiedFeedbacks.length === 0 ? (
                <p className="text-xs text-[#6E6863]">
                  Be the first verified buyer to review this handmade creation after delivery!
                </p>
              ) : (
                <div className="space-y-3">
                  {verifiedFeedbacks.map((fb) => (
                    <div
                      key={fb.id}
                      className="p-4 sm:p-5 rounded-2xl bg-[#FFFDFB] border border-[#EAD5C5] space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs sm:text-sm text-[#2E2E2E]">
                            {fb.customerName}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#E8F0DC] text-[#4A5D1E] inline-flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" />
                            <span>Verified Buyer</span>
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-[#D4A017]">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3.5 h-3.5 ${
                                i < fb.rating ? 'fill-[#D4A017]' : 'text-gray-200'
                              }`}
                            />
                          ))}
                        </div>
                      </div>

                      {fb.headline && (
                        <h5 className="font-heading text-xs sm:text-sm font-bold text-[#5B3A29]">
                          "{fb.headline}"
                        </h5>
                      )}
                      <p className="text-xs text-[#55504C] leading-relaxed">{fb.comment}</p>

                      {fb.artisanResponse && (
                        <div className="p-3 rounded-xl bg-[#FFF8F0] border-l-2 border-[#5B3A29] text-[11px] text-[#55504C]">
                          <span className="font-bold text-[#5B3A29] block">
                            DreamQueen Atelier Response:
                          </span>
                          <p className="italic">"{fb.artisanResponse.text}"</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Related Products */}
            {relatedProducts.length > 0 && (
              <div className="mt-12 pt-8 border-t border-[#EAD5C5]">
                <h3 className="font-heading text-xl font-bold text-[#5B3A29] mb-4">
                  You May Also Love
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {relatedProducts.map((rel, idx) => (
                    <div
                      key={`${rel.id}-${idx}`}
                      onClick={() => setSelectedProduct(rel)}
                      className="cursor-pointer group p-2.5 rounded-2xl bg-[#FFF8F0] border border-[#EAD5C5] hover:shadow-md transition"
                    >
                      <img
                        src={safeImage(rel.images?.[0])}
                        alt={rel.name}
                        className="w-full aspect-square object-cover rounded-xl mb-2 group-hover:scale-105 transition-transform"
                      />
                      <p className="text-xs font-semibold text-[#2E2E2E] truncate group-hover:text-[#5B3A29]">
                        {rel.name}
                      </p>
                      <span className="font-price text-xs font-bold text-[#5B3A29]">
                        ₹{rel.price}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
