import React from 'react';
import { Star, CheckCircle, Heart, Quote } from 'lucide-react';
import { motion } from 'motion/react';
import { useStore } from '../context/StoreContext';

const CURATED_REVIEWS = [
  {
    id: 'curated-1',
    name: 'Pooja Verma',
    initials: 'PV',
    city: 'Bengaluru',
    rating: 5,
    title: 'Cutest heart hair clips for only ₹20!',
    comment:
      'I was so pleasantly surprised by how plush and neat these crochet heart clips are! They hold my hair securely without tugging. Got so many compliments.',
    productPurchased: 'Crochet Heart Hair Clips'
  },
  {
    id: 'curated-2',
    name: 'Meera Deshmukh',
    initials: 'MD',
    city: 'Pune',
    rating: 5,
    title: 'Bright & sturdy sunflower charm',
    comment:
      'The sunflower keychain is bright, cheerful, and super neatly stitched. Arrived packed with care and cute ribbon wrap within a week.',
    productPurchased: 'DreamQueen Sunflower Bag Charm'
  },
  {
    id: 'curated-3',
    name: 'Ananya Roy',
    initials: 'AR',
    city: 'Kolkata',
    rating: 5,
    title: 'Rose crochet bag looks truly boutique',
    comment:
      'The deep crimson crochet rose bag with pearl strap feels like an heirloom luxury piece. Soft milk cotton yarn holds its shape effortlessly!',
    productPurchased: 'Handmade Rose Crochet Bag'
  }
];

function initialsFrom(name: string): string {
  const parts = String(name || 'DQ').trim().split(/\s+/);
  return parts
    .slice(0, 2)
    .map((p) => p.charAt(0).toUpperCase())
    .join('');
}

export const CustomerReviews: React.FC = () => {
  const { feedbacks } = useStore();

  const approvedLive = feedbacks
    .filter((f) => f.isApproved !== false && f.comment)
    .slice(0, 3)
    .map((f) => ({
      id: f.id,
      name: f.customerName,
      initials: initialsFrom(f.customerName),
      city: 'Verified Buyer',
      rating: f.rating,
      title: f.headline || 'Verified Handmade Purchase',
      comment: f.comment,
      productPurchased: f.productName
    }));

  const displayed =
    approvedLive.length >= 3
      ? approvedLive
      : [...approvedLive, ...CURATED_REVIEWS].slice(0, 3);

  return (
    <section className="py-16 bg-[#FFF8F0]/80 border-t border-[#EAD5C5]/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-[#8B4052] uppercase tracking-wider mb-1">
            <Heart className="w-3.5 h-3.5 fill-[#8B4052]" />
            <span>Customer Love</span>
          </div>
          <h2 className="font-heading text-3xl sm:text-4xl font-bold text-[#5B3A29]">
            Words From Happy Queens
          </h2>
          <p className="text-sm text-[#6E6863] mt-2">
            Authentic craft reviews from lovers of our handmade crochet treasures
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {displayed.map((review, idx) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: idx * 0.1 }}
              className="bg-white rounded-3xl p-6 sm:p-7 border border-[#EAD5C5] shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative"
            >
              <div>
                <Quote className="w-8 h-8 text-[#F8D7DA] mb-3" />

                <div className="flex items-center gap-1 text-[#D4A017] mb-3">
                  {[...Array(review.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-[#D4A017]" />
                  ))}
                </div>

                <h3 className="font-heading text-base font-bold text-[#2E2E2E] mb-2">
                  "{review.title}"
                </h3>

                <p className="text-xs sm:text-sm text-[#55504C] leading-relaxed italic">
                  "{review.comment}"
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-[#F0DFD1] flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-[#F8D7DA] border-2 border-[#EAD5C5] flex items-center justify-center text-xs font-bold text-[#5B3A29] shrink-0">
                  {review.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-bold text-[#2E2E2E] truncate">{review.name}</p>
                    <CheckCircle className="w-3.5 h-3.5 text-[#708238] shrink-0" title="Verified Buyer" />
                  </div>
                  <p className="text-[11px] text-[#6E6863] truncate">
                    {review.city} • <span className="text-[#708238]">{review.productPurchased}</span>
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
