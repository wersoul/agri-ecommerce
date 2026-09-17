-- =========================================
-- Subcategories (ประเภทย่อย)
-- =========================================

CREATE TABLE IF NOT EXISTS subcategories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
    UNIQUE (category_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_subcategories_category ON subcategories(category_id);
CREATE INDEX IF NOT EXISTS idx_subcategories_slug ON subcategories(slug);

-- Add subcategory_id to products (nullable; existing products keep NULL)
ALTER TABLE products ADD COLUMN subcategory_id INTEGER REFERENCES subcategories(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_products_subcategory ON products(subcategory_id);