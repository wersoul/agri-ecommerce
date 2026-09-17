import { NextRequest, NextResponse } from "next/server";
import { getDB } from "@/lib/db";
import { verifyCustomerToken } from "@/lib/customer-auth";
import { sendEmail } from "@/lib/email";
export const runtime = "edge";


function generateOrderNumber(): string {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0");
  return `AG${yy}${mm}${dd}${random}`;
}

export async function POST(req: NextRequest) {
  try {
    const order = await req.json();
    const db = getDB();

    if (!order.customer_name || !order.customer_phone || !order.customer_address) {
      return NextResponse.json(
        { error: "กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน" },
        { status: 400 }
      );
    }

    if (!order.items || order.items.length === 0) {
      return NextResponse.json(
        { error: "ไม่มีสินค้าในคำสั่งซื้อ" },
        { status: 400 }
      );
    }

    // If logged in, link order to customer
    let customerId: number | null = null;
    const authHeader = req.headers.get("Authorization");
    const cookieHeader = req.headers.get("Cookie") || "";
    let token = authHeader?.replace("Bearer ", "");
    if (!token) {
      const m = cookieHeader.match(/customer_token=([^;]+)/);
      if (m) token = m[1];
    }
    if (token) {
      const payload = await verifyCustomerToken(token);
      if (payload) customerId = payload.customerId;
    }

    const orderNumber = generateOrderNumber();

    // ตรวจสอบ stock
    for (const item of order.items) {
      const product = await db
        .prepare("SELECT stock, name FROM products WHERE id = ?")
        .bind(item.product_id)
        .first<{ stock: number; name: string }>();
      if (!product) {
        return NextResponse.json(
          { error: `ไม่พบสินค้า ID ${item.product_id}` },
          { status: 400 }
        );
      }
      if (product.stock < item.quantity) {
        return NextResponse.json(
          { error: `สินค้า "${product.name}" เหลือเพียง ${product.stock} ชิ้น` },
          { status: 400 }
        );
      }
    }

    // สร้างคำสั่งซื้อ
    const orderResult = await db
      .prepare(
        `INSERT INTO orders (order_number, customer_id, customer_name, customer_phone, customer_email, customer_address, customer_province, customer_postcode, note, extra_info, subtotal, shipping, total, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`
      )
      .bind(
        orderNumber,
        customerId,
        order.customer_name,
        order.customer_phone,
        order.customer_email || "",
        order.customer_address,
        order.customer_province || "",
        order.customer_postcode || "",
        order.note || "",
        order.extra_info || "",
        order.subtotal || 0,
        order.shipping || 0,
        order.total || 0
      )
      .run();

    const orderId = orderResult.meta.last_row_id;

    // บันทึกรายการสินค้า + ตัด stock
    for (const item of order.items) {
      await db
        .prepare(
          `INSERT INTO order_items (order_id, product_id, product_name, product_price, quantity, subtotal)
           VALUES (?, ?, ?, ?, ?, ?)`
        )
        .bind(
          orderId,
          item.product_id,
          item.product_name,
          item.product_price,
          item.quantity,
          item.subtotal
        )
        .run();

      await db
        .prepare("UPDATE products SET stock = stock - ? WHERE id = ?")
        .bind(item.quantity, item.product_id)
        .run();
    }

    // ─────────────────────────────────────────────────────────────
    // ส่งอีเมลแจ้งเตือนไปยังแอดมินทุกคนในระบบหลังบ้าน
    // หมายเหตุ: ต้อง await แบบ synchronous ก่อน return เพราะ
    // Cloudflare Pages (next-on-pages) ไม่ expose `ctx.waitUntil()`
    // ให้เราใช้ ดังนั้น fire-and-forget promise จะถูก cancel ทันที
    // ที่ handler return response (ต่างจาก Vercel Edge)
    // ─────────────────────────────────────────────────────────────
    try {
      const admins = await db
        .prepare("SELECT email FROM admins WHERE email IS NOT NULL AND email != ''")
        .all<{ email: string }>();
      const adminCount = admins?.results?.length ?? 0;
      console.log("[order-email] admins found:", adminCount);
      if (adminCount > 0) {
        const itemsRows = order.items.map((it: any) =>
          "<tr><td style=\"padding:6px;border-bottom:1px solid #eee;\">" + String(it.product_name || "").replace(/[<>&]/g, '') + "</td>" +
          "<td style=\"padding:6px;border-bottom:1px solid #eee;text-align:center;\">" + it.quantity + "</td>" +
          "<td style=\"padding:6px;border-bottom:1px solid #eee;text-align:right;\">฿" + Number(it.product_price).toLocaleString() + "</td>" +
          "<td style=\"padding:6px;border-bottom:1px solid #eee;text-align:right;\">฿" + Number(it.subtotal).toLocaleString() + "</td></tr>"
        ).join("");
        const subject = "[KNK Part] คำสั่งซื้อใหม่ #" + orderNumber + " จาก " + order.customer_name;
        const text = "คำสั่งซื้อใหม่ #" + orderNumber + "\nลูกค้า: " + order.customer_name + " (" + order.customer_phone + ")\nที่อยู่: " + order.customer_address + "\nยอดรวม: ฿" + Number(order.total || 0).toLocaleString() + (order.extra_info ? "\nข้อมูลเพิ่มเติม: " + order.extra_info : "");
        const extraInfoBlock = order.extra_info
          ? '<tr><td colspan="4" style="padding:8px;background:#fffbeb;border-left:3px solid #f59e0b;"><strong>📝 ข้อมูลเพิ่มเติมจากลูกค้า:</strong><br/>' + String(order.extra_info).replace(/[<>&]/g, "").replace(/\n/g, "<br/>") + "</td></tr>"
          : "";
        const html = '<!DOCTYPE html><html><head><meta charset="utf-8"/></head><body style="font-family:sans-serif;background:#f5f5f5;padding:20px;"><div style="max-width:640px;margin:0 auto;background:white;padding:24px;border-radius:12px;"><h2 style="color:#166534;text-align:center;">KNK Part - คำสั่งซื้อใหม่</h2><div style="background:#f0fdf4;border:2px solid #16a34a;border-radius:8px;padding:12px;margin:12px 0;"><strong>#' + orderNumber + '</strong> - ฿' + Number(order.total || 0).toLocaleString() + '</div><h3>ข้อมูลลูกค้า</h3><table style="width:100%;font-size:14px;"><tr><td>ชื่อ:</td><td><strong>' + String(order.customer_name || "").replace(/[<>&]/g, '') + '</strong></td></tr><tr><td>โทร:</td><td>' + String(order.customer_phone || "").replace(/[<>&]/g, '') + '</td></tr><tr><td>อีเมล:</td><td>' + String(order.customer_email || "").replace(/[<>&]/g, '') + '</td></tr><tr><td>ที่อยู่:</td><td>' + String(order.customer_address || "").replace(/[<>&]/g, '') + '</td></tr></table><h3>รายการสินค้า</h3><table style="width:100%;font-size:14px;border-collapse:collapse;"><thead><tr style="background:#f9fafb;"><th style="padding:6px;text-align:left;">สินค้า</th><th style="padding:6px;text-align:center;">จำนวน</th><th style="padding:6px;text-align:right;">ราคา</th><th style="padding:6px;text-align:right;">รวม</th></tr></thead><tbody>' + itemsRows + extraInfoBlock + '</tbody></table><div style="margin-top:12px;padding-top:12px;border-top:2px solid #e5e7eb;text-align:right;font-size:18px;font-weight:bold;color:#166534;">ยอดรวม: ฿' + Number(order.total || 0).toLocaleString() + '</div></div></body></html>';

        for (const a of admins.results) {
          try {
            const result = await sendEmail({ to: a.email, subject, html, text });
            console.log("[order-email] sent to", a.email, "->", JSON.stringify(result));
          } catch (e) {
            console.error("[order-email]", a.email, String(e));
          }
        }
      }
    } catch (emailErr) {
      console.error("[order-email] admin lookup failed:", String(emailErr));
    }

    // ─────────────────────────────────────────────────────────────
    // ส่งอีเมลแจ้งลูกค้า (สมาชิกหรือ guest ที่กรอก email)
    // ─────────────────────────────────────────────────────────────
    try {
      const customerEmail = String(order.customer_email || "").trim();
      if (customerEmail) {
        const itemsRows = order.items.map((it: any) =>
          "<tr><td style=\"padding:6px;border-bottom:1px solid #eee;\">" + String(it.product_name || "").replace(/[<>&]/g, "") + "</td>" +
          "<td style=\"padding:6px;border-bottom:1px solid #eee;text-align:center;\">" + it.quantity + "</td>" +
          "<td style=\"padding:6px;border-bottom:1px solid #eee;text-align:right;\">฿" + Number(it.product_price).toLocaleString() + "</td>" +
          "<td style=\"padding:6px;border-bottom:1px solid #eee;text-align:right;\">฿" + Number(it.subtotal).toLocaleString() + "</td></tr>"
        ).join("");
        const extraInfoBlock = order.extra_info
          ? '<div style="margin-top:8px;padding:8px;background:#fffbeb;border-left:3px solid #f59e0b;border-radius:4px;"><strong>📝 ข้อมูลเพิ่มเติม:</strong><br/>' + String(order.extra_info).replace(/[<>&]/g, "").replace(/\n/g, "<br/>") + "</div>"
          : "";
        const customerHtml =
          '<!DOCTYPE html><html><head><meta charset="utf-8"/></head><body style="font-family:sans-serif;background:#f5f5f5;padding:20px;">' +
          '<div style="max-width:640px;margin:0 auto;background:white;padding:24px;border-radius:12px;">' +
          '<h2 style="color:#166534;text-align:center;">KNK Part - ขอบคุณสำหรับคำสั่งซื้อ</h2>' +
          '<p style="text-align:center;">สวัสดีคุณ <strong>' + String(order.customer_name || "").replace(/[<>&]/g, "") + "</strong></p>" +
          '<div style="background:#f0fdf4;border:2px solid #16a34a;border-radius:8px;padding:12px;margin:12px 0;text-align:center;">' +
          "<strong>เลขที่คำสั่งซื้อ:</strong> <strong>#" + orderNumber + "</strong><br/>" +
          "<strong>ยอดรวม:</strong> ฿" + Number(order.total || 0).toLocaleString() +
          "</div>" +
          '<p style="font-size:14px;color:#374151;">ทางร้านได้รับคำสั่งซื้อของคุณเรียบร้อยแล้ว และจะติดต่อกลับเพื่อยืนยันการจัดส่งโดยเร็วที่สุด</p>' +
          '<h3 style="margin-top:16px;">📦 รายการสินค้า</h3>' +
          '<table style="width:100%;font-size:14px;border-collapse:collapse;">' +
          '<thead><tr style="background:#f9fafb;"><th style="padding:6px;text-align:left;">สินค้า</th><th style="padding:6px;text-align:center;">จำนวน</th><th style="padding:6px;text-align:right;">ราคา</th><th style="padding:6px;text-align:right;">รวม</th></tr></thead>' +
          "<tbody>" + itemsRows + "</tbody></table>" +
          '<div style="margin-top:12px;padding-top:12px;border-top:2px solid #e5e7eb;text-align:right;font-size:18px;font-weight:bold;color:#166534;">ยอดรวม: ฿' + Number(order.total || 0).toLocaleString() + "</div>" +
          '<h3 style="margin-top:16px;">🚚 ที่อยู่จัดส่ง</h3>' +
          '<div style="font-size:14px;background:#f9fafb;padding:10px;border-radius:6px;">' +
          String(order.customer_name || "").replace(/[<>&]/g, "") + "<br/>" +
          String(order.customer_phone || "").replace(/[<>&]/g, "") + "<br/>" +
          String(order.customer_address || "").replace(/[<>&]/g, "") + "<br/>" +
          String(order.customer_province || "").replace(/[<>&]/g, "") + " " + String(order.customer_postcode || "").replace(/[<>&]/g, "") +
          "</div>" +
          extraInfoBlock +
          '<p style="margin-top:24px;font-size:13px;color:#6b7280;text-align:center;">หากมีคำถาม ติดต่อเราผ่านทางอีเมลหรือเบอร์โทรที่ระบุในหน้าเว็บไซต์</p>' +
          "</div></body></html>";
        const customerText =
          "สวัสดีคุณ " + order.customer_name + "\n" +
          "ขอบคุณสำหรับคำสั่งซื้อ #" + orderNumber + "\n" +
          "ยอดรวม: ฿" + Number(order.total || 0).toLocaleString() + "\n\n" +
          "รายการสินค้า:\n" + order.items.map((it: any) =>
            "- " + it.product_name + " x" + it.quantity + " = ฿" + Number(it.subtotal).toLocaleString()
          ).join("\n") + "\n\n" +
          "ที่อยู่จัดส่ง:\n" + order.customer_name + "\n" +
          order.customer_phone + "\n" + order.customer_address + " " +
          (order.customer_province || "") + " " + (order.customer_postcode || "") +
          (order.extra_info ? "\n\nข้อมูลเพิ่มเติม: " + order.extra_info : "");
        const customerSubject = "[KNK Part] ยืนยันคำสั่งซื้อ #" + orderNumber;
        try {
          const r = await sendEmail({ to: customerEmail, subject: customerSubject, html: customerHtml, text: customerText });
          console.log("[order-email] customer:", customerEmail, "->", JSON.stringify(r));
        } catch (e) {
          console.error("[order-email] customer failed:", String(e));
        }
      }
    } catch (customerEmailErr) {
      console.error("[order-email] customer section failed:", String(customerEmailErr));
    }

    return NextResponse.json({
      success: true,
      order_number: orderNumber,
      order_id: orderId,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}