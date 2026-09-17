"use client";

import { useEffect, useState } from "react";
import { Category, Subcategory } from "@/lib/types";
import ImageUploadField from "@/components/ImageUploadField";

interface ProductFormProps {
  form: any;
  setForm: (form: any) => void;
  categories: Category[];
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  editing: any;
}

export default function ProductForm({
  form,
  setForm,
  categories,
  onSubmit,
  onCancel,
  editing,
}: ProductFormProps) {
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);

  useEffect(() => {
    if (!form.category_id) { setSubcategories([]); return; }
    fetch(`/api/subcategories?category_id=${form.category_id}`)
      .then((r) => r.json())
      .then((d) => setSubcategories(d.subcategories || []))
      .catch(() => setSubcategories([]));
  }, [form.category_id]);

  const generateSlug = (name: string) =>
    name
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
      <h2 className="font-bold text-xl mb-4">
        {editing ? "✏️ แก้ไขสินค้า" : "➕ เพิ่มสินค้าใหม่"}
      </h2>
      <form onSubmit={onSubmit} className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">ชื่อสินค้า *</label>
          <input
            required
            value={form.name}
            onChange={(e) => {
              const name = e.target.value;
              setForm({
                ...form,
                name,
                slug: form.slug || generateSlug(name),
              });
            }}
            className="input-field"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Slug (URL)</label>
          <input
            value={form.slug}
            onChange={(e) => setForm({ ...form, slug: e.target.value })}
            className="input-field"
            placeholder="auto-generated"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-1">รายละเอียด</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="input-field"
            rows={3}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">ราคา (บาท)</label>
          <input
            type="number"
            step="0.01"
            value={form.price}
            onChange={(e) =>
              setForm({ ...form, price: parseFloat(e.target.value) || 0 })
            }
            className="input-field"
            placeholder="ไม่บังคับ (ค่าเริ่มต้น 0)"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">จำนวนคงเหลือ</label>
          <input
            type="number"
            value={form.stock}
            onChange={(e) =>
              setForm({ ...form, stock: parseInt(e.target.value) || 0 })
            }
            className="input-field"
            placeholder="ไม่บังคับ (ค่าเริ่มต้น 0)"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">SKU</label>
          <input
            value={form.sku}
            onChange={(e) => setForm({ ...form, sku: e.target.value })}
            className="input-field"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">หมวดหมู่</label>
          <select
            value={form.category_id}
            onChange={(e) =>
              setForm({ ...form, category_id: parseInt(e.target.value), subcategory_id: 0 })
            }
            className="input-field"
          >
            <option value={0}>-- เลือกหมวดหมู่ --</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        {form.category_id > 0 && (
          <div>
            <label className="block text-sm font-medium mb-1">ประเภทย่อย</label>
            <select
              value={form.subcategory_id || 0}
              onChange={(e) =>
                setForm({ ...form, subcategory_id: parseInt(e.target.value) })
              }
              className="input-field"
            >
              <option value={0}>-- ไม่ระบุ --</option>
              {subcategories.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        )}
        <div className="md:col-span-2">
          <ImageUploadField
            label="รูปภาพสินค้า"
            value={form.image_url || ""}
            onChange={(url) => setForm({ ...form, image_url: url })}
          />
        </div>
        <div className="md:col-span-2">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.is_active === 1}
              onChange={(e) =>
                setForm({ ...form, is_active: e.target.checked ? 1 : 0 })
              }
            />
            <span>เปิดขาย</span>
          </label>
        </div>
        <div className="md:col-span-2 flex gap-2">
          <button type="submit" className="btn-primary">
            {editing ? "บันทึกการแก้ไข" : "เพิ่มสินค้า"}
          </button>
          <button type="button" onClick={onCancel} className="btn-secondary">
            ยกเลิก
          </button>
        </div>
      </form>
    </div>
  );
}