import { NextRequest, NextResponse } from "next/server";
export const runtime = "edge";

import { verifyAdmin } from "@/lib/api-auth";
// Pull R2Bucket type from Cloudflare workers-types
// (this type only exists at runtime in the Workers/Pages environment)
type R2Bucket = any;

// Cloudflare R2 binding — see wrangler.toml
interface Env {
  R2: R2Bucket;
  R2_PUBLIC_URL: string;
  R2_FOLDER: string;
}

const MAX_SIZE = 8 * 1024 * 1024; // 8 MB
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const EXT_MAP: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

function rand(len = 8): string {
  const arr = new Uint8Array(len);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => b.toString(16).padStart(2, "0")).join("").slice(0, len);
}

export async function POST(req: NextRequest) {
  const authError = await verifyAdmin(req);
  if (authError) return authError;

  try {
    const env = (process.env as unknown) as Env;
    if (!env.R2) {
      return NextResponse.json({ error: "R2 binding ไม่ถูกตั้งค่า" }, { status: 500 });
    }
    const publicBase = (env.R2_PUBLIC_URL || "").replace(/\/+$/, "");
    const folder = (env.R2_FOLDER || "product").replace(/^\/+|\/+$/g, "");

    const formData = await req.formData();
    const file = formData.get("file");
    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ error: "ไม่พบไฟล์" }, { status: 400 });
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "ไฟล์ใหญ่เกิน 8MB" }, { status: 400 });
    }
    const mime = file.type || "image/jpeg";
    if (!ALLOWED.has(mime)) {
      return NextResponse.json({ error: `ประเภทไฟล์ไม่รองรอง: ${mime}` }, { status: 400 });
    }

    const ext = EXT_MAP[mime] || "jpg";
    const filename = `${Date.now()}-${rand(8)}.${ext}`;
    const key = `${folder}/${filename}`;
    const arrayBuffer = await file.arrayBuffer();
    const body = new Uint8Array(arrayBuffer);

    await env.R2.put(key, body, {
      httpMetadata: { contentType: mime, cacheControl: "public, max-age=31536000, immutable" },
    });

    const url = `${publicBase}/${key}`;
    return NextResponse.json({
      success: true,
      url,
      key,
      size: file.size,
      type: mime,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "upload failed" }, { status: 500 });
  }
}