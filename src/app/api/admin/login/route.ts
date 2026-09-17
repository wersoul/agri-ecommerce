import { NextRequest, NextResponse } from "next/server";
import { getDB } from "@/lib/db";
export const runtime = "edge";

import { verifyPassword, signToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: "กรุณากรอกชื่อผู้ใช้และรหัสผ่าน" },
        { status: 400 }
      );
    }

    const db = getDB();
    const admin = await db
      .prepare("SELECT * FROM admins WHERE username = ?")
      .bind(username)
      .first<{ id: number; username: string; password_hash: string }>();

    if (!admin) {
      return NextResponse.json(
        { error: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" },
        { status: 401 }
      );
    }

    const valid = await verifyPassword(password, admin.password_hash);
    if (!valid) {
      return NextResponse.json(
        { error: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" },
        { status: 401 }
      );
    }

    const token = await signToken({
      adminId: admin.id,
      username: admin.username,
    });

    return NextResponse.json({ token, username: admin.username });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}