"use client";

import { useRef, useState } from "react";

interface ImageUploadFieldProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  required?: boolean;
  className?: string;
}

/**
 * Reusable image upload field.
 * - Shows preview if `value` is set (URL or data URL).
 * - Clicking the preview opens file picker.
 * - Uploads to R2 via /api/admin/upload/ and returns the public URL.
 */
export default function ImageUploadField({
  value,
  onChange,
  label = "รูปภาพ",
  required = false,
  className = "",
}: ImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) {
      setError("กรุณาเลือกไฟล์รูปภาพ");
      return;
    }
    setError(null);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const token = localStorage.getItem("admin_token");
      const res = await fetch("/api/admin/upload/", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error || "อัปโหลดไม่สำเร็จ");
      onChange(data.url);
    } catch (e: any) {
      setError(e.message || "อัปโหลดไม่สำเร็จ");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className={className}>
      <label className="block text-sm font-medium mb-1">
        {label} {required && "*"}
      </label>
      <div className="flex items-start gap-3">
        <div className="w-24 h-24 flex-shrink-0 bg-gray-100 border border-gray-200 rounded overflow-hidden flex items-center justify-center">
          {uploading ? (
            <div className="text-xs text-gray-500 animate-pulse">กำลังอัปโหลด...</div>
          ) : value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={value}
              alt="preview"
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          ) : (
            <div className="text-2xl text-gray-400">🖼️</div>
          )}
        </div>
        <div className="flex-1 space-y-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
          />
          <div className="flex gap-2 flex-wrap">
            <button
              type="button"
              disabled={uploading}
              onClick={() => inputRef.current?.click()}
              className="btn-secondary text-sm disabled:opacity-50"
            >
              {value ? "🔄 เปลี่ยนรูป" : "📁 อัปโหลดรูป"}
            </button>
            {value && (
              <button
                type="button"
                disabled={uploading}
                onClick={() => onChange("")}
                className="text-sm px-3 py-1 text-red-600 hover:text-red-800 disabled:opacity-50"
              >
                ลบรูป
              </button>
            )}
          </div>
          <input
            type="url"
            value={value?.startsWith("data:") ? "" : value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="หรือวาง URL รูป (https://...)"
            className="input-field text-sm"
          />
          {error && <p className="text-xs text-red-600">{error}</p>}
          {value && !error && (
            <p className="text-xs text-gray-500 truncate">📎 {value}</p>
            )}
        </div>
      </div>
    </div>
  );
}