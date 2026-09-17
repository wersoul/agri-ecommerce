import { NextRequest, NextResponse } from "next/server";
import { getDB } from "@/lib/db";
export const runtime = "edge";

import { verifyAdmin } from "@/lib/api-auth";

interface BulkItem {
  name: string;
  slug?: string;
  description?: string;
  price?: number;
  stock?: number;
  sku?: string;
  image_url: string;
  category_id?: number;
  subcategory_id?: number;
  is_active?: number;
}

export async function POST(req: NextRequest) {
  const authError = await verifyAdmin(req);
  if (authError) return authError;

  try {
    const body = await req.json();
    const items: BulkItem[] = Array.isArray(body?.items) ? body.items : [];

    if (items.length === 0) {
      return NextResponse.json({ error: "ไม่มีสินค้า" }, { status: 400 });
    }
    if (items.length > 500) {
      return NextResponse.json({ error: "มากเกินไป (สูงสุด 500 รายการต่อครั้ง)" }, { status: 400 });
    }

    const db = getDB();
    const stmt = db.prepare(
      `INSERT INTO products (name, slug, description, price, stock, sku, image_url, category_id, subcategory_id, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );

    const slugify = (s: string) =>
      s.toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").slice(0, 100) || "item";

    let created = 0;
    const errors: string[] = [];

    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (!it.name || !it.image_url) {
        errors.push(`#${i + 1}: ต้องมีชื่อและ image_url`);
        continue;
      }
      try {
        const slug = (it.slug || slugify(it.name)) + "-" + Date.now().toString().slice(-5) + Math.floor(Math.random() * 1000);
        const sku = it.sku && String(it.sku).trim() !== "" ? String(it.sku).trim() : null;
        await stmt
          .bind(
            it.name,
            slug,
            it.description || "",
            Number(it.price) || 0,
            Number(it.stock) || 0,
            sku,
            it.image_url,
            it.category_id ? parseInt(String(it.category_id)) : null,
            it.subcategory_id ? parseInt(String(it.subcategory_id)) : null,
            it.is_active === 0 ? 0 : 1
          )
          .run();
        created++;
      } catch (e: any) {
        errors.push(`#${i + 1} (${it.name}): ${e.message}`);
      }
    }

    return NextResponse.json({
      success: true,
      created,
      failed: errors.length,
      errors: errors.slice(0, 20),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}