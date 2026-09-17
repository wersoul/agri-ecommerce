// Script สำหรับสร้าง bcrypt hash (ใช้เมื่อต้องการเปลี่ยนรหัสผ่าน admin)
// วิธีใช้: node scripts/hash-password.js "your-new-password"
const bcrypt = require('bcryptjs');

const password = process.argv[2];
if (!password) {
  console.error('กรุณาระบุรหัสผ่าน: node scripts/hash-password.js "your-password"');
  process.exit(1);
}

const hash = bcrypt.hashSync(password, 10);
console.log('Password:', password);
console.log('Hash:', hash);
console.log('\nใช้คำสั่งนี้เพื่ออัพเดทใน D1:');
console.log(`wrangler d1 execute agri-ecommerce-db --remote --command="UPDATE admins SET password_hash='${hash}' WHERE username='admin'"`);