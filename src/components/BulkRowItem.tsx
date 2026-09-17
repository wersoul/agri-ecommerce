"use client";

import { useEffect, useRef, useState } from "react";
import { Category, Subcategory } from "@/lib/types";

export interface BulkRow {
  id: string;
  name: string;
  image_url: string;
  image_preview: string;
  uploading: boolean;
  upload_error: string | null;
  category_id: number;
  subcategory_id: number;
  price: string;
  stock: string;
  description: string;
}

export default function BulkRowItem({ row, index, categories, onUpdate, onRemove }: {
  row: BulkRow; index: number; categories: Category[];
  onUpdate: (patch: Partial<BulkRow>) => void; onRemove: () => void;
}) {
  const [subcats, setSubcats] = useState<Subcategory[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!row.category_id) { setSubcats([]); return; }
    fetch(`/api/subcategories?category_id=${row.category_id}`)
      .then((r) => r.json())
      .then((d) => setSubcats(d.subcategories || []))
      .catch(() => setSubcats([]));
  }, [row.category_id]);

  async function handleFile(file: File) {
    onUpdate({ uploading: true, upload_error: null });
    try {
      const fd = new FormData();
      fd.append("file", file);
      const token = localStorage.getItem("admin_token");
      const res = await fetch("/api/admin/upload/", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error || "อัปโหลดไม่สำเร็จ");
      onUpdate({ image_url: data.url, image_preview: data.url });
    } catch (e: any) {
      onUpdate({ upload_error: e.message || "อัปโหลดไม่สำเร็จ" });
    } finally {
      onUpdate({ uploading: false });
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="flex gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
      <div className="w-20 h-20 flex-shrink-0 bg-gray-200 rounded overflow-hidden flex items-center justify-center">
        {row.uploading ? (
          <span className="text-xs text-gray-500 animate-pulse">อัปโหลด...</span>
        ) : row.image_preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={row.image_preview} alt="" className="w-full h-full object-cover" />
        ) : (
          <span className="text-2xl">📦</span>
        )}
      </div>
      <div className="flex-1 grid md:grid-cols-2 gap-2">
        <div className="md:col-span-2">
          <input value={row.name} onChange={(e) => onUpdate({ name: e.target.value })}
            placeholder={`ชื่อสินค้า #${index + 1}`} className="input-field text-sm" />
        </div>
        <div className="md:col-span-2 flex gap-2">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
          />
          <button
            type="button"
            disabled={row.uploading}
            onClick={() => fileRef.current?.click()}
            className="text-sm px-3 py-1 bg-blue-50 text-blue-700 rounded hover:bg-blue-100 disabled:opacity-50"
          >
            {row.image_url ? "🔄 เปลี่ยนรูป" : "📁 อัปโหลดรูป"}
          </button>
          {row.image_url && (
            <span className="text-xs text-green-600 self-center">✓ อัปโหลดแล้ว</span>
          )}
          {row.upload_error && (
            <span className="text-xs text-red-600 self-center">❌ {row.upload_error}</span>
          )}
        </div>
        <select value={row.category_id}
          onChange={(e) => onUpdate({ category_id: parseInt(e.target.value), subcategory_id: 0 })}
          className="input-field text-sm">
          <option value={0}>-- หมวดหมู่ --</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={row.subcategory_id}
          onChange={(e) => onUpdate({ subcategory_id: parseInt(e.target.value) })}
          className="input-field text-sm" disabled={!row.category_id || subcats.length === 0}>
          <option value={0}>-- ประเภทย่อย --</option>
          {subcats.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <input type="number" step="0.01" value={row.price}
          onChange={(e) => onUpdate({ price: e.target.value })}
          placeholder="ราคา (ไม่บังคับ)" className="input-field text-sm" />
        <input type="number" value={row.stock}
          onChange={(e) => onUpdate({ stock: e.target.value })}
          placeholder="จำนวน (ไม่บังคับ)" className="input-field text-sm" />
      </div>
      <button onClick={onRemove} className="text-red-500 hover:text-red-700 self-start text-xl" title="ลบ">✕</button>
    </div>
  );
}