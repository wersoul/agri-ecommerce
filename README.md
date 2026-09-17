# 🌾 AgriParts - ร้านอะไหล่เกษตร E-Commerce

เว็บไซต์ขายอะไหล่เกษตรและอุปกรณ์การเกษตร พร้อมระบบหลังบ้านจัดการสินค้า/หมวดหมู่/คำสั่งซื้อ

## ✨ ฟีเจอร์

### หน้าบ้าน (ลูกค้า)
- 🏠 หน้าแรกแสดงหมวดหมู่และสินค้าแนะนำ
- 🛍️ หน้าสินค้าทั้งหมด พร้อมตัวกรองตามหมวดหมู่และค้นหา
- 📄 หน้ารายละเอียดสินค้า
- 🛒 ตะกร้าสินค้า (เก็บใน LocalStorage)
- 💳 หน้าชำระเงิน/สั่งซื้อ
- ✅ หน้ายืนยันคำสั่งซื้อสำเร็จ
- 📱 Responsive รองรับมือถือ

### หลังบ้าน (Admin)
- 🔐 ระบบ Login (JWT)
- 📊 แดชบอร์ดสรุปสถิติ
- 📦 จัดการสินค้า (CRUD)
- 🏷️ จัดการหมวดหมู่ (CRUD)
- 📋 จัดการคำสั่งซื้อ + อัพเดทสถานะ

## 🛠️ เทคโนโลยี

- **Frontend:** Next.js 14 (App Router) + TypeScript
- **Styling:** Tailwind CSS
- **Database:** Cloudflare D1 (SQLite)
- **Hosting:** Cloudflare Pages
- **Auth:** JWT (jose library)
- **Password:** bcryptjs

## 📦 โครงสร้างโปรเจกต์

```
agri-ecommerce/
├── src/
│   ├── app/              # Next.js App Router
│   │   ├── page.tsx      # หน้าแรก
│   │   ├── products/     # รายการสินค้า
│   │   ├── product/[id]/ # รายละเอียดสินค้า
│   │   ├── cart/         # ตะกร้า
│   │   ├── checkout/     # ชำระเงิน
│   │   ├── admin/        # หลังบ้าน
│   │   └── api/          # API Routes
│   ├── components/       # React Components
│   └── lib/              # Auth, DB, Types, Cart helpers
├── migrations/           # D1 Database Migrations
├── public/               # Static files
├── wrangler.toml         # Cloudflare config
├── next.config.js
├── tailwind.config.ts
└── package.json
```

## 🚀 การติดตั้งและ Deploy

### Prerequisites
- Node.js 18+
- Cloudflare Account
- Wrangler CLI (`npm install -g wrangler`)

### 1. ติดตั้ง Dependencies

```bash
cd agri-ecommerce
npm install
```

### 2. Login Cloudflare

```bash
wrangler login
```

### 3. สร้าง D1 Database

```bash
wrangler d1 create agri-ecommerce-db
```

คัดลอก `database_id` ที่ได้ไปใส่ใน `wrangler.toml`:
```toml
[[d1_databases]]
binding = "DB"
database_name = "agri-ecommerce-db"
database_id = "xxxx-xxxx-xxxx"  # ใส่ ID ที่นี่
```

### 4. รัน Migrations (Local)

```bash
npm run db:local
npm run db:seed:local
```

### 5. รัน Migrations (Production)

```bash
npm run db:remote
npm run db:seed:remote
```

### 6. Deploy ไปยัง Cloudflare Pages

```bash
npm run deploy
```

หรือผ่าน Cloudflare Dashboard:
1. ไปที่ https://dash.cloudflare.com/
2. Pages > Create a project > Connect to Git
3. Build command: `npm run build`
4. Build output directory: `.vercel/output/static`
5. เพิ่ม D1 binding: Variable name = `DB`, D1 Database = `agri-ecommerce-db`

## 🔑 การเข้าสู่ระบบ Admin

- URL: `/admin/login`
- Username: `admin`
- Password: `NewAdmin789` *(เปลี่ยนทันที!)*

**⚠️ ควรเปลี่ยนรหัสผ่านทันทีหลัง Deploy!**

### วิธีเปลี่ยนรหัสผ่าน Admin (ผ่าน UI)

1. Login แล้วไปที่ `/admin/change-password`
2. กรอกรหัสเดิม + รหัสใหม่ (≥ 6 ตัว)

API endpoint: `POST /api/admin/change-password` body `{ current_password, new_password }`

### วิธีเปลี่ยนรหัสผ่าน Admin (ผ่าน CLI)

```bash
# 1. สร้าง hash ใหม่ด้วย Node.js (rounds=8 เพื่อให้เข้ากับ Workers CPU limit)
node -e "console.log(require('bcryptjs').hashSync('รหัสผ่านใหม่', 8))"

# 2. อัพเดทในฐานข้อมูล
wrangler d1 execute agri-ecommerce-db --remote --command="UPDATE admins SET password_hash = 'HASH_ใหม่' WHERE username = 'admin'"
```

### เปลี่ยนรหัสผ่านสมาชิก (Customer)

1. Login ที่ `/login` แล้วไปที่ `/account/change-password`
2. API: `POST /api/customer/change-password` body `{ current_password, new_password }`

## 📦 Subcategories (ประเภทย่อย)

หมวดหมู่หลัก → ประเภทย่อย (2 ระดับ)

- Admin UI: `/admin/subcategories`
- API: `/api/admin/subcategories` (GET/POST), `/api/admin/subcategories/[id]` (PUT/DELETE)
- Public API: `/api/subcategories?category_id=...` หรือ `?category=<slug>`
- Schema: `migrations/0010_subcategories.sql`

## 📥 Bulk Upload (เพิ่มสินค้าจำนวนมาก)

UI: `/admin/products/bulk-upload` — อัปโหลดหลายรูป กรอกชื่อ+ประเภท+ราคา (ไม่บังคับ) → 1 รูป = 1 สินค้า

API: `POST /api/admin/products/bulk` body:
```json
{ "items": [ { "name": "...", "image_url": "https://...", "category_id": 7, "subcategory_id": 1, "price": 250, "stock": 10 } ] }
```

Upload endpoint: `POST /api/admin/upload` (multipart/form-data field=file) → returns `{ url }` เป็น data URL

## ✉️ Email (Order Notification)

ระบบจะส่งอีเมลแจ้งแอดมินทุกคน (ในตาราง `admins` ที่มี email) เมื่อมี order ใหม่ผ่าน Resend/SendGrid/Mailgun

ตั้งค่า secrets:
```bash
wrangler pages secret put EMAIL_API_KEY --project-name=agri-ecommerce
wrangler pages secret put EMAIL_PROVIDER --project-name=agri-ecommerce  # 'resend' (default) | 'sendgrid' | 'mailgun'
wrangler pages secret put EMAIL_FROM --project-name=agri-ecommerce      # 'KNK Part <noreply@knkpart.com>'
```

## 🔐 Environment Variables (Optional)

สร้าง secret สำหรับ JWT:

```bash
wrangler pages secret put JWT_SECRET --project-name=agri-ecommerce
```

## 📝 หมายเหตุ

- รูปภาพใช้ URL จาก CDN ภายนอก (เช่น Unsplash) สามารถเปลี่ยนเป็น Cloudflare R2 ในภายหลังได้
- ระบบชำระเงินจะเก็บคำสั่งซื้อในฐานข้อมูล สถานะเริ่มต้น "รอดำเนินการ" ให้แอดมินยืนยันทางโทรศัพท์
- Cart เก็บใน LocalStorage ฝั่ง Client (จะหายเมื่อ Clear browser data)

## 🩹 Required Patches (Cloudflare Edge + Node 26)

Next.js 14.2 webpack generates `require("async_hooks")` (without `node:` prefix)
which esbuild 0.15 (bundled with `@cloudflare/next-on-pages@1.10.x`) cannot resolve on
Node.js v26+. The project includes a patch at
`node_modules/@cloudflare/next-on-pages/dist/index.js` (around line 13404) that walks
`.vercel/output/functions/**/*.js` after Vercel CLI finishes and rewrites
`require("async_hooks")` → `require("node:async_hooks")`.

When you run `npm install` again, this patch will be lost. To make it permanent:

1. Save the patch via `npx patch-package @cloudflare/next-on-pages` (creates `patches/`)
2. Add `"postinstall": "patch-package"` to `package.json` scripts
3. Commit `patches/` to your repo

Alternatively, downgrade Node to 20.x LTS where this issue does not occur.

## 📄 License

MIT