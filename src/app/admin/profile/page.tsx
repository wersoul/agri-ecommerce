"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface AdminProfile {
  id: number;
  username: string;
  email: string;
  created_at: string;
}

export default function AdminProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const token = (() => {
      try { return localStorage.getItem("admin_token") || ""; } catch { return ""; }
    })();
    if (!token) { router.push("/admin/login"); return; }

    fetch("/api/admin/me/", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.ok ? r.json() : Promise.reject(r.status))
      .then((d) => {
        if (d.admin) {
          setProfile(d.admin);
          setEmail(d.admin.email || "");
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [router]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setMessage("");

    // Validate email format client-side (allow empty = clear)
    const trimmed = email.trim();
    if (trimmed && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError("รูปแบบอีเมลไม่ถูกต้อง");
      return;
    }

    const token = (() => {
      try { return localStorage.getItem("admin_token") || ""; } catch { return ""; }
    })();
    if (!token) { router.push("/admin/login"); return; }

    setSaving(true);
    try {
      const r = await fetch("/api/admin/me/", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ email: trimmed }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error || "บันทึกไม่สำเร็จ");
      setProfile((p) => p ? { ...p, email: trimmed } : p);
      setMessage("✅ บันทึกอีเมลเรียบร้อย");
    } catch (e: any) {
      setError(e.message || "บันทึกไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-xl shadow-sm p-8 text-center text-gray-500">
            กำลังโหลด...
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-xl shadow-sm p-8 text-center text-red-600">
            ไม่สามารถโหลดข้อมูลผู้ดูแลได้
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-md mx-auto">
        <div className="mb-4">
          <Link href="/admin" className="text-sm text-primary-700 hover:underline">
            ← กลับไปหน้าหลักบ้าน
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-xl">
              👤
            </div>
            <h1 className="text-xl font-bold text-gray-800">ข้อมูลส่วนตัว (ผู้ดูแล)</h1>
          </div>
          <p className="text-sm text-gray-500 mb-6">
            แก้ไขอีเมลที่จะใช้รับแจ้งเตือนเมื่อมีคำสั่งซื้อใหม่เข้ามา
          </p>

          {message && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-800 text-sm rounded-lg">
              {message}
            </div>
          )}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ชื่อผู้ใช้ (Username)
              </label>
              <input
                type="text"
                value={profile.username}
                disabled
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                อีเมลแจ้งเตือนคำสั่งซื้อใหม่
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                autoComplete="email"
              />
              <p className="text-xs text-gray-500 mt-1">
                ทุกครั้งที่มีลูกค้าสั่งซื้อ ระบบจะส่งอีเมลแจ้งรายละเอียดคำสั่งซื้อมาที่อีเมลนี้
                (เว้นว่างได้หากไม่ต้องการรับแจ้งเตือน)
              </p>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-3 bg-primary-700 text-white font-medium rounded-lg hover:bg-primary-800 disabled:opacity-50 transition"
            >
              {saving ? "กำลังบันทึก..." : "💾 บันทึกอีเมล"}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-gray-100 text-xs text-gray-400 text-center">
            บัญชีนี้ถูกสร้างเมื่อ {new Date(profile.created_at).toLocaleString("th-TH")}
          </div>
        </div>
      </div>
    </div>
  );
}