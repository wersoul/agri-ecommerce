import { NextRequest, NextResponse } from "next/server";
import { getDB } from "@/lib/db";
import { Product } from "@/lib/types";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDB();
    if (!db) {
      return NextResponse.json({ product: null, error: "No DB" }, { status: 503 });
    }
    const row = await db
      .prepare(
        `SELECT p.*, c.name as category_name, c.slug as category_slug
         FROM products p
         LEFT JOIN categories c ON p.category_id = c.id
         WHERE p.id = ?`
      )
      .bind(parseInt(id))
      .first<Product>();
    if (!row) {
      return NextResponse.json({ product: null, error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ product: row });
  } catch (err) {
    return NextResponse.json(
      { product: null, error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}