"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

interface OrderDetail {
  id: number; order_number: string; total: number;
  status: string;
  customer_address: string; customer_name: string; customer_phone: string; customer_email: string;
  note?: string; created_at: string;
  items: { id: number; product_id: number; product_name: string;
           product_image?: string; quantity: number; unit_price: number; subtotal: number }[];
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: "รอดำเนินการ", color: "bg-yellow-100 text-yellow-800" },
  processing: { label: "กำลังจัดเตรียม", color: "bg-blue-100 text-blue-800" },
  shipped: { label: "จัดส่งแล้ว", color: "bg-purple-100 text-purple-800" },
  completed: { label: "สำเร็จ", color: "bg-green-100 text-green-800" },
  cancelled: { label: "ยกเลิก", color: "bg-red-100 text-red-800" },
};

function OrderDetailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = searchParams.get("id");
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) { router.push("/account"); return; }
    const token = typeof window !== "undefined" ? localStorage.getItem("customer_token") : null;
    if (!token) { router.push("/login"); return; }
    (async () => {
      try {
        const r = await fetch(`/api/customer/orders/${id}`, {
          credentials: "include",
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        if (r.status === 401) { router.push("/login"); return; }
        if (!r.ok) { router.push("/account"); return; }
        const data = await r.json();
        setOrder(data.order);
      } finally {
        setLoading(false);
      }
    })();
  }, [id, router]);

  if (loading) return <div className="min-h-screen flex items-center justify-center">กำลังโหลด...</div>;
  if (!order) return null;

  const s = STATUS_LABELS[order.status] || { label: order.status, color: "bg-gray-100 text-gray-800" };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <Link href="/account" className="text-primary-700 hover:underline text-sm mb-4 inline-block">← กลับไปบัญชีของฉัน</Link>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-2xl font-bold">ออร์เดอร์ #{order.order_number}</h1>
              <p className="text-sm text-gray-500 mt-1">
                {new Date(order.created_at).toLocaleString("th-TH")}
              </p>
            </div>
            <span className={`px-3 py-1 text-sm rounded-full ${s.color}`}>{s.label}</span>
          </div>

          <div className="space-y-3 mb-6">
            {order.items.map(it => (
              <div key={it.id} className="flex gap-3 items-center border-b pb-3 last:border-0">
                {it.product_image && (
                  <img src={it.product_image} alt={it.product_name}
                    className="w-16 h-16 object-cover rounded-lg border" />
                )}
                <div className="flex-1 min-w-0">
                  <Link href={`/product?id=${it.product_id}`} className="font-medium text-gray-900 hover:text-primary-700 line-clamp-2">{it.product_name}</Link>
                  <div className="text-xs text-gray-500 mt-0.5">฿{Number(it.unit_price).toLocaleString()} × {it.quantity}</div>
                </div>
                <div className="font-semibold text-right">฿{Number(it.subtotal).toLocaleString()}</div>
              </div>
            ))}
          </div>

          <div className="border-t pt-4 space-y-2 text-sm">
            <div className="flex justify-between font-bold text-base">
              <span>รวมทั้งหมด:</span>
              <span className="text-primary-700">฿{Number(order.total).toLocaleString()}</span>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t">
            <h3 className="font-semibold mb-2">📍 ที่อยู่จัดส่ง</h3>
            <p className="text-sm text-gray-700 whitespace-pre-line">{order.customer_address}</p>
            <p className="text-sm text-gray-600 mt-2">📞 {order.customer_phone}</p>
            {order.note && (
              <div className="mt-3">
                <h4 className="font-medium text-sm">📝 หมายเหตุ:</h4>
                <p className="text-sm text-gray-700">{order.note}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OrderDetailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">กำลังโหลด...</div>}>
      <OrderDetailContent />
    </Suspense>
  );
}