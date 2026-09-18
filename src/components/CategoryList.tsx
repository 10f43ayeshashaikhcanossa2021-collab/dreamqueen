import React from 'react';
import { useStore } from '../context/StoreContext';
import { ProductCategory } from '../types';
import { motion } from 'motion/react';

interface CategoryItem {
  id: ProductCategory;
  name: string;
  image: string;
  count: string;
  accent: string;
}

const CATEGORIES: CategoryItem[] = [
  {
    id: 'Hair Accessories',
    name: 'Hair Accessories',
    image: 'https://images.unsplash.com/photo-1526047932273-341f2a7631f9?w=500&auto=format&fit=crop&q=80',
    count: 'Clips & Scrunchies',
    accent: '#F8D7DA'
  },
  {
    id: 'Keychains',
    name: 'Keychains',
    image: 'https://images.unsplash.com/photo-1597848212624-a19eb35e2651?w=500&auto=format&fit=crop&q=80',
    count: 'Sunflowers & Charms',
    accent: '#FFF3A8'
  },
  {
    id: 'Bookmarks',
    name: 'Bookmarks',
    image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500&auto=format&fit=crop&q=80',
    count: 'Sprouts & Daisies',
    accent: '#D1E7DD'
  },
  {
    id: 'Flowers',
    name: 'Flowers',
    image: 'https://images.unsplash.com/photo-1527061011665-3652c757a4d4?w=500&auto=format&fit=crop&q=80',
    count: 'Everlasting Bouquets',
    accent: '#E2D9F3'
  },
  {
    id: 'Gifts',
    name: 'Gifts & Pouches',
    image: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=500&auto=format&fit=crop&q=80',
    count: 'Mug Rugs & Bags',
    accent: '#FFE6CC'
  },
  {
    id: 'Custom Orders',
    name: 'Custom Orders',
    image: 'https://images.unsplash.com/photo-1584992236310-6edddc08acff?w=500&auto=format&fit=crop&q=80',
    count: 'Bespoke Creations',
    accent: '#FCECEE'
  }
];

export const CategoryList: React.FC = () => {
  const { setActiveTab } = useStore();

  return (
    <section className="py-14 bg-[#FFF8F0]/70 border-y border-[#EAD5C5]/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-xs font-handwriting text-2xl text-[#708238] block font-semibold">
            Handcrafted with love
          </span>
          <h2 className="font-heading text-3xl sm:text-4xl font-bold text-[#5B3A29]">
            Explore by Category
          </h2>
          <p className="text-sm text-[#6E6863] mt-2">
            Discover charming handmade crochet creations designed to brighten your everyday
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6 sm:gap-8">
          {CATEGORIES.map((cat, idx) => (
            <motion.button
              key={cat.id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: idx * 0.08 }}
              onClick={() => {
                if (cat.id === 'Custom Orders') {
                  setActiveTab('custom');
                } else {
                  setActiveTab('shop');
                }
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="flex flex-col items-center group text-center cursor-pointer focus:outline-none"
            >
              {/* Circular Card with smooth hover lift */}
              <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full p-1.5 border-2 border-[#EAD5C5] group-hover:border-[#5B3A29] group-hover:scale-105 transition-all duration-300 shadow-sm group-hover:shadow-md bg-white">
                <div className="w-full h-full rounded-full overflow-hidden relative">
                  <img
                    src={cat.image}
                    alt={cat.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-[#5B3A29]/10 group-hover:bg-transparent transition-colors" />
                </div>
              </div>

              {/* Title & Count */}
              <h3 className="mt-3.5 font-heading text-sm sm:text-base font-semibold text-[#5B3A29] group-hover:text-[#43291B] transition">
                {cat.name}
              </h3>
              <p className="text-[11px] text-[#708238] font-medium mt-0.5">
                {cat.count}
              </p>
            </motion.button>
          ))}
        </div>
      </div>
    </section>
  );
};
