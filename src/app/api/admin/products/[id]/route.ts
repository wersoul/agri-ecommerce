import { NextRequest, NextResponse } from "next/server";
import { getDB } from "@/lib/db";
export const runtime = "edge";

import { verifyAdmin } from "@/lib/api-auth";
import { friendlyDbError } from "@/lib/db-errors";

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

    // SKU: เก็บเป็น NULL เมื่อเว้นว่าง เพื่อหลีกเลี่ยง UNIQUE constraint
    // (SQLite ถือว่า "" = "" จึงชนกันได้ถ้ามีสินค้าหลายตัวที่ไม่มี SKU)
    const skuVal =
      data.sku && String(data.sku).trim() !== ""
        ? String(data.sku).trim()
        : null;

    await db
      .prepare(
        `UPDATE products
         SET name=?, slug=?, description=?, price=?, stock=?, sku=?, image_url=?, category_id=?, subcategory_id=?, is_active=?, updated_at=CURRENT_TIMESTAMP
         WHERE id=?`
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
        data.is_active ? 1 : 0,
        parseInt(id)
      )
      .run();

    return NextResponse.json({ success: true });
  } catch (err: any) {
    const friendly = friendlyDbError(err);
    return NextResponse.json(
      { error: friendly.message, code: friendly.code },
      { status: friendly.status }
    );
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
    await db.prepare("DELETE FROM products WHERE id = ?").bind(parseInt(id)).run();
    return NextResponse.json({ success: true });
  } catch (err: any) {
    const friendly = friendlyDbError(err);
    return NextResponse.json(
      { error: friendly.message, code: friendly.code },
      { status: friendly.status }
    );
  }
}