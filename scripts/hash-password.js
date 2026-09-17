// Script สำหรับสร้าง SHA-256 hash (ใช้เมื่อต้องการเปลี่ยนรหัสผ่าน admin)
// SHA-256(salt+password) — เร็วมากใน Cloudflare Workers (<1ms vs 60-100ms ของ bcrypt)
// Format: sha256$<saltHex>$<hashHex>
// วิธีใช้: node scripts/hash-password.js "your-new-password"
const crypto = require('crypto');

const password = process.argv[2];
if (!password) {
  console.error('กรุณาระบุรหัสผ่าน: node scripts/hash-password.js "your-password"');
  process.exit(1);
}

const salt = crypto.randomBytes(16);
const derived = crypto.createHash('sha256').update(salt).update(password).digest();
const hash = `sha256$${salt.toString('hex')}$${derived.toString('hex')}`;

console.log('Password:', password);
console.log('Hash:', hash);
console.log('\nใช้คำสั่งนี้เพื่ออัพเดทใน D1:');
console.log(`wrangler d1 execute knkpart-db --remote --command="UPDATE admins SET password_hash='${hash}' WHERE username='admin'"`);