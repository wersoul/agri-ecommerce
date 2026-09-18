-- 0013_cleanup_empty_skus.sql
-- แปลง SKU ที่เป็น empty string ('') ให้เป็น NULL เพื่อหลีกเลี่ยง UNIQUE constraint violation
-- (SQLite ถือว่า '' = '' ผิด UNIQUE constraint ที่กำหนดไว้ใน products.sku)
--
-- ปลอดภัย — ใช้ WHERE sku = '' AND ... เพื่อไม่กระทบแถวที่มี SKU จริง
-- หลังรัน migration นี้แล้ว admin products PUT/POST endpoint จะเก็บ SKU ว่างเป็น NULL ด้วย
-- (ดู src/app/api/admin/products/route.ts และ src/app/api/admin/products/[id]/route.ts)

UPDATE products SET sku = NULL WHERE sku IS NOT NULL AND TRIM(sku) = '';