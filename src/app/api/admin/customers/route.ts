import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";
import { getDB } from "@/lib/db";
import { verifyAdmin } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  const denied = await verifyAdmin(req);
  if (denied) return denied;

  const db = getDB();
  const url = new URL(req.url);
  const search = url.searchParams.get("search")?.trim() || "";

  let query = `SELECT id, email, full_name, phone, address, province, postcode,
                       is_verified, is_active, last_login, created_at,
                       (SELECT COUNT(*) FROM orders WHERE customer_id = customers.id) AS order_count,
                       (SELECT COALESCE(SUM(total), 0) FROM orders WHERE customer_id = customers.id AND status != 'cancelled') AS total_spent
                FROM customers`;
  const params: any[] = [];

  if (search) {
    query += ` WHERE email LIKE ? OR full_name LIKE ? OR phone LIKE ?`;
    const q = `%${search}%`;
    params.push(q, q, q);
  }
  query += ` ORDER BY created_at DESC LIMIT 500`;

  const stmt = params.length > 0
    ? db.prepare(query).bind(...params)
    : db.prepare(query);
  const customers = await stmt.all();

  return NextResponse.json({ customers: customers.results || [] });
}