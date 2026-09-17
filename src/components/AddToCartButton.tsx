"use client";

import { useState } from "react";
import { Product } from "@/lib/types";
import { addToCart } from "@/lib/cart";

export default function AddToCartButton({ product }: { product: Product }) {
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    addToCart(product, quantity);
    setAdded(true);
    window.dispatchEvent(new Event("cart-updated"));
    setTimeout(() => setAdded(false), 2000);
  };

  if (product.stock <= 0) {
    return (
      <button disabled className="btn-secondary w-full">
        สินค้าหมด
      </button>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <span className="font-semibold">จำนวน:</span>
        <button
          onClick={() => setQuantity(Math.max(1, quantity - 1))}
          className="w-10 h-10 bg-gray-200 rounded-md hover:bg-gray-300"
        >
          -
        </button>
        <input
          type="number"
          value={quantity}
          onChange={(e) =>
            setQuantity(
              Math.max(1, Math.min(product.stock, parseInt(e.target.value) || 1))
            )
          }
          className="w-20 text-center input-field"
          min="1"
          max={product.stock}
        />
        <button
          onClick={() =>
            setQuantity(Math.min(product.stock, quantity + 1))
          }
          className="w-10 h-10 bg-gray-200 rounded-md hover:bg-gray-300"
        >
          +
        </button>
      </div>

      <button onClick={handleAdd} className="btn-primary w-full text-lg py-3">
        {added ? "✓ เพิ่มลงตะกร้าแล้ว" : "🛒 เพิ่มลงตะกร้า"}
      </button>
    </div>
  );
}