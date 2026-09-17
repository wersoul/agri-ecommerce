import Link from "next/link";
import { Suspense } from "react";
import SuccessContent from "./SuccessContent";

// NOTE: ห้ามใส่ `export const dynamic = "force-dynamic"` และ
// `export const runtime = "edge"` เพราะ
// SuccessContent เป็น "use client" ที่อ่าน order number จาก
// window.location.search ฝั่ง client เอง ไม่จำเป็นต้อง SSR
// การใส่ force-dynamic จะบังคับให้ Next.js render ทุก request
// ผ่าน Edge Function และพยายามเรียก Incremental Cache (SUSPENSE_CACHE_URL)
// ซึ่งไม่มีบน Cloudflare Pages deployment ปัจจุบัน ทำให้ worker
// ค้าง 30 วินาทีและ Cloudflare ตอบกลับด้วย error 1101 (Worker threw exception)
//
// ลบออกแล้ว → Next.js จะ prerender เป็น static HTML prerender-fallback.html
// แล้วใช้ client component ดึง order number จาก URL ฝั่ง client
//
// ส่วน `runtime = "edge"` ก็ไม่จำเป็น เพราะหน้า prerender ไม่ได้ execute code ฝั่ง server
//
// See: src/app/cart/page.tsx, src/app/account/page.tsx เป็นตัวอย่าง

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">กำลังโหลด...</div>}>
      <SuccessContent />
    </Suspense>
  );
}