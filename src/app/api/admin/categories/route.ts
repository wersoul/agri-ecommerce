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
      .prepare("SELECT * FROM categories ORDER BY name")
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
    await db
      .prepare(
        `INSERT INTO categories (name, slug, description, image_url) VALUES (?, ?, ?, ?)`
      )
      .bind(data.name, data.slug, data.description || "", data.image_url || "")
      .run();
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}