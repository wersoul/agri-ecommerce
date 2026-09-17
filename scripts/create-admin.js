#!/usr/bin/env node
// Script สำหรับสร้าง Admin user บน Cloudflare D1
// วิธีใช้:
//   node scripts/create-admin.js <username> <password> [email] [--remote]
// ตัวอย่าง:
//   node scripts/create-admin.js admin admin123 admin@example.com
//   node scripts/create-admin.js admin admin123 admin@example.com --remote

const bcrypt = require('bcryptjs');
const { execSync } = require('child_process');

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
const hash = bcrypt.hashSync(password, 10);
const flag = remote ? '--remote' : '--local';

console.log(`\n🔐 กำลังสร้าง Admin user (${remote ? 'REMOTE' : 'LOCAL'})\n`);
console.log('Username:', username);
console.log('Email:', emailValue);
console.log('Password:', password);
console.log('');

// SQL command - ลบ user เดิม (ถ้ามี) แล้วเพิ่มใหม่
const sql = `DELETE FROM admins WHERE username='${username}'; INSERT INTO admins (username, password_hash, email) VALUES ('${username}', '${hash}', '${emailValue}');`;

try {
  execSync(`npx wrangler d1 execute agri-ecommerce-db ${flag} --command="${sql}"`, {
    stdio: 'inherit',
  });
  console.log(`\n✅ เพิ่ม Admin สำเร็จ (${remote ? 'REMOTE' : 'LOCAL'})`);
  console.log(`   Login ได้ที่ /admin/login ด้วย ${username} / ${password}`);
} catch (err) {
  console.error(`\n❌ เกิดข้อผิดพลาด:`, err.message);
  console.log('\n💡 ตรวจสอบ:');
  console.log('   1. ติดตั้ง wrangler: npm install -g wrangler');
  console.log('   2. Login cloudflare: wrangler login');
  console.log('   3. สร้าง D1 database: wrangler d1 create agri-ecommerce-db');
  console.log('   4. ใส่ database_id ใน wrangler.toml');
  console.log('   5. รัน migration: npm run db:local (หรือ db:remote)');
  process.exit(1);
}