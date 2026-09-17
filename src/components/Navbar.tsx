"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getCart } from "@/lib/cart";

export default function Navbar() {
  const router = useRouter();
  const [itemCount, setItemCount] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const update = () => {
      const cart = getCart();
      setItemCount(cart.reduce((sum, i) => sum + i.quantity, 0));
    };
    const checkAuth = () => {
      try { setIsLoggedIn(!!localStorage.getItem("customer_token")); } catch { setIsLoggedIn(false); }
    };
    update();
    checkAuth();
    window.addEventListener("storage", update);
    window.addEventListener("cart-updated", update);
    window.addEventListener("customer-auth-changed", checkAuth);
    return () => {
      window.removeEventListener("storage", update);
      window.removeEventListener("cart-updated", update);
      window.removeEventListener("customer-auth-changed", checkAuth);
    };
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener("mousedown", onClick);
      return () => document.removeEventListener("mousedown", onClick);
    }
  }, [menuOpen]);

  function handleLogout() {
    try { localStorage.removeItem("customer_token"); localStorage.removeItem("customer"); } catch {}
    window.dispatchEvent(new Event("customer-auth-changed"));
    setMenuOpen(false);
    router.push("/");
  }

  return (
    <nav className="bg-gradient-to-r from-primary-700 to-primary-900 text-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-3 font-bold text-xl">
            <img
              src="/images/knkpart/knk.png"
              alt="KNK Part - อะไหล่เกษตร อะไหล่เครื่องมือ เครื่องมือเกษตร"
              className="h-9 w-auto bg-white rounded px-2 py-1"
            />
            <div className="flex flex-col leading-tight">
              <span className="text-lg">KNK Part</span>
              <span className="text-xs text-primary-200 font-normal">เคเอ็นเค พาร์ท - อะไหล่เกษตร</span>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-6 text-sm">
            <Link href="/" className="hover:text-primary-200 transition">
              หน้าแรก
            </Link>
            <Link href="/products" className="hover:text-primary-200 transition">
              สินค้าทั้งหมด
            </Link>
            <Link
              href="/products?category=grass-cutter-parts"
              className="hover:text-primary-200 transition"
            >
              อะไหล่ตัดหญ้า
            </Link>
            <Link
              href="/products?category=engine-parts"
              className="hover:text-primary-200 transition"
            >
              เครื่องยนต์
            </Link>
            <Link
              href="/products?category=condensor"
              className="hover:text-primary-200 transition"
            >
              คอนเดนเซอร์
            </Link>
            <Link
              href="/contact"
              className="hover:text-primary-200 transition"
            >
              ติดต่อเรา
            </Link>
            {isLoggedIn ? (
              <div ref={menuRef} className="relative">
                <button
                  type="button"
                  onClick={() => setMenuOpen((v) => !v)}
                  className="flex items-center gap-1 hover:text-primary-200 transition"
                  aria-haspopup="true"
                  aria-expanded={menuOpen}
                >
                  <span>👤 บัญชี</span>
                  <span className="text-xs">▾</span>
                </button>
                {menuOpen && (
                  <div
                    role="menu"
                    className="absolute right-0 top-full mt-2 w-56 bg-white text-gray-800 rounded-lg shadow-lg py-1 ring-1 ring-black/5"
                  >
                    <Link href="/account" onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-sm hover:bg-gray-50">บัญชีของฉัน</Link>
                    <Link href="/account/orders" onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-sm hover:bg-gray-50">ประวัติการสั่งซื้อ</Link>
                    <Link href="/account/change-password" onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-sm hover:bg-gray-50">🔑 เปลี่ยนรหัสผ่าน</Link>
                    <div className="my-1 border-t border-gray-100" />
                    <button type="button" onClick={handleLogout} className="w-full text-left block px-4 py-2 text-sm text-red-600 hover:bg-red-50">ออกจากระบบ</button>
                  </div>
                )}
              </div>
            ) : (
              <Link href="/login" className="hover:text-primary-200 transition">🔐 เข้าสู่ระบบ</Link>
            )}
            <Link
              href="/cart"
              className="relative hover:text-primary-200 transition"
            >
              🛒 ตะกร้า
              {itemCount > 0 && (
                <span className="absolute -top-2 -right-3 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </Link>
          </div>

          <button
            className="md:hidden text-2xl"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="menu"
          >
            ☰
          </button>
        </div>

        {mobileOpen && (
          <div className="md:hidden pb-3 flex flex-col gap-2">
            <Link href="/" className="block py-1">
              หน้าแรก
            </Link>
            <Link href="/products" className="block py-1">
              สินค้าทั้งหมด
            </Link>
            <Link href="/cart" className="block py-1">
              🛒 ตะกร้า ({itemCount})
            </Link>
            <Link href="/contact" className="block py-1">
              ติดต่อเรา
            </Link>
            {isLoggedIn ? (
              <>
                <Link href="/account" className="block py-1">👤 บัญชีของฉัน</Link>
                <Link href="/account/orders" className="block py-1">📦 ประวัติการสั่งซื้อ</Link>
                <Link href="/account/change-password" className="block py-1">🔑 เปลี่ยนรหัสผ่าน</Link>
                <button type="button" onClick={handleLogout} className="block py-1 text-left text-red-300">ออกจากระบบ</button>
              </>
            ) : (
              <Link href="/login" className="block py-1">🔐 เข้าสู่ระบบ</Link>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}