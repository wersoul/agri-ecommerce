# 🚀 Production Deployment Guide - KNK Part

> **Project:** `knkpart` (Cloudflare Pages) ✅ DEPLOYED
> **Database:** `knkpart-db` (Cloudflare D1) ✅ CREATED
> **Primary URL:** https://knkpart.pages.dev ✅ LIVE
> **Custom Domain:** https://knkpart.com ✅ CONFIGURED
> **Status:** Production - ล้างข้อมูลเริ่มต้นแล้ว ✅ VERIFIED

---

## ✅ DEPLOYED - Verified Working

| Resource | Value |
|---|---|
| **Pages Project** | `knkpart` (id: `4712791e-9ff4-4b99-b632-6cad0d1f4250`) |
| **D1 Database** | `knkpart-db` (id: `34f14d8d-b16a-41c1-86b0-7426139ef5ea`) |
| **Region** | APAC |
| **Production URL (Cloudflare)** | https://knkpart.pages.dev |
| **Custom Domain** | https://knkpart.com |
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
| `/api/categories/` (public) | ✅ `{"categories":[...]}` (6 categories) |
| `/api/products/` (public) | ✅ 10 sample products + JOIN category_name |
| `/api/admin/categories/` POST | ✅ Category created successfully |
| D1 Tables | ✅ 9 tables: admins, categories, customers, customer_otps, order_items, orders, products, site_settings, subcategories |
| D1 Records | ✅ admins=1, site_settings=12, categories=6, products=10 |

---

## 🔐 Admin Credentials (CHANGE AFTER FIRST LOGIN)

```
URL:      https://knkpart.com/admin/login
          (หรือ https://knkpart.pages.dev/admin/login)
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
npx wrangler d1 execute knkpart-db --remote --file=./migrations/0012_sample_products.sql
npx wrangler d1 execute knkpart-db --remote --file=./migrations/0013_cleanup_empty_skus.sql
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

### 7. ตั้ง Email (Resend — แนะนำ) — ดูหัวข้อ Email Setup ด้านล่าง
```bash
./setup-resend-secrets.sh
```

### 8. Build & Deploy
```bash
npm run build       # next build
npx next-on-pages   # แปลงเป็น Cloudflare Functions
npm run postbuild   # patch async_hooks (Node 26 fix - Patched 0 in this build)
CLOUDFLARE_ACCOUNT_ID="<account_id>" npx wrangler pages deploy .vercel/output/static --project-name=knkpart --branch=main
```

D1 binding จะถูก auto-configure จาก `wrangler.toml` ตอน deploy

---

## 📧 Email Setup — Resend (แนะนำ สำหรับ knkpart.com)

### 1. Verify domain knkpart.com ที่ Resend
1. สมัคร/ล็อกอิน https://resend.com
2. ไป https://resend.com/domains → "Add Domain" → ใส่ `knkpart.com`
3. Resend จะแสดง DNS records ที่ต้องเพิ่มใน Cloudflare DNS (ตั้งค่า Proxy = **DNS only** เพราะ MX/CNAME บางตัวห้าม proxy):

| Type | Name | Value |
|---|---|---|
| MX | `sending-domain.knkpart.com` (ตามที่ Resend บอก) | `feedback-smtp.us-east-1.amazonses.com` priority 10 |
| TXT | `resend._domainkey.knkpart.com` (ตามที่ Resend บอก) | `v=DKIM1; k=rsa; p=MIGf...` (record ที่ Resend ส่งมา) |
| TXT | `@` หรือ `knkpart.com` | `v=spf1 include:amazonses.com ~all` (SPF) |

หลังเพิ่ม DNS records → กด "Verify" ใน Resend (ใช้เวลาสูงสุด 72 ชม. แต่ปกติไม่กี่นาที)

### 2. สร้าง API Key
ไป https://resend.com/api-keys → "Create API Key" → Permission: **Sending access** → ก๊อป `re_xxxxxxxxxxxx`

### 3. ตั้ง Cloudflare secret
```bash
./setup-resend-secrets.sh
# แล้ววาง API Key ตอนถูกถาม
```

หรือตั้งเอง:
```bash
echo -n "resend" | npx wrangler pages secret put EMAIL_PROVIDER --project-name=knkpart
echo -n "KNK Part <noreply@knkpart.com>" | npx wrangler pages secret put EMAIL_FROM --project-name=knkpart
echo -n "re_xxxxxxxxxxxx" | npx wrangler pages secret put EMAIL_API_KEY --project-name=knkpart
```

### 4. ทดสอบส่ง email (ต้อง login admin ก่อน)
```bash
# Login ก่อนเพื่อเอา token
TOKEN=$(curl -sX POST https://knkpart.com/api/admin/login/ \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"KnkAdmin2026!"}' | jq -r .token)

# ทดสอบส่ง
curl -X POST https://knkpart.com/api/admin/test-email/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"to":"your-email@example.com"}'
```

ถ้าสำเร็จ → ดู activity ที่ https://resend.com/emails

---

## 📧 Email Setup — Gmail (ทางเลือก)

```bash
node scripts/get-gmail-token.js   # สร้าง OAuth refresh token
./setup-gmail-secrets.sh          # ตั้ง secrets 5 ตัว
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
- [x] ตั้ง custom domain knkpart.com ✅
- [x] ตั้ง email provider (Resend แนะนำ)
- [x] Run migration 0013 (แก้ SKU UNIQUE constraint)

---

## 📞 ติดต่อ

- **GitHub:** https://github.com/wersoul/agri-ecommerce
- **Production URL:** https://knkpart.com
- **Cloudflare URL:** https://knkpart.pages.dev