"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Category } from "@/lib/types";
import CategoryForm from "@/components/CategoryForm";
import CategoryTable from "@/components/CategoryTable";

export default function AdminCategoriesPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Category | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", slug: "", description: "", image_url: "" });

  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    if (!token) {
      router.push("/admin/login");
      return;
    }
    loadData();
  }, [router]);

  async function loadData() {
    const token = localStorage.getItem("admin_token");
    try {
      const res = await fetch("/api/admin/categories/", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setCategories(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setForm({ name: "", slug: "", description: "", image_url: "" });
    setEditing(null);
    setShowForm(true);
  }

  function openEdit(c: Category) {
    setEditing(c);
    setForm({
      name: c.name,
      slug: c.slug,
      description: c.description || "",
      image_url: c.image_url || "",
    });
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const token = localStorage.getItem("admin_token");
    const url = editing ? `/api/admin/categories/${editing.id}/` : "/api/admin/categories/";
    const res = await fetch(url, {
      method: editing ? "PUT" : "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(form),
    });
    if (!res.ok) {
      const data = await res.json();
      alert(data.error || "เกิดข้อผิดพลาด");
      return;
    }
    setShowForm(false);
    loadData();
  }

  async function handleDelete(id: number) {
    if (!confirm("ยืนยันลบหมวดหมู่นี้?")) return;
    const token = localStorage.getItem("admin_token");
    await fetch(`/api/admin/categories/${id}/`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    loadData();
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link href="/admin" className="text-sm text-gray-600 hover:text-primary-600">
            ← กลับแดชบอร์ด
          </Link>
          <h1 className="text-3xl font-bold">🏷️ จัดการหมวดหมู่</h1>
        </div>
        <button onClick={openCreate} className="btn-primary">+ เพิ่มหมวดหมู่</button>
      </div>

      {showForm && (
        <CategoryForm
          form={form}
          setForm={setForm}
          onSubmit={handleSubmit}
          onCancel={() => setShowForm(false)}
          editing={editing}
        />
      )}

      <CategoryTable
        categories={categories}
        loading={loading}
        onEdit={openEdit}
        onDelete={handleDelete}
      />
    </div>
  );
}