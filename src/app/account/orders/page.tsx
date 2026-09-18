"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Order {
  id: number; order_number: string; total: number;
  status: string; created_at: string; item_count: number;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: "รอดำเนินการ", color: "bg-yellow-100 text-yellow-800" },
  processing: { label: "กำลังจัดเตรียม", color: "bg-blue-100 text-blue-800" },
  shipped: { label: "จัดส่งแล้ว", color: "bg-purple-100 text-purple-800" },
  completed: { label: "สำเร็จ", color: "bg-green-100 text-green-800" },
  cancelled: { label: "ยกเลิก", color: "bg-red-100 text-red-800" },
};

export default function OrdersListPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // รอ hydration เสร็จก่อนค่อยตรวจ token
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const token = typeof window !== "undefined" ? localStorage.getItem("customer_token") : null;
    if (!token) {
      window.location.href = "/login";
      return;
    }
    (async () => {
      try {
        const r = await fetch("/api/customer/orders", {
          credentials: "include",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (r.status === 401) { window.location.href = "/login"; return; }
        if (!r.ok) { window.location.href = "/account"; return; }
        const data = await r.json();
        setOrders(Array.isArray(data.orders) ? data.orders : []);
      } catch {
        window.location.href = "/login";
      } finally {
        setLoading(false);
      }
    })();
  }, [hydrated]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">กำลังโหลด...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <Link href="/account" className="text-primary-700 hover:underline text-sm mb-4 inline-block">← กลับไปบัญชีของฉัน</Link>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h1 className="text-2xl font-bold mb-2">📦 ประวัติการสั่งซื้อ</h1>
          <p className="text-sm text-gray-500 mb-6">รายการคำสั่งซื้อทั้งหมดของคุณ ({orders.length} รายการ)</p>

          {orders.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="text-4xl mb-3">📭</p>
              <p>ยังไม่มีคำสั่งซื้อ</p>
              <Link href="/products" className="inline-block mt-4 px-5 py-2 bg-primary-700 text-white rounded-lg hover:bg-primary-800 text-sm">เลือกซื้อสินค้า</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((o) => {
                const s = STATUS_LABELS[o.status] || { label: o.status, color: "bg-gray-100 text-gray-800" };
                return (
                  <Link key={o.id} href={`/account/orders/detail?id=${o.id}`}
                    className="block p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition">
                    <div className="flex justify-between items-start gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="font-mono font-semibold text-gray-900">#{o.order_number}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {new Date(o.created_at).toLocaleString("th-TH")} • {o.item_count} รายการ
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="font-bold text-primary-700">฿{Number(o.total).toLocaleString()}</div>
                        <span className={`inline-block mt-1 px-2 py-0.5 text-xs rounded-full ${s.color}`}>{s.label}</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}