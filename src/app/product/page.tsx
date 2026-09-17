"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Product } from "@/lib/types";
import { addToCart } from "@/lib/cart";

const CAT_NAMES = ["", "", "อะไหล่เครื่องตัดหญ้า", "อุปกรณ์ให้น้ำ", "ปุ๋ยและยา", "เมล็ดพันธุ์", "เครื่องมือเกษตร", "", "", "คอนเดนเซอร์", "ซีลปั๊มน้ำ", "อะไหล่ตัดหญ้า", "อะไหล่ปั๊มชัก", "อะไหล่พ่นยา", "อะไหล่เครื่องเลื่อย", "อะไหล่เครื่องแรง", "อะไหล่เครื่องพ่นลมหว่านปุ๋ย", "อะไหล่รถไถเดินตาม", "เพรสเชอร์สวิทช์", "โอเวอร์โหลดสวิทช์", "อะไหล่อื่นๆ"];
const CAT_SLUGS = ["", "", "mower-parts", "irrigation", "fertilizer", "seeds", "tools", "", "", "condensor", "pump-seal", "grass-cutter-parts", "pump-parts", "sprayer-parts", "chainsaw-parts", "engine-parts", "blower-spreader-parts", "walking-tractor-parts", "pressure-switch", "overload-switch", "other-parts"];

function getStaticProduct(id: number): Product | null {
  if (id >= 17 && id <= 100) {
    const catIdxs = [10, 10, 10, 11, 11, 12, 13, 14, 15, 15, 16, 17, 18, 9, 9, 9, 15, 15, 15, 11, 11, 13, 13, 13, 16, 16, 16, 17, 12, 12, 14, 14, 18, 18, 18, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18];
    const catId = catIdxs[(id - 17) % catIdxs.length];
    const idx = catId;
    return {
      id, name: "อะไหล่เกษตร KNK Part #" + id, slug: "knk-product-" + id,
      description: "อะไหล์เกษตรคุณภาพดี " + CAT_NAMES[idx] + " จาก KNK Part",
      price: 50 + (id * 11) % 2000, stock: 10 + (id % 80), sku: "KNK-" + id,
      image_url: "/images/knkpart/slides/slide1.jpg",
      category_id: catId, category_name: CAT_NAMES[idx], category_slug: CAT_SLUGS[idx], is_active: 1,
    };
  }
  return null;
}

export default function ProductDetailPage() {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    const qs = new URLSearchParams(window.location.search);
    const id = parseInt(qs.get("id") || "0");
    const p = getStaticProduct(id);
    setProduct(p);
    setLoading(false);
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
        <span className="text-gray-800">{product.name}</span>
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