"use client";

import { Category } from "@/lib/types";

interface CategoryTableProps {
  categories: Category[];
  loading: boolean;
  onEdit: (c: Category) => void;
  onDelete: (id: number) => void;
}

export default function CategoryTable({ categories, loading, onEdit, onDelete }: CategoryTableProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
        กำลังโหลด...
      </div>
    );
  }
  if (categories.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
        ยังไม่มีหมวดหมู่
      </div>
    );
  }
  return (
    <div className="bg-white rounded-lg shadow overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="text-left p-3">ชื่อหมวดหมู่</th>
            <th className="text-left p-3">Slug</th>
            <th className="text-left p-3">คำอธิบาย</th>
            <th className="text-center p-3">จัดการ</th>
          </tr>
        </thead>
        <tbody>
          {categories.map((c) => (
            <tr key={c.id} className="border-t hover:bg-gray-50">
              <td className="p-3 font-semibold">{c.name}</td>
              <td className="p-3 text-sm text-gray-600">{c.slug}</td>
              <td className="p-3 text-sm text-gray-600">{c.description || "-"}</td>
              <td className="p-3 text-center">
                <button
                  onClick={() => onEdit(c)}
                  className="text-primary-600 hover:text-primary-800 text-sm mr-3"
                >
                  แก้ไข
                </button>
                <button
                  onClick={() => onDelete(c.id)}
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