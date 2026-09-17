import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";
import { getDB } from "@/lib/db";
import { verifyAdmin } from "@/lib/api-auth";
import { hashPassword, verifyPassword, verifyToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const denied = await verifyAdmin(req);
  if (denied) return denied;

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

    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "");
    const payload = token ? await verifyToken(token) : null;
    if (!payload) {
      return NextResponse.json({ error: "Token ไม่ถูกต้อง" }, { status: 401 });
    }

    const db = getDB();
    const admin = await db
      .prepare("SELECT password_hash FROM admins WHERE id = ?")
      .bind(payload.adminId)
      .first<{ password_hash: string }>();

    if (!admin) {
      return NextResponse.json({ error: "ไม่พบบัญชีผู้ดูแล" }, { status: 404 });
    }

    const valid = await verifyPassword(current_password, admin.password_hash);
    if (!valid) {
      return NextResponse.json(
        { error: "รหัสผ่านเดิมไม่ถูกต้อง" },
        { status: 401 }
      );
    }

    const newHash = await hashPassword(new_password);
    await db
      .prepare(
        `UPDATE admins SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
      )
      .bind(newHash, payload.adminId)
      .run();

    return NextResponse.json({ ok: true, message: "เปลี่ยนรหัสผ่านเรียบร้อย" });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}