import { NextRequest, NextResponse } from "next/server";
import { getDB } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

export const runtime = "edge";

// Admin endpoint - update site settings
export async function GET(req: NextRequest) {
  try {
    const auth = req.headers.get("Authorization");
    if (!auth || !verifyToken(auth.replace("Bearer ", ""))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const db = await getDB();
    const result = await db.prepare("SELECT key, value FROM site_settings").all();
    const settings: Record<string, string> = {};
    for (const row of result.results || []) {
      settings[row.key as string] = (row.value as string) || "";
    }
    return NextResponse.json({ settings });
  } catch (error) {
    console.error("Admin GET settings error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const auth = req.headers.get("Authorization");
    if (!auth || !verifyToken(auth.replace("Bearer ", ""))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await req.json();
    const updates = body.settings || {};
    const db = await getDB();
    const stmt = db.prepare(
      "INSERT INTO site_settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP"
    );
    let count = 0;
    for (const [key, value] of Object.entries(updates)) {
      await stmt.bind(key, String(value ?? "")).run();
      count++;
    }
    return NextResponse.json({ success: true, updated: count });
  } catch (error) {
    console.error("Admin PUT settings error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}