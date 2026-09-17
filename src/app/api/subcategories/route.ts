import { NextRequest, NextResponse } from "next/server";
import { getDB } from "@/lib/db";
import { Subcategory } from "@/lib/types";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const db = getDB();
    if (!db) return NextResponse.json({ subcategories: [] as Subcategory[] });
    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get("category_id");
    const categorySlug = searchParams.get("category");

    let query = "SELECT id, category_id, name, slug, description, image_url, sort_order FROM subcategories";
    const params: any[] = [];
    const where: string[] = [];
    if (categoryId) {
      where.push("category_id = ?");
      params.push(parseInt(categoryId));
    }
    if (categorySlug) {
      query += " s JOIN categories c ON c.id = s.category_id";
      where.push("c.slug = ?");
      params.push(categorySlug);
    }
    if (where.length) query += " WHERE " + where.join(" AND ");
    query += " ORDER BY sort_order, name";

    const { results } = await db.prepare(query).bind(...params).all<Subcategory>();
    return NextResponse.json({ subcategories: results || [] });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error", subcategories: [] },
      { status: 500 }
    );
  }
}