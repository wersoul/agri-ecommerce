-- =========================================
-- Site Settings Table for editable "ติดต่อเรา" (Contact Us)
-- =========================================

CREATE TABLE IF NOT EXISTS site_settings (
    key TEXT PRIMARY KEY,
    value TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Seed default values (Production - CLEARED, ผู้ดูแลตั้งค่าผ่าน Admin UI)
INSERT OR IGNORE INTO site_settings (key, value) VALUES
    ('shop_name', 'KNK Part'),
    ('shop_tagline', 'อะไหล่เกษตร อะไหล่เครื่องมือ เครื่องมือเกษตร'),
    ('contact_phone', ''),
    ('contact_mobile', ''),
    ('contact_email', ''),
    ('contact_line_id', ''),
    ('contact_facebook', ''),
    ('contact_address', ''),
    ('contact_hours', ''),
    ('contact_map_url', ''),
    ('shipping_note', 'จัดส่งทั่วประเทศ ค่าจัดส่งตามจริง'),
    ('about_text', '');