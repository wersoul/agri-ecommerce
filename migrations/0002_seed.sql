-- =========================================
-- Seed Data for Agri E-Commerce
-- ตัวอย่างสินค้าและหมวดหมู่ (ไม่รวม admin - สร้างด้วย API แทน)
-- =========================================

-- หมวดหมู่สินค้า
INSERT OR IGNORE INTO categories (name, slug, description, image_url) VALUES
('อะไหล่รถไถ', 'tractor-parts', 'อะไหล่และชิ้นส่วนรถไถนา', 'https://images.unsplash.com/photo-1605338803155-8d7c0e8b5e0e?w=400'),
('อะไหล่เครื่องตัดหญ้า', 'mower-parts', 'อะไหล่เครื่องตัดหญ้าและอุปกรณ์', 'https://images.unsplash.com/photo-1599839575945-a9e118af4981?w=400'),
('อุปกรณ์ให้น้ำ', 'irrigation', 'ระบบน้ำและอุปกรณ์ให้น้ำพืช', 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400'),
('ปุ๋ยและยา', 'fertilizer', 'ปุ๋ย ยาฆ่าแมลง สารเคมีการเกษตร', 'https://images.unsplash.com/photo-1592982537447-7440770faae5?w=400'),
('เมล็ดพันธุ์', 'seeds', 'เมล็ดพันธุ์พืชและผัก', 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=400'),
('เครื่องมือเกษตร', 'tools', 'เครื่องมือทำสวน เครื่องมือเกษตร', 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400');

-- สินค้าตัวอย่าง
INSERT OR IGNORE INTO products (name, slug, description, price, stock, sku, image_url, category_id, is_active) VALUES
('กรองน้ำมันเครื่องรถไถ', 'tractor-oil-filter-001', 'กรองน้ำมันเครื่องสำหรับรถไถนา ขนาดมาตรฐาน ใช้ได้กับรถไถทั่วไป', 350, 50, 'TP-001', 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=400', 1, 1),
('สายพานรถไถ', 'tractor-belt-002', 'สายพานพร้อมใช้สำหรับรถไถ ขนาดมาตรฐาน', 850, 30, 'TP-002', 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400', 1, 1),
('หัวเทียนรถไถ', 'tractor-spark-plug-003', 'หัวเทียนคุณภาพสูง ใช้ได้นาน', 120, 100, 'TP-003', 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=400', 1, 1),
('ใบมีดเครื่องตัดหญ้า', 'mower-blade-001', 'ใบมีดเหล็กคุณภาพสูง ทนทาน คมกริบ', 280, 80, 'MP-001', 'https://images.unsplash.com/photo-1599839575945-a9e118af4981?w=400', 2, 1),
('สายเอ็นตัดหญ้า', 'mower-string-002', 'สายเอ็นไนล่อนสำหรับเครื่องตัดหญ้า', 150, 200, 'MP-002', 'https://images.unsplash.com/photo-1589923188900-85dae523342b?w=400', 2, 1),
('หัวฉีดน้ำมัน', 'mower-carburetor-003', 'หัวฉีดคาร์บูเรเตอร์เครื่องตัดหญ้า', 450, 40, 'MP-003', 'https://images.unsplash.com/photo-1530124566582-a618bc2615dc?w=400', 2, 1),
('สายยางให้น้ำ 20 เมตร', 'hose-20m-001', 'สายยาง PVC ขนาด 1/2 นิ้ว ยาว 20 เมตร', 590, 60, 'IR-001', 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400', 3, 1),
('หัวฉีดน้ำปรับได้', 'sprinkler-002', 'หัวฉีดน้ำปรับได้ 7 ระดับ', 180, 120, 'IR-002', 'https://images.unsplash.com/photo-1573165850883-9b0e18c44bd2?w=400', 3, 1),
('ปั๊มน้ำ submersible', 'pump-003', 'ปั๊มน้ำแบบจม 1 นิ้ว ใช้กับบ่อน้ำตื้น', 3500, 15, 'IR-003', 'https://images.unsplash.com/photo-1581094288338-2314dddb7ece?w=400', 3, 1),
('ปุ๋ยสูตร 15-15-15 (1 กก.)', 'fertilizer-001', 'ปุ๋ยเคมีสูตร 15-15-15 บรรจุ 1 กิโลกรัม', 65, 500, 'FT-001', 'https://images.unsplash.com/photo-1592982537447-7440770faae5?w=400', 4, 1),
('ยาฆ่าหญ้า 1 ลิตร', 'herbicide-002', 'ยาฆ่าหญ้าใบกว้าง ขนาด 1 ลิตร', 280, 80, 'FT-002', 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=400', 4, 1),
('เมล็ดพันธุ์ข้าวหอมมะลิ', 'rice-seed-001', 'เมล็ดพันธุ์ข้าวหอมมะลิ 105 คุณภาพสูง', 120, 200, 'SD-001', 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=400', 5, 1),
('เมล็ดผักบุ้ง', 'morning-glory-seed-002', 'เมล็ดพันธุ์ผักบุ้ง ซองละ 50 กรัม', 45, 300, 'SD-002', 'https://images.unsplash.com/photo-1574316071802-0d684efa7bf5?w=400', 5, 1),
('จอบสั้น', 'hoe-short-001', 'จอบสั้นพร้อมด้าม ขนาด 1.2 เมตร', 220, 80, 'TL-001', 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400', 6, 1),
('เสียม', 'shovel-002', 'เสียมพร้อมด้ามไม้ คุณภาพดี', 350, 60, 'TL-002', 'https://images.unsplash.com/photo-1589923188900-85dae523342b?w=400', 6, 1),
('กรรไกรตัดกิ่ง', 'pruner-003', 'กรรไกรตัดกิ่งไม้ ใบมีดคม', 280, 70, 'TL-003', 'https://images.unsplash.com/photo-1599839575945-a9e118af4981?w=400', 6, 1);