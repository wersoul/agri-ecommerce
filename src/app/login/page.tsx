"use client";

import { useState } from "react";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const r = await fetch("/api/customer/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await r.json();
      if (!r.ok || !data.ok) throw new Error(data.error || "เข้าสู่ระบบไม่สำเร็จ");
      // Also store in localStorage for client-side use
      try { localStorage.setItem("customer_token", data.token); localStorage.setItem("customer", JSON.stringify(data.customer)); } catch {}
      // แจ้ง component อื่นๆ (Navbar, Cart) ว่า auth เปลี่ยนแล้ว
      try { window.dispatchEvent(new Event("customer-auth-changed")); } catch {}
      // ใช้ window.location.href เพื่อ force full page reload
      // ให้ state ทั้งหมด (Navbar, Cart, Account, etc.) refresh จาก localStorage ใหม่ทันที
      // router.push() อย่างเดียวอาจไม่ trigger useEffect ใหม่ในทุก component
      window.location.href = "/account";
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-green-50 py-12 px-4">
      <div className="max-w-md mx-auto bg-white rounded-2xl shadow-lg p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">🔐 เข้าสู่ระบบ</h1>
        <p className="text-gray-600 text-sm mb-6">KNK Part - ร้านอะไหล่เกษตร</p>

        {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">{error}</div>}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">อีเมล</label>
            <input type="email" required value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              placeholder="you@example.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">รหัสผ่าน</label>
            <input type="password" required value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
          </div>
          <button type="submit" disabled={loading}
            className="w-full py-3 bg-primary-700 text-white font-semibold rounded-lg hover:bg-primary-800 disabled:opacity-50">
            {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
          </button>
          <div className="flex justify-between text-sm">
            <Link href="/register" className="text-primary-700 hover:underline font-medium">สมัครสมาชิก</Link>
            <Link href="/forgot-password" className="text-gray-600 hover:underline">ลืมรหัสผ่าน?</Link>
          </div>
        </form>
      </div>
    </div>
  );
}