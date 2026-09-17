import { NextRequest, NextResponse } from "next/server";
import { getDB } from "@/lib/db";
export const runtime = "edge";

import { verifyAdmin } from "@/lib/api-auth";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await verifyAdmin(req);
  if (authError) return authError;

  try {
    const { id } = await params;
    const data = await req.json();
    const db = getDB();
    await db
      .prepare(
        `UPDATE categories SET name=?, slug=?, description=?, image_url=?, updated_at=CURRENT_TIMESTAMP WHERE id=?`
      )
      .bind(data.name, data.slug, data.description || "", data.image_url || "", parseInt(id))
      .run();
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await verifyAdmin(req);
  if (authError) return authError;

  try {
    const { id } = await params;
    const db = getDB();
    await db.prepare("DELETE FROM categories WHERE id = ?").bind(parseInt(id)).run();
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}