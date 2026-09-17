"use client";

import { CartItem } from "@/lib/types";
import { formatPrice } from "@/lib/cart";

interface CheckoutSummaryProps {
  items: CartItem[];
  subtotal: number;
  shipping: number;
  total: number;
  error: string;
  submitting: boolean;
}

export default function CheckoutSummary({
  items,
  subtotal,
  shipping,
  total,
  error,
  submitting,
}: CheckoutSummaryProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6 h-fit sticky top-20">
      <h2 className="font-bold text-xl mb-4">สรุปคำสั่งซื้อ</h2>
      <div className="space-y-2 mb-4 max-h-60 overflow-y-auto">
        {items.map((item) => (
          <div key={item.product.id} className="flex justify-between text-sm border-b pb-2">
            <span>{item.product.name} x{item.quantity}</span>
            <span>{formatPrice(item.product.price * item.quantity)}</span>
          </div>
        ))}
      </div>
      <div className="space-y-1 mb-4 border-t pt-3">
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
      </div>
      <div className="border-t pt-3 mb-4">
        <div className="flex justify-between font-bold text-xl">
          <span>ยอดรวม</span>
          <span className="text-primary-700">{formatPrice(total)}</span>
        </div>
      </div>
      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded mb-3 text-sm">
          {error}
        </div>
      )}
      <button
        type="submit"
        disabled={submitting}
        className="btn-primary w-full py-3 text-lg"
      >
        {submitting ? "กำลังส่งคำสั่งซื้อ..." : "✓ ยืนยันสั่งซื้อ"}
      </button>
      <p className="text-xs text-gray-500 mt-3 text-center">
        ระบบจะติดต่อกลับเพื่อยืนยันการชำระเงินผ่านทางเบอร์โทรศัพท์
      </p>
    </div>
  );
}