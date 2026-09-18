import { Product, Coupon, Order, PurchasedItemFeedback } from '../types';

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-red-flower-charm',
    name: 'Red Flower Keychain / Phone Charm',
    tagline: 'Handmade with love • Add a little flower power to your day',
    price: 50,
    originalPrice: 80,
    rating: 5.0,
    reviewsCount: 47,
    category: 'Keychains',
    stock: 25,
    images: [
      '/images/red_flower_charm.jpg',
      'https://images.unsplash.com/photo-1607344645866-009c320c5ab8?w=800&auto=format&fit=crop&q=80'
    ],
    colors: [
      { name: 'Red Blossom & Sunshine Yellow', hex: '#D32F2F' },
      { name: 'Coral Pink & Cream', hex: '#FF8A80' }
    ],
    description:
      'Official DreamQueen handmade crochet flower charm! Features vibrant red petals with a cheerful sunny yellow center and a sturdy woven red loop string. Cute, trendy, lightweight, durable, and versatile — perfect for your bag, keys, and phone.',
    yarnType: '100% Organic Combed Milk Cotton Yarn (4-ply)',
    careInstructions: 'Spot clean with a damp cloth or gentle hand wash in cold water.',
    tags: ['Keychains', 'Phone Charm', 'Flower', 'Under ₹100', 'Handmade', 'Cute & Trendy'],
    isBestSeller: true,
    isNewArrival: true,
    isFeatured: true
  },
  {
    id: 'prod-heart-phone-charm',
    name: 'Crochet Heart Phone Charm',
    tagline: 'Add a little love to your phone • Cute, simple, affordable',
    price: 20,
    originalPrice: 40,
    rating: 5.0,
    reviewsCount: 68,
    category: 'Keychains',
    stock: 35,
    images: [
      '/images/heart_phone_charm.jpg',
      'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=800&auto=format&fit=crop&q=80'
    ],
    colors: [
      { name: 'Passion Red', hex: '#C62828' },
      { name: 'Blush Pink', hex: '#F48FB1' },
      { name: 'Berry Wine', hex: '#880E4F' }
    ],
    description:
      'Handmade with care by DreamQueen. A miniature 3D puffed crochet heart charm with a woven hanging loop that attaches easily to any phone case lanyard hole, zipper, or keychain. Adds a cute touch to your daily style for only ₹20!',
    yarnType: 'Soft Breathable Milk Cotton Yarn',
    careInstructions: 'Spot clean with mild damp cloth; air dry.',
    tags: ['Phone Charm', 'Heart', 'Under ₹50', 'Gifts', 'Best Seller', 'Affordable'],
    isBestSeller: true,
    isNewArrival: true,
    isFeatured: true
  },
  {
    id: 'prod-sunflower-keychain',
    name: 'DreamQueen Sunflower Keychain',
    tagline: 'Small accessory • Big happiness • Brighten up your bag',
    price: 50,
    originalPrice: 90,
    rating: 5.0,
    reviewsCount: 52,
    category: 'Keychains',
    stock: 30,
    images: [
      '/images/sunflower_keychain.jpg',
      'https://images.unsplash.com/photo-1597848212624-a19eb35e2651?w=800&auto=format&fit=crop&q=80'
    ],
    colors: [
      { name: 'Golden Sunflower', hex: '#FBC02D' },
      { name: 'Pastel Lemon', hex: '#FFF3A8' }
    ],
    description:
      'A joyful handmade crochet sunflower crafted petal by petal by DreamQueen. Attached to a sturdy silver-toned metal key ring. Lightweight, durable, and the sweetest thoughtful gift to brighten any bag or keyring.',
    yarnType: 'High Grade Milk Cotton with Hypoallergenic Core',
    careInstructions: 'Spot clean with a damp microfiber cloth.',
    tags: ['Keychains', 'Sunflower', 'Gifts', 'Under ₹100', 'Best Seller', 'Handmade with Love'],
    isBestSeller: true,
    isNewArrival: false,
    isFeatured: true
  },
  {
    id: 'prod-pearl-rose-charm',
    name: 'Pearl Blossom Crochet Rose',
    tagline: 'Artisan layered petals with lustrous pearl center & twin leaves',
    price: 50,
    originalPrice: 99,
    rating: 4.9,
    reviewsCount: 31,
    category: 'Hair Accessories',
    stock: 22,
    images: [
      '/images/pearl_rose_charm.jpg',
      'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=800&auto=format&fit=crop&q=80'
    ],
    colors: [
      { name: 'Scarlet Red with Pearl', hex: '#D32F2F' },
      { name: 'Ruby Wine', hex: '#991B1B' }
    ],
    description:
      'Handcrafted with intricate detail by DreamQueen artisans. Features rich multi-layered crochet rose petals accented by twin vibrant green leaves and an elegant round white pearl bead firmly stitched at the center. Fitted with a soft woven loop cord suitable for hair ties, bags, or keychains.',
    yarnType: 'Organic Combed Cotton with Faux Freshwater Pearl',
    careInstructions: 'Gentle hand wash in cold water with mild shampoo. Dry flat on towel.',
    tags: ['Hair Accessories', 'Rose', 'Pearl', 'Under ₹100', 'Handmade', 'New Arrival'],
    isBestSeller: false,
    isNewArrival: true,
    isFeatured: true
  },
  {
    id: 'prod-rose-hair-tie',
    name: 'Handmade Rose Hair Tie',
    tagline: 'Delicate hand-knitted velvet petal scrunchie',
    price: 50,
    originalPrice: 80,
    rating: 4.9,
    reviewsCount: 38,
    category: 'Hair Accessories',
    stock: 24,
    images: [
      'https://images.unsplash.com/photo-1607344645866-009c320c5ab8?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=800&auto=format&fit=crop&q=80'
    ],
    colors: [
      { name: 'Dusty Rose', hex: '#E8A598' },
      { name: 'Soft Cream', hex: '#FFF8F0' },
      { name: 'Berry Wine', hex: '#8B4052' }
    ],
    description:
      'Handcrafted with ultra-soft combed milk cotton yarn, this rose hair tie gently holds your hair without snagging or creasing. Features intricate layered petals that look like a freshly bloomed garden rose.',
    yarnType: '100% Organic Milk Cotton Yarn (4-ply)',
    careInstructions: 'Gentle hand wash with cold water and mild baby shampoo. Lay flat on towel to air dry.',
    tags: ['Hair Accessories', 'Rose', 'Under ₹100', 'Handmade', 'Cute'],
    isBestSeller: true,
    isNewArrival: false,
    isFeatured: true
  },
  {
    id: 'prod-sunflower-keychain',
    name: 'Blooming Sunflower Keychain',
    tagline: 'Bright pocket sunshine with brass lobster clasp',
    price: 50,
    originalPrice: 99,
    rating: 5.0,
    reviewsCount: 52,
    category: 'Keychains',
    stock: 18,
    images: [
      'https://images.unsplash.com/photo-1597848212624-a19eb35e2651?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1522383225653-ed111181a951?w=800&auto=format&fit=crop&q=80'
    ],
    colors: [
      { name: 'Golden Marigold', hex: '#F4B41A' },
      { name: 'Pastel Lemon', hex: '#FFF3A8' },
      { name: 'Terracotta Center', hex: '#5B3A29' }
    ],
    description:
      'A joyful handmade crochet sunflower crafted petal by petal. Attached to a sturdy, anti-tarnish gold-toned ring and lobster swivel hook. Perfect for tote bags, car keys, or gifting to friends.',
    yarnType: 'High Grade Milk Cotton with Hypoallergenic Polyfill Core',
    careInstructions: 'Spot clean with a damp microfiber cloth.',
    tags: ['Keychains', 'Sunflower', 'Gifts', 'Under ₹100', 'Best Seller'],
    isBestSeller: true,
    isNewArrival: false,
    isFeatured: true
  },
  {
    id: 'prod-captain-shield-keychain',
    name: 'Captain Shield Mini Charm',
    tagline: 'Heroic crochet concentric circle bag charm',
    price: 50,
    originalPrice: 120,
    rating: 4.8,
    reviewsCount: 29,
    category: 'Keychains',
    stock: 15,
    images: [
      'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=800&auto=format&fit=crop&q=80'
    ],
    colors: [
      { name: 'Classic Red & Blue', hex: '#C83E4D' },
      { name: 'Pastel Hero Edition', hex: '#8FB8DE' }
    ],
    description:
      'Inspired by the legendary vibranium shield, meticulously crocheted with clean color transitions and a miniature silver-embroidered star at the center. Compact, durable, and unique.',
    yarnType: 'Mercerized Cotton Blend for Crisp Definition',
    careInstructions: 'Spot clean only. Do not bleach.',
    tags: ['Keychains', 'Superheroes', 'Mini Charms', 'Gift for Him & Her'],
    isBestSeller: false,
    isNewArrival: true,
    isFeatured: true
  },
  {
    id: 'prod-flower-clip',
    name: 'Pastel Daisy Hair Clip',
    tagline: 'French alligator clip lined with plush crochet flower',
    price: 50,
    originalPrice: 75,
    rating: 4.9,
    reviewsCount: 44,
    category: 'Hair Accessories',
    stock: 30,
    images: [
      'https://images.unsplash.com/photo-1526047932273-341f2a7631f9?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=800&auto=format&fit=crop&q=80'
    ],
    colors: [
      { name: 'Blush Pink', hex: '#F8D7DA' },
      { name: 'Matcha Olive', hex: '#708238' },
      { name: 'Cloud White', hex: '#F5F5F0' }
    ],
    description:
      'Adorn your tresses with this lightweight crochet blossom. Lined with ribbon over a teeth-grip alligator clip so it stays firmly in place without tugging even delicate strands.',
    yarnType: '100% Baby Soft Egyptian Cotton',
    careInstructions: 'Wipe metal clip dry immediately if exposed to water.',
    tags: ['Hair Accessories', 'Clip', 'Floral', 'Everyday Cute'],
    isBestSeller: true,
    isNewArrival: false,
    isFeatured: true
  },
  {
    id: 'prod-crochet-bookmark',
    name: 'Sprout & Daisy Book Thong Bookmark',
    tagline: 'Slender stem bookmark with blooming hanging blossom',
    price: 50,
    originalPrice: 85,
    rating: 5.0,
    reviewsCount: 31,
    category: 'Bookmarks',
    stock: 22,
    images: [
      'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=800&auto=format&fit=crop&q=80'
    ],
    colors: [
      { name: 'Forest Sprout', hex: '#708238' },
      { name: 'Lavender Bud', hex: '#B8A9C9' },
      { name: 'Coral Poppy', hex: '#F4845F' }
    ],
    description:
      'The book lover’s dream companion. A thin crocheted vine sits flush inside the pages without damaging book bindings, while an enchanting handmade daisy and leaves dangle gracefully over the spine.',
    yarnType: 'Super Fine Mercerized Cotton Lace Thread',
    careInstructions: 'Steam iron gently on lowest cotton setting if folded.',
    tags: ['Bookmarks', 'Book Lover', 'Reading Gifts', 'Handcrafted'],
    isBestSeller: false,
    isNewArrival: true,
    isFeatured: true
  },
  {
    id: 'prod-strawberry-pouch',
    name: 'Crochet Strawberry Kisslock Pouch',
    tagline: 'Hand-beaded vintage-style purse for earphones and coins',
    price: 180,
    originalPrice: 240,
    rating: 4.9,
    reviewsCount: 27,
    category: 'Gifts',
    stock: 12,
    images: [
      'https://images.unsplash.com/photo-1544816155-12df9643f363?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&auto=format&fit=crop&q=80'
    ],
    colors: [
      { name: 'Berry Red', hex: '#D64045' },
      { name: 'Milk White Strawberries', hex: '#FFF5F5' }
    ],
    description:
      'Charming berry-shaped pouch with hand-embroidered seed dots and green calyx leaves. Holds lip balm, AirPods, keys, or pocket coins safely with an antique brass squeeze clasp.',
    yarnType: '100% Milk Cotton Yarn + Cotton Inner Lining',
    careInstructions: 'Hand wash gently inside out.',
    tags: ['Gifts', 'Pouch', 'Strawberry', 'Aesthetic'],
    isBestSeller: true,
    isNewArrival: false,
    isFeatured: true
  },
  {
    id: 'prod-lavender-bouquet',
    name: 'Everlasting Lavender & Tulip Bouquet',
    tagline: '3-stem everlasting crochet bouquet wrapped in craft paper',
    price: 299,
    originalPrice: 420,
    rating: 5.0,
    reviewsCount: 46,
    category: 'Flowers',
    stock: 14,
    images: [
      'https://images.unsplash.com/photo-1527061011665-3652c757a4d4?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=800&auto=format&fit=crop&q=80'
    ],
    colors: [
      { name: 'Lilac Dream', hex: '#C3B1E1' },
      { name: 'Sunset Peach', hex: '#FFD1BA' },
      { name: 'Ivory White', hex: '#FFFBF0' }
    ],
    description:
      'Flowers that never fade. Includes 2 stems of textured lavender sprigs and 1 elegant tulip with bendable wire stems wrapped in floral tape. Comes hand-wrapped in Korean wrapping paper with a satin bow.',
    yarnType: 'Premium Anti-Pilling Milk Cotton with Flexible Stems',
    careInstructions: 'Dust off gently with a soft dry brush or blow dryer on cool air.',
    tags: ['Flowers', 'Bouquet', 'Anniversary', 'Gifts for Her'],
    isBestSeller: true,
    isNewArrival: false,
    isFeatured: true
  },
  {
    id: 'prod-cozy-daisy-coaster',
    name: 'Fluffy Daisy Mug Rug Coaster',
    tagline: 'Scalloped floral coaster for your morning matcha or chai',
    price: 65,
    originalPrice: 90,
    rating: 4.8,
    reviewsCount: 19,
    category: 'Gifts',
    stock: 20,
    images: [
      'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=800&auto=format&fit=crop&q=80'
    ],
    colors: [
      { name: 'Warm Cream & Caramel', hex: '#FFF8F0' },
      { name: 'Sage & Pistachio', hex: '#708238' },
      { name: 'Bubblegum Pink', hex: '#F8D7DA' }
    ],
    description:
      'Protect your workspace in the coziest way imaginable. Generously sized at 12cm diameter to hold any coffee mug, tumbler, or candle bowl safely.',
    yarnType: 'Absorbent Thick Cotton Yarn',
    careInstructions: 'Machine washable on cold gentle cycle in a wash bag.',
    tags: ['Gifts', 'Coasters', 'Mug Rug', 'Cute Desk'],
    isBestSeller: false,
    isNewArrival: true,
    isFeatured: false
  },
  {
    id: 'prod-custom-order-deposit',
    name: 'Bespoke Custom Crochet Creation',
    tagline: 'Bring your Pinterest dream to life with our artisan hook',
    price: 150,
    originalPrice: 200,
    rating: 5.0,
    reviewsCount: 65,
    category: 'Custom Orders',
    stock: 99,
    images: [
      'https://images.unsplash.com/photo-1584992236310-6edddc08acff?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1607344645866-009c320c5ab8?w=800&auto=format&fit=crop&q=80'
    ],
    colors: [
      { name: 'Custom Palette', hex: '#D4A017' }
    ],
    description:
      'Have an idea for a special amigurumi pet, personalized initial keychain, wedding favors, or crochet beanie? Reserve your custom crafting slot here. Our master artisan will consult with you on WhatsApp/Email.',
    yarnType: 'Selected based on your custom requirements',
    careInstructions: 'Personalized care guide included with delivery.',
    tags: ['Custom Orders', 'Personalized', 'Gifts', 'Bespoke'],
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
    minOrderAmount: 199,
    description: 'Free standard 7-day express shipping',
    isActive: true
  },
  {
    code: 'QUEEN20',
    discountPercent: 20,
    minOrderAmount: 399,
    maxDiscount: 200,
    description: 'Special 20% off festival festive bundle discount',
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
        productId: 'prod-rose-hair-tie',
        productName: 'Handmade Rose Hair Tie',
        image: 'https://images.unsplash.com/photo-1607344645866-009c320c5ab8?w=800&auto=format&fit=crop&q=80',
        price: 50,
        quantity: 2,
        color: { name: 'Dusty Rose', hex: '#E8A598' }
      },
      {
        productId: 'prod-sunflower-keychain',
        productName: 'Blooming Sunflower Keychain',
        image: 'https://images.unsplash.com/photo-1597848212624-a19eb35e2651?w=800&auto=format&fit=crop&q=80',
        price: 50,
        quantity: 1,
        color: { name: 'Golden Marigold', hex: '#F4B41A' }
      }
    ],
    subtotal: 150,
    discount: 15,
    couponCode: 'DREAM10',
    shippingFee: 40,
    codFee: 0,
    total: 175,
    paymentMethod: 'razorpay',
    paymentStatus: 'paid',
    razorpayPaymentId: 'pay_NqR94827d921',
    razorpayOrderId: 'order_948210398',
    trackingStatus: 'shipped',
    shiprocketTrackingNumber: 'SR-IND-74920482',
    estimatedDeliveryDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }),
    notes: 'Please pack in cute pink tissue paper for a birthday gift.'
  }
];

export const INITIAL_FEEDBACKS: PurchasedItemFeedback[] = [
  {
    id: 'fb-101',
    orderId: 'ord-demo-1',
    orderNumber: 'DQ-849201',
    productId: 'prod-rose-hair-tie',
    productName: 'Handmade Rose Hair Tie',
    productImage: 'https://images.unsplash.com/photo-1607344645866-009c320c5ab8?w=800&auto=format&fit=crop&q=80',
    selectedColor: { name: 'Dusty Rose', hex: '#E8A598' },
    customerName: 'Aanya Sharma',
    customerEmail: 'aanya.sharma@example.com',
    rating: 5,
    headline: 'Unbelievably soft yarn & gorgeous detailing!',
    comment:
      'I was so pleasantly surprised! The milk cotton yarn feels like a cloud on my hair, doesn’t cause any tugging, and looks like a real delicate garden rose. The parcel arrived in aesthetic kraft wrapping with cute floral stickers.',
    tags: ['Ultra-Soft Milk Cotton', 'Neat Stitches', 'Aesthetic Packaging', '7-Day Delivery'],
    photoUrl: 'https://images.unsplash.com/photo-1607344645866-009c320c5ab8?w=800&auto=format&fit=crop&q=80',
    recommend: true,
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    artisanResponse: {
      text: 'Thank you so much Aanya! Our artisan Priya in Pune put so much love into crocheting this dusty rose piece. Wear it with pride! 🌸💕',
      respondedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
      author: 'DreamQueen Atelier Team'
    }
  }
];

