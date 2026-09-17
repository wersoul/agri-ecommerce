"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";

interface Customer {
  id: number; email: string; full_name: string; phone?: string;
  address?: string; province?: string; postcode?: string;
  company?: string; tax_id?: string; extra_info?: string;
  is_verified: number; is_active: number;
  last_login?: string; created_at: string; updated_at: string;
}

interface Order {
  id: number; order_number: string; total: number;
  status: string; created_at: string; item_count: number;
}

interface Stats {
  total_orders: number; total_spent: number; completed_spent: number; last_order_date: string | null;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: "รอดำเนินการ", color: "bg-yellow-100 text-yellow-800" },
  processing: { label: "กำลังจัดเตรียม", color: "bg-blue-100 text-blue-800" },
  shipped: { label: "จัดส่งแล้ว", color: "bg-purple-100 text-purple-800" },
  completed: { label: "สำเร็จ", color: "bg-green-100 text-green-800" },
  confirmed: { label: "ยืนยันแล้ว", color: "bg-blue-100 text-blue-800" },
  cancelled: { label: "ยกเลิก", color: "bg-red-100 text-red-800" },
};

function CustomerDetailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = searchParams.get("id");
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Customer>>({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!id) { router.push("/admin/customers"); return; }
    const token = typeof window !== "undefined" ? localStorage.getItem("admin_token") : null;
    if (!token) { router.push("/admin/login"); return; }
    loadDetail(token);
  }, [id]);

  async function loadDetail(token: string) {
    setLoading(true);
    try {
      const r = await fetch(`/api/admin/customers/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      if (r.status === 401) { router.push("/admin/login"); return; }
      if (!r.ok) { router.push("/admin/customers"); return; }
      const data = await r.json();
      setCustomer(data.customer);
      setOrders(data.orders || []);
      setStats(data.stats);
      setEditForm({
        full_name: data.customer.full_name || "",
        email: data.customer.email || "",
        phone: data.customer.phone || "",
        address: data.customer.address || "",
        province: data.customer.province || "",
        postcode: data.customer.postcode || "",
        company: data.customer.company || "",
        tax_id: data.customer.tax_id || "",
        extra_info: data.customer.extra_info || "",
      });
    } finally {
      setLoading(false);
    }
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!customer) return;
    const token = localStorage.getItem("admin_token");
    if (!token) return;
    setSaving(true);
    setMessage("");
    try {
      const r = await fetch(`/api/admin/customers/${id}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) {
        setMessage("❌ " + (data.error || "บันทึกไม่สำเร็จ"));
        return;
      }
      setMessage("✅ บันทึกข้อมูลเรียบร้อย");
      setEditing(false);
      await loadDetail(token);
    } catch (e: any) {
      setMessage("❌ " + (e.message || "เกิดข้อผิดพลาด"));
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive() {
    if (!customer) return;
    const token = localStorage.getItem("admin_token");
    if (!token) return;
    const r = await fetch(`/api/admin/customers/${id}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: customer.is_active ? 0 : 1 }),
    });
    if (r.ok) {
      setMessage(customer.is_active ? "ระงับบัญชีแล้ว" : "เปิดใช้งานบัญชีแล้ว");
      loadDetail(token);
    }
  }

  async function toggleVerified() {
    if (!customer) return;
    const token = localStorage.getItem("admin_token");
    if (!token) return;
    const r = await fetch(`/api/admin/customers/${id}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ is_verified: customer.is_verified ? 0 : 1 }),
    });
    if (r.ok) {
      setMessage(customer.is_verified ? "ยกเลิกการยืนยันแล้ว" : "ยืนยันอีเมลแล้ว");
      loadDetail(token);
    }
  }

  async function deleteCustomer() {
    if (!customer) return;
    if (!confirm(`ต้องการลบสมาชิก "${customer.full_name}" (${customer.email}) หรือไม่?\n\n⚠️ ออร์เดอร์ที่สั่งซื้อจะยังคงอยู่ แต่ customer_id จะถูกตัดออก`)) return;
    const token = localStorage.getItem("admin_token");
    if (!token) return;
    setDeleting(true);
    try {
      const r = await fetch(`/api/admin/customers/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (r.ok) {
        router.push("/admin/customers");
      } else {
        const data = await r.json().catch(() => ({}));
        setMessage("❌ ลบไม่สำเร็จ: " + (data.error || ""));
        setDeleting(false);
      }
    } catch (e: any) {
      setMessage("❌ " + (e.message || "เกิดข้อผิดพลาด"));
      setDeleting(false);
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center">กำลังโหลด...</div>;
  if (!customer) return null;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <Link href="/admin/customers" className="text-sm text-gray-600 hover:text-gray-800">← กลับหน้ารายชื่อสมาชิก</Link>

        {message && <div className="mt-3 p-3 bg-blue-50 border border-blue-200 text-blue-800 rounded-lg text-sm">{message}</div>}

        <div className="mt-4 bg-white rounded-xl shadow-sm p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{customer.full_name}</h1>
              <p className="text-gray-600 text-sm mt-1">{customer.email}</p>
              <p className="text-gray-600 text-sm">📞 {customer.phone || "-"}</p>
              {customer.company && <p className="text-gray-700 text-sm mt-1">🏢 {customer.company}{customer.tax_id ? ` (เลขผู้เสียภาษี: ${customer.tax_id})` : ""}</p>}
              <p className="text-xs text-gray-500 mt-2">สมัครเมื่อ {new Date(customer.created_at).toLocaleDateString("th-TH")} • อัปเดตล่าสุด {new Date(customer.updated_at).toLocaleDateString("th-TH")}</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button onClick={toggleVerified}
                className={`px-3 py-1.5 text-sm rounded-lg ${customer.is_verified ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200" : "bg-green-100 text-green-800 hover:bg-green-200"}`}>
                {customer.is_verified ? "ยกเลิกการยืนยัน" : "ยืนยันอีเมล"}
              </button>
              <button onClick={toggleActive}
                className={`px-3 py-1.5 text-sm rounded-lg ${customer.is_active ? "bg-red-100 text-red-800 hover:bg-red-200" : "bg-blue-100 text-blue-800 hover:bg-blue-200"}`}>
                {customer.is_active ? "ระงับบัญชี" : "เปิดใช้งาน"}
              </button>
              {!editing && (
                <button onClick={() => setEditing(true)}
                  className="px-3 py-1.5 bg-primary-700 text-white text-sm rounded-lg hover:bg-primary-800">
                  ✏️ แก้ไขข้อมูล
                </button>
              )}
              <button onClick={deleteCustomer} disabled={deleting}
                className="px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 disabled:opacity-50">
                {deleting ? "กำลังลบ..." : "🗑️ ลบสมาชิก"}
              </button>
            </div>
          </div>
          {(customer.address || customer.province) && (
            <div className="mt-4 pt-4 border-t text-sm text-gray-700">
              <strong>📍 ที่อยู่:</strong>
              <p className="mt-1 whitespace-pre-line">{customer.address} {customer.province} {customer.postcode}</p>
            </div>
          )}
          {customer.extra_info && (
            <div className="mt-3 text-sm text-gray-700">
              <strong>📝 ข้อมูลเพิ่มเติม:</strong>
              <p className="mt-1 whitespace-pre-line bg-amber-50 border-l-4 border-amber-400 p-2 rounded">{customer.extra_info}</p>
            </div>
          )}
        </div>

        {editing && (
          <form onSubmit={saveEdit} className="mt-4 bg-white rounded-xl shadow-sm p-6">
            <h2 className="font-semibold text-lg mb-4">✏️ แก้ไขข้อมูลสมาชิก</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">ชื่อ-นามสกุล *</label>
                <input required value={editForm.full_name || ""} onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">อีเมล *</label>
                <input required type="email" value={editForm.email || ""} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">เบอร์โทร</label>
                <input value={editForm.phone || ""} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">ชื่อบริษัท</label>
                <input value={editForm.company || ""} onChange={(e) => setEditForm({ ...editForm, company: e.target.value })} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">เลขประจำตัวผู้เสียภาษี</label>
                <input value={editForm.tax_id || ""} onChange={(e) => setEditForm({ ...editForm, tax_id: e.target.value })} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">รหัสไปรษณีย์</label>
                <input value={editForm.postcode || ""} onChange={(e) => setEditForm({ ...editForm, postcode: e.target.value })} className="input-field" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">ที่อยู่</label>
                <textarea value={editForm.address || ""} onChange={(e) => setEditForm({ ...editForm, address: e.target.value })} className="input-field" rows={2} />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">จังหวัด</label>
                <input value={editForm.province || ""} onChange={(e) => setEditForm({ ...editForm, province: e.target.value })} className="input-field" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">ข้อมูลเพิ่มเติม (สำหรับสมาชิก)</label>
                <textarea value={editForm.extra_info || ""} onChange={(e) => setEditForm({ ...editForm, extra_info: e.target.value })} className="input-field" rows={3} placeholder="หมายเหตุภายในเกี่ยวกับสมาชิก" />
              </div>
            </div>
            <div className="mt-4 flex gap-2 justify-end">
              <button type="button" onClick={() => { setEditing(false); setMessage(""); }} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">ยกเลิก</button>
              <button type="submit" disabled={saving} className="px-4 py-2 bg-primary-700 text-white rounded-lg hover:bg-primary-800 disabled:opacity-50">
                {saving ? "กำลังบันทึก..." : "💾 บันทึก"}
              </button>
            </div>
          </form>
        )}

        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl shadow-sm">
            <div className="text-xs text-gray-500">ออร์เดอร์ทั้งหมด</div>
            <div className="text-2xl font-bold text-primary-700 mt-1">{stats?.total_orders || 0}</div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm">
            <div className="text-xs text-gray-500">ยอดซื้อรวม</div>
            <div className="text-2xl font-bold text-primary-700 mt-1">฿{Number(stats?.total_spent || 0).toLocaleString()}</div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm">
            <div className="text-xs text-gray-500">ยอดสำเร็จ</div>
            <div className="text-2xl font-bold text-green-700 mt-1">฿{Number(stats?.completed_spent || 0).toLocaleString()}</div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm">
            <div className="text-xs text-gray-500">ออร์เดอร์ล่าสุด</div>
            <div className="text-sm font-medium text-gray-700 mt-1">
              {stats?.last_order_date ? new Date(stats.last_order_date).toLocaleDateString("th-TH") : "-"}
            </div>
          </div>
        </div>

        <div className="mt-6 bg-white rounded-xl shadow-sm">
          <div className="px-6 py-4 border-b font-semibold">📦 ออร์เดอร์ ({orders.length})</div>
          {orders.length === 0 ? (
            <div className="p-8 text-center text-gray-500">ยังไม่มีออร์เดอร์</div>
          ) : (
            <div className="divide-y">
              {orders.map(o => {
                const s = STATUS_LABELS[o.status] || { label: o.status, color: "bg-gray-100 text-gray-800" };
                return (
                  <div key={o.id} className="px-6 py-3 flex justify-between items-center hover:bg-gray-50">
                    <div>
                      <Link href={`/admin/orders/${o.id}`} className="font-medium text-gray-900 hover:text-primary-700">#{o.order_number}</Link>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {new Date(o.created_at).toLocaleString("th-TH")} • {o.item_count} รายการ
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-primary-700">฿{Number(o.total).toLocaleString()}</div>
                      <span className={`inline-block mt-1 px-2 py-0.5 text-xs rounded-full ${s.color}`}>{s.label}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminCustomerDetailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">กำลังโหลด...</div>}>
      <CustomerDetailContent />
    </Suspense>
  );
}