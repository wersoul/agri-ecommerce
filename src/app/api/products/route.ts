import { NextRequest, NextResponse } from "next/server";
import { getDB } from "@/lib/db";
import { Product } from "@/lib/types";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const db = getDB();
    if (!db) {
      return NextResponse.json({ products: [] as Product[] });
    }
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const search = searchParams.get("search");

    let query = `
      SELECT p.id, p.name, p.slug, p.description, p.price, p.stock,
             p.image_url, p.is_active, p.category_id, p.subcategory_id,
             c.name as category_name, c.slug as category_slug,
             sc.name as subcategory_name, sc.slug as subcategory_slug
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN subcategories sc ON p.subcategory_id = sc.id
      WHERE p.is_active = 1
    `;
    const params: any[] = [];
    if (category) {
      query += " AND c.slug = ?";
      params.push(category);
    }
    const subcategory = searchParams.get("subcategory");
    if (subcategory) {
      query += " AND sc.slug = ?";
      params.push(subcategory);
    }
    if (search) {
      query += " AND (p.name LIKE ? OR p.description LIKE ?)";
      params.push(`%${search}%`, `%${search}%`);
    }
    query += " ORDER BY p.created_at DESC LIMIT 200";
    const { results } = await db
      .prepare(query)
      .bind(...params)
      .all<Product>();
    return NextResponse.json({ products: results || [] });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error", products: [] },
      { status: 500 }
    );
  }
}