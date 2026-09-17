// Script สำหรับสร้าง PBKDF2 hash (ใช้เมื่อต้องการเปลี่ยนรหัสผ่าน admin)
// PBKDF2 ผ่าน Web Crypto API — เร็วใน Cloudflare Workers (<5ms vs 60-100ms ของ bcrypt)
// วิธีใช้: node scripts/hash-password.js "your-new-password"
const crypto = require('crypto');

const PBKDF2_ITERATIONS = 100_000;
const PBKDF2_KEYLEN = 32;

const password = process.argv[2];
if (!password) {
  console.error('กรุณาระบุรหัสผ่าน: node scripts/hash-password.js "your-password"');
  process.exit(1);
}

const salt = crypto.randomBytes(16);
const derived = crypto.pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, PBKDF2_KEYLEN, 'sha256');
const hash = `pbkdf2$${PBKDF2_ITERATIONS}$${salt.toString('hex')}$${derived.toString('hex')}`;

console.log('Password:', password);
console.log('Hash:', hash);
console.log('\nใช้คำสั่งนี้เพื่ออัพเดทใน D1:');
console.log(`wrangler d1 execute knkpart-db --remote --command="UPDATE admins SET password_hash='${hash}' WHERE username='admin'"`);