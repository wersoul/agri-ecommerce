#!/usr/bin/env node
// Script สำหรับสร้าง Admin user บน Cloudflare D1
// ใช้ PBKDF2 (Web Crypto API compatible) — เร็วใน Cloudflare Workers (<5ms)
// วิธีใช้:
//   node scripts/create-admin.js <username> <password> [email] [--remote]
// ตัวอย่าง:
//   node scripts/create-admin.js admin admin123 admin@example.com
//   node scripts/create-admin.js admin admin123 admin@example.com --remote

const crypto = require('crypto');
const { execSync } = require('child_process');

const PBKDF2_ITERATIONS = 100_000;
const PBKDF2_KEYLEN = 32;

function pbkdf2Hash(password) {
  const salt = crypto.randomBytes(16);
  const hash = crypto.pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, PBKDF2_KEYLEN, 'sha256');
  return `pbkdf2$${PBKDF2_ITERATIONS}$${salt.toString('hex')}$${hash.toString('hex')}`;
}

const args = process.argv.slice(2);
const remote = args.includes('--remote');
const filtered = args.filter(a => a !== '--remote');
const [username, password, email] = filtered;

if (!username || !password) {
  console.error('❌ กรุณาระบุ username และ password');
  console.error('   วิธีใช้: node scripts/create-admin.js <username> <password> [email] [--remote]');
  console.error('   ตัวอย่าง (local):  node scripts/create-admin.js admin admin123 admin@example.com');
  console.error('   ตัวอย่าง (remote): node scripts/create-admin.js admin admin123 admin@example.com --remote');
  process.exit(1);
}

const emailValue = email || `${username}@agri-shop.com`;
const hash = pbkdf2Hash(password);
const flag = remote ? '--remote' : '--local';

console.log(`\n🔐 กำลังสร้าง Admin user (${remote ? 'REMOTE' : 'LOCAL'})\n`);
console.log('Username:', username);
console.log('Email:', emailValue);
console.log('Password:', password);
console.log('Hash:', hash);
console.log('');

// SQL command - ลบ user เดิม (ถ้ามี) แล้วเพิ่มใหม่
const sql = `DELETE FROM admins WHERE username='${username}'; INSERT INTO admins (username, password_hash, email) VALUES ('${username}', '${hash}', '${emailValue}');`;

try {
  execSync(`npx wrangler d1 execute knkpart-db ${flag} --command="${sql}"`, {
    stdio: 'inherit',
  });
  console.log(`\n✅ เพิ่ม Admin สำเร็จ (${remote ? 'REMOTE' : 'LOCAL'})`);
  console.log(`   Login ได้ที่ /admin/login ด้วย ${username} / ${password}`);
} catch (err) {
  console.error(`\n❌ เกิดข้อผิดพลาด:`, err.message);
  console.log('\n💡 ตรวจสอบ:');
  console.log('   1. ติดตั้ง wrangler: npm install -g wrangler');
  console.log('   2. Login cloudflare: wrangler login');
  console.log('   3. สร้าง D1 database: wrangler d1 create knkpart-db');
  console.log('   4. ใส่ database_id ใน wrangler.toml');
  console.log('   5. รัน migration: npm run db:local (หรือ db:remote)');
  process.exit(1);
}