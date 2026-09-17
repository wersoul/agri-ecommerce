"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Category, Product } from "@/lib/types";

export default function ProductsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const category = searchParams?.get("category") || "";
  const search = searchParams?.get("search") || "";

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState(search);

  // Fetch categories once
  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((d) => setCategories(d.categories || []))
      .catch((e) => console.error("Failed to load categories", e));
  }, []);

  // Fetch products when filters change
  useEffect(() => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (search) params.set("search", search);
    fetch(`/api/products?${params.toString()}`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((d) => {
        setProducts(d.products || []);
        setLoading(false);
      })
      .catch((e) => {
        setError(String(e));
        setLoading(false);
      });
  }, [category, search]);

  const updateFilters = useCallback(
    (newCategory: string, newSearch: string) => {
      const params = new URLSearchParams();
      if (newCategory) params.set("category", newCategory);
      if (newSearch) params.set("search", newSearch);
      const qs = params.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname);
    },
    [router, pathname]
  );

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters(category, searchInput);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">สินค้าทั้งหมด</h1>
      <div className="grid md:grid-cols-4 gap-6">
        <aside className="md:col-span-1">
          <div className="bg-white rounded-lg shadow p-4 md:sticky md:top-20 md:max-h-[calc(100vh-6rem)] md:flex md:flex-col">
            <h2 className="font-bold mb-3 text-lg flex-shrink-0">หมวดหมู่</h2>
            <ul className="space-y-1 overflow-y-auto md:flex-1 md:min-h-0 md:max-h-80 md:pr-1">
              <li>
                <button
                  type="button"
                  onClick={() => updateFilters("", search)}
                  className={`block w-full text-left py-1 px-2 rounded ${!category ? "bg-primary-100 text-primary-800 font-semibold" : "hover:bg-gray-100"}`}
                >
                  ทั้งหมด
                </button>
              </li>
              {categories.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => updateFilters(c.slug, search)}
                    className={`block w-full text-left py-1 px-2 rounded ${category === c.slug ? "bg-primary-100 text-primary-800 font-semibold" : "hover:bg-gray-100"}`}
                  >
                    {c.name}
                  </button>
                </li>
              ))}
            </ul>
            <form onSubmit={handleSearchSubmit} className="mt-6 flex-shrink-0 md:border-t md:pt-4">
              <input type="text" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="ค้นหาสินค้า..." className="input-field text-sm" />
              <button type="submit" className="btn-primary w-full mt-2 text-sm">ค้นหา</button>
            </form>
          </div>
        </aside>
        <div className="md:col-span-3">
          {loading && (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <p className="text-gray-500 text-lg">กำลังโหลดสินค้า...</p>
            </div>
          )}
          {error && !loading && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-red-700">เกิดข้อผิดพลาด: {error}</p>
            </div>
          )}
          {!loading && !error && search && (
            <p className="mb-4 text-gray-600">ผลการค้นหา: <strong>{search}</strong> ({products.length} รายการ)</p>
          )}
          {!loading && !error && products.length === 0 && (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <p className="text-gray-500 text-lg">ไม่พบสินค้า</p>
            </div>
          )}
          {!loading && !error && products.length > 0 && (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((p) => (
                <Link key={p.id} href={`/product?id=${p.id}`} className="bg-white rounded-lg shadow hover:shadow-lg transition overflow-hidden">
                  <img src={p.image_url || "/images/no-image.png"} alt={p.name} className="w-full h-40 object-cover" />
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-800 line-clamp-2 mb-1">{p.name}</h3>
                    <p className="text-xs text-gray-500 mb-2">{p.category_name || "ทั่วไป"}</p>
                    <p className="text-primary-700 font-bold text-lg">฿{Number(p.price).toLocaleString()}</p>
                    <p className="text-xs text-gray-500 mt-1">คงเหลือ: {p.stock} ชิ้น</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}