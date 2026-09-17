-- =========================================
-- Customers (Members) & OTP system
-- =========================================

CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT,
    full_name TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    province TEXT,
    postcode TEXT,
    is_verified INTEGER NOT NULL DEFAULT 0,
    is_active INTEGER NOT NULL DEFAULT 1,
    last_login DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);

-- OTP for registration verification & password reset
CREATE TABLE IF NOT EXISTS customer_otps (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL,
    code TEXT NOT NULL,
    purpose TEXT NOT NULL DEFAULT 'register', -- 'register' | 'reset_password'
    expires_at DATETIME NOT NULL,
    used INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_otps_email_purpose ON customer_otps(email, purpose);
CREATE INDEX IF NOT EXISTS idx_otps_expires ON customer_otps(expires_at);

-- Link orders to customers (NULL = guest order)
-- customer_email already exists; only add customer_id (customer_name also exists)
ALTER TABLE orders ADD COLUMN customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);