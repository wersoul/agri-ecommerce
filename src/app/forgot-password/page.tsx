"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<"request" | "reset">("request");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [devOtp, setDevOtp] = useState("");

  async function handleRequest(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(""); setMessage("");
    try {
      const r = await fetch("/api/customer/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await r.json();
      if (!r.ok || !data.ok) throw new Error(data.error || "ส่ง OTP ไม่สำเร็จ");
      setMessage(data.message || "ส่งรหัส OTP แล้ว");
      if (data.dev_otp) setDevOtp(data.dev_otp);
      setStep("reset");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password.length < 6) { setError("รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร"); return; }
    if (password !== confirmPassword) { setError("รหัสผ่านไม่ตรงกัน"); return; }
    setLoading(true);
    try {
      const r = await fetch("/api/customer/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, password }),
      });
      const data = await r.json();
      if (!r.ok || !data.ok) throw new Error(data.error || "รีเซ็ตไม่สำเร็จ");
      setMessage("รีเซ็ตรหัสผ่านเรียบร้อย!");
      setTimeout(() => router.push("/login"), 2000);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-green-50 py-12 px-4">
      <div className="max-w-md mx-auto bg-white rounded-2xl shadow-lg p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">🔑 ลืมรหัสผ่าน</h1>
        <p className="text-gray-600 text-sm mb-6">KNK Part - ร้านอะไหล่เกษตร</p>

        {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">{error}</div>}
        {message && <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg">{message}</div>}

        {step === "request" && (
          <form onSubmit={handleRequest} className="space-y-4">
            <p className="text-sm text-gray-600">กรอกอีเมลของคุณ เราจะส่งรหัส OTP</p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">อีเมล</label>
              <input type="email" required value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                placeholder="you@example.com" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-3 bg-primary-700 text-white font-semibold rounded-lg hover:bg-primary-800 disabled:opacity-50">
              {loading ? "กำลังส่ง OTP..." : "ส่งรหัส OTP"}
            </button>
            <p className="text-center text-sm text-gray-600">
              <Link href="/login" className="text-primary-700 hover:underline font-medium">← กลับไปเข้าสู่ระบบ</Link>
            </p>
          </form>
        )}

        {step === "reset" && (
          <form onSubmit={handleReset} className="space-y-4">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
              ✉️ ส่งรหัส OTP ไปยัง <strong>{email}</strong> แล้ว
              {devOtp && <div className="mt-2 font-mono">🔧 DEV MODE OTP: <strong>{devOtp}</strong></div>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">รหัส OTP 6 หลัก</label>
              <input type="text" required maxLength={6} pattern="[0-9]{6}" value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-center text-2xl tracking-widest font-mono focus:ring-2 focus:ring-primary-500"
                placeholder="000000" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">รหัสผ่านใหม่</label>
              <input type="password" required minLength={6} value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                placeholder="อย่างน้อย 6 ตัวอักษร" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ยืนยันรหัสผ่านใหม่</label>
              <input type="password" required minLength={6} value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-3 bg-primary-700 text-white font-semibold rounded-lg hover:bg-primary-800 disabled:opacity-50">
              {loading ? "กำลังรีเซ็ต..." : "รีเซ็ตรหัสผ่าน"}
            </button>
            <button type="button" onClick={() => setStep("request")}
              className="w-full text-sm text-gray-600 hover:text-gray-800">
              ← เปลี่ยนอีเมล
            </button>
          </form>
        )}
      </div>
    </div>
  );
}