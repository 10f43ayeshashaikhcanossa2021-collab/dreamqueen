import { Product, Coupon, Order, PurchasedItemFeedback } from '../types';

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-heart-hair-clips',
    name: 'Crochet Heart Hair Clips (Pair - ₹20)',
    tagline: 'Small clips • Big happiness • Stacked red & white hearts on alligator clips',
    price: 20,
    originalPrice: 40,
    rating: 5.0,
    reviewsCount: 64,
    category: 'Hair Accessories',
    stock: 45,
    images: ['/assets/aistudio/hair_clip_____47816559.jpg'],
    colors: [{ name: 'Red & Cream White', hex: '#D32F2F' }],
    description:
      'Official DreamQueen handmade crochet heart clips! Features cute stacked red and cream-white hearts securely mounted on lightweight alligator clips. Gentle on hair, lightweight, durable, and only ₹20. Perfect for gifting and daily sweet hairstyles.',
    yarnType: '100% Breathable Milk Cotton Yarn',
    careInstructions: 'Spot clean with mild damp cloth; air dry.',
    tags: ['Hair Accessories', 'Heart', 'Under ₹50', '₹20', 'Best Seller', 'Handmade with Love'],
    isBestSeller: true,
    isNewArrival: true,
    isFeatured: true
  },
  {
    id: 'prod-rose-crochet-bag',
    name: 'Handmade Rose Crochet Bag with Pearl Strap',
    tagline: 'Opulent 3D blooming rose handbag with lustrous pearl bead handle',
    price: 499,
    originalPrice: 799,
    rating: 5.0,
    reviewsCount: 48,
    category: 'Bags & Pouches',
    stock: 15,
    images: ['/assets/aistudio/rose_bag_crochet____dm_to_order_on_8097706536_e6644b1f.jpg'],
    colors: [{ name: 'Deep Crimson Rose', hex: '#8B0000' }],
    description:
      'Showstopper artisanal statement piece! Layer after layer of dimensional crochet rose petals in deep crimson, finished with an exquisite heavy-duty pearl bead shoulder strap. Spaciously accommodates phone, lipstick, and everyday essentials.',
    yarnType: 'Ultra-Soft Combed Organic Cotton with High-Luster Faux Pearls',
    careInstructions: 'Spot clean with a clean damp cloth. Store flat or hung.',
    tags: ['Bags & Pouches', 'Rose Bag', 'Pearl Strap', 'Handmade with Love', 'Luxury', 'Statement Piece'],
    isBestSeller: true,
    isNewArrival: true,
    isFeatured: true
  },
  {
    id: 'prod-bow-phone-case',
    name: 'DreamQueen Crochet Bow Phone Case',
    tagline: 'Cozy protective knitted cover with plush statement bow',
    price: 199,
    originalPrice: 349,
    rating: 4.9,
    reviewsCount: 38,
    category: 'Accessories',
    stock: 20,
    images: ['/assets/aistudio/WhatsApp_Image_2026-11-10_at_6.57.38_PM_51e04cb2.jpeg'],
    colors: [{ name: 'Burgundy with Cream Bow', hex: '#6A1A24' }],
    description:
      'Small accessories, big happiness! Handcrafted with love by DreamQueen. A rich burgundy textured crochet phone case featuring an oversized plush cream bow. Soft, shock-absorbing, durable, and perfectly snug on your phone.',
    yarnType: 'Soft & Durable Milk Cotton Yarn',
    careInstructions: 'Hand wash gently in cool water; reshape bow and lay flat to dry.',
    tags: ['Phone Case', 'Bow', 'Accessories', 'Handmade with Love', 'Trendy'],
    isBestSeller: true,
    isNewArrival: true,
    isFeatured: true
  },
  {
    id: 'prod-crochet-bhandhana',
    name: 'Handmade Crochet Bhandhana (Head Kerchief)',
    tagline: 'Traditional look with a cute twist • Scalloped lace tie-up bandana',
    price: 149,
    originalPrice: 249,
    rating: 4.9,
    reviewsCount: 41,
    category: 'Hair Accessories',
    stock: 28,
    images: ['/assets/aistudio/WhatsApp_Image_2026-11-10_at_6.57.37_PM__1__b69ab62b.jpeg'],
    colors: [{ name: 'Ruby Red with White Edge', hex: '#C62828' }],
    description:
      'Traditional look with a cute twist! Beautiful handcrafted triangle bandana with intricate openwork crochet and scalloped white lace border. Features soft adjustable tie cords for an effortless, comfortable all-day fit.',
    yarnType: 'Lightweight Breathable Milk Cotton',
    careInstructions: 'Hand wash in cold water with gentle detergent. Lay flat to dry.',
    tags: ['Hair Accessories', 'Bhandhana', 'Bandana', 'Traditional Cute', 'Best Seller'],
    isBestSeller: true,
    isNewArrival: true,
    isFeatured: true
  },
  {
    id: 'prod-twin-cherry-keychain',
    name: 'Twin Cherry Crochet Bag Charm',
    tagline: 'Double plump red cherries with braided stem loop for tote bags & keys',
    price: 50,
    originalPrice: 99,
    rating: 5.0,
    reviewsCount: 56,
    category: 'Keychains',
    stock: 32,
    images: ['/assets/aistudio/cherry_keychain_____________dm_to_order_on_8097706536_cad75670.jpg'],
    colors: [{ name: 'Cherry Red & Leaf Green', hex: '#D50000' }],
    description:
      'Handcrafted twin plump red cherries with vibrant green crochet stems and hanging loop. Easily knots onto canvas tote bags, backpack zippers, or metal key rings. Adds instant fruity charm!',
    yarnType: 'Combed Milk Cotton with Hypoallergenic Polyfill',
    careInstructions: 'Spot clean with damp cloth.',
    tags: ['Keychains', 'Cherry', 'Bag Charm', 'Under ₹100', 'Best Seller', 'Handmade'],
    isBestSeller: true,
    isNewArrival: false,
    isFeatured: true
  },
  {
    id: 'prod-red-bow-charm',
    name: 'DreamQueen Red Bow Keychain & Clip',
    tagline: 'Chunky scarlet crochet ribbon bow with hanging cord & bag attachment',
    price: 50,
    originalPrice: 89,
    rating: 4.9,
    reviewsCount: 39,
    category: 'Keychains',
    stock: 26,
    images: ['/assets/aistudio/WhatsApp_Image_2026-11-10_at_6.57.37_PM_1f29a8d1.jpeg'],
    colors: [{ name: 'Scarlet Red', hex: '#D32F2F' }],
    description:
      'Handmade with love! A thick ribbed crochet bow in passionate scarlet red, crafted to hook onto your favorite tote bag, keys, or be worn as a statement hair accessory. Lightweight and long-lasting.',
    yarnType: '100% Milk Cotton Yarn',
    careInstructions: 'Spot clean with damp cloth.',
    tags: ['Keychains', 'Bow', 'Hair Accessories', 'Under ₹100', 'Handmade with Love'],
    isBestSeller: false,
    isNewArrival: true,
    isFeatured: true
  },
  {
    id: 'prod-evil-eye-charm',
    name: 'Evil Eye Crochet Bag Charm with Tassel',
    tagline: 'Concentric blue & white protective talisman with soft flowing tassel',
    price: 69,
    originalPrice: 120,
    rating: 5.0,
    reviewsCount: 44,
    category: 'Keychains',
    stock: 24,
    images: ['/assets/aistudio/WhatsApp_Image_2026-11-10_at_6.57.36_PM_8d16b57e.jpeg'],
    colors: [{ name: 'Royal Blue & Turquoise', hex: '#1565C0' }],
    description:
      'Wards off negative energy and brings blessings. Handcrafted concentric crochet circles in deep royal blue, turquoise, crisp white, and black, completed with a lavish multi-tone fringe tassel. Perfect bag accessory or car mirror charm.',
    yarnType: 'Anti-Fray Cotton Yarn with Braided Hanging Cord',
    careInstructions: 'Gentle spot cleaning; comb tassel lightly with fingers.',
    tags: ['Keychains', 'Evil Eye', 'Talisman', 'Tassel', 'Protection', 'Bag Charm'],
    isBestSeller: true,
    isNewArrival: false,
    isFeatured: true
  },
  {
    id: 'prod-red-blossom-charm',
    name: 'Red Blossom Flower Bag Charm',
    tagline: 'Sunny daisy-style red petal flower with vibrant yellow crochet center',
    price: 50,
    originalPrice: 89,
    rating: 4.9,
    reviewsCount: 42,
    category: 'Keychains',
    stock: 25,
    images: ['/assets/aistudio/WhatsApp_Image_2026-11-10_at_6.57.35_PM__1__667859b8.jpeg'],
    colors: [{ name: 'Crimson & Sun Yellow', hex: '#D32F2F' }],
    description:
      'Vibrant eight-petal red blossom with a soft textured golden yellow center. Handcrafted by DreamQueen with a sturdy woven loop string. Lightweight, cheerful, and an instant mood lifter for your backpack or handbag.',
    yarnType: '100% Milk Cotton Yarn',
    careInstructions: 'Spot clean with damp cloth.',
    tags: ['Keychains', 'Flower', 'Blossom', 'Under ₹100', 'Handmade with Love'],
    isBestSeller: false,
    isNewArrival: true,
    isFeatured: true
  },
  {
    id: 'prod-sunflower-keychain',
    name: 'DreamQueen Sunflower Bag Charm',
    tagline: 'Cheerful golden petals with chocolate spiral core & hanging loop',
    price: 50,
    originalPrice: 90,
    rating: 5.0,
    reviewsCount: 58,
    category: 'Keychains',
    stock: 30,
    images: ['/assets/aistudio/WhatsApp_Image_2026-11-10_at_6.57.34_PM__1__056e15ac.jpeg'],
    colors: [{ name: 'Golden Sunflower & Cocoa', hex: '#FBC02D' }],
    description:
      'The signature DreamQueen crochet sunflower! Radiates joy with pointed golden sunshine petals around a deeply textured cocoa brown spiral center. Attached with a secure braided yarn strap.',
    yarnType: 'High Grade Milk Cotton with Hypoallergenic Core',
    careInstructions: 'Spot clean with a damp microfiber cloth.',
    tags: ['Keychains', 'Sunflower', 'Gifts', 'Under ₹100', 'Best Seller', 'Handmade with Love'],
    isBestSeller: true,
    isNewArrival: false,
    isFeatured: true
  },
  {
    id: 'prod-twin-tulip-charm',
    name: 'Twin Tulip Blossom Hanging Charm',
    tagline: 'Dual delicate pink bell tulips suspended on leafy green crochet vines',
    price: 60,
    originalPrice: 110,
    rating: 5.0,
    reviewsCount: 37,
    category: 'Keychains',
    stock: 22,
    images: ['/assets/aistudio/WhatsApp_Image_2026-11-10_at_6.57.35_PM_352dedd1.jpeg'],
    colors: [{ name: 'Baby Pink & Garden Green', hex: '#F48FB1' }],
    description:
      'Two adorable bell-shaped pastel pink tulip buds suspended from long green crochet stems with a realistic leaf accent. Drapes gracefully over bag handles, rearview mirrors, or belt loops.',
    yarnType: 'Soft Combed Milk Cotton',
    careInstructions: 'Spot clean gently with damp cloth.',
    tags: ['Keychains', 'Tulip', 'Flower', 'Bag Charm', 'Cute', 'Handmade with Love'],
    isBestSeller: false,
    isNewArrival: true,
    isFeatured: true
  },
  {
    id: 'prod-pearl-rose-charm',
    name: 'Pearl Blossom Crochet Rose',
    tagline: 'Artisan layered rose petals with lustrous pearl center & twin green leaves',
    price: 50,
    originalPrice: 99,
    rating: 5.0,
    reviewsCount: 49,
    category: 'Hair Accessories',
    stock: 25,
    images: ['/assets/aistudio/Crochet_Flower_Charm_on_Cream_Handbag_02a1d697.png'],
    colors: [{ name: 'Scarlet Red with Pearl', hex: '#D32F2F' }],
    description:
      'Handcrafted with intricate layered petals by DreamQueen. Accented by twin emerald leaves and a lustrous round pearl firmly stitched into the blossom center. Comes with sturdy woven loops for hair styling, bag charms, or gift packaging.',
    yarnType: 'Combed Cotton with Faux Freshwater Pearl Beads',
    careInstructions: 'Gentle hand wash in cold water; dry flat on a clean towel.',
    tags: ['Hair Accessories', 'Rose', 'Pearl', 'Under ₹100', 'Handmade', 'Best Seller'],
    isBestSeller: true,
    isNewArrival: false,
    isFeatured: true
  },
  {
    id: 'prod-captain-shield-keychain',
    name: 'Captain Shield Crochet Charm',
    tagline: 'Heroic concentric red, white & blue roundel with white embroidered star',
    price: 50,
    originalPrice: 99,
    rating: 4.9,
    reviewsCount: 35,
    category: 'Keychains',
    stock: 20,
    images: ['/assets/aistudio/WhatsApp_Image_2026-11-10_at_6.57.32_PM_bc5c9755.jpeg'],
    colors: [{ name: 'Patriot Red, White & Blue', hex: '#0D47A1' }],
    description:
      'Concentric hand-crocheted rounds in ruby red, optic white, and navy blue with a precision white star emblem in the center. Equipped with a white hanging loop for backpacks, key fobs, and comic lovers.',
    yarnType: 'Durable Milk Cotton Yarn',
    careInstructions: 'Spot clean with damp cloth.',
    tags: ['Keychains', 'Hero Shield', 'Gifts', 'Under ₹100', 'Handmade with Love'],
    isBestSeller: false,
    isNewArrival: false,
    isFeatured: true
  }
];

export const INITIAL_COUPONS: Coupon[] = [
  {
    code: 'DREAM10',
    discountPercent: 10,
    minOrderAmount: 99,
    maxDiscount: 100,
    description: '10% off your entire handmade crochet cart',
    isActive: true
  },
  {
    code: 'FREESHIP',
    discountPercent: 0,
    minOrderAmount: 499,
    description: 'Free standard 7-day express shipping on orders over ₹499',
    isActive: true
  },
  {
    code: 'QUEEN20',
    discountPercent: 20,
    minOrderAmount: 399,
    maxDiscount: 200,
    description: 'Special 20% off festive bundle discount',
    isActive: true
  }
];

export const INITIAL_ORDERS: Order[] = [
  {
    id: 'ord-demo-1',
    orderNumber: 'DQ-849201',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    customer: {
      name: 'Aanya Sharma',
      email: 'aanya.sharma@example.com',
      phone: '8097706536'
    },
    shippingAddress: {
      fullName: 'Aanya Sharma',
      phone: '8097706536',
      email: 'aanya.sharma@example.com',
      address: 'Flat 402, Blossom Heights, Bandra West',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400050'
    },
    items: [
      {
        productId: 'prod-heart-hair-clips',
        productName: 'Crochet Heart Hair Clips (Pair - ₹20)',
        image: '/assets/aistudio/hair_clip_____47816559.jpg',
        price: 20,
        quantity: 2,
        color: { name: 'Red & Cream White', hex: '#D32F2F' }
      },
      {
        productId: 'prod-sunflower-keychain',
        productName: 'DreamQueen Sunflower Bag Charm',
        image: '/assets/aistudio/WhatsApp_Image_2026-11-10_at_6.57.34_PM__1__056e15ac.jpeg',
        price: 50,
        quantity: 1,
        color: { name: 'Golden Sunflower & Cocoa', hex: '#FBC02D' }
      }
    ],
    subtotal: 90,
    discount: 0,
    couponCode: undefined,
    shippingFee: 20,
    codFee: 10,
    total: 120,
    paymentMethod: 'cod',
    paymentStatus: 'pending',
    trackingStatus: 'shipped',
    shiprocketTrackingNumber: 'SR-IND-74920482',
    estimatedDeliveryDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }),
    notes: 'Please pack in cute tissue paper for a birthday gift.'
  }
];

export const INITIAL_FEEDBACKS: PurchasedItemFeedback[] = [
  {
    id: 'fb-101',
    orderId: 'ord-demo-1',
    orderNumber: 'DQ-849201',
    productId: 'prod-heart-hair-clips',
    productName: 'Crochet Heart Hair Clips (Pair - ₹20)',
    productImage: '/assets/aistudio/hair_clip_____47816559.jpg',
    selectedColor: { name: 'Red & Cream White', hex: '#D32F2F' },
    customerName: 'Aanya Sharma',
    customerEmail: 'aanya.sharma@example.com',
    rating: 5,
    headline: 'Cutest heart clips ever for only ₹20!',
    comment:
      'I was so pleasantly surprised! The milk cotton yarn feels so gentle on my hair, doesn’t cause any tugging, and looks adorable. The parcel arrived in aesthetic kraft wrapping with cute floral stickers.',
    tags: ['Ultra-Soft Milk Cotton', 'Neat Stitches', 'Aesthetic Packaging', '7-Day Delivery'],
    photoUrl: '/assets/aistudio/hair_clip_____47816559.jpg',
    recommend: true,
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    artisanResponse: {
      text: 'Thank you so much Aanya! Our artisan team in Mumbai put so much love into crocheting these heart clips. Wear them with pride! 🌸💕',
      respondedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
      author: 'DreamQueen Atelier Team'
    }
  }
];
