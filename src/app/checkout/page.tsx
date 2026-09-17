"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CartItem, Order } from "@/lib/types";
import { getCart, clearCart } from "@/lib/cart";
import CheckoutForm from "@/components/CheckoutForm";
import CheckoutSummary from "@/components/CheckoutSummary";

export default function CheckoutPage() {
  const router = useRouter();
  const [items, setItems] = useState<CartItem[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    customer_name: "",
    customer_phone: "",
    customer_email: "",
    customer_address: "",
    customer_province: "",
    customer_postcode: "",
    note: "",
    extra_info: "",
  });

  useEffect(() => {
    setItems(getCart());
    // Auto-fill from logged-in customer
    (async () => {
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("customer_token") : null;
        if (!token) return;
        const r = await fetch("/api/customer/me", { headers: { Authorization: `Bearer ${token}` } });
        if (!r.ok) return;
        const data = await r.json();
        setForm(prev => ({
          ...prev,
          customer_name: data.customer.full_name || prev.customer_name,
          customer_email: data.customer.email || prev.customer_email,
          customer_phone: data.customer.phone || prev.customer_phone,
          customer_address: data.customer.address || prev.customer_address,
          customer_province: data.customer.province || prev.customer_province,
          customer_postcode: data.customer.postcode || prev.customer_postcode,
        }));
      } catch {}
    })();
  }, []);

  const subtotal = items.reduce(
    (sum, i) => sum + i.product.price * i.quantity,
    0
  );
  const shipping = subtotal >= 1000 || subtotal === 0 ? 0 : 50;
  const total = subtotal + shipping;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const order: Order = {
        ...form,
        subtotal,
        shipping,
        total,
        items: items.map((i) => ({
          product_id: i.product.id,
          product_name: i.product.name,
          product_price: i.product.price,
          quantity: i.quantity,
          subtotal: i.product.price * i.quantity,
        })),
      };
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(order),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "เกิดข้อผิดพลาด");
      clearCart();
      window.dispatchEvent(new Event("cart-updated"));
      router.push(`/checkout/success?order=${data.order_number}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (items.length === 0) {
    return <div className="container mx-auto p-8 text-center">ไม่มีสินค้าในตะกร้า</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">📋 ชำระเงิน</h1>
      <form onSubmit={handleSubmit}>
        <div className="grid md:grid-cols-2 gap-6">
          <CheckoutForm form={form} setForm={setForm} />
          <CheckoutSummary items={items} subtotal={subtotal} shipping={shipping} total={total} error={error} submitting={submitting} />
        </div>
      </form>
    </div>
  );
}