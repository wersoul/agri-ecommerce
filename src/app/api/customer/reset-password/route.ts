import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";
import { getDB } from "@/lib/db";
import { hashPassword } from "@/lib/customer-auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { email?: string; otp?: string; password?: string };
    const email = (body.email || "").trim().toLowerCase();
    const otp = (body.otp || "").trim();
    const password = body.password || "";

    if (!email || !otp || !password) {
      return NextResponse.json({ error: "กรุณากรอกข้อมูลให้ครบ" }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร" }, { status: 400 });
    }

    const db = getDB();
    const record = await db.prepare(
      `SELECT id, expires_at FROM customer_otps
       WHERE email = ? AND code = ? AND purpose = 'reset_password' AND used = 0
       ORDER BY id DESC LIMIT 1`
    ).bind(email, otp).first<{ id: number; expires_at: string }>();

    if (!record) {
      return NextResponse.json({ error: "รหัส OTP ไม่ถูกต้อง" }, { status: 400 });
    }
    if (new Date(record.expires_at.replace(' ', 'T') + 'Z') < new Date()) {
      return NextResponse.json({ error: "รหัส OTP หมดอายุ" }, { status: 400 });
    }

    await db.prepare("UPDATE customer_otps SET used = 1 WHERE id = ?").bind(record.id).run();

    const hash = await hashPassword(password);
    const result = await db.prepare(
      "UPDATE customers SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE email = ? AND is_verified = 1"
    ).bind(hash, email).run();

    if (!result.meta || result.meta.changes === 0) {
      return NextResponse.json({ error: "ไม่พบบัญชีผู้ใช้ที่ยืนยันแล้ว" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, message: "รีเซ็ตรหัสผ่านเรียบร้อย กรุณาเข้าสู่ระบบ" });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}