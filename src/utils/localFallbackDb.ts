import fs from 'node:fs';
import path from 'node:path';
import type { Order } from '../types.ts';

interface LocalFallbackStoreData {
  orders: Order[];
  newsletterEmails: string[];
  productStockDeltas: Record<string, number>;
}

const DATA_DIR = path.resolve(process.cwd(), '.data');
const DATA_FILE = path.join(DATA_DIR, 'dreamqueen-local-db.json');

export function isSupabaseNetworkError(err: unknown): boolean {
  if (!err) return false;
  const msg =
    typeof err === 'string'
      ? err
      : String((err as any)?.message || (err as any)?.details || err);
  const lower = msg.toLowerCase();
  return (
    lower.includes('fetch failed') ||
    lower.includes('failed to fetch') ||
    lower.includes('enotfound') ||
    lower.includes('econnrefused') ||
    lower.includes('etimedout') ||
    lower.includes('eai_again') ||
    lower.includes('getaddrinfo') ||
    lower.includes('networkerror')
  );
}

function readStore(): LocalFallbackStoreData {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      return { orders: [], newsletterEmails: [], productStockDeltas: {} };
    }
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return {
      orders: Array.isArray(parsed?.orders) ? parsed.orders : [],
      newsletterEmails: Array.isArray(parsed?.newsletterEmails) ? parsed.newsletterEmails : [],
      productStockDeltas:
        parsed?.productStockDeltas && typeof parsed.productStockDeltas === 'object'
          ? parsed.productStockDeltas
          : {}
    };
  } catch {
    return { orders: [], newsletterEmails: [], productStockDeltas: {} };
  }
}

function writeStore(data: LocalFallbackStoreData): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const tmpFile = `${DATA_FILE}.tmp`;
    fs.writeFileSync(tmpFile, JSON.stringify(data, null, 2), 'utf8');
    fs.renameSync(tmpFile, DATA_FILE);
  } catch (err) {
    console.warn('[LocalFallbackDb] Could not write store file:', err);
  }
}

export function saveFallbackOrder(order: Order): Order {
  const store = readStore();
  const idx = store.orders.findIndex((o) => o.id === order.id);
  if (idx >= 0) {
    store.orders[idx] = order;
  } else {
    store.orders.unshift(order);
  }
  for (const item of order.items || []) {
    const cur = store.productStockDeltas[item.productId] || 0;
    store.productStockDeltas[item.productId] = cur + Number(item.quantity || 0);
  }
  writeStore(store);
  return order;
}

export function getFallbackProductDeduction(productId: string): number {
  const store = readStore();
  return Math.max(0, Number(store.productStockDeltas[productId] || 0));
}

export function findFallbackOrderByNumber(orderNumber: string): Order | null {
  const store = readStore();
  const clean = orderNumber.trim().toUpperCase();
  return (
    store.orders.find((o) => String(o.orderNumber || '').toUpperCase() === clean) || null
  );
}

export function updateFallbackOrderById(
  orderId: string,
  updater: (prev: Order) => Order
): Order | null {
  const store = readStore();
  const idx = store.orders.findIndex((o) => o.id === orderId);
  if (idx < 0) return null;
  store.orders[idx] = updater(store.orders[idx]);
  writeStore(store);
  return store.orders[idx];
}

export function saveFallbackNewsletterEmail(email: string): { alreadySubscribed: boolean } {
  const clean = email.trim().toLowerCase();
  const store = readStore();
  if (store.newsletterEmails.includes(clean)) {
    return { alreadySubscribed: true };
  }
  store.newsletterEmails.push(clean);
  writeStore(store);
  return { alreadySubscribed: false };
}
