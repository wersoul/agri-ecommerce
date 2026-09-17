"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Order, OrderItem } from "@/lib/types";

// NOTE: do NOT export `runtime = "edge"` here.
// In next-on-pages@1.10 + Cloudflare Pages, client component pages that
// declare `runtime = "edge"` without server data dependencies can hang
// the worker (HTTP 1101). Static rendering works correctly.

interface FullOrder extends Order {
  customer_id?: number | null;
  extra_info?: string;
}

export default function AdminOrderDetailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">กำลังโหลด...</div>}>
      <OrderDetailContent />
    </Suspense>
  );
}

function OrderDetailContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id") || "";
  const [order, setOrder] = useState<FullOrder | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState("");
  // edit form state
  const [status, setStatus] = useState("pending");
  const [shipping, setShipping] = useState<number>(0);
  const [note, setNote] = useState("");
  const [extraInfo, setExtraInfo] = useState("");
  const [editItems, setEditItems] = useState<OrderItem[]>([]);
  const [productOptions, setProductOptions] = useState<{ id: number; name: string; price: number }[]>([]);

  useEffect(() => {
    if (!id) { window.location.href = "/admin/orders"; return; }
    const token = typeof window !== "undefined" ? localStorage.getItem("admin_token") : null;
    if (!token) { window.location.href = "/admin/login"; return; }
    loadOrder(token);
    loadProductOptions(token);
  }, [id]);

  async function loadOrder(token: string) {
    setLoading(true);
    try {
      const r = await fetch(`/api/admin/orders/${id}/`, { headers: { Authorization: `Bearer ${token}` } });
      if (r.status === 401) { window.location.href = "/admin/login"; return; }
      if (!r.ok) { window.location.href = "/admin/orders"; return; }
      const data = await r.json();
      setOrder(data.order);
      setItems(data.items || []);
      setStatus(data.order.status || "pending");
      setShipping(data.order.shipping || 0);
      setNote(data.order.note || "");
      setExtraInfo(data.order.extra_info || "");
      setEditItems(data.items || []);
    } finally { setLoading(false); }
  }

  async function loadProductOptions(token: string) {
    try {
      const r = await fetch(`/api/admin/products/`, { headers: { Authorization: `Bearer ${token}` } });
      if (r.ok) {
        const data = await r.json();
        setProductOptions((data || []).map((p: any) => ({ id: p.id, name: p.name, price: p.price })));
      }
    } catch {}
  }

  function addItem() {
    setEditItems([...editItems, { product_id: 0, product_name: "", product_price: 0, quantity: 1, subtotal: 0 }]);
  }
  function removeItem(idx: number) {
    setEditItems(editItems.filter((_, i) => i !== idx));
  }
  function updateItem(idx: number, patch: Partial<OrderItem>) {
    setEditItems(editItems.map((it, i) => {
      if (i !== idx) return it;
      const merged = { ...it, ...patch };
      if ("product_id" in patch && patch.product_id !== it.product_id) {
        const opt = productOptions.find((p) => p.id === patch.product_id);
        if (opt) { merged.product_name = opt.name; merged.product_price = opt.price; }
      }
      merged.subtotal = (merged.quantity || 0) * (merged.product_price || 0);
      return merged;
    }));
  }

  const editSubtotal = editItems.reduce((s, it) => s + ((it.subtotal) || ((it.quantity || 0) * (it.product_price || 0))), 0);
  const editTotal = editSubtotal + (shipping || 0);

  async function saveChanges() {
    const token = localStorage.getItem("admin_token");
    if (!token) return;
    setSaving(true); setMessage("");
    try {
      const r = await fetch(`/api/admin/orders/${id}/`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ status, shipping, note, extra_info: extraInfo, items: editItems }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) { setMessage("❌ " + (data.error || "บันทึกไม่สำเร็จ")); return; }
      setMessage("✅ บันทึกเรียบร้อย");
      await loadOrder(token);
    } catch (e: any) { setMessage("❌ " + (e.message || "")); }
    finally { setSaving(false); }
  }

  async function deleteOrder() {
    if (!order) return;
    if (!confirm(`ต้องการลบออร์เดอร์ #${order.order_number} หรือไม่?`)) return;
    const token = localStorage.getItem("admin_token");
    if (!token) return;
    setDeleting(true);
    try {
      const r = await fetch(`/api/admin/orders/${id}/`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      if (r.ok) window.location.href = "/admin/orders";
      else { const d = await r.json().catch(() => ({})); setMessage("❌ ลบไม่สำเร็จ: " + (d.error || "")); setDeleting(false); }
    } catch (e: any) { setMessage("❌ " + (e.message || "")); setDeleting(false); }
  }

  function printInvoice() { window.print(); }

  // SSR fallback: if useParams hasn't populated yet on first render, show loading
  if (!id) return <div className="min-h-screen flex items-center justify-center">กำลังโหลด...</div>;

  if (loading) return <div className="min-h-screen flex items-center justify-center">กำลังโหลด...</div>;
  if (!order) return null;

  const STATUS_LABELS: Record<string, { label: string; color: string }> = {
    pending: { label: "รอดำเนินการ", color: "bg-yellow-100 text-yellow-800" },
    processing: { label: "กำลังจัดเตรียม", color: "bg-blue-100 text-blue-800" },
    shipped: { label: "จัดส่งแล้ว", color: "bg-purple-100 text-purple-800" },
    completed: { label: "สำเร็จ", color: "bg-green-100 text-green-800" },
    confirmed: { label: "ยืนยันแล้ว", color: "bg-blue-100 text-blue-800" },
    cancelled: { label: "ยกเลิก", color: "bg-red-100 text-red-800" },
  };
  const s = STATUS_LABELS[order.status || "pending"] || STATUS_LABELS.pending;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * { visibility: hidden !important; }
          .print-area, .print-area * { visibility: visible !important; }
          .print-area { position: absolute; left: 0; top: 0; width: 100%; padding: 24px; background: white; display: block !important; }
          .no-print { display: none !important; }
        }
      ` }} />
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto no-print">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <Link href="/admin/orders" className="text-sm text-gray-600 hover:text-gray-800">← กลับหน้าคำสั่งซื้อ</Link>
          <div className="flex gap-2">
            <button onClick={printInvoice} className="px-4 py-2 bg-primary-700 text-white rounded-lg hover:bg-primary-800">🖨️ สร้าง PDF ใบแจ้งหนี้</button>
            <button onClick={deleteOrder} disabled={deleting} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50">{deleting ? "กำลังลบ..." : "🗑️ ลบออร์เดอร์"}</button>
          </div>
        </div>
        {message && <div className="mb-3 p-3 bg-blue-50 border border-blue-200 text-blue-800 rounded-lg text-sm">{message}</div>}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-4">
          <div className="flex justify-between items-start flex-wrap gap-3">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">ออร์เดอร์ #{order.order_number}</h1>
              <p className="text-sm text-gray-500 mt-1">{order.created_at && new Date(order.created_at).toLocaleString("th-TH")}</p>
              <p className="text-sm text-gray-700 mt-2">ลูกค้า: <strong>{order.customer_name}</strong> ({order.customer_phone})</p>
              <p className="text-sm text-gray-700">อีเมล: {order.customer_email || "-"}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm ${s.color}`}>{s.label}</span>
          </div>
          <div className="mt-4 pt-4 border-t text-sm">
            <strong>📍 ที่อยู่จัดส่ง:</strong>
            <p className="mt-1 whitespace-pre-line">{order.customer_address} {order.customer_province} {order.customer_postcode}</p>
          </div>
          {(note || extraInfo) && (
            <div className="mt-3 text-sm">
              {note && <div><strong>📝 หมายเหตุ:</strong> {note}</div>}
              {extraInfo && <div className="mt-1 bg-amber-50 border-l-4 border-amber-400 p-2 rounded"><strong>ข้อมูลเพิ่มเติมจากลูกค้า:</strong> {extraInfo}</div>}
            </div>
          )}
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-sm p-6 mb-4">
          <h2 className="font-semibold text-lg mb-4">⚙️ แก้ไขออร์เดอร์</h2>
          <div className="grid md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">สถานะ</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)} className="input-field">
                <option value="pending">รอดำเนินการ</option>
                <option value="confirmed">ยืนยัน</option>
                <option value="processing">กำลังจัดเตรียม</option>
                <option value="shipped">จัดส่ง</option>
                <option value="completed">เสร็จสิ้น</option>
                <option value="cancelled">ยกเลิก</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">ค่าจัดส่ง (฿)</label>
              <input type="number" min="0" step="0.01" value={shipping} onChange={(e) => setShipping(parseFloat(e.target.value) || 0)} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">ยอดรวม (คำนวณ)</label>
              <div className="input-field bg-gray-50">฿{editTotal.toLocaleString()}</div>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">หมายเหตุ (ภายใน)</label>
              <textarea value={note} onChange={(e) => setNote(e.target.value)} className="input-field" rows={2} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">ข้อมูลเพิ่มเติม (ลูกค้า)</label>
              <textarea value={extraInfo} onChange={(e) => setExtraInfo(e.target.value)} className="input-field" rows={2} />
            </div>
          </div>
          <h3 className="font-semibold mb-2">📦 รายการสินค้า</h3>
          <div className="space-y-2">
            {editItems.map((it, idx) => (
              <div key={idx} className="grid md:grid-cols-12 gap-2 items-center p-2 bg-gray-50 rounded">
                <select value={it.product_id} onChange={(e) => updateItem(idx, { product_id: parseInt(e.target.value) || 0 })} className="input-field md:col-span-4">
                  <option value={0}>— เลือกสินค้า —</option>
                  {productOptions.map(p => <option key={p.id} value={p.id}>{p.name} (฿{p.price.toLocaleString()})</option>)}
                </select>
                <input type="text" value={it.product_name} onChange={(e) => updateItem(idx, { product_name: e.target.value })} className="input-field md:col-span-3" placeholder="ชื่อสินค้า" />
                <input type="number" min="0" step="0.01" value={it.product_price} onChange={(e) => updateItem(idx, { product_price: parseFloat(e.target.value) || 0 })} className="input-field md:col-span-2" placeholder="ราคา" />
                <input type="number" min="1" value={it.quantity} onChange={(e) => updateItem(idx, { quantity: Math.max(1, parseInt(e.target.value) || 1) })} className="input-field md:col-span-1" placeholder="จำนวน" />
                <div className="md:col-span-1 text-right text-sm font-medium">฿{((it.quantity || 0) * (it.product_price || 0)).toLocaleString()}</div>
                <button onClick={() => removeItem(idx)} className="md:col-span-1 text-red-600 hover:bg-red-50 rounded px-2 py-1 text-sm">✕</button>
              </div>
            ))}
          </div>
          <button onClick={addItem} className="mt-3 px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded">+ เพิ่มรายการ</button>
          <div className="mt-4 flex justify-end">
            <button onClick={saveChanges} disabled={saving} className="px-5 py-2 bg-primary-700 text-white rounded-lg hover:bg-primary-800 disabled:opacity-50">{saving ? "กำลังบันทึก..." : "💾 บันทึกการแก้ไข"}</button>
          </div>
        </div>
      </div>
      <div className="print-area max-w-4xl mx-auto bg-white p-8 border rounded-lg" style={{ display: "none" }}>
        <div className="flex justify-between items-start border-b pb-4 mb-4">
          <div>
            <h1 className="text-3xl font-bold text-primary-700">KNK Part</h1>
            <p className="text-sm text-gray-600">ใบแจ้งหนี้ / Invoice</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">เลขที่</p>
            <p className="text-xl font-bold">#{order.order_number}</p>
            <p className="text-sm text-gray-500 mt-2">{order.created_at && new Date(order.created_at).toLocaleDateString("th-TH")}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-6 mb-6 text-sm">
          <div>
            <p className="text-xs text-gray-500 mb-1">ผู้สั่งซื้อ</p>
            <p className="font-bold">{order.customer_name}</p>
            <p>{order.customer_phone}</p>
            {order.customer_email && <p>{order.customer_email}</p>}
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">ที่อยู่จัดส่ง</p>
            <p className="whitespace-pre-line">{order.customer_address}</p>
            <p>{order.customer_province} {order.customer_postcode}</p>
          </div>
        </div>
        <table className="w-full text-sm border-collapse mb-4">
          <thead>
            <tr className="border-b-2 border-gray-300">
              <th className="text-left py-2">รายการ</th>
              <th className="text-center py-2 w-20">จำนวน</th>
              <th className="text-right py-2 w-28">ราคา/หน่วย</th>
              <th className="text-right py-2 w-28">รวม</th>
            </tr>
          </thead>
          <tbody>
            {editItems.map((it, idx) => (
              <tr key={idx} className="border-b">
                <td className="py-2">{it.product_name}</td>
                <td className="text-center py-2">{it.quantity}</td>
                <td className="text-right py-2">฿{Number(it.product_price).toLocaleString()}</td>
                <td className="text-right py-2">฿{((it.quantity || 0) * (it.product_price || 0)).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex justify-end">
          <div className="w-64 text-sm">
            <div className="flex justify-between py-1"><span>รวมค่าสินค้า</span><span>฿{editSubtotal.toLocaleString()}</span></div>
            <div className="flex justify-between py-1"><span>ค่าจัดส่ง</span><span>฿{(shipping || 0).toLocaleString()}</span></div>
            <div className="flex justify-between py-2 border-t mt-1 text-lg font-bold text-primary-700"><span>ยอดรวมทั้งสิ้น</span><span>฿{editTotal.toLocaleString()}</span></div>
          </div>
        </div>
        {extraInfo && (
          <div className="mt-6 p-3 bg-amber-50 border-l-4 border-amber-400 text-sm">
            <strong>ข้อมูลเพิ่มเติม:</strong>
            <p className="mt-1 whitespace-pre-line">{extraInfo}</p>
          </div>
        )}
        <div className="mt-12 pt-4 border-t text-center text-xs text-gray-500">ขอบคุณที่ใช้บริการ KNK Part — อะไหล่เกษตรคุณภาพ</div>
      </div>
    </>
  );
}
