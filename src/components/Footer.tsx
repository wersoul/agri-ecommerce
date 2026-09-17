"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Settings = {
  shop_name: string;
  shop_tagline: string;
  contact_phone: string;
  contact_mobile: string;
  contact_email: string;
  contact_line_id: string;
  contact_facebook: string;
  contact_address: string;
  contact_hours: string;
  contact_map_url: string;
  shipping_note: string;
  about_text: string;
};

const FALLBACK: Settings = {
  shop_name: "KNK Part",
  shop_tagline: "เคเอ็นเค พาร์ท - อะไหล่เกษตร อะไหล่เครื่องมือ เครื่องมือเกษตร",
  contact_phone: "",
  contact_mobile: "",
  contact_email: "",
  contact_line_id: "",
  contact_facebook: "",
  contact_address: "",
  contact_hours: "",
  contact_map_url: "",
  shipping_note: "",
  about_text: "",
};

export default function Footer() {
  const [s, setS] = useState<Settings>(FALLBACK);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => { if (d.settings) setS({ ...FALLBACK, ...d.settings }); })
      .catch(() => {});
  }, []);

  const phones = [s.contact_phone, s.contact_mobile].filter(Boolean);
  const email = s.contact_email;
  const addr = s.contact_address;

  return (
    <footer className="bg-primary-800 text-white py-8 mt-12">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <img src="/images/knkpart/knk.png" alt="KNK Part" className="h-10 w-auto bg-white rounded px-2 py-1" />
              <h3 className="font-bold text-lg">{s.shop_name || "KNK Part"}</h3>
            </div>
            <p className="text-primary-100 text-sm">
              ร้านขายอะไหล่เกษตร อะไหล่เครื่องมือ เครื่องมือเกษตร
              คุณภาพดี ราคาเป็นกันเอง จัดส่งทั่วประเทศ
            </p>
            <p className="text-primary-200 text-xs mt-2">
              {s.shop_tagline || "เคเอ็นเค พาร์ท - ผู้เชี่ยวชาญอะไหล่เกษตร"}
            </p>
          </div>
          <div>
            <h4 className="font-bold mb-2">ติดต่อเรา</h4>
            {phones.map((p, i) => (
              <p key={i} className="text-sm text-primary-100">📞 <a href={`tel:${p.replace(/[^0-9+]/g, "")}`} className="hover:underline">{p}</a></p>
            ))}
            {email && <p className="text-sm text-primary-100">📧 <a href={`mailto:${email}`} className="hover:underline">{email}</a></p>}
            {s.contact_line_id && <p className="text-sm text-primary-100">💬 LINE: {s.contact_line_id}</p>}
            {s.contact_facebook && <p className="text-sm text-primary-100">👍 <a href={`https://facebook.com/${encodeURIComponent(s.contact_facebook)}`} target="_blank" rel="noopener noreferrer" className="hover:underline">{s.contact_facebook}</a></p>}
            {addr && <p className="text-sm text-primary-100 mt-1">📍 {addr}</p>}
            {s.contact_hours && <p className="text-xs text-primary-200 mt-1">🕐 {s.contact_hours}</p>}
            <Link href="/contact" className="text-sm text-primary-200 hover:text-white inline-block mt-2">→ ดูข้อมูลติดต่อทั้งหมด</Link>
          </div>
          <div>
            <h4 className="font-bold mb-2">หมวดหมู่ยอดนิยม</h4>
            <ul className="text-sm text-primary-100 space-y-1">
              <li>• <Link href="/products?category=walking-tractor-parts" className="hover:underline">อะไหล่รถไถ</Link></li>
              <li>• <Link href="/products?category=grass-cutter-parts" className="hover:underline">อะไหล่เครื่องตัดหญ้า</Link></li>
              <li>• <Link href="/products?category=engine-parts" className="hover:underline">อะไหล่เครื่องยนต์</Link></li>
              <li>• <Link href="/products?category=sprayer-parts" className="hover:underline">อะไหล่เครื่องพ่นยา</Link></li>
              <li>• <Link href="/products?category=pump-parts" className="hover:underline">อะไหล่ปั๊มน้ำ</Link></li>
              <li>• <Link href="/products?category=condensor" className="hover:underline">คอนเดนเซอร์</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-2">คำค้นหายอดนิยม</h4>
            <ul className="text-xs text-primary-200 space-y-1">
              <li>อะไหล่เกษตร</li>
              <li>อะไหล่เครื่องมือ</li>
              <li>เครื่องมือเกษตร</li>
              <li>อะไหล่เครื่องตัดหญ้า</li>
              <li>อะไหล่เครื่องยนต์</li>
              <li>อะไหล่ปั๊มน้ำ</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-primary-700 mt-6 pt-4 text-center text-sm text-primary-200">
          © {new Date().getFullYear()} {s.shop_name || "KNK Part"} - เคเอ็นเค พาร์ท. All rights reserved. Hosted on Cloudflare Pages.
          <br />
          <span className="text-xs">ร้านอะไหล่เกษตร อะไหล่เครื่องมือ เครื่องมือเกษตร ครบวงจร</span>
        </div>
      </div>
    </footer>
  );
}