"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Preset = "today" | "week" | "month" | "year" | "all" | "custom";

function SalesChart({ series }: { series: { period: string; orders: number; revenue: number }[] }) {
  if (!series || series.length === 0) return null;
  const maxRev = Math.max(...series.map((s) => Number(s.revenue) || 0), 1);
  const maxOrders = Math.max(...series.map((s) => s.orders || 0), 1);
  const barCount = series.length;
  const gap = 0.2;
  const barWidth = (10 - gap * (barCount + 1)) / barCount;
  return (
    <div className="relative h-48 mt-2">
      <svg viewBox={`0 0 ${barCount * 12} 100`} preserveAspectRatio="none" className="w-full h-full">
        {series.map((s, i) => {
          const revHeight = ((Number(s.revenue) || 0) / maxRev) * 70;
          const orderHeight = ((s.orders || 0) / maxOrders) * 70;
          const x = gap + i * (barWidth + gap);
          return (
            <g key={s.period}>
              <rect x={x} y={80 - revHeight} width={barWidth * 0.45} height={revHeight} fill="#16a34a" />
              <rect x={x + barWidth * 0.45} y={80 - orderHeight} width={barWidth * 0.45} height={orderHeight} fill="#3b82f6" opacity="0.7" />
            </g>
          );
        })}
      </svg>
      <div className="flex justify-between text-[10px] text-gray-500 mt-1 overflow-x-auto">
        {series.length <= 12 ? series.map((s) => <span key={s.period} className="flex-shrink-0 w-12 text-center">{s.period.slice(5)}</span>) :
          (<><span>{series[0].period.slice(5)}</span><span>{series[Math.floor(series.length / 2)].period.slice(5)}</span><span>{series[series.length - 1].period.slice(5)}</span></>)}
      </div>
      <div className="flex gap-4 text-xs mt-2 justify-end">
        <span className="flex items-center gap-1"><span className="w-3 h-3 bg-green-600 inline-block rounded"></span> ยอดขาย (฿)</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 bg-blue-500 inline-block rounded opacity-70"></span> จำนวนออร์เดอร์</span>
      </div>
    </div>
  );
}

function AnalyticsView({ analytics }: { analytics: any }) {
  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div className="bg-green-50 rounded-lg p-4">
          <div className="text-xs text-gray-600">ยอดขายรวม</div>
          <div className="text-2xl font-bold text-green-700">฿{Number(analytics.summary.net_revenue || 0).toLocaleString()}</div>
          {analytics.comparison && analytics.comparison.revenue_change_pct !== null && (
            <div className={`text-xs mt-1 ${analytics.comparison.revenue_change_pct >= 0 ? "text-green-600" : "text-red-600"}`}>
              {analytics.comparison.revenue_change_pct >= 0 ? "▲" : "▼"} {Math.abs(analytics.comparison.revenue_change_pct).toFixed(1)}% vs ช่วงก่อน
            </div>
          )}
        </div>
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="text-xs text-gray-600">ออร์เดอร์ทั้งหมด</div>
          <div className="text-2xl font-bold text-blue-700">{analytics.summary.total_orders || 0}</div>
        </div>
        <div className="bg-purple-50 rounded-lg p-4">
          <div className="text-xs text-gray-600">ลูกค้าไม่ซ้ำ</div>
          <div className="text-2xl font-bold text-purple-700">{analytics.summary.unique_customers || 0}</div>
        </div>
        <div className="bg-amber-50 rounded-lg p-4">
          <div className="text-xs text-gray-600">ยอดเฉลี่ย/ออร์เดอร์</div>
          <div className="text-2xl font-bold text-amber-700">฿{Math.round(Number(analytics.summary.avg_order_value || 0)).toLocaleString()}</div>
        </div>
      </div>
      {analytics.series && analytics.series.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <h3 className="text-sm font-semibold mb-2 text-gray-700">📈 ยอดขายราย{analytics.range.bucket === "month" ? "เดือน" : "วัน"}</h3>
          <SalesChart series={analytics.series} />
        </div>
      )}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-gray-50 rounded-lg p-3">
          <h3 className="text-sm font-semibold mb-2 text-gray-700">🏆 สินค้าขายดี (Top 10)</h3>
          {analytics.top_products && analytics.top_products.length > 0 ? (
            <div className="space-y-1 text-sm">
              {analytics.top_products.slice(0, 10).map((p: any, idx: number) => (
                <div key={p.product_id} className="flex justify-between items-center p-1.5 bg-white rounded">
                  <span><span className="text-gray-500 mr-2">{idx + 1}.</span>{p.product_name}</span>
                  <span className="text-primary-700 font-medium">฿{Number(p.total_revenue).toLocaleString()} ({p.total_qty} ชิ้น)</span>
                </div>
              ))}
            </div>
          ) : <p className="text-sm text-gray-500">ยังไม่มีข้อมูล</p>}
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <h3 className="text-sm font-semibold mb-2 text-gray-700">👥 ลูกค้า VIP (Top 10)</h3>
          {analytics.top_customers && analytics.top_customers.length > 0 ? (
            <div className="space-y-1 text-sm">
              {analytics.top_customers.map((c: any, idx: number) => (
                <div key={c.customer_id} className="flex justify-between items-center p-1.5 bg-white rounded">
                  <span><span className="text-gray-500 mr-2">{idx + 1}.</span>{c.customer_name}</span>
                  <span className="text-primary-700 font-medium">฿{Number(c.total_spent).toLocaleString()} ({c.order_count} ครั้ง)</span>
                </div>
              ))}
            </div>
          ) : <p className="text-sm text-gray-500">ยังไม่มีข้อมูล</p>}
        </div>
      </div>
      {analytics.status_breakdown && analytics.status_breakdown.length > 0 && (
        <div className="mt-4 bg-gray-50 rounded-lg p-3">
          <h3 className="text-sm font-semibold mb-2 text-gray-700">📋 สถานะออร์เดอร์</h3>
          <div className="flex flex-wrap gap-3">
            {analytics.status_breakdown.map((s: any) => (
              <div key={s.status} className="bg-white px-3 py-2 rounded text-sm">
                <span className="font-medium">{s.status}</span>: <span className="text-gray-700">{s.count}</span> <span className="text-primary-700">฿{Number(s.revenue).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState({
    products: 0,
    categories: 0,
    orders: 0,
    customers: 0,
  });
  const [preset, setPreset] = useState<Preset>("month");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [analytics, setAnalytics] = useState<any>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    if (!token) {
      router.push("/admin/login");
      return;
    }
    Promise.all([
      fetch("/api/admin/products", { headers: { Authorization: `Bearer ${token}` } }).then((r) => (r.ok ? r.json() : [])),
      fetch("/api/admin/categories", { headers: { Authorization: `Bearer ${token}` } }).then((r) => (r.ok ? r.json() : [])),
      fetch("/api/admin/orders", { headers: { Authorization: `Bearer ${token}` } }).then((r) => (r.ok ? r.json() : [])),
      fetch("/api/admin/customers", { headers: { Authorization: `Bearer ${token}` } }).then((r) => (r.ok ? r.json() : { customers: [] })),
    ]).then(([products, categories, orders, customersData]) => {
      setStats({
        products: Array.isArray(products) ? products.length : 0,
        categories: Array.isArray(categories) ? categories.length : 0,
        orders: Array.isArray(orders) ? orders.length : 0,
        customers: customersData?.customers?.length || 0,
      });
    });
  }, [router]);

  // Load analytics
  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    if (!token) return;
    setAnalyticsLoading(true);
    const params = new URLSearchParams();
    if (preset === "custom" && from && to) {
      params.set("from", from);
      params.set("to", to);
    } else if (preset !== "custom") {
      params.set("preset", preset);
    }
    fetch(`/api/admin/analytics?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setAnalytics(data))
      .catch(() => setAnalytics(null))
      .finally(() => setAnalyticsLoading(false));
  }, [preset, from, to]);

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    router.push("/admin/login");
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">🏠 หลังบ้าน</h1>
        <button onClick={handleLogout} className="btn-secondary">
          ออกจากระบบ
        </button>
      </div>

      <div className="grid md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-500 text-sm">สินค้าทั้งหมด</p>
          <p className="text-4xl font-bold text-primary-700">{stats.products}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-500 text-sm">หมวดหมู่</p>
          <p className="text-4xl font-bold text-primary-700">{stats.categories}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-500 text-sm">คำสั่งซื้อ</p>
          <p className="text-4xl font-bold text-primary-700">{stats.orders}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-500 text-sm">สมาชิก</p>
          <p className="text-4xl font-bold text-primary-700">{stats.customers}</p>
        </div>
      </div>

      {/* Analytics Dashboard */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
          <h2 className="text-xl font-bold">📊 วิเคราะห์ยอดขาย</h2>
          <div className="flex flex-wrap items-center gap-2">
            <select value={preset} onChange={(e) => setPreset(e.target.value as Preset)} className="border rounded-lg px-3 py-1.5 text-sm">
              <option value="today">วันนี้</option>
              <option value="week">7 วันล่าสุด</option>
              <option value="month">30 วันล่าสุด</option>
              <option value="year">1 ปีล่าสุด</option>
              <option value="all">ทั้งหมด</option>
              <option value="custom">กำหนดเอง</option>
            </select>
            {preset === "custom" && (
              <>
                <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="border rounded-lg px-2 py-1.5 text-sm" />
                <span>ถึง</span>
                <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="border rounded-lg px-2 py-1.5 text-sm" />
              </>
            )}
          </div>
        </div>
        {analyticsLoading && <div className="text-center py-6 text-gray-500">กำลังโหลดข้อมูล...</div>}
        {analytics && !analyticsLoading && (
          <AnalyticsView analytics={analytics} />
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Link
          href="/admin/products"
          className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition"
        >
          <h3 className="font-bold text-xl mb-2">📦 จัดการสินค้า</h3>
          <p className="text-gray-600">เพิ่ม แก้ไข ลบสินค้า</p>
        </Link>
        <Link
          href="/admin/categories"
          className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition"
        >
          <h3 className="font-bold text-xl mb-2">🏷️ จัดการหมวดหมู่</h3>
          <p className="text-gray-600">เพิ่ม แก้ไข ลบหมวดหมู่สินค้า</p>
        </Link>
        <Link
          href="/admin/subcategories"
          className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition"
        >
          <h3 className="font-bold text-xl mb-2">🏷️ จัดการประเภทย่อย</h3>
          <p className="text-gray-600">เพิ่มประเภทย่อยในหมวดหมู่ต่างๆ</p>
        </Link>
        <Link
          href="/admin/products/bulk-upload"
          className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition"
        >
          <h3 className="font-bold text-xl mb-2">📦 เพิ่มสินค้าจำนวนมาก</h3>
          <p className="text-gray-600">อัปโหลดหลายรูป ตั้งชื่อ-ประเภท พร้อมกัน</p>
        </Link>
        <Link
          href="/admin/orders"
          className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition"
        >
          <h3 className="font-bold text-xl mb-2">📋 จัดการคำสั่งซื้อ</h3>
          <p className="text-gray-600">ดูและจัดการคำสั่งซื้อจากลูกค้า</p>
        </Link>
        <Link
          href="/admin/contact"
          className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition"
        >
          <h3 className="font-bold text-xl mb-2">📞 แก้ไขข้อมูลติดต่อ</h3>
          <p className="text-gray-600">แก้ไขเบอร์โทร LINE ที่อยู่ เวลาทำการ แผนที่</p>
        </Link>
        <Link
          href="/admin/customers"
          className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition"
        >
          <h3 className="font-bold text-xl mb-2">👥 จัดการสมาชิก</h3>
          <p className="text-gray-600">ดูสมาชิก ออร์เดอร์ ยอดซื้อ</p>
        </Link>
        <Link
          href="/"
          className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition"
        >
          <h3 className="font-bold text-xl mb-2">🏠 ดูหน้าร้าน</h3>
          <p className="text-gray-600">เปิดดูหน้าเว็บไซต์ที่ลูกค้าเห็น</p>
        </Link>
        <Link
          href="/admin/change-password"
          className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition"
        >
          <h3 className="font-bold text-xl mb-2">🔑 เปลี่ยนรหัสผ่าน</h3>
          <p className="text-gray-600">เปลี่ยนรหัสผ่านบัญชีผู้ดูแลระบบ</p>
        </Link>
      </div>
    </div>
  );
}