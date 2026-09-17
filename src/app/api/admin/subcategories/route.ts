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
        `SELECT s.*, c.name AS category_name
         FROM subcategories s
         LEFT JOIN categories c ON c.id = s.category_id
         ORDER BY s.category_id, s.sort_order, s.name`
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
    if (!data.name || !data.slug || !data.category_id) {
      return NextResponse.json(
        { error: "กรุณากรอกชื่อ, slug และหมวดหมู่" },
        { status: 400 }
      );
    }
    await db
      .prepare(
        `INSERT INTO subcategories (category_id, name, slug, description, image_url, sort_order)
         VALUES (?, ?, ?, ?, ?, ?)`
      )
      .bind(
        parseInt(data.category_id),
        data.name,
        data.slug,
        data.description || "",
        data.image_url || "",
        parseInt(data.sort_order) || 0
      )
      .run();
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}