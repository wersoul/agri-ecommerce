"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function SuccessContent() {
  const [orderNumber, setOrderNumber] = useState<string>("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const p = new URLSearchParams(window.location.search);
      setOrderNumber(p.get("order") || "");
    }
  }, []);

  return (
    <div className="container mx-auto px-4 py-16 text-center">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-lg mx-auto">
        <div className="text-6xl mb-4">✅</div>
        <h1 className="text-3xl font-bold text-green-600 mb-4">
          สั่งซื้อสำเร็จ!
        </h1>
        <p className="text-gray-700 mb-2">
          หมายเลขคำสั่งซื้อ: <strong className="text-primary-700">{orderNumber}</strong>
        </p>
        <p className="text-gray-600 mb-6">
          ขอบคุณสำหรับการสั่งซื้อ
          เจ้าหน้าที่จะติดต่อกลับเพื่อยืนยันการชำระเงินโดยเร็วที่สุด
        </p>
        <div className="flex gap-3 justify-center">
          <Link href="/products" className="btn-primary">
            ซื้อสินค้าต่อ
          </Link>
          <Link href="/" className="btn-secondary">
            กลับหน้าแรก
          </Link>
        </div>
      </div>
    </div>
  );
}