-- =========================================
-- Member extra fields + order extra info
-- =========================================
-- เพิ่ม fields สำหรับสมาชิก: บริษัท / เลขประจำตัวผู้เสียภาษี / ข้อมูลเพิ่มเติม
-- ใช้ IF NOT EXISTS-safe idempotent (D1 supports ALTER TABLE ADD COLUMN แบบไม่ error ซ้ำ)
-- แต่ SQLite ไม่รองรับ IF NOT EXISTS ใน ADD COLUMN โดยตรง — ใช้วิธีตรวจ pragma ผ่าน dynamic SQL ไม่ได้
-- ดังนั้นใช้ script shell ตรวจก่อน run แทน (ดู migrations/apply_step_0011.sh)
ALTER TABLE customers ADD COLUMN company TEXT;
ALTER TABLE customers ADD COLUMN tax_id TEXT;
ALTER TABLE customers ADD COLUMN extra_info TEXT;
-- เพิ่ม field สำหรับคำสั่งซื้อ: ข้อมูลเพิ่มเติมที่ลูกค้ากรอกตอน checkout
ALTER TABLE orders ADD COLUMN extra_info TEXT;