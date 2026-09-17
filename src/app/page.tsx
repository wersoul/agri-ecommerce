"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Category, Product } from "@/lib/types";

export default function HomePage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [catsRes, prodsRes] = await Promise.all([
          fetch("/api/categories"),
          fetch("/api/products"),
        ]);
        const catsData = await catsRes.json();
        const prodsData = await prodsRes.json();
        setCategories(catsData.categories || []);
        setProducts((prodsData.products || []).slice(0, 16));
      } catch (err) {
        console.error("Failed to load home data", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const heroImage = "/images/knkpart/slides/slide1.jpg";

  return (
    <div>
      <section className="relative h-[450px] md:h-[550px] overflow-hidden bg-gray-900">
        <div className="absolute inset-0">
          <img src={heroImage} alt="อะไหล่เกษตร KNK Part เครื่องมือเกษตร" className="w-full h-full object-cover opacity-90" />
          <div className="absolute inset-0 bg-gradient-to-r from-primary-900/80 via-primary-800/60 to-transparent" />
        </div>
        <div className="relative container mx-auto px-4 h-full flex items-center">
          <div className="max-w-2xl text-white">
            <div className="flex items-center gap-3 mb-4">
              <img src="/images/knkpart/knk.png" alt="KNK Part Logo" className="h-12 w-auto bg-white rounded px-2 py-1" />
              <span className="text-2xl md:text-3xl font-bold">KNK Part</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-bold mb-4 leading-tight">
              อะไหล่เกษตร อะไหล่เครื่องมือ
              <br />
              เครื่องมือเกษตร ครบวงจร
            </h1>
            <p className="text-lg md:text-xl mb-6 text-primary-100">
              ร้านขายอะไหล่เกษตรคุณภาพดี ราคาเป็นกันเอง
              <br />
              อะไหล่รถไถ อะไหล่เครื่องตัดหญ้า อะไหล่เครื่องยนต์ อะไหล่ปั๊มน้ำ
              <br />
              จัดส่งทั่วประเทศ
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/products" className="bg-white text-primary-700 px-8 py-3 rounded-full font-semibold hover:bg-primary-50 transition inline-block shadow-lg">
                เลือกซื้อสินค้า →
              </Link>
              <Link href="/products?category=grass-cutter-parts" className="bg-primary-600 text-white border-2 border-white px-8 py-3 rounded-full font-semibold hover:bg-primary-700 transition inline-block">
                อะไหล่ตัดหญ้า
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-primary-50 py-3 border-b border-primary-100">
        <div className="container mx-auto px-4">
          <p className="text-center text-sm text-primary-800">
            <strong>อะไหล่เกษตร</strong> • <strong>อะไหล่เครื่องมือ</strong> • <strong>เครื่องมือเกษตร</strong> • อะไหล่รถไถ • อะไหล่เครื่องตัดหญ้า • อะไหล่เครื่องยนต์ • อะไหล่ปั๊มน้ำ • อะไหล่เครื่องพ่นยา
          </p>
        </div>
      </section>

      {categories.length > 0 && (
        <section className="container mx-auto px-4 py-12">
          <h2 className="text-3xl font-bold mb-2 text-center">หมวดหมู่อะไหล่เกษตร</h2>
          <p className="text-center text-gray-600 mb-8">เลือกซื้ออะไหล่เครื่องมือ เครื่องมือเกษตรตามหมวดหมู่ที่ต้องการ</p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((cat) => (
              <Link key={cat.id} href={`/products?category=${cat.slug}`} className="bg-white rounded-lg shadow hover:shadow-lg transition overflow-hidden group">
                {cat.image_url && (
                  <div className="aspect-square overflow-hidden bg-gray-100">
                    <img src={cat.image_url} alt={`${cat.name} - อะไหล่เกษตร`} className="w-full h-full object-cover group-hover:scale-105 transition" loading="lazy" />
                  </div>
                )}
                <div className="p-3 text-center">
                  <h3 className="font-semibold text-gray-800 text-sm line-clamp-2">{cat.name}</h3>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="bg-white py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold">สินค้าอะไหล่เกษตรแนะนำ</h2>
              <p className="text-gray-600 text-sm mt-1">อะไหล่เครื่องมือ เครื่องมือเกษตร คุณภาพดี</p>
            </div>
            <Link href="/products" className="text-primary-600 hover:text-primary-800 font-semibold">ดูทั้งหมด →</Link>
          </div>
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-gray-200 animate-pulse rounded-lg h-64"></div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {products.map((p) => (
                <Link key={p.id} href={`/product?id=${p.id}`} className="bg-white rounded-lg shadow hover:shadow-lg transition overflow-hidden border border-gray-100 group">
                  <div className="aspect-square overflow-hidden bg-gray-100">
                    <img src={p.image_url || "/images/no-image.png"} alt={`${p.name} - อะไหล่เกษตร`} className="w-full h-full object-cover group-hover:scale-105 transition" loading="lazy" />
                  </div>
                  <div className="p-3">
                    <h3 className="font-semibold text-gray-800 line-clamp-2 mb-1 text-sm">{p.name}</h3>
                    <p className="text-xs text-gray-500 mb-2">{p.category_name || "ทั่วไป"}</p>
                    <p className="text-primary-700 font-bold text-lg">฿{Number(p.price).toLocaleString()}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="bg-primary-50 py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-2xl font-bold mb-4 text-center text-primary-900">KNK Part - ร้านอะไหล่เกษตร อะไหล่เครื่องมือ เครื่องมือเกษตร</h2>
          <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed">
            <p className="mb-4">
              <strong>KNK Part (เคเอ็นเค พาร์ท)</strong> ร้านขายอะไหล่เกษตร อะไหล่เครื่องมือ เครื่องมือเกษตรครบวงจร
              ดำเนินธุรกิจด้านอะไหล่เกษตรมาอย่างยาวนาน เราคัดสรรแต่อะไหล่เครื่องมือเกษตรคุณภาพดี ราคาเป็นกันเอง
              เพื่อเกษตรกรไทยทุกท่าน
            </p>
            <p className="mb-4">
              สินค้าของเราครอบคลุม <strong>อะไหล่รถไถ อะไหล่เครื่องตัดหญ้า อะไหล่เครื่องยนต์</strong> อะไหล่ปั๊มน้ำ อะไหล่เครื่องพ่นยา อะไหล่เลื่อยยนต์ อะไหล่รถไถเดินตาม คอนเดนเซอร์ ซีลปั๊มน้ำ เพรสเชอร์สวิทช์ โอเวอร์โหลดสวิทช์ และอะไหล่อื่นๆ อีกมากมาย
            </p>
            <p>
              ทุกชิ้นเป็นของแท้ ของใหม่ มีสต๊อกพร้อมส่ง จัดส่งทั่วประเทศด้วยบริการที่รวดเร็วและเชื่อถือได้
              อะไหล่เกษตร อะไหล่เครื่องมือ เครื่องมือเกษตร ที่คุณไว้วางใจ
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}