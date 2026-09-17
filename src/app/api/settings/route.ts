import { NextRequest, NextResponse } from "next/server";
import { getDB } from "@/lib/db";

export const runtime = "edge";

// Public endpoint - returns all settings as object
export async function GET() {
  try {
    const db = await getDB();
    const result = await db.prepare("SELECT key, value FROM site_settings").all();
    const settings: Record<string, string> = {};
    for (const row of result.results || []) {
      settings[row.key as string] = (row.value as string) || "";
    }
    return NextResponse.json({ settings });
  } catch (error) {
    console.error("GET settings error:", error);
    return NextResponse.json({ settings: {}, error: String(error) }, { status: 500 });
  }
}