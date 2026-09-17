import { NextRequest, NextResponse } from "next/server";
export const runtime = "edge";
import { getDB } from "@/lib/db";
import { verifyAdmin } from "@/lib/api-auth";

// GET /api/admin/customers/[id] — ดูข้อมูลสมาชิก + ออร์เดอร์ + สถิติ
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const denied = await verifyAdmin(req);
  if (denied) return denied;

  const id = parseInt(params.id);
  if (!id || isNaN(id)) {
    return NextResponse.json({ error: "ID ไม่ถูกต้อง" }, { status: 400 });
  }

  const db = getDB();
  const customer = await db
    .prepare(
      `SELECT id, email, password_hash, full_name, phone, address, province, postcode,
              company, tax_id, extra_info, is_verified, is_active, last_login,
              created_at, updated_at
       FROM customers WHERE id = ?`
    )
    .bind(id)
    .first();
  if (!customer) {
    return NextResponse.json({ error: "ไม่พบสมาชิก" }, { status: 404 });
  }

  const ordersResult = await db
    .prepare(
      `SELECT id, order_number, total, status, created_at,
              (SELECT COUNT(*) FROM order_items WHERE order_id = orders.id) AS item_count
       FROM orders WHERE customer_id = ? ORDER BY created_at DESC LIMIT 200`
    )
    .bind(id)
    .all();
  const orders = ordersResult.results || [];

  const statsResult = await db
    .prepare(
      `SELECT
         COUNT(*) AS total_orders,
         COALESCE(SUM(total), 0) AS total_spent,
         COALESCE(SUM(CASE WHEN status != 'cancelled' THEN total ELSE 0 END), 0) AS completed_spent,
         MAX(created_at) AS last_order_date
       FROM orders WHERE customer_id = ?`
    )
    .bind(id)
    .first();
  const stats = statsResult || {
    total_orders: 0,
    total_spent: 0,
    completed_spent: 0,
    last_order_date: null,
  };

  return NextResponse.json({
    customer: {
      ...customer,
      password_hash: undefined,
    },
    orders,
    stats,
  });
}

// PUT /api/admin/customers/[id] — แก้ไขข้อมูลสมาชิก
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const denied = await verifyAdmin(req);
  if (denied) return denied;

  const id = parseInt(params.id);
  if (!id || isNaN(id)) {
    return NextResponse.json({ error: "ID ไม่ถูกต้อง" }, { status: 400 });
  }

  const db = getDB();
  const existing = await db
    .prepare("SELECT id, email FROM customers WHERE id = ?")
    .bind(id)
    .first<{ id: number; email: string }>();
  if (!existing) {
    return NextResponse.json({ error: "ไม่พบสมาชิก" }, { status: 404 });
  }

  const body = await req.json().catch(() => ({} as any));

  // ตรวจสอบอีเมลซ้ำ (ถ้ามีการเปลี่ยน)
  if (body.email && body.email !== existing.email) {
    const dup = await db
      .prepare("SELECT id FROM customers WHERE email = ? AND id != ?")
      .bind(body.email, id)
      .first();
    if (dup) {
      return NextResponse.json(
        { error: "อีเมลนี้ถูกใช้แล้วโดยสมาชิกอื่น" },
        { status: 400 }
      );
    }
  }

  // Build dynamic UPDATE
  const allowed: Record<string, string> = {
    full_name: "string",
    email: "string",
    phone: "string|null",
    province: "string|null",
    postcode: "string|null",
    address: "string|null",
    company: "string|null",
    tax_id: "string|null",
    extra_info: "string|null",
    is_verified: "number",
    is_active: "number",
  };
  const sets: string[] = [];
  const binds: any[] = [];
  for (const key of Object.keys(allowed)) {
    if (key in body) {
      sets.push(`${key} = ?`);
      binds.push(body[key] ?? null);
    }
  }
  if (sets.length === 0) {
    return NextResponse.json({ error: "ไม่มีข้อมูลที่จะอัปเดต" }, { status: 400 });
  }
  sets.push("updated_at = CURRENT_TIMESTAMP");
  binds.push(id);

  await db
    .prepare(`UPDATE customers SET ${sets.join(", ")} WHERE id = ?`)
    .bind(...binds)
    .run();

  return NextResponse.json({ success: true });
}

// DELETE /api/admin/customers/[id] — ลบสมาชิก (พร้อมตั้งค่า customer_id ของ orders เป็น NULL)
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const denied = await verifyAdmin(req);
  if (denied) return denied;

  const id = parseInt(params.id);
  if (!id || isNaN(id)) {
    return NextResponse.json({ error: "ID ไม่ถูกต้อง" }, { status: 400 });
  }

  const db = getDB();
  const existing = await db
    .prepare("SELECT id FROM customers WHERE id = ?")
    .bind(id)
    .first();
  if (!existing) {
    return NextResponse.json({ error: "ไม่พบสมาชิก" }, { status: 404 });
  }

  // ตัด customer_id จาก orders ก่อน (เพราะ FK = ON DELETE SET NULL ก็จะ set ให้เอง แต่ทำชัดเจน)
  await db
    .prepare(
      "UPDATE orders SET customer_id = NULL WHERE customer_id = ?"
    )
    .bind(id)
    .run();
  // ลบ OTP ที่เกี่ยวข้อง
  await db
    .prepare("DELETE FROM customer_otps WHERE email = (SELECT email FROM customers WHERE id = ?)")
    .bind(id)
    .run();
  // ลบสมาชิก
  await db.prepare("DELETE FROM customers WHERE id = ?").bind(id).run();

  return NextResponse.json({ success: true });
}