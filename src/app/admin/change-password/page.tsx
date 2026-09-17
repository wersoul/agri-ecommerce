"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AdminChangePasswordPage() {
  const router = useRouter();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!current || !next || !confirm) {
      setError("กรุณากรอกข้อมูลให้ครบทุกช่อง");
      return;
    }
    if (next.length < 6) {
      setError("รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร");
      return;
    }
    if (next !== confirm) {
      setError("รหัสผ่านใหม่และยืนยันรหัสผ่านไม่ตรงกัน");
      return;
    }
    if (current === next) {
      setError("รหัสผ่านใหม่ต้องแตกต่างจากรหัสผ่านเดิม");
      return;
    }

    const token = (() => {
      try { return localStorage.getItem("admin_token") || ""; } catch { return ""; }
    })();
    if (!token) {
      router.push("/admin/login");
      return;
    }

    setSubmitting(true);
    try {
      const r = await fetch("/api/admin/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          current_password: current,
          new_password: next,
        }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "เปลี่ยนรหัสผ่านไม่สำเร็จ");
      setMessage("เปลี่ยนรหัสผ่านเรียบร้อยแล้ว");
      setCurrent("");
      setNext("");
      setConfirm("");
    } catch (e: any) {
      setError(e.message || "เปลี่ยนรหัสผ่านไม่สำเร็จ");
    } finally {
      setSubmitting(false);
    }
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
              🔑
            </div>
            <h1 className="text-xl font-bold text-gray-800">เปลี่ยนรหัสผ่าน (ผู้ดูแล)</h1>
          </div>
          <p className="text-sm text-gray-500 mb-6">
            เปลี่ยนรหัสผ่านบัญชีผู้ดูแลระบบ ต้องกรอกรหัสเดิมเพื่อยืนยันตัวตน
          </p>

          {message && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-800 text-sm rounded-lg">
              {message}
            </div>
          )}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-800 text-sm rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                รหัสผ่านเดิม
              </label>
              <input
                type="password"
                value={current}
                onChange={(e) => setCurrent(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="••••••••"
                autoComplete="current-password"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                รหัสผ่านใหม่
              </label>
              <input
                type="password"
                value={next}
                onChange={(e) => setNext(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="อย่างน้อย 6 ตัวอักษร"
                autoComplete="new-password"
                minLength={6}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ยืนยันรหัสผ่านใหม่
              </label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="กรอกรหัสผ่านใหม่อีกครั้ง"
                autoComplete="new-password"
                minLength={6}
                required
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-primary-700 text-white font-medium rounded-lg hover:bg-primary-800 disabled:opacity-50 transition"
            >
              {submitting ? "กำลังเปลี่ยน..." : "เปลี่ยนรหัสผ่าน"}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-gray-100 text-xs text-gray-400 text-center">
            หากลืมรหัสผ่านเดิม กรุณาติดต่อผู้ดูแลระบบสูงสุด
          </div>
        </div>
      </div>
    </div>
  );
}