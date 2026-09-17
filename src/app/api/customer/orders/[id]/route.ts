import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";
import { getDB } from "@/lib/db";
import { verifyCustomer } from "@/lib/customer-api-auth";

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await verifyCustomer(req);
  if (auth instanceof NextResponse) return auth;

  const { id } = await ctx.params;
  const orderId = parseInt(id, 10);
  if (!orderId) return NextResponse.json({ error: "ID ไม่ถูกต้อง" }, { status: 400 });

  const db = getDB();
  const order = await db.prepare(
    `SELECT id, order_number, total, status,
            customer_address, customer_name, customer_phone, customer_email,
            note, created_at
     FROM orders WHERE id = ? AND customer_id = ?`
  ).bind(orderId, auth.customerId).first();

  if (!order) return NextResponse.json({ error: "ไม่พบออร์เดอร์" }, { status: 404 });

  const items = await db.prepare(
    `SELECT oi.id, oi.product_id, oi.product_name, oi.quantity,
            oi.unit_price, oi.subtotal, p.image_url AS product_image
     FROM order_items oi
     LEFT JOIN products p ON p.id = oi.product_id
     WHERE oi.order_id = ?`
  ).bind(orderId).all();

  return NextResponse.json({ order: { ...order, items: items.results || [] } });
}