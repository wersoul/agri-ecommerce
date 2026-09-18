import { NextRequest, NextResponse } from "next/server";
export const runtime = "edge";
import { getDB } from "@/lib/db";
import { verifyAdmin } from "@/lib/api-auth";
import { sendEmail } from "@/lib/email";

interface OrderRow {
  id: number;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  customer_address: string;
  customer_province: string;
  customer_postcode: string;
  note: string;
  extra_info: string;
  subtotal: number;
  shipping: number;
  total: number;
  status: string;
  created_at: string;
}

interface OrderItemRow {
  id: number;
  product_id: number;
  product_name: string;
  product_price: number;
  quantity: number;
  subtotal: number;
}

function escapeHtml(s: string): string {
  return String(s || "").replace(/[<>&]/g, "");
}

// สร้าง HTML email สำหรับลูกค้า (ใช้ template เดียวกับ /api/orders/route.ts)
function buildCustomerEmailHtml(order: OrderRow, items: OrderItemRow[]): string {
  const itemsRows = items
    .map(
      (it) =>
        "<tr>" +
        "<td style=\"padding:6px;border-bottom:1px solid #eee;\">" +
        escapeHtml(it.product_name) +
        "</td>" +
        "<td style=\"padding:6px;border-bottom:1px solid #eee;text-align:center;\">" +
        it.quantity +
        "</td>" +
        "<td style=\"padding:6px;border-bottom:1px solid #eee;text-align:right;\">฿" +
        Number(it.product_price).toLocaleString() +
        "</td>" +
        "<td style=\"padding:6px;border-bottom:1px solid #eee;text-align:right;\">฿" +
        Number(it.subtotal).toLocaleString() +
        "</td></tr>"
    )
    .join("");

  const extraInfoBlock = order.extra_info
    ? '<div style="margin-top:8px;padding:8px;background:#fffbeb;border-left:3px solid #f59e0b;border-radius:4px;"><strong>📝 ข้อมูลเพิ่มเติม:</strong><br/>' +
      escapeHtml(order.extra_info).replace(/\n/g, "<br/>") +
      "</div>"
    : "";

  return (
    '<!DOCTYPE html><html><head><meta charset="utf-8"/></head><body style="font-family:sans-serif;background:#f5f5f5;padding:20px;">' +
    '<div style="max-width:640px;margin:0 auto;background:white;padding:24px;border-radius:12px;">' +
    '<h2 style="color:#166534;text-align:center;">KNK Part - ขอบคุณสำหรับคำสั่งซื้อ</h2>' +
    '<p style="text-align:center;">สวัสดีคุณ <strong>' +
    escapeHtml(order.customer_name) +
    "</strong></p>" +
    '<div style="background:#f0fdf4;border:2px solid #16a34a;border-radius:8px;padding:12px;margin:12px 0;text-align:center;">' +
    "<strong>เลขที่คำสั่งซื้อ:</strong> <strong>#" +
    order.order_number +
    "</strong><br/>" +
    "<strong>ยอดรวม:</strong> ฿" +
    Number(order.total).toLocaleString() +
    "</div>" +
    '<p style="font-size:14px;color:#374151;">ทางร้านได้รับคำสั่งซื้อของคุณเรียบร้อยแล้ว และจะติดต่อกลับเพื่อยืนยันการจัดส่งโดยเร็วที่สุด</p>' +
    '<h3 style="margin-top:16px;">📦 รายการสินค้า</h3>' +
    '<table style="width:100%;font-size:14px;border-collapse:collapse;">' +
    '<thead><tr style="background:#f9fafb;">' +
    '<th style="padding:6px;text-align:left;">สินค้า</th>' +
    '<th style="padding:6px;text-align:center;">จำนวน</th>' +
    '<th style="padding:6px;text-align:right;">ราคา</th>' +
    '<th style="padding:6px;text-align:right;">รวม</th>' +
    "</tr></thead>" +
    "<tbody>" + itemsRows + "</tbody></table>" +
    '<div style="margin-top:12px;padding-top:12px;border-top:2px solid #e5e7eb;text-align:right;font-size:18px;font-weight:bold;color:#166534;">ยอดรวม: ฿' +
    Number(order.total).toLocaleString() +
    "</div>" +
    '<h3 style="margin-top:16px;">🚚 ที่อยู่จัดส่ง</h3>' +
    '<div style="font-size:14px;background:#f9fafb;padding:10px;border-radius:6px;">' +
    escapeHtml(order.customer_name) + "<br/>" +
    escapeHtml(order.customer_phone) + "<br/>" +
    escapeHtml(order.customer_address) + "<br/>" +
    escapeHtml(order.customer_province) + " " +
    escapeHtml(order.customer_postcode) +
    "</div>" +
    extraInfoBlock +
    '<p style="margin-top:24px;font-size:13px;color:#6b7280;text-align:center;">หากมีคำถาม ติดต่อเราผ่านทางอีเมลหรือเบอร์โทรที่ระบุในหน้าเว็บไซต์</p>' +
    "</div></body></html>"
  );
}

function buildCustomerEmailText(order: OrderRow, items: OrderItemRow[]): string {
  const itemLines = items
    .map(
      (it) =>
        "- " + it.product_name + " x" + it.quantity + " = ฿" + Number(it.subtotal).toLocaleString()
    )
    .join("\n");
  return (
    "สวัสดีคุณ " + order.customer_name + "\n" +
    "ขอบคุณสำหรับคำสั่งซื้อ #" + order.order_number + "\n" +
    "ยอดรวม: ฿" + Number(order.total).toLocaleString() + "\n\n" +
    "รายการสินค้า:\n" + itemLines + "\n\n" +
    "ที่อยู่จัดส่ง:\n" +
    order.customer_name + "\n" +
    order.customer_phone + "\n" +
    order.customer_address + " " +
    (order.customer_province || "") + " " + (order.customer_postcode || "") +
    (order.extra_info ? "\n\nข้อมูลเพิ่มเติม: " + order.extra_info : "")
  );
}

// POST /api/admin/orders/[id]/email
// แอดมินส่งอีเมลแจ้งรายละเอียดคำสั่งซื้อไปยังอีเมลของลูกค้า (order.customer_email)
export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const denied = await verifyAdmin(req);
  if (denied) return denied;

  const { id: idStr } = await ctx.params;
  const orderId = parseInt(idStr, 10);
  if (!orderId || isNaN(orderId)) {
    return NextResponse.json({ error: "ID ไม่ถูกต้อง" }, { status: 400 });
  }

  const db = getDB();
  const order = await db
    .prepare(
      `SELECT id, order_number, customer_name, customer_phone, customer_email,
              customer_address, customer_province, customer_postcode,
              note, extra_info, subtotal, shipping, total, status, created_at
       FROM orders WHERE id = ?`
    )
    .bind(orderId)
    .first<OrderRow>();

  if (!order) {
    return NextResponse.json({ error: "ไม่พบคำสั่งซื้อ" }, { status: 404 });
  }

  const customerEmail = String(order.customer_email || "").trim();
  if (!customerEmail) {
    return NextResponse.json(
      { error: "คำสั่งซื้อนี้ไม่มีอีเมลลูกค้า — ไม่สามารถส่งอีเมลได้" },
      { status: 400 }
    );
  }

  const itemsRes = await db
    .prepare(
      `SELECT id, product_id, product_name, product_price, quantity, subtotal
       FROM order_items WHERE order_id = ?`
    )
    .bind(orderId)
    .all<OrderItemRow>();
  const items = itemsRes.results || [];

  const html = buildCustomerEmailHtml(order, items);
  const text = buildCustomerEmailText(order, items);
  const subject = "[KNK Part] รายละเอียดคำสั่งซื้อ #" + order.order_number;

  try {
    const result = await sendEmail({
      to: customerEmail,
      subject,
      html,
      text,
    });

    if (!result.ok) {
      console.error("[admin-order-email] send failed:", result.error);
      return NextResponse.json(
        { error: "ส่งอีเมลไม่สำเร็จ: " + (result.error || "unknown") },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "ส่งอีเมลไปยัง " + customerEmail + " เรียบร้อยแล้ว",
      sent_to: customerEmail,
    });
  } catch (e) {
    console.error("[admin-order-email] exception:", String(e));
    return NextResponse.json(
      { error: "ส่งอีเมลไม่สำเร็จ: " + String(e) },
      { status: 500 }
    );
  }
}