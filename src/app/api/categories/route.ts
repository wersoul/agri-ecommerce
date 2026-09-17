import { NextRequest, NextResponse } from "next/server";
import { getDB } from "@/lib/db";
import { Category } from "@/lib/types";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest) {
  try {
    const db = getDB();
    if (!db) {
      return NextResponse.json({ categories: [] as Category[] });
    }
    const { results } = await db
      .prepare("SELECT id, name, slug, description, image_url FROM categories ORDER BY name")
      .all<Category>();
    return NextResponse.json({ categories: results || [] });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error", categories: [] },
      { status: 500 }
    );
  }
}