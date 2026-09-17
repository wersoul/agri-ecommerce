import { NextRequest, NextResponse } from "next/server";
export const runtime = "edge";

import { verifyAdmin } from "@/lib/api-auth";

const MAX_SIZE = 8 * 1024 * 1024; // 8 MB
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export async function POST(req: NextRequest) {
  const authError = await verifyAdmin(req);
  if (authError) return authError;

  try {
    const formData = await req.formData();
    const file = formData.get("file");
    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ error: "ไม่พบไฟล์" }, { status: 400 });
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "ไฟล์ใหญ่เกิน 8MB" }, { status: 400 });
    }
    if (file.type && !ALLOWED.has(file.type)) {
      return NextResponse.json({ error: `ประเภทไฟล์ไม่รองรับ: ${file.type}` }, { status: 400 });
    }
    const arrayBuffer = await file.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
    const dataUrl = `data:${file.type || "image/jpeg"};base64,${base64}`;
    return NextResponse.json({
      success: true,
      url: dataUrl,
      size: file.size,
      type: file.type,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "upload failed" }, { status: 500 });
  }
}