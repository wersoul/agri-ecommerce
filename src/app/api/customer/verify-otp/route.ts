import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";
import { getDB } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { email?: string; otp?: string; purpose?: 'register' | 'reset_password'; password?: string };
    const email = (body.email || "").trim().toLowerCase();
    const otp = (body.otp || "").trim();
    const purpose = body.purpose || 'register';
    const password = body.password;

    if (!email || !otp) {
      return NextResponse.json({ error: "กรุณากรอกอีเมลและ OTP" }, { status: 400 });
    }

    const db = getDB();

    // Find valid OTP
    const record = await db.prepare(
      `SELECT id, expires_at FROM customer_otps
       WHERE email = ? AND code = ? AND purpose = ? AND used = 0
       ORDER BY id DESC LIMIT 1`
    ).bind(email, otp, purpose).first<{ id: number; expires_at: string }>();

    if (!record) {
      return NextResponse.json({ error: "รหัส OTP ไม่ถูกต้อง" }, { status: 400 });
    }

    // Check expiry
    const expiresAt = new Date(record.expires_at.replace(' ', 'T') + 'Z');
    if (expiresAt < new Date()) {
      return NextResponse.json({ error: "รหัส OTP หมดอายุ กรุณาขอใหม่" }, { status: 400 });
    }

    // Mark OTP as used
    await db.prepare("UPDATE customer_otps SET used = 1 WHERE id = ?").bind(record.id).run();

    if (purpose === 'register') {
      if (!password || password.length < 6) {
        return NextResponse.json({ error: "กรุณาตั้งรหัสผ่านอย่างน้อย 6 ตัวอักษร" }, { status: 400 });
      }
      // Verify customer & set password
      const { hashPassword } = await import("@/lib/customer-auth");
      const hash = await hashPassword(password);
      const result = await db.prepare(
        "UPDATE customers SET password_hash = ?, is_verified = 1, updated_at = CURRENT_TIMESTAMP WHERE email = ?"
      ).bind(hash, email).run();
      if (!result.meta || result.meta.changes === 0) {
        return NextResponse.json({ error: "ไม่พบบัญชีผู้ใช้" }, { status: 404 });
      }
      return NextResponse.json({ ok: true, message: "ยืนยันอีเมลและตั้งรหัสผ่านเรียบร้อย กรุณาเข้าสู่ระบบ" });
    }

    // reset_password: just return ok, user will now POST to /api/customer/reset-password
    return NextResponse.json({ ok: true, message: "ยืนยัน OTP สำเร็จ" });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}