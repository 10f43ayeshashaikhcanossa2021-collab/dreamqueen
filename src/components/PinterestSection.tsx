import React from 'react';
import { Pin, Heart, ExternalLink } from 'lucide-react';

const PINTEREST_PINS = [
  {
    id: 1,
    image: 'https://images.unsplash.com/photo-1607344645866-009c320c5ab8?w=600&auto=format&fit=crop&q=80',
    saves: '1.2k',
    tag: '#crochetrose',
    title: 'Everlasting Red Rose'
  },
  {
    id: 2,
    image: 'https://images.unsplash.com/photo-1597848212624-a19eb35e2651?w=600&auto=format&fit=crop&q=80',
    saves: '840',
    tag: '#sunflowervibes',
    title: 'Warm Sunshine Bloom'
  },
  {
    id: 3,
    image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80',
    saves: '2.1k',
    tag: '#crochetbookmark',
    title: 'Daisy Sprout Bookmark'
  },
  {
    id: 4,
    image: 'https://images.unsplash.com/photo-1527061011665-3652c757a4d4?w=600&auto=format&fit=crop&q=80',
    saves: '3.4k',
    tag: '#everlastingbouquet',
    title: 'Pastel Garden Bouquet'
  },
  {
    id: 5,
    image: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=600&auto=format&fit=crop&q=80',
    saves: '950',
    tag: '#strawberrypouch',
    title: 'Sweet Berry Drawstring'
  },
  {
    id: 6,
    image: 'https://images.unsplash.com/photo-1526047932273-341f2a7631f9?w=600&auto=format&fit=crop&q=80',
    saves: '1.5k',
    tag: '#daisyclips',
    title: 'Blooming Hair Clips'
  }
];

export const PinterestSection: React.FC = () => {
  const pinterestUrl = "https://in.pinterest.com/ayeshalk2025/?actingBusinessId=1147221842487308120";

  return (
    <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
        <div>
          <span className="text-xs font-semibold text-[#E60023] uppercase tracking-wider block mb-1 flex items-center gap-1.5">
            <Pin className="w-3.5 h-3.5 text-[#E60023]" />
            Pinterest Moodboards & Ideas
          </span>
          <h2 className="font-heading text-3xl font-bold text-[#5B3A29]">
            Inspiration by @ayeshalk2025
          </h2>
          <p className="text-xs sm:text-sm text-[#6E6863] mt-1">
            Pin your favorite handmade bouquets, bookmarks & cottagecore yarn aesthetics to your moodboards!
          </p>
        </div>

        <a
          href={pinterestUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#E60023] text-white hover:bg-[#C8001F] text-xs font-semibold shadow-xs transition w-fit"
        >
          <Pin className="w-4 h-4" />
          <span>Follow on Pinterest</span>
          <ExternalLink className="w-3.5 h-3.5 opacity-80" />
        </a>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {PINTEREST_PINS.map((pin) => (
          <a
            key={pin.id}
            href={pinterestUrl}
            target="_blank"
            rel="noreferrer"
            className="group relative aspect-square rounded-2xl overflow-hidden bg-white border border-[#EAD5C5] shadow-xs cursor-pointer block"
          >
            <img
              src={pin.image}
              alt={pin.title}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              loading="lazy"
            />
            {/* Overlay on hover */}
            <div className="absolute inset-0 bg-[#5B3A29]/75 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white p-3 text-center">
              <div className="w-8 h-8 rounded-full bg-[#E60023] flex items-center justify-center mb-1 text-white shadow-xs">
                <Pin className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-white line-clamp-1">{pin.title}</span>
              <div className="flex items-center gap-1 text-[11px] font-semibold text-[#FFF8F0] mt-1">
                <Heart className="w-3 h-3 fill-[#F8D7DA] text-[#F8D7DA]" />
                <span>{pin.saves} saves</span>
              </div>
              <span className="text-[10px] text-[#F8D7DA] mt-0.5 font-mono">{pin.tag}</span>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
};

