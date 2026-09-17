"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CartItem } from "@/lib/types";
import {
  getCart,
  removeFromCart,
  updateQuantity,
  clearCart,
  formatPrice,
} from "@/lib/cart";

export default function CartPage() {
  const router = useRouter();
  const [items, setItems] = useState<CartItem[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setItems(getCart());
  }, []);

  const subtotal = items.reduce(
    (sum, i) => sum + i.product.price * i.quantity,
    0
  );
  const shipping = subtotal > 0 ? (subtotal >= 1000 ? 0 : 50) : 0;
  const total = subtotal + shipping;

  const refresh = () => {
    setItems(getCart());
    window.dispatchEvent(new Event("cart-updated"));
  };

  if (!mounted) {
    return <div className="container mx-auto p-8">กำลังโหลด...</div>;
  }

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-3xl font-bold mb-4">ตะกร้าสินค้าว่างเปล่า</h1>
        <p className="text-gray-600 mb-6">เพิ่มสินค้าลงตะกร้าก่อนชำระเงิน</p>
        <Link href="/products" className="btn-primary">
          เลือกซื้อสินค้า
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">🛒 ตะกร้าสินค้า</h1>
      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          {items.map((item) => (
            <div
              key={item.product.id}
              className="bg-white rounded-lg shadow p-4 flex gap-4"
            >
              <img
                src={item.product.image_url || "/images/no-image.png"}
                alt={item.product.name}
                className="w-24 h-24 object-cover rounded"
              />
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{item.product.name}</h3>
                <p className="text-primary-700 font-bold">
                  {formatPrice(item.product.price)}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <button
                    onClick={() => {
                      updateQuantity(item.product.id, item.quantity - 1);
                      refresh();
                    }}
                    className="w-8 h-8 bg-gray-200 rounded hover:bg-gray-300"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => {
                      updateQuantity(item.product.id, parseInt(e.target.value) || 1);
                      refresh();
                    }}
                    className="w-16 text-center input-field"
                    min="1"
                  />
                  <button
                    onClick={() => {
                      updateQuantity(item.product.id, item.quantity + 1);
                      refresh();
                    }}
                    className="w-8 h-8 bg-gray-200 rounded hover:bg-gray-300"
                  >
                    +
                  </button>
                  <button
                    onClick={() => {
                      removeFromCart(item.product.id);
                      refresh();
                    }}
                    className="ml-auto text-red-600 hover:text-red-800 text-sm"
                  >
                    ลบ
                  </button>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-lg">
                  {formatPrice(item.product.price * item.quantity)}
                </p>
              </div>
            </div>
          ))}
          <button
            onClick={() => {
              clearCart();
              refresh();
            }}
            className="text-red-600 hover:text-red-800 text-sm"
          >
            🗑️ ล้างตะกร้า
          </button>
        </div>
        <aside className="md:col-span-1">
          <div className="bg-white rounded-lg shadow p-6 sticky top-20">
            <h2 className="font-bold text-xl mb-4">สรุปคำสั่งซื้อ</h2>
            <div className="space-y-2 mb-4">
              <div className="flex justify-between">
                <span>ราคารวม</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>ค่าจัดส่ง</span>
                <span>
                  {shipping === 0 ? (
                    <span className="text-green-600">ฟรี</span>
                  ) : (
                    formatPrice(shipping)
                  )}
                </span>
              </div>
              {subtotal < 1000 && subtotal > 0 && (
                <p className="text-xs text-gray-500">
                  ซื้อเพิ่มอีก {formatPrice(1000 - subtotal)} ส่งฟรี!
                </p>
              )}
            </div>
            <div className="border-t pt-3 mb-4">
              <div className="flex justify-between font-bold text-lg">
                <span>ยอดรวมทั้งสิ้น</span>
                <span className="text-primary-700">{formatPrice(total)}</span>
              </div>
            </div>
            <button
              onClick={() => router.push("/checkout")}
              className="btn-primary w-full py-3 text-lg"
            >
              ดำเนินการชำระเงิน →
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}