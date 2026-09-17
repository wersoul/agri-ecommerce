"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Product, Category } from "@/lib/types";
import ProductForm from "@/components/ProductForm";
import ProductTable from "@/components/ProductTable";

export default function AdminProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Product | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(initialForm());

  function initialForm() {
    return {
      name: "",
      slug: "",
      description: "",
      price: 0,
      stock: 0,
      sku: "",
      image_url: "",
      category_id: 0,
      subcategory_id: 0,
      is_active: 1,
    };
  }

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
    setLoading(true);
    try {
      const [pRes, cRes] = await Promise.all([
        fetch("/api/admin/products/", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("/api/admin/categories/", { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      const [pd, cd] = await Promise.all([pRes.json(), cRes.json()]);
      setProducts(Array.isArray(pd) ? pd : []);
      setCategories(Array.isArray(cd) ? cd : []);
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setForm({ ...initialForm(), category_id: categories[0]?.id || 0 });
    setEditing(null);
    setShowForm(true);
  }

  function openEdit(p: Product) {
    setEditing(p);
    setForm({
      name: p.name,
      slug: p.slug,
      description: p.description || "",
      price: p.price,
      stock: p.stock,
      sku: p.sku || "",
      image_url: p.image_url || "",
      category_id: p.category_id || 0,
      subcategory_id: p.subcategory_id || 0,
      is_active: p.is_active,
    });
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const token = localStorage.getItem("admin_token");
    const url = editing ? `/api/admin/products/${editing.id}/` : "/api/admin/products/";
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
    if (!confirm("ยืนยันลบสินค้านี้?")) return;
    const token = localStorage.getItem("admin_token");
    await fetch(`/api/admin/products/${id}/`, {
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
          <h1 className="text-3xl font-bold">📦 จัดการสินค้า</h1>
        </div>
        <button onClick={openCreate} className="btn-primary">+ เพิ่มสินค้า</button>
      </div>

      {showForm && (
        <ProductForm
          form={form}
          setForm={setForm}
          categories={categories}
          onSubmit={handleSubmit}
          onCancel={() => setShowForm(false)}
          editing={editing}
        />
      )}

      <ProductTable
        products={products}
        loading={loading}
        onEdit={openEdit}
        onDelete={handleDelete}
      />
    </div>
  );
}