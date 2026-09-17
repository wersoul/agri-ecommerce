import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";

export async function verifyAdmin(req: NextRequest): Promise<NextResponse | null> {
  const authHeader = req.headers.get("Authorization");
  const token = authHeader?.replace("Bearer ", "");

  if (!token) {
    return NextResponse.json({ error: "ไม่ได้รับอนุญาต" }, { status: 401 });
  }

  const payload = await verifyToken(token);
  if (!payload) {
    return NextResponse.json({ error: "Token ไม่ถูกต้องหรือหมดอายุ" }, { status: 401 });
  }

  return null; // Authorized
}