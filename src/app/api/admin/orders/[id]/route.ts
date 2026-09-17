import { NextRequest, NextResponse } from "next/server";
export const runtime = "edge";
import { getDB } from "@/lib/db";
import { verifyAdmin } from "@/lib/api-auth";

// GET /api/admin/orders/[id] - full order + items
export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const denied = await verifyAdmin(req);
  if (denied) return denied;
  const { id: idStr } = await ctx.params;
  const id = parseInt(idStr);
  if (!id || isNaN(id)) {
    return NextResponse.json({ error: "ID ไม่ถูกต้อง" }, { status: 400 });
  }
  const db = getDB();
  const order = await db.prepare("SELECT * FROM orders WHERE id = ?").bind(id).first();
  if (!order) {
    return NextResponse.json({ error: "ไม่พบคำสั่งซื้อ" }, { status: 404 });
  }
  const itemsRes = await db
    .prepare("SELECT id, product_id, product_name, product_price, quantity, subtotal FROM order_items WHERE order_id = ?")
    .bind(id)
    .all();
  return NextResponse.json({
    order,
    items: itemsRes.results || [],
  });
}

// PUT /api/admin/orders/[id] - flexible edit
// Body supports:
//   { status }                                  change status
//   { customer_name, customer_phone, ... }      edit customer info
//   { note, extra_info }                        edit notes
//   { shipping }                                edit shipping fee (recalc total)
//   { items: [{product_id, product_name, product_price, quantity}] }  rewrite items
export async function PUT(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const denied = await verifyAdmin(req);
  if (denied) return denied;
  const { id: idStr } = await ctx.params;
  const id = parseInt(idStr);
  if (!id || isNaN(id)) {
    return NextResponse.json({ error: "ID ไม่ถูกต้อง" }, { status: 400 });
  }
  const db = getDB();
  const existing = await db.prepare("SELECT id FROM orders WHERE id = ?").bind(id).first();
  if (!existing) {
    return NextResponse.json({ error: "ไม่พบคำสั่งซื้อ" }, { status: 404 });
  }
  const body = await req.json().catch(() => ({} as any));

  // 1) Update scalar fields
  const allowed: Record<string, string> = {
    customer_name: "string",
    customer_phone: "string",
    customer_email: "string|null",
    customer_address: "string",
    customer_province: "string|null",
    customer_postcode: "string|null",
    note: "string|null",
    extra_info: "string|null",
    status: "string",
    shipping: "number",
  };
  const sets: string[] = [];
  const binds: any[] = [];
  for (const key of Object.keys(allowed)) {
    if (key in body) {
      sets.push(key + " = ?");
      binds.push(body[key] ?? null);
    }
  }
  if (sets.length > 0) {
    sets.push("updated_at = CURRENT_TIMESTAMP");
    binds.push(id);
    await db.prepare("UPDATE orders SET " + sets.join(", ") + " WHERE id = ?")
      .bind(...binds).run();
  }

  // 2) Rewrite items if provided
  if (Array.isArray(body.items)) {
    await db.prepare("DELETE FROM order_items WHERE order_id = ?").bind(id).run();
    let newSubtotal = 0;
    for (const it of body.items) {
      const pid = Number(it.product_id);
      const qty = Math.max(1, parseInt(String(it.quantity)) || 1);
      const price = Number(it.product_price) || 0;
      const name = String(it.product_name || "");
      const sub = qty * price;
      newSubtotal += sub;
      await db.prepare(
        "INSERT INTO order_items (order_id, product_id, product_name, product_price, quantity, subtotal) VALUES (?, ?, ?, ?, ?, ?)"
      ).bind(id, pid, name, price, qty, sub).run();
    }
    let ship = 0;
    if ("shipping" in body) {
      ship = Number(body.shipping) || 0;
    } else {
      const cur = await db.prepare("SELECT shipping FROM orders WHERE id = ?").bind(id).first<{ shipping: number }>();
      ship = cur ? cur.shipping : 0;
    }
    await db.prepare(
      "UPDATE orders SET subtotal = ?, shipping = ?, total = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
    ).bind(newSubtotal, ship, newSubtotal + ship, id).run();
  } else if ("shipping" in body) {
    // recalc total when only shipping changed
    const cur = await db.prepare("SELECT subtotal FROM orders WHERE id = ?").bind(id).first<{ subtotal: number }>();
    if (cur) {
      const sub = cur.subtotal || 0;
      const ship = Number(body.shipping) || 0;
      await db.prepare(
        "UPDATE orders SET shipping = ?, total = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
      ).bind(ship, sub + ship, id).run();
    }
  }

  return NextResponse.json({ success: true });
}

// DELETE /api/admin/orders/[id]
export async function DELETE(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const denied = await verifyAdmin(req);
  if (denied) return denied;
  const { id: idStr } = await ctx.params;
  const id = parseInt(idStr);
  if (!id || isNaN(id)) {
    return NextResponse.json({ error: "ID ไม่ถูกต้อง" }, { status: 400 });
  }
  const db = getDB();
  const existing = await db.prepare("SELECT id FROM orders WHERE id = ?").bind(id).first();
  if (!existing) {
    return NextResponse.json({ error: "ไม่พบคำสั่งซื้อ" }, { status: 404 });
  }
  await db.prepare("DELETE FROM order_items WHERE order_id = ?").bind(id).run();
  await db.prepare("DELETE FROM orders WHERE id = ?").bind(id).run();
  return NextResponse.json({ success: true });
}
