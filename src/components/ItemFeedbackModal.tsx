import React, { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import {
  X,
  Star,
  CheckCircle2,
  Sparkles,
  Camera,
  Heart,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Package,
  ShieldCheck,
  Send
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const CRAFT_TAGS = [
  '🧶 Ultra-Soft Milk Cotton',
  '🪡 Neat & Tight Stitching',
  '🎀 Aesthetic Gift Wrap',
  '⚡ 7-Day Express Delivery',
  '💖 Looks Exactly as Pictured',
  '🎁 Perfect for Gifting',
  '🌸 Skin-Friendly & Gentle',
  '🪙 High Value for Money'
];

const PHOTO_PRESETS = [
  {
    label: 'Gift Packaging',
    url: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=600&auto=format&fit=crop&q=80'
  },
  {
    label: 'Hair Accessory',
    url: 'https://images.unsplash.com/photo-1526047932273-341f2a7631f9?w=600&auto=format&fit=crop&q=80'
  },
  {
    label: 'Bag Charm / Keychain',
    url: 'https://images.unsplash.com/photo-1597848212624-a19eb35e2651?w=600&auto=format&fit=crop&q=80'
  }
];

export const ItemFeedbackModal: React.FC = () => {
  const {
    activeFeedbackTarget,
    setActiveFeedbackTarget,
    submitFeedback,
    getFeedbackForOrderItem,
    currentUser
  } = useStore();

  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [headline, setHeadline] = useState('');
  const [comment, setComment] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([
    '🧶 Ultra-Soft Milk Cotton',
    '⚡ 7-Day Express Delivery'
  ]);
  const [photoUrl, setPhotoUrl] = useState<string>('');
  const [recommend, setRecommend] = useState<boolean>(true);
  const [isCustomPhotoInputOpen, setIsCustomPhotoInputOpen] = useState(false);

  // Load existing feedback if already submitted
  useEffect(() => {
    if (activeFeedbackTarget) {
      const existing = getFeedbackForOrderItem(
        activeFeedbackTarget.order.orderNumber,
        activeFeedbackTarget.item.productId
      );
      if (existing) {
        setRating(existing.rating);
        setHeadline(existing.headline || '');
        setComment(existing.comment || '');
        setSelectedTags(existing.tags || []);
        setPhotoUrl(existing.photoUrl || '');
        setRecommend(existing.recommend ?? true);
      } else {
        // Reset defaults
        setRating(5);
        setHeadline('Beautiful craftsmanship & super soft yarn!');
        setComment('');
        setSelectedTags(['🧶 Ultra-Soft Milk Cotton', '⚡ 7-Day Express Delivery']);
        setPhotoUrl('');
        setRecommend(true);
      }
    }
  }, [activeFeedbackTarget]);

  if (!activeFeedbackTarget) return null;

  const { order, item } = activeFeedbackTarget;
  const existingFeedback = getFeedbackForOrderItem(order.orderNumber, item.productId);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const getRatingLabel = (score: number) => {
    switch (score) {
      case 1:
        return 'Needs Improvement 😔';
      case 2:
        return 'Could Be Better 😐';
      case 3:
        return 'Good Handcrafting 🙂';
      case 4:
        return 'Very Pleased! 😊';
      case 5:
        return 'Pure Magic! Loved Every Stitch! 🌸✨';
      default:
        return 'Rate your piece';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;

    submitFeedback({
      orderId: order.id,
      orderNumber: order.orderNumber,
      productId: item.productId,
      productName: item.productName,
      productImage: item.image,
      selectedColor: item.color,
      customerName: currentUser?.name || order.customer.name || 'Valued Customer',
      customerEmail: currentUser?.email || order.customer.email || 'dreamqueen29@gmail.com',
      rating,
      headline: headline.trim() || 'Handmade Crochet Feedback',
      comment: comment.trim(),
      tags: selectedTags,
      photoUrl: photoUrl.trim() || undefined,
      recommend
    });
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto backdrop-blur-sm bg-black/50">
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 16 }}
          className="relative bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-[#EAD5C5] overflow-hidden my-auto max-h-[92vh] flex flex-col"
        >
          {/* Header */}
          <div className="p-5 sm:p-6 border-b border-[#F0DFD1] bg-[#FFF8F0] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-full bg-[#F8D7DA] flex items-center justify-center text-lg shrink-0">
                🌸
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-heading text-lg sm:text-xl font-bold text-[#5B3A29]">
                    {existingFeedback ? 'Update Item Review' : 'Review Purchased Item'}
                  </h3>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E8F0DC] text-[#4A5D1E]">
                    <ShieldCheck className="w-3 h-3" />
                    <span>Verified Purchase</span>
                  </span>
                </div>
                <p className="text-xs text-[#8C7A6B]">
                  Order #{order.orderNumber} • Placed on {new Date(order.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            <button
              onClick={() => setActiveFeedbackTarget(null)}
              className="p-2 rounded-full hover:bg-white/80 text-[#5B3A29] transition"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body Form */}
          <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-5 sm:p-7 space-y-6">
            {/* Purchased Item Snapshot */}
            <div className="flex items-center gap-4 p-3.5 rounded-2xl bg-[#FDF9F4] border border-[#EAD5C5]">
              <img
                src={item.image}
                alt={item.productName}
                className="w-16 h-16 rounded-xl object-cover border border-[#EAD5C5] shrink-0"
              />
              <div className="flex-1 min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#708238] block">
                  Purchased Item
                </span>
                <h4 className="font-heading text-sm sm:text-base font-bold text-[#2E2E2E] truncate">
                  {item.productName}
                </h4>
                <div className="flex items-center gap-2 mt-1 text-xs text-[#6E6863]">
                  <span className="flex items-center gap-1">
                    <span
                      className="w-3 h-3 rounded-full border border-gray-300 inline-block"
                      style={{ backgroundColor: item.color.hex }}
                    />
                    <span>{item.color.name}</span>
                  </span>
                  <span>•</span>
                  <span>Qty: {item.quantity}</span>
                  <span>•</span>
                  <span className="font-bold text-[#5B3A29]">₹{item.price * item.quantity}</span>
                </div>
              </div>
            </div>

            {/* Existing Artisan Response Display if present */}
            {existingFeedback?.artisanResponse && (
              <div className="p-4 rounded-2xl bg-[#FFF8F0] border-2 border-[#EAD5C5] space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-bold text-[#8B4052]">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Artisan Response ({existingFeedback.artisanResponse.author})</span>
                </div>
                <p className="text-xs text-[#55504C] italic leading-relaxed">
                  "{existingFeedback.artisanResponse.text}"
                </p>
                <span className="text-[10px] text-[#8C7A6B] block">
                  Replied on {new Date(existingFeedback.artisanResponse.respondedAt).toLocaleDateString()}
                </span>
              </div>
            )}

            {/* 1. Overall Rating */}
            <div className="space-y-2 text-center bg-white p-4 rounded-2xl border border-[#EAD5C5]">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#5B3A29]">
                Overall Craft Rating *
              </label>

              <div className="flex items-center justify-center gap-2 py-1">
                {[1, 2, 3, 4, 5].map((star) => {
                  const active = (hoverRating || rating) >= star;
                  return (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="p-1 transition-transform hover:scale-125 focus:outline-none"
                    >
                      <Star
                        className={`w-8 h-8 ${
                          active
                            ? 'text-[#D4A017] fill-[#D4A017]'
                            : 'text-gray-300 hover:text-[#D4A017]/40'
                        } transition-colors`}
                      />
                    </button>
                  );
                })}
              </div>

              <p className="text-xs font-semibold text-[#8B4052] h-4">
                {getRatingLabel(hoverRating || rating)}
              </p>
            </div>

            {/* 2. Craft Satisfaction Tags */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-[#55504C]">
                What did you love about this piece? (Tap to select)
              </label>
              <div className="flex flex-wrap gap-2">
                {CRAFT_TAGS.map((tag) => {
                  const isSelected = selectedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition border ${
                        isSelected
                          ? 'bg-[#5B3A29] text-white border-[#5B3A29] shadow-2xs'
                          : 'bg-white text-[#55504C] border-[#EAD5C5] hover:bg-[#FFF8F0]'
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Review Headline */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#55504C]">
                Review Headline *
              </label>
              <input
                type="text"
                required
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder="e.g., Cutest hair tie ever, yarn is so soft!"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#EAD5C5] bg-[#FDF9F4] text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#5B3A29]/20 focus:border-[#5B3A29]"
              />
            </div>

            {/* 4. Detailed Feedback Comment */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="block text-xs font-bold text-[#55504C]">
                  Your Experience & Feedback *
                </label>
                <span className="text-[11px] text-[#8C7A6B]">Min. 10 characters</span>
              </div>
              <textarea
                required
                rows={4}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Describe how the milk cotton yarn feels, how you styled or used the item, the packaging, delivery experience, or any feedback for the artisan..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#EAD5C5] bg-[#FDF9F4] text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#5B3A29]/20 focus:border-[#5B3A29]"
              />
            </div>

            {/* 5. Customer Photo Attachment */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-[#55504C] flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-[#708238]" />
                  <span>Attach Customer Photo (Optional)</span>
                </label>
                <button
                  type="button"
                  onClick={() => setIsCustomPhotoInputOpen(!isCustomPhotoInputOpen)}
                  className="text-[11px] text-[#5B3A29] underline hover:text-[#43291B]"
                >
                  {isCustomPhotoInputOpen ? 'Hide URL input' : 'Custom Image URL'}
                </button>
              </div>

              {/* Presets */}
              <div className="grid grid-cols-3 gap-2">
                {PHOTO_PRESETS.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setPhotoUrl(photoUrl === p.url ? '' : p.url)}
                    className={`relative rounded-xl overflow-hidden border-2 text-left group transition ${
                      photoUrl === p.url
                        ? 'border-[#708238] ring-2 ring-[#708238]/30'
                        : 'border-[#EAD5C5] opacity-80 hover:opacity-100'
                    }`}
                  >
                    <img src={p.url} alt={p.label} className="w-full h-14 object-cover" />
                    <span className="block text-[10px] font-semibold text-[#5B3A29] p-1 truncate bg-white/90">
                      {p.label}
                    </span>
                    {photoUrl === p.url && (
                      <div className="absolute top-1 right-1 p-0.5 rounded-full bg-[#708238] text-white">
                        <CheckCircle2 className="w-3 h-3" />
                      </div>
                    )}
                  </button>
                ))}
              </div>

              {isCustomPhotoInputOpen && (
                <input
                  type="url"
                  value={photoUrl}
                  onChange={(e) => setPhotoUrl(e.target.value)}
                  placeholder="https://example.com/my-crochet-photo.jpg"
                  className="w-full px-3.5 py-2 rounded-xl border border-[#EAD5C5] bg-[#FDF9F4] text-xs focus:outline-none focus:ring-1 focus:ring-[#5B3A29]"
                />
              )}
            </div>

            {/* 6. Recommendation */}
            <div className="p-3.5 rounded-2xl bg-[#FFF8F0] border border-[#EAD5C5] flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-[#5B3A29] block">
                  Would you recommend this handmade piece?
                </span>
                <span className="text-[11px] text-[#6E6863]">
                  Helps friends and fellow shoppers discover our atelier
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setRecommend(true)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition ${
                    recommend
                      ? 'bg-[#708238] text-white shadow-2xs'
                      : 'bg-white text-gray-600 border border-gray-200'
                  }`}
                >
                  <ThumbsUp className="w-3 h-3" />
                  <span>Yes</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRecommend(false)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition ${
                    !recommend
                      ? 'bg-[#842029] text-white shadow-2xs'
                      : 'bg-white text-gray-600 border border-gray-200'
                  }`}
                >
                  <ThumbsDown className="w-3 h-3" />
                  <span>No</span>
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-3 border-t border-[#F0DFD1] flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setActiveFeedbackTarget(null)}
                className="px-5 py-2.5 rounded-full text-xs font-semibold text-[#6E6863] hover:bg-gray-100 transition"
              >
                Cancel
              </button>

              <button
                type="submit"
                className="flex-1 py-3 px-6 rounded-full bg-[#5B3A29] hover:bg-[#43291B] text-white font-semibold text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
              >
                <Send className="w-4 h-4" />
                <span>
                  {existingFeedback ? 'Update Feedback' : 'Submit Review & Support Artisans 🌸'}
                </span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
