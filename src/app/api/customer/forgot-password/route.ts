import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";
import { getDB } from "@/lib/db";
import { generateOTP, otpExpiry } from "@/lib/customer-auth";
import { sendEmail, otpEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { email?: string };
    const email = (body.email || "").trim().toLowerCase();
    if (!email) {
      return NextResponse.json({ error: "กรุณากรอกอีเมล" }, { status: 400 });
    }

    const db = getDB();
    const customer = await db.prepare("SELECT id, is_verified FROM customers WHERE email = ?")
      .bind(email).first<{ id: number; is_verified: number }>();

    // Always return success to prevent email enumeration
    if (!customer || !customer.is_verified) {
      return NextResponse.json({ ok: true, message: "หากอีเมลนี้มีอยู่ในระบบ รหัส OTP จะถูกส่งไป" });
    }

    const otp = generateOTP();
    const expires = otpExpiry();
    await db.prepare("DELETE FROM customer_otps WHERE email = ? AND purpose = 'reset_password'").bind(email).run();
    await db.prepare(
      "INSERT INTO customer_otps (email, code, purpose, expires_at) VALUES (?, ?, 'reset_password', ?)"
    ).bind(email, otp, expires).run();

    const tmpl = otpEmail(otp, 'reset_password');
    const result = await sendEmail({ to: email, ...tmpl });

    return NextResponse.json({
      ok: true,
      message: "หากอีเมลนี้มีอยู่ในระบบ รหัส OTP จะถูกส่งไป",
      dev_otp: result.dev ? otp : undefined,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}