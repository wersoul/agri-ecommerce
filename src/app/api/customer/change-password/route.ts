import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";
import { getDB } from "@/lib/db";
import { verifyCustomer } from "@/lib/customer-api-auth";
import { hashPassword, verifyPassword } from "@/lib/customer-auth";

export async function POST(req: NextRequest) {
  const auth = await verifyCustomer(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const { current_password, new_password } = await req.json() as {
      current_password?: string;
      new_password?: string;
    };

    if (!current_password || !new_password) {
      return NextResponse.json(
        { error: "กรุณากรอกรหัสผ่านเดิมและรหัสผ่านใหม่" },
        { status: 400 }
      );
    }

    if (new_password.length < 6) {
      return NextResponse.json(
        { error: "รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร" },
        { status: 400 }
      );
    }

    const db = getDB();
    const customer = await db
      .prepare("SELECT password_hash FROM customers WHERE id = ?")
      .bind(auth.customerId)
      .first<{ password_hash: string }>();

    if (!customer) {
      return NextResponse.json({ error: "ไม่พบบัญชีผู้ใช้" }, { status: 404 });
    }

    const valid = await verifyPassword(current_password, customer.password_hash);
    if (!valid) {
      return NextResponse.json(
        { error: "รหัสผ่านเดิมไม่ถูกต้อง" },
        { status: 401 }
      );
    }

    const newHash = await hashPassword(new_password);
    await db
      .prepare(
        `UPDATE customers SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
      )
      .bind(newHash, auth.customerId)
      .run();

    return NextResponse.json({ ok: true, message: "เปลี่ยนรหัสผ่านเรียบร้อย" });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}