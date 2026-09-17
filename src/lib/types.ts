// Type definitions for the application
export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Subcategory {
  id: number;
  category_id: number;
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  description?: string;
  price: number;
  stock: number;
  sku?: string;
  image_url?: string;
  category_id?: number;
  category_name?: string;
  category_slug?: string;
  subcategory_id?: number;
  subcategory_name?: string;
  subcategory_slug?: string;
  is_active: number;
  created_at?: string;
  updated_at?: string;
}

export interface Admin {
  id: number;
  username: string;
  email?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Order {
  id?: number;
  order_number?: string;
  customer_id?: number | null;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  customer_address: string;
  customer_province?: string;
  customer_postcode?: string;
  note?: string;
  extra_info?: string;
  subtotal?: number;
  shipping?: number;
  total?: number;
  status?: string;
  items?: OrderItem[];
  created_at?: string;
  updated_at?: string;
}

export interface OrderItem {
  id?: number;
  product_id: number;
  product_name: string;
  product_price: number;
  quantity: number;
  subtotal: number;
}