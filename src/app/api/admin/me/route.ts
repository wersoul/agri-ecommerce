import { NextRequest, NextResponse } from "next/server";
export const runtime = "edge";
import { getDB } from "@/lib/db";
import { verifyAdmin } from "@/lib/api-auth";
import { verifyToken } from "@/lib/auth";

// GET /api/admin/me — ดึงข้อมูลแอดมินที่ล็อกอินอยู่
export async function GET(req: NextRequest) {
  const denied = await verifyAdmin(req);
  if (denied) return denied;
  const token = req.headers.get("Authorization")?.replace("Bearer ", "") || "";
  const payload = await verifyToken(token);
  if (!payload) return NextResponse.json({ error: "Token ไม่ถูกต้อง" }, { status: 401 });

  const db = getDB();
  const admin = await db
    .prepare("SELECT id, username, email, created_at FROM admins WHERE id = ?")
    .bind(payload.adminId)
    .first<{ id: number; username: string; email: string | null; created_at: string }>();

  if (!admin) {
    return NextResponse.json({ error: "ไม่พบบัญชีผู้ดูแล" }, { status: 404 });
  }

  return NextResponse.json({
    admin: {
      id: admin.id,
      username: admin.username,
      email: admin.email || "",
      created_at: admin.created_at,
    },
  });
}

// PUT /api/admin/me — อัพเดท email ของแอดมินที่ล็อกอินอยู่
// body: { email: string }
export async function PUT(req: NextRequest) {
  const denied = await verifyAdmin(req);
  if (denied) return denied;
  const token = req.headers.get("Authorization")?.replace("Bearer ", "") || "";
  const payload = await verifyToken(token);
  if (!payload) return NextResponse.json({ error: "Token ไม่ถูกต้อง" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as { email?: string };
  const email = String(body.email || "").trim();

  // อนุญาตให้ว่างได้ (ล้างค่า) แต่ถ้ากรอกต้องเป็น email ที่ valid
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json(
      { error: "รูปแบบอีเมลไม่ถูกต้อง" },
      { status: 400 }
    );
  }

  const db = getDB();
  await db
    .prepare("UPDATE admins SET email = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
    .bind(email, payload.adminId)
    .run();

  return NextResponse.json({ success: true, email });
}