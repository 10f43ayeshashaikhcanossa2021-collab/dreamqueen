import React from 'react';
import { Heart, Sparkles, Feather, IndianRupee, Gift } from 'lucide-react';
import { motion } from 'motion/react';

const REASONS = [
  {
    icon: Sparkles,
    title: '100% Handmade',
    description: 'Every single loop and stitch is lovingly hand-crocheted by passionate women artisans.',
    color: '#F8D7DA',
    iconColor: '#8B4052'
  },
  {
    icon: Feather,
    title: 'Soft Premium Yarn',
    description: 'Crafted exclusively with combed organic milk cotton yarn that feels cloud-soft and skin-safe.',
    color: '#FFF8F0',
    iconColor: '#708238'
  },
  {
    icon: IndianRupee,
    title: 'Truly Affordable',
    description: 'Fair, transparent artisan pricing starting at just ₹50 so everyone can own a handmade treasure.',
    color: '#FFF3A8',
    iconColor: '#B37D00'
  },
  {
    icon: Gift,
    title: 'Perfect for Gifting',
    description: 'Comes packed in eco-friendly craft paper boxes with pastel tissue and handwritten note cards.',
    color: '#E8F0DC',
    iconColor: '#53682B'
  },
  {
    icon: Heart,
    title: 'Made with Love',
    description: 'Not mass produced by cold machines. Infused with patience, joy, and delicate attention to detail.',
    color: '#FCECEE',
    iconColor: '#C83E4D'
  }
];

export const WhyChooseUs: React.FC = () => {
  return (
    <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <span className="text-xs font-semibold text-[#708238] uppercase tracking-wider block mb-1">
          The DreamQueen Difference
        </span>
        <h2 className="font-heading text-3xl sm:text-4xl font-bold text-[#5B3A29]">
          Why Choose DreamQueen
        </h2>
        <p className="text-sm text-[#6E6863] mt-2">
          We bring the warmth of authentic handcrafted crochet directly into your wardrobe and home
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        {REASONS.map((reason, idx) => {
          const Icon = reason.icon;
          return (
            <motion.div
              key={reason.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: idx * 0.1 }}
              className="bg-white rounded-3xl p-6 border border-[#EAD5C5]/80 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col items-center text-center group"
            >
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 shadow-xs"
                style={{ backgroundColor: reason.color }}
              >
                <Icon className="w-6 h-6" style={{ color: reason.iconColor }} />
              </div>

              <h3 className="font-heading text-base font-bold text-[#5B3A29] mb-2">
                {reason.title}
              </h3>

              <p className="text-xs text-[#6E6863] leading-relaxed">
                {reason.description}
              </p>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
};
