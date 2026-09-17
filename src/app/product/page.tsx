"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Product } from "@/lib/types";
import { addToCart } from "@/lib/cart";

export default function ProductDetailPage() {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    const qs = new URLSearchParams(window.location.search);
    const id = parseInt(qs.get("id") || "0");
    if (!id || Number.isNaN(id)) {
      setLoading(false);
      setError("ไม่ระบุรหัสสินค้า");
      setProduct(null);
      return;
    }
    setProduct(null);
    setLoading(true);
    setError(null);
    fetch(`/api/products/${id}`, { cache: "no-store" })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((d) => {
        if (!d.product) {
          setError(`ไม่พบสินค้า id=${id}`);
          setProduct(null);
        } else {
          // Safety: ensure returned id matches requested id
          if (d.product.id !== id) {
            setError(`รหัสสินค้าไม่ตรงกัน (คาด ${id}, ได้ ${d.product.id})`);
            setProduct(null);
            return;
          }
          setProduct(d.product);
        }
        setLoading(false);
      })
      .catch((e) => {
        console.error("Failed to load product", e);
        setError(String(e?.message || e));
        setProduct(null);
        setLoading(false);
      });
  }, []);

  const handleAdd = () => {
    if (!product) return;
    addToCart(product, quantity);
    setAdded(true);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("cart-updated"));
    }
    setTimeout(() => setAdded(false), 2000);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p className="text-gray-500">กำลังโหลดสินค้า...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h2 className="text-2xl font-bold mb-4">ไม่พบสินค้า</h2>
        {error && <p className="text-red-600 mb-4 text-sm">{error}</p>}
        <Link href="/products" className="text-primary-600 hover:underline">
          ← กลับไปหน้าสินค้า
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <nav className="text-sm text-gray-600 mb-4">
        <Link href="/" className="hover:text-primary-600">หน้าแรก</Link>
        {" / "}
        <Link href="/products" className="hover:text-primary-600">สินค้า</Link>
        {" / "}
        {product.category_name && (
          <>
            <Link href={"/products?category=" + product.category_slug} className="hover:text-primary-600">
              {product.category_name}
            </Link>
            {" / "}
          </>
        )}
        <span className="text-gray-800">{product.name} #{product.id}</span>
      </nav>

      <div className="grid md:grid-cols-2 gap-8 bg-white rounded-lg shadow p-6">
        <div>
          <img src={product.image_url || "/images/no-image.png"} alt={product.name + " - อะไหล่เกษตร"} className="w-full rounded-lg object-cover aspect-square" />
        </div>

        <div>
          <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
          {product.sku && <p className="text-sm text-gray-500 mb-3">รหัสสินค้า: {product.sku}</p>}
          <p className="text-4xl font-bold text-primary-700 mb-4">฿{Number(product.price).toLocaleString()}</p>
          <div className="mb-4">
            {product.stock > 0 ? (
              <p className="text-green-600">✓ มีสินค้า ({product.stock} ชิ้น)</p>
            ) : (
              <p className="text-red-600">✗ สินค้าหมด</p>
            )}
          </div>
          {product.description && (
            <div className="mb-6">
              <h3 className="font-semibold mb-2">รายละเอียด</h3>
              <p className="text-gray-700 whitespace-pre-line">{product.description}</p>
            </div>
          )}
          {product.stock > 0 && (
            <>
              <div className="flex items-center gap-3 mb-4">
                <span className="font-semibold">จำนวน:</span>
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-10 h-10 bg-gray-200 rounded-md hover:bg-gray-300">-</button>
                <input type="number" value={quantity} onChange={(e) => setQuantity(Math.max(1, Math.min(product.stock, parseInt(e.target.value) || 1)))} className="w-20 text-center input-field" min="1" max={product.stock} />
                <button onClick={() => setQuantity(Math.min(product.stock, quantity + 1))} className="w-10 h-10 bg-gray-200 rounded-md hover:bg-gray-300">+</button>
              </div>
              <button onClick={handleAdd} className="btn-primary w-full text-lg py-3">
                {added ? "✓ เพิ่มลงตะกร้าแล้ว" : "🛒 เพิ่มลงตะกร้า"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}