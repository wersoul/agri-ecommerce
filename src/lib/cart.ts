// Client-side cart helpers using localStorage
import { Product, CartItem } from "./types";

const CART_KEY = "agri_cart";

export function getCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveCart(items: CartItem[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(CART_KEY, JSON.stringify(items));
}

export function addToCart(product: Product, quantity: number = 1): CartItem[] {
  const cart = getCart();
  const existing = cart.find((item) => item.product.id === product.id);
  if (existing) {
    existing.quantity += quantity;
  } else {
    cart.push({ product, quantity });
  }
  saveCart(cart);
  return cart;
}

export function removeFromCart(productId: number): CartItem[] {
  const cart = getCart().filter((item) => item.product.id !== productId);
  saveCart(cart);
  return cart;
}

export function updateQuantity(productId: number, quantity: number): CartItem[] {
  const cart = getCart();
  const item = cart.find((item) => item.product.id === productId);
  if (item) {
    if (quantity <= 0) {
      return removeFromCart(productId);
    }
    item.quantity = quantity;
    saveCart(cart);
  }
  return cart;
}

export function clearCart(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(CART_KEY);
}

export function getCartTotal(items?: CartItem[]): {
  subtotal: number;
  itemCount: number;
} {
  const cart = items ?? getCart();
  return cart.reduce(
    (acc, item) => ({
      subtotal: acc.subtotal + item.product.price * item.quantity,
      itemCount: acc.itemCount + item.quantity,
    }),
    { subtotal: 0, itemCount: 0 }
  );
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    minimumFractionDigits: 0,
  }).format(price);
}