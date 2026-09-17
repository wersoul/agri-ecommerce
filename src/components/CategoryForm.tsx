"use client";

import ImageUploadField from "@/components/ImageUploadField";

interface CategoryFormProps {
  form: any;
  setForm: (form: any) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  editing: any;
}

export default function CategoryForm({ form, setForm, onSubmit, onCancel, editing }: CategoryFormProps) {
  const generateSlug = (name: string) =>
    name.toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-");

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
      <h2 className="font-bold text-xl mb-4">
        {editing ? "✏️ แก้ไขหมวดหมู่" : "➕ เพิ่มหมวดหมู่ใหม่"}
      </h2>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">ชื่อหมวดหมู่ *</label>
          <input
            required
            value={form.name}
            onChange={(e) => {
              const name = e.target.value;
              setForm({ ...form, name, slug: form.slug || generateSlug(name) });
            }}
            className="input-field"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Slug</label>
          <input
            value={form.slug}
            onChange={(e) => setForm({ ...form, slug: e.target.value })}
            className="input-field"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">คำอธิบาย</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="input-field"
            rows={2}
          />
        </div>
        <ImageUploadField
          label="รูปภาพหมวดหมู่"
          value={form.image_url || ""}
          onChange={(url) => setForm({ ...form, image_url: url })}
        />
        <div className="flex gap-2">
          <button type="submit" className="btn-primary">
            {editing ? "บันทึก" : "เพิ่ม"}
          </button>
          <button type="button" onClick={onCancel} className="btn-secondary">
            ยกเลิก
          </button>
        </div>
      </form>
    </div>
  );
}