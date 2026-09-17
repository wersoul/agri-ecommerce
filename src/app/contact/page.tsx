"use client";

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

const DEFAULT_SETTINGS: Settings = {
  shop_name: "KNK Part",
  shop_tagline: "เคเอ็นเค พาร์ท - อะไหล่เกษตร อะไหล่เครื่องมือ เครื่องมือเกษตร",
  contact_phone: "02-XXX-XXXX",
  contact_mobile: "08X-XXX-XXXX",
  contact_email: "contact@knkpart.com",
  contact_line_id: "@knkpart",
  contact_facebook: "KNK Part",
  contact_address: "123/4 หมู่ 5 ตำบลXXX อำเภอXXX จังหวัดXXX 10000",
  contact_hours: "จันทร์-เสาร์ 8:00-17:00 น.",
  contact_map_url: "",
  shipping_note: "จัดส่งทั่วประเทศ ค่าจัดส่งตามจริง",
  about_text: "",
};

export default function ContactPage() {
  const [s, setS] = useState<Settings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => {
        if (d.settings) setS({ ...DEFAULT_SETTINGS, ...d.settings });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <h1 className="text-3xl md:text-4xl font-bold mb-2 text-primary-900">📞 ติดต่อเรา</h1>
      <p className="text-gray-600 mb-8">{s.shop_name} - {s.shop_tagline}</p>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4 text-primary-800">ข้อมูลการติดต่อ</h2>

          <div className="space-y-4">
            <ContactRow icon="📞" label="โทรศัพท์" value={s.contact_phone} href={s.contact_phone ? `tel:${s.contact_phone.replace(/[^0-9+]/g, "")}` : undefined} />
            <ContactRow icon="📱" label="มือถือ" value={s.contact_mobile} href={s.contact_mobile ? `tel:${s.contact_mobile.replace(/[^0-9+]/g, "")}` : undefined} />
            <ContactRow icon="✉️" label="อีเมล" value={s.contact_email} href={s.contact_email ? `mailto:${s.contact_email}` : undefined} />
            <ContactRow icon="💬" label="LINE" value={s.contact_line_id} href={s.contact_line_id ? `https://line.me/R/ti/p/${encodeURIComponent(s.contact_line_id.replace("@", ""))}` : undefined} />
            <ContactRow icon="👍" label="Facebook" value={s.contact_facebook} href={s.contact_facebook ? `https://facebook.com/${encodeURIComponent(s.contact_facebook)}` : undefined} />
            <ContactRow icon="📍" label="ที่อยู่" value={s.contact_address} />
            <ContactRow icon="🕐" label="เวลาทำการ" value={s.contact_hours} />
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-3 text-primary-800">🚚 การจัดส่ง</h2>
            <p className="text-gray-700">{s.shipping_note}</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-3 text-primary-800">ℹ️ เกี่ยวกับเรา</h2>
            <p className="text-gray-700 leading-relaxed">{s.about_text || `${s.shop_name} ร้านขายอะไหล่เกษตร อะไหล่เครื่องมือ เครื่องมือเกษตรครบวงจร`}</p>
          </div>

          {s.contact_map_url && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-3 text-primary-800">🗺️ แผนที่</h2>
              <iframe
                src={s.contact_map_url}
                className="w-full h-64 rounded border"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="แผนที่ร้าน"
              />
            </div>
          )}
        </div>
      </div>

      {loading && <p className="text-center text-sm text-gray-500 mt-4">กำลังโหลดข้อมูล...</p>}
    </div>
  );
}

function ContactRow({ icon, label, value, href }: { icon: string; label: string; value: string; href?: string }) {
  if (!value) return null;
  const inner = (
    <div className="flex items-start gap-3">
      <span className="text-2xl flex-shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-gray-800 font-medium break-words">{value}</p>
      </div>
    </div>
  );
  if (href) {
    return (
      <a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer" className="block hover:bg-primary-50 -mx-2 px-2 py-1 rounded transition">
        {inner}
      </a>
    );
  }
  return <div className="py-1">{inner}</div>;
}