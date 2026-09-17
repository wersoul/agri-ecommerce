# 🚀 Production Deployment Guide - KNK Part

> **Project:** `knkpart` (Cloudflare Pages)
> **Database:** `knkpart-db` (Cloudflare D1)
> **URL:** https://knkpart.pages.dev
> **Status:** Production - ล้างข้อมูลเริ่มต้นแล้ว

---

## ⚠️ สิ่งที่ต้องทำก่อน Deploy

### 1. Login Cloudflare

```bash
npx wrangler login
```

หรือใช้ API Token:
```bash
export CLOUDFLARE_API_TOKEN="your-cloudflare-api-token"
# ต้องมี permission: Pages: Edit, D1: Edit, Account Settings: Read
```

### 2. สร้าง D1 Database ใหม่

```bash
npx wrangler d1 create knkpart-db
```

จะได้ `database_id` กลับมา เช่น:
```
✅ Successfully created DB 'knkpart-db' in region APAC
database_id = "abcd1234-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

### 3. ใส่ `database_id` ใน wrangler.toml

แก้ไขไฟล์ `/Users/xzibits/.cline/data/workspaces/chat/agri-ecommerce/wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "knkpart-db"
database_id = "abcd1234-xxxx-xxxx-xxxx-xxxxxxxxxxxx"  # 👈 ใส่ ID ที่ได้
```

### 4. สร้าง Cloudflare Pages Project

```bash
npx wrangler pages project create knkpart --production-branch=main --compatibility-date=2024-07-01 --compatibility-flag=nodejs_compat
```

### 5. ผูก D1 binding กับ Pages project

ผ่าน Dashboard: https://dash.cloudflare.com → Pages → `knkpart` → Settings → Functions → D1 database bindings
- Variable name: `DB`
- D1 Database: `knkpart-db`

---

## 📋 ขั้นตอน Deploy

### 1. รัน Migrations (Production)

```bash
cd /Users/xzibits/.cline/data/workspaces/chat/agri-ecommerce
npm run db:remote
```

ไฟล์ที่จะรัน (เป็น schema เท่านั้น - ไม่มี seed data):
- `0001_initial.sql` - ตาราง categories, products, admins, orders, order_items
- `0005_site_settings.sql` - ตาราง site_settings (มี default `shop_name=KNK Part`)
- `0008_customers.sql` - ตาราง customers + customer_otps
- `0009_admin_updated_at.sql`
- `0010_subcategories.sql`
- `0011_member_extra.sql`

ไฟล์เหล่านี้ถูก clear แล้ว (ไม่มี INSERT):
- `0002_seed.sql` (เคยมี categories 6 หมวด + products 16 ชิ้น - ลบแล้ว)
- `0003_knkpart.sql` (เคยมี categories 12 หมวด + products ~40 ชิ้น - ลบแล้ว)
- `0004_fix_images.sql`, `0006_update_product_images.sql`, `0007_update_category_images.sql` (UPDATE ที่ไม่มี target - ลบแล้ว)

### 2. สร้าง Admin User คนแรก

```bash
node scripts/create-admin.js admin <password> admin@knkpart.com --remote
```

ตัวอย่าง:
```bash
node scripts/create-admin.js admin "MyStrongPass#2026" admin@knkpart.com --remote
```

✅ หลัง deploy Admin สามารถ Login ได้ที่ https://knkpart.pages.dev/admin/login

### 3. ตั้ง JWT Secret (สำคัญสำหรับ Production)

```bash
npx wrangler pages secret put JWT_SECRET --project-name=knkpart
# paste secret (เช่น random 64-char hex)
```

### 4. ตั้งค่า Email (ถ้าต้องการแจ้งเตือน order)

```bash
# สำหรับ Resend
npx wrangler pages secret put EMAIL_API_KEY --project-name=knkpart
npx wrangler pages secret put EMAIL_PROVIDER --project-name=knkpart  # พิมพ์: resend
npx wrangler pages secret put EMAIL_FROM --project-name=knkpart      # พิมพ์: KNK Part <noreply@yourdomain.com>
```

หรือใช้ Gmail:
```bash
node scripts/get-gmail-token.js
```

### 5. Build และ Deploy

```bash
npm run deploy
```

หรือทีละขั้น:
```bash
npm run build      # next build
npx next-on-pages  # แปลงเป็น Cloudflare Functions
npm run postbuild  # patch async_hooks (Node 26 fix)
npx wrangler pages deploy .vercel/output/static --project-name=knkpart
```

---

## ✅ ตรวจสอบหลัง Deploy

1. **หน้าแรก**: https://knkpart.pages.dev
   - ควรเห็น hero "อะไหล่เกษตร อะไหล่เครื่องมือ เครื่องมือเกษตร"
   - **ไม่มีสินค้า/หมวดหมู่** ในหน้าแรก (เพราะล้าง seed data แล้ว)

2. **Admin Login**: https://knkpart.pages.dev/admin/login
   - Login ด้วย credentials ที่สร้างในขั้นตอนที่ 2

3. **ตรวจสอบ D1**:
   ```bash
   npx wrangler d1 execute knkpart-db --remote --command="SELECT name FROM sqlite_master WHERE type='table'"
   ```
   ควรเห็น: categories, products, admins, orders, order_items, customers, customer_otps, site_settings, subcategories

4. **ทดสอบสร้างหมวดหมู่/สินค้า**: ผ่าน Admin UI

---

## 🔐 Security Checklist

- [ ] เปลี่ยน admin password ทันทีหลัง first login
- [ ] ตั้ง `JWT_SECRET` ที่แข็งแรง (random 64+ chars)
- [ ] เปิด 2FA บน Cloudflare account
- [ ] ตั้ง custom domain (optional)
- [ ] ตั้ง email provider สำหรับ order notifications

---

## 📞 ติดต่อ

- **GitHub:** https://github.com/wersoul/agri-ecommerce
- **Production URL:** https://knkpart.pages.dev