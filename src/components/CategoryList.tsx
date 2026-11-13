import React from 'react';
import { useStore } from '../context/StoreContext';
import { ProductCategory } from '../types';
import { motion } from 'motion/react';
import { safeImage } from '../utils/imageHelper';

interface CategoryItem {
  id: ProductCategory;
  name: string;
  image: string;
  count: string;
  accent: string;
}

const CATEGORIES: CategoryItem[] = [
  {
    id: 'Keychains',
    name: 'Keychains & Charms',
    image: '/assets/aistudio/cherry_keychain_____________dm_to_order_on_8097706536_cad75670.jpg',
    count: 'Cherries, Bows & Sunflowers',
    accent: '#FFF3A8'
  },
  {
    id: 'Hair Accessories',
    name: 'Hair Accessories',
    image: '/assets/aistudio/hair_clip_____47816559.jpg',
    count: 'Heart Clips & Bhandhana',
    accent: '#F8D7DA'
  },
  {
    id: 'Bags & Pouches',
    name: 'Bags & Pouches',
    image: '/assets/aistudio/rose_bag_crochet____dm_to_order_on_8097706536_e6644b1f.jpg',
    count: 'Rose Bags with Pearls',
    accent: '#FFE6CC'
  },
  {
    id: 'Accessories',
    name: 'Phone & Tech Cases',
    image: '/assets/aistudio/WhatsApp_Image_2026-11-10_at_6.57.38_PM_51e04cb2.jpeg',
    count: 'Plush Bow Covers',
    accent: '#E2D9F3'
  },
  {
    id: 'Gifts',
    name: 'Talisman & Gifts',
    image: '/assets/aistudio/WhatsApp_Image_2026-11-10_at_6.57.36_PM_8d16b57e.jpeg',
    count: 'Evil Eye & Tassels',
    accent: '#D1E7DD'
  },
  {
    id: 'Custom Orders',
    name: 'Custom Crochet',
    image: '/assets/aistudio/WhatsApp_Image_2026-11-10_at_6.57.34_PM__1__056e15ac.jpeg',
    count: 'Bespoke Creations',
    accent: '#FCECEE'
  }
];

export const CategoryList: React.FC = () => {
  const { setActiveTab, setSelectedShopCategory } = useStore();

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
                  setSelectedShopCategory(cat.id);
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
                    src={safeImage(cat.image)}
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
