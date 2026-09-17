"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface AdminCustomer {
  id: number; email: string; full_name: string; phone?: string;
  is_verified: number; is_active: number;
  last_login?: string; created_at: string;
  order_count: number; total_spent: number;
}

export default function AdminCustomersPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<AdminCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("admin_token") : null;
    if (!token) { router.push("/admin/login"); return; }
    loadCustomers(token, "");
  }, [router]);

  async function loadCustomers(token: string, q: string) {
    setLoading(true); setError("");
    try {
      const r = await fetch(`/api/admin/customers${q ? `?search=${encodeURIComponent(q)}` : ""}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (r.status === 401) { router.push("/admin/login"); return; }
      const data = await r.json();
      setCustomers(data.customers || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const token = localStorage.getItem("admin_token");
    if (token) loadCustomers(token, search);
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center">กำลังโหลด...</div>;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <Link href="/admin" className="text-sm text-gray-600 hover:text-gray-800">← กลับหน้าหลักบ้าน</Link>
            <h1 className="text-2xl font-bold text-gray-900 mt-1">👥 จัดการสมาชิก</h1>
          </div>
          <div className="bg-white px-4 py-2 rounded-lg shadow-sm text-sm">
            <strong>{customers.length}</strong> สมาชิก
          </div>
        </div>

        <form onSubmit={handleSearch} className="mb-4 flex gap-2">
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="🔍 ค้นหาด้วยอีเมล ชื่อ หรือเบอร์โทร..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
          <button type="submit" className="px-6 py-2 bg-primary-700 text-white rounded-lg hover:bg-primary-800">ค้นหา</button>
        </form>

        {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg">{error}</div>}

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ชื่อ/อีเมล</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">โทร</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">สถานะ</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">ออร์เดอร์</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">ยอดซื้อรวม</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">เข้าใช้ล่าสุด</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {customers.length === 0 ? (
                  <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-500">ยังไม่มีสมาชิก</td></tr>
                ) : customers.map(c => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">#{c.id}</td>
                    <td className="px-4 py-3">
                      <Link href={`/admin/customers/detail?id=${c.id}`} className="font-medium text-primary-700 hover:underline">{c.full_name}</Link>
                      <div className="text-xs text-gray-500">{c.email}</div>
                    </td>
                    <td className="px-4 py-3 text-sm">{c.phone || "-"}</td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex flex-col gap-1 items-center">
                        {c.is_verified ? <span className="px-2 py-0.5 text-xs bg-green-100 text-green-800 rounded-full">✓ ยืนยัน</span> : <span className="px-2 py-0.5 text-xs bg-yellow-100 text-yellow-800 rounded-full">รอยืนยัน</span>}
                        {c.is_active ? <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full">ใช้งาน</span> : <span className="px-2 py-0.5 text-xs bg-red-100 text-red-800 rounded-full">ระงับ</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-right">{c.order_count}</td>
                    <td className="px-4 py-3 text-sm text-right font-medium">฿{Number(c.total_spent).toLocaleString()}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{c.last_login ? new Date(c.last_login).toLocaleString("th-TH") : "-"}</td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={async () => {
                      if (!confirm(`ต้องการลบสมาชิก "${c.full_name}" (${c.email}) หรือไม่?\n\n⚠️ ออร์เดอร์ที่สั่งซื้อจะยังคงอยู่ แต่ customer_id จะถูกตัดออก`)) return;
                      const tok = localStorage.getItem("admin_token");
                      const r = await fetch(`/api/admin/customers/${c.id}`, { method: "DELETE", headers: { Authorization: `Bearer ${tok}` } });
                      if (r.ok) {
                        loadCustomers(tok!, search);
                      } else {
                        const data = await r.json().catch(() => ({}));
                        alert("ลบไม่สำเร็จ: " + (data.error || ""));
                      }
                    }} className="text-red-600 hover:text-red-800 hover:bg-red-50 px-2 py-1 rounded text-sm" title="ลบสมาชิก">
                      🗑️
                    </button>
                  </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}