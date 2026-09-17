import { NextRequest, NextResponse } from "next/server";
import { getDB } from "@/lib/db";
export const runtime = "edge";

import { verifyAdmin } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  const authError = await verifyAdmin(req);
  if (authError) return authError;

  try {
    const db = getDB();
    const { results } = await db
      .prepare(
        `SELECT p.*, c.name as category_name, c.slug as category_slug,
                sc.name as subcategory_name, sc.slug as subcategory_slug
         FROM products p
         LEFT JOIN categories c ON p.category_id = c.id
         LEFT JOIN subcategories sc ON p.subcategory_id = sc.id
         ORDER BY p.created_at DESC`
      )
      .all();
    return NextResponse.json(results || []);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authError = await verifyAdmin(req);
  if (authError) return authError;

  try {
    const data = await req.json();
    const db = getDB();

    if (!data.name || !data.slug) {
      return NextResponse.json(
        { error: "กรุณากรอกชื่อและ slug" },
        { status: 400 }
      );
    }

    const skuVal = data.sku && String(data.sku).trim() !== "" ? String(data.sku).trim() : null;
    await db
      .prepare(
        `INSERT INTO products (name, slug, description, price, stock, sku, image_url, category_id, subcategory_id, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        data.name,
        data.slug,
        data.description || "",
        parseFloat(data.price) || 0,
        parseInt(data.stock) || 0,
        skuVal,
        data.image_url || "",
        parseInt(data.category_id) || 0,
        data.subcategory_id ? parseInt(data.subcategory_id) : null,
        data.is_active ? 1 : 0
      )
      .run();

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}