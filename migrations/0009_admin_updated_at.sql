-- Add updated_at to admins table for password change tracking
ALTER TABLE admins ADD COLUMN updated_at TEXT;
