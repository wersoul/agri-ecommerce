# 🚀 Production Deployment Guide - KNK Part

> **Project:** `knkpart` (Cloudflare Pages) ✅ DEPLOYED
> **Database:** `knkpart-db` (Cloudflare D1) ✅ CREATED
> **URL:** https://knkpart.pages.dev ✅ LIVE
> **Status:** Production - ล้างข้อมูลเริ่มต้นแล้ว ✅ VERIFIED

---

## ✅ DEPLOYED - Verified Working

| Resource | Value |
|---|---|
| **Pages Project** | `knkpart` (id: `4712791e-9ff4-4b99-b632-6cad0d1f4250`) |
| **D1 Database** | `knkpart-db` (id: `34f14d8d-b16a-41c1-86b0-7426139ef5ea`) |
| **Region** | APAC |
| **Production URL** | https://knkpart.pages.dev |
| **Latest Deployment** | https://b35147c5.knkpart.pages.dev |
| **Deployed At** | 2026-09-17 |
| **D1 Binding** | `DB` → `34f14d8d-b16a-41c1-86b0-7426139ef5ea` (auto-configured) |
| **JWT_SECRET** | ✅ Configured (random 96 hex chars) |
| **Admin User** | `admin` / `KnkAdmin2026!` |

---

## ✅ Live Verification

| Check | Result |
|---|---|
| Home page (https://knkpart.pages.dev/) | ✅ 200 OK, Title: "KNK Part (เคเอ็นเค พาร์ท)" |
| Admin login API (`POST /api/admin/login/`) | ✅ 200 OK, JWT token returned |
| `/api/categories/` (public) | ✅ `{"categories":[]}` |
| `/api/products/` (public) | ✅ `{"products":[]}` |
| `/api/admin/categories/` POST | ✅ Category created successfully |
| D1 Tables | ✅ 9 tables: admins, categories, customers, customer_otps, order_items, orders, products, site_settings, subcategories |
| D1 Records | ✅ admins=1, site_settings=12, **all product/customer tables = 0** |

---

## 🔐 Admin Credentials (CHANGE AFTER FIRST LOGIN)

```
URL:      https://knkpart.pages.dev/admin/login
Username: admin
Password: KnkAdmin2026!
Email:    admin@knkpart.com
```

⚠️ **สำคัญ:** เปลี่ยนรหัสผ่านทันทีหลัง login ครั้งแรก ผ่านหน้า "Change Password"

---

## 📋 ขั้นตอน Deploy ที่ใช้ (สำหรับอ้างอิง)

### 1. สร้าง D1 Database
```bash
npx wrangler d1 create knkpart-db
# → ได้ database_id: 34f14d8d-b16a-41c1-86b0-7426139ef5ea
```

### 2. อัพเดท `wrangler.toml`
```toml
[[d1_databases]]
binding = "DB"
database_name = "knkpart-db"
database_id = "34f14d8d-b16a-41c1-86b0-7426139ef5ea"
```

### 3. สร้าง Pages Project
```bash
CLOUDFLARE_ACCOUNT_ID="<account_id>" npx wrangler pages project create knkpart --production-branch=main
```

### 4. รัน Migrations (Production)
```bash
npx wrangler d1 execute knkpart-db --remote --file=./migrations/0001_initial.sql
npx wrangler d1 execute knkpart-db --remote --file=./migrations/0005_site_settings.sql
npx wrangler d1 execute knkpart-db --remote --file=./migrations/0008_customers.sql
npx wrangler d1 execute knkpart-db --remote --file=./migrations/0009_admin_updated_at.sql
npx wrangler d1 execute knkpart-db --remote --file=./migrations/0010_subcategories.sql
npx wrangler d1 execute knkpart-db --remote --file=./migrations/0011_member_extra.sql
```

### 5. สร้าง Admin User
```bash
# ใช้ bcryptjs hash (rounds=8 เพื่อ performance ใน Workers):
node -e "console.log(require('bcryptjs').hashSync('KnkAdmin2026!', 8))"
# → $2a$08$GDCdfuQvadrBzfRdcdyVduB39RDL.g0G7F.q3jqlSRXWzkZsBXpXG

# INSERT into admins (รหัสผ่าน hash อยู่แล้ว):
npx wrangler d1 execute knkpart-db --remote --command="INSERT INTO admins (username, password_hash, email) VALUES ('admin', '\$2a\$08\$GDCdfuQvadrBzfRdcdyVduB39RDL.g0G7F.q3jqlSRXWzkZsBXpXG', 'admin@knkpart.com')"
```

### 6. ตั้ง JWT_SECRET
```bash
JWT=$(node -e "console.log(require('crypto').randomBytes(48).toString('hex'))")
CLOUDFLARE_ACCOUNT_ID="<account_id>" npx wrangler pages secret put JWT_SECRET --project-name=knkpart <<< "$JWT"
```

### 7. Build & Deploy
```bash
npm run build       # next build
npx next-on-pages   # แปลงเป็น Cloudflare Functions
npm run postbuild   # patch async_hooks (Node 26 fix - Patched 0 in this build)
CLOUDFLARE_ACCOUNT_ID="<account_id>" npx wrangler pages deploy .vercel/output/static --project-name=knkpart --branch=main
```

D1 binding จะถูก auto-configure จาก `wrangler.toml` ตอน deploy

---

## 📧 Email Setup (Optional - สำหรับ Order Notifications)

### Resend (แนะนำ)
```bash
npx wrangler pages secret put EMAIL_API_KEY --project-name=knkpart
npx wrangler pages secret put EMAIL_PROVIDER --project-name=knkpart  # พิมพ์: resend
npx wrangler pages secret put EMAIL_FROM --project-name=knkpart      # พิมพ์: KNK Part <noreply@yourdomain.com>
```

### Gmail
```bash
node scripts/get-gmail-token.js
```

---

## 🔧 Environment Variables ที่ใช้ในการ Deploy

| Var | Value | Notes |
|---|---|---|
| `CLOUDFLARE_ACCOUNT_ID` | `8dcf38404b9ad65e2466814fdc392e16` | Account "Ping105@gmail.com's Account" |
| `CLOUDFLARE_API_TOKEN` | (ว่าง) | ใช้ OAuth session ของ wrangler แทน |

---

## 🔐 Security Checklist

- [ ] เปลี่ยน admin password ทันทีหลัง first login
- [x] ตั้ง `JWT_SECRET` ที่แข็งแรง (random 96 hex chars)
- [ ] เปิด 2FA บน Cloudflare account
- [ ] ตั้ง custom domain (optional)
- [ ] ตั้ง email provider สำหรับ order notifications

---

## 📞 ติดต่อ

- **GitHub:** https://github.com/wersoul/agri-ecommerce
- **Production URL:** https://knkpart.pages.dev
- **Latest Deployment URL:** https://b35147c5.knkpart.pages.dev