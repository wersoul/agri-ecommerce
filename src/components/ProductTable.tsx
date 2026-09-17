"use client";

import { Product } from "@/lib/types";

interface ProductTableProps {
  products: Product[];
  loading: boolean;
  onEdit: (p: Product) => void;
  onDelete: (id: number) => void;
}

export default function ProductTable({ products, loading, onEdit, onDelete }: ProductTableProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
        กำลังโหลด...
      </div>
    );
  }
  if (products.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
        ยังไม่มีสินค้า
      </div>
    );
  }
  return (
    <div className="bg-white rounded-lg shadow overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="text-left p-3">สินค้า</th>
            <th className="text-left p-3">หมวดหมู่</th>
            <th className="text-right p-3">ราคา</th>
            <th className="text-right p-3">คงเหลือ</th>
            <th className="text-center p-3">สถานะ</th>
            <th className="text-center p-3">จัดการ</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.id} className="border-t hover:bg-gray-50">
              <td className="p-3">
                <div className="flex items-center gap-3">
                  {p.image_url && (
                    <img src={p.image_url} alt="" className="w-12 h-12 object-cover rounded" />
                  )}
                  <div>
                    <p className="font-semibold">{p.name}</p>
                    {p.sku && <p className="text-xs text-gray-500">SKU: {p.sku}</p>}
                  </div>
                </div>
              </td>
              <td className="p-3 text-sm">{p.category_name || "-"}</td>
              <td className="p-3 text-right">฿{p.price.toLocaleString()}</td>
              <td className="p-3 text-right">{p.stock}</td>
              <td className="p-3 text-center">
                {p.is_active ? (
                  <span className="text-green-600 text-sm">✓ เปิดขาย</span>
                ) : (
                  <span className="text-gray-400 text-sm">ปิด</span>
                )}
              </td>
              <td className="p-3 text-center">
                <button
                  onClick={() => onEdit(p)}
                  className="text-primary-600 hover:text-primary-800 text-sm mr-3"
                >
                  แก้ไข
                </button>
                <button
                  onClick={() => onDelete(p.id)}
                  className="text-red-600 hover:text-red-800 text-sm"
                >
                  ลบ
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}