import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";
import { getDB } from "@/lib/db";
import { verifyCustomer } from "@/lib/customer-api-auth";

export async function GET(req: NextRequest) {
  const auth = await verifyCustomer(req);
  if (auth instanceof NextResponse) return auth;

  const db = getDB();
  const customer = await db.prepare(
    `SELECT id, email, full_name, phone, address, province, postcode,
            is_verified, is_active, last_login, created_at
     FROM customers WHERE id = ?`
  ).bind(auth.customerId).first();

  if (!customer) {
    return NextResponse.json({ error: "ไม่พบบัญชีผู้ใช้" }, { status: 404 });
  }
  return NextResponse.json({ customer });
}

export async function PUT(req: NextRequest) {
  const auth = await verifyCustomer(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json() as { full_name?: string; phone?: string; address?: string; province?: string; postcode?: string };
    const db = getDB();
    await db.prepare(
      `UPDATE customers SET
        full_name = COALESCE(?, full_name),
        phone = COALESCE(?, phone),
        address = COALESCE(?, address),
        province = COALESCE(?, province),
        postcode = COALESCE(?, postcode),
        updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`
    ).bind(
      body.full_name ?? null,
      body.phone ?? null,
      body.address ?? null,
      body.province ?? null,
      body.postcode ?? null,
      auth.customerId,
    ).run();
    return NextResponse.json({ ok: true, message: "อัปเดตข้อมูลเรียบร้อย" });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}