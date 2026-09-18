import React from 'react';
import { Star, CheckCircle, Heart, Quote } from 'lucide-react';
import { motion } from 'motion/react';

const REVIEWS = [
  {
    id: 1,
    name: 'Pooja Verma',
    city: 'Bengaluru',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    rating: 5,
    title: 'The rose hair tie is beyond magical!',
    comment:
      'I was so pleasantly surprised by how plush and well-knitted the rose hair tie was for just ₹50! It holds my hair without snagging. Got so many compliments in college!',
    productPurchased: 'Handmade Rose Hair Tie',
    date: '3 days ago'
  },
  {
    id: 2,
    name: 'Meera Deshmukh',
    city: 'Pune',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80',
    rating: 5,
    title: 'Cutest sunflower keychain ever 🌻',
    comment:
      'The sunflower keychain is bright, cheerful, and the brass ring is super sturdy. Arrived in just 5 days via Shiprocket with adorable pink wrapping paper.',
    productPurchased: 'Blooming Sunflower Keychain',
    date: '1 week ago'
  },
  {
    id: 3,
    name: 'Ananya Roy',
    city: 'Kolkata',
    avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200&auto=format&fit=crop&q=80',
    rating: 5,
    title: 'The bouquet that will never die',
    comment:
      'Gifted the lavender and tulip bouquet to my best friend for her birthday. She literally cried happy tears. The milk cotton yarn is so soft and smells like fresh lavender!',
    productPurchased: 'Everlasting Lavender Bouquet',
    date: '2 weeks ago'
  }
];

export const CustomerReviews: React.FC = () => {
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
            Read authentic reviews from lovers of our handmade crochet treasures
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {REVIEWS.map((review, idx) => (
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

                {/* Stars */}
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

              {/* Author & Product */}
              <div className="mt-6 pt-4 border-t border-[#F0DFD1] flex items-center gap-3">
                <img
                  src={review.avatar}
                  alt={review.name}
                  className="w-11 h-11 rounded-full object-cover border-2 border-[#F8D7DA]"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-bold text-[#2E2E2E] truncate">{review.name}</p>
                    <CheckCircle className="w-3.5 h-3.5 text-[#708238] shrink-0" title="Verified Buyer" />
                  </div>
                  <p className="text-[11px] text-[#8C7A6B]">
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
