import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";
import { getDB } from "@/lib/db";
import { verifyCustomer } from "@/lib/customer-api-auth";

export async function GET(req: NextRequest) {
  const auth = await verifyCustomer(req);
  if (auth instanceof NextResponse) return auth;

  const db = getDB();
  const orders = await db.prepare(
    `SELECT o.id, o.order_number, o.total, o.status, o.note,
            o.customer_address, o.created_at,
            (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) AS item_count
     FROM orders o
     WHERE o.customer_id = ?
     ORDER BY o.created_at DESC`
  ).bind(auth.customerId).all();

  return NextResponse.json({ orders: orders.results || [] });
}