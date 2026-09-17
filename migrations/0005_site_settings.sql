-- =========================================
-- Site Settings Table for editable "ติดต่อเรา" (Contact Us)
-- =========================================

CREATE TABLE IF NOT EXISTS site_settings (
    key TEXT PRIMARY KEY,
    value TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Seed default values (will be replaced by admin UI)
INSERT OR IGNORE INTO site_settings (key, value) VALUES
    ('shop_name', 'KNK Part'),
    ('shop_tagline', 'เคเอ็นเค พาร์ท - อะไหล่เกษตร อะไหล่เครื่องมือ เครื่องมือเกษตร'),
    ('contact_phone', '02-XXX-XXXX'),
    ('contact_mobile', '08X-XXX-XXXX'),
    ('contact_email', 'contact@knkpart.com'),
    ('contact_line_id', '@knkpart'),
    ('contact_facebook', 'KNK Part'),
    ('contact_address', '123/4 หมู่ 5 ตำบลXXX อำเภอXXX จังหวัดXXX 10000'),
    ('contact_hours', 'จันทร์-เสาร์ 8:00-17:00 น.'),
    ('contact_map_url', ''),
    ('shipping_note', 'จัดส่งทั่วประเทศ ค่าจัดส่งตามจริง'),
    ('about_text', 'KNK Part ร้านขายอะไหล่เกษตร อะไหล่เครื่องมือ เครื่องมือเกษตรครบวงจร ดำเนินธุรกิจด้านอะไหล่เกษตรมาอย่างยาวนาน คัดสรรแต่อะไหล่เครื่องมือเกษตรคุณภาพดี ราคาเป็นกันเอง');