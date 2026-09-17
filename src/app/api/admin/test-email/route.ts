import { NextRequest, NextResponse } from "next/server";
export const runtime = "edge";

import { sendEmail } from "@/lib/email";
import { verifyAdmin } from "@/lib/api-auth";

// Test endpoint: ส่งอีเมลทดสอบไปยัง email ที่ระบุ
// ใช้สำหรับ diagnose ว่า email configuration ทำงานหรือไม่
// ต้อง login admin (Bearer token) ก่อนเรียก
export async function POST(req: NextRequest) {
  // ตรวจสิทธิ์ admin
  const authError = await verifyAdmin(req);
  if (authError) return authError;

  try {
    const { to } = await req.json();
    if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
      return NextResponse.json({ error: "กรุณาระบุ email ปลายทางที่ถูกต้อง" }, { status: 400 });
    }

    // อ่าน config ปัจจุบัน (สำหรับ debug)
    const provider = process.env.EMAIL_PROVIDER || "resend";
    const from = process.env.EMAIL_FROM || "(default: KNK Part <noreply@knkpart.com>)";
    const hasApiKey = !!process.env.EMAIL_API_KEY;

    const subject = "[KNK Part] ทดสอบส่งอีเมล";
    const text = "นี่คืออีเมลทดสอบจากระบบ KNK Part\nถ้าคุณได้รับข้อความนี้ แสดงว่า Resend configuration ทำงานถูกต้องแล้ว";
    const html = '<!DOCTYPE html><html><head><meta charset="utf-8"/></head><body style="font-family:sans-serif;background:#f5f5f5;padding:20px;"><div style="max-width:480px;margin:0 auto;background:white;padding:24px;border-radius:12px;"><h2 style="color:#166534;">KNK Part - ทดสอบอีเมล ✅</h2><p>นี่คืออีเมลทดสอบจากระบบ KNK Part</p><p>ถ้าคุณได้รับข้อความนี้ แสดงว่า Resend configuration ทำงานถูกต้อง</p><hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0;"/><p style="color:#9ca3af;font-size:11px;">© KNK Part</p></div></body></html>';

    const result = await sendEmail({ to, subject, html, text });

    return NextResponse.json({
      ok: result.ok,
      error: result.error,
      dev: result.dev,
      debug: {
        provider,
        from,
        hasApiKey,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}