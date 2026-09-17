"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Category, Subcategory } from "@/lib/types";
import BulkRowItem, { BulkRow } from "@/components/BulkRowItem";

function slugify(s: string) {
  return s.toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-");
}

function nameFromFilename(fn: string) {
  return fn.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").trim();
}

export default function BulkUploadPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [rows, setRows] = useState<BulkRow[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ created: number; failed: number; errors: string[] } | null>(null);
  const [defaultCategory, setDefaultCategory] = useState<number>(0);

  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    if (!token) { router.push("/admin/login"); return; }
    fetch("/api/admin/categories/", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => {
        setCategories(Array.isArray(d) ? d : []);
        setDefaultCategory(Array.isArray(d) && d[0]?.id ? d[0].id : 0);
      });
  }, [router]);

  function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    // Each file is uploaded immediately by BulkRowItem when selected.
    // We only seed rows here — no preview blob URL anymore (preview comes
    // from the uploaded R2 URL once each item finishes uploading).
    const newRows: BulkRow[] = Array.from(files)
      .filter((f) => f.type.startsWith("image/"))
      .map((f) => ({
        id: Math.random().toString(36).slice(2),
        name: nameFromFilename(f.name),
        image_url: "",
        image_preview: "",
        uploading: true,
        upload_error: null,
        category_id: defaultCategory,
        subcategory_id: 0,
        price: "",
        stock: "",
        description: "",
        _pendingFile: f,
      })) as any;
    setRows((prev) => [...prev, ...newRows]);
    // Trigger upload for each new row via a synthetic event
    // (BulkRowItem picks up via file input change triggered separately).
    // We use a small trick: simulate a click by setting image_url via
    // direct upload here, so users see progress without extra clicks.
    newRows.forEach(async (r: any) => {
      if (!r._pendingFile) return;
      try {
        const fd = new FormData();
        fd.append("file", r._pendingFile);
        const token = localStorage.getItem("admin_token");
        const res = await fetch("/api/admin/upload/", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: fd,
        });
        const data = await res.json();
        if (!res.ok || !data.url) throw new Error(data.error || "อัปโหลดไม่สำเร็จ");
        setRows((prev) => prev.map((row) =>
          row.id === r.id
            ? { ...row, image_url: data.url, image_preview: data.url, uploading: false, upload_error: null }
            : row
        ));
      } catch (e: any) {
        setRows((prev) => prev.map((row) =>
          row.id === r.id
            ? { ...row, uploading: false, upload_error: e.message || "อัปโหลดไม่สำเร็จ" }
            : row
        ));
      }
    });
  }

  function handleUrlPaste() {
    const urls = window.prompt("วาง URL รูปภาพ (1 บรรทัดต่อ 1 รูป):", "") || "";
    const lines = urls.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.startsWith("http"));
    if (lines.length === 0) return;
    const newRows: BulkRow[] = lines.map((url) => {
      const fn = url.split("/").pop() || "image";
      return {
        id: Math.random().toString(36).slice(2),
        name: nameFromFilename(fn),
        image_url: url,
        image_preview: url,
        uploading: false,
        upload_error: null,
        category_id: defaultCategory,
        subcategory_id: 0,
        price: "",
        stock: "",
        description: "",
      };
    });
    setRows((prev) => [...prev, ...newRows]);
  }

  function updateRow(id: string, patch: Partial<BulkRow>) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  function removeRow(id: string) {
    setRows((prev) => prev.filter((r) => r.id !== id));
  }

  function applyDefaultToAll(field: "category_id" | "subcategory_id", value: number) {
    setRows((prev) => prev.map((r) => ({ ...r, [field]: value })));
  }

  function applyNameToAll() {
    const n = window.prompt("ตั้งชื่อสินค้าเดียวกันทุกแถว:", rows[0]?.name || "");
    if (!n) return;
    setRows((prev) => prev.map((r) => ({ ...r, name: n, slug: slugify(n) })));
  }

  async function handleSubmit() {
    if (rows.length === 0) { alert("ไม่มีสินค้า"); return; }
    if (!localStorage.getItem("admin_token")) { alert("กรุณาเข้าสู่ระบบใหม่"); router.push("/admin/login"); return; }
    if (rows.some((r) => r.uploading)) { alert("กรุณารอให้อัปโหลดรูปให้เสร็จก่อน"); return; }

    setSubmitting(true);
    setResult(null);
    console.log(`[BulkUpload] เริ่มบันทึก ${rows.length} รายการ`);
    try {
      const items: any[] = [];
      const errors: string[] = [];
      for (let i = 0; i < rows.length; i++) {
        const r = rows[i];
        if (!r.name.trim()) { errors.push(`#${i + 1}: ไม่มีชื่อ`); continue; }
        if (!r.image_url) { errors.push(`#${i + 1} (${r.name}): ยังไม่มีรูปภาพ`); continue; }
        items.push({
          name: r.name.trim(),
          slug: slugify(r.name),
          description: r.description,
          price: r.price === "" ? 0 : parseFloat(r.price),
          stock: r.stock === "" ? 0 : parseInt(r.stock),
          image_url: r.image_url,
          category_id: r.category_id || undefined,
          subcategory_id: r.subcategory_id || undefined,
          is_active: 1,
        });
      }
      console.log(`[BulkUpload] ready=${items.length}, skipped=${errors.length}`);
      if (items.length === 0) {
        setResult({ created: 0, failed: errors.length, errors });
        setSubmitting(false);
        return;
      }
      const token = localStorage.getItem("admin_token");
      const res = await fetch("/api/admin/products/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ items }),
      });
      const data = await res.json();
      console.log(`[BulkUpload] bulk response:`, { status: res.status, data });
      if (!res.ok) throw new Error(data.error || "bulk failed");
      setResult({ created: data.created, failed: data.failed + errors.length, errors: [...errors, ...(data.errors || [])] });
      if (data.created > 0 && data.failed === 0) {
        setRows([]);
      } else if (data.created > 0) {
        setRows((prev) => prev.slice(data.created));
      }
    } catch (e: any) {
      console.error("[BulkUpload] fatal error:", e);
      alert(`เกิดข้อผิดพลาด: ${e.message}`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/admin/products" className="text-sm text-gray-600 hover:text-primary-600">← กลับหน้าจัดการสินค้า</Link>
        <h1 className="text-3xl font-bold">📦 เพิ่มสินค้าจำนวนมาก (Bulk Upload)</h1>
        <p className="text-gray-600 text-sm mt-1">
          อัปโหลดหลายรูป ตั้งชื่อ ประเภท และระบุราคา/จำนวน (ไม่บังคับ) — 1 รูป = 1 สินค้า
        </p>
      </div>
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="font-bold text-lg mb-3">📥 นำเข้ารูปภาพ</h2>
        <div className="grid md:grid-cols-2 gap-3">
          <label className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-primary-500 hover:bg-primary-50">
            <input type="file" accept="image/*" multiple className="hidden"
              onChange={(e) => handleFiles(e.target.files)} />
            <div className="text-3xl">📁</div>
            <div className="font-semibold mt-2">เลือกไฟล์รูป</div>
            <div className="text-xs text-gray-500 mt-1">ลากวาง หรือคลิกเพื่อเลือกหลายไฟล์</div>
          </label>
          <button type="button" onClick={handleUrlPaste}
            className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary-500 hover:bg-primary-50">
            <div className="text-3xl">🔗</div>
            <div className="font-semibold mt-2">วาง URL รูป</div>
            <div className="text-xs text-gray-500 mt-1">URL ภาพ 1 บรรทัดต่อ 1 รูป</div>
          </button>
        </div>
      </div>
      {rows.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex flex-wrap gap-3 mb-4 items-center">
            <h2 className="font-bold text-lg">📝 รายการสินค้า ({rows.length})</h2>
            <div className="flex-1" />
            <button onClick={applyNameToAll} className="text-sm px-3 py-1 bg-blue-50 text-blue-700 rounded hover:bg-blue-100">
              ตั้งชื่อเดียวกันทุกแถว
            </button>
          </div>
          <div className="grid md:grid-cols-2 gap-3 mb-4 p-3 bg-gray-50 rounded">
            <div>
              <label className="block text-xs text-gray-600 mb-1">ตั้งหมวดหมู่ให้ทุกแถว:</label>
              <select value={defaultCategory}
                onChange={(e) => { setDefaultCategory(parseInt(e.target.value)); applyDefaultToAll("category_id", parseInt(e.target.value)); }}
                className="input-field text-sm">
                <option value={0}>-- เลือก --</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="text-xs text-gray-500 self-end pb-2">
              💡 เลือกหมวดหมู่ก่อน แล้วทุกแถวจะถูกตั้งเป็นหมวดหมู่เดียวกัน
            </div>
          </div>
          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
            {rows.map((r, idx) => (
              <BulkRowItem key={r.id} row={r} index={idx} categories={categories}
                onUpdate={(patch) => updateRow(r.id, patch)} onRemove={() => removeRow(r.id)} />
            ))}
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            <button onClick={handleSubmit} disabled={submitting} className="btn-primary text-lg">
              {submitting ? "กำลังอัปโหลด..." : `✓ บันทึกทั้งหมด (${rows.length} รายการ)`}
            </button>
            <button onClick={() => setRows([])} disabled={submitting} className="btn-secondary">ล้างทั้งหมด</button>
          </div>
        </div>
      )}

      {result && (
        <div className={`rounded-lg shadow p-6 mb-6 ${result.created > 0 && result.failed === 0 ? "bg-green-50 border border-green-200" : result.created > 0 ? "bg-yellow-50 border border-yellow-200" : "bg-red-50 border border-red-200"}`}>
          <h3 className="font-bold text-lg mb-2">
            {result.created > 0 && result.failed === 0 ? "✅ สำเร็จ" : result.created > 0 ? "⚠️ สำเร็จบางส่วน" : "❌ ล้มเหลว"}
          </h3>
          <p className="text-sm mb-2">
            สร้างสำเร็จ <b>{result.created}</b> รายการ · ล้มเหลว <b>{result.failed}</b> รายการ
          </p>
          {result.errors.length > 0 && (
            <details className="mt-2">
              <summary className="text-sm text-red-700 cursor-pointer">ดูรายละเอียดข้อผิดพลาด ({result.errors.length})</summary>
              <ul className="mt-2 text-xs text-red-700 space-y-1 list-disc pl-5">
                {result.errors.map((e, i) => <li key={i}>{e}</li>)}
              </ul>
            </details>
          )}
        </div>
      )}
    </div>
  );
}