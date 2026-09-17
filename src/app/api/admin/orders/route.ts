import { NextRequest, NextResponse } from "next/server";
import { getDB } from "@/lib/db";
export const runtime = "edge";

import { verifyAdmin } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  const authError = await verifyAdmin(req);
  if (authError) return authError;

  try {
    const db = getDB();
    const { results } = await db
      .prepare("SELECT * FROM orders ORDER BY created_at DESC")
      .all();
    return NextResponse.json(results || []);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}