-- =========================================
-- KNK Part: Fix product images to use ASCII-safe filenames
-- =========================================
UPDATE products SET image_url = '/images/knkpart/banners/15-PP-INT-Main-Banner.jpg' WHERE image_url LIKE '%ชุดสปริงปั๊มชัก%';
UPDATE products SET image_url = '/images/knkpart/banners/15-PP-INT-Main-Banner.jpg' WHERE image_url LIKE '%ยางลูกสูบปั๊มชัก%';
UPDATE products SET image_url = '/images/knkpart/banners/15-PP-INT-Main-Banner.jpg' WHERE image_url LIKE '%ลิ้นยางปั๊มชัก%';
UPDATE products SET image_url = '/images/knkpart/banners/15-PP-INT-Main-Banner.jpg' WHERE image_url LIKE '%ลูกสูบหนังโยก%';
UPDATE products SET image_url = '/images/knkpart/slides/slide1.jpg' WHERE image_url LIKE '%ก็อกถ่ายน้ำ%' OR image_url LIKE '%ก๊อกถ่ายน้ำ%';
UPDATE products SET image_url = '/images/knkpart/slides/slide1.jpg' WHERE image_url LIKE '%ตลับเร่ง PVC%';
UPDATE products SET image_url = '/images/knkpart/slides/slide1.jpg' WHERE image_url LIKE '%โอลิงชุด%';
UPDATE products SET image_url = '/images/knkpart/slides/slide2.jpg' WHERE image_url LIKE '%เพรสเชอร์%' OR image_url LIKE '%เพรสเซอร์%';
UPDATE products SET image_url = '/images/knkpart/slides/slide3.jpg' WHERE image_url LIKE '%โอเวอร์โหลด%';