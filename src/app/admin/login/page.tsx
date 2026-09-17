"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "เข้าสู่ระบบไม่สำเร็จ");
      localStorage.setItem("admin_token", data.token);
      router.push("/admin");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-2xl font-bold mb-2 text-center">🔐 เข้าสู่ระบบหลังบ้าน</h1>
        <p className="text-gray-600 text-center text-sm mb-6">
          สำหรับผู้ดูแลระบบ AgriParts
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">ชื่อผู้ใช้</label>
            <input
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="input-field"
              autoComplete="username"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">รหัสผ่าน</label>
            <input
              required
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded text-sm">
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full py-3">
            {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
          </button>
        </form>

        <p className="text-xs text-gray-500 mt-4 text-center">
          Default: <code>admin</code> / <code>admin123</code>
        </p>

        <div className="mt-4 text-center">
          <Link href="/" className="text-primary-600 text-sm">
            ← กลับหน้าแรก
          </Link>
        </div>
      </div>
    </div>
  );
}