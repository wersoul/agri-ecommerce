"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Customer {
  id: number; email: string; full_name: string;
  phone?: string; address?: string; province?: string; postcode?: string;
  last_login?: string; created_at: string;
}

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

export default function AccountPage() {
  const router = useRouter();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"orders" | "profile">("orders");

  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [province, setProvince] = useState("");
  const [postcode, setPostcode] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("customer_token") : null;
      if (!token) { router.push("/login"); return; }
      const r = await fetch("/api/customer/me", {
        credentials: "include",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (r.status === 401) { router.push("/login"); return; }
      const data = await r.json();
      setCustomer(data.customer);
      setPhone(data.customer.phone || "");
      setAddress(data.customer.address || "");
      setProvince(data.customer.province || "");
      setPostcode(data.customer.postcode || "");
      const ro = await fetch("/api/customer/orders", {
        credentials: "include",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (ro.ok) {
        const od = await ro.json();
        setOrders(od.orders || []);
      }
    } catch {
      router.push("/login");
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    await fetch("/api/customer/logout", { method: "POST" });
    try { localStorage.removeItem("customer_token"); localStorage.removeItem("customer"); } catch {}
    router.push("/");
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setMessage("");
    try {
      const r = await fetch("/api/customer/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, address, province, postcode }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "บันทึกไม่สำเร็จ");
      setMessage("บันทึกข้อมูลเรียบร้อย");
    } catch (e: any) {
      setMessage(e.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="text-gray-600">กำลังโหลด...</div></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">👤 บัญชีของฉัน</h1>
              <p className="text-gray-600 text-sm mt-1">{customer?.full_name} • {customer?.email}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/account/change-password"
                className="px-4 py-2 text-sm bg-primary-50 text-primary-700 hover:bg-primary-100 rounded-lg">
                🔑 เปลี่ยนรหัสผ่าน
              </Link>
              <button onClick={handleLogout}
                className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700">
                ออกจากระบบ
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm">
          <div className="border-b flex">
            <button onClick={() => setTab("orders")}
              className={`flex-1 py-4 text-center font-medium ${tab === "orders" ? "border-b-2 border-primary-700 text-primary-700" : "text-gray-600"}`}>
              📦 ออร์เดอร์ ({orders.length})
            </button>
            <button onClick={() => setTab("profile")}
              className={`flex-1 py-4 text-center font-medium ${tab === "profile" ? "border-b-2 border-primary-700 text-primary-700" : "text-gray-600"}`}>
              🏠 ที่อยู่/โทร
            </button>
          </div>

          {tab === "orders" && (
            <div className="p-6">
              {orders.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-5xl mb-4">📦</div>
                  <p className="text-gray-600 mb-4">ยังไม่มีออร์เดอร์</p>
                  <Link href="/products" className="inline-block px-6 py-2 bg-primary-700 text-white rounded-lg hover:bg-primary-800">
                    เลือกซื้อสินค้า
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {orders.map(o => {
                    const s = STATUS_LABELS[o.status] || { label: o.status, color: "bg-gray-100 text-gray-800" };
                    return (
                      <Link key={o.id} href={`/account/orders?id=${o.id}`}
                        className="block p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50">
                        <div className="flex justify-between items-start gap-4">
                          <div className="min-w-0">
                            <div className="font-semibold text-gray-900">#{o.order_number}</div>
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
          )}

          {tab === "profile" && (
            <div className="p-6">
              {message && <div className="mb-4 p-3 bg-blue-50 border border-blue-200 text-blue-800 text-sm rounded-lg">{message}</div>}
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อ-นามสกุล</label>
                    <input value={customer?.full_name || ""} disabled
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">อีเมล</label>
                    <input value={customer?.email || ""} disabled
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">เบอร์โทร</label>
                  <input value={phone} onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="08x-xxx-xxxx" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ที่อยู่</label>
                  <textarea value={address} onChange={(e) => setAddress(e.target.value)} rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">จังหวัด</label>
                    <input value={province} onChange={(e) => setProvince(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">รหัสไปรษณีย์</label>
                    <input value={postcode} onChange={(e) => setPostcode(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
                  </div>
                </div>
                <button type="submit" disabled={saving}
                  className="w-full sm:w-auto px-6 py-2 bg-primary-700 text-white font-medium rounded-lg hover:bg-primary-800 disabled:opacity-50">
                  {saving ? "กำลังบันทึก..." : "บันทึก"}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}