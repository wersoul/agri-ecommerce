"use client";

import { useEffect, useState } from "react";
import { Category, Subcategory } from "@/lib/types";

export interface BulkRow {
  id: string;
  name: string;
  image_url: string;
  image_file: File | null;
  image_preview: string;
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

  useEffect(() => {
    if (!row.category_id) { setSubcats([]); return; }
    fetch(`/api/subcategories?category_id=${row.category_id}`)
      .then((r) => r.json())
      .then((d) => setSubcats(d.subcategories || []))
      .catch(() => setSubcats([]));
  }, [row.category_id]);

  return (
    <div className="flex gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
      <div className="w-20 h-20 flex-shrink-0 bg-gray-200 rounded overflow-hidden">
        {row.image_preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={row.image_preview} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-2xl">📦</div>
        )}
      </div>
      <div className="flex-1 grid md:grid-cols-2 gap-2">
        <div className="md:col-span-2">
          <input value={row.name} onChange={(e) => onUpdate({ name: e.target.value })}
            placeholder={`ชื่อสินค้า #${index + 1}`} className="input-field text-sm" />
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