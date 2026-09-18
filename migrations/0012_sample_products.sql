-- =========================================
-- Sample Products (10 รายการ) — สำหรับทดสอบระบบ
-- =========================================
-- ⚠️  ใช้ INSERT OR IGNORE เพื่อไม่ลบ/ทับข้อมูลเดิม
-- รันซ้ำได้

-- Categories (6 หมวดหลัก)
INSERT OR IGNORE INTO categories (id, name, slug, description, image_url) VALUES
  (1, 'อะไหล่เครื่องตัดหญ้า', 'mower-parts', 'อะไหล่เครื่องตัดหญ้าทุกยี่ห้อ', '/images/knkpart/products/mower-parts/mower-parts_0000.jpg'),
  (2, 'อะไหล่เครื่องเลื่อย', 'chainsaw-parts', 'อะไหล่เครื่องเลื่อยโซ่ยนต์', '/images/knkpart/products/chainsaw-parts/chainsaw-parts_0000.jpg'),
  (3, 'อะไหล่ปั๊มน้ำ', 'pump-parts', 'อะไหล่ปั๊มน้ำทุกชนิด', '/images/knkpart/products/pump-parts/pump-parts_0000.jpg'),
  (4, 'อะไหล่เครื่องพ่นยา', 'sprayer-parts', 'อะไหล่เครื่องพ่นยา เครื่องพ่นลม', '/images/knkpart/products/sprayer-parts/sprayer-parts_0000.jpg'),
  (5, 'อะไหล่เครื่องยนต์', 'engine-parts', 'อะไหล่เครื่องยนต์ดีเซล เบนซิน', '/images/knkpart/products/engine-parts/engine-parts_0000.jpg'),
  (6, 'อะไหล่รถไถเดินตาม', 'walking-tractor-parts', 'อะไหล่รถไถเดินตาม', '/images/knkpart/products/walking-tractor-parts/walking-tractor-parts_0000.jpg');

-- Products (10 รายการ)
INSERT OR IGNORE INTO products (id, name, slug, description, price, stock, sku, image_url, category_id, is_active) VALUES
  (101, 'ใบมีดเครื่องตัดหญ้า 3 ฟัน', 'mower-blade-3t', 'ใบมีดเครื่องตัดหญ้า 3 ฟัน ขนาดมาตรฐาน ใช้กับเครื่องตัดหญ้าสะพาย', 250, 50, 'KNK-MW-001', '/images/knkpart/products/mower-parts/mower-parts_0001.jpg', 1, 1),
  (102, 'โซ่เครื่องเลื่อย 14 นิ้ว', 'chainsaw-chain-14', 'โซ่เครื่องเลื่อยคุณภาพสูง ขนาด 14 นิ้ว ใช้กับเครื่องเลื่อยโซ่ยนต์ทั่วไป', 320, 35, 'KNK-CS-001', '/images/knkpart/products/chainsaw-parts/chainsaw-parts_0001.jpg', 2, 1),
  (103, 'บาร์เครื่องเลื่อย 16 นิ้ว', 'chainsaw-bar-16', 'บาร์เครื่องเลื่อย 16 นิ้ว เหล็กคุณภาพสูง ทนทาน', 450, 25, 'KNK-CS-002', '/images/knkpart/products/chainsaw-parts/chainsaw-parts_0002.jpg', 2, 1),
  (104, 'ซีลปั๊มน้ำ ขนาด 1 นิ้ว', 'pump-seal-1in', 'ซีลปั๊มน้ำยางคุณภาพสูง ขนาด 1 นิ้ว ใช้กับปั๊มน้ำทั่วไป', 85, 100, 'KNK-PM-001', '/images/knkpart/products/pump-parts/pump-parts_0001.jpg', 3, 1),
  (105, 'หัวฉีดเครื่องพ่นยา ทองเหลือง', 'sprayer-nozzle-brass', 'หัวฉีดเครื่องพ่นยา วัสดุทองเหลืองคุณภาพสูง ปรับได้ 3 ระดับ', 180, 60, 'KNK-SP-001', '/images/knkpart/products/sprayer-parts/sprayer-parts_0001.jpg', 4, 1),
  (106, 'หัวเทียนเครื่องยนต์ NGK BP6ES', 'spark-plug-ngk', 'หัวเทียน NGK BP6ES ใช้กับเครื่องยนต์เบนซินขนาดเล็ก', 65, 200, 'KNK-EN-001', '/images/knkpart/products/engine-parts/engine-parts_0001.jpg', 5, 1),
  (107, 'ใบมีดรถไถเดินตาม', 'tractor-blade', 'ใบมีดรถไถเดินตาม เหล็กแข็งพิเศษ ทนการสึกหรอ', 380, 20, 'KNK-WT-001', '/images/knkpart/products/walking-tractor-parts/walking-tractor-parts_0001.jpg', 6, 1),
  (108, 'สายคันเร่งเครื่องตัดหญ้า', 'throttle-cable', 'สายคันเร่งเครื่องตัดหญ้า ยาว 1 เมตร ใช้กับเครื่องตัดหญ้าสะพายหลัง', 120, 80, 'KNK-MW-002', '/images/knkpart/products/mower-parts/mower-parts_0002.jpg', 1, 1),
  (109, 'คาร์บูเรเตอร์เครื่องตัดหญ้า', 'mower-carburetor', 'คาร์บูเรเตอร์เครื่องตัดหญ้า พร้อมชุดกรองอากาศ ใช้กับเครื่องยนต์ 2 จังหวะ', 550, 15, 'KNK-MW-003', '/images/knkpart/products/mower-parts/mower-parts_0003.jpg', 1, 1),
  (110, 'ใบพัดปั๊มน้ำ 4 นิ้ว', 'pump-impeller-4in', 'ใบพัดปั๊มน้ำ ขนาด 4 นิ้ว วัสดุทองเหลือง ใช้กับปั๊มหอยโข่ง', 280, 30, 'KNK-PM-002', '/images/knkpart/products/pump-parts/pump-parts_0002.jpg', 3, 1);