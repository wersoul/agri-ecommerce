import { NextRequest, NextResponse } from "next/server";
import { verifyCustomerToken } from "@/lib/customer-auth";

export type CustomerAuth = { customerId: number; email: string };

export async function verifyCustomer(req: NextRequest): Promise<NextResponse | CustomerAuth> {
  // Read from Authorization: Bearer ... OR cookie: customer_token=...
  const authHeader = req.headers.get("Authorization");
  let token = authHeader?.replace("Bearer ", "");
  if (!token) {
    const cookieHeader = req.headers.get("Cookie") || "";
    const match = cookieHeader.match(/customer_token=([^;]+)/);
    if (match) token = match[1];
  }

  if (!token) {
    return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
  }

  const payload = await verifyCustomerToken(token);
  if (!payload) {
    return NextResponse.json({ error: "Token ไม่ถูกต้องหรือหมดอายุ" }, { status: 401 });
  }

  return { customerId: payload.customerId, email: payload.email };
}