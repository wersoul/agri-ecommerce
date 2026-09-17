"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Subcategory, Category } from "@/lib/types";
import ImageUploadField from "@/components/ImageUploadField";

export default function AdminSubcategoriesPage() {
  const router = useRouter();
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Subcategory | null>(null);
  const [filterCategoryId, setFilterCategoryId] = useState<number>(0);
  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    image_url: "",
    sort_order: 0,
    category_id: 0,
  });

  const slugify = (s: string) =>
    s.toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-");

  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    if (!token) { router.push("/admin/login"); return; }
    loadData();
  }, [router]);

  async function loadData() {
    const token = localStorage.getItem("admin_token");
    setLoading(true);
    try {
      const [sRes, cRes] = await Promise.all([
        fetch("/api/admin/subcategories/", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("/api/admin/categories/", { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      const [sd, cd] = await Promise.all([sRes.json(), cRes.json()]);
      setSubcategories(Array.isArray(sd) ? sd : []);
      setCategories(Array.isArray(cd) ? cd : []);
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setForm({ name: "", slug: "", description: "", image_url: "", sort_order: 0, category_id: categories[0]?.id || 0 });
    setEditing(null);
    setShowForm(true);
  }

  function openEdit(s: Subcategory) {
    setEditing(s);
    setForm({
      name: s.name,
      slug: s.slug,
      description: (s as any).description || "",
      image_url: (s as any).image_url || "",
      sort_order: s.sort_order,
      category_id: s.category_id,
    });
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const token = localStorage.getItem("admin_token");
    const url = editing ? `/api/admin/subcategories/${editing.id}/` : "/api/admin/subcategories/";
    const res = await fetch(url, {
      method: editing ? "PUT" : "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(form),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.error || "เกิดข้อผิดพลาด");
      return;
    }
    setShowForm(false);
    loadData();
  }

  async function handleDelete(id: number) {
    if (!confirm("ยืนยันลบประเภทย่อยนี้?")) return;
    const token = localStorage.getItem("admin_token");
    await fetch(`/api/admin/subcategories/${id}/`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    loadData();
  }

  const filtered = useMemo(() => {
    if (!filterCategoryId) return subcategories;
    return subcategories.filter((s) => s.category_id === filterCategoryId);
  }, [subcategories, filterCategoryId]);

  const categoryName = (id: number) => categories.find((c) => c.id === id)?.name || "-";

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link href="/admin" className="text-sm text-gray-600 hover:text-primary-600">← กลับแดชบอร์ด</Link>
          <h1 className="text-3xl font-bold">🏷️ จัดการประเภทย่อย</h1>
        </div>
        <button onClick={openCreate} className="btn-primary">+ เพิ่มประเภทย่อย</button>
      </div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="text-sm text-gray-600">กรอง:</span>
        <button onClick={() => setFilterCategoryId(0)}
          className={`text-sm px-3 py-1 rounded ${filterCategoryId === 0 ? "bg-primary-100 text-primary-800 font-semibold" : "bg-gray-100"}`}>
          ทั้งหมด ({subcategories.length})
        </button>
        {categories.map((c) => {
          const count = subcategories.filter((s) => s.category_id === c.id).length;
          return (
            <button key={c.id} onClick={() => setFilterCategoryId(c.id)}
              className={`text-sm px-3 py-1 rounded ${filterCategoryId === c.id ? "bg-primary-100 text-primary-800 font-semibold" : "bg-gray-100"}`}>
              {c.name} ({count})
            </button>
          );
        })}
      </div>
      {showForm && (
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="font-bold text-xl mb-4">{editing ? "✏️ แก้ไข" : "➕ เพิ่มประเภทย่อย"}</h2>
          <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">หมวดหมู่หลัก *</label>
              <select required value={form.category_id}
                onChange={(e) => setForm({ ...form, category_id: parseInt(e.target.value) })}
                className="input-field">
                <option value={0}>-- เลือก --</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">ชื่อประเภทย่อย *</label>
              <input required value={form.name}
                onChange={(e) => { const name = e.target.value; setForm({ ...form, name, slug: form.slug || slugify(name) }); }}
                className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Slug *</label>
              <input required value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">ลำดับ</label>
              <input type="number" value={form.sort_order}
                onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })} className="input-field" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">คำอธิบาย</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input-field" rows={2} />
            </div>
            <div className="md:col-span-2">
              <ImageUploadField
                label="รูปภาพประเภทย่อย"
                value={form.image_url || ""}
                onChange={(url) => setForm({ ...form, image_url: url })}
              />
            </div>
            <div className="md:col-span-2 flex gap-2">
              <button type="submit" className="btn-primary">{editing ? "บันทึก" : "เพิ่ม"}</button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">ยกเลิก</button>
            </div>
          </form>
        </div>
      )}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        {loading ? <div className="p-8 text-center text-gray-500">กำลังโหลด...</div>
          : filtered.length === 0 ? <div className="p-8 text-center text-gray-500">ยังไม่มีประเภทย่อย</div>
          : (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-3">ประเภทย่อย</th>
                  <th className="text-left p-3">หมวดหมู่หลัก</th>
                  <th className="text-left p-3">Slug</th>
                  <th className="text-center p-3">ลำดับ</th>
                  <th className="text-center p-3">จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr key={s.id} className="border-t hover:bg-gray-50">
                    <td className="p-3 font-semibold">{s.name}</td>
                    <td className="p-3 text-sm text-gray-600">{categoryName(s.category_id)}</td>
                    <td className="p-3 text-sm text-gray-600">{s.slug}</td>
                    <td className="p-3 text-center text-sm">{s.sort_order}</td>
                    <td className="p-3 text-center">
                      <button onClick={() => openEdit(s)} className="text-primary-600 hover:text-primary-800 text-sm mr-3">แก้ไข</button>
                      <button onClick={() => handleDelete(s.id)} className="text-red-600 hover:text-red-800 text-sm">ลบ</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
      </div>
    </div>
  );
}