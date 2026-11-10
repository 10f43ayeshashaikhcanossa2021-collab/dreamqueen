import { INITIAL_PRODUCTS } from '../data/initialProducts';

export const FALLBACK_PRODUCT_IMAGE = '/assets/aistudio/hair_clip_____47816559.jpg';

/**
 * Resolves a valid, non-empty image URL for an order item or product.
 * Guarantees never returning an empty string (""), preventing React DOM src="" warnings.
 */
export function resolveItemImage(productId?: string, existingImage?: string | null): string {
  if (existingImage && typeof existingImage === 'string' && existingImage.trim() !== '') {
    return existingImage.trim();
  }

  if (productId) {
    const matched = INITIAL_PRODUCTS.find((p) => p.id === productId);
    if (matched?.images?.[0] && matched.images[0].trim() !== '') {
      return matched.images[0].trim();
    }
  }

  return FALLBACK_PRODUCT_IMAGE;
}

/**
 * Safe image fallback helper for any image source.
 * Ensures the result is never an empty string ("") or whitespace.
 */
export function safeImage(src?: string | null, fallback = FALLBACK_PRODUCT_IMAGE): string {
  if (src && typeof src === 'string' && src.trim() !== '') {
    return src.trim();
  }
  return fallback;
}
