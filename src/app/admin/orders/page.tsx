"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Order } from "@/lib/types";

export default function AdminOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    if (!token) {
      router.push("/admin/login");
      return;
    }
    loadOrders();
  }, [router]);

  const loadOrders = async () => {
    const token = localStorage.getItem("admin_token");
    try {
      const res = await fetch("/api/admin/orders", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: number, status: string) => {
    const token = localStorage.getItem("admin_token");
    await fetch(`/api/admin/orders/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status }),
    });
    loadOrders();
  };

  const statusLabel: Record<string, string> = {
    pending: "รอดำเนินการ",
    confirmed: "ยืนยันแล้ว",
    shipped: "จัดส่งแล้ว",
    completed: "เสร็จสิ้น",
    cancelled: "ยกเลิก",
  };

  const statusColor: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-700",
    confirmed: "bg-blue-100 text-blue-700",
    shipped: "bg-purple-100 text-purple-700",
    completed: "bg-green-100 text-green-700",
    cancelled: "bg-red-100 text-red-700",
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Link href="/admin" className="text-sm text-gray-600 hover:text-primary-600">
        ← กลับแดชบอร์ด
      </Link>
      <h1 className="text-3xl font-bold mb-6">📋 คำสั่งซื้อ</h1>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <p className="p-8 text-center text-gray-500">กำลังโหลด...</p>
        ) : orders.length === 0 ? (
          <p className="p-8 text-center text-gray-500">ยังไม่มีคำสั่งซื้อ</p>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-3">เลขที่</th>
                <th className="text-left p-3">ลูกค้า</th>
                <th className="text-right p-3">ยอดรวม</th>
                <th className="text-center p-3">สถานะ</th>
                <th className="text-left p-3">วันที่</th>
                <th className="text-center p-3">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-t hover:bg-gray-50">
                  <td className="p-3 font-mono text-sm"><Link href={`/admin/orders/detail/?id=${o.id}`} className="hover:text-primary-700 hover:underline">{o.order_number}</Link></td>
                  <td className="p-3">
                    <p className="font-semibold">{o.customer_name}</p>
                    <p className="text-xs text-gray-500">{o.customer_phone}</p>
                  </td>
                  <td className="p-3 text-right font-semibold">
                    ฿{(o.total || 0).toLocaleString()}
                  </td>
                  <td className="p-3 text-center">
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        statusColor[o.status || "pending"]
                      }`}
                    >
                      {statusLabel[o.status || "pending"]}
                    </span>
                  </td>
                  <td className="p-3 text-sm text-gray-600">
                    {o.created_at &&
                      new Date(o.created_at).toLocaleDateString("th-TH")}
                  </td>
                  <td className="p-3 text-center">
                    <select
                      value={o.status || "pending"}
                      onChange={(e) => updateStatus(o.id!, e.target.value)}
                      className="text-sm border rounded px-2 py-1"
                    >
                      <option value="pending">รอดำเนินการ</option>
                      <option value="confirmed">ยืนยัน</option>
                      <option value="shipped">จัดส่ง</option>
                      <option value="completed">เสร็จสิ้น</option>
                      <option value="cancelled">ยกเลิก</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}