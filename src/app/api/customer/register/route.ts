import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";
import { getDB } from "@/lib/db";
import { generateOTP, otpExpiry } from "@/lib/customer-auth";
import { sendEmail, otpEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { email?: string; full_name?: string };
    const email = (body.email || "").trim().toLowerCase();
    const full_name = (body.full_name || "").trim();

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "อีเมลไม่ถูกต้อง" }, { status: 400 });
    }
    if (!full_name) {
      return NextResponse.json({ error: "กรุณากรอกชื่อ-นามสกุล" }, { status: 400 });
    }

    const db = getDB();

    // Check if customer already exists AND is verified
    const existing = await db.prepare("SELECT id, is_verified FROM customers WHERE email = ?")
      .bind(email).first<{ id: number; is_verified: number }>();

    if (existing && existing.is_verified) {
      return NextResponse.json({ error: "อีเมลนี้สมัครไว้แล้ว กรุณาเข้าสู่ระบบ" }, { status: 400 });
    }

    // Generate OTP
    const otp = generateOTP();
    const expires = otpExpiry();

    // Invalidate old OTPs for this email/purpose
    await db.prepare("DELETE FROM customer_otps WHERE email = ? AND purpose = 'register'")
      .bind(email).run();

    // Insert new OTP
    await db.prepare(
      "INSERT INTO customer_otps (email, code, purpose, expires_at) VALUES (?, ?, 'register', ?)"
    ).bind(email, otp, expires).run();

    // Store pending registration (name + email) — use upsert; if customer exists but not verified, update name
    if (existing && !existing.is_verified) {
      await db.prepare("UPDATE customers SET full_name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
        .bind(full_name, existing.id).run();
    } else if (!existing) {
      await db.prepare(
        "INSERT INTO customers (email, full_name, is_verified, is_active) VALUES (?, ?, 0, 1)"
      ).bind(email, full_name).run();
    }

    // Send OTP email
    const tmpl = otpEmail(otp, 'register');
    const result = await sendEmail({ to: email, ...tmpl });

    return NextResponse.json({
      ok: true,
      message: "ส่งรหัส OTP ไปยังอีเมลของคุณแล้ว",
      dev_otp: result.dev ? otp : undefined, // expose in dev mode
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}