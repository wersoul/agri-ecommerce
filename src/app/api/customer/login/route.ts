import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";
import { getDB } from "@/lib/db";
import { verifyPassword, signCustomerToken } from "@/lib/customer-auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { email?: string; password?: string };
    const email = (body.email || "").trim().toLowerCase();
    const password = body.password || "";

    if (!email || !password) {
      return NextResponse.json({ error: "กรุณากรอกอีเมลและรหัสผ่าน" }, { status: 400 });
    }

    const db = getDB();
    const customer = await db.prepare(
      "SELECT id, email, full_name, password_hash, is_verified, is_active FROM customers WHERE email = ?"
    ).bind(email).first<{
      id: number; email: string; full_name: string; password_hash: string | null;
      is_verified: number; is_active: number;
    }>();

    if (!customer || !customer.password_hash) {
      return NextResponse.json({ error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" }, { status: 401 });
    }
    if (!customer.is_verified) {
      return NextResponse.json({ error: "กรุณายืนยันอีเมลก่อนเข้าสู่ระบบ" }, { status: 401 });
    }
    if (!customer.is_active) {
      return NextResponse.json({ error: "บัญชีนี้ถูกระงับการใช้งาน" }, { status: 401 });
    }

    const ok = await verifyPassword(password, customer.password_hash);
    if (!ok) {
      return NextResponse.json({ error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" }, { status: 401 });
    }

    // Update last_login
    await db.prepare("UPDATE customers SET last_login = CURRENT_TIMESTAMP WHERE id = ?")
      .bind(customer.id).run();

    const token = await signCustomerToken({ customerId: customer.id, email: customer.email });

    const res = NextResponse.json({
      ok: true,
      token,
      customer: {
        id: customer.id,
        email: customer.email,
        full_name: customer.full_name,
      },
    });
    // Set HttpOnly cookie for browser
    res.cookies.set({
      name: 'customer_token',
      value: token,
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    });
    return res;
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}