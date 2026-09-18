import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import {
  X,
  Star,
  ShoppingBag,
  Heart,
  Truck,
  ShieldCheck,
  Check,
  Sparkles,
  ChevronRight,
  MessageSquare,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const ProductDetailModal: React.FC = () => {
  const {
    selectedProduct,
    setSelectedProduct,
    addToCart,
    toggleWishlist,
    isInWishlist,
    products,
    setIsCheckoutOpen,
    feedbacks,
    orders,
    setActiveFeedbackTarget,
    currentUser,
    openAuthModal,
    showToast
  } = useStore();

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedColorIndex, setSelectedColorIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [newReviewAuthor, setNewReviewAuthor] = useState('');
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newReviewText, setNewReviewText] = useState('');
  const [localReviews, setLocalReviews] = useState<
    Array<{ author: string; rating: number; text: string; date: string }>
  >([
    {
      author: 'Simran K.',
      rating: 5,
      text: 'The craftsmanship is unbelievable for this price. The stitching is so neat and tight!',
      date: 'Yesterday'
    },
    {
      author: 'Tanya S.',
      rating: 5,
      text: 'Packed in the sweetest pink parcel with a personalized card. Will order again for gifts.',
      date: '4 days ago'
    }
  ]);

  if (!selectedProduct) return null;

  const wishlisted = isInWishlist(selectedProduct.id);
  const relatedProducts = products
    .filter((p) => p.category === selectedProduct.category && p.id !== selectedProduct.id)
    .slice(0, 4);

  // Verified feedbacks for this product from actual orders
  const verifiedFeedbacks = feedbacks.filter((f) => f.productId === selectedProduct.id);

  // Check if current user has purchased this item in any order
  const matchingPurchasedOrder = orders.find((o) =>
    o.items.some((it) => it.productId === selectedProduct.id)
  );
  const matchingPurchasedItem = matchingPurchasedOrder?.items.find(
    (it) => it.productId === selectedProduct.id
  );

  const handleAddToCart = () => {
    addToCart(selectedProduct, quantity, selectedColorIndex);
  };

  const handleBuyNow = () => {
    addToCart(selectedProduct, quantity, selectedColorIndex);
    setSelectedProduct(null);
    if (!currentUser) {
      openAuthModal('checkout');
    } else {
      setIsCheckoutOpen(true);
    }
  };

  const handleAddReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReviewAuthor || !newReviewText) {
      showToast('Please fill out your name and review', 'error');
      return;
    }
    setLocalReviews([
      {
        author: newReviewAuthor,
        rating: newReviewRating,
        text: newReviewText,
        date: 'Just now'
      },
      ...localReviews
    ]);
    setNewReviewAuthor('');
    setNewReviewText('');
    showToast('Review submitted! Thank you for supporting handmade craft 🌸');
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
          {/* Close button */}
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
              {/* Left Column: Image Gallery with Zoom */}
              <div className="space-y-4">
                <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-[#FFF8F0] border border-[#EAD5C5] group cursor-zoom-in">
                  <img
                    src={selectedProduct.images[selectedImageIndex] || selectedProduct.images[0]}
                    alt={selectedProduct.name}
                    className="w-full h-full object-cover group-hover:scale-125 transition-transform duration-500 ease-out"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute bottom-3 left-3 bg-white/80 backdrop-blur-xs px-2.5 py-1 rounded-full text-[10px] text-[#5B3A29] font-medium pointer-events-none">
                    Hover to zoom
                  </div>
                </div>

                {/* Thumbnails */}
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
                          src={img}
                          alt="thumbnail"
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Right Column: Details & Purchase */}
              <div className="space-y-5">
                {/* Category & Badge */}
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
                    <span className="text-[#8C7A6B]">({selectedProduct.reviewsCount} reviews)</span>
                  </div>
                </div>

                {/* Title & Tagline */}
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
                      <span className="font-price font-bold text-3xl text-[#5B3A29]">
                        ₹{selectedProduct.price}
                      </span>
                      {selectedProduct.originalPrice && (
                        <span className="font-price text-sm text-[#9C948D] line-through">
                          ₹{selectedProduct.originalPrice}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-[#708238] font-medium block mt-0.5">
                      Inclusive of all taxes • Handcrafted upon order
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#E8F0DC] text-[#4A5D1E]">
                      <span className="w-2 h-2 rounded-full bg-[#708238]" />
                      In Stock ({selectedProduct.stock})
                    </span>
                  </div>
                </div>

                {/* Color Selection */}
                {selectedProduct.colors && selectedProduct.colors.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-[#2E2E2E]">
                        Yarn Color:{' '}
                        <span className="text-[#5B3A29] font-normal">
                          {selectedProduct.colors[selectedColorIndex]?.name}
                        </span>
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      {selectedProduct.colors.map((color, idx) => (
                        <button
                          key={idx}
                          onClick={() => setSelectedColorIndex(idx)}
                          className={`group relative p-1 rounded-full border-2 transition ${
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

                {/* Quantity Selector */}
                <div className="flex items-center gap-4">
                  <span className="text-xs font-semibold text-[#2E2E2E]">Quantity:</span>
                  <div className="flex items-center border border-[#EAD5C5] rounded-xl bg-[#FFF8F0] overflow-hidden">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="px-3 py-1 text-sm font-bold text-[#5B3A29] hover:bg-[#F8D7DA]/40 transition"
                    >
                      -
                    </button>
                    <span className="px-4 py-1 font-price text-sm font-bold text-[#2E2E2E]">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="px-3 py-1 text-sm font-bold text-[#5B3A29] hover:bg-[#F8D7DA]/40 transition"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Delivery Promise Badge */}
                <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-[#F8D7DA]/30 border border-[#F8D7DA] text-xs text-[#5B3A29]">
                  <Truck className="w-5 h-5 text-[#8B4052] shrink-0" />
                  <div>
                    <strong className="block text-[#8B4052]">Delivery Promise: Delivered within 7 Days</strong>
                    <span className="text-[#6E6863]">
                      Lovingly made to order & shipped with real-time Shiprocket tracking.
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-3 pt-2">
                  <button
                    id="modal-add-to-cart-btn"
                    onClick={handleAddToCart}
                    className="flex-1 py-3.5 px-4 rounded-full bg-[#5B3A29] hover:bg-[#43291B] text-white font-medium text-sm shadow-md transition flex items-center justify-center gap-2"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>Add to Cart</span>
                  </button>

                  <button
                    id="modal-buy-now-btn"
                    onClick={handleBuyNow}
                    className="flex-1 py-3.5 px-4 rounded-full bg-[#F8D7DA] hover:bg-[#F2BAC0] text-[#5B3A29] font-semibold text-sm border border-[#F0B8BE] shadow-xs transition"
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

                {/* Description & Specs Tabs */}
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

            {/* Customer Reviews Section inside Modal */}
            <div className="mt-12 pt-8 border-t border-[#EAD5C5]">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-heading text-xl font-bold text-[#5B3A29]">
                    Customer Reviews & Feedback ({verifiedFeedbacks.length + localReviews.length})
                  </h3>
                  <p className="text-xs text-[#6E6863]">Verified craft reviews from handmade crochet buyers</p>
                </div>
              </div>

              {/* Verified Buyer Prompt if user purchased this item */}
              {matchingPurchasedOrder && matchingPurchasedItem && (
                <div className="mb-6 p-4 rounded-2xl bg-[#FFF8F0] border-2 border-[#EAD5C5] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#E8F0DC] text-[#4A5D1E] flex items-center justify-center shrink-0">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-[#5B3A29] block">
                        You purchased this piece in Order #{matchingPurchasedOrder.orderNumber}!
                      </span>
                      <span className="text-[11px] text-[#6E6863]">
                        Share your feedback to support our artisan collective.
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
                    className="self-start sm:self-auto px-4 py-2 rounded-full bg-[#5B3A29] hover:bg-[#43291B] text-white text-xs font-semibold flex items-center gap-1.5 transition shadow-2xs"
                  >
                    <Star className="w-3.5 h-3.5 fill-[#F4B41A] text-[#F4B41A]" />
                    <span>Rate & Leave Feedback</span>
                  </button>
                </div>
              )}

              {/* Verified Reviews from Orders */}
              {verifiedFeedbacks.length > 0 && (
                <div className="space-y-3 mb-6">
                  {verifiedFeedbacks.map((fb) => (
                    <div
                      key={fb.id}
                      className="p-4 sm:p-5 rounded-2xl bg-[#FFFDFB] border border-[#EAD5C5] space-y-2.5 shadow-2xs"
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
                          {fb.selectedColor && (
                            <span className="text-[10px] text-[#8C7A6B] hidden sm:inline">
                              • Color: {fb.selectedColor.name}
                            </span>
                          )}
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

                      {fb.tags && fb.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {fb.tags.map((tag, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#FFF8F0] border border-[#EAD5C5] text-[#5B3A29]"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {fb.photoUrl && (
                        <div className="pt-2">
                          <img
                            src={fb.photoUrl}
                            alt="Customer photo"
                            className="w-20 h-20 rounded-xl object-cover border border-[#EAD5C5]"
                          />
                        </div>
                      )}

                      {fb.artisanResponse && (
                        <div className="p-3 rounded-xl bg-[#FFF8F0] border-l-2 border-[#5B3A29] text-[11px] text-[#55504C] space-y-0.5">
                          <span className="font-bold text-[#5B3A29] block">
                            🌸 DreamQueen Artisan Response:
                          </span>
                          <p className="italic">"{fb.artisanResponse.text}"</p>
                        </div>
                      )}

                      <span className="text-[10px] text-[#8C7A6B] block">
                        Reviewed on {new Date(fb.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Additional Review list */}
              <div className="space-y-3 mb-6">
                {localReviews.map((rev, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-[#FFF8F0] border border-[#EAD5C5]/60 text-xs">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-[#2E2E2E]">{rev.author}</span>
                      <div className="flex items-center gap-1 text-[#D4A017]">
                        {[...Array(rev.rating)].map((_, i) => (
                          <Star key={i} className="w-3 h-3 fill-[#D4A017]" />
                        ))}
                      </div>
                    </div>
                    <p className="text-[#55504C]">{rev.text}</p>
                    <span className="text-[10px] text-[#8C7A6B] mt-1 block">{rev.date}</span>
                  </div>
                ))}
              </div>

              {/* Write review form */}
              <form onSubmit={handleAddReview} className="bg-white p-4 rounded-2xl border border-[#EAD5C5] space-y-3">
                <h4 className="text-xs font-bold text-[#5B3A29]">Leave a Review & Rating</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    required
                    placeholder="Your Name"
                    value={newReviewAuthor}
                    onChange={(e) => setNewReviewAuthor(e.target.value)}
                    className="px-3 py-2 text-xs rounded-xl border border-[#EAD5C5] bg-[#FDF9F4] focus:outline-none focus:ring-1 focus:ring-[#5B3A29]"
                  />
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[#6E6863]">Rating:</span>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setNewReviewRating(s)}
                          className="text-[#D4A017] p-0.5"
                        >
                          <Star
                            className={`w-4 h-4 ${
                              s <= newReviewRating ? 'fill-[#D4A017]' : 'text-gray-300'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <textarea
                  required
                  rows={2}
                  placeholder="How soft is the yarn? Did you love the handmade design?"
                  value={newReviewText}
                  onChange={(e) => setNewReviewText(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#EAD5C5] bg-[#FDF9F4] focus:outline-none focus:ring-1 focus:ring-[#5B3A29]"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#5B3A29] text-white text-xs font-semibold hover:bg-[#43291B] transition"
                >
                  Submit Review
                </button>
              </form>
            </div>

            {/* Related Products row */}
            {relatedProducts.length > 0 && (
              <div className="mt-12 pt-8 border-t border-[#EAD5C5]">
                <h3 className="font-heading text-xl font-bold text-[#5B3A29] mb-4">
                  You May Also Love
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {relatedProducts.map((rel) => (
                    <div
                      key={rel.id}
                      onClick={() => {
                        setSelectedProduct(rel);
                        setSelectedImageIndex(0);
                        setSelectedColorIndex(0);
                      }}
                      className="cursor-pointer group p-2.5 rounded-2xl bg-[#FFF8F0] border border-[#EAD5C5] hover:shadow-md transition"
                    >
                      <img
                        src={rel.images[0]}
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
