"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

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

const EMPTY: Settings = {
  shop_name: "", shop_tagline: "", contact_phone: "", contact_mobile: "",
  contact_email: "", contact_line_id: "", contact_facebook: "",
  contact_address: "", contact_hours: "", contact_map_url: "",
  shipping_note: "", about_text: "",
};

export default function AdminContactPage() {
  const router = useRouter();
  const [s, setS] = useState<Settings>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    if (!token) { router.push("/admin/login"); return; }
    fetch("/api/admin/settings", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.ok ? r.json() : Promise.reject(r.status))
      .then((d) => { if (d.settings) setS({ ...EMPTY, ...d.settings }); setLoading(false); })
      .catch(() => setLoading(false));
  }, [router]);

  const update = (key: keyof Settings, value: string) => {
    setS((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const token = localStorage.getItem("admin_token");
      const r = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ settings: s }),
      });
      if (r.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        alert("บันทึกไม่สำเร็จ (HTTP " + r.status + ")");
      }
    } catch (e) {
      alert("เกิดข้อผิดพลาด: " + e);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="container mx-auto px-4 py-8"><p>กำลังโหลด...</p></div>;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">📞 แก้ไขข้อมูลติดต่อ</h1>
          <p className="text-gray-600 text-sm mt-1">ข้อมูลนี้จะแสดงในหน้า "ติดต่อเรา" และส่วนท้ายเว็บ</p>
        </div>
        <a href="/contact" target="_blank" rel="noopener noreferrer" className="btn-secondary text-sm">👁️ ดูหน้าติดต่อเรา</a>
      </div>

      <div className="bg-white rounded-lg shadow p-6 space-y-6">
        <Section title="ข้อมูลร้าน">
          <Field label="ชื่อร้าน" value={s.shop_name} onChange={(v) => update("shop_name", v)} />
          <Field label="สโลแกน/คำบรรยาย" value={s.shop_tagline} onChange={(v) => update("shop_tagline", v)} />
        </Section>

        <Section title="ข้อมูลติดต่อ">
          <Field label="โทรศัพท์ (สำนักงาน)" value={s.contact_phone} onChange={(v) => update("contact_phone", v)} placeholder="02-XXX-XXXX" />
          <Field label="มือถือ" value={s.contact_mobile} onChange={(v) => update("contact_mobile", v)} placeholder="08X-XXX-XXXX" />
          <Field label="อีเมล" value={s.contact_email} onChange={(v) => update("contact_email", v)} type="email" />
          <Field label="LINE ID" value={s.contact_line_id} onChange={(v) => update("contact_line_id", v)} placeholder="@knkpart" />
          <Field label="Facebook (ชื่อเพจ)" value={s.contact_facebook} onChange={(v) => update("contact_facebook", v)} />
        </Section>

        <Section title="ที่อยู่และเวลาทำการ">
          <Field label="ที่อยู่" value={s.contact_address} onChange={(v) => update("contact_address", v)} textarea />
          <Field label="เวลาทำการ" value={s.contact_hours} onChange={(v) => update("contact_hours", v)} placeholder="จันทร์-เสาร์ 8:00-17:00 น." />
          <Field label="Google Maps Embed URL" value={s.contact_map_url} onChange={(v) => update("contact_map_url", v)} placeholder="https://www.google.com/maps/embed?..." />
        </Section>

        <Section title="อื่นๆ">
          <Field label="หมายเหตุการจัดส่ง" value={s.shipping_note} onChange={(v) => update("shipping_note", v)} textarea />
          <Field label="เกี่ยวกับเรา (About)" value={s.about_text} onChange={(v) => update("about_text", v)} textarea rows={5} />
        </Section>

        <div className="flex items-center gap-3 pt-4 border-t">
          <button onClick={handleSave} disabled={saving} className="btn-primary disabled:opacity-50">
            {saving ? "กำลังบันทึก..." : "💾 บันทึก"}
          </button>
          {saved && <span className="text-green-600 text-sm">✓ บันทึกเรียบร้อย</span>}
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-b last:border-b-0 pb-5 last:pb-0">
      <h2 className="font-bold text-lg mb-3 text-primary-800">{title}</h2>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type, textarea, rows }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  textarea?: boolean;
  rows?: number;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {textarea ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={rows || 3} className="input-field resize-y" />
      ) : (
        <input type={type || "text"} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="input-field" />
      )}
    </div>
  );
}